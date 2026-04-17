from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class TransactionDetail(BaseModel):
    id: int
    operation_type: str
    date: date
    quantity: float
    unit_price: Optional[float]
    operation_value: Optional[float]

    model_config = ConfigDict(from_attributes=True)


class ManualAssetCreateRequest(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)
    operation_type: Literal["Compra", "Venda"] = "Compra"
    date: date
    quantity: float = Field(gt=0)
    unit_price: float = Field(gt=0)


class ManualAssetResponse(BaseModel):
    id: int
    ticker: str
    operation_type: str
    entry_side: str
    date: date
    quantity: float
    unit_price: float
    operation_value: float

    model_config = ConfigDict(from_attributes=True)


class AssetSummary(BaseModel):
    ticker: str
    asset_type: str
    total_quantity: float
    average_price: float
    total_invested: float
    total_dividends: float
    price_date: Optional[date] = None
    price_updated_at: Optional[datetime] = None
    current_price: float = 0.0
    current_value: float = 0.0
    variation_value: float = 0.0
    variation_percent: float = 0.0
    profitability_value: float = 0.0
    profitability_percent: float = 0.0


class PortfolioSummary(BaseModel):
    user_id: str
    assets: List[AssetSummary]
    general_total_invested: float
    general_total_dividends: float
    general_current_value: float
    general_variation_value: float
    general_variation_percent: float
    general_profitability_value: float
    general_profitability_percent: float


class AssetDetailResponse(AssetSummary):
    history: List[TransactionDetail]
