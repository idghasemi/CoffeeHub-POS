"""Role constants and role-specific defaults."""

from __future__ import annotations


ROLE_ADMIN = "admin"
ROLE_MEN_SHIFT_SUPERVISOR = "men_shift_supervisor"
ROLE_WOMEN_SHIFT_SUPERVISOR = "women_shift_supervisor"

ROLE_LABELS = {
    ROLE_ADMIN: "مدیر سامانه",
    ROLE_MEN_SHIFT_SUPERVISOR: "سرپرست شیفت آقایان",
    ROLE_WOMEN_SHIFT_SUPERVISOR: "سرپرست شیفت بانوان",
}

ROLE_DEFAULT_GENDERS = {
    ROLE_ADMIN: None,
    ROLE_MEN_SHIFT_SUPERVISOR: "male",
    ROLE_WOMEN_SHIFT_SUPERVISOR: "female",
}

VALID_ROLES = frozenset(ROLE_LABELS)


def role_label(role: str) -> str:
    """Return a Persian label for a role code."""

    return ROLE_LABELS.get(role, role)


def default_customer_gender(role: str) -> str | None:
    """Return the default customer filter associated with a role."""

    return ROLE_DEFAULT_GENDERS.get(role)


__all__ = [
    "ROLE_ADMIN",
    "ROLE_DEFAULT_GENDERS",
    "ROLE_LABELS",
    "ROLE_MEN_SHIFT_SUPERVISOR",
    "ROLE_WOMEN_SHIFT_SUPERVISOR",
    "VALID_ROLES",
    "default_customer_gender",
    "role_label",
]
