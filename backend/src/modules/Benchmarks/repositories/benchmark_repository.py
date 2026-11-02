from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.Benchmarks.models.benchmark_model import BenchmarkRate
from src.modules.MarketData.models.market_data_model import StockPrice
from src.modules.Portfolio.models.transaction_model import Transaction


class BenchmarkRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_first_transaction_date(self, user_id: str) -> date | None:
        stmt = select(func.min(Transaction.date)).where(Transaction.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar()

    async def get_rates(self, series: str, start: date) -> list[tuple[date, float]]:
        stmt = (
            select(BenchmarkRate.date, BenchmarkRate.value)
            .where(BenchmarkRate.series == series, BenchmarkRate.date >= start)
            .order_by(BenchmarkRate.date)
        )
        result = await self.session.execute(stmt)
        return [(row.date, row.value) for row in result]

    async def get_closes(self, ticker: str, start: date) -> list[tuple[date, float]]:
        stmt = (
            select(StockPrice.date, StockPrice.close)
            .where(StockPrice.ticker == ticker, StockPrice.date >= start)
            .order_by(StockPrice.date)
        )
        result = await self.session.execute(stmt)
        return [(row.date, row.close) for row in result]
