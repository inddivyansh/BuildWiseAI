"""
BuildWise AI — FastAPI Application Factory

Creates and configures the FastAPI application with:
- Middleware (CORS, logging)
- Exception handlers
- API routers
- Startup / shutdown events
"""

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import check_database_connection, get_engine
from app.logging_config import get_logger, setup_logging

# ─── Setup logging before anything else ───────────────────
setup_logging()
logger = get_logger(__name__)


# ─── Lifespan (startup / shutdown) ────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.
    - Startup: verify DB, storage, LLM connectivity
    - Shutdown: close DB engine, cleanup
    """
    settings = get_settings()
    logger.info(
        "BuildWise AI starting up",
        env=settings.app_env,
        version=settings.app_version,
        debug=settings.debug,
    )

    # Verify storage directory
    storage_path = settings.storage_path
    storage_path.mkdir(parents=True, exist_ok=True)
    logger.info("Storage directory ready", path=str(storage_path))

    # Verify database connection (warn but don't fail startup)
    db_ok = await check_database_connection()
    if not db_ok:
        logger.warning(
            "Database connection failed at startup — check DATABASE_URL. "
            "Application will start but API calls requiring DB will fail."
        )
    else:
        logger.info("Database connection verified")

    # Verify LLM availability (non-blocking)
    if settings.llm_available:
        logger.info(
            "Gemini LLM configured",
            model_1=settings.gemini_model_1,
            model_2=settings.gemini_model_2,
            model_3=settings.gemini_model_3,
        )
    else:
        logger.warning(
            "GEMINI_API_KEY not set — LLM features will be disabled. "
            "Compliance analysis will still work without AI explanations."
        )

    logger.info("BuildWise AI startup complete")

    yield  # Application runs here

    # Shutdown
    logger.info("BuildWise AI shutting down")
    engine = get_engine()
    await engine.dispose()
    logger.info("Database connections closed")


# ─── Application Factory ──────────────────────────────────
def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    Called once at module import time (see bottom of this file).
    """
    settings = get_settings()

    app = FastAPI(
        title="BuildWise AI",
        description=(
            "Intelligent Architectural Analysis and Regulatory Compliance Screening Platform. "
            "Upload architectural floor plans, extract spatial structure, and analyze "
            "against building regulations."
        ),
        version=settings.app_version,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url="/openapi.json" if settings.debug else None,
        lifespan=lifespan,
    )

    # ─── CORS ─────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # ─── Exception Handlers ───────────────────────────────
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "Unhandled exception",
            path=str(request.url),
            method=request.method,
            error=str(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again.",
            },
        )

    # ─── Health Routes (no prefix) ────────────────────────
    from app.api.v1.health import router as health_router
    app.include_router(health_router, tags=["Health"])

    # ─── API v1 Routes ────────────────────────────────────
    from app.api.router import api_router
    app.include_router(api_router, prefix=settings.api_prefix)

    logger.info(
        "FastAPI application created",
        api_prefix=settings.api_prefix,
        cors_origins=settings.cors_origins_list,
    )

    return app


# ─── Application Instance ─────────────────────────────────
# This is what uvicorn imports: uvicorn app.main:app
app = create_app()
