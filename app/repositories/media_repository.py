from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


class MediaRepository:
    def create_media(
        self,
        db: Session,
        user_id: int,
        file_url: str,
        mime_type: Optional[str],
        original_name: Optional[str],
        size_bytes: Optional[int],
        description: Optional[str] = None,
        tags_array: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        query = text(
            """
            INSERT INTO media_files (
                user_id, file_url, mime_type, original_name, size_bytes, description, tags_array
            ) VALUES (:user_id, :file_url, :mime_type, :original_name, :size_bytes, :description, :tags_array)
            RETURNING id, user_id, file_url, mime_type, original_name, size_bytes, description, tags_array, created_at
            """
        )
        row = db.execute(
            query,
            {
                "user_id": user_id,
                "file_url": file_url,
                "mime_type": mime_type,
                "original_name": original_name,
                "size_bytes": size_bytes,
                "description": description,
                "tags_array": tags_array,
            },
        ).one()
        db.commit()
        return dict(row._mapping)

    def get_media_by_id(self, db: Session, media_id: int) -> Optional[Dict[str, Any]]:
        query = text(
            """
            SELECT id, user_id, file_url, mime_type, original_name, size_bytes, description, tags_array, created_at
            FROM media_files
            WHERE id = :media_id
            """
        )
        row = db.execute(query, {"media_id": media_id}).one_or_none()
        return dict(row._mapping) if row else None

    def list_user_media(
        self,
        db: Session,
        user_id: int,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        query = text(
            """
            SELECT id, user_id, file_url, mime_type, original_name, size_bytes, description, tags_array, created_at
            FROM media_files
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
            """
        )
        rows = db.execute(query, {"user_id": user_id, "limit": limit, "offset": offset}).all()
        return [dict(r._mapping) for r in rows]

    def get_media_stats_by_user(self, db: Session, user_id: int) -> Dict[str, Any]:
        """
        Aggregated stats with correct GROUP BY (only grouped/aggregated columns selected).
        """
        query = text(
            """
            SELECT user_id,
                   COUNT(*) AS media_count,
                   COALESCE(SUM(size_bytes), 0) AS total_bytes
            FROM media_files
            WHERE user_id = :user_id
            GROUP BY user_id
            """
        )
        row = db.execute(query, {"user_id": user_id}).one_or_none()
        if not row:
            return {"user_id": user_id, "media_count": 0, "total_bytes": 0}
        return dict(row._mapping)

    def delete_media(self, db: Session, media_id: int, user_id: int) -> bool:
        query = text("DELETE FROM media_files WHERE id = :media_id AND user_id = :user_id")
        result = db.execute(query, {"media_id": media_id, "user_id": user_id})
        db.commit()
        return result.rowcount == 1
