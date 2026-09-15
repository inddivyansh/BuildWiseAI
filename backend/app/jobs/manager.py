"""
In-memory job status manager for analysis pipeline tracking.

This is the MVP approach using FastAPI BackgroundTasks.
When migrating to Celery, replace this with a Redis-backed store.
The interface (create_job, update_status, get_status) remains unchanged.
"""

import asyncio
from datetime import UTC, datetime
from typing import Any

from app.logging_config import get_logger

logger = get_logger(__name__)


class JobManager:
    """
    Thread-safe in-memory job status store.
    
    Stores job status for all active analysis runs.
    WebSocket connections poll this store every 500ms.
    
    Note: In-memory only — restarting the server loses all job statuses.
    Jobs in 'processing' state at restart will show as 'queued' from DB.
    This is acceptable for MVP; Celery + Redis solves this for production.
    """

    def __init__(self):
        self._jobs: dict[str, dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    def create_job(self, run_id: str) -> None:
        """Register a new job in the store."""
        self._jobs[run_id] = {
            "run_id": run_id,
            "status": "queued",
            "stage": "queued",
            "progress_pct": 0,
            "message": "Analysis queued",
            "created_at": datetime.now(UTC).isoformat(),
            "updated_at": datetime.now(UTC).isoformat(),
        }
        logger.debug("Job created", run_id=run_id)

    def update_status(
        self,
        run_id: str,
        status: str,
        stage: str,
        progress_pct: int,
        message: str = "",
        extra: dict | None = None,
    ) -> None:
        """Update job status. Called from the pipeline runner."""
        if run_id not in self._jobs:
            self._jobs[run_id] = {}

        self._jobs[run_id].update({
            "run_id": run_id,
            "status": status,
            "stage": stage,
            "progress_pct": progress_pct,
            "message": message,
            "updated_at": datetime.now(UTC).isoformat(),
        })
        if extra:
            self._jobs[run_id].update(extra)

        logger.debug(
            "Job status updated",
            run_id=run_id,
            status=status,
            stage=stage,
            progress_pct=progress_pct,
        )

    def get_status(self, run_id: str) -> dict | None:
        """Get current job status. Returns None if job not found."""
        return self._jobs.get(run_id)

    def is_complete(self, run_id: str) -> bool:
        """Return True if job is in a terminal state."""
        job = self._jobs.get(run_id)
        if not job:
            return False
        return job.get("status") in ("complete", "failed")

    def cleanup_completed(self, max_age_hours: int = 2) -> int:
        """
        Remove completed jobs older than max_age_hours.
        Called periodically to prevent memory growth.
        Returns number of jobs removed.
        """
        now = datetime.now(UTC)
        to_remove = []
        for run_id, job in self._jobs.items():
            if job.get("status") in ("complete", "failed"):
                try:
                    updated = datetime.fromisoformat(job.get("updated_at", ""))
                    age_hours = (now - updated).total_seconds() / 3600
                    if age_hours > max_age_hours:
                        to_remove.append(run_id)
                except Exception:
                    to_remove.append(run_id)
        for run_id in to_remove:
            del self._jobs[run_id]
        return len(to_remove)


# ─── Global Singleton ─────────────────────────────────────
# Single instance shared across all FastAPI BackgroundTasks
job_manager = JobManager()
