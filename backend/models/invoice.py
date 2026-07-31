"""Invoice header model."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.datetime_utils import utc_now
from database.database import Base


class Invoice(Base):
    """An immutable completed point-of-sale transaction."""

    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    invoice_number: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    customer_id: Mapped[int | None] = mapped_column(
        ForeignKey("customers.id"),
        nullable=True,
        index=True,
    )
    customer_name_snapshot: Mapped[str | None] = mapped_column(String(180), nullable=True)
    customer_gender_snapshot: Mapped[str | None] = mapped_column(String(16), nullable=True, index=True)
    operator_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    operator_name_snapshot: Mapped[str | None] = mapped_column(String(160), nullable=True)
    total_amount: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    payable_amount: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(32), default="cash", nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="completed", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False, index=True)

    customer: Mapped["Customer | None"] = relationship(back_populates="invoices")
    operator: Mapped["User | None"] = relationship()
    items: Mapped[list["InvoiceItem"]] = relationship(
        back_populates="invoice",
        cascade="all, delete-orphan",
        order_by="InvoiceItem.id",
    )


__all__ = ["Invoice"]
