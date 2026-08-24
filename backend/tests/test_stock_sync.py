from __future__ import annotations

import logging
import unittest
from datetime import date, datetime

from src.modules.MarketData.schemas.market_data_schema import (
    BatchPriceSnapshot,
    PriceRecord,
    TickerInfoRecord,
    TickerMarketData,
)
from src.modules.MarketData.services.market_hours import is_market_sync_time, resolve_timezone
from src.modules.MarketData.services.stock_sync_service import StockSyncService


class FakeClient:
    def __init__(self, days: int = 1):
        self.batch_requests: list[list[str]] = []
        self.days = days

    def fetch_batch_price_series(
        self,
        tickers: list[str],
        *,
        period: str | None = "5d",
        start: date | None = None,
        end: date | None = None,
    ) -> dict[str, list[BatchPriceSnapshot]]:
        self.batch_requests.append(list(tickers))
        series: dict[str, list[BatchPriceSnapshot]] = {}
        for ticker in tickers:
            if ticker == "FAIL3.SA":
                continue
            series[ticker] = [
                BatchPriceSnapshot(
                    ticker=ticker,
                    date=date(2026, 4, 15 - offset),
                    open=10.0,
                    high=12.0,
                    low=9.5,
                    close=11.5,
                    volume=1000,
                )
                for offset in reversed(range(self.days))
            ]
        return series

    def fetch_ticker_data(
        self,
        ticker: str,
        captured_at: datetime,
        price_snapshots: list[BatchPriceSnapshot] | None = None,
    ) -> TickerMarketData:
        if not price_snapshots:
            raise ValueError("snapshot de preço ausente")

        return TickerMarketData(
            ticker=ticker,
            prices=[
                PriceRecord(
                    ticker=ticker,
                    date=snapshot.date,
                    open=snapshot.open,
                    high=snapshot.high,
                    low=snapshot.low,
                    close=snapshot.close,
                    volume=snapshot.volume,
                    created_at=captured_at,
                )
                for snapshot in price_snapshots
            ],
        )

    def fetch_ticker_info(self, ticker: str) -> TickerInfoRecord:
        return TickerInfoRecord(
            ticker=ticker,
            short_name=ticker,
            long_name=ticker,
            sector="Teste",
            quote_type="EQUITY",
        )


class FakeRepository:
    def __init__(self, tickers: list[str]):
        self.tickers = tickers
        self.prices: list[PriceRecord] = []
        self.infos: list[TickerInfoRecord] = []

    def get_distinct_transaction_tickers(self) -> list[str]:
        return list(self.tickers)

    def get_ticker_info_updated_map(self) -> dict[str, datetime]:
        return {}

    def upsert_market_data_bulk(self, prices: list[PriceRecord]) -> None:
        self.prices.extend(prices)

    def upsert_ticker_infos_bulk(self, infos: list[TickerInfoRecord], updated_at: datetime) -> None:
        self.infos.extend(infos)


class StockSyncTests(unittest.TestCase):
    def setUp(self) -> None:
        self.logger = logging.getLogger("test-stock-sync")
        self.logger.handlers = []
        self.logger.addHandler(logging.NullHandler())

    def _build_service(self, repository: FakeRepository, client: FakeClient) -> StockSyncService:
        return StockSyncService(
            client=client,
            repository=repository,
            logger=self.logger,
            timezone_name="America/Sao_Paulo",
            start_hour=10,
            end_hour=18,
            submission_delay_seconds=0,
        )

    def test_market_hours_accept_business_window(self) -> None:
        current_time = datetime(2026, 4, 16, 10, 0, tzinfo=resolve_timezone("America/Sao_Paulo"))
        self.assertTrue(is_market_sync_time("America/Sao_Paulo", 10, 18, current_time))

    def test_market_hours_reject_weekend(self) -> None:
        current_time = datetime(2026, 4, 18, 10, 0, tzinfo=resolve_timezone("America/Sao_Paulo"))
        self.assertFalse(is_market_sync_time("America/Sao_Paulo", 10, 18, current_time))

    def test_market_hours_include_end_hour_oclock_but_not_half_past(self) -> None:
        tz = resolve_timezone("America/Sao_Paulo")
        self.assertTrue(is_market_sync_time("America/Sao_Paulo", 10, 18, datetime(2026, 4, 16, 18, 0, tzinfo=tz)))
        self.assertFalse(is_market_sync_time("America/Sao_Paulo", 10, 18, datetime(2026, 4, 16, 18, 30, tzinfo=tz)))

    def test_service_continues_when_one_ticker_fails(self) -> None:
        repository = FakeRepository(tickers=["PETR4", "FAIL3", "VALE3"])
        client = FakeClient()
        service = self._build_service(repository, client)

        results = service.run_once(force=True)

        self.assertEqual(len(results), 3)
        self.assertEqual(len(repository.prices), 2)
        self.assertEqual(sum(1 for result in results if result.success), 2)
        self.assertEqual(sum(1 for result in results if not result.success), 1)
        self.assertEqual(client.batch_requests, [["FAIL3.SA", "PETR4.SA", "VALE3.SA"]])

    def test_daily_sync_persists_whole_window(self) -> None:
        repository = FakeRepository(tickers=["PETR4", "VALE3"])
        client = FakeClient(days=5)
        service = self._build_service(repository, client)

        results = service.run_once(force=True)

        self.assertEqual(len(repository.prices), 10)
        self.assertEqual(len({price.date for price in repository.prices}), 5)
        self.assertTrue(all(result.price_date == date(2026, 4, 15) for result in results))

    def test_service_returns_empty_when_no_tickers(self) -> None:
        repository = FakeRepository(tickers=[])
        client = FakeClient()
        service = self._build_service(repository, client)

        results = service.run_once(force=True)

        self.assertEqual(results, [])
        self.assertEqual(client.batch_requests, [])
        self.assertEqual(repository.prices, [])


if __name__ == "__main__":
    unittest.main()
