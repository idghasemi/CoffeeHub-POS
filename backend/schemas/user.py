"""Staff login-account write schemas."""

from pydantic import BaseModel, Field, field_validator

from core.roles import VALID_ROLES


class UserCreate(BaseModel):
    """Fields required for an administrator to create a login account."""

    username: str = Field(min_length=3, max_length=64)
    full_name: str = Field(min_length=1, max_length=160)
    role: str
    password: str = Field(min_length=4, max_length=128)
    is_active: bool = True

    @field_validator("username")
    @classmethod
    def clean_username(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized.replace("_", "").replace("-", "").isalnum():
            raise ValueError("نام کاربری فقط می‌تواند شامل حروف، عدد، خط تیره یا زیرخط باشد.")
        return normalized

    @field_validator("full_name")
    @classmethod
    def clean_full_name(cls, value: str) -> str:
        return " ".join(value.split())

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in VALID_ROLES:
            raise ValueError("نقش کاربری معتبر نیست.")
        return value


class UserUpdate(BaseModel):
    """Editable login-account fields excluding password."""

    username: str | None = Field(default=None, min_length=3, max_length=64)
    full_name: str | None = Field(default=None, min_length=1, max_length=160)
    role: str | None = None
    is_active: bool | None = None

    @field_validator("username")
    @classmethod
    def clean_username(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().lower()
        if not normalized.replace("_", "").replace("-", "").isalnum():
            raise ValueError("نام کاربری فقط می‌تواند شامل حروف، عدد، خط تیره یا زیرخط باشد.")
        return normalized

    @field_validator("full_name")
    @classmethod
    def clean_full_name(cls, value: str | None) -> str | None:
        return " ".join(value.split()) if value is not None else None

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str | None) -> str | None:
        if value is not None and value not in VALID_ROLES:
            raise ValueError("نقش کاربری معتبر نیست.")
        return value


class ResetPasswordRequest(BaseModel):
    """A new password assigned by an administrator."""

    new_password: str = Field(min_length=4, max_length=128)


__all__ = ["ResetPasswordRequest", "UserCreate", "UserUpdate"]
