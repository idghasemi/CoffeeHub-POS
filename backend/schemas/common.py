"""Common API schemas."""

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """A simple localized success response."""

    message: str


__all__ = ["MessageResponse"]
