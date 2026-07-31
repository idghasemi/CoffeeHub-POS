"""Sales reporting endpoints."""

from __future__ import annotations

from collections import defaultdict
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from core.auth import get_current_user
from core.datetime_utils import (
    parse_iso_date,
    tehran_date_range_to_utc,
    tehran_today,
    utc_to_tehran,
)
from database.database import get_db
from models.invoice import Invoice
from models.user import User


router = APIRouter(prefix="/reports", tags=["Reports"])


def _resolve_range(date_from: str | None, date_to: str | None):
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
    if (end_date - start_date).days > 3660:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="بازه گزارش بیش از حد بزرگ است.",
        )
    utc_start, utc_end = tehran_date_range_to_utc(start_date, end_date)
    return start_date, end_date, utc_start, utc_end


@router.get("/sales")
def sales_report(
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Return totals, daily trend and gender/payment breakdowns for a date range."""

    start_date, end_date, utc_start, utc_end = _resolve_range(date_from, date_to)
    invoices = (
        db.query(Invoice)
        .options(joinedload(Invoice.customer))
        .filter(
            Invoice.created_at >= utc_start,
            Invoice.created_at < utc_end,
            Invoice.status == "completed",
        )
        .order_by(Invoice.created_at.asc())
        .all()
    )

    daily: dict[str, dict] = {}
    cursor = start_date
    while cursor <= end_date:
        key = cursor.isoformat()
        daily[key] = {
            "date": key,
            "invoice_count": 0,
            "amount": 0.0,
            "male_invoice_count": 0,
            "male_amount": 0.0,
            "female_invoice_count": 0,
            "female_amount": 0.0,
        }
        cursor += timedelta(days=1)

    gender_totals = {
        "male": {"gender": "male", "invoice_count": 0, "amount": 0.0},
        "female": {"gender": "female", "invoice_count": 0, "amount": 0.0},
        "unknown": {"gender": "unknown", "invoice_count": 0, "amount": 0.0},
    }
    payment_totals: dict[str, dict] = defaultdict(
        lambda: {"invoice_count": 0, "amount": 0.0}
    )
    customer_totals: dict[int, dict] = {}

    total_amount = 0.0
    total_discount = 0.0
    for invoice in invoices:
        amount = float(invoice.payable_amount or 0)
        discount = float(invoice.discount_amount or 0)
        total_amount += amount
        total_discount += discount

        local_date = utc_to_tehran(invoice.created_at).date().isoformat()
        row = daily[local_date]
        row["invoice_count"] += 1
        row["amount"] = round(row["amount"] + amount, 2)

        gender = invoice.customer_gender_snapshot or (
            invoice.customer.gender if invoice.customer else "unknown"
        )
        if gender not in ("male", "female"):
            gender = "unknown"
        gender_totals[gender]["invoice_count"] += 1
        gender_totals[gender]["amount"] = round(
            gender_totals[gender]["amount"] + amount,
            2,
        )
        if gender in ("male", "female"):
            row[f"{gender}_invoice_count"] += 1
            row[f"{gender}_amount"] = round(row[f"{gender}_amount"] + amount, 2)

        payment = payment_totals[invoice.payment_method]
        payment["invoice_count"] += 1
        payment["amount"] = round(payment["amount"] + amount, 2)

        if invoice.customer_id:
            customer = customer_totals.setdefault(
                invoice.customer_id,
                {
                    "customer_id": invoice.customer_id,
                    "customer_name": invoice.customer_name_snapshot or "بدون نام",
                    "invoice_count": 0,
                    "amount": 0.0,
                },
            )
            customer["invoice_count"] += 1
            customer["amount"] = round(customer["amount"] + amount, 2)

    payment_breakdown = [
        {
            "payment_method": method,
            "invoice_count": values["invoice_count"],
            "amount": values["amount"],
        }
        for method, values in sorted(payment_totals.items())
    ]
    top_customers = sorted(
        customer_totals.values(),
        key=lambda item: (item["amount"], item["invoice_count"]),
        reverse=True,
    )[:10]

    return {
        "date_from": start_date.isoformat(),
        "date_to": end_date.isoformat(),
        "summary": {
            "invoice_count": len(invoices),
            "total_amount": round(total_amount, 2),
            "total_discount": round(total_discount, 2),
            "average_invoice_amount": round(total_amount / len(invoices), 2)
            if invoices
            else 0,
        },
        "gender_breakdown": list(gender_totals.values()),
        "payment_breakdown": payment_breakdown,
        "daily_trend": list(daily.values()),
        "top_customers": top_customers,
    }


__all__ = ["router"]
