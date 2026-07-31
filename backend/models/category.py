"""Product category model."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.datetime_utils import utc_now
from database.database import Base


class Category(Base):
    """A logical group used to organize products in the point of sale."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, default=utc_now, nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        default=utc_now,
        onupdate=utc_now,
        nullable=True,
    )

    products: Mapped[list["Product"]] = relationship(back_populates="category")


__all__ = ["Category"]
