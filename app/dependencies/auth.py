from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from app.auth.jwt_handler import verify_token
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

async def get_optional_user(request: Request, token: Optional[str] = Depends(oauth2_scheme)):
    if not token:
        # Try to get from cookie
        cookie_token = request.cookies.get("access_token")
        if cookie_token:
            # Remove "Bearer " prefix if present
            if cookie_token.startswith("Bearer "):
                token = cookie_token.split(" ")[1]
            else:
                token = cookie_token
    
    if not token:
        return None

    payload = verify_token(token)
    return payload

async def get_current_user(user: Optional[dict] = Depends(get_optional_user)):
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )
    return user
