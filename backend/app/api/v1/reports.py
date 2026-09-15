"""Reports API — download JSON and PDF compliance reports"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db_session
from app.models.report import Report
from app.storage.local import LocalStorage

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db_session)]


@router.get("/{run_id}/summary", summary="Get report summary statistics")
async def get_report_summary(run_id: uuid.UUID, db: DbSession):
    """Return summary statistics without downloading the full report."""
    result = await db.execute(select(Report).where(Report.analysis_run_id == run_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report for run {run_id} not yet available")
    return {"run_id": str(run_id), "summary": report.summary_stats, "llm_available": report.llm_available}


@router.get("/{run_id}/json", summary="Download JSON compliance report")
async def download_json_report(run_id: uuid.UUID, db: DbSession):
    """Download the full compliance report as JSON."""
    settings = get_settings()
    result = await db.execute(select(Report).where(Report.analysis_run_id == run_id))
    report = result.scalar_one_or_none()
    if not report or not report.json_storage_key:
        raise HTTPException(status_code=404, detail=f"JSON report for run {run_id} not available")
    storage = LocalStorage(settings.storage_path)
    content = await storage.load(report.json_storage_key)
    import json
    return JSONResponse(content=json.loads(content))


@router.get("/{run_id}/pdf", summary="Download PDF compliance report")
async def download_pdf_report(run_id: uuid.UUID, db: DbSession):
    """Download the compliance report as a PDF."""
    settings = get_settings()
    result = await db.execute(select(Report).where(Report.analysis_run_id == run_id))
    report = result.scalar_one_or_none()
    if not report or not report.pdf_storage_key:
        raise HTTPException(status_code=404, detail=f"PDF report for run {run_id} not available")
    file_path = settings.storage_path / report.pdf_storage_key
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on storage")
    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=f"buildwise_report_{run_id}.pdf",
    )
