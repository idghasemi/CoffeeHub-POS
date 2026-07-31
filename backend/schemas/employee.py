"""Employee write schemas."""

from pydantic import BaseModel, Field, field_validator

from core.validation import clean_optional_text, normalize_gender, normalize_mobile


class EmployeeCreate(BaseModel):
    """Fields required to create an employee profile."""

    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    phone: str | None = Field(default=None, max_length=32)
    gender: str
    position: str = Field(min_length=1, max_length=120)
    shift: str | None = Field(default=None, max_length=80)
    hire_date: str | None = Field(default=None, max_length=16)
    salary: float | None = Field(default=None, ge=0)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool = True

    @field_validator("first_name", "last_name", "position")
    @classmethod
    def clean_required_text(cls, value: str) -> str:
        return " ".join(value.split())

    @field_validator("gender")
    @classmethod
    def clean_gender(cls, value: str) -> str:
        return normalize_gender(value)

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, value: str | None) -> str | None:
        return normalize_mobile(value) if value else None

    @field_validator("shift", "hire_date", "description")
    @classmethod
    def clean_optional_fields(cls, value: str | None) -> str | None:
        return clean_optional_text(value)


class EmployeeUpdate(BaseModel):
    """Editable employee fields."""

    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    phone: str | None = Field(default=None, max_length=32)
    gender: str | None = None
    position: str | None = Field(default=None, min_length=1, max_length=120)
    shift: str | None = Field(default=None, max_length=80)
    hire_date: str | None = Field(default=None, max_length=16)
    salary: float | None = Field(default=None, ge=0)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None

    @field_validator("first_name", "last_name", "position")
    @classmethod
    def clean_required_text(cls, value: str | None) -> str | None:
        return " ".join(value.split()) if value is not None else None

    @field_validator("gender")
    @classmethod
    def clean_gender(cls, value: str | None) -> str | None:
        return normalize_gender(value) if value is not None else None

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, value: str | None) -> str | None:
        return normalize_mobile(value) if value else None

    @field_validator("shift", "hire_date", "description")
    @classmethod
    def clean_optional_fields(cls, value: str | None) -> str | None:
        return clean_optional_text(value)


__all__ = ["EmployeeCreate", "EmployeeUpdate"]
