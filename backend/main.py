"""CoffeeHub FastAPI application entry point."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from api.auth import router as auth_router
from api.backup import router as backup_router
from api.categories import router as category_router
from api.customers import router as customer_router
from api.dashboard import router as dashboard_router
from api.employees import router as employee_router
from api.invoices import router as invoice_router
from api.products import router as product_router
from api.reports import router as report_router
from api.users import router as user_router
from database.initialization import initialize_database


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Initialize and migrate the SQLite database before accepting requests."""
    initialize_database()
    yield


app = FastAPI(
    title="CoffeeHub API",
    description="سامانه صندوق و مدیریت کافی‌شاپ باشگاه ورزشی",
    version="2.0.0",
    lifespan=lifespan,
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "COFFEEHUB_CORS_ORIGINS",
        "http://localhost:5173,"
        "http://127.0.0.1:5173,"
        "http://localhost:4173,"
        "http://127.0.0.1:4173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request,
    exception: RequestValidationError,
) -> JSONResponse:
    """Return validation details in a frontend-friendly envelope."""

    errors = []

    for error in exception.errors():
        location = ".".join(str(part) for part in error.get("loc", [])[1:])
        errors.append(
            {
                "field": location,
                "message": error.get("msg", "مقدار واردشده معتبر نیست."),
                "type": error.get("type"),
            }
        )

    return JSONResponse(
        status_code=422,
        content={
            "detail": "برخی اطلاعات واردشده معتبر نیستند.",
            "errors": errors,
        },
    )


for router in (
    auth_router,
    dashboard_router,
    customer_router,
    category_router,
    product_router,
    invoice_router,
    report_router,
    user_router,
    employee_router,
    backup_router,
):
    app.include_router(router, prefix="/api")


# -----------------------------
# Frontend (React/Vite)
# -----------------------------

import sys

if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys.executable).parent
    FRONTEND_DIST = BASE_DIR / "frontend"

else:
    BASE_DIR = Path(__file__).resolve().parent

    if (BASE_DIR / "frontend" / "dist").exists():
        FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
    else:
        FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

assets_dir = FRONTEND_DIST / "assets"

if assets_dir.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=assets_dir),
        name="assets",
    )


@app.get("/", include_in_schema=False)
def index():
    index_file = FRONTEND_DIST / "index.html"

    if index_file.exists():
        return FileResponse(index_file)

    return {
        "status": "ok",
        "project": "CoffeeHub",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
def health() -> dict:
    """Return an unauthenticated health check for installers and monitoring."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
    )


__all__ = ["app"]