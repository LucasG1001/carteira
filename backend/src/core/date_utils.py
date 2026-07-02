from datetime import date
from typing import List


def last_months(count: int) -> List[str]:
    today = date.today()
    year, month = today.year, today.month
    months: List[str] = []
    for _ in range(count):
        months.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    months.reverse()
    return months


def months_between(start: date, end: date) -> List[str]:
    months: List[str] = []
    year, month = start.year, start.month
    while (year, month) <= (end.year, end.month):
        months.append(f"{year:04d}-{month:02d}")
        month += 1
        if month == 13:
            month = 1
            year += 1
    return months
