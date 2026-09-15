"""
Rule NBC-4-DW-001: Minimum Door / Exit Width.
Reference: National Building Code of India (NBC) 2016, Part 4 (Fire & Life Safety).
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
from engines.geometry.models import CanonicalFloorPlan, ConfidenceLevel, OpeningType


class MinDoorWidthRule(ComplianceRule):
    rule_id = "NBC-4-DW-001"
    title = "Minimum Door and Exit Clear Width"
    description = (
        "Doors in the path of egress must provide sufficient clear width to prevent "
        "crush and ensure orderly evacuation under NBC 2016 Part 4."
    )
    category = "egress"
    severity = Severity.MAJOR
    regulation_source = "NBC 2016"
    part = "Part 4"
    parameter = "min_door_width"
    unit = "m"
    verification_status = RuleVerificationStatus.REQUIRES_VERIFICATION

    DEFAULT_MIN_HABITABLE_DOOR = 0.90      # 900 mm clear width
    DEFAULT_MIN_EXIT_DOOR = 1.00           # 1000 mm exit doorway
    DEFAULT_MIN_BATH_DOOR = 0.75           # 750 mm toilet / bath

    def evaluate(
        self,
        cgm: CanonicalFloorPlan,
        graph: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ) -> list[ComplianceResultData]:
        results: list[ComplianceResultData] = []
        doors_checked = 0

        for floor in cgm.floors:
            for opening in floor.openings:
                if opening.opening_type not in (
                    OpeningType.DOOR,
                    OpeningType.SLIDING_DOOR,
                    OpeningType.DOUBLE_DOOR,
                    OpeningType.EMERGENCY_EXIT,
                ):
                    continue

                doors_checked += 1
                measured_width = opening.width_m

                # Required width based on door classification
                if opening.opening_type == OpeningType.EMERGENCY_EXIT:
                    required_width = self.DEFAULT_MIN_EXIT_DOOR
                    door_desc = "Emergency Exit Door"
                else:
                    required_width = self.DEFAULT_MIN_HABITABLE_DOOR
                    door_desc = "Standard Door"

                is_compliant = measured_width >= required_width
                status = self.resolve_status(is_compliant, opening.confidence)

                violations: list[ViolationData] = []
                if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED):
                    coords = [
                        [opening.position.x, opening.position.y],
                        [
                            opening.position.x + opening.width_m,
                            opening.position.y,
                        ],
                    ]
                    violations.append(
                        ViolationData(
                            entity_type="opening",
                            entity_id=opening.id,
                            geometry_hint="line",
                            coordinates=coords,
                            label_text=f"Door width {measured_width:.2f}m < {required_width:.2f}m",
                            label_position={
                                "x": opening.position.x,
                                "y": opening.position.y,
                            },
                            floor_level=floor.level,
                        )
                    )

                results.append(
                    ComplianceResultData(
                        rule_id=self.rule_id,
                        status=status,
                        severity=self.severity,
                        title=f"{door_desc} Width — ID {str(opening.id)[:8]}",
                        description=(
                            f"{door_desc} clear width measured at {measured_width:.2f} m "
                            f"(configured requirement: {required_width:.2f} m)."
                        ),
                        measured_value=round(measured_width, 3),
                        required_value=required_width,
                        unit="m",
                        regulation_source=f"{self.regulation_source} {self.part}",
                        confidence=opening.confidence.value,
                        floor_level=floor.level,
                        recommendation=(
                            f"Increase opening clear width to at least {required_width:.2f} m "
                            "to comply with emergency egress requirements."
                            if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED)
                            else "Door clear width is compliant."
                        ),
                        evidence={
                            "opening_id": str(opening.id),
                            "opening_type": opening.opening_type.value,
                            "measured_width_m": round(measured_width, 3),
                        },
                        violations=violations,
                    )
                )

        if doors_checked == 0:
            results.append(
                ComplianceResultData(
                    rule_id=self.rule_id,
                    status=ResultStatus.INSUFFICIENT_DATA,
                    severity=Severity.ADVISORY,
                    title="Door Clear Width Check",
                    description="No explicit door openings detected in the floor plan geometry.",
                    confidence=ConfidenceLevel.LOW.value,
                    evidence={"doors_checked": 0},
                )
            )

        return results
