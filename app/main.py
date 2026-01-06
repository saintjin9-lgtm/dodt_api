from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.config.settings import settings
from app.middlewares.logging_middleware import LoggingMiddleware
from app.routers import auth_router, analysis_router, admin_router, user_router, creation_router
import os
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    upload_dir = settings.UPLOAD_DIRECTORY
    try:
        os.makedirs(upload_dir, exist_ok=True)
    except Exception:
        print(f"Warning: could not create upload directory '{upload_dir}'")
    print("Application started")
    try:
        yield
    finally:
        # shutdown
        print("Application shutdown")


app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION, lifespan=lifespan)

# Middleware
app.add_middleware(LoggingMiddleware)

# CORS Middleware
# In production, this should be restricted to your frontend's actual domain.
# For development, we allow common local development ports.
origins = [
    "http://localhost",
    "http://localhost:5173", # Vite default
    "http://localhost:3000", # Create React App default
]

# Allow specific origins if FRONTEND_ORIGIN env var is set (e.g., for production)
if os.getenv("FRONTEND_ORIGIN"):
    origins = [os.getenv("FRONTEND_ORIGIN")]

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"], # Allow all headers (e.g., Authorization header for JWT)
)


# Routers
app.include_router(auth_router.router)
app.include_router(analysis_router.router)
app.include_router(admin_router.router)
app.include_router(user_router.router)
app.include_router(creation_router.router)

# Static files for user uploads
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Static Files and Catch-all for SPA
react_assets_dir = os.path.join("react", "dist", "assets")
react_index = os.path.join("react", "dist", "index.html")

if os.path.isdir(react_assets_dir):
    app.mount("/assets", StaticFiles(directory=react_assets_dir), name="assets")
else:
    print(f"Warning: React assets directory '{react_assets_dir}' not found; skipping mount.")


@app.get("/{full_path:path}")
async def serve_react_app(request: Request, full_path: str):
    if os.path.isfile(react_index):
        return FileResponse(react_index)
    return JSONResponse(status_code=404, content={"detail": "react/dist/index.html not found on server"})

##