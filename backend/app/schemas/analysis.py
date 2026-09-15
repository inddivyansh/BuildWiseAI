"""Pydantic schemas — Analysis run request/response models"""

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class AnalysisStartRequest(BaseModel):
    project_id: uuid.UUID
    document_id: uuid.UUID
    config: Optional[dict[str, Any]] = Field(default_factory=dict)


class AnalysisRunResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    document_id: uuid.UUID
    status: str
    stage: Optional[str]
    progress_pct: int
    error_code: Optional[str]
    error_message: Optional[str]
    config: dict
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisStatusResponse(BaseModel):
    run_id: uuid.UUID
    status: str
    stage: Optional[str]
    progress_pct: int
    error_code: Optional[str]
    error_message: Optional[str]


class AnalysisListResponse(BaseModel):
    items: list[AnalysisRunResponse]
    total: int


class MeasurementItem(BaseModel):
    id: str
    category: str
    name: str
    value: float
    unit: str
    confidence: str
    method: str
    entity_ids: list[str] = Field(default_factory=list)
    entity_type: Optional[str] = None
    floor_level: int = 0
    coordinates: Optional[dict[str, Any]] = None
    notes: Optional[str] = None


class AnalysisMeasurementsResponse(BaseModel):
    run_id: str
    total: int
    measurements: list[MeasurementItem]


class EgressPathItem(BaseModel):
    origin_room: str
    destination_exit: str
    distance_m: float
    threshold_m: float
    status: str
    confidence: str
    polyline: list[list[float]] = Field(default_factory=list)


class AnalysisEgressPathsResponse(BaseModel):
    run_id: str
    total_paths: int
    paths: list[EgressPathItem]


class CategorySummary(BaseModel):
    total: int = 0
    passed: int = 0
    failed: int = 0
    insufficient_data: int = 0
    unverified: int = 0


class AnalysisSummaryResponse(BaseModel):
    run_id: str
    status: str
    occupancy_type: Optional[str] = None
    total_area_m2: Optional[float] = None
    floor_count: int = 1
    total_rooms: int = 0
    total_walls: int = 0
    total_doors: int = 0
    total_windows: int = 0
    total_stairs: int = 0
    total_exits: int = 0
    overall_status: str
    total_checks: int = 0
    passed: int = 0
    failed: int = 0
    insufficient_data: int = 0
    unverified: int = 0
    categories: dict[str, CategorySummary] = Field(default_factory=dict)
    severities: dict[str, int] = Field(default_factory=dict)
    disclaimer: str


class IndividualViolationResponse(BaseModel):
    id: str
    compliance_result_id: str
    rule_id: str
    title: str
    severity: str
    status: str
    measured_value: Optional[float] = None
    required_value: Optional[float] = None
    difference: Optional[float] = None
    unit: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    geometry_hint: Optional[str] = None
    coordinates: Optional[dict[str, Any]] = None
    label_text: Optional[str] = None
    floor_level: Optional[int] = 0
    regulation_source: Optional[str] = None
    source_section: Optional[str] = None
    source_page: Optional[int] = None
    recommendation: Optional[str] = None
    llm_explanation: Optional[str] = None
    confidence: str = "high"


class AnalysisHistoryItem(BaseModel):
    id: uuid.UUID
    run_number: int
    project_id: uuid.UUID
    document_id: uuid.UUID
    document_filename: Optional[str] = None
    occupancy_type: Optional[str] = None
    status: str
    stage: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    passed_count: int = 0
    failed_count: int = 0
    insufficient_count: int = 0
    total_checks: int = 0
    score_pct: Optional[float] = None


class AnalysisHistoryResponse(BaseModel):
    project_id: uuid.UUID
    total_runs: int
    runs: list[AnalysisHistoryItem]
