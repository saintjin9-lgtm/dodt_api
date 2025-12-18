from app.dependencies.db_connection import get_db_connection
from fastapi import Depends
import asyncpg
from typing import List, Dict, Any, Optional

class UserRepository:
    def __init__(self, db_pool=Depends(get_db_connection)):
        # In this simple setup, db_pool is actually a connection yielded by the dependency
        # But for better pattern, we might want to pass the connection directly to methods
        pass

    async def get_user_by_email(self, conn: asyncpg.Connection, email: str) -> Optional[Dict[str, Any]]:
        query = "SELECT id, email, name, picture, role, created_at, hashed_password FROM users WHERE email = $1"
        user = await conn.fetchrow(query, email)
        return dict(user) if user else None

    async def get_user_by_id(self, conn: asyncpg.Connection, user_id: int) -> Optional[Dict[str, Any]]:
        query = "SELECT id, email, name, picture, role, created_at FROM users WHERE id = $1"
        user = await conn.fetchrow(query, user_id)
        return dict(user) if user else None
    
    async def get_all_users(self, conn: asyncpg.Connection) -> List[Dict[str, Any]]:
        query = "SELECT id, email, name, picture, role, created_at FROM users ORDER BY created_at DESC"
        users = await conn.fetch(query)
        return [dict(user) for user in users]

    async def create_user(self, conn: asyncpg.Connection, email: str, name: str, picture: Optional[str] = None, role: str = "MEMBER", hashed_password: Optional[str] = None) -> Dict[str, Any]:
        query = """
            INSERT INTO users (email, name, picture, role, hashed_password)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, name, picture, role, created_at
        """
        return await conn.fetchrow(query, email, name, picture, role, hashed_password)

    async def get_creations_by_user_id(self, conn: asyncpg.Connection, user_id: int) -> List[Dict[str, Any]]:
        """
        Retrieves all creations for a specific user, ordered by the most recent.
        """
        query = """
            SELECT id, media_url, media_type, prompt, created_at
            FROM creations
            WHERE user_id = $1
            ORDER BY created_at DESC
        """
        creations = await conn.fetch(query, user_id)
        return [dict(row) for row in creations]