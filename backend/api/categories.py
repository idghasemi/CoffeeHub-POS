"""Product category management endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from core.auth import get_current_user
from database.database import get_db
from models.category import Category
from models.product import Product
from models.user import User
from schemas.category import CategoryCreate, CategoryUpdate
from services.serializers import serialize_category


router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("")
def list_categories(
    search: str | None = Query(default=None, max_length=120),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """List categories together with active product counts."""

    query = db.query(Category)
    if not include_inactive:
        query = query.filter(Category.is_active.is_(True))
    if search:
        query = query.filter(Category.title.ilike(f"%{search.strip()}%"))

    categories = query.order_by(Category.title.asc()).all()
    counts = dict(
        db.query(Product.category_id, func.count(Product.id))
        .filter(Product.is_active.is_(True))
        .group_by(Product.category_id)
        .all()
    )
    return {
        "items": [
            serialize_category(category, int(counts.get(category.id, 0)))
            for category in categories
        ],
        "total": len(categories),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Create a unique category."""

    duplicate = (
        db.query(Category)
        .filter(func.lower(Category.title) == payload.title.lower())
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="دسته‌بندی دیگری با این نام وجود دارد.",
        )

    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return serialize_category(category, 0)


@router.get("/{category_id}")
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Read one category."""

    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="دسته‌بندی پیدا نشد.")

    product_count = (
        db.query(func.count(Product.id))
        .filter(Product.category_id == category.id, Product.is_active.is_(True))
        .scalar()
        or 0
    )
    return serialize_category(category, int(product_count))


@router.put("/{category_id}")
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Update category fields and enforce unique names."""

    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="دسته‌بندی پیدا نشد.")

    changes = payload.model_dump(exclude_unset=True)
    if "title" in changes:
        duplicate = (
            db.query(Category)
            .filter(
                func.lower(Category.title) == changes["title"].lower(),
                Category.id != category.id,
            )
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="دسته‌بندی دیگری با این نام وجود دارد.",
            )

    for field, value in changes.items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)

    product_count = (
        db.query(func.count(Product.id))
        .filter(Product.category_id == category.id, Product.is_active.is_(True))
        .scalar()
        or 0
    )
    return serialize_category(category, int(product_count))


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Soft-delete a category and its active products while preserving invoices."""

    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="دسته‌بندی پیدا نشد.")

    category.is_active = False
    affected_products = (
        db.query(Product)
        .filter(Product.category_id == category.id, Product.is_active.is_(True))
        .update({Product.is_active: False}, synchronize_session=False)
    )
    db.commit()
    return {
        "message": "دسته‌بندی غیرفعال شد.",
        "deactivated_products": int(affected_products),
    }


__all__ = ["router"]
