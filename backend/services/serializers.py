"""Stable API serializers independent from SQLAlchemy internals."""

from __future__ import annotations

from core.datetime_utils import iso_utc, utc_to_tehran
from core.roles import default_customer_gender, role_label
from models.category import Category
from models.customer import Customer
from models.employee import Employee
from models.invoice import Invoice
from models.invoice_item import InvoiceItem
from models.product import Product
from models.user import User
from models.wallet_transaction import WalletTransaction


def serialize_user(user: User) -> dict:
    """Serialize a staff account without exposing password data."""

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "role_label": role_label(user.role),
        "default_customer_gender": default_customer_gender(user.role),
        "is_active": user.is_active,
        "created_at": iso_utc(user.created_at),
        "updated_at": iso_utc(user.updated_at),
        "last_login_at": iso_utc(user.last_login_at),
    }


def serialize_employee(employee: Employee) -> dict:
    """Serialize an employee profile."""

    return {
        "id": employee.id,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "full_name": f"{employee.first_name} {employee.last_name}".strip(),
        "phone": employee.phone,
        "gender": employee.gender,
        "position": employee.position,
        "shift": employee.shift,
        "hire_date": employee.hire_date,
        "salary": employee.salary,
        "description": employee.description,
        "is_active": employee.is_active,
        "created_at": iso_utc(employee.created_at),
        "updated_at": iso_utc(employee.updated_at),
    }


def serialize_category(category: Category, product_count: int | None = None) -> dict:
    """Serialize a product category and optional product count."""

    result = {
        "id": category.id,
        "title": category.title,
        "is_active": category.is_active,
        "created_at": iso_utc(category.created_at),
        "updated_at": iso_utc(category.updated_at),
    }
    if product_count is not None:
        result["product_count"] = product_count
    return result


def serialize_product(product: Product) -> dict:
    """Serialize a product together with its category label."""

    return {
        "id": product.id,
        "title": product.title,
        "barcode": product.barcode,
        "category_id": product.category_id,
        "category_title": product.category.title if product.category else None,
        "price": float(product.price or 0),
        "cost_price": float(product.cost_price or 0),
        "stock": float(product.stock or 0),
        "unit": product.unit,
        "image": product.image,
        "is_active": product.is_active,
        "created_at": iso_utc(product.created_at),
        "updated_at": iso_utc(product.updated_at),
    }


def serialize_customer(customer: Customer) -> dict:
    """Serialize a customer and current wallet balance."""

    return {
        "id": customer.id,
        "first_name": customer.first_name,
        "last_name": customer.last_name,
        "full_name": f"{customer.first_name} {customer.last_name}".strip(),
        "mobile": customer.mobile,
        "gender": customer.gender,
        "birth_date": customer.birth_date,
        "wallet_balance": float(customer.wallet_balance or 0),
        "points": int(customer.points or 0),
        "membership_date": customer.membership_date,
        "description": customer.description,
        "is_active": customer.is_active,
        "created_at": iso_utc(customer.created_at),
        "updated_at": iso_utc(customer.updated_at),
    }


def serialize_invoice_item(item: InvoiceItem) -> dict:
    """Serialize a historical invoice item using snapshot data."""

    return {
        "id": item.id,
        "product_id": item.product_id,
        "product_title": item.product_title_snapshot
        or (item.product.title if item.product else "محصول حذف‌شده"),
        "quantity": float(item.quantity or 0),
        "unit_price": float(item.unit_price or 0),
        "total_price": float(item.total_price or 0),
    }


def serialize_invoice(invoice: Invoice, include_items: bool = False) -> dict:
    """Serialize an invoice header and optionally all line items."""

    local_created_at = utc_to_tehran(invoice.created_at)
    result = {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "customer_id": invoice.customer_id,
        "customer_name": invoice.customer_name_snapshot
        or (
            f"{invoice.customer.first_name} {invoice.customer.last_name}".strip()
            if invoice.customer
            else "مشتری حذف‌شده"
        ),
        "customer_gender": invoice.customer_gender_snapshot
        or (invoice.customer.gender if invoice.customer else None),
        "operator_user_id": invoice.operator_user_id,
        "operator_name": invoice.operator_name_snapshot
        or (invoice.operator.full_name if invoice.operator else None),
        "total_amount": float(invoice.total_amount or 0),
        "discount_amount": float(invoice.discount_amount or 0),
        "payable_amount": float(invoice.payable_amount or 0),
        "payment_method": invoice.payment_method,
        "status": invoice.status,
        "created_at": iso_utc(invoice.created_at),
        "local_date": local_created_at.date().isoformat(),
        "local_time": local_created_at.strftime("%H:%M:%S"),
    }
    if include_items:
        result["items"] = [serialize_invoice_item(item) for item in invoice.items]
    return result


def serialize_wallet_transaction(transaction: WalletTransaction) -> dict:
    """Serialize a wallet ledger entry."""

    return {
        "id": transaction.id,
        "customer_id": transaction.customer_id,
        "invoice_id": transaction.invoice_id,
        "created_by_user_id": transaction.created_by_user_id,
        "transaction_type": transaction.transaction_type,
        "payment_method": transaction.payment_method,
        "amount": float(transaction.amount or 0),
        "balance_after": float(transaction.balance_after or 0),
        "description": transaction.description,
        "created_at": iso_utc(transaction.created_at),
    }


__all__ = [
    "serialize_category",
    "serialize_customer",
    "serialize_employee",
    "serialize_invoice",
    "serialize_invoice_item",
    "serialize_product",
    "serialize_user",
    "serialize_wallet_transaction",
]
