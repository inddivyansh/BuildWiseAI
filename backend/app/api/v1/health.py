"""Health check endpoints — /health and /health/ready"""

import time
from datetime import UTC, datetime

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import check_database_connection
from app.logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Track startup time for uptime calculation
_start_time = time.time()


@router.get("/health", summary="Liveness check")
async def health_liveness():
    """
    Liveness probe — always returns 200 if the process is running.
    Used by Docker and load balancers to determine if the container is alive.
    Does NOT check dependencies (database, etc.).
    """
    settings = get_settings()
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "env": settings.app_env,
        "timestamp": datetime.now(UTC).isoformat(),
        "uptime_seconds": round(time.time() - _start_time, 1),
    }


@router.get("/health/ready", summary="Readiness check")
async def health_readiness():
    """
    Readiness probe — checks that all required dependencies are available.
    Returns 200 if ready to serve traffic, 503 if not.
    
    Checks:
    - Database connectivity (required — returns 503 if down)
    - Storage directory (required — returns 503 if not writable)
    - LLM availability (optional — returns 200 but reports status)
    """
    settings = get_settings()
    issues = []

    # ─── Database check ───────────────────────────────────
    db_ok = await check_database_connection()
    if not db_ok:
        issues.append("database_unavailable")

    # ─── Storage check ────────────────────────────────────
    storage_ok = False
    try:
        storage_path = settings.storage_path
        storage_path.mkdir(parents=True, exist_ok=True)
        test_file = storage_path / ".health_check"
        test_file.write_text("ok")
        test_file.unlink()
        storage_ok = True
    except Exception as e:
        logger.warning("Storage health check failed", error=str(e))
        issues.append("storage_unavailable")

    # ─── LLM availability ─────────────────────────────────
    # Non-blocking: LLM unavailability does not make us unready
    llm_configured = settings.llm_available
    llm_status = "configured" if llm_configured else "not_configured"

    # ─── Response ─────────────────────────────────────────
    status_code = 503 if issues else 200
    response_data = {
        "status": "not_ready" if issues else "ready",
        "timestamp": datetime.now(UTC).isoformat(),
        "checks": {
            "database": "ok" if db_ok else "error",
            "storage": "ok" if storage_ok else "error",
            "llm": llm_status,
        },
        "issues": issues,
    }

    if issues:
        logger.warning("Readiness check failed", issues=issues)

    return JSONResponse(content=response_data, status_code=status_code)
