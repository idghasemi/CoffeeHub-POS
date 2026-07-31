"""Administrator-only login account management endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.auth import require_admin
from core.roles import ROLE_ADMIN
from core.security import hash_password
from database.database import get_db
from models.user import AuthSession, User
from schemas.user import ResetPasswordRequest, UserCreate, UserUpdate
from services.serializers import serialize_user


router = APIRouter(prefix="/users", tags=["Users"])


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="کاربر پیدا نشد.")
    return user


def _ensure_unique_username(
    db: Session,
    username: str,
    excluded_user_id: int | None = None,
) -> None:
    query = db.query(User).filter(func.lower(User.username) == username.lower())
    if excluded_user_id is not None:
        query = query.filter(User.id != excluded_user_id)
    if query.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="این نام کاربری قبلاً استفاده شده است.",
        )


def _active_admin_count(db: Session) -> int:
    return int(
        db.query(func.count(User.id))
        .filter(User.role == ROLE_ADMIN, User.is_active.is_(True))
        .scalar()
        or 0
    )


@router.get("")
def list_users(
    include_inactive: bool = Query(default=True),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """List all login accounts for administrator management."""

    query = db.query(User)
    if not include_inactive:
        query = query.filter(User.is_active.is_(True))
    users = query.order_by(User.id.asc()).all()
    return {"items": [serialize_user(user) for user in users], "total": len(users)}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """Create a new role-based login account."""

    _ensure_unique_username(db, payload.username)
    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict:
    """Update username, display name, role or active status safely."""

    user = _get_user_or_404(db, user_id)
    changes = payload.model_dump(exclude_unset=True)
    if "username" in changes:
        _ensure_unique_username(db, changes["username"], user.id)

    removes_last_admin = (
        user.role == ROLE_ADMIN
        and user.is_active
        and (
            changes.get("role", user.role) != ROLE_ADMIN
            or changes.get("is_active", user.is_active) is False
        )
        and _active_admin_count(db) <= 1
    )
    if removes_last_admin:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="حداقل یک مدیر فعال باید در سامانه باقی بماند.",
        )
    if user.id == admin.id and changes.get("is_active") is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="مدیر نمی‌تواند حساب جاری خود را غیرفعال کند.",
        )

    for field, value in changes.items():
        setattr(user, field, value)
    if changes.get("is_active") is False:
        db.query(AuthSession).filter(AuthSession.user_id == user.id).delete(
            synchronize_session=False
        )
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.delete("/{user_id}")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict:
    """Deactivate a login account and revoke all of its sessions."""

    user = _get_user_or_404(db, user_id)
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="مدیر نمی‌تواند حساب جاری خود را حذف کند.",
        )
    if user.role == ROLE_ADMIN and user.is_active and _active_admin_count(db) <= 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="حداقل یک مدیر فعال باید در سامانه باقی بماند.",
        )

    user.is_active = False
    db.query(AuthSession).filter(AuthSession.user_id == user.id).delete(
        synchronize_session=False
    )
    db.commit()
    return {"message": "حساب کاربری غیرفعال شد."}


@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: int,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """Assign a replacement password and revoke existing sessions."""

    user = _get_user_or_404(db, user_id)
    user.password_hash = hash_password(payload.new_password)
    db.query(AuthSession).filter(AuthSession.user_id == user.id).delete(
        synchronize_session=False
    )
    db.commit()
    return {"message": f"رمز عبور کاربر «{user.username}» تغییر کرد."}


__all__ = ["router"]
