from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime


@dataclass(slots=True)
class PriceRecord:
    ticker: str
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: int
    created_at: datetime


@dataclass(slots=True)
class TickerMarketData:
    ticker: str
    price: PriceRecord


@dataclass(slots=True)
class BatchPriceSnapshot:
    ticker: str
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: int


@dataclass(slots=True)
class TickerSyncResult:
    ticker: str
    success: bool
    price_date: date | None = None
    error: str | None = None
