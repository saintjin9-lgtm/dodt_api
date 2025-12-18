from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
from app.dependencies.auth import get_optional_user
from typing import Optional

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# @router.get("/")
# async def index(request: Request, user: Optional[dict] = Depends(get_optional_user)):
#     return templates.TemplateResponse("index.html", {"request": request, "user": user})

# @router.get("/dashboard")
# async def dashboard(request: Request, user: Optional[dict] = Depends(get_optional_user)):
#     return templates.TemplateResponse("dashboard.html", {"request": request, "user": user})

# @router.get("/create")
# async def create(request: Request, user: Optional[dict] = Depends(get_optional_user)):
#     return templates.TemplateResponse("create.html", {"request": request, "user": user})

# @router.get("/result/{task_id}")
# async def get_result_page(request: Request, task_id: str, user: Optional[dict] = Depends(get_optional_user)):
#     return templates.TemplateResponse("result.html", {"request": request, "task_id": task_id, "user": user})
