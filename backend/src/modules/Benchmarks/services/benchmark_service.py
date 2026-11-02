from __future__ import annotations

from datetime import date, timedelta
from typing import Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.date_utils import months_between
from src.modules.Benchmarks.repositories.benchmark_repository import BenchmarkRepository
from src.modules.Benchmarks.schemas.benchmark_schema import (
    CDI_SERIES,
    IBOV_TICKER,
    IPCA_SERIES,
    BenchmarkMonth,
)
from src.modules.MarketData.services.market_hours import get_market_datetime


class BenchmarkService:
    def __init__(self, session: AsyncSession):
        self.repository = BenchmarkRepository(session)

    async def get_monthly(self, user_id: str) -> List[BenchmarkMonth]:
        first_date = await self.repository.get_first_transaction_date(user_id)
        if first_date is None:
            return []

        today = get_market_datetime(settings.MARKET_DATA_TIMEZONE).date()
        start = first_date.replace(day=1)
        cdi = self.compound_by_month(await self.repository.get_rates(CDI_SERIES, start))
        ipca = {self._month_key(day): value for day, value in await self.repository.get_rates(IPCA_SERIES, start)}
        ibov = self.close_to_close_by_month(
            await self.repository.get_closes(IBOV_TICKER, start - timedelta(days=40))
        )

        return [
            BenchmarkMonth(
                month=month,
                cdi=self._round(cdi.get(month)),
                ipca=self._round(ipca.get(month)),
                ibov=self._round(ibov.get(month)),
            )
            for month in months_between(first_date, today)
        ]

    @classmethod
    def compound_by_month(cls, daily_rates: List[tuple[date, float]]) -> Dict[str, float]:
        factors: Dict[str, float] = {}
        for day, rate in daily_rates:
            key = cls._month_key(day)
            factors[key] = factors.get(key, 1.0) * (1 + rate / 100)
        return {key: (factor - 1) * 100 for key, factor in factors.items()}

    @classmethod
    def close_to_close_by_month(cls, closes: List[tuple[date, float]]) -> Dict[str, float]:
        last_close: Dict[str, float] = {}
        for day, close in closes:
            last_close[cls._month_key(day)] = close

        months = sorted(last_close)
        returns: Dict[str, float] = {}
        for previous, current in zip(months, months[1:]):
            if last_close[previous] > 0:
                returns[current] = (last_close[current] / last_close[previous] - 1) * 100
        return returns

    @staticmethod
    def _month_key(day: date) -> str:
        return day.strftime("%Y-%m")

    @staticmethod
    def _round(value: Optional[float]) -> Optional[float]:
        return None if value is None else round(value, 4)
