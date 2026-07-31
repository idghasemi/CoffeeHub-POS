"""Category write schemas."""

from pydantic import BaseModel, Field, field_validator


class CategoryCreate(BaseModel):
    """Fields required to create a product category."""

    title: str = Field(min_length=1, max_length=120)
    is_active: bool = True

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return " ".join(value.split())


class CategoryUpdate(BaseModel):
    """Editable product category fields."""

    title: str | None = Field(default=None, min_length=1, max_length=120)
    is_active: bool | None = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str | None) -> str | None:
        return " ".join(value.split()) if value is not None else None


__all__ = ["CategoryCreate", "CategoryUpdate"]
