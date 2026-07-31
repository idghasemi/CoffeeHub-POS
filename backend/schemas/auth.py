"""Authentication request schemas."""

from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    """Credentials submitted by the login page."""

    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()


class ChangePasswordRequest(BaseModel):
    """Current and replacement password for self-service changes."""

    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=4, max_length=128)


__all__ = ["ChangePasswordRequest", "LoginRequest"]
