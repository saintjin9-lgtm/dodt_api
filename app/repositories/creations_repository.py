import asyncpg
from typing import Dict, Any, List, Optional

class CreationsRepository:
    async def create_creation(
        self, 
        conn: asyncpg.Connection, 
        user_id: int, 
        media_url: str, 
        media_type: str, 
        prompt: str,
        gender: Optional[str] = None,
        age_group: Optional[str] = None,
        is_public: bool = True,
        analysis_text: Optional[str] = None,
        recommendation_text: Optional[str] = None,
        tags_array: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Inserts a new creation record into the database with extended metadata.
        """
        query = """
            INSERT INTO creations (user_id, media_url, media_type, prompt, gender, age_group, is_public, analysis_text, recommendation_text, tags_array)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, user_id, media_url, media_type, prompt, gender, age_group, is_public, is_picked_by_admin, likes_count, created_at, analysis_text, recommendation_text, tags_array
        """
        new_creation = await conn.fetchrow(
            query, user_id, media_url, media_type, prompt, gender, age_group, is_public, analysis_text, recommendation_text, tags_array
        )
        return dict(new_creation)

    async def _select_all_creation_fields(self, conn: asyncpg.Connection, *, where_clause: Optional[str] = None, order_by_clause: str = "", limit: Optional[int] = None, offset: Optional[int] = None, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
        query_base = """
            SELECT c.id, c.user_id, c.media_url, c.media_type, c.prompt, c.gender, c.age_group, 
                   c.is_public, c.is_picked_by_admin, c.likes_count, c.created_at, 
                   c.analysis_text, c.recommendation_text, c.tags_array,
                   u.name as author_name, u.picture as author_picture
            FROM creations c
            JOIN users u ON c.user_id = u.id
        """
        query = query_base
        sql_params = params if params is not None else []

        if where_clause:
            query += f" WHERE {where_clause}"
        if order_by_clause:
            query += f" ORDER BY {order_by_clause}"
        if limit is not None:
            query += f" LIMIT {limit}"
        if offset is not None:
            query += f" OFFSET {offset}"
        
        creations = await conn.fetch(query, *sql_params)
        return [dict(row) for row in creations]


    async def get_creation_by_id(self, conn: asyncpg.Connection, creation_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single creation by its ID, including author details.
        """
        result = await self._select_all_creation_fields(conn, where_clause="c.id = $1", limit=1, params=[creation_id])
        return result[0] if result else None

    async def get_user_creations(self, conn: asyncpg.Connection, user_id: int, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Retrieves all creations for a specific user, with pagination.
        """
        return await self._select_all_creation_fields(
            conn, 
            where_clause="c.user_id = $1", 
            order_by_clause="c.created_at DESC", 
            limit=limit, 
            offset=offset, 
            params=[user_id]
        )

    async def get_feed_creations(self, conn: asyncpg.Connection, sort_by: str = "latest", limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Retrieves public creations for the feed, with sorting and pagination.
        Sort by 'latest' (created_at DESC) or 'popular' (likes_count DESC, created_at DESC).
        """
        order_clause = "c.created_at DESC"
        if sort_by == "popular":
            order_clause = "c.likes_count DESC, c.created_at DESC"
        
        return await self._select_all_creation_fields(
            conn, 
            where_clause="c.is_public = TRUE", 
            order_by_clause=order_clause, 
            limit=limit, 
            offset=offset
            # No params needed for this where_clause as it's a static condition
        )

    async def get_picked_creations(self, conn: asyncpg.Connection, limit: int = 9) -> List[Dict[str, Any]]:
        """
        Retrieves creations picked by admin for the home screen.
        """
        return await self._select_all_creation_fields(
            conn, 
            where_clause="c.is_picked_by_admin = TRUE", 
            order_by_clause="c.created_at DESC", # Order by latest picked, or created date
            limit=limit
        )

    async def increment_likes_count(self, conn: asyncpg.Connection, creation_id: int) -> Optional[Dict[str, Any]]:
        """Increments the likes_count for a creation."""
        query = "UPDATE creations SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count"
        result = await conn.fetchrow(query, creation_id)
        return dict(result) if result else None
    
    async def decrement_likes_count(self, conn: asyncpg.Connection, creation_id: int) -> Optional[Dict[str, Any]]:
        """Decrements the likes_count for a creation."""
        query = "UPDATE creations SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1 RETURNING likes_count"
        result = await conn.fetchrow(query, creation_id)
        return dict(result) if result else None

    async def toggle_admin_pick(self, conn: asyncpg.Connection, creation_id: int, is_picked: bool) -> Optional[Dict[str, Any]]:
        """Toggles the is_picked_by_admin flag for a creation."""
        query = "UPDATE creations SET is_picked_by_admin = $1 WHERE id = $2 RETURNING is_picked_by_admin"
        result = await conn.fetchrow(query, is_picked, creation_id)
        return dict(result) if result else None
    
    async def delete_creation_by_id(self, conn: asyncpg.Connection, creation_id: int) -> Optional[Dict[str, Any]]:
        """
        Deletes a creation by its ID and returns the deleted record.
        """
        query = "DELETE FROM creations WHERE id = $1 RETURNING *"
        deleted_creation = await conn.fetchrow(query, creation_id)
        return dict(deleted_creation) if deleted_creation else None

    async def add_like(self, conn: asyncpg.Connection, user_id: int, creation_id: int) -> bool:
        """Adds a like from a user to a creation. Returns True if liked, False if already liked."""
        try:
            await conn.execute("INSERT INTO likes (user_id, creation_id) VALUES ($1, $2)", user_id, creation_id)
            await self.increment_likes_count(conn, creation_id)
            return True
        except asyncpg.exceptions.UniqueViolationError:
            return False # Already liked

    async def remove_like(self, conn: asyncpg.Connection, user_id: int, creation_id: int) -> bool:
        """Removes a like from a user to a creation. Returns True if unliked, False if not liked."""
        result = await conn.execute("DELETE FROM likes WHERE user_id = $1 AND creation_id = $2", user_id, creation_id)
        if result == 'DELETE 1':
            await self.decrement_likes_count(conn, creation_id)
            return True
        return False # Not liked, or already unliked

    async def check_if_liked(self, conn: asyncpg.Connection, user_id: int, creation_id: int) -> bool:
        """Checks if a user has liked a specific creation."""
        query = "SELECT 1 FROM likes WHERE user_id = $1 AND creation_id = $2"
        return await conn.fetchval(query, user_id, creation_id) is not None