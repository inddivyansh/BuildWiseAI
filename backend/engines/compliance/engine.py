"""
Compliance Engine — Orchestrator for evaluating floor plans against regulatory rules.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from app.logging_config import get_logger
from engines.compliance.base import ComplianceRule
from engines.compliance.registry import rule_registry
from engines.compliance.result import ComplianceResultData, ResultStatus
from engines.geometry.models import CanonicalFloorPlan

logger = get_logger(__name__)


@dataclass
class ComplianceReportSummary:
    """Statistical summary of compliance evaluation."""
    total_checks: int = 0
    passed: int = 0
    failed: int = 0
    unverified: int = 0
    warning: int = 0
    insufficient_data: int = 0
    not_applicable: int = 0
    compliance_score_pct: float = 100.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "total_checks": self.total_checks,
            "passed": self.passed,
            "failed": self.failed,
            "unverified": self.unverified,
            "warning": self.warning,
            "insufficient_data": self.insufficient_data,
            "not_applicable": self.not_applicable,
            "compliance_score_pct": self.compliance_score_pct,
        }


@dataclass
class ComplianceEvaluationOutput:
    """Full output of compliance analysis."""
    results: list[ComplianceResultData] = field(default_factory=list)
    summary: ComplianceReportSummary = field(default_factory=ComplianceReportSummary)

    def to_dict(self) -> dict[str, Any]:
        return {
            "summary": self.summary.to_dict(),
            "results": [r.to_dict() for r in self.results],
        }


class ComplianceEngine:
    """Executes compliance evaluation across all registered or specified rules."""

    def __init__(self, rules: Optional[list[ComplianceRule]] = None) -> None:
        self.rules = rules if rules is not None else rule_registry.instantiate_all()

    def evaluate(
        self,
        cgm: CanonicalFloorPlan,
        graph: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ) -> ComplianceEvaluationOutput:
        """Run all configured rules against the CGM and graph."""
        logger.info("Starting compliance evaluation", rule_count=len(self.rules))
        all_results: list[ComplianceResultData] = []

        for rule in self.rules:
            try:
                rule_results = rule.evaluate(cgm=cgm, graph=graph, context=context)
                for res in rule_results:
                    rule.populate_statutory_evidence(res)
                all_results.extend(rule_results)
            except Exception as e:
                logger.error(
                    "Rule evaluation failed with exception",
                    rule_id=rule.rule_id,
                    error=str(e),
                    exc_info=True,
                )
                err_res = ComplianceResultData(
                    rule_id=rule.rule_id,
                    status=ResultStatus.INSUFFICIENT_DATA,
                    severity=rule.severity,
                    title=f"{rule.title} (Evaluation Error)",
                    description=f"Rule could not be evaluated due to unexpected error: {str(e)}",
                    confidence="low",
                )
                rule.populate_statutory_evidence(err_res)
                all_results.append(err_res)

        summary = self._compute_summary(all_results)
        logger.info(
            "Compliance evaluation complete",
            total_checks=summary.total_checks,
            passed=summary.passed,
            failed=summary.failed,
            unverified=summary.unverified,
            score=summary.compliance_score_pct,
        )

        return ComplianceEvaluationOutput(results=all_results, summary=summary)

    def _compute_summary(self, results: list[ComplianceResultData]) -> ComplianceReportSummary:
        summary = ComplianceReportSummary()
        summary.total_checks = len(results)

        for r in results:
            if r.status == ResultStatus.PASS:
                summary.passed += 1
            elif r.status == ResultStatus.FAIL:
                summary.failed += 1
            elif r.status == ResultStatus.UNVERIFIED:
                summary.unverified += 1
            elif r.status == ResultStatus.WARNING:
                summary.warning += 1
            elif r.status == ResultStatus.INSUFFICIENT_DATA:
                summary.insufficient_data += 1
            elif r.status == ResultStatus.NOT_APPLICABLE:
                summary.not_applicable += 1

        evaluable = summary.passed + summary.failed + summary.unverified
        if evaluable > 0:
            # Score: passed / (passed + failed + unverified)
            summary.compliance_score_pct = round((summary.passed / evaluable) * 100.0, 1)
        else:
            summary.compliance_score_pct = 100.0

        return summary
