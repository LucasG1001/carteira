from __future__ import annotations

import logging
from datetime import date, timedelta

from src.modules.Benchmarks.schemas.benchmark_schema import CDI_SERIES, IPCA_SERIES

# Reprocessa uma janela recente para pegar correções e o IPCA divulgado com atraso.
REFRESH_OVERLAP = timedelta(days=45)


class BenchmarkSyncService:
    def __init__(self, client, repository, logger: logging.Logger, today_provider=date.today):
        self.client = client
        self.repository = repository
        self.logger = logger
        self.today_provider = today_provider

    def run_once(self) -> None:
        first_transaction = self.repository.get_first_transaction_date()
        if first_transaction is None:
            self.logger.info("Benchmarks | sem transações; nada a sincronizar")
            return

        today = self.today_provider()
        for series in (CDI_SERIES, IPCA_SERIES):
            try:
                self._sync_series(series, first_transaction, today)
            except Exception:
                self.logger.exception("Benchmarks | falha ao sincronizar %s", series)

    def _sync_series(self, series: str, first_transaction: date, today: date) -> None:
        backfill_start = first_transaction.replace(day=1) - timedelta(days=31)
        last_stored = self.repository.get_last_rate_date(series)
        start = max(backfill_start, last_stored - REFRESH_OVERLAP) if last_stored else backfill_start

        records = self.client.fetch_series(series, start, today)
        self.repository.upsert_rates(records)
        self.logger.info("Benchmarks | %s sincronizado | desde=%s registros=%s", series, start, len(records))
