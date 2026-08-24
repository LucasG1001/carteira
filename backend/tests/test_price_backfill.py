from __future__ import annotations

import logging
import unittest
from datetime import date, datetime

from src.modules.MarketData.schemas.market_data_schema import (
    BatchPriceSnapshot,
    PriceRecord,
    TickerInfoRecord,
)
from src.modules.MarketData.services.price_backfill_service import PriceBackfillService


class FakeBackfillClient:
    def __init__(self, days: int = 3, empty_tickers: set[str] | None = None):
        self.days = days
        self.empty_tickers = empty_tickers or set()
        self.requests: list[list[str]] = []

    def fetch_batch_price_series(
        self,
        tickers: list[str],
        *,
        period: str | None = "5d",
        start: date | None = None,
        end: date | None = None,
    ) -> dict[str, list[BatchPriceSnapshot]]:
        self.requests.append(list(tickers))
        series: dict[str, list[BatchPriceSnapshot]] = {}
        for ticker in tickers:
            if ticker in self.empty_tickers:
                continue
            series[ticker] = [
                BatchPriceSnapshot(
                    ticker=ticker,
                    date=date(2022, 5, 2 + offset),
                    open=10.0,
                    high=12.0,
                    low=9.5,
                    close=11.0 + offset,
                    volume=1000,
                )
                for offset in range(self.days)
            ]
        return series


class FakeBackfillRepository:
    def __init__(self, tickers: list[str], first_date: date | None = date(2022, 5, 1)):
        self.tickers = tickers
        self.first_date = first_date
        self.prices: list[PriceRecord] = []
        self.upsert_calls = 0

    def get_distinct_transaction_tickers(self) -> list[str]:
        return list(self.tickers)

    def get_first_transaction_date(self) -> date | None:
        return self.first_date

    def upsert_market_data_bulk(self, prices: list[PriceRecord]) -> None:
        self.upsert_calls += 1
        self.prices.extend(prices)

    def upsert_ticker_infos_bulk(self, infos: list[TickerInfoRecord], updated_at: datetime) -> None:
        raise AssertionError("backfill não deve tocar ticker_info")


class PriceBackfillTests(unittest.TestCase):
    def setUp(self) -> None:
        self.logger = logging.getLogger("test-price-backfill")
        self.logger.handlers = []
        self.logger.addHandler(logging.NullHandler())

    def _build_service(self, repository, client, chunk_size: int = 10) -> PriceBackfillService:
        return PriceBackfillService(
            client=client,
            repository=repository,
            logger=self.logger,
            timezone_name="America/Sao_Paulo",
            chunk_size=chunk_size,
            submission_delay_seconds=0,
        )

    def test_persists_every_day_of_the_series(self) -> None:
        repository = FakeBackfillRepository(tickers=["PETR4", "VALE3"])
        client = FakeBackfillClient(days=3)
        service = self._build_service(repository, client)

        results = service.run()

        self.assertEqual(len(repository.prices), 6)
        self.assertTrue(all(result.success for result in results))
        self.assertTrue(all(result.rows == 3 for result in results))
        self.assertEqual(results[0].first_date, date(2022, 5, 2))
        self.assertEqual(results[0].last_date, date(2022, 5, 4))

    def test_empty_ticker_does_not_abort_the_run(self) -> None:
        repository = FakeBackfillRepository(tickers=["PETR4", "BCFF11", "VALE3"])
        client = FakeBackfillClient(days=2, empty_tickers={"BCFF11.SA"})
        service = self._build_service(repository, client)

        results = service.run()

        failed = [result for result in results if not result.success]
        self.assertEqual([result.ticker for result in failed], ["BCFF11.SA"])
        self.assertEqual(failed[0].error, "sem cotações no intervalo")
        self.assertEqual(len(repository.prices), 4)

    def test_single_ticker_retry_recovers_ticker_missing_from_batch(self) -> None:
        class FlakyClient(FakeBackfillClient):
            def fetch_batch_price_series(self, tickers, *, period=None, start=None, end=None):
                if len(tickers) == 1 and tickers[0] == "BCFF11.SA":
                    return super().fetch_batch_price_series(
                        tickers, period=period, start=start, end=end
                    )
                return {
                    ticker: rows
                    for ticker, rows in super()
                    .fetch_batch_price_series(tickers, period=period, start=start, end=end)
                    .items()
                    if ticker != "BCFF11.SA"
                }

        repository = FakeBackfillRepository(tickers=["PETR4", "BCFF11"])
        service = self._build_service(repository, FlakyClient(days=2))

        results = service.run()

        self.assertTrue(all(result.success for result in results))
        self.assertEqual(len(repository.prices), 4)

    def test_chunking_splits_downloads_and_upserts(self) -> None:
        repository = FakeBackfillRepository(tickers=["PETR4", "VALE3", "WEGE3", "BBSE3"])
        client = FakeBackfillClient(days=1)
        service = self._build_service(repository, client, chunk_size=2)

        service.run()

        self.assertEqual(len(client.requests), 2)
        self.assertEqual([len(request) for request in client.requests], [2, 2])
        self.assertEqual(repository.upsert_calls, 2)

    def test_returns_empty_without_transactions(self) -> None:
        repository = FakeBackfillRepository(tickers=["PETR4"], first_date=None)
        client = FakeBackfillClient()
        service = self._build_service(repository, client)

        self.assertEqual(service.run(), [])
        self.assertEqual(client.requests, [])


if __name__ == "__main__":
    unittest.main()
