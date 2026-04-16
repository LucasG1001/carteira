from __future__ import annotations

from psycopg2 import connect

from src.modules.MarketData.schemas.market_data_schema import PriceRecord


class MarketDataRepository:
    def __init__(self, database_url: str):
        self.database_url = database_url

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
