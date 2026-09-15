"""
Rule NBC-4-DE-001: Maximum Dead-End Corridor Length.
Reference: National Building Code of India (NBC) 2016, Part 4, Section 4.4.2.
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


class MaxDeadEndCorridorRule(ComplianceRule):
    rule_id = "NBC-4-DE-001"
    title = "Maximum Dead-End Corridor Length"
    description = (
        "Dead-end corridors where egress is possible in only one direction shall not "
        "exceed 6.0 m in length under NBC 2016 Part 4 to prevent occupant entrapment."
    )
    category = "egress"
    severity = Severity.CRITICAL
    regulation_source = "NBC 2016"
    part = "Part 4"
    section = "Section 4.4.2"
    parameter = "max_dead_end_length"
    unit = "m"
    verification_status = RuleVerificationStatus.REQUIRES_VERIFICATION

    DEFAULT_MAX_DEAD_END_M = 6.0       # 6.0 meters

    def evaluate(
        self,
        cgm: CanonicalFloorPlan,
        graph: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ) -> list[ComplianceResultData]:
        results: list[ComplianceResultData] = []
        max_allowed = self.DEFAULT_MAX_DEAD_END_M

        for floor in cgm.floors:
            corridor_count = 0
            for room in floor.rooms:
                if room.room_type != RoomType.CORRIDOR:
                    continue

                corridor_count += 1
                poly = room.to_shapely()
                if poly is None or poly.is_empty:
                    continue

                rect = poly.minimum_rotated_rectangle
                coords = list(rect.exterior.coords)
                edge_lengths = [
                    math.hypot(coords[i + 1][0] - coords[i][0], coords[i + 1][1] - coords[i][1])
                    for i in range(len(coords) - 1)
                ]
                # Major dimension is the corridor length
                corridor_length = max(edge_lengths) if edge_lengths else 0.0

                # Check if corridor is a dead-end:
                # If connected to only 1 egress passage or if degree in graph is 1
                is_dead_end = False
                if graph and hasattr(graph, "nx_graph") and graph.nx_graph is not None:
                    node_id = str(room.id)
                    if node_id in graph.nx_graph:
                        degree = graph.nx_graph.degree(node_id)
                        if degree <= 1:
                            is_dead_end = True

                if is_dead_end:
                    is_compliant = corridor_length <= max_allowed
                    status = self.resolve_status(is_compliant, room.confidence)

                    violations: list[ViolationData] = []
                    if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED):
                        violations.append(
                            ViolationData(
                                entity_type="corridor",
                                entity_id=room.id,
                                geometry_hint="polygon",
                                coordinates=room.boundary.to_list(),
                                label_text=f"Dead-end length {corridor_length:.1f}m > {max_allowed:.1f}m",
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
                            title=f"Dead-End Corridor — {room.label or 'Corridor'}",
                            description=(
                                f"Dead-end corridor length is {corridor_length:.1f} m "
                                f"(maximum allowed limit: {max_allowed:.1f} m)."
                            ),
                            measured_value=round(corridor_length, 2),
                            required_value=max_allowed,
                            unit="m",
                            regulation_source=f"{self.regulation_source} {self.part}",
                            confidence=room.confidence.value,
                            floor_level=floor.level,
                            recommendation=(
                                "Provide a second distinct path of egress or reduce dead-end length "
                                f"to under {max_allowed:.1f} m to eliminate entrapment hazard."
                                if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED)
                                else "Dead-end length complies with regulations."
                            ),
                            evidence={
                                "room_id": str(room.id),
                                "corridor_length_m": round(corridor_length, 2),
                                "is_dead_end": True,
                            },
                            violations=violations,
                        )
                    )

            if corridor_count == 0:
                results.append(
                    ComplianceResultData(
                        rule_id=self.rule_id,
                        status=ResultStatus.NOT_APPLICABLE,
                        severity=Severity.ADVISORY,
                        title="Dead-End Corridor Check",
                        description="No corridors identified for dead-end egress evaluation.",
                        confidence=ConfidenceLevel.HIGH.value,
                    )
                )

        return results
