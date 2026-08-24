from __future__ import annotations

import math
from datetime import date, datetime
from typing import Any

import pandas as pd
import yfinance as yf

from src.modules.MarketData.schemas.market_data_schema import (
    BatchPriceSnapshot,
    PriceRecord,
    TickerInfoRecord,
    TickerMarketData,
)


class YFinanceMarketDataClient:
    # auto_adjust=False é obrigatório: a quantidade da posição já vem das transações da B3
    # incluindo desdobro/bonificação. Com preço ajustado o evento seria contado duas vezes.
    def fetch_batch_price_series(
        self,
        tickers: list[str],
        *,
        period: str | None = "5d",
        start: date | None = None,
        end: date | None = None,
    ) -> dict[str, list[BatchPriceSnapshot]]:
        if not tickers:
            return {}

        window: dict[str, Any] = {"start": start, "end": end} if start else {"period": period}
        history = yf.download(
            tickers=tickers,
            interval="1d",
            auto_adjust=False,
            actions=False,
            progress=False,
            threads=True,
            group_by="ticker",
            **window,
        )
        if history is None or history.empty:
            return {}

        series: dict[str, list[BatchPriceSnapshot]] = {}
        for ticker in tickers:
            ticker_frame = self._extract_ticker_frame(history, ticker)
            if ticker_frame is None or ticker_frame.empty:
                continue

            snapshots = [
                snapshot
                for index, row in ticker_frame.sort_index().iterrows()
                if (snapshot := self._to_snapshot(ticker, index, row)) is not None
            ]
            if snapshots:
                series[ticker] = snapshots

        return series

    def fetch_batch_prices(self, tickers: list[str]) -> dict[str, BatchPriceSnapshot]:
        series = self.fetch_batch_price_series(tickers, period="5d")
        return {ticker: snapshots[-1] for ticker, snapshots in series.items() if snapshots}

    def _to_snapshot(self, ticker: str, index: Any, row: Any) -> BatchPriceSnapshot | None:
        open_price = self._as_float(row.get("Open"))
        high_price = self._as_float(row.get("High"))
        low_price = self._as_float(row.get("Low"))
        close_price = self._as_float(row.get("Close"))
        if None in (open_price, high_price, low_price, close_price):
            return None

        return BatchPriceSnapshot(
            ticker=ticker,
            date=self._to_date(index),
            open=open_price,
            high=high_price,
            low=low_price,
            close=close_price,
            volume=self._as_int(row.get("Volume")) or 0,
        )

    def fetch_ticker_data(
        self,
        ticker: str,
        captured_at: datetime,
        price_snapshots: list[BatchPriceSnapshot] | None = None,
    ) -> TickerMarketData:
        price_snapshots = price_snapshots or self.fetch_batch_price_series([ticker]).get(ticker)
        if not price_snapshots:
            raise ValueError(f"Nenhum OHLCV diário retornado para {ticker}")

        prices = [
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
        ]
        return TickerMarketData(ticker=ticker, prices=prices)

    def fetch_ticker_info(self, ticker: str) -> TickerInfoRecord:
        info: dict[str, Any] = {}
        try:
            raw = yf.Ticker(ticker).info
            if isinstance(raw, dict):
                info = raw
        except Exception:
            info = {}

        return TickerInfoRecord(
            ticker=ticker,
            short_name=self._as_clean_str(info.get("shortName")),
            long_name=self._as_clean_str(info.get("longName")),
            sector=self._as_clean_str(info.get("sector")),
            quote_type=self._as_clean_str(info.get("quoteType")),
        )

    @staticmethod
    def _as_clean_str(value: Any) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    def _extract_ticker_frame(self, history: pd.DataFrame, ticker: str) -> pd.DataFrame | None:
        if isinstance(history.columns, pd.MultiIndex):
            level_zero = set(history.columns.get_level_values(0))
            if ticker in level_zero:
                return history[ticker]

            level_one = set(history.columns.get_level_values(1))
            if ticker in level_one:
                return history.xs(ticker, axis=1, level=1)

            return None

        return history

    @staticmethod
    def _to_date(value: Any) -> date:
        if isinstance(value, date) and not isinstance(value, datetime):
            return value
        if hasattr(value, "date"):
            return value.date()
        raise ValueError(f"Não foi possível converter valor em data: {value!r}")

    @staticmethod
    def _as_float(value: Any) -> float | None:
        if value is None:
            return None
        try:
            result = float(value)
        except (TypeError, ValueError):
            return None
        return result if math.isfinite(result) else None

    @staticmethod
    def _as_int(value: Any) -> int | None:
        if value is None:
            return None
        try:
            result = float(value)
        except (TypeError, ValueError):
            return None
        return int(result) if math.isfinite(result) else None
