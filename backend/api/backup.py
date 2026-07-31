"""Administrator-only SQLite backup and restore endpoints."""

from __future__ import annotations

import hashlib
import os
import sqlite3
import tempfile
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from core.auth import require_admin
from database.database import DATABASE_PATH, engine
from database.initialization import initialize_database
from models.user import User


router = APIRouter(prefix="/backup", tags=["Backup"])
MAX_BACKUP_BYTES = 500 * 1024 * 1024
REQUIRED_TABLES = {
    "users",
    "customers",
    "products",
    "categories",
    "invoices",
    "invoice_items",
}


def _remove_file(path: str) -> None:
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


def _create_consistent_backup(destination: Path) -> None:
    source = sqlite3.connect(DATABASE_PATH)
    target = sqlite3.connect(destination)
    try:
        source.backup(target)
    finally:
        target.close()
        source.close()


def _validate_backup(path: Path) -> None:
    try:
        with path.open("rb") as file:
            if file.read(16) != b"SQLite format 3\x00":
                raise ValueError("invalid-header")
        connection = sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True)
        try:
            integrity = connection.execute("PRAGMA integrity_check").fetchone()
            if not integrity or integrity[0] != "ok":
                raise ValueError("integrity-check")
            tables = {
                row[0]
                for row in connection.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                ).fetchall()
            }
            if not REQUIRED_TABLES.issubset(tables):
                raise ValueError("missing-tables")
        finally:
            connection.close()
    except (sqlite3.DatabaseError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="فایل انتخاب‌شده نسخه پشتیبان معتبر CoffeeHub نیست.",
        ) from exc


@router.get("/download")
def download_backup(_admin: User = Depends(require_admin)) -> FileResponse:
    """Download a transactionally consistent database snapshot."""

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    file_descriptor, temp_name = tempfile.mkstemp(
        prefix=f"coffeehub-backup-{timestamp}-",
        suffix=".db",
    )
    os.close(file_descriptor)
    temp_path = Path(temp_name)
    _create_consistent_backup(temp_path)

    return FileResponse(
        path=temp_path,
        media_type="application/vnd.sqlite3",
        filename=f"coffeehub-backup-{timestamp}.db",
        background=BackgroundTask(_remove_file, str(temp_path)),
    )


@router.post("/restore")
async def restore_backup(
    file: UploadFile = File(...),
    _admin: User = Depends(require_admin),
) -> dict:
    """Validate and restore a backup, preserving an emergency pre-restore copy."""

    if not file.filename:
        raise HTTPException(status_code=400, detail="فایل نسخه پشتیبان انتخاب نشده است.")

    descriptor, upload_name = tempfile.mkstemp(prefix="coffeehub-restore-", suffix=".db")
    os.close(descriptor)
    upload_path = Path(upload_name)

    try:
        size = 0
        with upload_path.open("wb") as destination:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_BACKUP_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="حجم فایل نسخه پشتیبان بیش از حد مجاز است.",
                    )
                destination.write(chunk)

        _validate_backup(upload_path)

        emergency_path = DATABASE_PATH.with_name(
            f"coffeehub-before-restore-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"
        )
        _create_consistent_backup(emergency_path)

        engine.dispose()
        source = sqlite3.connect(upload_path)
        target = sqlite3.connect(DATABASE_PATH)
        try:
            source.backup(target)
        finally:
            target.close()
            source.close()

        initialize_database()
        checksum = hashlib.sha256(upload_path.read_bytes()).hexdigest()
        return {
            "message": "نسخه پشتیبان با موفقیت بازگردانی شد. لطفاً دوباره وارد شوید.",
            "restored_filename": file.filename,
            "sha256": checksum,
            "emergency_backup": emergency_path.name,
        }
    finally:
        await file.close()
        _remove_file(str(upload_path))


__all__ = ["router"]
