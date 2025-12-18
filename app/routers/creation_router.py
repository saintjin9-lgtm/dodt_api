from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks, Request, status
from fastapi.responses import RedirectResponse
from app.services.creations_service import CreationsService
from app.dependencies.auth import get_current_user, get_current_admin, get_optional_user
from app.dependencies.db_connection import get_db_connection
from app.services import task_manager
import asyncpg
import httpx
import io
import base64
import traceback # Import traceback module
import json # Import json module
import os # Import os module for file operations
import uuid # Import uuid for unique filename generation
import re # Import re module for regex parsing
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api", tags=["creations"])

# --- Helper function to convert base64 to a Blob-like object ---
def b64_to_blob(b64_data: str, content_type: str = ''):
    byte_characters = base64.b64decode(b64_data)
    return io.BytesIO(byte_characters)

# --- Helper function to extract analysis data from Gemini text ---
def _extract_analysis_data(text_part: str) -> Dict[str, Any]:
    analysis = "nothing"
    recommendation = "nothing"
    tags: List[str] = []

    if text_part:
        # Regex to extract Analysis section - more flexible with newlines/spaces
        analysis_match = re.search(r'**Analysis:**[\s]*(.*?)(?=\s*\n\n**Recommendation:**|\s*\n\n**Tags:**|$)', text_part, re.DOTALL | re.IGNORECASE)
        if analysis_match and analysis_match.group(1) and analysis_match.group(1).strip():
            analysis = analysis_match.group(1).strip()

        # Regex to extract Recommendation section - more flexible with newlines/spaces
        recommendation_match = re.search(r'**Recommendation:**[\s]*(.*?)(?=\s*\n\n**Tags:**|$)', text_part, re.DOTALL | re.IGNORECASE)
        if recommendation_match and recommendation_match.group(1) and recommendation_match.group(1).strip():
            recommendation = recommendation_match.group(1).strip()

        # Regex to extract Tags section - more flexible with newlines/spaces
        tags_match = re.search(r'**Tags:**[\s]*(.*)', text_part, re.DOTALL | re.IGNORECASE)
        if tags_match and tags_match.group(1) and tags_match.group(1).strip():
            # Split by #, filter out empty strings, and trim each tag
            tags = [tag.strip() for tag in tags_match.group(1).split('#') if tag.strip()]

    return {
        "analysis_text": analysis,
        "recommendation_text": recommendation,
        "tags_array": tags
    }


# --- Background Task Logic ---
async def process_creation_task(
    task_id: str,
    form_data: dict,
    user_id: int,
    service: CreationsService,
    db_conn_str: str  # Pass connection string instead of connection object
):
    task_manager.update_task_status(task_id, status="processing")
    
    # Recreate a connection for the background task
    conn = None
    try:
        conn = await asyncpg.connect(db_conn_str)
        
        # Initialize data and files dictionaries for httpx
        httpx_data = {}
        httpx_files = {}

        # Extract gender, age_group, is_public from form_data for save_creation
        prompt = form_data.get("prompt", "N/A")
        gender = form_data.pop("gender", None)
        age_group = form_data.pop("age_group", None)
        is_public = form_data.pop("is_public", True) # Default to True

        # Add gender and age_group to the data to be sent to the webhook
        if gender:
            httpx_data['gender'] = gender
        if age_group:
            httpx_data['age_group'] = age_group
        
        # Add image content_type to httpx_data if image is present
        if 'image' in form_data and form_data['image']:
            httpx_data['content_type'] = form_data['image']['content_type']

        for key, value in form_data.items():
            if key == 'image' and value:
                # For image, prepare it for 'files' parameter
                httpx_files['image'] = (value['filename'], io.BytesIO(value['content']), value['content_type'])
            elif value:
                # For other fields, add to 'data' parameter
                httpx_data[key] = str(value)

        # Call n8n webhook
        # webhook_url = 'http://n8n.nemone.store/webhook/c6ebe062-d352-491d-8da3-a5fe2d3f6949'
        webhook_url = 'https://n8n.jhsol.shop/webhook/b89c411e-d419-46dc-ad19-dc78676a8d1d'
        
        
        print(f"DEBUG: Task {task_id} - Attempting httpx.post to n8n webhook: {webhook_url}")
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                n8n_response = await client.post(webhook_url, data=httpx_data, files=httpx_files)
                n8n_response.raise_for_status() # Raise HTTPStatusError for bad responses (4xx or 5xx) 
                
                # Capture raw response text for debugging JSONDecodeError
                n8n_response_text = n8n_response.text
                print(f"DEBUG: Task {task_id} - N8N raw response text (first 500 chars): {n8n_response_text[:500]}...")

                try:
                    result = n8n_response.json()
                except json.JSONDecodeError as jde:
                    print(f"ERROR: Task {task_id} - JSONDecodeError from n8n webhook: {jde}")
                    print(f"ERROR: Task {task_id} - Raw N8N response text was: {n8n_response_text}")
                    raise HTTPException(status_code=500, detail=f"N8N webhook returned non-JSON response. Error: {jde}. Raw response: {n8n_response_text[:100]}...")
                
                print(f"DEBUG: Task {task_id} - N8N webhook call successful.")

            except httpx.RequestError as e:
                print(f"ERROR: Task {task_id} - httpx.RequestError during n8n call: {e}")
                raise HTTPException(status_code=500, detail=f"N8N webhook request failed: {e}")
            except httpx.HTTPStatusError as e:
                print(f"ERROR: Task {task_id} - httpx.HTTPStatusError from n8n: {e.response.status_code} - {e.response.text}")
                raise HTTPException(status_code=e.response.status_code, detail=f"N8N webhook returned error: {e.response.text}")
        

        # Process result from n8n (assuming base64 format)
        # n8n output wraps the actual JSON in an array and a "json" field.
        # However, httpx.response.json() might already extract the inner object if it's the only one.
        # So, we'll try to directly access 'candidates' from 'result'.
        # If 'result' is still an array, this will fail, and we might need to adjust.
        inline_data_part = result.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        inline_data_found = None
        for part in inline_data_part:
            if "inlineData" in part:
                inline_data_found = part.get("inlineData")
                break
        
        if not inline_data_found:
            raise ValueError("Invalid response structure from n8n webhook: inlineData not found")

        mime_type = inline_data_found["mimeType"]
        media_data_b64 = inline_data_found["data"]
        
        # Convert base64 to file-like object
        media_blob = b64_to_blob(media_data_b64, mime_type)
        file_extension = '.' + mime_type.split('/')[-1]
        
        # --- File Saving Logic (centralized for debugging) ---
        # NOTE: This file saving logic is now within process_creation_task,
        # and CreationsService.save_creation will be simplified to just save metadata.
        upload_dir = "app/static/uploads"
        os.makedirs(upload_dir, exist_ok=True) # Ensure directory exists
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path_on_disk = os.path.join(upload_dir, unique_filename)
        media_url_for_db = f"/static/uploads/{unique_filename}"

        print(f"DEBUG: Task {task_id} - Attempting to save file to: {file_path_on_disk}")
        try:
            with open(file_path_on_disk, "wb") as buffer:
                buffer.write(media_blob.getvalue()) # Use getvalue() for BytesIO
            print(f"DEBUG: Task {task_id} - File saved successfully to {file_path_on_disk}")
        except Exception as file_save_e:
            print(f"ERROR: Task {task_id} - Failed to save file {file_path_on_disk}: {file_save_e}")
            raise HTTPException(status_code=500, detail=f"Failed to save generated image to disk: {file_save_e}")
        # --- End File Saving Logic ---

        # Extract analysis data from the Gemini text response
        gemini_text_output = result.get("candidates", [{}])[0].get("content", {}).get("parts", [])[0].get("text", "")
        extracted_data = _extract_analysis_data(gemini_text_output)

        # Save the creation metadata to our database using the media_url
        new_creation = await service.creations_repo.create_creation( # Directly use repo for simplicity here
            conn, 
            user_id, 
            media_url_for_db, # Use the directly saved URL
            'image', # Fixed media_type for now, assuming image from webhook
            prompt, 
            gender=gender,
            age_group=age_group,
            is_public=is_public,
            analysis_text=extracted_data["analysis_text"],
            recommendation_text=extracted_data["recommendation_text"],
            tags_array=extracted_data["tags_array"]
        )
        print(f"DEBUG: Task {task_id} - Creation metadata saved. New creation ID: {new_creation.get('id')}")
        
        task_manager.update_task_status(task_id, status="completed", result={
            "creation": new_creation,
            "n8n_response": result # Still include full n8n_response for raw debug if needed
        })
        print(f"DEBUG: Task {task_id} - Status updated to completed.")

    except Exception as e:
        error_traceback = traceback.format_exc() # Get full traceback
        print(f"ERROR: Task {task_id} failed with unhandled exception: {e}\nTraceback:\n{error_traceback}")
        task_manager.update_task_status(task_id, status="failed", result={"error": str(e), "traceback": error_traceback})
    finally:
        if conn:
            await conn.close()


@router.post("/create_task")
async def create_task(
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: dict = Depends(get_current_user),
    service: CreationsService = Depends(),
    # Form fields
    text: str = Form(...),
    gender: str = Form(""),
    age_group: str = Form(""),
    is_public: bool = Form(True), # Added is_public form field
    image: Optional[UploadFile] = File(None)
):
    task_id = task_manager.create_task()
    user_id = int(current_user["sub"])
    
    # Prepare form data for background task
    form_data = {
        "prompt": text, # Renamed from 'text' to 'prompt' to match service
        "gender": gender,
        "age_group": age_group,
        "is_public": is_public # Pass is_public
    }
    if image:
        form_data["image"] = {
            "content": await image.read(),
            "filename": image.filename,
            "content_type": image.content_type
        }

    # We need to pass the database connection string, not the connection itself
    from app.config.settings import settings
    db_connection_string = settings.DATABASE_URL
    
    background_tasks.add_task(
        process_creation_task, task_id, form_data, user_id, service, db_connection_string
    )
    
    # Return task ID immediately. Frontend will poll for status.
    return {"task_id": task_id}

@router.get("/task_status/{task_id}")
async def get_task_status(task_id: str):
    """
    Endpoint for the frontend to poll for the status of a task.
    """
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.get("/users/me/creations", response_model=List[Dict[str, Any]])
async def get_my_creations(
    current_user: dict = Depends(get_current_user),
    service: CreationsService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection),
    limit: int = 10,
    offset: int = 0
):
    """
    Returns a list of creations for the current logged-in user.
    """
    user_id = int(current_user["sub"])
    return await service.get_user_creations(conn, user_id, limit, offset)

@router.get("/creations/feed", response_model=List[Dict[str, Any]])
async def get_feed(
    service: CreationsService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection),
    sort_by: str = "latest", # 'latest' or 'popular'
    limit: int = 10,
    offset: int = 0,
    current_user: Optional[dict] = Depends(get_optional_user) # Optional for feed, to check if liked
):
    """
    Returns a list of all public creations for the feed, with sorting and pagination.
    """
    creations = await service.get_feed_creations(conn, sort_by, limit, offset)
    
    # If user is logged in, check if they liked each creation
    if current_user:
        user_id = int(current_user["sub"])
        for creation in creations:
            creation["is_liked"] = await service.check_if_liked(conn, creation["id"], user_id)
    
    return creations

@router.get("/creations/picked", response_model=List[Dict[str, Any]])
async def get_picked_creations_api(
    service: CreationsService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection),
    limit: int = 9 # As per user requirement
):
    """
    Returns a list of admin-picked creations for the home screen.
    """
    return await service.get_picked_creations(conn, limit)

@router.post("/creations/{creation_id}/like", status_code=status.HTTP_200_OK)
async def like_creation(
    creation_id: int,
    current_user: dict = Depends(get_current_user),
    service: CreationsService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Allows a logged-in user to like a creation.
    """
    user_id = int(current_user["sub"])
    liked = await service.like_creation(conn, creation_id, user_id)
    if not liked:
        raise HTTPException(status_code=409, detail="Creation already liked by this user")
    return {"message": "Creation liked successfully"}

@router.delete("/creations/{creation_id}/like", status_code=status.HTTP_200_OK)
async def unlike_creation(
    creation_id: int,
    current_user: dict = Depends(get_current_user),
    service: CreationsService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Allows a logged-in user to unlike a creation.
    """
    user_id = int(current_user["sub"])
    unliked = await service.unlike_creation(conn, creation_id, user_id)
    if not unliked:
        raise HTTPException(status_code=404, detail="Like not found for this user and creation")
    return {"message": "Creation unliked successfully"}

@router.post("/admin/creations/{creation_id}/pick", status_code=status.HTTP_200_OK)
async def toggle_creation_pick(
    creation_id: int,
    current_admin: dict = Depends(get_current_admin), # Ensures only admin can access
    service: CreationsService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Allows an admin to toggle the 'is_picked_by_admin' flag for a creation.
    """
    # current_admin is already validated by get_current_admin dependency
    updated_status = await service.toggle_admin_pick(conn, creation_id, int(current_admin["sub"]))
    return {"message": "Admin pick status toggled successfully", "is_picked_by_admin": updated_status["is_picked_by_admin"]}


@router.delete("/creations/{creation_id}", response_model=Optional[Dict[str, Any]])
async def delete_creation(
    creation_id: int,
    current_user: dict = Depends(get_current_user),
    service: CreationsService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Deletes a creation by its ID, ensuring the user is the owner.
    """
    user_id = int(current_user["sub"])
    deleted_creation = await service.delete_creation(conn, creation_id, user_id)
    return deleted_creation