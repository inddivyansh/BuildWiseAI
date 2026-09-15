"""
Compliance Engine — Abstract Base Class for Compliance Rules.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Optional

from engines.compliance.result import (
    ComplianceResultData,
    ResultStatus,
    RuleVerificationStatus,
    Severity,
)
from engines.geometry.models import CanonicalFloorPlan, ConfidenceLevel


class ComplianceRule(ABC):
    """
    Abstract base class for all deterministic regulatory compliance rules.

    Rules evaluate against the Canonical Geometry Model (CGM) and optionally
    the topological connectivity graph.
    Rules NEVER call LLMs directly — deterministic math and logic only.
    """

    rule_id: str
    title: str
    description: str
    category: str                         # egress | spatial | fire_safety | ventilation
    severity: Severity = Severity.MAJOR
    regulation_source: str = "NBC 2016"
    volume: Optional[str] = None
    part: Optional[str] = None
    section: Optional[str] = None
    clause: Optional[str] = None
    source_page: Optional[int] = None
    parameter: Optional[str] = None
    unit: Optional[str] = None
    verification_status: RuleVerificationStatus = RuleVerificationStatus.REQUIRES_VERIFICATION

    @abstractmethod
    def evaluate(
        self,
        cgm: CanonicalFloorPlan,
        graph: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ) -> list[ComplianceResultData]:
        """
        Evaluate the rule against the CGM and graph.
        Returns a list of ComplianceResultData (one per entity checked or one overall).
        """
        pass

    def resolve_status(
        self,
        is_compliant: bool,
        confidence: ConfidenceLevel = ConfidenceLevel.HIGH,
    ) -> ResultStatus:
        """
        Determine result status respecting geometry confidence and rule verification status.

        Rules:
        - If geometry confidence is LOW: produces INSUFFICIENT_DATA (never a false FAIL)
        - If compliant: produces PASS
        - If non-compliant:
            - If rule is VERIFIED: produces FAIL
            - If rule is REQUIRES_VERIFICATION: produces UNVERIFIED
        """
        if confidence == ConfidenceLevel.LOW:
            return ResultStatus.INSUFFICIENT_DATA

        if is_compliant:
            return ResultStatus.PASS

        if self.verification_status == RuleVerificationStatus.VERIFIED:
            return ResultStatus.FAIL
        else:
            return ResultStatus.UNVERIFIED

    def populate_statutory_evidence(self, result: ComplianceResultData) -> ComplianceResultData:
        """Attach verified statutory NBC 2016 source citations to this compliance result."""
        try:
            from engines.compliance.statutory_registry import get_statutory_citation
            citation = get_statutory_citation(self.rule_id)
            if citation:
                result.verification_status = citation.verification_status
                result.source_filename = citation.source_filename
                result.source_sha256 = citation.source_sha256
                result.source_page = citation.page_number
                result.source_section = citation.section_or_clause
                result.statutory_clause = citation.section_or_clause
                result.statutory_volume = citation.volume
                result.verbatim_statutory_text = citation.verbatim_text
                result.regulation_source = f"{citation.code_standard}, {citation.volume}, {citation.part}"
        except Exception:
            pass
        return result

    def metadata_dict(self) -> dict[str, Any]:
        """Export rule specification for API / database registry seeding."""
        try:
            from engines.compliance.statutory_registry import get_statutory_citation
            citation = get_statutory_citation(self.rule_id)
        except Exception:
            citation = None

        return {
            "rule_id": self.rule_id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "severity": self.severity.value,
            "regulation_source": self.regulation_source,
            "volume": citation.volume if citation else self.volume,
            "part": citation.part if citation else self.part,
            "section": self.section,
            "clause": citation.section_or_clause if citation else self.clause,
            "source_page": citation.page_number if citation else self.source_page,
            "source_filename": citation.source_filename if citation else None,
            "source_sha256": citation.source_sha256 if citation else None,
            "verbatim_text": citation.verbatim_text if citation else None,
            "parameter": self.parameter,
            "unit": self.unit,
            "verification_status": citation.verification_status if citation else self.verification_status.value,
            "is_active": True,
            "rule_version": "1.0",
        }
