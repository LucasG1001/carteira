from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.modules.Portfolio.models.transaction_model import Transaction

class TransactionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_by_user(self, user_id: str) -> list[Transaction]:
        # Ordering by date then id guarantees chronologic calculation
        stmt = select(Transaction).where(Transaction.user_id == user_id).order_by(Transaction.date.asc(), Transaction.id.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_ticker(self, user_id: str, ticker: str) -> list[Transaction]:
        stmt = select(Transaction).where(Transaction.user_id == user_id, Transaction.ticker == ticker).order_by(Transaction.date.asc(), Transaction.id.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
