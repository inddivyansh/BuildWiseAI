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
    MeasurementItem,
    AnalysisMeasurementsResponse,
    EgressPathItem,
    AnalysisEgressPathsResponse,
    CategorySummary,
    AnalysisSummaryResponse,
    IndividualViolationResponse,
    AnalysisHistoryItem,
    AnalysisHistoryResponse,
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


@router.get(
    "/project/{project_id}/history",
    response_model=AnalysisHistoryResponse,
    summary="Get detailed analysis history for project",
)
async def get_project_analysis_history(project_id: uuid.UUID, db: DbSession):
    """
    Returns ordered analysis history runs for a project (Analysis #1, #2, etc.)
    including document names, occupancy context, completion timestamps, and compliance stats.
    """
    from app.models.floor_plan_snapshot import FloorPlanSnapshot
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(AnalysisRun)
        .where(AnalysisRun.project_id == project_id)
        .options(selectinload(AnalysisRun.document))
        .order_by(AnalysisRun.created_at.asc())
    )
    runs = result.scalars().all()

    history_items = []
    for idx, run in enumerate(runs, start=1):
        doc_name = run.document.original_name if run.document else None
        occupancy = (run.config or {}).get("occupancy_type", "Business/Office")

        # Check snapshot for summary
        snap_res = await db.execute(
            select(FloorPlanSnapshot).where(FloorPlanSnapshot.analysis_run_id == run.id)
        )
        snap = snap_res.scalar_one_or_none()
        summary = snap.floor_data.get("compliance_summary", {}) if snap else {}

        history_items.append(
            AnalysisHistoryItem(
                id=run.id,
                run_number=idx,
                project_id=run.project_id,
                document_id=run.document_id,
                document_filename=doc_name,
                occupancy_type=occupancy,
                status=run.status,
                stage=run.stage,
                created_at=run.created_at,
                completed_at=run.completed_at,
                passed_count=summary.get("passed", 0),
                failed_count=summary.get("failed", 0),
                insufficient_count=summary.get("insufficient_data", 0),
                total_checks=summary.get("total_checks", 0),
                score_pct=summary.get("compliance_score_pct"),
            )
        )

    return AnalysisHistoryResponse(
        project_id=project_id,
        total_runs=len(history_items),
        runs=list(reversed(history_items)),
    )


@router.get(
    "/{run_id}/summary",
    response_model=AnalysisSummaryResponse,
    summary="Get analysis summary breakdown",
)
async def get_analysis_summary(run_id: uuid.UUID, db: DbSession):
    """
    Returns an executive summary of the analysis run:
    building metadata, overall status, category breakdown (Life Safety, Habitable/Planning, Environmental),
    severity distribution, and regulatory disclaimer.
    """
    from app.models.floor_plan_snapshot import ComplianceResult, FloorPlanSnapshot

    # Fetch run
    run_res = await db.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
    run = run_res.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail=f"Analysis run {run_id} not found")

    snap_res = await db.execute(
        select(FloorPlanSnapshot).where(FloorPlanSnapshot.analysis_run_id == run_id)
    )
    snap = snap_res.scalar_one_or_none()
    floor_data = snap.floor_data if snap else {}

    # Fetch results
    comp_res = await db.execute(
        select(ComplianceResult).where(ComplianceResult.analysis_run_id == run_id)
    )
    results = comp_res.scalars().all()

    # Geometry totals
    floors = floor_data.get("floors", [])
    total_rooms = sum(len(f.get("rooms", [])) for f in floors)
    total_walls = sum(len(f.get("walls", [])) for f in floors)
    total_doors = sum(len(f.get("doors", [])) for f in floors)
    total_windows = sum(len(f.get("windows", [])) for f in floors)
    total_stairs = sum(len(f.get("stairs", [])) for f in floors)

    # Exits: doors marked as exit
    total_exits = 0
    for f in floors:
        for d in f.get("doors", []):
            if d.get("is_exit") or "exit" in str(d.get("door_type", "")).lower():
                total_exits += 1

    # Categories
    category_map = {
        "Life Safety": CategorySummary(),
        "Habitable/Planning": CategorySummary(),
        "Environmental": CategorySummary(),
    }
    severities: dict[str, int] = {}
    passed = 0
    failed = 0
    insufficient = 0
    unverified = 0

    # Rule category mapping
    habitable_rules = {"NBC-2016-C3-ROOM-AREA", "NBC-2016-C3-ROOM-HEIGHT"}
    environmental_rules = {"NBC-2016-C8-VENTILATION-RATIO", "NBC-2016-C8-WINDOW-AREA"}

    for r in results:
        status_val = r.status.upper() if r.status else "UNVERIFIED"
        if status_val == "PASS":
            passed += 1
        elif status_val == "FAIL":
            failed += 1
        elif status_val == "INSUFFICIENT_DATA":
            insufficient += 1
        else:
            unverified += 1

        if r.severity:
            sev_key = r.severity.upper()
            severities[sev_key] = severities.get(sev_key, 0) + 1

        # Map to category
        cat_key = "Life Safety"
        if r.rule_id in habitable_rules:
            cat_key = "Habitable/Planning"
        elif r.rule_id in environmental_rules:
            cat_key = "Environmental"

        cat_sum = category_map[cat_key]
        cat_sum.total += 1
        if status_val == "PASS":
            cat_sum.passed += 1
        elif status_val == "FAIL":
            cat_sum.failed += 1
        elif status_val == "INSUFFICIENT_DATA":
            cat_sum.insufficient_data += 1
        else:
            cat_sum.unverified += 1

    # Determine overall status
    if failed > 0:
        overall_status = "FAIL"
    elif insufficient > 0:
        overall_status = "INSUFFICIENT_DATA"
    elif unverified > 0:
        overall_status = "UNVERIFIED"
    elif passed > 0:
        overall_status = "PASS"
    else:
        overall_status = "INSUFFICIENT_DATA"

    occupancy = (
        run.config.get("occupancy_type")
        or (snap.metadata_.get("occupancy_type") if snap else None)
        or "Business/Office"
    )

    return AnalysisSummaryResponse(
        run_id=str(run_id),
        status=run.status,
        occupancy_type=occupancy,
        total_area_m2=float(snap.total_area_m2) if snap and snap.total_area_m2 is not None else None,
        floor_count=snap.floor_count if snap else 1,
        total_rooms=total_rooms,
        total_walls=total_walls,
        total_doors=total_doors,
        total_windows=total_windows,
        total_stairs=total_stairs,
        total_exits=total_exits,
        overall_status=overall_status,
        total_checks=len(results),
        passed=passed,
        failed=failed,
        insufficient_data=insufficient,
        unverified=unverified,
        categories=category_map,
        severities=severities,
        disclaimer=(
            "BuildWise AI provides automated preliminary compliance screening and does not "
            "replace review by a qualified architect, engineer, or competent authority."
        ),
    )


@router.get(
    "/{run_id}/measurements",
    response_model=AnalysisMeasurementsResponse,
    summary="Get verified geometric measurements",
)
async def get_measurements(run_id: uuid.UUID, db: DbSession):
    """
    Returns verified geometric measurements extracted from CGM:
    wall length, door clear width, corridor clear width, room dimensions, stair width,
    window/opening area, travel distances, dead-end lengths, and exit reachability.
    """
    from app.models.floor_plan_snapshot import FloorPlanSnapshot

    result = await db.execute(
        select(FloorPlanSnapshot).where(FloorPlanSnapshot.analysis_run_id == run_id)
    )
    snapshot = result.scalar_one_or_none()
    if not snapshot:
        raise HTTPException(
            status_code=404,
            detail=f"Floor plan snapshot not found for run {run_id}",
        )

    raw_measurements = snapshot.floor_data.get("measurements", [])
    measurements = [MeasurementItem(**m) for m in raw_measurements]

    return AnalysisMeasurementsResponse(
        run_id=str(run_id),
        total=len(measurements),
        measurements=measurements,
    )


@router.get(
    "/{run_id}/egress-paths",
    response_model=AnalysisEgressPathsResponse,
    summary="Get egress travel distance paths and coordinates",
)
async def get_egress_paths(run_id: uuid.UUID, db: DbSession):
    """
    Returns travel distance routes with polyline coordinates for SVG/Canvas overlay rendering.
    Each path includes origin room, target exit door, distance in meters, applicable threshold,
    and compliance status.
    """
    from app.models.floor_plan_snapshot import ComplianceResult, FloorPlanSnapshot
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(ComplianceResult)
        .where(
            ComplianceResult.analysis_run_id == run_id,
            ComplianceResult.rule_id == "NBC-2016-C4-TRAVEL-DIST",
        )
        .options(selectinload(ComplianceResult.violations))
    )
    travel_rule = result.scalar_one_or_none()

    paths = []
    if travel_rule and travel_rule.violations:
        for v in travel_rule.violations:
            coords = v.coordinates or {}
            polyline = coords.get("polyline", [])
            origin_room = coords.get("origin_room", v.label_text or "Unknown Room")
            target_exit = coords.get("target_exit", "Exit Door")
            dist = coords.get("distance_m", float(travel_rule.measured_value or 0.0))
            thresh = float(travel_rule.required_value or 30.0)

            paths.append(
                EgressPathItem(
                    origin_room=str(origin_room),
                    destination_exit=str(target_exit),
                    distance_m=round(dist, 2),
                    threshold_m=round(thresh, 2),
                    status=travel_rule.status,
                    confidence=travel_rule.confidence,
                    polyline=polyline,
                )
            )

    # Fallback to checking measurements if no violations recorded
    if not paths:
        snap_res = await db.execute(
            select(FloorPlanSnapshot).where(FloorPlanSnapshot.analysis_run_id == run_id)
        )
        snap = snap_res.scalar_one_or_none()
        if snap:
            raw_measurements = snap.floor_data.get("measurements", [])
            for m in raw_measurements:
                if m.get("category") == "travel_distance":
                    coords = m.get("coordinates") or {}
                    polyline = coords.get("polyline", [])
                    paths.append(
                        EgressPathItem(
                            origin_room=m.get("name", "Room"),
                            destination_exit="Exit Door",
                            distance_m=round(float(m.get("value", 0.0)), 2),
                            threshold_m=30.0,
                            status="PASS" if float(m.get("value", 0.0)) <= 30.0 else "FAIL",
                            confidence=m.get("confidence", "high"),
                            polyline=polyline,
                        )
                    )

    return AnalysisEgressPathsResponse(
        run_id=str(run_id),
        total_paths=len(paths),
        paths=paths,
    )


@router.get(
    "/violations/{violation_id}",
    response_model=IndividualViolationResponse,
    summary="Get individual violation detail",
)
async def get_individual_violation(violation_id: uuid.UUID, db: DbSession):
    """
    Returns full details for a single violation, including geometry coordinates,
    measured vs required values, shortfall difference, NBC clause citations,
    and deterministic recommendations.
    """
    from app.models.floor_plan_snapshot import ComplianceResult, Violation

    result = await db.execute(
        select(Violation).where(Violation.id == violation_id)
    )
    viol = result.scalar_one_or_none()
    if not viol:
        raise HTTPException(status_code=404, detail=f"Violation {violation_id} not found")

    cr_res = await db.execute(
        select(ComplianceResult).where(ComplianceResult.id == viol.compliance_result_id)
    )
    cr = cr_res.scalar_one_or_none()
    if not cr:
        raise HTTPException(status_code=404, detail="Associated compliance result not found")

    measured = float(cr.measured_value) if cr.measured_value is not None else None
    required = float(cr.required_value) if cr.required_value is not None else None
    diff = round(measured - required, 4) if (measured is not None and required is not None) else None

    return IndividualViolationResponse(
        id=str(viol.id),
        compliance_result_id=str(cr.id),
        rule_id=cr.rule_id,
        title=cr.title,
        severity=cr.severity,
        status=cr.status,
        measured_value=measured,
        required_value=required,
        difference=diff,
        unit=cr.unit,
        entity_type=viol.entity_type,
        entity_id=str(viol.entity_id) if viol.entity_id else None,
        geometry_hint=viol.geometry_hint,
        coordinates=viol.coordinates,
        label_text=viol.label_text,
        floor_level=viol.floor_level,
        regulation_source=cr.regulation_source,
        source_section=cr.source_section,
        source_page=cr.source_page,
        recommendation=cr.recommendation,
        llm_explanation=cr.llm_explanation,
        confidence=cr.confidence,
    )


@router.get(
    "/{run_id}/violations/{violation_id}",
    response_model=IndividualViolationResponse,
    summary="Get individual violation detail by run and ID",
)
async def get_run_individual_violation(run_id: uuid.UUID, violation_id: uuid.UUID, db: DbSession):
    return await get_individual_violation(violation_id=violation_id, db=db)
