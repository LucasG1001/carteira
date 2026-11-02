from __future__ import annotations

import json
import urllib.request
from datetime import date, datetime, timedelta

from src.modules.Benchmarks.schemas.benchmark_schema import SGS_CODES, RateRecord

SGS_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados?formato=json&dataInicial={start}&dataFinal={end}"
# A API do SGS recusa séries diárias com janela acima de 10 anos por requisição.
MAX_WINDOW = timedelta(days=365 * 9)


class BcbClient:
    def __init__(self, timeout_seconds: float = 30.0):
        self.timeout_seconds = timeout_seconds

    def fetch_series(self, series: str, start: date, end: date) -> list[RateRecord]:
        records: list[RateRecord] = []
        window_start = start
        while window_start <= end:
            window_end = min(end, window_start + MAX_WINDOW)
            records.extend(self._fetch_window(series, window_start, window_end))
            window_start = window_end + timedelta(days=1)
        return records

    def _fetch_window(self, series: str, start: date, end: date) -> list[RateRecord]:
        url = SGS_URL.format(
            code=SGS_CODES[series],
            start=start.strftime("%d/%m/%Y"),
            end=end.strftime("%d/%m/%Y"),
        )
        request = urllib.request.Request(url, headers={"User-Agent": "carteira/1.0", "Accept": "application/json"})
        with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
            payload = json.load(response)

        return [
            RateRecord(
                series=series,
                date=datetime.strptime(row["data"], "%d/%m/%Y").date(),
                value=float(row["valor"]),
            )
            for row in payload
        ]
