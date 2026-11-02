from __future__ import annotations

import logging
import unittest
from datetime import date

from src.modules.Benchmarks.schemas.benchmark_schema import CDI_SERIES, IPCA_SERIES, RateRecord
from src.modules.Benchmarks.services.benchmark_service import BenchmarkService
from src.modules.Benchmarks.services.benchmark_sync_service import BenchmarkSyncService


class BenchmarkAggregationTests(unittest.TestCase):
    def test_compounds_daily_cdi_per_month(self) -> None:
        rates = [(date(2026, 1, 2), 1.0), (date(2026, 1, 5), 1.0), (date(2026, 2, 2), 0.5)]

        months = BenchmarkService.compound_by_month(rates)

        self.assertAlmostEqual(months["2026-01"], 2.01)
        self.assertAlmostEqual(months["2026-02"], 0.5)

    def test_ibov_uses_last_close_of_each_month(self) -> None:
        closes = [
            (date(2025, 12, 30), 100.0),
            (date(2026, 1, 15), 90.0),
            (date(2026, 1, 30), 110.0),
            (date(2026, 2, 27), 99.0),
        ]

        months = BenchmarkService.close_to_close_by_month(closes)

        self.assertNotIn("2025-12", months)
        self.assertAlmostEqual(months["2026-01"], 10.0)
        self.assertAlmostEqual(months["2026-02"], -10.0)


class FakeClient:
    def __init__(self) -> None:
        self.calls: list[tuple[str, date, date]] = []

    def fetch_series(self, series: str, start: date, end: date) -> list[RateRecord]:
        self.calls.append((series, start, end))
        return [RateRecord(series=series, date=end, value=0.05)]


class FakeRepository:
    def __init__(self, first_transaction: date | None, last_dates: dict[str, date]):
        self.first_transaction = first_transaction
        self.last_dates = last_dates
        self.saved: list[RateRecord] = []

    def get_first_transaction_date(self) -> date | None:
        return self.first_transaction

    def get_last_rate_date(self, series: str) -> date | None:
        return self.last_dates.get(series)

    def upsert_rates(self, records: list[RateRecord]) -> None:
        self.saved.extend(records)


class BenchmarkSyncTests(unittest.TestCase):
    def _service(self, repository: FakeRepository, client: FakeClient) -> BenchmarkSyncService:
        return BenchmarkSyncService(
            client=client,
            repository=repository,
            logger=logging.getLogger("test"),
            today_provider=lambda: date(2026, 11, 1),
        )

    def test_first_run_backfills_from_month_before_first_transaction(self) -> None:
        client = FakeClient()
        repository = FakeRepository(date(2022, 5, 31), {})

        self._service(repository, client).run_once()

        self.assertEqual(client.calls[0], (CDI_SERIES, date(2022, 3, 31), date(2026, 11, 1)))
        self.assertEqual(client.calls[1][0], IPCA_SERIES)
        self.assertEqual(len(repository.saved), 2)

    def test_incremental_run_refetches_recent_overlap(self) -> None:
        client = FakeClient()
        repository = FakeRepository(date(2022, 5, 31), {CDI_SERIES: date(2026, 10, 30), IPCA_SERIES: date(2026, 9, 1)})

        self._service(repository, client).run_once()

        self.assertEqual(client.calls[0][1], date(2026, 9, 15))
        self.assertEqual(client.calls[1][1], date(2026, 7, 18))

    def test_skips_without_transactions(self) -> None:
        client = FakeClient()

        self._service(FakeRepository(None, {}), client).run_once()

        self.assertEqual(client.calls, [])
