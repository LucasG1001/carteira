from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta
from time import perf_counter

from src.modules.MarketData.schemas.market_data_schema import PriceRecord, TickerInfoRecord, TickerSyncResult
from src.modules.MarketData.services.market_hours import is_market_sync_time, resolve_timezone
from src.modules.Portfolio.services.portfolio_service import PortfolioService


class StockSyncService:
    TICKER_INFO_TTL_DAYS = 7

    def __init__(
        self,
        *,
        client,
        repository,
        logger: logging.Logger,
        timezone_name: str,
        start_hour: int,
        end_hour: int,
        submission_delay_seconds: float,
    ):
        self.client = client
        self.repository = repository
        self.logger = logger
        self.timezone_name = timezone_name
        self.start_hour = start_hour
        self.end_hour = end_hour
        self.submission_delay_seconds = max(0.0, submission_delay_seconds)

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

        tickers = self._resolve_tickers()
        if not tickers:
            self.logger.info("Sem tickers na carteira; nada a sincronizar")
            return []

        self.logger.info("Início da execução | tickers=%s", len(tickers))
        batch_prices = self.client.fetch_batch_prices(tickers)
        self.logger.info("OHLCV carregado em lote | tickers_com_preco=%s", len(batch_prices))

        captured_at = datetime.now(resolve_timezone(self.timezone_name))
        results: list[TickerSyncResult] = []
        prices: list[PriceRecord] = []
        for ticker in tickers:
            try:
                market_data = self.client.fetch_ticker_data(ticker, captured_at, batch_prices.get(ticker))
                prices.append(market_data.price)
                results.append(
                    TickerSyncResult(ticker=ticker, success=True, price_date=market_data.price.date)
                )
            except Exception as exc:
                self.logger.exception("Erro ao processar ticker %s", ticker)
                results.append(TickerSyncResult(ticker=ticker, success=False, error=str(exc)))

        if prices:
            try:
                self.repository.upsert_market_data_bulk(prices)
            except Exception:
                self.logger.exception("Falha ao gravar preços em lote")

        self._sync_ticker_infos(tickers)

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

    def _resolve_tickers(self) -> list[str]:
        try:
            portfolio_tickers = self.repository.get_distinct_transaction_tickers()
        except Exception:
            self.logger.exception("Falha ao carregar tickers da carteira")
            return []

        tickers = PortfolioService.market_tickers_for(portfolio_tickers)
        self.logger.info("Tickers da carteira | total=%s", len(tickers))
        return tickers

    def _sync_ticker_infos(self, tickers: list[str]) -> None:
        now = datetime.now(resolve_timezone(self.timezone_name))
        try:
            updated_map = self.repository.get_ticker_info_updated_map()
        except Exception:
            self.logger.exception("Falha ao consultar ticker_info")
            return

        ttl = timedelta(days=self.TICKER_INFO_TTL_DAYS)
        pending = [ticker for ticker in tickers if self._needs_info_refresh(updated_map.get(ticker), now, ttl)]
        if not pending:
            return

        self.logger.info("Atualizando nomes/setores | pendentes=%s", len(pending))
        infos: list[TickerInfoRecord] = []
        for index, ticker in enumerate(pending):
            try:
                info = self.client.fetch_ticker_info(ticker)
                infos.append(info)
                self.logger.info("Info coletada %s | nome=%s", ticker, info.long_name or info.short_name)
            except Exception:
                self.logger.exception("Falha ao buscar info do ticker %s", ticker)

            if index < len(pending) - 1 and self.submission_delay_seconds > 0:
                time.sleep(self.submission_delay_seconds)

        if infos:
            try:
                self.repository.upsert_ticker_infos_bulk(infos, now)
            except Exception:
                self.logger.exception("Falha ao gravar ticker_info em lote")

    @staticmethod
    def _needs_info_refresh(updated_at: datetime | None, now: datetime, ttl: timedelta) -> bool:
        if updated_at is None or updated_at.tzinfo is None:
            return True
        return (now - updated_at) > ttl
