"""FastAPI authentication and authorization dependencies."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session, joinedload

from core.datetime_utils import utc_now
from core.roles import ROLE_ADMIN
from core.security import hash_access_token
from database.database import get_db
from models.user import AuthSession, User


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_session(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AuthSession:
    """Resolve a valid bearer token to its active database session."""

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="برای ادامه وارد حساب کاربری شوید.",
        )

    now = utc_now()
    session = (
        db.query(AuthSession)
        .options(joinedload(AuthSession.user))
        .filter(
            AuthSession.token_hash == hash_access_token(credentials.credentials),
            AuthSession.expires_at > now,
        )
        .first()
    )

    if session is None or not session.user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="نشست شما منقضی یا غیرفعال شده است؛ دوباره وارد شوید.",
        )

    session.last_seen_at = now
    db.commit()
    return session


def get_current_user(
    session: AuthSession = Depends(get_current_session),
) -> User:
    """Return the authenticated active user."""

    return session.user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Restrict an endpoint to the full-access administrator role."""

    if user.role != ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="این بخش فقط در دسترس مدیر سامانه است.",
        )
    return user


__all__ = [
    "bearer_scheme",
    "get_current_session",
    "get_current_user",
    "require_admin",
]
