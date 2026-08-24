from __future__ import annotations

import unittest
from datetime import date

from src.core.exceptions import BusinessException
from src.modules.MarketData.models.market_data_model import TickerInfo
from src.modules.Portfolio.models.transaction_model import Transaction
from src.modules.Portfolio.services.portfolio_result_service import PortfolioResultService


def transaction(
    *,
    ticker: str,
    operation_type: str,
    tx_date: date,
    quantity: float = 0.0,
    unit_price: float | None = None,
    operation_value: float | None = None,
    entry_side: str | None = None,
) -> Transaction:
    entry = Transaction()
    entry.id = transaction.counter = getattr(transaction, "counter", 0) + 1
    entry.upload_id = 1
    entry.user_id = "user-1"
    entry.ticker = ticker
    entry.operation_type = operation_type
    entry.entry_side = entry_side
    entry.date = tx_date
    entry.quantity = quantity
    entry.unit_price = unit_price
    entry.operation_value = operation_value
    return entry


class FakeResultRepository:
    def __init__(
        self,
        transactions: list[Transaction],
        series: dict[str, list[tuple[date, float]]] | None = None,
        seeds: dict[str, tuple[date, float]] | None = None,
        sectors: dict[str, str] | None = None,
    ):
        self.transactions = transactions
        self.series = series or {}
        self.seeds = seeds or {}
        self.sectors = sectors or {}

    async def get_all_by_user(self, user_id: str) -> list[Transaction]:
        return sorted(self.transactions, key=lambda item: (item.date, item.id))

    async def get_price_series_by_tickers(
        self, tickers: list[str], start_date: date, end_date: date
    ) -> dict[str, list[tuple[date, float]]]:
        return {
            ticker: [row for row in rows if start_date <= row[0] <= end_date]
            for ticker, rows in self.series.items()
            if ticker in tickers
        }

    async def get_last_prices_before(
        self, tickers: list[str], reference_date: date
    ) -> dict[str, tuple[date, float]]:
        result: dict[str, tuple[date, float]] = {}
        for ticker in tickers:
            if ticker in self.seeds and self.seeds[ticker][0] <= reference_date:
                result[ticker] = self.seeds[ticker]
                continue
            earlier = [row for row in self.series.get(ticker, []) if row[0] <= reference_date]
            if earlier:
                result[ticker] = earlier[-1]
        return result

    async def get_price_dates_between(
        self, tickers: list[str], start_date: date, end_date: date
    ) -> list[date]:
        dates = {
            row[0]
            for ticker, rows in self.series.items()
            if ticker in tickers
            for row in rows
            if start_date <= row[0] <= end_date
        }
        return sorted(dates)

    async def get_first_price_date(self, tickers: list[str]) -> date | None:
        dates = [row[0] for ticker, rows in self.series.items() if ticker in tickers for row in rows]
        return min(dates) if dates else None

    async def get_ticker_infos_by_tickers(self, tickers: list[str]) -> dict[str, TickerInfo]:
        infos: dict[str, TickerInfo] = {}
        for ticker in tickers:
            if ticker not in self.sectors:
                continue
            info = TickerInfo()
            info.ticker = ticker
            info.sector = self.sectors[ticker]
            infos[ticker] = info
        return infos


def build_service(repository: FakeResultRepository) -> PortfolioResultService:
    service = PortfolioResultService(session=None)
    service.repository = repository
    return service


def daily_series(ticker: str, start: date, closes: list[float]) -> list[tuple[date, float]]:
    return [(date(start.year, start.month, start.day + index), close) for index, close in enumerate(closes)]


class PerformanceTests(unittest.IsolatedAsyncioTestCase):
    async def test_result_equals_sum_of_contributions(self) -> None:
        repository = FakeResultRepository(
            transactions=[
                transaction(ticker="PETR4", operation_type="Compra", tx_date=date(2026, 4, 6), quantity=100, unit_price=30.0, operation_value=3000.0),
                transaction(ticker="VALE3", operation_type="Compra", tx_date=date(2026, 4, 6), quantity=50, unit_price=60.0, operation_value=3000.0),
                transaction(ticker="HGLG11", operation_type="Compra", tx_date=date(2026, 4, 6), quantity=20, unit_price=150.0, operation_value=3000.0),
                transaction(ticker="HGLG11", operation_type="Rendimento", tx_date=date(2026, 5, 14), operation_value=24.0),
                transaction(ticker="VALE3", operation_type="Venda", tx_date=date(2026, 5, 20), quantity=20, unit_price=70.0, operation_value=1400.0),
                transaction(ticker="PETR4", operation_type="Compra", tx_date=date(2026, 5, 22), quantity=50, unit_price=32.0, operation_value=1600.0),
            ],
            series={
                "PETR4.SA": [(date(2026, 4, 30), 31.0), (date(2026, 5, 29), 33.0)],
                "VALE3.SA": [(date(2026, 4, 30), 62.0), (date(2026, 5, 29), 69.0)],
                "HGLG11.SA": [(date(2026, 4, 30), 148.0), (date(2026, 5, 29), 152.0)],
            },
        )

        response = await build_service(repository).get_performance("user-1")

        bucket = next(item for item in response.buckets if item.key == "2026-05")
        rows = [row for row in response.contributions if row.bucket == "2026-05"]
        self.assertLess(abs(bucket.value - sum(row.value for row in rows)), 0.02)
        self.assertNotEqual(bucket.value, 0.0)

    async def test_soma_dos_dias_bate_com_o_mes(self) -> None:
        repository = FakeResultRepository(
            transactions=[
                transaction(ticker="PETR4", operation_type="Compra", tx_date=date(2026, 4, 6), quantity=100, unit_price=30.0, operation_value=3000.0),
                transaction(ticker="PETR4", operation_type="Dividendo", tx_date=date(2026, 5, 12), operation_value=45.0),
                transaction(ticker="PETR4", operation_type="Compra", tx_date=date(2026, 5, 18), quantity=20, unit_price=34.0, operation_value=680.0),
            ],
            series={"PETR4.SA": [(date(2026, 4, 30), 31.0)] + daily_series("PETR4.SA", date(2026, 5, 11), [32.0, 31.5, 33.0, 34.5, 33.5, 35.0, 34.0, 36.0])},
        )
        service = build_service(repository)

        monthly = await service.get_performance("user-1")
        daily = await service.get_performance("user-1", granularity="day", month="2026-05")

        target = next(item.value for item in monthly.buckets if item.key == "2026-05")
        self.assertLess(abs(sum(item.value for item in daily.buckets) - target), 0.02)
        self.assertGreater(len(daily.buckets), 1)

    async def test_income_counts_toward_result(self) -> None:
        repository = FakeResultRepository(
            transactions=[
                transaction(ticker="HGLG11", operation_type="Compra", tx_date=date(2026, 4, 6), quantity=20, unit_price=150.0, operation_value=3000.0),
                transaction(ticker="HGLG11", operation_type="Rendimento", tx_date=date(2026, 5, 14), operation_value=24.0),
            ],
            series={"HGLG11.SA": [(date(2026, 4, 30), 150.0), (date(2026, 5, 29), 150.0)]},
        )

        response = await build_service(repository).get_performance("user-1")

        bucket = next(item for item in response.buckets if item.key == "2026-05")
        row = next(item for item in response.contributions if item.bucket == "2026-05")
        self.assertEqual(bucket.value, 24.0)
        self.assertEqual(row.dividend_value, 24.0)
        self.assertEqual(row.price_value, 0.0)

    async def test_contribution_ignores_flows(self) -> None:
        repository = FakeResultRepository(
            transactions=[
                transaction(ticker="PETR4", operation_type="Compra", tx_date=date(2026, 4, 6), quantity=100, unit_price=30.0, operation_value=3000.0),
                transaction(ticker="PETR4", operation_type="Compra", tx_date=date(2026, 5, 18), quantity=100, unit_price=30.0, operation_value=3000.0),
            ],
            series={"PETR4.SA": [(date(2026, 4, 30), 30.0), (date(2026, 5, 29), 30.0)]},
        )

        response = await build_service(repository).get_performance("user-1")

        bucket = next(item for item in response.buckets if item.key == "2026-05")
        self.assertEqual(bucket.net_flow, 3000.0)
        self.assertEqual(bucket.value, 0.0)

    async def test_asset_without_price_is_flat_while_held(self) -> None:
        repository = FakeResultRepository(
            transactions=[
                transaction(ticker="TESOURO SELIC 2029", operation_type="Aplicacao", tx_date=date(2026, 4, 6), quantity=1, unit_price=1000.0, operation_value=1000.0),
            ],
        )

        response = await build_service(repository).get_performance("user-1")

        bucket = next(item for item in response.buckets if item.key == "2026-05")
        self.assertEqual(bucket.value, 0.0)
        self.assertEqual(bucket.end_value, 1000.0)

    async def test_asset_without_price_never_moves_the_result(self) -> None:
        # A quantidade da renda fixa na B3 mistura unidades (1518 para R$1.518, mas 1 para
        # R$1.000), então o custo médio deriva. Sem cotação, contribuição é sempre zero.
        repository = FakeResultRepository(
            transactions=[
                transaction(ticker="CDB", operation_type="Compra / Venda", tx_date=date(2026, 4, 6), quantity=1518, unit_price=1.0, operation_value=1518.0, entry_side="Credito"),
                transaction(ticker="CDB", operation_type="Compra / Venda", tx_date=date(2026, 4, 8), quantity=1, unit_price=1000.0, operation_value=1000.0, entry_side="Credito"),
                transaction(ticker="CDB", operation_type="Resgate", tx_date=date(2026, 5, 20), quantity=1, unit_price=1080.0, operation_value=1080.0, entry_side="Debito"),
            ],
        )

        response = await build_service(repository).get_performance("user-1")

        bucket = next(item for item in response.buckets if item.key == "2026-05")
        self.assertEqual(bucket.value, 0.0)
        self.assertEqual([row for row in response.contributions if row.bucket == "2026-05" and row.value != 0], [])

    async def test_unpriced_asset_still_books_its_income(self) -> None:
        repository = FakeResultRepository(
            transactions=[
                transaction(ticker="TESOURO SELIC 2029", operation_type="Aplicacao", tx_date=date(2026, 4, 6), quantity=1, unit_price=1000.0, operation_value=1000.0),
                transaction(ticker="TESOURO SELIC 2029", operation_type="Juros", tx_date=date(2026, 5, 20), operation_value=32.0),
            ],
        )

        response = await build_service(repository).get_performance("user-1")

        bucket = next(item for item in response.buckets if item.key == "2026-05")
        row = next(item for item in response.contributions if item.bucket == "2026-05")
        self.assertEqual(bucket.value, 32.0)
        self.assertEqual(row.price_value, 0.0)
        self.assertFalse(row.priced)

    async def test_start_value_seeded_from_price_before_window(self) -> None:
        repository = FakeResultRepository(
            transactions=[],
            series={"PETR4.SA": [(date(2026, 5, 15), 20.0)]},
            seeds={"PETR4.SA": (date(2026, 4, 20), 15.0)},
        )
        service = build_service(repository)

        lookups = await service._load_prices(["PETR4.SA"], date(2026, 4, 30), date(2026, 5, 31))

        self.assertEqual(lookups["PETR4.SA"].close_on(date(2026, 4, 30)), 15.0)
        self.assertEqual(lookups["PETR4.SA"].close_on(date(2026, 5, 20)), 20.0)
        self.assertIsNone(lookups["PETR4.SA"].close_on(date(2026, 4, 10)))

    async def test_sector_comes_from_ticker_info(self) -> None:
        repository = FakeResultRepository(
            transactions=[
                transaction(ticker="PETR4", operation_type="Compra", tx_date=date(2026, 4, 6), quantity=100, unit_price=30.0, operation_value=3000.0),
            ],
            series={"PETR4.SA": [(date(2026, 4, 30), 31.0), (date(2026, 5, 29), 33.0)]},
            sectors={"PETR4.SA": "Energy"},
        )

        response = await build_service(repository).get_performance("user-1")

        row = next(item for item in response.contributions if item.bucket == "2026-05")
        self.assertEqual(row.sector, "Energy")
        self.assertEqual(row.asset_type, "Acao")
        self.assertTrue(row.priced)

    async def test_daily_requires_month_param(self) -> None:
        service = build_service(FakeResultRepository(transactions=[]))

        with self.assertRaises(BusinessException) as context:
            await service.get_performance("user-1", granularity="day")

        self.assertEqual(context.exception.status_code, 400)

    async def test_returns_empty_without_transactions(self) -> None:
        response = await build_service(FakeResultRepository(transactions=[])).get_performance("user-1")

        self.assertEqual(response.buckets, [])
        self.assertEqual(response.contributions, [])


class TimelineTests(unittest.TestCase):
    def test_position_ticker_collapses_subscription_receipts(self) -> None:
        timelines = PortfolioResultService._build_timelines(
            [
                transaction(ticker="XPML11", operation_type="Compra", tx_date=date(2026, 4, 6), quantity=10, unit_price=100.0, operation_value=1000.0),
                transaction(ticker="XPML12", operation_type="Transferencia - Liquidacao", tx_date=date(2026, 4, 20), quantity=5, unit_price=90.0, operation_value=450.0, entry_side="Credito"),
            ]
        )

        self.assertEqual(list(timelines.keys()), ["XPML11"])
        self.assertEqual(timelines["XPML11"][-1].quantity, 10.0)
        self.assertEqual(timelines["XPML11"][-1].cost, 1450.0)

    def test_closed_position_clears_quantity_and_cost(self) -> None:
        timelines = PortfolioResultService._build_timelines(
            [
                transaction(ticker="PETR4", operation_type="Compra", tx_date=date(2026, 4, 6), quantity=100, unit_price=30.0, operation_value=3000.0),
                transaction(ticker="PETR4", operation_type="Venda", tx_date=date(2026, 5, 20), quantity=100, unit_price=35.0, operation_value=3500.0),
            ]
        )

        last = timelines["PETR4"][-1]
        self.assertEqual(last.quantity, 0.0)
        self.assertEqual(last.cost, 0.0)
        self.assertEqual(last.cumulative_flow, -500.0)

    def test_income_does_not_move_quantity_or_flow(self) -> None:
        timelines = PortfolioResultService._build_timelines(
            [
                transaction(ticker="HGLG11", operation_type="Compra", tx_date=date(2026, 4, 6), quantity=20, unit_price=150.0, operation_value=3000.0),
                transaction(ticker="HGLG11", operation_type="Rendimento", tx_date=date(2026, 5, 14), operation_value=24.0),
            ]
        )

        last = timelines["HGLG11"][-1]
        self.assertEqual(last.quantity, 20.0)
        self.assertEqual(last.cumulative_flow, 3000.0)
        self.assertEqual(last.cumulative_income, 24.0)


if __name__ == "__main__":
    unittest.main()
