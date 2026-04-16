from __future__ import annotations

import logging
import tempfile
import unittest
from datetime import date, datetime
from pathlib import Path

from src.modules.MarketData.schemas.market_data_schema import BatchPriceSnapshot, PriceRecord, TickerMarketData
from src.modules.MarketData.services.market_hours import is_market_sync_time, resolve_timezone
from src.modules.MarketData.services.stock_sync_service import StockSyncService
from src.modules.MarketData.services.ticker_loader import load_tickers


class FakeClient:
    def __init__(self):
        self.batch_requests: list[list[str]] = []

    def fetch_batch_prices(self, tickers: list[str]) -> dict[str, BatchPriceSnapshot]:
        self.batch_requests.append(list(tickers))
        snapshots = {}
        for ticker in tickers:
            if ticker == "FAIL3.SA":
                continue
            snapshots[ticker] = BatchPriceSnapshot(
                ticker=ticker,
                date=date(2026, 4, 15),
                open=10.0,
                high=12.0,
                low=9.5,
                close=11.5,
                volume=1000,
            )
        return snapshots

    def fetch_ticker_data(self, ticker: str, captured_at: datetime, price_snapshot: BatchPriceSnapshot | None = None) -> TickerMarketData:
        if ticker == "FAIL3.SA":
            raise ValueError("ticker inválido")
        if price_snapshot is None:
            raise ValueError("snapshot de preço ausente")

        return TickerMarketData(
            ticker=ticker,
            price=PriceRecord(
                ticker=ticker,
                date=price_snapshot.date,
                open=price_snapshot.open,
                high=price_snapshot.high,
                low=price_snapshot.low,
                close=price_snapshot.close,
                volume=price_snapshot.volume,
                created_at=captured_at,
            ),
        )


class FakeRepository:
    def __init__(self):
        self.calls: list[PriceRecord] = []

    def upsert_market_data(self, price: PriceRecord) -> None:
        self.calls.append(price)


class StockSyncTests(unittest.TestCase):
    def setUp(self) -> None:
        self.logger = logging.getLogger("test-stock-sync")
        self.logger.handlers = []
        self.logger.addHandler(logging.NullHandler())

    def test_load_tickers_normalizes_and_skips_blank_lines(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            tickers_file = Path(temp_dir) / "tickers.txt"
            tickers_file.write_text(" petr4.sa \n\nvale3.sa\n", encoding="utf-8")

            self.assertEqual(load_tickers(tickers_file), ["PETR4.SA", "VALE3.SA"])

    def test_market_hours_accept_business_window(self) -> None:
        current_time = datetime(2026, 4, 16, 10, 0, tzinfo=resolve_timezone("America/Sao_Paulo"))
        self.assertTrue(is_market_sync_time("America/Sao_Paulo", 10, 17, current_time))

    def test_market_hours_reject_weekend(self) -> None:
        current_time = datetime(2026, 4, 18, 10, 0, tzinfo=resolve_timezone("America/Sao_Paulo"))
        self.assertFalse(is_market_sync_time("America/Sao_Paulo", 10, 17, current_time))

    def test_service_continues_when_one_ticker_fails(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            tickers_file = Path(temp_dir) / "tickers.txt"
            tickers_file.write_text("PETR4.SA\nFAIL3.SA\nVALE3.SA\n", encoding="utf-8")

            repository = FakeRepository()
            client = FakeClient()
            service = StockSyncService(
                client=client,
                repository=repository,
                logger=self.logger,
                timezone_name="America/Sao_Paulo",
                start_hour=10,
                end_hour=17,
                max_workers=2,
                submission_delay_seconds=0,
                tickers_path=tickers_file,
            )

            results = service.run_once(force=True)

            self.assertEqual(len(results), 3)
            self.assertEqual(len(repository.calls), 2)
            self.assertEqual(sum(1 for result in results if result.success), 2)
            self.assertEqual(sum(1 for result in results if not result.success), 1)
            self.assertEqual(client.batch_requests, [["PETR4.SA", "FAIL3.SA", "VALE3.SA"]])


if __name__ == "__main__":
    unittest.main()
