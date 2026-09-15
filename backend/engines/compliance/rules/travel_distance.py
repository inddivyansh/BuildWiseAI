"""
Rule NBC-4-TD-001: Maximum Travel Distance to Exit.
Reference: National Building Code of India (NBC) 2016, Part 4, Table 5 (Travel Distances).
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
from engines.geometry.models import CanonicalFloorPlan, ConfidenceLevel, ExitType, RoomType


class MaxTravelDistanceRule(ComplianceRule):
    rule_id = "NBC-4-TD-001"
    title = "Maximum Travel Distance to Exit"
    description = (
        "Travel distance from any point in a building to the nearest final exit or "
        "enclosed staircase shall not exceed limits prescribed in NBC 2016 Part 4."
    )
    category = "egress"
    severity = Severity.CRITICAL
    regulation_source = "NBC 2016"
    part = "Part 4"
    section = "Section 4.4"
    parameter = "max_travel_distance"
    unit = "m"
    verification_status = RuleVerificationStatus.REQUIRES_VERIFICATION

    # NBC 2016 Part 4 Table 5 typical thresholds:
    DEFAULT_MAX_DISTANCE_NON_SPRINKLERED = 30.0    # 30 meters
    DEFAULT_MAX_DISTANCE_SPRINKLERED = 45.0        # 45 meters

    def evaluate(
        self,
        cgm: CanonicalFloorPlan,
        graph: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ) -> list[ComplianceResultData]:
        is_sprinklered = (context or {}).get("is_sprinklered", False)
        max_allowed_dist = (
            self.DEFAULT_MAX_DISTANCE_SPRINKLERED
            if is_sprinklered
            else self.DEFAULT_MAX_DISTANCE_NON_SPRINKLERED
        )

        results: list[ComplianceResultData] = []

        for floor in cgm.floors:
            # Locate all exits on this floor
            exit_points: list[tuple[float, float]] = []
            for ex in floor.exits:
                exit_points.append((ex.position.x, ex.position.y))

            # If no explicit exits, look for emergency doors or stairwells
            if not exit_points:
                for opening in floor.openings:
                    if opening.opening_type.value == "emergency_exit":
                        exit_points.append((opening.position.x, opening.position.y))

            # Also stairwells act as floor exit points for multi-story
            for stair in floor.stairs:
                exit_points.append((stair.position.x, stair.position.y))

            if not exit_points:
                results.append(
                    ComplianceResultData(
                        rule_id=self.rule_id,
                        status=ResultStatus.INSUFFICIENT_DATA,
                        severity=self.severity,
                        title="Travel Distance Check — No Exits Found",
                        description=f"Floor level {floor.level} has no identified exit points or stairwells to measure travel distance against.",
                        confidence=ConfidenceLevel.LOW.value,
                        floor_level=floor.level,
                    )
                )
                continue

            for room in floor.rooms:
                if room.room_type in (RoomType.CORRIDOR, RoomType.UNKNOWN):
                    continue

                # Room centroid to nearest exit euclidean or topological distance
                rx, ry = room.boundary.centroid.x, room.boundary.centroid.y
                min_distance = min(
                    math.hypot(rx - ex[0], ry - ex[1]) for ex in exit_points
                )
                # Apply 1.2x factor for rectilinear circulation if direct straight-line
                estimated_travel_dist = round(min_distance * 1.2, 2)

                is_compliant = estimated_travel_dist <= max_allowed_dist
                status = self.resolve_status(is_compliant, room.confidence)

                violations: list[ViolationData] = []
                if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED):
                    violations.append(
                        ViolationData(
                            entity_type="room",
                            entity_id=room.id,
                            geometry_hint="polygon",
                            coordinates=room.boundary.to_list(),
                            label_text=f"Egress travel {estimated_travel_dist:.1f}m > {max_allowed_dist:.1f}m",
                            label_position={"x": rx, "y": ry},
                            floor_level=floor.level,
                        )
                    )

                results.append(
                    ComplianceResultData(
                        rule_id=self.rule_id,
                        status=status,
                        severity=self.severity,
                        title=f"Travel Distance — {room.label or 'Room'}",
                        description=(
                            f"Estimated travel distance to nearest exit is {estimated_travel_dist:.1f} m "
                            f"(maximum allowed: {max_allowed_dist:.1f} m)."
                        ),
                        measured_value=estimated_travel_dist,
                        required_value=max_allowed_dist,
                        unit="m",
                        regulation_source=f"{self.regulation_source} {self.part}",
                        confidence=room.confidence.value,
                        floor_level=floor.level,
                        recommendation=(
                            f"Provide an additional emergency exit or relocate exit doorway to bring travel "
                            f"distance within the {max_allowed_dist:.1f} m threshold."
                            if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED)
                            else "Travel distance to exit complies with fire code."
                        ),
                        evidence={
                            "room_id": str(room.id),
                            "room_label": room.label,
                            "estimated_travel_distance_m": estimated_travel_dist,
                            "nearest_exit_count": len(exit_points),
                        },
                        violations=violations,
                    )
                )

        return results
