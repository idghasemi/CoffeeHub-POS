"""Cafe customer and wallet owner model."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.datetime_utils import utc_now
from database.database import Base


class Customer(Base):
    """A gym member/customer whose cafe purchases and wallet are tracked."""

    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(80), nullable=False)
    last_name: Mapped[str] = mapped_column(String(80), nullable=False)
    mobile: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    gender: Mapped[str] = mapped_column(String(16), default="male", nullable=False, index=True)
    birth_date: Mapped[str | None] = mapped_column(String(16), nullable=True)
    wallet_balance: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    membership_date: Mapped[str | None] = mapped_column(String(16), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, default=utc_now, nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        default=utc_now,
        onupdate=utc_now,
        nullable=True,
    )

    invoices: Mapped[list["Invoice"]] = relationship(back_populates="customer")
    wallet_transactions: Mapped[list["WalletTransaction"]] = relationship(
        back_populates="customer",
        cascade="all, delete-orphan",
    )


__all__ = ["Customer"]
