"""Pydantic schemas — Document request/response models"""

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class DocumentDetectionResponse(BaseModel):
    doc_type: str
    is_vector: bool
    mime_type: str
    description: str
    recommended_pipeline: str
    page_count: int = 1
    confidence: float = 1.0
    details: dict[str, Any] = {}


class DocumentResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    original_name: str
    storage_key: str
    file_format: str
    mime_type: Optional[str]
    file_size_bytes: int
    checksum_sha256: Optional[str]
    uploaded_at: datetime
    detection_info: Optional[DocumentDetectionResponse] = None

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
