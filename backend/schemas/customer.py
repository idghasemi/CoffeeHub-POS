"""Customer and wallet write schemas."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from core.validation import clean_optional_text, normalize_gender, normalize_mobile


class CustomerCreate(BaseModel):
    """Fields required to register a customer."""

    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    mobile: str = Field(min_length=10, max_length=32)
    gender: str
    birth_date: str | None = Field(default=None, max_length=16)
    membership_date: str | None = Field(default=None, max_length=16)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool = True

    @field_validator("first_name", "last_name")
    @classmethod
    def clean_names(cls, value: str) -> str:
        return " ".join(value.split())

    @field_validator("mobile")
    @classmethod
    def clean_mobile(cls, value: str) -> str:
        return normalize_mobile(value)

    @field_validator("gender")
    @classmethod
    def clean_gender(cls, value: str) -> str:
        return normalize_gender(value)

    @field_validator("birth_date", "membership_date", "description")
    @classmethod
    def clean_optional_fields(cls, value: str | None) -> str | None:
        return clean_optional_text(value)


class CustomerUpdate(BaseModel):
    """Editable customer fields."""

    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    mobile: str | None = Field(default=None, min_length=10, max_length=32)
    gender: str | None = None
    birth_date: str | None = Field(default=None, max_length=16)
    membership_date: str | None = Field(default=None, max_length=16)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def clean_names(cls, value: str | None) -> str | None:
        return " ".join(value.split()) if value is not None else None

    @field_validator("mobile")
    @classmethod
    def clean_mobile(cls, value: str | None) -> str | None:
        return normalize_mobile(value) if value is not None else None

    @field_validator("gender")
    @classmethod
    def clean_gender(cls, value: str | None) -> str | None:
        return normalize_gender(value) if value is not None else None

    @field_validator("birth_date", "membership_date", "description")
    @classmethod
    def clean_optional_fields(cls, value: str | None) -> str | None:
        return clean_optional_text(value)


class WalletChargeRequest(BaseModel):
    """A positive wallet top-up performed at the cashier."""

    amount: float = Field(gt=0, le=1_000_000_000)
    payment_method: Literal["cash", "card_reader", "card_transfer"]
    description: str | None = Field(default=None, max_length=500)

    @field_validator("description")
    @classmethod
    def clean_description(cls, value: str | None) -> str | None:
        return clean_optional_text(value)


__all__ = ["CustomerCreate", "CustomerUpdate", "WalletChargeRequest"]
