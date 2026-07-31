"""Atomic point-of-sale checkout and invoice query endpoints."""

from __future__ import annotations

from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String, cast, func, or_
from sqlalchemy.orm import Session, joinedload, selectinload

from core.auth import get_current_user
from core.datetime_utils import parse_iso_date, tehran_date_range_to_utc, tehran_today
from database.database import get_db
from models.customer import Customer
from models.invoice import Invoice
from models.invoice_item import InvoiceItem
from models.product import Product
from models.user import User
from models.wallet_transaction import WalletTransaction
from schemas.invoice import InvoiceCreate
from services.serializers import serialize_invoice


router = APIRouter(prefix="/invoices", tags=["Invoices"])


def _invoice_query(db: Session):
    return db.query(Invoice).options(
        joinedload(Invoice.customer),
        joinedload(Invoice.operator),
        selectinload(Invoice.items).joinedload(InvoiceItem.product),
    )


def _parse_date_range(
    date_from: str | None,
    date_to: str | None,
) -> tuple[date, date, object, object]:
    try:
        start_date = parse_iso_date(date_from, tehran_today())
        end_date = parse_iso_date(date_to, start_date)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="فرمت تاریخ باید به صورت YYYY-MM-DD باشد.",
        ) from exc

    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.",
        )
    utc_start, utc_end = tehran_date_range_to_utc(start_date, end_date)
    return start_date, end_date, utc_start, utc_end


@router.post("", status_code=status.HTTP_201_CREATED)
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Validate stock, calculate server-authoritative totals and create an invoice."""

    customer = db.get(Customer, payload.customer_id)
    if customer is None or not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="مشتری فعال انتخاب‌شده پیدا نشد.",
        )

    quantities: dict[int, float] = defaultdict(float)
    for item in payload.items:
        quantities[item.product_id] += float(item.quantity)

    products = (
        db.query(Product)
        .filter(Product.id.in_(quantities.keys()), Product.is_active.is_(True))
        .all()
    )
    products_by_id = {product.id: product for product in products}
    missing_ids = sorted(set(quantities) - set(products_by_id))
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"برخی محصولات فعال نیستند یا پیدا نشدند: {missing_ids}",
        )

    prepared_items: list[tuple[Product, float, float, float]] = []
    total_amount = 0.0
    for product_id, quantity in quantities.items():
        product = products_by_id[product_id]
        if float(product.stock or 0) < quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"موجودی «{product.title}» کافی نیست. "
                    f"موجودی فعلی: {float(product.stock or 0):g}"
                ),
            )
        unit_price = round(float(product.price or 0), 2)
        line_total = round(unit_price * quantity, 2)
        total_amount = round(total_amount + line_total, 2)
        prepared_items.append((product, quantity, unit_price, line_total))

    discount_amount = round(float(payload.discount_amount or 0), 2)
    if discount_amount > total_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="مبلغ تخفیف نمی‌تواند بیشتر از جمع فاکتور باشد.",
        )
    payable_amount = round(total_amount - discount_amount, 2)

    if payload.payment_method == "wallet" and float(customer.wallet_balance or 0) < payable_amount:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "موجودی کیف پول کافی نیست. "
                f"موجودی فعلی: {float(customer.wallet_balance or 0):,.0f} تومان"
            ),
        )

    try:
        invoice_number = int(db.query(func.max(Invoice.invoice_number)).scalar() or 0) + 1
        invoice = Invoice(
            invoice_number=invoice_number,
            customer_id=customer.id,
            customer_name_snapshot=f"{customer.first_name} {customer.last_name}".strip(),
            customer_gender_snapshot=customer.gender,
            operator_user_id=user.id,
            operator_name_snapshot=user.full_name,
            total_amount=total_amount,
            discount_amount=discount_amount,
            payable_amount=payable_amount,
            payment_method=payload.payment_method,
            status="completed",
        )
        db.add(invoice)
        db.flush()

        for product, quantity, unit_price, line_total in prepared_items:
            product.stock = round(float(product.stock or 0) - quantity, 3)
            db.add(
                InvoiceItem(
                    invoice_id=invoice.id,
                    product_id=product.id,
                    product_title_snapshot=product.title,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=line_total,
                )
            )

        if payload.payment_method == "wallet" and payable_amount > 0:
            customer.wallet_balance = round(
                float(customer.wallet_balance or 0) - payable_amount,
                2,
            )
            db.add(
                WalletTransaction(
                    customer_id=customer.id,
                    invoice_id=invoice.id,
                    created_by_user_id=user.id,
                    transaction_type="purchase",
                    payment_method="wallet",
                    amount=-payable_amount,
                    balance_after=customer.wallet_balance,
                    description=f"پرداخت فاکتور شماره {invoice.invoice_number}",
                )
            )

        db.commit()
    except Exception:
        db.rollback()
        raise

    created_invoice = _invoice_query(db).filter(Invoice.id == invoice.id).one()
    return serialize_invoice(created_invoice, include_items=True)


@router.get("")
def list_invoices(
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    customer_id: int | None = Query(default=None, gt=0),
    gender: str | None = Query(default=None, pattern="^(male|female)$"),
    payment_method: str | None = Query(default=None),
    search: str | None = Query(default=None, max_length=160),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """List invoices using Tehran-local date filters."""

    _start_date, _end_date, utc_start, utc_end = _parse_date_range(date_from, date_to)
    query = _invoice_query(db).filter(
        Invoice.created_at >= utc_start,
        Invoice.created_at < utc_end,
    )
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    if gender:
        query = query.filter(Invoice.customer_gender_snapshot == gender)
    if payment_method:
        query = query.filter(Invoice.payment_method == payment_method)
    if search:
        value = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Invoice.customer_name_snapshot.ilike(value),
                cast(Invoice.invoice_number, String).ilike(value),
            )
        )

    total = query.count()
    invoices = (
        query.order_by(Invoice.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [serialize_invoice(invoice) for invoice in invoices],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{invoice_id}")
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Read invoice details and historical product snapshots."""

    invoice = _invoice_query(db).filter(Invoice.id == invoice_id).first()
    if invoice is None:
        raise HTTPException(status_code=404, detail="فاکتور پیدا نشد.")
    return serialize_invoice(invoice, include_items=True)


__all__ = ["router"]
