"""Schema initialization, lightweight SQLite migrations and default seed data."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

import models  # noqa: F401 - registers all model metadata
from core.datetime_utils import tehran_today, utc_now
from core.roles import (
    ROLE_ADMIN,
    ROLE_MEN_SHIFT_SUPERVISOR,
    ROLE_WOMEN_SHIFT_SUPERVISOR,
)
from core.security import hash_password
from database.database import Base, engine
from models.user import User


LEGACY_COLUMNS: dict[str, dict[str, str]] = {
    "categories": {
        "created_at": "DATETIME",
        "updated_at": "DATETIME",
    },
    "products": {
        "created_at": "DATETIME",
        "updated_at": "DATETIME",
    },
    "customers": {
        "created_at": "DATETIME",
        "updated_at": "DATETIME",
    },
    "invoices": {
        "customer_name_snapshot": "VARCHAR(180)",
        "customer_gender_snapshot": "VARCHAR(16)",
        "operator_user_id": "INTEGER",
        "operator_name_snapshot": "VARCHAR(160)",
    },
    "invoice_items": {
        "product_title_snapshot": "VARCHAR(160)",
    },
}

DEFAULT_USERS = (
    {
        "username": "admin",
        "password": "1234",
        "full_name": "مدیر سامانه",
        "role": ROLE_ADMIN,
    },
    {
        "username": "men",
        "password": "1234",
        "full_name": "سرپرست شیفت آقایان",
        "role": ROLE_MEN_SHIFT_SUPERVISOR,
    },
    {
        "username": "women",
        "password": "1234",
        "full_name": "سرپرست شیفت بانوان",
        "role": ROLE_WOMEN_SHIFT_SUPERVISOR,
    },
)


def _add_missing_legacy_columns() -> None:
    """Add columns absent from databases created by the earlier prototype."""

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as connection:
        for table_name, columns in LEGACY_COLUMNS.items():
            if table_name not in existing_tables:
                continue

            existing_columns = {
                column["name"] for column in inspector.get_columns(table_name)
            }
            for column_name, column_type in columns.items():
                if column_name in existing_columns:
                    continue
                connection.execute(
                    text(
                        f'ALTER TABLE "{table_name}" '
                        f'ADD COLUMN "{column_name}" {column_type}'
                    )
                )


def _normalize_legacy_data() -> None:
    """Backfill snapshots and normalize values from the original prototype."""

    timestamp = utc_now().isoformat(sep=" ")
    membership_date = tehran_today().isoformat()

    with engine.begin() as connection:
        connection.execute(
            text(
                "UPDATE customers SET gender = CASE "
                "WHEN gender IN ('خانم', 'زن', 'female', 'F') THEN 'female' "
                "ELSE 'male' END"
            )
        )
        connection.execute(
            text(
                "UPDATE customers SET membership_date = :membership_date "
                "WHERE membership_date IS NULL OR TRIM(membership_date) = ''"
            ),
            {"membership_date": membership_date},
        )

        for table_name in ("categories", "products", "customers"):
            connection.execute(
                text(
                    f"UPDATE {table_name} SET created_at = :timestamp "
                    "WHERE created_at IS NULL"
                ),
                {"timestamp": timestamp},
            )
            connection.execute(
                text(
                    f"UPDATE {table_name} SET updated_at = :timestamp "
                    "WHERE updated_at IS NULL"
                ),
                {"timestamp": timestamp},
            )

        connection.execute(
            text(
                "UPDATE invoices SET invoice_number = id "
                "WHERE invoice_number IS NULL"
            )
        )
        connection.execute(
            text(
                "UPDATE invoices SET customer_name_snapshot = ("
                "SELECT TRIM(customers.first_name || ' ' || customers.last_name) "
                "FROM customers WHERE customers.id = invoices.customer_id"
                ") WHERE customer_name_snapshot IS NULL"
            )
        )
        connection.execute(
            text(
                "UPDATE invoices SET customer_gender_snapshot = ("
                "SELECT customers.gender FROM customers "
                "WHERE customers.id = invoices.customer_id"
                ") WHERE customer_gender_snapshot IS NULL"
            )
        )
        connection.execute(
            text(
                "UPDATE invoice_items SET product_title_snapshot = ("
                "SELECT products.title FROM products "
                "WHERE products.id = invoice_items.product_id"
                ") WHERE product_title_snapshot IS NULL"
            )
        )

        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_invoices_created_at "
                "ON invoices(created_at)"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_invoices_customer_gender_snapshot "
                "ON invoices(customer_gender_snapshot)"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_customers_gender "
                "ON customers(gender)"
            )
        )


def _seed_default_users() -> None:
    """Create the three requested accounts without overwriting changed passwords."""

    with Session(engine) as db:
        for account in DEFAULT_USERS:
            existing = db.query(User).filter(User.username == account["username"]).first()
            if existing is not None:
                continue

            db.add(
                User(
                    username=account["username"],
                    password_hash=hash_password(account["password"]),
                    full_name=account["full_name"],
                    role=account["role"],
                    is_active=True,
                )
            )
        db.commit()


def initialize_database() -> None:
    """Create tables, migrate the legacy schema and seed default accounts."""

    Base.metadata.create_all(bind=engine)
    _add_missing_legacy_columns()
    _normalize_legacy_data()
    _seed_default_users()


__all__ = ["DEFAULT_USERS", "initialize_database"]
