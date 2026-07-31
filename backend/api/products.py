"""Product management endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from core.auth import get_current_user
from database.database import get_db
from models.category import Category
from models.product import Product
from models.user import User
from schemas.product import ProductCreate, ProductUpdate
from services.serializers import serialize_product


router = APIRouter(prefix="/products", tags=["Products"])


def _get_category_or_404(db: Session, category_id: int) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="دسته‌بندی انتخاب‌شده پیدا نشد.")
    if not category.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="نمی‌توان محصول را به دسته‌بندی غیرفعال متصل کرد.",
        )
    return category


def _ensure_unique_barcode(
    db: Session,
    barcode: str | None,
    excluded_product_id: int | None = None,
) -> None:
    if not barcode:
        return
    query = db.query(Product).filter(Product.barcode == barcode)
    if excluded_product_id is not None:
        query = query.filter(Product.id != excluded_product_id)
    if query.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="محصول دیگری با این بارکد ثبت شده است.",
        )


@router.get("")
def list_products(
    search: str | None = Query(default=None, max_length=160),
    category_id: int | None = Query(default=None, gt=0),
    include_inactive: bool = False,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """List products with category data and POS-friendly filtering."""

    query = db.query(Product).options(joinedload(Product.category))
    if not include_inactive:
        query = query.filter(Product.is_active.is_(True))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if low_stock_only:
        query = query.filter(Product.stock <= 5)
    if search:
        value = f"%{search.strip()}%"
        query = query.filter(or_(Product.title.ilike(value), Product.barcode.ilike(value)))

    products = query.order_by(Product.title.asc()).all()
    return {
        "items": [serialize_product(product) for product in products],
        "total": len(products),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Create a validated product."""

    _get_category_or_404(db, payload.category_id)
    _ensure_unique_barcode(db, payload.barcode)

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    product = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product.id)
        .one()
    )
    return serialize_product(product)


@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Read one product."""

    product = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product_id)
        .first()
    )
    if product is None:
        raise HTTPException(status_code=404, detail="محصول پیدا نشد.")
    return serialize_product(product)


@router.put("/{product_id}")
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Update a product and revalidate category and barcode references."""

    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="محصول پیدا نشد.")

    changes = payload.model_dump(exclude_unset=True)
    if "category_id" in changes:
        _get_category_or_404(db, changes["category_id"])
    if "barcode" in changes:
        _ensure_unique_barcode(db, changes["barcode"], product.id)

    for field, value in changes.items():
        setattr(product, field, value)
    db.commit()

    product = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product.id)
        .one()
    )
    return serialize_product(product)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Soft-delete a product without breaking historical invoice items."""

    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="محصول پیدا نشد.")
    product.is_active = False
    db.commit()
    return {"message": "محصول غیرفعال شد."}


__all__ = ["router"]
