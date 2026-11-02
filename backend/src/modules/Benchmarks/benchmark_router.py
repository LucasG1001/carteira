from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user_id
from src.modules.Benchmarks.schemas.benchmark_schema import BenchmarkMonth
from src.modules.Benchmarks.services.benchmark_service import BenchmarkService

router = APIRouter()


@router.get("/monthly", response_model=List[BenchmarkMonth])
async def get_monthly_benchmarks(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    service = BenchmarkService(db)
    return await service.get_monthly(user_id)
