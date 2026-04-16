from __future__ import annotations

import unittest
from datetime import date, datetime, timezone

from src.modules.MarketData.models.market_data_model import StockPrice
from src.modules.Portfolio.models.transaction_model import Transaction
from src.modules.Portfolio.services.portfolio_service import PortfolioService


class FakeTransactionRepository:
    def __init__(self, transactions: list[Transaction], latest_prices: dict[str, StockPrice]):
        self.transactions = transactions
        self.latest_prices = latest_prices

    async def get_all_by_user(self, user_id: str) -> list[Transaction]:
        return self.transactions

    async def get_by_ticker(self, user_id: str, ticker: str) -> list[Transaction]:
        return [transaction for transaction in self.transactions if transaction.ticker == ticker]

    async def get_latest_prices_by_tickers(self, tickers: list[str]) -> dict[str, StockPrice]:
        return {ticker: price for ticker, price in self.latest_prices.items() if ticker in tickers}


class PortfolioServiceTests(unittest.IsolatedAsyncioTestCase):
    def _transaction(
        self,
        *,
        ticker: str,
        operation_type: str,
        tx_date: date,
        quantity: float,
        unit_price: float | None = None,
        operation_value: float | None = None,
    ) -> Transaction:
        transaction = Transaction()
        transaction.id = 1
        transaction.upload_id = 1
        transaction.user_id = "user-1"
        transaction.ticker = ticker
        transaction.operation_type = operation_type
        transaction.date = tx_date
        transaction.quantity = quantity
        transaction.unit_price = unit_price
        transaction.operation_value = operation_value
        return transaction

    def _price(self, ticker: str, close: float) -> StockPrice:
        price = StockPrice()
        price.ticker = ticker
        price.date = date(2026, 4, 16)
        price.open = 11.0
        price.high = 12.5
        price.low = 10.8
        price.close = close
        price.volume = 1000
        price.created_at = datetime(2026, 4, 16, 15, 0, tzinfo=timezone.utc)
        return price

    async def test_portfolio_summary_includes_market_metrics(self) -> None:
        transactions = [
            self._transaction(ticker="PETR4", operation_type="compra", tx_date=date(2026, 1, 10), quantity=10, unit_price=10.0, operation_value=100.0),
            self._transaction(ticker="PETR4", operation_type="dividendo", tx_date=date(2026, 2, 15), quantity=0, operation_value=5.0),
        ]
        service = PortfolioService(session=None)
        service.repository = FakeTransactionRepository(
            transactions=transactions,
            latest_prices={"PETR4.SA": self._price("PETR4.SA", 12.0)},
        )

        summary = await service.get_portfolio_summary("user-1")

        self.assertEqual(summary.general_total_invested, 100.0)
        self.assertEqual(summary.general_total_dividends, 5.0)
        self.assertEqual(summary.general_current_value, 120.0)
        self.assertEqual(summary.general_variation_value, 20.0)
        self.assertEqual(summary.general_profitability_value, 25.0)
        self.assertEqual(summary.general_dividend_yield_percent, 5.0)
        self.assertEqual(summary.assets[0].variation_percent, 20.0)
        self.assertEqual(summary.assets[0].profitability_percent, 25.0)
        self.assertEqual(summary.assets[0].dividend_yield_percent, 5.0)

    async def test_asset_detail_uses_matching_market_ticker(self) -> None:
        transactions = [
            self._transaction(ticker="VALE3", operation_type="compra", tx_date=date(2026, 1, 10), quantity=5, unit_price=20.0, operation_value=100.0),
        ]
        service = PortfolioService(session=None)
        service.repository = FakeTransactionRepository(
            transactions=transactions,
            latest_prices={"VALE3.SA": self._price("VALE3.SA", 25.0)},
        )

        detail = await service.get_asset_details("user-1", "VALE3")

        self.assertEqual(detail.current_price, 25.0)
        self.assertEqual(detail.current_value, 125.0)
        self.assertEqual(detail.variation_value, 25.0)
        self.assertEqual(detail.profitability_value, 25.0)
        self.assertEqual(detail.dividend_yield_percent, 0.0)
        self.assertEqual(len(detail.history), 1)
