"""Sellable product model."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.datetime_utils import utc_now
from database.database import Base


class Product(Base):
    """A cafe product with price, category, barcode and stock."""

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    barcode: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    price: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    cost_price: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    stock: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), default="عدد", nullable=False)
    image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, default=utc_now, nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        default=utc_now,
        onupdate=utc_now,
        nullable=True,
    )

    category: Mapped["Category"] = relationship(back_populates="products")


__all__ = ["Product"]
