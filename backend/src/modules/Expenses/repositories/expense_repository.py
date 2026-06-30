from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.modules.Expenses.models.expense_model import Expense


class ExpenseRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, expense: Expense) -> Expense:
        self.session.add(expense)
        await self.session.flush()
        return expense

    async def get_all_by_user(self, user_id: str) -> list[Expense]:
        stmt = (
            select(Expense)
            .where(Expense.user_id == user_id)
            .order_by(Expense.date.desc(), Expense.id.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, expense_id: int, user_id: str) -> Expense | None:
        stmt = select(Expense).where(Expense.id == expense_id, Expense.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def delete(self, expense: Expense) -> None:
        await self.session.delete(expense)
        await self.session.flush()
