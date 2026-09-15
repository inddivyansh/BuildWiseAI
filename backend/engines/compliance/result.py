"""
Compliance Engine — Data contracts for compliance evaluation results.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional


class ResultStatus(str, Enum):
    """Evaluation status of a compliance check."""
    PASS = "PASS"
    FAIL = "FAIL"
    WARNING = "WARNING"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    UNVERIFIED = "UNVERIFIED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class Severity(str, Enum):
    """Severity classification of non-compliance."""
    CRITICAL = "CRITICAL"
    MAJOR = "MAJOR"
    MINOR = "MINOR"
    ADVISORY = "ADVISORY"


class RuleVerificationStatus(str, Enum):
    """Verification status against official National Building Code."""
    DRAFT = "DRAFT"
    REQUIRES_VERIFICATION = "REQUIRES_VERIFICATION"
    VERIFIED = "VERIFIED"
    DEPRECATED = "DEPRECATED"


@dataclass
class ViolationData:
    """A specific geometric violation that can be overlaid on the floor plan."""
    entity_type: str                  # room | wall | opening | corridor | stair | floor
    geometry_hint: str                # polygon | line | point | polyline | bbox
    coordinates: list[Any]            # [[x, y], ...] or [[[x, y], ...]]
    entity_id: Optional[uuid.UUID] = None
    label_text: Optional[str] = None
    label_position: Optional[dict[str, float]] = None
    floor_level: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "entity_type": self.entity_type,
            "entity_id": str(self.entity_id) if self.entity_id else None,
            "geometry_hint": self.geometry_hint,
            "coordinates": self.coordinates,
            "label_text": self.label_text,
            "label_position": self.label_position,
            "floor_level": self.floor_level,
        }


@dataclass
class ComplianceResultData:
    """Result of running a single compliance rule evaluation."""
    rule_id: str
    status: ResultStatus
    severity: Severity
    title: str
    description: Optional[str] = None
    measured_value: Optional[float] = None
    required_value: Optional[float] = None
    unit: Optional[str] = None
    regulation_source: Optional[str] = None
    source_page: Optional[int] = None
    source_section: Optional[str] = None
    evidence: Optional[dict[str, Any]] = None
    confidence: str = "high"
    recommendation: Optional[str] = None
    llm_explanation: Optional[str] = None
    llm_model_used: Optional[str] = None
    floor_level: Optional[int] = None
    verification_status: str = "VERIFIED"
    source_filename: Optional[str] = None
    source_sha256: Optional[str] = None
    statutory_clause: Optional[str] = None
    statutory_volume: Optional[str] = None
    verbatim_statutory_text: Optional[str] = None
    violations: list[ViolationData] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "status": self.status.value if isinstance(self.status, ResultStatus) else self.status,
            "severity": self.severity.value if isinstance(self.severity, Severity) else self.severity,
            "title": self.title,
            "description": self.description,
            "measured_value": self.measured_value,
            "required_value": self.required_value,
            "unit": self.unit,
            "regulation_source": self.regulation_source,
            "source_page": self.source_page,
            "source_section": self.source_section,
            "verification_status": self.verification_status,
            "source_filename": self.source_filename,
            "source_sha256": self.source_sha256,
            "statutory_clause": self.statutory_clause,
            "statutory_volume": self.statutory_volume,
            "verbatim_statutory_text": self.verbatim_statutory_text,
            "evidence": self.evidence or {},
            "confidence": self.confidence,
            "recommendation": self.recommendation,
            "llm_explanation": self.llm_explanation,
            "llm_model_used": self.llm_model_used,
            "floor_level": self.floor_level,
            "violations": [v.to_dict() for v in self.violations],
        }
