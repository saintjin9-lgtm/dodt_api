from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.services.analysis_service import AnalysisService
from app.dependencies.auth import get_current_user
from app.dependencies.db_connection import get_db_connection
import asyncpg

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    analysis_service: AnalysisService = Depends(),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")
    
    try:
        result = await analysis_service.process_csv(file, current_user, conn)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulate-message")
async def simulate_message(
    payload: dict,
    current_user: dict = Depends(get_current_user),
    analysis_service: AnalysisService = Depends()
):
    # payload: {"message": "...", "personas": [...]}
    return await analysis_service.simulate_message(payload["message"], payload["personas"])
