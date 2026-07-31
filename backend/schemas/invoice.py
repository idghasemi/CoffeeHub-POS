"""Invoice creation schemas."""

from typing import Literal

from pydantic import BaseModel, Field


class InvoiceItemCreate(BaseModel):
    """A requested product quantity; prices are always read from the server."""

    product_id: int = Field(gt=0)
    quantity: float = Field(gt=0, le=10_000)


class InvoiceCreate(BaseModel):
    """A complete point-of-sale checkout request."""

    customer_id: int = Field(gt=0)
    items: list[InvoiceItemCreate] = Field(min_length=1, max_length=100)
    discount_amount: float = Field(default=0, ge=0, le=1_000_000_000)
    payment_method: Literal["cash", "card_reader", "card_transfer", "wallet"]


__all__ = ["InvoiceCreate", "InvoiceItemCreate"]
