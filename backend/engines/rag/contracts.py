"""
RAG Engine — Data contracts for regulatory document indexing, vector storage, and grounded retrieval.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Optional


@dataclass
class RegulatoryDocument:
    """A statutory building code document (e.g. NBC 2016 Part 4)."""
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    title: str = ""
    code_standard: str = "NBC_2016"  # National Building Code of India
    volume_or_part: str = ""         # e.g. "Part 4: Fire & Life Safety"
    filename: str = ""
    total_pages: int = 0
    extracted_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class DocumentChunk:
    """A semantic segment of regulatory text (clause, sub-clause, table)."""
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    document_id: uuid.UUID = field(default_factory=uuid.uuid4)
    clause_reference: Optional[str] = None  # e.g. "4.4.2" or "Table 5"
    content: str = ""
    page_number: int = 1
    chunk_index: int = 0
    token_count: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class RetrievalResult:
    """A retrieved regulatory chunk with relevance score."""
    chunk: DocumentChunk
    similarity_score: float  # Cosine similarity (0.0 to 1.0)
    rank: int = 1


@dataclass
class GroundedAnswer:
    """A synthesized regulatory answer grounded strictly in retrieved sources."""
    query: str
    answer: str
    sources: list[RetrievalResult] = field(default_factory=list)
    confidence: float = 1.0
    grounding_verified: bool = True
