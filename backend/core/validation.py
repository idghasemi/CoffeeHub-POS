"""Shared normalization helpers for API input."""

from __future__ import annotations

import re


GENDER_ALIASES = {
    "male": "male",
    "m": "male",
    "man": "male",
    "آقا": "male",
    "مرد": "male",
    "female": "female",
    "f": "female",
    "woman": "female",
    "خانم": "female",
    "زن": "female",
}


def normalize_gender(value: str) -> str:
    """Normalize supported Persian and English gender values."""

    normalized = GENDER_ALIASES.get(value.strip().lower())
    if normalized is None:
        raise ValueError("جنسیت باید آقا یا خانم باشد.")
    return normalized


def normalize_mobile(value: str) -> str:
    """Remove formatting from a mobile number and validate its length."""

    normalized = re.sub(r"[^0-9+]", "", value.strip())
    if normalized.startswith("+98"):
        normalized = "0" + normalized[3:]
    elif normalized.startswith("98") and len(normalized) == 12:
        normalized = "0" + normalized[2:]

    if not normalized.isdigit() or len(normalized) < 10 or len(normalized) > 15:
        raise ValueError("شماره تلفن معتبر نیست.")
    return normalized


def clean_optional_text(value: str | None) -> str | None:
    """Trim optional text and convert blank values to ``None``."""

    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


__all__ = ["clean_optional_text", "normalize_gender", "normalize_mobile"]
