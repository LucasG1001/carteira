from __future__ import annotations

import unittest
from datetime import date

import numpy as np
import pandas as pd

from src.modules.MarketData.services.yfinance_client import YFinanceMarketDataClient


def build_history(rows: list[tuple[str, float | None, float | None]]) -> pd.DataFrame:
    index = pd.to_datetime([row[0] for row in rows])
    columns = pd.MultiIndex.from_product([["PETR4.SA"], ["Open", "High", "Low", "Close", "Volume"]])
    data = [
        [10.0, 12.0, 9.5, close if close is not None else np.nan, volume if volume is not None else np.nan]
        for _, close, volume in rows
    ]
    return pd.DataFrame(data, index=index, columns=columns)


class SnapshotConversionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = YFinanceMarketDataClient()

    def _snapshots(self, history: pd.DataFrame) -> list:
        frame = self.client._extract_ticker_frame(history, "PETR4.SA").sort_index()
        return [
            snapshot
            for index, row in frame.iterrows()
            if (snapshot := self.client._to_snapshot("PETR4.SA", index, row)) is not None
        ]

    def test_row_with_nan_volume_is_kept_with_zero(self) -> None:
        snapshots = self._snapshots(build_history([("2026-06-29", 11.5, None)]))

        self.assertEqual(len(snapshots), 1)
        self.assertEqual(snapshots[0].volume, 0)
        self.assertEqual(snapshots[0].close, 11.5)
        self.assertEqual(snapshots[0].date, date(2026, 6, 29))

    def test_row_with_nan_close_is_discarded(self) -> None:
        snapshots = self._snapshots(build_history([("2026-06-29", None, 1000.0)]))

        self.assertEqual(snapshots, [])

    def test_series_keeps_every_valid_row_in_ascending_order(self) -> None:
        history = build_history(
            [("2026-06-30", 12.0, 900.0), ("2026-06-26", 11.0, None), ("2026-06-29", None, 500.0)]
        )

        snapshots = self._snapshots(history)

        self.assertEqual([snapshot.date for snapshot in snapshots], [date(2026, 6, 26), date(2026, 6, 30)])
        self.assertEqual([snapshot.volume for snapshot in snapshots], [0, 900])


class NumericConversionTests(unittest.TestCase):
    def test_as_int_rejects_nan_and_inf(self) -> None:
        self.assertIsNone(YFinanceMarketDataClient._as_int(float("nan")))
        self.assertIsNone(YFinanceMarketDataClient._as_int(float("inf")))
        self.assertEqual(YFinanceMarketDataClient._as_int(1200.0), 1200)

    def test_as_float_rejects_nan_and_inf(self) -> None:
        self.assertIsNone(YFinanceMarketDataClient._as_float(float("nan")))
        self.assertIsNone(YFinanceMarketDataClient._as_float(float("-inf")))
        self.assertEqual(YFinanceMarketDataClient._as_float("11.5"), 11.5)


if __name__ == "__main__":
    unittest.main()
