"""Customer wallet transaction ledger."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.datetime_utils import utc_now
from database.database import Base


class WalletTransaction(Base):
    """An append-only wallet credit or debit record."""

    __tablename__ = "wallet_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    invoice_id: Mapped[int | None] = mapped_column(ForeignKey("invoices.id"), nullable=True, index=True)
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    transaction_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    payment_method: Mapped[str | None] = mapped_column(String(32), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    balance_after: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False, index=True)

    customer: Mapped["Customer"] = relationship(back_populates="wallet_transactions")
    invoice: Mapped["Invoice | None"] = relationship()
    created_by: Mapped["User | None"] = relationship()


__all__ = ["WalletTransaction"]
