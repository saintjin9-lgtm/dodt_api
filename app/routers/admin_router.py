from fastapi import APIRouter, Depends, Request, HTTPException, status
from app.dependencies.auth import get_current_admin
from app.dependencies.db_connection import get_db_connection
from app.services.users_service import UserService
from app.services.creations_service import CreationsService # Import CreationsService
import asyncpg
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[Dict[str, Any]])
async def get_all_users_admin(
    user_service: UserService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection),
    admin_user: dict = Depends(get_current_admin) # Ensures admin access
):
    """
    Retrieves all users for admin management.
    """
    users = await user_service.get_all_users(conn)
    return users

@router.get("/users/{user_id}", response_model=Optional[Dict[str, Any]])
async def get_user_by_id_admin(
    user_id: int,
    user_service: UserService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection),
    admin_user: dict = Depends(get_current_admin) # Ensures admin access
):
    """
    Retrieves a single user by ID for admin management.
    """
    user = await user_service.get_user_by_id(conn, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/creations/picked", response_model=List[Dict[str, Any]])
async def get_admin_picked_creations(
    creations_service: CreationsService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection),
    admin_user: dict = Depends(get_current_admin) # Ensures admin access
):
    """
    Retrieves all creations picked by admin for management.
    """
    # Use a higher limit for admin page if needed, or add pagination
    return await creations_service.get_picked_creations(conn, limit=100) 

@router.delete("/creations/{creation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_creation_admin(
    creation_id: int,
    creations_service: CreationsService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection),
    admin_user: dict = Depends(get_current_admin) # Ensures admin access
):
    """
    Allows an admin to delete any creation.
    """
    # Pass 0 or a placeholder user_id, as admin can delete anyone's creation
    # The service method will still perform existence check.
    deleted = await creations_service.delete_creation(conn, creation_id, user_id=int(admin_user["sub"]), is_admin=True)
    if not deleted:
        raise HTTPException(status_code=404, detail="Creation not found or already deleted")
    return {"message": "Creation deleted successfully"}

@router.get("/stats/users_count")
async def get_users_count_admin(
    conn: asyncpg.Connection = Depends(get_db_connection),
    admin_user: dict = Depends(get_current_admin) # Ensures admin access
):
    """
    Retrieves the total number of users.
    """
    users_count = await conn.fetchval("SELECT COUNT(*) FROM users")
    return {"users_count": users_count}