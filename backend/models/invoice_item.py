"""Invoice line-item model."""

from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base


class InvoiceItem(Base):
    """A product snapshot and quantity inside an invoice."""

    __tablename__ = "invoice_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    invoice_id: Mapped[int] = mapped_column(
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True)
    product_title_snapshot: Mapped[str | None] = mapped_column(String(160), nullable=True)
    quantity: Mapped[float] = mapped_column(Float, default=1, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, default=0, nullable=False)

    invoice: Mapped["Invoice"] = relationship(back_populates="items")
    product: Mapped["Product | None"] = relationship()


__all__ = ["InvoiceItem"]
