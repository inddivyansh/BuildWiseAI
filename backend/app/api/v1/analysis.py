"""Analysis API — start analysis runs and retrieve results"""

import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.logging_config import get_logger
from app.models.analysis_run import AnalysisRun, AnalysisStatus
from app.models.document import UploadedDocument
from app.models.project import Project
from app.schemas.analysis import (
    AnalysisStartRequest,
    AnalysisRunResponse,
    AnalysisStatusResponse,
    AnalysisListResponse,
)
from app.jobs.manager import job_manager

router = APIRouter()
logger = get_logger(__name__)

DbSession = Annotated[AsyncSession, Depends(get_db_session)]


@router.post(
    "/start",
    response_model=AnalysisRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start analysis run",
)
async def start_analysis(
    payload: AnalysisStartRequest,
    background_tasks: BackgroundTasks,
    db: DbSession,
):
    """
    Start an analysis run for a document.
    
    Creates an analysis run record and dispatches the pipeline
    as a FastAPI background task. Returns immediately with run_id.
    Poll GET /analysis/{run_id}/status or connect to WS /ws/analysis/{run_id}
    for progress updates.
    """
    # Verify project + document exist and belong together
    result = await db.execute(
        select(UploadedDocument)
        .where(
            UploadedDocument.id == payload.document_id,
            UploadedDocument.project_id == payload.project_id,
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(
            status_code=404,
            detail=f"Document {payload.document_id} not found in project {payload.project_id}",
        )

    # Create analysis run
    run = AnalysisRun(
        id=uuid.uuid4(),
        project_id=payload.project_id,
        document_id=payload.document_id,
        status=AnalysisStatus.QUEUED,
        stage="queued",
        progress_pct=0,
        config=payload.config or {},
    )
    db.add(run)
    await db.flush()
    await db.refresh(run)

    run_id = run.id

    # Register job in memory manager
    job_manager.create_job(str(run_id))

    # Dispatch pipeline as background task
    from app.jobs.pipeline_runner import PipelineRunner
    from app.config import get_settings
    from app.storage.local import LocalStorage

    settings = get_settings()
    storage = LocalStorage(settings.storage_path)

    async def run_pipeline():
        from app.database import get_session_factory
        factory = get_session_factory()
        async with factory() as session:
            runner = PipelineRunner(
                db_session=session,
                storage=storage,
                run_id=run_id,
            )
            await runner.run(document_storage_key=document.storage_key, config=run.config)

    background_tasks.add_task(run_pipeline)

    logger.info(
        "Analysis run created",
        run_id=str(run_id),
        document_id=str(payload.document_id),
        project_id=str(payload.project_id),
    )

    return run


@router.get("/{run_id}", response_model=AnalysisRunResponse, summary="Get analysis run")
async def get_analysis_run(run_id: uuid.UUID, db: DbSession):
    """Get the full analysis run record."""
    result = await db.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail=f"Analysis run {run_id} not found")
    return run


@router.get("/{run_id}/status", response_model=AnalysisStatusResponse, summary="Poll analysis status")
async def get_analysis_status(run_id: uuid.UUID, db: DbSession):
    """
    Poll-based status check. For real-time updates, use WebSocket instead.
    Returns current stage, progress %, and status.
    """
    result = await db.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail=f"Analysis run {run_id} not found")

    return AnalysisStatusResponse(
        run_id=run.id,
        status=run.status,
        stage=run.stage,
        progress_pct=run.progress_pct,
        error_code=run.error_code,
        error_message=run.error_message,
    )


@router.get(
    "/{run_id}/floor-plan",
    summary="Get floor plan geometry (CGM)",
)
async def get_floor_plan(run_id: uuid.UUID, db: DbSession):
    """
    Returns the Canonical Geometry Model (CGM) for SVG rendering.
    Available after analysis reaches the 'geometry' stage.
    """
    from app.models.floor_plan_snapshot import FloorPlanSnapshot
    result = await db.execute(
        select(FloorPlanSnapshot).where(FloorPlanSnapshot.analysis_run_id == run_id)
    )
    snapshot = result.scalar_one_or_none()
    if not snapshot:
        raise HTTPException(
            status_code=404,
            detail=f"Floor plan geometry not yet available for run {run_id}",
        )
    return snapshot.floor_data


@router.get(
    "/{run_id}/violations",
    summary="Get violation list with geometry",
)
async def get_violations(run_id: uuid.UUID, db: DbSession):
    """
    Returns all detected violations with geometry coordinates for SVG overlay rendering.
    """
    from app.models.floor_plan_snapshot import ComplianceResult, Violation
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(ComplianceResult)
        .where(ComplianceResult.analysis_run_id == run_id)
        .options(selectinload(ComplianceResult.violations))
        .order_by(ComplianceResult.severity)
    )
    compliance_results = result.scalars().all()

    violations_output = []
    for cr in compliance_results:
        for v in cr.violations:
            violations_output.append({
                "id": str(v.id),
                "compliance_result_id": str(cr.id),
                "rule_id": cr.rule_id,
                "title": cr.title,
                "severity": cr.severity,
                "status": cr.status,
                "entity_type": v.entity_type,
                "entity_id": str(v.entity_id) if v.entity_id else None,
                "geometry_hint": v.geometry_hint,
                "coordinates": v.coordinates,
                "label_text": v.label_text,
                "label_position": v.label_position,
                "floor_level": v.floor_level,
                "measured_value": float(cr.measured_value) if cr.measured_value is not None else None,
                "required_value": float(cr.required_value) if cr.required_value is not None else None,
                "unit": cr.unit,
                "regulation_source": cr.regulation_source,
                "recommendation": cr.recommendation,
                "llm_explanation": cr.llm_explanation,
            })

    return {
        "run_id": str(run_id),
        "total": len(violations_output),
        "violations": violations_output,
    }


@router.get(
    "/{run_id}/compliance",
    summary="Get compliance results and score",
)
async def get_compliance_results(run_id: uuid.UUID, db: DbSession):
    """Returns all compliance evaluation results and summary stats for a run."""
    from app.models.floor_plan_snapshot import ComplianceResult, FloorPlanSnapshot

    res = await db.execute(
        select(ComplianceResult)
        .where(ComplianceResult.analysis_run_id == run_id)
        .order_by(ComplianceResult.severity)
    )
    items = res.scalars().all()

    snap_res = await db.execute(
        select(FloorPlanSnapshot).where(FloorPlanSnapshot.analysis_run_id == run_id)
    )
    snap = snap_res.scalar_one_or_none()
    summary = snap.floor_data.get("compliance_summary", {}) if snap else {}

    return {
        "run_id": str(run_id),
        "summary": summary,
        "results": [
            {
                "id": str(r.id),
                "rule_id": r.rule_id,
                "title": r.title,
                "description": r.description,
                "status": r.status,
                "severity": r.severity,
                "measured_value": float(r.measured_value) if r.measured_value is not None else None,
                "required_value": float(r.required_value) if r.required_value is not None else None,
                "unit": r.unit,
                "regulation_source": r.regulation_source,
                "confidence": r.confidence,
                "recommendation": r.recommendation,
                "llm_explanation": r.llm_explanation,
                "evidence": r.evidence,
                "floor_level": r.floor_level,
            }
            for r in items
        ],
    }


@router.get(
    "/{run_id}/graph",
    summary="Get room connectivity graph",
)
async def get_floor_graph(run_id: uuid.UUID, db: DbSession):
    """Returns topological NetworkX graph data for the floor plan."""
    from app.models.floor_plan_snapshot import FloorPlanSnapshot

    result = await db.execute(
        select(FloorPlanSnapshot).where(FloorPlanSnapshot.analysis_run_id == run_id)
    )
    snapshot = result.scalar_one_or_none()
    if not snapshot:
        raise HTTPException(
            status_code=404,
            detail=f"Floor plan not found for run {run_id}",
        )
    return snapshot.floor_data.get("graph", {"nodes": [], "edges": [], "stats": {}})


@router.get(
    "/project/{project_id}",
    response_model=AnalysisListResponse,
    summary="List analysis runs for project",
)
async def list_project_runs(project_id: uuid.UUID, db: DbSession):
    """List all analysis runs for a project."""
    result = await db.execute(
        select(AnalysisRun)
        .where(AnalysisRun.project_id == project_id)
        .order_by(AnalysisRun.created_at.desc())
    )
    runs = result.scalars().all()
    return AnalysisListResponse(items=runs, total=len(runs))
