from __future__ import annotations

import logging
import time
from datetime import date, datetime
from time import perf_counter

from src.modules.MarketData.schemas.market_data_schema import (
    BatchPriceSnapshot,
    PriceRecord,
    TickerBackfillResult,
)
from src.modules.MarketData.services.market_hours import resolve_timezone
from src.modules.MarketData.services.ticker_resolution import resolve_market_tickers


class PriceBackfillService:
    def __init__(
        self,
        *,
        client,
        repository,
        logger: logging.Logger,
        timezone_name: str,
        chunk_size: int = 10,
        submission_delay_seconds: float = 1.0,
    ):
        self.client = client
        self.repository = repository
        self.logger = logger
        self.timezone_name = timezone_name
        self.chunk_size = max(1, chunk_size)
        self.submission_delay_seconds = max(0.0, submission_delay_seconds)

    def run(
        self,
        *,
        start_date: date | None = None,
        end_date: date | None = None,
        tickers: list[str] | None = None,
    ) -> list[TickerBackfillResult]:
        started_at = perf_counter()
        resolved_start = start_date or self._default_start_date()
        if resolved_start is None:
            self.logger.info("Backfill | Sem transações; nada a preencher")
            return []

        resolved_tickers = tickers or resolve_market_tickers(self.repository, self.logger)
        if not resolved_tickers:
            self.logger.info("Backfill | Sem tickers na carteira; nada a preencher")
            return []

        self.logger.info(
            "Backfill | Início | tickers=%s | de=%s | até=%s",
            len(resolved_tickers),
            resolved_start,
            end_date or "hoje",
        )

        captured_at = datetime.now(resolve_timezone(self.timezone_name))
        results: list[TickerBackfillResult] = []
        chunks = [
            resolved_tickers[index : index + self.chunk_size]
            for index in range(0, len(resolved_tickers), self.chunk_size)
        ]

        for position, chunk in enumerate(chunks, start=1):
            series = self._fetch_chunk(chunk, resolved_start, end_date)
            records: list[PriceRecord] = []
            for ticker in chunk:
                snapshots = series.get(ticker) or []
                if not snapshots:
                    self.logger.warning("Backfill | Sem cotações para %s no intervalo", ticker)
                    results.append(
                        TickerBackfillResult(
                            ticker=ticker, success=False, error="sem cotações no intervalo"
                        )
                    )
                    continue

                records.extend(self._to_records(ticker, snapshots, captured_at))
                results.append(
                    TickerBackfillResult(
                        ticker=ticker,
                        success=True,
                        rows=len(snapshots),
                        first_date=snapshots[0].date,
                        last_date=snapshots[-1].date,
                    )
                )

            if records:
                try:
                    self.repository.upsert_market_data_bulk(records)
                    self.logger.info(
                        "Backfill | Lote %s/%s gravado | linhas=%s", position, len(chunks), len(records)
                    )
                except Exception:
                    self.logger.exception("Backfill | Falha ao gravar lote %s", position)

            if position < len(chunks) and self.submission_delay_seconds > 0:
                time.sleep(self.submission_delay_seconds)

        self._log_summary(results, perf_counter() - started_at)
        return results

    def _fetch_chunk(
        self, chunk: list[str], start_date: date, end_date: date | None
    ) -> dict[str, list[BatchPriceSnapshot]]:
        try:
            series = self.client.fetch_batch_price_series(
                chunk, period=None, start=start_date, end=end_date
            )
        except Exception:
            self.logger.exception("Backfill | Falha ao baixar lote %s", chunk)
            series = {}

        # O download em lote às vezes omite a coluna de um ticker deslistado que ainda
        # responde individualmente; a tentativa avulsa custa uma requisição por buraco.
        for ticker in chunk:
            if series.get(ticker):
                continue
            try:
                single = self.client.fetch_batch_price_series(
                    [ticker], period=None, start=start_date, end=end_date
                )
            except Exception:
                self.logger.exception("Backfill | Falha na tentativa avulsa de %s", ticker)
                continue
            if single.get(ticker):
                series[ticker] = single[ticker]

        return series

    @staticmethod
    def _to_records(
        ticker: str, snapshots: list[BatchPriceSnapshot], captured_at: datetime
    ) -> list[PriceRecord]:
        return [
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
            for snapshot in snapshots
        ]

    def _default_start_date(self) -> date | None:
        try:
            return self.repository.get_first_transaction_date()
        except Exception:
            self.logger.exception("Backfill | Falha ao consultar a primeira transação")
            return None

    def _log_summary(self, results: list[TickerBackfillResult], elapsed: float) -> None:
        successes = [result for result in results if result.success]
        failures = [result for result in results if not result.success]
        self.logger.info(
            "Backfill | Resumo final | tickers_ok=%s | tickers_sem_dados=%s | linhas=%s | duração=%.2fs",
            len(successes),
            len(failures),
            sum(result.rows for result in successes),
            elapsed,
        )
        if failures:
            self.logger.warning(
                "Backfill | Ficam avaliados a custo: %s",
                ", ".join(result.ticker for result in failures),
            )
