import os
import httpx
from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel, EmailStr

from app.dependencies.db_connection import get_db_connection
from app.services.users_service import UserService
from app.auth.jwt_handler import create_access_token
import asyncpg

# All routes in this file will be prefixed with /auth
router = APIRouter(prefix="/auth", tags=["auth"])

# --- Pydantic Models for Request Bodies ---

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# --- Email/Password Authentication ---

@router.post("/register")
async def register_user(
    user_data: UserCreate, 
    user_service: UserService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    new_user = await user_service.register_new_user(
        conn,
        email=user_data.email,
        password=user_data.password,
        name=user_data.name
    )
    # Exclude password from the response
    user_dict = dict(new_user)
    del user_dict["hashed_password"]
    return JSONResponse(status_code=status.HTTP_201_CREATED, content=user_dict)

@router.post("/login")
async def login_user(
    form_data: UserLogin,
    user_service: UserService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    user = await user_service.authenticate_user(conn, email=form_data.email, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create JWT
    jwt_token = create_access_token({
        "sub": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "picture": user["picture"]
    })

    return {"access_token": jwt_token, "token_type": "bearer"}


# --- Google OAuth2 Authentication ---

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
FRONTEND_REDIRECT_URI = os.getenv("FRONTEND_REDIRECT_URI", "http://localhost:5173/") # Default for React dev server

@router.get("/login/google")
async def login_google():
    return RedirectResponse(
        f"https://accounts.google.com/o/oauth2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&scope=openid%20email%20profile&access_type=offline"
    )

@router.get("/rest/oauth2-credential/callback")
async def google_callback(code: str, request: Request, user_service: UserService = Depends(), conn: asyncpg.Connection = Depends(get_db_connection)):
    print("DEBUG: google_callback function entered - testing file update!")
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get token from Google")
        
        token_data = response.json()
        access_token = token_data.get("access_token")
        
        user_info_response = await client.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={"Authorization": f"Bearer {access_token}"})
        user_info = user_info_response.json()
        
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")
        
        user = await user_service.get_or_create_user(conn, email, name, picture)

        if not user or not user["id"]:
            raise HTTPException(
                status_code=500, 
                detail="Failed to retrieve or create user with a valid ID."
            )
        
        # Create JWT
        jwt_token = create_access_token({
            "sub": str(user["id"]),
            "email": user["email"],
            "role": user["role"],
            "name": user["name"],
            "picture": user["picture"]
        })
        
        # Instead of redirecting and setting cookie, return JSON response
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "access_token": jwt_token,
                "token_type": "bearer",
                "redirect_to": f"{FRONTEND_REDIRECT_URI}#access_token={jwt_token}" # Still provide redirect URL for client-side navigation
            }
        )
