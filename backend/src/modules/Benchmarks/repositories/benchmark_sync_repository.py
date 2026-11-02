from __future__ import annotations

from contextlib import closing
from datetime import date

from psycopg2 import connect
from psycopg2.extras import execute_values

from src.modules.Benchmarks.schemas.benchmark_schema import RateRecord


class BenchmarkSyncRepository:
    def __init__(self, database_url: str):
        self.database_url = database_url

    def get_first_transaction_date(self) -> date | None:
        with closing(connect(self.database_url)) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT MIN(date) FROM transactions;")
                row = cursor.fetchone()
                return row[0] if row else None

    def get_last_rate_date(self, series: str) -> date | None:
        with closing(connect(self.database_url)) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT MAX(date) FROM benchmark_rates WHERE series = %s;", (series,))
                row = cursor.fetchone()
                return row[0] if row else None

    def upsert_rates(self, records: list[RateRecord]) -> None:
        if not records:
            return

        rows = [(record.series, record.date, record.value) for record in records]
        with closing(connect(self.database_url)) as connection:
            with connection.cursor() as cursor:
                execute_values(
                    cursor,
                    """
                    INSERT INTO benchmark_rates (series, date, value)
                    VALUES %s
                    ON CONFLICT (series, date) DO UPDATE SET value = EXCLUDED.value
                    """,
                    rows,
                )
            connection.commit()
