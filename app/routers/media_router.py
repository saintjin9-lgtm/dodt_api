from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app import schemas
from app.dependencies.auth import get_current_user
from app.dependencies.db_connection import get_db_session
from app.services.media_service import MediaService

router = APIRouter(prefix="/api/media", tags=["media"])


@router.post("/upload", response_model=schemas.MediaOut)
async def upload_media(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # comma-separated
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session),
    service: MediaService = Depends(),
):
    tags_list: Optional[List[str]] = None
    if tags:
        tags_list = [t.strip() for t in tags.split(',') if t.strip()]

    created = await service.save_media(
        db,
        user_id=int(current_user["sub"]),
        file=file,
        description=description,
        tags=tags_list,
    )
    return created


@router.get("/me", response_model=List[schemas.MediaOut])
async def list_my_media(
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session),
    service: MediaService = Depends(),
):
    return await service.list_my_media(db, int(current_user["sub"]), limit, offset)


@router.get("/me/stats", response_model=schemas.MediaStats)
async def my_media_stats(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session),
    service: MediaService = Depends(),
):
    return await service.get_my_stats(db, int(current_user["sub"]))


@router.get("/{media_id}", response_model=schemas.MediaOut)
async def get_media(
    media_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session),
    service: MediaService = Depends(),
):
    media = await service.get_media(db, media_id)
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    if media["user_id"] != int(current_user["sub"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your media")
    return media


@router.delete("/{media_id}")
async def delete_media(
    media_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session),
    service: MediaService = Depends(),
):
    ok = await service.delete_media(db, media_id, int(current_user["sub"]))
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found or not owned")
    return {"deleted": True, "id": media_id}
