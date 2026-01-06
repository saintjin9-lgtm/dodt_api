import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "AI Persona Customer Survey"
    PROJECT_VERSION: str = "0.9.0"
    
    POSTGRES_USER: str = os.getenv("POSTGRES_USER")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD")
    # Support either POSTGRES_SERVER or DB_HOST environment variable names
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER") or os.getenv("DB_HOST", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT", 5432)
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "tdd")
    DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Upload directory for user file uploads
    UPLOAD_DIRECTORY: str = os.getenv("UPLOAD_DIRECTORY", "app/static/files")

settings = Settings()
