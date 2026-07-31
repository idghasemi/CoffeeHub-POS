"""Non-login employee records managed by administrators."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from core.datetime_utils import utc_now
from database.database import Base


class Employee(Base):
    """A cafe employee profile independent from application login accounts."""

    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(80), nullable=False)
    last_name: Mapped[str] = mapped_column(String(80), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    gender: Mapped[str] = mapped_column(String(16), nullable=False, default="male")
    position: Mapped[str] = mapped_column(String(120), nullable=False)
    shift: Mapped[str | None] = mapped_column(String(80), nullable=True)
    hire_date: Mapped[str | None] = mapped_column(String(16), nullable=True)
    salary: Mapped[float | None] = mapped_column(Float, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )


__all__ = ["Employee"]
