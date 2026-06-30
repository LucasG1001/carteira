from __future__ import annotations

import unittest
from datetime import date, datetime, timezone
from types import SimpleNamespace

from src.modules.Expenses.services.expense_service import ExpenseService


def make_entry(**overrides) -> SimpleNamespace:
    base = dict(
        id=1,
        user_id="user-1",
        type="expense",
        amount=100.0,
        category="Alimentação",
        date=date.today(),
        description=None,
        payment_method=None,
        installments=1,
        is_recurring=False,
        recurrence=None,
        place=None,
        address=None,
        notes=None,
        tags=None,
        created_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
        updated_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
    )
    base.update(overrides)
    return SimpleNamespace(**base)


class FakeExpenseRepository:
    def __init__(self, entries):
        self.entries = entries

    async def get_all_by_user(self, user_id: str):
        return self.entries


class MonthContributionTests(unittest.TestCase):
    def test_single_entry_only_in_its_month(self) -> None:
        entry = make_entry(date=date(2026, 3, 10), amount=50.0)
        self.assertEqual(ExpenseService._month_contribution(entry, 2026, 3), 50.0)
        self.assertEqual(ExpenseService._month_contribution(entry, 2026, 4), 0.0)
        self.assertEqual(ExpenseService._month_contribution(entry, 2026, 2), 0.0)

    def test_installments_spread_across_n_months(self) -> None:
        entry = make_entry(date=date(2026, 1, 15), amount=300.0, installments=3)
        self.assertEqual(ExpenseService._month_contribution(entry, 2026, 1), 100.0)
        self.assertEqual(ExpenseService._month_contribution(entry, 2026, 2), 100.0)
        self.assertEqual(ExpenseService._month_contribution(entry, 2026, 3), 100.0)
        self.assertEqual(ExpenseService._month_contribution(entry, 2026, 4), 0.0)

    def test_installments_cross_year_boundary(self) -> None:
        entry = make_entry(date=date(2025, 12, 1), amount=200.0, installments=2)
        self.assertEqual(ExpenseService._month_contribution(entry, 2025, 12), 100.0)
        self.assertEqual(ExpenseService._month_contribution(entry, 2026, 1), 100.0)

    def test_recurring_monthly_every_month_after_start(self) -> None:
        entry = make_entry(date=date(2026, 1, 1), amount=80.0, is_recurring=True, recurrence="monthly")
        self.assertEqual(ExpenseService._month_contribution(entry, 2026, 1), 80.0)
        self.assertEqual(ExpenseService._month_contribution(entry, 2026, 7), 80.0)
        self.assertEqual(ExpenseService._month_contribution(entry, 2025, 12), 0.0)

    def test_recurring_yearly_only_anniversary_month(self) -> None:
        entry = make_entry(date=date(2025, 5, 1), amount=500.0, is_recurring=True, recurrence="yearly")
        self.assertEqual(ExpenseService._month_contribution(entry, 2026, 5), 500.0)
        self.assertEqual(ExpenseService._month_contribution(entry, 2026, 6), 0.0)


class SummaryTests(unittest.IsolatedAsyncioTestCase):
    async def test_current_month_totals_and_balance(self) -> None:
        today = date.today()
        entries = [
            make_entry(id=1, type="expense", amount=100.0, category="Alimentação", date=today),
            make_entry(id=2, type="income", amount=300.0, category="Salário", date=today),
            make_entry(id=3, type="expense", amount=120.0, category="Compras", date=today, installments=3),
        ]
        service = ExpenseService(session=None)
        service.repository = FakeExpenseRepository(entries)

        summary = await service.get_summary("user-1")

        self.assertEqual(summary.current_month, f"{today.year:04d}-{today.month:02d}")
        self.assertEqual(summary.month_income, 300.0)
        self.assertEqual(summary.month_expense, 140.0)  # 100 + 120/3
        self.assertEqual(summary.month_balance, 160.0)
        self.assertEqual(len(summary.entries), 3)
        self.assertEqual(len(summary.monthly), 12)
        categories = {item.category: item.total for item in summary.by_category}
        self.assertEqual(categories["Alimentação"], 100.0)
        self.assertEqual(categories["Compras"], 40.0)


if __name__ == "__main__":
    unittest.main()
