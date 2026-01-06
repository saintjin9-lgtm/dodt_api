import os
import asyncpg
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.config.settings import settings

load_dotenv()

DATABASE_URL = settings.DATABASE_URL or os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def get_db_connection():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()

# Synchronous SQLAlchemy session provider
# Uses the same DATABASE_URL, keeping existing asyncpg connection for legacy code.
def get_db_session() -> Session:
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
