from fastapi import APIRouter, Depends, Request
from fastapi.templating import Jinja2Templates
from app.dependencies.auth import get_current_user
from app.dependencies.db_connection import get_db_connection
from app.services.users_service import UserService
import asyncpg
from typing import List, Dict, Any

router = APIRouter(prefix="/users", tags=["users"])
templates = Jinja2Templates(directory="app/templates")

@router.get("/me", response_model=Dict[str, Any])
async def get_current_active_user(user: dict = Depends(get_current_user)):
    """
    Retrieves the details of the currently authenticated user.
    """
    return user


@router.get("/profile")
async def user_profile(request: Request, user: dict = Depends(get_current_user), conn: asyncpg.Connection = Depends(get_db_connection)):
    # Fetch analysis history
    history = await conn.fetch("""
        SELECT * FROM analysis_results 
        WHERE user_id = $1 
        ORDER BY created_at DESC
    """, int(user["sub"]))
    
    return templates.TemplateResponse("profile.html", {
        "request": request,
        "user": user,
        "history": history
    })

@router.get("/creations", response_model=List[Dict[str, Any]])
async def get_user_creations(
    user: dict = Depends(get_current_user),
    user_service: UserService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Retrieves all creations for the currently authenticated user.
    """
    user_id = int(user["sub"])
    return await user_service.get_user_creations(conn, user_id)
