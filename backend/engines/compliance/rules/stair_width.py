"""
Rule NBC-4-SW-001: Minimum Staircase Clear Width.
Reference: National Building Code of India (NBC) 2016, Part 4, Section 4.4.3.
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


class MinStairWidthRule(ComplianceRule):
    rule_id = "NBC-4-SW-001"
    title = "Minimum Staircase Clear Width"
    description = (
        "Staircases serving as required exits must maintain adequate clear width "
        "to ensure safe vertical egress under NBC 2016 Part 4."
    )
    category = "egress"
    severity = Severity.CRITICAL
    volume = "Volume 1"
    part = "Part 4 (Fire and Life Safety)"
    clause = "Clause 4.4.2.4.3.2(e)"
    source_page = 288
    parameter = "min_stair_width"
    unit = "m"
    verification_status = RuleVerificationStatus.VERIFIED

    DEFAULT_MIN_RESIDENTIAL_STAIR = 1.00      # 1000 mm (Residential A-2)
    DEFAULT_MIN_COMMERCIAL_STAIR = 1.50       # 1500 mm (Commercial / Business / Educational)
    DEFAULT_MIN_ASSEMBLY_STAIR = 2.00         # 2000 mm (Assembly / Institutional)

    def evaluate(
        self,
        cgm: CanonicalFloorPlan,
        graph: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ) -> list[ComplianceResultData]:
        occupancy = (context or {}).get("occupancy_type", "residential").lower()
        if occupancy in ("assembly", "institutional"):
            required_width = self.DEFAULT_MIN_ASSEMBLY_STAIR
        elif occupancy in ("commercial", "educational", "business"):
            required_width = self.DEFAULT_MIN_COMMERCIAL_STAIR
        else:
            required_width = self.DEFAULT_MIN_RESIDENTIAL_STAIR

        results: list[ComplianceResultData] = []
        stairs_checked = 0

        for floor in cgm.floors:
            for stair in floor.stairs:
                stairs_checked += 1
                measured_width = stair.width_m

                is_compliant = measured_width >= required_width
                status = self.resolve_status(is_compliant, stair.confidence)

                violations: list[ViolationData] = []
                if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED):
                    violations.append(
                        ViolationData(
                            entity_type="stair",
                            entity_id=stair.id,
                            geometry_hint="point",
                            coordinates=[[stair.position.x, stair.position.y]],
                            label_text=f"Stair width {measured_width:.2f}m < {required_width:.2f}m",
                            label_position={
                                "x": stair.position.x,
                                "y": stair.position.y,
                            },
                            floor_level=floor.level,
                        )
                    )

                results.append(
                    ComplianceResultData(
                        rule_id=self.rule_id,
                        status=status,
                        severity=self.severity,
                        title=f"Stair Width — ID {str(stair.id)[:8]}",
                        description=(
                            f"Staircase clear width measured at {measured_width:.2f} m "
                            f"(configured requirement: {required_width:.2f} m)."
                        ),
                        measured_value=round(measured_width, 3),
                        required_value=required_width,
                        unit="m",
                        regulation_source=f"{self.regulation_source} {self.part}",
                        confidence=stair.confidence.value,
                        floor_level=floor.level,
                        recommendation=(
                            f"Increase stair flight clear width to at least {required_width:.2f} m "
                            "to meet emergency egress capacity standards."
                            if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED)
                            else "Staircase width complies with NBC fire safety standards."
                        ),
                        evidence={
                            "stair_id": str(stair.id),
                            "measured_width_m": round(measured_width, 3),
                            "riser_count": stair.riser_count,
                        },
                        violations=violations,
                    )
                )

        if stairs_checked == 0:
            results.append(
                ComplianceResultData(
                    rule_id=self.rule_id,
                    status=ResultStatus.INSUFFICIENT_DATA,
                    severity=Severity.ADVISORY,
                    title="Staircase Width Check",
                    description="No staircases identified in the floor plan.",
                    confidence=ConfidenceLevel.LOW.value,
                )
            )

        return results
