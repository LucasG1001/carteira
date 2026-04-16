from __future__ import annotations

import math
from datetime import date, datetime
from typing import Any

import pandas as pd
import yfinance as yf

from src.modules.MarketData.schemas.market_data_schema import BatchPriceSnapshot, PriceRecord, TickerMarketData


class YFinanceMarketDataClient:
    def fetch_batch_prices(self, tickers: list[str]) -> dict[str, BatchPriceSnapshot]:
        if not tickers:
            return {}

        history = yf.download(
            tickers=tickers,
            period="5d",
            interval="1d",
            auto_adjust=False,
            actions=False,
            progress=False,
            threads=True,
            group_by="ticker",
        )
        if history is None or history.empty:
            return {}

        snapshots: dict[str, BatchPriceSnapshot] = {}
        for ticker in tickers:
            ticker_frame = self._extract_ticker_frame(history, ticker)
            if ticker_frame is None or ticker_frame.empty:
                continue

            last_row = ticker_frame.sort_index().tail(1)
            row = last_row.iloc[0]
            row_date = self._to_date(last_row.index[-1])

            open_price = self._as_float(row.get("Open"))
            high_price = self._as_float(row.get("High"))
            low_price = self._as_float(row.get("Low"))
            close_price = self._as_float(row.get("Close"))
            volume = self._as_int(row.get("Volume"))
            if None in (open_price, high_price, low_price, close_price) or volume is None:
                continue

            snapshots[ticker] = BatchPriceSnapshot(
                ticker=ticker,
                date=row_date,
                open=open_price,
                high=high_price,
                low=low_price,
                close=close_price,
                volume=volume,
            )

        return snapshots

    def fetch_ticker_data(
        self,
        ticker: str,
        captured_at: datetime,
        price_snapshot: BatchPriceSnapshot | None = None,
    ) -> TickerMarketData:
        stock = yf.Ticker(ticker)
        price_snapshot = price_snapshot or self.fetch_batch_prices([ticker]).get(ticker)
        if price_snapshot is None:
            raise ValueError(f"Nenhum OHLCV diário retornado para {ticker}")

        close_price = self._resolve_current_price(stock)
        if close_price is None:
            close_price = price_snapshot.close

        price = PriceRecord(
            ticker=ticker,
            date=price_snapshot.date,
            open=price_snapshot.open,
            high=price_snapshot.high,
            low=price_snapshot.low,
            close=close_price,
            volume=price_snapshot.volume,
            created_at=captured_at,
        )
        return TickerMarketData(ticker=ticker, price=price)

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

    def _resolve_current_price(self, stock: Any) -> float | None:
        fast_info = getattr(stock, "fast_info", None)
        candidate_values: list[Any] = []

        if fast_info is not None:
            if hasattr(fast_info, "get"):
                candidate_values.extend(
                    [
                        fast_info.get("lastPrice"),
                        fast_info.get("regularMarketPrice"),
                        fast_info.get("previousClose"),
                    ]
                )

            for attr_name in ("lastPrice", "last_price", "regularMarketPrice"):
                candidate_values.append(getattr(fast_info, attr_name, None))

        for value in candidate_values:
            resolved = self._as_float(value)
            if resolved is not None:
                return resolved

        return None

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
        return None if math.isnan(result) else result

    @staticmethod
    def _as_int(value: Any) -> int | None:
        if value is None:
            return None
        try:
            result = int(value)
        except (TypeError, ValueError):
            return None
        return result
