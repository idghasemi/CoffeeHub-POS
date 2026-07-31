"""Customer, purchase-history and wallet endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from core.auth import get_current_user
from core.datetime_utils import tehran_today
from database.database import get_db
from models.customer import Customer
from models.invoice import Invoice
from models.user import User
from models.wallet_transaction import WalletTransaction
from schemas.customer import CustomerCreate, CustomerUpdate, WalletChargeRequest
from services.serializers import (
    serialize_customer,
    serialize_invoice,
    serialize_wallet_transaction,
)


router = APIRouter(prefix="/customers", tags=["Customers"])


def _get_customer_or_404(db: Session, customer_id: int) -> Customer:
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="مشتری پیدا نشد.")
    return customer


def _ensure_unique_mobile(
    db: Session,
    mobile: str,
    excluded_customer_id: int | None = None,
) -> None:
    query = db.query(Customer).filter(Customer.mobile == mobile)
    if excluded_customer_id is not None:
        query = query.filter(Customer.id != excluded_customer_id)
    if query.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="مشتری دیگری با این شماره تلفن ثبت شده است.",
        )


@router.get("")
def list_customers(
    search: str | None = Query(default=None, max_length=160),
    gender: str | None = Query(default=None, pattern="^(male|female)$"),
    include_inactive: bool = False,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """List and search customers, optionally filtering by gender."""

    query = db.query(Customer)
    if not include_inactive:
        query = query.filter(Customer.is_active.is_(True))
    if gender:
        query = query.filter(Customer.gender == gender)
    if search:
        value = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Customer.first_name.ilike(value),
                Customer.last_name.ilike(value),
                Customer.mobile.ilike(value),
                (Customer.first_name + " " + Customer.last_name).ilike(value),
            )
        )

    total = query.count()
    customers = (
        query.order_by(Customer.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [serialize_customer(customer) for customer in customers],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Register a customer with an empty wallet."""

    _ensure_unique_mobile(db, payload.mobile)
    values = payload.model_dump()
    values["membership_date"] = values["membership_date"] or tehran_today().isoformat()
    customer = Customer(**values, wallet_balance=0, points=0)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return serialize_customer(customer)


@router.get("/{customer_id}")
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Read one customer."""

    return serialize_customer(_get_customer_or_404(db, customer_id))


@router.put("/{customer_id}")
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Update customer identity and status fields."""

    customer = _get_customer_or_404(db, customer_id)
    changes = payload.model_dump(exclude_unset=True)
    if "mobile" in changes:
        _ensure_unique_mobile(db, changes["mobile"], customer.id)

    for field, value in changes.items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return serialize_customer(customer)


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Soft-delete a customer while retaining invoices and wallet history."""

    customer = _get_customer_or_404(db, customer_id)
    customer.is_active = False
    db.commit()
    return {"message": "مشتری غیرفعال شد و سوابق او حفظ شده است."}


@router.post("/{customer_id}/wallet/charge")
def charge_wallet(
    customer_id: int,
    payload: WalletChargeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Credit a customer's wallet and append an auditable ledger entry."""

    customer = _get_customer_or_404(db, customer_id)
    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="کیف پول مشتری غیرفعال قابل شارژ نیست.",
        )

    amount = round(float(payload.amount), 2)
    customer.wallet_balance = round(float(customer.wallet_balance or 0) + amount, 2)
    transaction = WalletTransaction(
        customer_id=customer.id,
        created_by_user_id=user.id,
        transaction_type="charge",
        payment_method=payload.payment_method,
        amount=amount,
        balance_after=customer.wallet_balance,
        description=payload.description or "شارژ کیف پول توسط صندوق",
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {
        "customer": serialize_customer(customer),
        "transaction": serialize_wallet_transaction(transaction),
        "message": "کیف پول با موفقیت شارژ شد.",
    }


@router.get("/{customer_id}/wallet/transactions")
def list_wallet_transactions(
    customer_id: int,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Return the newest wallet credits and debits for a customer."""

    _get_customer_or_404(db, customer_id)
    transactions = (
        db.query(WalletTransaction)
        .filter(WalletTransaction.customer_id == customer_id)
        .order_by(WalletTransaction.id.desc())
        .limit(limit)
        .all()
    )
    return {
        "items": [
            serialize_wallet_transaction(transaction) for transaction in transactions
        ],
        "total": len(transactions),
    }


@router.get("/{customer_id}/invoices")
def list_customer_invoices(
    customer_id: int,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Return purchase history for a customer."""

    _get_customer_or_404(db, customer_id)
    invoices = (
        db.query(Invoice)
        .options(joinedload(Invoice.customer), joinedload(Invoice.operator))
        .filter(Invoice.customer_id == customer_id)
        .order_by(Invoice.created_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "items": [serialize_invoice(invoice) for invoice in invoices],
        "total": len(invoices),
    }


__all__ = ["router"]
