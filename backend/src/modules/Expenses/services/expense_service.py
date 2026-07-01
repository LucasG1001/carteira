from datetime import date
from typing import Dict, List

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import BusinessException
from src.modules.Expenses.models.expense_model import Expense
from src.modules.Expenses.repositories.expense_repository import ExpenseRepository
from src.modules.Expenses.schemas.expense_schema import (
    BudgetItem,
    CategoryTotal,
    ExpenseCreateRequest,
    ExpenseResponse,
    ExpenseSummaryResponse,
    ExpenseUpdateRequest,
    MonthlyExpensePoint,
)

SUMMARY_MONTHS = 12


class ExpenseService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = ExpenseRepository(session)

    async def create_expense(self, user_id: str, payload: ExpenseCreateRequest) -> ExpenseResponse:
        expense = Expense(
            user_id=user_id,
            type=payload.type,
            amount=round(payload.amount, 2),
            category=payload.category.strip(),
            subcategory=payload.subcategory or ("Outros" if payload.type == "expense" else None),
            date=payload.date,
            description=payload.description.strip() if payload.description else None,
            payment_method=payload.payment_method,
            installments=payload.installments,
            is_recurring=payload.is_recurring,
            recurrence=payload.recurrence,
            place=payload.place.strip() if payload.place else None,
            address=payload.address.strip() if payload.address else None,
            notes=payload.notes.strip() if payload.notes else None,
            tags=payload.tags.strip() if payload.tags else None,
        )
        expense = await self.repository.create(expense)
        await self.session.commit()
        await self.session.refresh(expense)
        return ExpenseResponse.model_validate(expense)

    async def update_expense(
        self, user_id: str, expense_id: int, payload: ExpenseUpdateRequest
    ) -> ExpenseResponse:
        expense = await self.repository.get_by_id(expense_id, user_id)
        if not expense:
            raise BusinessException(404, f"Lançamento {expense_id} não encontrado")

        data = payload.model_dump(exclude_unset=True)
        for field in ("type", "date", "installments", "is_recurring", "recurrence"):
            if field in data:
                setattr(expense, field, data[field])
        if "amount" in data:
            expense.amount = round(data["amount"], 2)
        for field in ("category", "subcategory", "description", "payment_method", "place", "address", "notes", "tags"):
            if field in data:
                value = data[field]
                setattr(expense, field, value.strip() if isinstance(value, str) else value)

        await self.session.commit()
        await self.session.refresh(expense)
        return ExpenseResponse.model_validate(expense)

    async def delete_expense(self, user_id: str, expense_id: int) -> None:
        expense = await self.repository.get_by_id(expense_id, user_id)
        if not expense:
            raise BusinessException(404, f"Lançamento {expense_id} não encontrado")
        await self.repository.delete(expense)
        await self.session.commit()

    async def get_summary(self, user_id: str) -> ExpenseSummaryResponse:
        entries = await self.repository.get_all_by_user(user_id)
        months = self._last_months(SUMMARY_MONTHS)
        current_month = months[-1]

        monthly: List[MonthlyExpensePoint] = []
        category_totals: Dict[str, float] = {}
        subcategory_totals: Dict[str, float] = {}
        month_category_totals: Dict[str, float] = {}

        for month_key in months:
            year, month = (int(part) for part in month_key.split("-"))
            income = 0.0
            expense = 0.0
            for entry in entries:
                value = self._month_contribution(entry, year, month)
                if value <= 0:
                    continue
                if entry.type == "income":
                    income += value
                else:
                    expense += value
                    category_totals[entry.category] = category_totals.get(entry.category, 0.0) + value
                    sub = entry.subcategory or "Outros"
                    subcategory_totals[sub] = subcategory_totals.get(sub, 0.0) + value
                    if month_key == current_month:
                        month_category_totals[entry.category] = (
                            month_category_totals.get(entry.category, 0.0) + value
                        )
            monthly.append(
                MonthlyExpensePoint(
                    month=month_key,
                    income=round(income, 2),
                    expense=round(expense, 2),
                    balance=round(income - expense, 2),
                )
            )

        current = monthly[-1]
        expense_months = [point.expense for point in monthly if point.expense > 0]
        income_months = [point.income for point in monthly if point.income > 0]
        avg_monthly_expense = round(sum(expense_months) / len(expense_months), 2) if expense_months else 0.0
        avg_monthly_income = round(sum(income_months) / len(income_months), 2) if income_months else 0.0

        budgets = await self.repository.get_budgets(user_id)

        by_category = sorted(
            (CategoryTotal(category=name, total=round(total, 2)) for name, total in category_totals.items()),
            key=lambda item: item.total,
            reverse=True,
        )
        by_subcategory = sorted(
            (CategoryTotal(category=name, total=round(total, 2)) for name, total in subcategory_totals.items()),
            key=lambda item: item.total,
            reverse=True,
        )
        month_by_category = sorted(
            (CategoryTotal(category=name, total=round(total, 2)) for name, total in month_category_totals.items()),
            key=lambda item: item.total,
            reverse=True,
        )

        return ExpenseSummaryResponse(
            user_id=user_id,
            entries=[ExpenseResponse.model_validate(entry) for entry in entries],
            current_month=current_month,
            month_income=current.income,
            month_expense=current.expense,
            month_balance=current.balance,
            avg_monthly_expense=avg_monthly_expense,
            avg_monthly_income=avg_monthly_income,
            monthly=monthly,
            by_category=by_category,
            by_subcategory=by_subcategory,
            month_by_category=month_by_category,
            budgets=[BudgetItem.model_validate(budget) for budget in budgets],
        )

    async def set_budget(self, user_id: str, category: str, amount: float) -> BudgetItem:
        budget = await self.repository.upsert_budget(user_id, category.strip(), round(amount, 2))
        await self.session.commit()
        await self.session.refresh(budget)
        return BudgetItem.model_validate(budget)

    @staticmethod
    def _last_months(count: int) -> List[str]:
        today = date.today()
        year, month = today.year, today.month
        months: List[str] = []
        for _ in range(count):
            months.append(f"{year:04d}-{month:02d}")
            month -= 1
            if month == 0:
                month = 12
                year -= 1
        months.reverse()
        return months

    @staticmethod
    def _month_contribution(entry, year: int, month: int) -> float:
        start = entry.date
        if (year, month) < (start.year, start.month):
            return 0.0

        amount = entry.amount or 0.0

        if entry.is_recurring:
            today = date.today()
            if (year, month) > (today.year, today.month):
                return 0.0
            recurrence = entry.recurrence or "monthly"
            if recurrence == "yearly":
                return amount if month == start.month else 0.0
            if recurrence == "weekly":
                return amount * 4
            return amount  # monthly

        installments = entry.installments or 1
        if installments > 1:
            months_diff = (year - start.year) * 12 + (month - start.month)
            if 0 <= months_diff < installments:
                return amount / installments
            return 0.0

        if year == start.year and month == start.month:
            return amount
        return 0.0
