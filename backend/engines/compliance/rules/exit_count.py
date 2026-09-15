"""
Rule NBC-4-EX-001: Minimum Number of Exits per Floor.
Reference: National Building Code of India (NBC) 2016, Part 4, Section 4.2.
"""

from __future__ import annotations

from typing import Any, Optional

from engines.compliance.base import ComplianceRule
from engines.compliance.result import (
    ComplianceResultData,
    ResultStatus,
    RuleVerificationStatus,
    Severity,
    ViolationData,
)
from engines.geometry.models import CanonicalFloorPlan, ConfidenceLevel


class MinExitCountRule(ComplianceRule):
    rule_id = "NBC-4-EX-001"
    title = "Minimum Number of Required Exits"
    description = (
        "Floors exceeding 500 m² or occupancy threshold must be provided with at least "
        "two separate, independent exits remote from each other under NBC 2016 Part 4."
    )
    category = "egress"
    severity = Severity.CRITICAL
    volume = "Volume 1"
    part = "Part 4 (Fire and Life Safety)"
    clause = "Clause 4.4.2.1 & 4.4.2.4.3.1"
    source_page = 285
    parameter = "min_exit_count"
    unit = "count"
    verification_status = RuleVerificationStatus.VERIFIED

    AREA_THRESHOLD_FOR_DUAL_EXITS = 500.0   # 500 m²

    def evaluate(
        self,
        cgm: CanonicalFloorPlan,
        graph: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ) -> list[ComplianceResultData]:
        results: list[ComplianceResultData] = []

        for floor in cgm.floors:
            floor_area = sum(r.area_m2 or 0.0 for r in floor.rooms)
            if floor_area == 0 and cgm.total_area_m2:
                floor_area = cgm.total_area_m2 / max(len(cgm.floors), 1)

            # Count exits + stairwells + emergency doors
            exit_count = len(floor.exits) + len(floor.stairs)
            for op in floor.openings:
                if op.opening_type.value == "emergency_exit":
                    exit_count += 1

            required_exits = 2 if floor_area >= self.AREA_THRESHOLD_FOR_DUAL_EXITS else 1
            is_compliant = exit_count >= required_exits

            # Determine confidence
            confidence = ConfidenceLevel.HIGH if floor.exits or floor.stairs else ConfidenceLevel.MEDIUM
            status = self.resolve_status(is_compliant, confidence)

            violations: list[ViolationData] = []
            if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED):
                # Put a floor-level violation
                bb = cgm.bounding_box
                violations.append(
                    ViolationData(
                        entity_type="floor",
                        geometry_hint="bbox",
                        coordinates=[[bb.xmin, bb.ymin], [bb.xmax, bb.ymin], [bb.xmax, bb.ymax], [bb.xmin, bb.ymax]],
                        label_text=f"Floor exits: {exit_count} < required {required_exits}",
                        label_position={"x": (bb.xmin + bb.xmax) / 2, "y": (bb.ymin + bb.ymax) / 2},
                        floor_level=floor.level,
                    )
                )

            results.append(
                ComplianceResultData(
                    rule_id=self.rule_id,
                    status=status,
                    severity=self.severity,
                    title=f"Exit Count — Floor Level {floor.level}",
                    description=(
                        f"Floor area is {floor_area:.1f} m² with {exit_count} available exits/stairs "
                        f"(minimum required: {required_exits})."
                    ),
                    measured_value=float(exit_count),
                    required_value=float(required_exits),
                    unit="count",
                    regulation_source=f"{self.regulation_source} {self.part} {self.section}",
                    confidence=confidence.value,
                    floor_level=floor.level,
                    recommendation=(
                        "Add a second independent exit staircase/doorway placed remotely from "
                        "the existing exit to ensure dual egress paths."
                        if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED)
                        else "Floor satisfies minimum exit count requirements."
                    ),
                    evidence={
                        "floor_level": floor.level,
                        "floor_area_m2": round(floor_area, 2),
                        "detected_exits": len(floor.exits),
                        "detected_stairs": len(floor.stairs),
                        "total_exit_elements": exit_count,
                    },
                    violations=violations,
                )
            )

        return results
