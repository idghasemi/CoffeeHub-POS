"""Authentication endpoints."""

from __future__ import annotations

import os
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.auth import get_current_session, get_current_user
from core.datetime_utils import utc_now
from core.security import (
    create_access_token,
    hash_access_token,
    hash_password,
    verify_password,
)
from database.database import get_db
from models.user import AuthSession, User
from schemas.auth import ChangePasswordRequest, LoginRequest
from services.serializers import serialize_user


router = APIRouter(prefix="/auth", tags=["Authentication"])
SESSION_HOURS = int(os.getenv("COFFEEHUB_SESSION_HOURS", "16"))


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict:
    """Authenticate a staff account and create a revocable bearer session."""

    user = db.query(User).filter(User.username == payload.username).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="نام کاربری یا رمز عبور نادرست است.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="این حساب کاربری غیرفعال شده است.",
        )

    now = utc_now()
    db.query(AuthSession).filter(AuthSession.expires_at <= now).delete(
        synchronize_session=False
    )

    raw_token = create_access_token()
    auth_session = AuthSession(
        user_id=user.id,
        token_hash=hash_access_token(raw_token),
        expires_at=now + timedelta(hours=SESSION_HOURS),
        created_at=now,
        last_seen_at=now,
    )
    user.last_login_at = now
    db.add(auth_session)
    db.commit()

    return {
        "access_token": raw_token,
        "token_type": "bearer",
        "expires_at": auth_session.expires_at.isoformat() + "Z",
        "user": serialize_user(user),
    }


@router.get("/me")
def read_current_user(user: User = Depends(get_current_user)) -> dict:
    """Return the current account and role defaults."""

    return serialize_user(user)


@router.post("/logout")
def logout(
    session: AuthSession = Depends(get_current_session),
    db: Session = Depends(get_db),
) -> dict:
    """Revoke only the current bearer session."""

    db.delete(session)
    db.commit()
    return {"message": "با موفقیت از حساب خارج شدید."}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    session: AuthSession = Depends(get_current_session),
    db: Session = Depends(get_db),
) -> dict:
    """Change the current password and revoke all other sessions."""

    user = session.user
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز عبور فعلی صحیح نیست.",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز عبور جدید باید با رمز فعلی متفاوت باشد.",
        )

    user.password_hash = hash_password(payload.new_password)
    db.query(AuthSession).filter(
        AuthSession.user_id == user.id,
        AuthSession.id != session.id,
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": "رمز عبور با موفقیت تغییر کرد."}


__all__ = ["router"]
