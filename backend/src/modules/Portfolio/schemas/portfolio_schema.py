from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class TransactionDetail(BaseModel):
    id: int
    operation_type: str
    date: date
    quantity: float
    unit_price: Optional[float]
    operation_value: Optional[float]
    
    class Config:
        from_attributes = True

class AssetSummary(BaseModel):
    ticker: str
    asset_type: str
    total_quantity: float
    average_price: float
    total_invested: float
    total_dividends: float

class PortfolioSummary(BaseModel):
    user_id: str
    assets: List[AssetSummary]
    general_total_invested: float
    general_total_dividends: float

class AssetDetailResponse(AssetSummary):
    history: List[TransactionDetail]
