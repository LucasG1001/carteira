from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.modules.Expenses.models.budget_model import Budget
from src.modules.Expenses.models.expense_model import Expense


class ExpenseRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_budgets(self, user_id: str) -> list[Budget]:
        stmt = select(Budget).where(Budget.user_id == user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def upsert_budget(self, user_id: str, category: str, amount: float) -> Budget:
        stmt = select(Budget).where(Budget.user_id == user_id, Budget.category == category)
        result = await self.session.execute(stmt)
        budget = result.scalars().first()
        if budget:
            budget.amount = amount
        else:
            budget = Budget(user_id=user_id, category=category, amount=amount)
            self.session.add(budget)
        await self.session.flush()
        return budget

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
