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
