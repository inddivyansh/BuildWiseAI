"""WebSocket API — real-time analysis job status updates"""

import json
import asyncio
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.jobs.manager import job_manager
from app.logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.websocket("/analysis/{run_id}")
async def analysis_status_ws(websocket: WebSocket, run_id: uuid.UUID):
    """
    WebSocket endpoint for real-time analysis progress updates.
    
    Connect to: ws://localhost:8000/ws/analysis/{run_id}
    
    Messages sent by server:
    - {"type": "status_update", "status": "processing", "stage": "...", "progress_pct": 0-100}
    - {"type": "complete", "status": "complete", "summary": {...}}
    - {"type": "error", "status": "failed", "error_code": "...", "message": "..."}
    
    The connection closes automatically when the job completes or fails.
    """
    await websocket.accept()
    run_id_str = str(run_id)
    logger.info("WebSocket client connected", run_id=run_id_str)

    try:
        # Send initial status
        job_status = job_manager.get_status(run_id_str)
        await websocket.send_json({
            "type": "connected",
            "run_id": run_id_str,
            "status": job_status.get("status", "unknown") if job_status else "unknown",
        })

        # Poll for updates every 500ms
        while True:
            status = job_manager.get_status(run_id_str)
            if status is None:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Analysis run {run_id_str} not found",
                })
                break

            await websocket.send_json({"type": "status_update", **status})

            if status.get("status") in ("complete", "failed"):
                break

            await asyncio.sleep(0.5)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected", run_id=run_id_str)
    except Exception as e:
        logger.error("WebSocket error", run_id=run_id_str, error=str(e))
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        logger.info("WebSocket connection closed", run_id=run_id_str)
