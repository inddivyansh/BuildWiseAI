"""Pydantic schemas — Document request/response models"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


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

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
