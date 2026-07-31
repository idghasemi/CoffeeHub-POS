"""Timezone-aware date helpers for Tehran-local business reporting."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo


UTC = timezone.utc
TEHRAN_TIMEZONE = ZoneInfo("Asia/Tehran")


def utc_now() -> datetime:
    """Return the current timezone-naive UTC datetime for SQLite compatibility."""

    return datetime.now(UTC).replace(tzinfo=None)


def tehran_today() -> date:
    """Return today's date in the Tehran timezone."""

    return datetime.now(TEHRAN_TIMEZONE).date()


def parse_iso_date(value: str | None, fallback: date | None = None) -> date:
    """Parse ``YYYY-MM-DD`` or return the provided fallback."""

    if not value:
        if fallback is None:
            raise ValueError("Date is required")
        return fallback
    return date.fromisoformat(value)


def tehran_date_range_to_utc(
    start_date: date,
    end_date: date,
) -> tuple[datetime, datetime]:
    """Convert an inclusive Tehran-local date range to half-open UTC bounds."""

    local_start = datetime.combine(start_date, time.min, TEHRAN_TIMEZONE)
    local_end = datetime.combine(end_date + timedelta(days=1), time.min, TEHRAN_TIMEZONE)

    return (
        local_start.astimezone(UTC).replace(tzinfo=None),
        local_end.astimezone(UTC).replace(tzinfo=None),
    )


def utc_to_tehran(value: datetime) -> datetime:
    """Convert a database UTC datetime to Tehran timezone."""

    aware_value = value.replace(tzinfo=UTC) if value.tzinfo is None else value
    return aware_value.astimezone(TEHRAN_TIMEZONE)


def iso_utc(value: datetime | None) -> str | None:
    """Serialize a UTC datetime with an explicit ``Z`` timezone suffix."""

    if value is None:
        return None
    aware_value = value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
    return aware_value.isoformat().replace("+00:00", "Z")


__all__ = [
    "TEHRAN_TIMEZONE",
    "UTC",
    "iso_utc",
    "parse_iso_date",
    "tehran_date_range_to_utc",
    "tehran_today",
    "utc_now",
    "utc_to_tehran",
]
