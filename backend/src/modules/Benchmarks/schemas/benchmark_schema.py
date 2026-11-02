from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Optional

from pydantic import BaseModel

CDI_SERIES = "CDI"
IPCA_SERIES = "IPCA"
IBOV_TICKER = "^BVSP"

# Códigos SGS do Banco Central: 12 = CDI diário (% a.d.), 433 = IPCA mensal (% a.m., datado no dia 1).
SGS_CODES = {CDI_SERIES: 12, IPCA_SERIES: 433}


@dataclass(frozen=True)
class RateRecord:
    series: str
    date: date
    value: float


class BenchmarkMonth(BaseModel):
    month: str
    cdi: Optional[float] = None
    ipca: Optional[float] = None
    ibov: Optional[float] = None
