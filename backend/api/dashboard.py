"""Dashboard summary endpoint."""

from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from core.auth import get_current_user
from core.datetime_utils import tehran_date_range_to_utc, tehran_today, utc_to_tehran
from database.database import get_db
from models.category import Category
from models.customer import Customer
from models.invoice import Invoice
from models.product import Product
from models.user import User
from services.serializers import serialize_invoice, serialize_product


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Return current-day KPIs, recent invoices and the seven-day sales trend."""

    today = tehran_today()
    today_start, today_end = tehran_date_range_to_utc(today, today)
    week_start_date = today - timedelta(days=6)
    week_start, week_end = tehran_date_range_to_utc(week_start_date, today)

    today_invoices = (
        db.query(Invoice)
        .filter(
            Invoice.created_at >= today_start,
            Invoice.created_at < today_end,
            Invoice.status == "completed",
        )
        .all()
    )
    today_amount = round(
        sum(float(invoice.payable_amount or 0) for invoice in today_invoices),
        2,
    )

    week_invoices = (
        db.query(Invoice)
        .filter(
            Invoice.created_at >= week_start,
            Invoice.created_at < week_end,
            Invoice.status == "completed",
        )
        .order_by(Invoice.created_at.asc())
        .all()
    )
    trend = {}
    cursor = week_start_date
    while cursor <= today:
        trend[cursor.isoformat()] = {
            "date": cursor.isoformat(),
            "invoice_count": 0,
            "amount": 0.0,
        }
        cursor += timedelta(days=1)
    for invoice in week_invoices:
        key = utc_to_tehran(invoice.created_at).date().isoformat()
        trend[key]["invoice_count"] += 1
        trend[key]["amount"] = round(
            trend[key]["amount"] + float(invoice.payable_amount or 0),
            2,
        )

    recent_invoices = (
        db.query(Invoice)
        .options(joinedload(Invoice.customer), joinedload(Invoice.operator))
        .order_by(Invoice.created_at.desc())
        .limit(8)
        .all()
    )
    low_stock_products = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.is_active.is_(True), Product.stock <= 5)
        .order_by(Product.stock.asc(), Product.title.asc())
        .limit(10)
        .all()
    )

    gender_stats = {
        "male": {"invoice_count": 0, "amount": 0.0},
        "female": {"invoice_count": 0, "amount": 0.0},
    }
    for invoice in today_invoices:
        gender = invoice.customer_gender_snapshot
        if gender in gender_stats:
            gender_stats[gender]["invoice_count"] += 1
            gender_stats[gender]["amount"] = round(
                gender_stats[gender]["amount"]
                + float(invoice.payable_amount or 0),
                2,
            )

    return {
        "today": {
            "invoice_count": len(today_invoices),
            "total_amount": today_amount,
            "average_invoice_amount": round(today_amount / len(today_invoices), 2)
            if today_invoices
            else 0,
        },
        "counts": {
            "active_customers": db.query(func.count(Customer.id))
            .filter(Customer.is_active.is_(True))
            .scalar()
            or 0,
            "active_products": db.query(func.count(Product.id))
            .filter(Product.is_active.is_(True))
            .scalar()
            or 0,
            "active_categories": db.query(func.count(Category.id))
            .filter(Category.is_active.is_(True))
            .scalar()
            or 0,
            "low_stock_products": db.query(func.count(Product.id))
            .filter(Product.is_active.is_(True), Product.stock <= 5)
            .scalar()
            or 0,
        },
        "wallet_total": float(
            db.query(func.coalesce(func.sum(Customer.wallet_balance), 0))
            .filter(Customer.is_active.is_(True))
            .scalar()
            or 0
        ),
        "gender_stats": gender_stats,
        "sales_trend": list(trend.values()),
        "recent_invoices": [serialize_invoice(invoice) for invoice in recent_invoices],
        "low_stock_products": [
            serialize_product(product) for product in low_stock_products
        ],
    }


__all__ = ["router"]
