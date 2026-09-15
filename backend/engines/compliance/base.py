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

    def metadata_dict(self) -> dict[str, Any]:
        """Export rule specification for API / database registry seeding."""
        return {
            "rule_id": self.rule_id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "severity": self.severity.value,
            "regulation_source": self.regulation_source,
            "volume": self.volume,
            "part": self.part,
            "section": self.section,
            "clause": self.clause,
            "source_page": self.source_page,
            "parameter": self.parameter,
            "unit": self.unit,
            "verification_status": self.verification_status.value,
            "is_active": True,
            "rule_version": "1.0",
        }
