from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class MediaBase(BaseModel):
    description: Optional[str] = None
    tags_array: Optional[List[str]] = Field(default=None, description="List of tags")


class MediaCreate(MediaBase):
    pass


class MediaOut(MediaBase):
    id: int
    user_id: int
    file_url: str
    mime_type: Optional[str] = None
    original_name: Optional[str] = None
    size_bytes: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MediaStats(BaseModel):
    user_id: int
    media_count: int
    total_bytes: int

