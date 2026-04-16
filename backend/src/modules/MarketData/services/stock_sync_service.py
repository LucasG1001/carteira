from __future__ import annotations

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from time import perf_counter

from src.modules.MarketData.schemas.market_data_schema import TickerSyncResult
from src.modules.MarketData.services.market_hours import is_market_sync_time, resolve_timezone
from src.modules.MarketData.services.ticker_loader import load_tickers


class StockSyncService:
    def __init__(
        self,
        *,
        client,
        repository,
        logger: logging.Logger,
        timezone_name: str,
        start_hour: int,
        end_hour: int,
        max_workers: int,
        submission_delay_seconds: float,
        tickers_path,
    ):
        self.client = client
        self.repository = repository
        self.logger = logger
        self.timezone_name = timezone_name
        self.start_hour = start_hour
        self.end_hour = end_hour
        self.max_workers = max(1, max_workers)
        self.submission_delay_seconds = max(0.0, submission_delay_seconds)
        self.tickers_path = tickers_path

    def run_once(self, force: bool = False) -> list[TickerSyncResult]:
        started_at = perf_counter()
        localized_now = datetime.now(resolve_timezone(self.timezone_name))

        if not force and not is_market_sync_time(
            timezone_name=self.timezone_name,
            start_hour=self.start_hour,
            end_hour=self.end_hour,
            current_time=localized_now,
        ):
            self.logger.info(
                "Execução ignorada fora da janela da bolsa | agora=%s | janela=%sh-%sh",
                localized_now.isoformat(),
                self.start_hour,
                self.end_hour,
            )
            return []

        tickers = load_tickers(self.tickers_path)
        self.logger.info("Início da execução | tickers=%s", len(tickers))
        batch_prices = self.client.fetch_batch_prices(tickers)
        self.logger.info("OHLCV carregado em lote | tickers_com_preco=%s", len(batch_prices))

        results: list[TickerSyncResult] = []
        workers = min(self.max_workers, len(tickers))
        with ThreadPoolExecutor(max_workers=workers) as executor:
            future_to_ticker = {}
            for index, ticker in enumerate(tickers):
                future_to_ticker[executor.submit(self._process_ticker, ticker, batch_prices.get(ticker))] = ticker
                if index < len(tickers) - 1 and self.submission_delay_seconds > 0:
                    time.sleep(self.submission_delay_seconds)

            for future in as_completed(future_to_ticker):
                ticker = future_to_ticker[future]
                try:
                    results.append(future.result())
                except Exception as exc:  # pragma: no cover
                    self.logger.exception("Erro inesperado no ticker %s", ticker)
                    results.append(TickerSyncResult(ticker=ticker, success=False, error=str(exc)))

        successes = sum(1 for result in results if result.success)
        failures = len(results) - successes
        elapsed = perf_counter() - started_at
        self.logger.info(
            "Resumo final | sucesso=%s | falha=%s | duração=%.2fs",
            successes,
            failures,
            elapsed,
        )
        return results

    def _process_ticker(self, ticker: str, batch_price) -> TickerSyncResult:
        captured_at = datetime.now(resolve_timezone(self.timezone_name))
        self.logger.info("Processando ticker %s", ticker)
        try:
            market_data = self.client.fetch_ticker_data(ticker, captured_at, batch_price)
            self.repository.upsert_market_data(market_data.price)
            self.logger.info(
                "Ticker concluído %s | data_preço=%s",
                ticker,
                market_data.price.date.isoformat(),
            )
            return TickerSyncResult(
                ticker=ticker,
                success=True,
                price_date=market_data.price.date,
            )
        except Exception as exc:
            self.logger.exception("Erro ao processar ticker %s", ticker)
            return TickerSyncResult(ticker=ticker, success=False, error=str(exc))
