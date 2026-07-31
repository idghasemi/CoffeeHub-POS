"""Import every SQLAlchemy model so metadata is complete."""

from models.category import Category
from models.customer import Customer
from models.employee import Employee
from models.invoice import Invoice
from models.invoice_item import InvoiceItem
from models.product import Product
from models.user import AuthSession, User
from models.wallet_transaction import WalletTransaction

__all__ = [
    "AuthSession",
    "Category",
    "Customer",
    "Employee",
    "Invoice",
    "InvoiceItem",
    "Product",
    "User",
    "WalletTransaction",
]
