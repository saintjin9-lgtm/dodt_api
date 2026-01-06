import os
import uuid
from typing import List, Dict, Any, Optional

from fastapi import UploadFile, HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.repositories.media_repository import MediaRepository


class MediaService:
    def __init__(self, media_repo: MediaRepository = Depends()):
        self.media_repo = media_repo

    async def save_media(
        self,
        db: Session,
        user_id: int,
        file: UploadFile,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        upload_dir: str = "app/static/uploads",
    ) -> Dict[str, Any]:
        if not file:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

        os.makedirs(upload_dir, exist_ok=True)

        _, ext = os.path.splitext(file.filename or "")
        if not ext and file.content_type:
            mime_to_ext = {
                "image/png": ".png",
                "image/jpeg": ".jpg",
                "image/webp": ".webp",
                "video/mp4": ".mp4",
            }
            ext = mime_to_ext.get(file.content_type, "")
        if not ext:
            ext = ".bin"

        unique_name = f"{uuid.uuid4()}{ext}"
        disk_path = os.path.join(upload_dir, unique_name)
        public_url = f"/static/uploads/{unique_name}"

        try:
            content = await file.read()
            with open(disk_path, "wb") as f:
                f.write(content)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to save file: {e}")

        size_bytes = len(content)
        tags_array = tags if tags else None

        created = self.media_repo.create_media(
            db,
            user_id=user_id,
            file_url=public_url,
            mime_type=file.content_type,
            original_name=file.filename,
            size_bytes=size_bytes,
            description=description,
            tags_array=tags_array,
        )
        return created

    async def get_media(self, db: Session, media_id: int) -> Optional[Dict[str, Any]]:
        return self.media_repo.get_media_by_id(db, media_id)

    async def list_my_media(self, db: Session, user_id: int, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        return self.media_repo.list_user_media(db, user_id, limit, offset)

    async def get_my_stats(self, db: Session, user_id: int) -> Dict[str, Any]:
        return self.media_repo.get_media_stats_by_user(db, user_id)

    async def delete_media(self, db: Session, media_id: int, user_id: int) -> bool:
        return self.media_repo.delete_media(db, media_id, user_id)
