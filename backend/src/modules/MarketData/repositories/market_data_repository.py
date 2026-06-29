from __future__ import annotations

from datetime import datetime

from psycopg2 import connect

from src.modules.MarketData.schemas.market_data_schema import PriceRecord, TickerInfoRecord


class MarketDataRepository:
    def __init__(self, database_url: str):
        self.database_url = database_url

    def get_distinct_transaction_tickers(self) -> list[str]:
        with connect(self.database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT DISTINCT ticker FROM transactions ORDER BY ticker;")
                return [row[0] for row in cursor.fetchall()]

    def get_ticker_info_updated_map(self) -> dict[str, datetime]:
        with connect(self.database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT ticker, updated_at FROM ticker_info;")
                return {row[0]: row[1] for row in cursor.fetchall()}

    def upsert_ticker_info(self, info: TickerInfoRecord, updated_at: datetime) -> None:
        with connect(self.database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO ticker_info (ticker, short_name, long_name, sector, quote_type, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ticker) DO UPDATE SET
                        short_name = EXCLUDED.short_name,
                        long_name = EXCLUDED.long_name,
                        sector = EXCLUDED.sector,
                        quote_type = EXCLUDED.quote_type,
                        updated_at = EXCLUDED.updated_at
                    """,
                    (
                        info.ticker,
                        info.short_name,
                        info.long_name,
                        info.sector,
                        info.quote_type,
                        updated_at,
                    ),
                )
            connection.commit()

    def upsert_market_data(self, price: PriceRecord) -> None:
        with connect(self.database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO stock_prices (ticker, date, open, high, low, close, volume, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ticker, date) DO UPDATE SET
                        open = EXCLUDED.open,
                        high = EXCLUDED.high,
                        low = EXCLUDED.low,
                        close = EXCLUDED.close,
                        volume = EXCLUDED.volume,
                        created_at = EXCLUDED.created_at
                    """,
                    (
                        price.ticker,
                        price.date,
                        price.open,
                        price.high,
                        price.low,
                        price.close,
                        price.volume,
                        price.created_at,
                    ),
                )

            connection.commit()
