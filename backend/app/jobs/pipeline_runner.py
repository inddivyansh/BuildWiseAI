"""
Pipeline Runner — Orchestrates the complete analysis pipeline.

Stages:
1. VALIDATING   (5%)   ← Validate uploaded file and format
2. PARSING      (20%)  ← DXF / CAD → Canonical Geometry Model (CGM)
3. EXTRACTING   (35%)  ← Compute areas, spatial parameters
4. GRAPH        (50%)  ← NetworkX room connectivity & egress topology
5. COMPLIANCE   (70%)  ← Deterministic National Building Code rule evaluation
6. EXPLAINING   (85%)  ← AI-assisted plain language explanations (Gemini / graceful fallback)
7. PERSISTING   (95%)  ← FloorPlanSnapshot, ComplianceResults, Violations, Report
8. COMPLETE     (100%)
"""

import json
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.jobs.manager import job_manager
from app.logging_config import get_logger
from app.models.analysis_run import AnalysisRun, AnalysisStatus
from app.models.floor_plan_snapshot import (
    ComplianceResult,
    ComplianceRule,
    FloorPlanSnapshot,
    Report,
    Violation,
)
from app.storage.local import StorageBackend
from engines.compliance.engine import ComplianceEngine, ComplianceEvaluationOutput
from engines.compliance.registry import rule_registry
from engines.compliance.result import ResultStatus

logger = get_logger(__name__)


class PipelineRunner:
    """Executes the analysis pipeline for an uploaded architectural drawing."""

    def __init__(
        self,
        db_session: AsyncSession,
        storage: StorageBackend,
        run_id: uuid.UUID,
    ) -> None:
        self.db = db_session
        self.storage = storage
        self.run_id = run_id
        self.run_id_str = str(run_id)

    async def _update(
        self,
        status: str,
        stage: str,
        progress_pct: int,
        message: str = "",
    ) -> None:
        """Update both in-memory job status and database record."""
        job_manager.update_status(
            run_id=self.run_id_str,
            status=status,
            stage=stage,
            progress_pct=progress_pct,
            message=message,
        )
        result = await self.db.execute(
            select(AnalysisRun).where(AnalysisRun.id == self.run_id)
        )
        run = result.scalar_one_or_none()
        if run:
            run.status = status
            run.stage = stage
            run.progress_pct = progress_pct
            if status == AnalysisStatus.PROCESSING and not run.started_at:
                run.started_at = datetime.now(UTC)
            if status in (AnalysisStatus.COMPLETE, AnalysisStatus.FAILED):
                run.completed_at = datetime.now(UTC)
            await self.db.commit()

    async def run(self, document_storage_key: str, config: Optional[dict] = None) -> None:
        """Execute the full analysis pipeline."""
        config = config or {}
        logger.info("Pipeline started", run_id=self.run_id_str)

        try:
            # ── Stage 1: Validate ──────────────────────────
            await self._update("processing", "validating", 5, "Validating uploaded file...")
            if not await self.storage.exists(document_storage_key):
                raise FileNotFoundError(f"Document file not found: {document_storage_key}")
            file_content = await self.storage.load(document_storage_key)
            filename = Path(document_storage_key).name
            ext = Path(filename).suffix.lower()
            logger.info("File loaded", size=len(file_content), ext=ext)

            # ── Stage 2: Parse ─────────────────────────────
            await self._update("processing", "parsing", 20, "Detecting document type and parsing geometry...")
            from engines.ingestion.base import IngestionError
            from engines.ingestion.detector import DocumentDetector, DocumentType
            from engines.ingestion.dxf.adapter import DXFAdapter
            from engines.ingestion.pdf.adapter import PDFAdapter
            from engines.ingestion.vision.adapter import VisionAdapter

            doc_info = DocumentDetector.detect(file_content, filename)
            logger.info("Document type detected", doc_type=doc_info.doc_type.value, is_vector=doc_info.is_vector)

            if doc_info.doc_type == DocumentType.DXF or ext == ".dxf":
                adapter = DXFAdapter()
                cgm = adapter.parse(file_content, filename)
            elif doc_info.doc_type == DocumentType.VECTOR_PDF:
                adapter = PDFAdapter()
                cgm = adapter.parse(file_content, filename)
            elif doc_info.doc_type == DocumentType.RASTER_PDF:
                raise IngestionError(
                    "Scanned / Raster PDF detected. This document contains bitmap scans rather than CAD vectors. "
                    "Please upload a vector CAD PDF/DXF or export the plan as an image for the classical vision pipeline.",
                    error_code="RASTER_PDF_REQUIRES_VISION",
                )
            elif doc_info.doc_type == DocumentType.IMAGE or ext in (".png", ".jpg", ".jpeg", ".bmp", ".webp"):
                adapter = VisionAdapter()
                cgm = adapter.parse(file_content, filename)
            elif ext == ".pdf":
                adapter = PDFAdapter()
                cgm = adapter.parse(file_content, filename)
            else:
                raise IngestionError(
                    f"Unsupported format '{ext}'. Supported formats: DXF, Vector PDF, PNG, JPG.",
                    "UNSUPPORTED_FORMAT",
                )

            wall_count = sum(len(f.walls) for f in cgm.floors)
            room_count = sum(len(f.rooms) for f in cgm.floors)
            logger.info("CGM built", walls=wall_count, rooms=room_count)

            # ── Stage 3: Extract Spatial Structure ─────────
            await self._update("processing", "extracting", 35, "Extracting spatial structure & dimensions...")
            for floor in cgm.floors:
                for room in floor.rooms:
                    if room.area_m2 is None:
                        room.compute_area()

            # ── Stage 4: Build Connectivity Graph ──────────
            await self._update("processing", "building_graph", 45, "Building room connectivity graph...")
            from engines.graph.builder import FloorPlanGraphBuilder
            graph_builder = FloorPlanGraphBuilder()
            floor_graph = graph_builder.build(cgm)
            graph_dict = floor_graph.to_dict()

            # ── Stage 5: Extract Verified Measurements ─────
            await self._update("processing", "measuring", 60, "Computing verified geometric measurements & egress paths...")
            from engines.measurements.extractor import GeometricMeasurementExtractor
            measurements = GeometricMeasurementExtractor.extract_all(cgm, floor_graph)
            logger.info("Geometric measurements computed", count=len(measurements))

            # ── Stage 6: Evaluate Compliance Rules ─────────
            await self._update("processing", "compliance", 75, "Evaluating National Building Code regulations...")
            compliance_engine = ComplianceEngine()
            compliance_output = compliance_engine.evaluate(cgm=cgm, graph=floor_graph, context=config)

            # ── Stage 7: AI-Assisted Explanations ──────────
            await self._update("processing", "explaining", 85, "Generating AI regulatory explanations...")
            await self._generate_ai_explanations(compliance_output, config)

            # ── Stage 8: Persist Results to DB ─────────────
            await self._update("processing", "persisting", 95, "Saving analysis snapshot and report...")
            await self._persist_results(cgm, graph_dict, compliance_output, measurements, config)

            # ── Complete ───────────────────────────────────
            await self._update("complete", "complete", 100, "Analysis complete")
            logger.info(
                "Pipeline completed successfully",
                run_id=self.run_id_str,
                walls=wall_count,
                rooms=room_count,
                graph_nodes=len(floor_graph.nodes),
                compliance_checks=compliance_output.summary.total_checks,
                passed=compliance_output.summary.passed,
                score=compliance_output.summary.compliance_score_pct,
            )

        except Exception as e:
            error_code = self._classify_error(e)
            logger.error(
                "Pipeline failed",
                run_id=self.run_id_str,
                error=str(e),
                error_code=error_code,
                exc_info=True,
            )
            job_manager.update_status(
                run_id=self.run_id_str,
                status="failed",
                stage="failed",
                progress_pct=0,
                message=str(e),
            )
            result = await self.db.execute(
                select(AnalysisRun).where(AnalysisRun.id == self.run_id)
            )
            run = result.scalar_one_or_none()
            if run:
                run.status = AnalysisStatus.FAILED
                run.error_code = error_code
                run.error_message = str(e)[:1000]
                run.completed_at = datetime.now(UTC)
                await self.db.commit()

    async def _generate_ai_explanations(
        self,
        compliance_output: ComplianceEvaluationOutput,
        config: dict,
    ) -> None:
        """Generate plain-language explanations for non-compliant results."""
        settings = get_settings()

        llm_provider = None
        if settings.llm_available:
            try:
                from engines.llm.gemini_provider import GeminiProvider
                llm_provider = GeminiProvider.from_settings()
            except Exception as e:
                logger.warning("Failed to initialize GeminiProvider", error=str(e))

        # Fallback to Mock provider if LLM disabled or in tests
        if llm_provider is None:
            from engines.llm.mock_provider import MockLLMProvider
            llm_provider = MockLLMProvider()

        # Generate explanations for flagged results (limit to first 5 for speed/quota)
        flagged_results = [
            r for r in compliance_output.results
            if r.status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED, ResultStatus.WARNING)
        ]

        for res in flagged_results[:5]:
            try:
                response = await llm_provider.explain_violation(
                    rule_id=res.rule_id,
                    title=res.title,
                    measured_value=res.measured_value,
                    required_value=res.required_value,
                    unit=res.unit,
                    regulation_chunks=[res.description or ""],
                    building_context=config,
                )
                if response.is_available:
                    res.llm_explanation = response.text
                    res.llm_model_used = response.model_used
            except Exception as ex:
                logger.debug("LLM explanation generation skipped", rule_id=res.rule_id, error=str(ex))

    async def _ensure_rules_seeded(self) -> None:
        """Ensure all rule metadata is registered in compliance_rules table."""
        existing_result = await self.db.execute(select(ComplianceRule.rule_id))
        existing_rule_ids = set(existing_result.scalars().all())

        for meta in rule_registry.list_rules_metadata():
            rid = meta["rule_id"]
            if rid not in existing_rule_ids:
                rule_record = ComplianceRule(
                    rule_id=rid,
                    title=meta["title"],
                    description=meta["description"],
                    category=meta["category"],
                    severity=meta["severity"],
                    regulation_source=meta["regulation_source"],
                    volume=meta.get("volume"),
                    part=meta.get("part"),
                    section=meta.get("section"),
                    clause=meta.get("clause"),
                    source_page=meta.get("source_page"),
                    parameter=meta.get("parameter"),
                    unit=meta.get("unit"),
                    verification_status=meta["verification_status"],
                    is_active=True,
                    rule_version=meta.get("rule_version", "1.0"),
                )
                self.db.add(rule_record)
                existing_rule_ids.add(rid)

        await self.db.flush()

    async def _persist_results(
        self,
        cgm: Any,
        graph_dict: dict,
        compliance_output: ComplianceEvaluationOutput,
        measurements: Optional[list] = None,
        config: Optional[dict] = None,
    ) -> None:
        """Persist snapshot, compliance results, violations, and report to DB."""
        await self._ensure_rules_seeded()

        occupancy = (config or {}).get("occupancy_type", "Business/Office")

        # Delete existing snapshot and results if re-running
        existing_snap = await self.db.execute(
            select(FloorPlanSnapshot).where(FloorPlanSnapshot.analysis_run_id == self.run_id)
        )
        old_snapshot = existing_snap.scalar_one_or_none()
        if old_snapshot:
            await self.db.delete(old_snapshot)

        existing_results = await self.db.execute(
            select(ComplianceResult).where(ComplianceResult.analysis_run_id == self.run_id)
        )
        for old_r in existing_results.scalars().all():
            await self.db.delete(old_r)

        # Build floor_data: CGM + graph + compliance summary + real measurements
        floor_data = cgm.to_storage_dict()
        floor_data["graph"] = graph_dict
        floor_data["compliance_summary"] = compliance_output.summary.to_dict()
        floor_data["measurements"] = [m.to_dict() for m in measurements] if measurements else []

        snapshot = FloorPlanSnapshot(
            analysis_run_id=self.run_id,
            floor_data=floor_data,
            bounding_box={
                "xmin": cgm.bounding_box.xmin,
                "ymin": cgm.bounding_box.ymin,
                "xmax": cgm.bounding_box.xmax,
                "ymax": cgm.bounding_box.ymax,
            },
            floor_count=cgm.floor_count,
            total_area_m2=round(cgm.total_area_m2, 2) if cgm.total_area_m2 else None,
            metadata_={
                "source_format": cgm.metadata.source_format,
                "source_filename": cgm.metadata.source_filename,
                "occupancy_type": occupancy,
                "warnings": cgm.metadata.extraction_warnings,
                "graph_stats": graph_dict.get("stats", {}),
                "measurement_count": len(measurements) if measurements else 0,
            },
        )
        self.db.add(snapshot)

        # Persist ComplianceResult and Violation rows
        for res_data in compliance_output.results:
            c_res = ComplianceResult(
                id=uuid.uuid4(),
                analysis_run_id=self.run_id,
                rule_id=res_data.rule_id,
                status=res_data.status.value if hasattr(res_data.status, "value") else res_data.status,
                severity=res_data.severity.value if hasattr(res_data.severity, "value") else res_data.severity,
                title=res_data.title,
                description=res_data.description,
                measured_value=res_data.measured_value,
                required_value=res_data.required_value,
                unit=res_data.unit,
                regulation_source=res_data.regulation_source,
                source_page=res_data.source_page,
                source_section=res_data.source_section,
                evidence=res_data.evidence or {},
                confidence=res_data.confidence,
                recommendation=res_data.recommendation,
                llm_explanation=res_data.llm_explanation,
                llm_model_used=res_data.llm_model_used,
                floor_level=res_data.floor_level,
            )
            self.db.add(c_res)
            await self.db.flush()

            for v_data in res_data.violations:
                viol = Violation(
                    id=uuid.uuid4(),
                    compliance_result_id=c_res.id,
                    entity_type=v_data.entity_type,
                    entity_id=v_data.entity_id,
                    geometry_hint=v_data.geometry_hint,
                    coordinates=v_data.coordinates,
                    label_text=v_data.label_text,
                    label_position=v_data.label_position,
                    floor_level=v_data.floor_level,
                )
                self.db.add(viol)

        # Generate & store JSON report
        report_data = {
            "analysis_run_id": self.run_id_str,
            "generated_at": datetime.now(UTC).isoformat(),
            "occupancy_type": occupancy,
            "disclaimer": (
                "BuildWise AI provides automated preliminary compliance screening and does not "
                "replace review by a qualified architect, engineer, or competent authority."
            ),
            "summary": compliance_output.summary.to_dict(),
            "compliance_results": [r.to_dict() for r in compliance_output.results],
            "measurements": [m.to_dict() for m in measurements] if measurements else [],
            "insufficient_data": [
                r.to_dict() for r in compliance_output.results
                if r.status == ResultStatus.INSUFFICIENT_DATA
            ],
            "building_metadata": {
                "total_area_m2": cgm.total_area_m2,
                "floor_count": cgm.floor_count,
                "source_file": cgm.metadata.source_filename,
                "occupancy": occupancy,
            },
        }
        report_json_str = json.dumps(report_data, indent=2)
        report_key = f"reports/report_{self.run_id_str}.json"
        await self.storage.save(report_key, report_json_str.encode("utf-8"))

        # Save Report record
        settings = get_settings()
        report_record = Report(
            analysis_run_id=self.run_id,
            json_storage_key=report_key,
            pdf_storage_key=None,
            summary_stats=compliance_output.summary.to_dict(),
            llm_available=settings.llm_available,
        )
        self.db.add(report_record)

        await self.db.commit()

    def _classify_error(self, error: Exception) -> str:
        """Map exception type to error code string."""
        from engines.ingestion.base import IngestionError
        if isinstance(error, IngestionError):
            return error.error_code
        mapping = {
            "FileNotFoundError": "INVALID_FILE",
            "ValueError": "GEOMETRY_INVALID",
            "RuntimeError": "EXTRACTION_FAILED",
        }
        return mapping.get(type(error).__name__, "INTERNAL_ERROR")
