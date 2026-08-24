import calendar
from datetime import date, timedelta
from typing import List, Tuple


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


def month_bounds(month_key: str) -> Tuple[date, date]:
    year, month = (int(part) for part in month_key.split("-"))
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last_day)


def previous_month_end(month_key: str) -> date:
    return month_bounds(month_key)[0] - timedelta(days=1)


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
