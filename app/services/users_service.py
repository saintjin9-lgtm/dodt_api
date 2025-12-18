from app.repositories.users_repository import UserRepository
from fastapi import Depends, HTTPException
import asyncpg
from typing import List, Dict, Any, Optional
from app.auth.password_util import hash_password, verify_password

class UserService:
    def __init__(self, user_repo: UserRepository = Depends()):
        self.user_repo = user_repo

    async def get_or_create_user(self, conn: asyncpg.Connection, email: str, name: str, picture: str):
        """For Google OAuth: Finds a user or creates them if they don't exist."""
        user = await self.user_repo.get_user_by_email(conn, email)
        if not user:
            user = await self.user_repo.create_user(conn, email=email, name=name, picture=picture, role="MEMBER", hashed_password=None)
        return user

    async def register_new_user(self, conn: asyncpg.Connection, email: str, password: str, name: str) -> Dict[str, Any]:
        """Registers a new user with an email and password."""
        existing_user = await self.user_repo.get_user_by_email(conn, email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_pass = hash_password(password)
        
        # For email signups, we can use a generic or generated profile picture
        default_picture = f"https://api.multiavatar.com/{email}.png"

        new_user = await self.user_repo.create_user(
            conn, 
            email=email,
            name=name,
            picture=default_picture,
            role="MEMBER", 
            hashed_password=hashed_pass
        )
        return new_user

    async def authenticate_user(self, conn: asyncpg.Connection, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticates a user by email and password."""
        user = await self.user_repo.get_user_by_email(conn, email)
        if not user:
            return None
        
        if not user["hashed_password"] or not verify_password(password, user["hashed_password"]):
            return None
            
        return user

    async def get_user_creations(self, conn: asyncpg.Connection, user_id: int) -> List[Dict[str, Any]]:
        """Retrieves all creations for a specific user."""
        return await self.user_repo.get_creations_by_user_id(conn, user_id)
    
    async def get_all_users(self, conn: asyncpg.Connection) -> List[Dict[str, Any]]:
        """Retrieves all users, excluding sensitive data."""
        users = await self.user_repo.get_all_users(conn)
        # Exclude hashed_password explicitly if the repo method didn't already
        # (repo method already excludes it in select statement)
        return users

    async def get_user_by_id(self, conn: asyncpg.Connection, user_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a single user by ID, excluding sensitive data."""
        user = await self.user_repo.get_user_by_id(conn, user_id)
        # Exclude hashed_password explicitly if the repo method didn't already
        return user