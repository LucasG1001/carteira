from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.core.security import get_current_user_id
from src.modules.Portfolio.schemas.portfolio_schema import (
    AssetDetailResponse,
    DividendEntry,
    ManualAssetCreateRequest,
    ManualAssetResponse,
    PortfolioSummary,
)
from typing import List
from src.modules.Portfolio.services.portfolio_service import PortfolioService

router = APIRouter()

@router.get("/", response_model=PortfolioSummary)
async def get_portfolio(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    service = PortfolioService(db)
    return await service.get_portfolio_summary(user_id)


@router.post("/manual", response_model=ManualAssetResponse, status_code=201)
async def create_manual_asset(
    payload: ManualAssetCreateRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    service = PortfolioService(db)
    return await service.create_manual_asset(user_id, payload)

@router.get("/dividends", response_model=List[DividendEntry])
async def get_dividends(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    service = PortfolioService(db)
    return await service.get_dividends(user_id)

@router.get("/{ticker}", response_model=AssetDetailResponse)
async def get_asset_details(
    ticker: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    service = PortfolioService(db)
    return await service.get_asset_details(user_id, ticker)
