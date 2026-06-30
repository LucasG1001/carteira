from __future__ import annotations

from contextlib import closing
from datetime import datetime

from psycopg2 import connect
from psycopg2.extras import execute_values

from src.modules.MarketData.schemas.market_data_schema import PriceRecord, TickerInfoRecord


class MarketDataRepository:
    def __init__(self, database_url: str):
        self.database_url = database_url

    def get_distinct_transaction_tickers(self) -> list[str]:
        with closing(connect(self.database_url)) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT DISTINCT ticker FROM transactions ORDER BY ticker;")
                return [row[0] for row in cursor.fetchall()]

    def get_ticker_info_updated_map(self) -> dict[str, datetime]:
        with closing(connect(self.database_url)) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT ticker, updated_at FROM ticker_info;")
                return {row[0]: row[1] for row in cursor.fetchall()}

    def upsert_market_data_bulk(self, prices: list[PriceRecord]) -> None:
        if not prices:
            return

        rows = [
            (
                price.ticker,
                price.date,
                price.open,
                price.high,
                price.low,
                price.close,
                price.volume,
                price.created_at,
            )
            for price in prices
        ]
        with closing(connect(self.database_url)) as connection:
            with connection.cursor() as cursor:
                execute_values(
                    cursor,
                    """
                    INSERT INTO stock_prices (ticker, date, open, high, low, close, volume, created_at)
                    VALUES %s
                    ON CONFLICT (ticker, date) DO UPDATE SET
                        open = EXCLUDED.open,
                        high = EXCLUDED.high,
                        low = EXCLUDED.low,
                        close = EXCLUDED.close,
                        volume = EXCLUDED.volume,
                        created_at = EXCLUDED.created_at
                    """,
                    rows,
                )
            connection.commit()

    def upsert_ticker_infos_bulk(self, infos: list[TickerInfoRecord], updated_at: datetime) -> None:
        if not infos:
            return

        rows = [
            (
                info.ticker,
                info.short_name,
                info.long_name,
                info.sector,
                info.quote_type,
                updated_at,
            )
            for info in infos
        ]
        with closing(connect(self.database_url)) as connection:
            with connection.cursor() as cursor:
                execute_values(
                    cursor,
                    """
                    INSERT INTO ticker_info (ticker, short_name, long_name, sector, quote_type, updated_at)
                    VALUES %s
                    ON CONFLICT (ticker) DO UPDATE SET
                        short_name = EXCLUDED.short_name,
                        long_name = EXCLUDED.long_name,
                        sector = EXCLUDED.sector,
                        quote_type = EXCLUDED.quote_type,
                        updated_at = EXCLUDED.updated_at
                    """,
                    rows,
                )
            connection.commit()
