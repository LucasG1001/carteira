from __future__ import annotations

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def resolve_timezone(timezone_name: str):
    try:
        return ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError:
        if timezone_name == "America/Sao_Paulo":
            return timezone(timedelta(hours=-3), name=timezone_name)
        raise


def get_market_datetime(timezone_name: str) -> datetime:
    return datetime.now(resolve_timezone(timezone_name))


def is_market_sync_time(
    timezone_name: str,
    start_hour: int,
    end_hour: int,
    current_time: datetime | None = None,
) -> bool:
    localized_now = current_time or get_market_datetime(timezone_name)

    if localized_now.weekday() > 4:
        return False

    return start_hour <= localized_now.hour <= end_hour
