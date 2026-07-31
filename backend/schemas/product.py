"""Product write schemas."""

from pydantic import BaseModel, Field, field_validator

from core.validation import clean_optional_text


class ProductCreate(BaseModel):
    """Fields required to create a product."""

    title: str = Field(min_length=1, max_length=160)
    barcode: str | None = Field(default=None, max_length=80)
    category_id: int = Field(gt=0)
    price: float = Field(ge=0)
    cost_price: float = Field(default=0, ge=0)
    stock: float = Field(default=0, ge=0)
    unit: str = Field(default="عدد", min_length=1, max_length=32)
    image: str | None = Field(default=None, max_length=500)
    is_active: bool = True

    @field_validator("title", "unit")
    @classmethod
    def clean_required_text(cls, value: str) -> str:
        return " ".join(value.split())

    @field_validator("barcode", "image")
    @classmethod
    def clean_optional_fields(cls, value: str | None) -> str | None:
        return clean_optional_text(value)


class ProductUpdate(BaseModel):
    """Editable product fields."""

    title: str | None = Field(default=None, min_length=1, max_length=160)
    barcode: str | None = Field(default=None, max_length=80)
    category_id: int | None = Field(default=None, gt=0)
    price: float | None = Field(default=None, ge=0)
    cost_price: float | None = Field(default=None, ge=0)
    stock: float | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, min_length=1, max_length=32)
    image: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None

    @field_validator("title", "unit")
    @classmethod
    def clean_required_text(cls, value: str | None) -> str | None:
        return " ".join(value.split()) if value is not None else None

    @field_validator("barcode", "image")
    @classmethod
    def clean_optional_fields(cls, value: str | None) -> str | None:
        return clean_optional_text(value)


__all__ = ["ProductCreate", "ProductUpdate"]
