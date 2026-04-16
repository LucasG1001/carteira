from sqlalchemy import func, tuple_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.modules.MarketData.models.market_data_model import StockPrice
from src.modules.Portfolio.models.transaction_model import Transaction


class TransactionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_by_user(self, user_id: str) -> list[Transaction]:
        stmt = select(Transaction).where(Transaction.user_id == user_id).order_by(Transaction.date.asc(), Transaction.id.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_ticker(self, user_id: str, ticker: str) -> list[Transaction]:
        stmt = select(Transaction).where(Transaction.user_id == user_id, Transaction.ticker == ticker).order_by(Transaction.date.asc(), Transaction.id.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_latest_prices_by_tickers(self, tickers: list[str]) -> dict[str, StockPrice]:
        if not tickers:
            return {}

        latest_dates_subquery = (
            select(
                StockPrice.ticker.label("ticker"),
                func.max(StockPrice.date).label("max_date"),
            )
            .where(StockPrice.ticker.in_(tickers))
            .group_by(StockPrice.ticker)
            .subquery()
        )

        stmt = select(StockPrice).where(
            tuple_(StockPrice.ticker, StockPrice.date).in_(
                select(latest_dates_subquery.c.ticker, latest_dates_subquery.c.max_date)
            )
        )
        result = await self.session.execute(stmt)
        return {price.ticker: price for price in result.scalars().all()}
