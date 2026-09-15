"""
Rule NBC-4-CW-001: Minimum Corridor Width.
Reference: National Building Code of India (NBC) 2016, Part 4 (Fire & Life Safety).
"""

from __future__ import annotations

import math
from typing import Any, Optional

from engines.compliance.base import ComplianceRule
from engines.compliance.result import (
    ComplianceResultData,
    ResultStatus,
    RuleVerificationStatus,
    Severity,
    ViolationData,
)
from engines.geometry.models import CanonicalFloorPlan, ConfidenceLevel, RoomType


class MinCorridorWidthRule(ComplianceRule):
    rule_id = "NBC-4-CW-001"
    title = "Minimum Corridor Width"
    description = (
        "Corridors and passageways must maintain a minimum clear width to ensure "
        "safe evacuation during fire and emergencies under NBC 2016 Part 4."
    )
    category = "egress"
    severity = Severity.CRITICAL
    regulation_source = "NBC 2016"
    part = "Part 4"
    parameter = "min_corridor_width"
    unit = "m"
    verification_status = RuleVerificationStatus.REQUIRES_VERIFICATION

    # Threshold defaults (awaiting final clause citation from NBC Part 4 PDF)
    DEFAULT_MIN_WIDTH_RESIDENTIAL = 1.0     # 1000 mm for residential
    DEFAULT_MIN_WIDTH_COMMERCIAL = 1.5      # 1500 mm for commercial / educational / assembly

    def evaluate(
        self,
        cgm: CanonicalFloorPlan,
        graph: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ) -> list[ComplianceResultData]:
        occupancy = (context or {}).get("occupancy_type", "residential").lower()
        required_width = (
            self.DEFAULT_MIN_WIDTH_COMMERCIAL
            if occupancy in ("commercial", "assembly", "educational", "institutional")
            else self.DEFAULT_MIN_WIDTH_RESIDENTIAL
        )

        results: list[ComplianceResultData] = []
        corridors_found = 0

        for floor in cgm.floors:
            for room in floor.rooms:
                if room.room_type not in (RoomType.CORRIDOR, RoomType.LOBBY):
                    continue

                corridors_found += 1
                poly = room.to_shapely()
                if poly is None or poly.is_empty:
                    continue

                # Corridor width estimation: minimum bounding rectangle minor dimension or area/perimeter ratio
                # For long corridors, width ~= 2 * area / perimeter or min rotated rect width
                rect = poly.minimum_rotated_rectangle
                coords = list(rect.exterior.coords)
                edge_lengths = [
                    math.hypot(coords[i + 1][0] - coords[i][0], coords[i + 1][1] - coords[i][1])
                    for i in range(len(coords) - 1)
                ]
                measured_width = min(edge_lengths) if edge_lengths else 0.0

                is_compliant = measured_width >= required_width
                status = self.resolve_status(is_compliant, room.confidence)

                violations: list[ViolationData] = []
                if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED):
                    violations.append(
                        ViolationData(
                            entity_type="corridor",
                            entity_id=room.id,
                            geometry_hint="polygon",
                            coordinates=room.boundary.to_list(),
                            label_text=f"Width {measured_width:.2f}m < {required_width:.2f}m",
                            label_position={
                                "x": room.boundary.centroid.x,
                                "y": room.boundary.centroid.y,
                            },
                            floor_level=floor.level,
                        )
                    )

                results.append(
                    ComplianceResultData(
                        rule_id=self.rule_id,
                        status=status,
                        severity=self.severity,
                        title=f"Corridor Width — {room.label or 'Corridor'}",
                        description=(
                            f"Corridor width measured at {measured_width:.2f} m against "
                            f"configured requirement of {required_width:.2f} m."
                        ),
                        measured_value=round(measured_width, 3),
                        required_value=required_width,
                        unit="m",
                        regulation_source=f"{self.regulation_source} {self.part}",
                        confidence=room.confidence.value,
                        floor_level=floor.level,
                        recommendation=(
                            f"Widen corridor '{room.label or 'unnamed'}' to at least {required_width:.2f} m "
                            "to comply with emergency egress clear width requirements."
                            if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED)
                            else "Corridor meets width requirement."
                        ),
                        evidence={
                            "room_id": str(room.id),
                            "room_label": room.label,
                            "area_m2": round(room.area_m2, 2) if room.area_m2 else None,
                            "estimated_width_m": round(measured_width, 3),
                        },
                        violations=violations,
                    )
                )

        if corridors_found == 0:
            results.append(
                ComplianceResultData(
                    rule_id=self.rule_id,
                    status=ResultStatus.NOT_APPLICABLE,
                    severity=Severity.ADVISORY,
                    title="Corridor Width Check",
                    description="No designated corridor spaces found in the floor plan.",
                    confidence=ConfidenceLevel.HIGH.value,
                    evidence={"corridors_found": 0},
                )
            )

        return results
