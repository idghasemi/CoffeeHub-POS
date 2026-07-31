"""Database engine and session configuration for CoffeeHub."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DATABASE_PATH = BACKEND_DIR / "database" / "coffeehub.db"
DATABASE_PATH = Path(
    os.getenv("COFFEEHUB_DATABASE_PATH", str(DEFAULT_DATABASE_PATH))
).expanduser().resolve()
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"


class Base(DeclarativeBase):
    """Base class shared by every SQLAlchemy model."""


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
    pool_pre_ping=True,
)


@event.listens_for(Engine, "connect")
def configure_sqlite_connection(dbapi_connection, _connection_record) -> None:
    """Enable integrity and concurrency pragmas on each SQLite connection."""

    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA busy_timeout=30000")
    cursor.close()


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """Yield one database session for a request and always close it."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


__all__ = [
    "Base",
    "DATABASE_PATH",
    "DATABASE_URL",
    "SessionLocal",
    "engine",
    "get_db",
]
