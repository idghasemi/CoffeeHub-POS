"""Administrator-only employee directory endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from core.auth import require_admin
from database.database import get_db
from models.employee import Employee
from models.user import User
from schemas.employee import EmployeeCreate, EmployeeUpdate
from services.serializers import serialize_employee


router = APIRouter(prefix="/employees", tags=["Employees"])


def _get_employee_or_404(db: Session, employee_id: int) -> Employee:
    employee = db.get(Employee, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="کارمند پیدا نشد.")
    return employee


def _ensure_unique_phone(
    db: Session,
    phone: str | None,
    excluded_employee_id: int | None = None,
) -> None:
    if not phone:
        return
    query = db.query(Employee).filter(Employee.phone == phone)
    if excluded_employee_id is not None:
        query = query.filter(Employee.id != excluded_employee_id)
    if query.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="کارمند دیگری با این شماره تلفن ثبت شده است.",
        )


@router.get("")
def list_employees(
    search: str | None = Query(default=None, max_length=160),
    include_inactive: bool = True,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """List employee profiles independently from login accounts."""

    query = db.query(Employee)
    if not include_inactive:
        query = query.filter(Employee.is_active.is_(True))
    if search:
        value = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Employee.first_name.ilike(value),
                Employee.last_name.ilike(value),
                Employee.phone.ilike(value),
                Employee.position.ilike(value),
            )
        )
    employees = query.order_by(Employee.id.desc()).all()
    return {
        "items": [serialize_employee(employee) for employee in employees],
        "total": len(employees),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """Create a non-login employee profile."""

    _ensure_unique_phone(db, payload.phone)
    employee = Employee(**payload.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return serialize_employee(employee)


@router.put("/{employee_id}")
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """Update an employee profile."""

    employee = _get_employee_or_404(db, employee_id)
    changes = payload.model_dump(exclude_unset=True)
    if "phone" in changes:
        _ensure_unique_phone(db, changes["phone"], employee.id)
    for field, value in changes.items():
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    return serialize_employee(employee)


@router.delete("/{employee_id}")
def deactivate_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """Soft-delete an employee profile."""

    employee = _get_employee_or_404(db, employee_id)
    employee.is_active = False
    db.commit()
    return {"message": "پرونده کارمند غیرفعال شد."}


__all__ = ["router"]
