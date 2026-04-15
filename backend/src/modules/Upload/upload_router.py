from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.core.security import get_current_user_id
from src.modules.Upload.schemas.upload_schema import UploadResponse
from src.modules.Upload.services.upload_service import UploadService

router = APIRouter()

@router.post("/", response_model=UploadResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    service = UploadService(db)
    return await service.process_upload(file, user_id)

@router.get("s", response_model=list[UploadResponse])
async def list_uploads(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    service = UploadService(db)
    return await service.list_uploads(user_id)

@router.delete("s/{upload_id}", status_code=204)
async def delete_upload(
    upload_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    service = UploadService(db)
    await service.delete_upload(upload_id, user_id)
