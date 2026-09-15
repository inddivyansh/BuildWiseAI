"""
Rule NBC-8-LU-001: Minimum Window Opening Ratio for Natural Light and Ventilation.
Reference: National Building Code of India (NBC) 2016, Part 8, Section 1 (Lighting and Natural Ventilation).
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
from engines.geometry.models import CanonicalFloorPlan, ConfidenceLevel, OpeningType, RoomType


class MinVentilationRatioRule(ComplianceRule):
    rule_id = "NBC-8-LU-001"
    title = "Minimum Natural Light and Ventilation Window Area"
    description = (
        "Habitable rooms must provide natural light and ventilation through windows/openings "
        "aggregating to at least 10% (0.10) of room floor area under NBC 2016 Part 8."
    )
    category = "ventilation"
    severity = Severity.MINOR
    volume = "Volume 2"
    part = "Part 8 (Building Services), Section 1 (Lighting and Natural Ventilation)"
    clause = "Clause 4.4.4"
    source_page = 116
    parameter = "min_ventilation_ratio"
    unit = "ratio"
    verification_status = RuleVerificationStatus.VERIFIED

    DEFAULT_MIN_RATIO = 0.10       # 10% of floor area
    DEFAULT_ASSUMED_WINDOW_HEIGHT = 1.2  # 1.2m default window height if 2D only

    def evaluate(
        self,
        cgm: CanonicalFloorPlan,
        graph: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ) -> list[ComplianceResultData]:
        results: list[ComplianceResultData] = []
        habitable_types = (RoomType.BEDROOM, RoomType.LIVING_ROOM, RoomType.KITCHEN)

        for floor in cgm.floors:
            windows = [op for op in floor.openings if op.opening_type == OpeningType.WINDOW]

            for room in floor.rooms:
                if room.room_type not in habitable_types:
                    continue

                room_poly = room.to_shapely()
                if room_poly is None or room_poly.is_empty:
                    continue

                room_area = room.area_m2 or room_poly.area
                if room_area <= 0:
                    continue

                # Find windows linked or adjacent to this room
                room_window_area = 0.0
                linked_windows = 0
                for w in windows:
                    # Check distance from window position to room boundary
                    import shapely.geometry
                    pt = shapely.geometry.Point(w.position.x, w.position.y)
                    # Window width * height (height default 1.2m or w.height_m)
                    h = w.height_m or self.DEFAULT_ASSUMED_WINDOW_HEIGHT
                    if room_poly.distance(pt) < 0.5:
                        room_window_area += w.width_m * h
                        linked_windows += 1

                actual_ratio = room_window_area / room_area
                is_compliant = actual_ratio >= self.DEFAULT_MIN_RATIO
                status = self.resolve_status(is_compliant, room.confidence)

                violations: list[ViolationData] = []
                if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED):
                    violations.append(
                        ViolationData(
                            entity_type="room",
                            entity_id=room.id,
                            geometry_hint="polygon",
                            coordinates=room.boundary.to_list(),
                            label_text=f"Ventilation ratio {actual_ratio*100:.1f}% < 10.0%",
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
                        title=f"Natural Light & Ventilation — {room.label or room.room_type.value}",
                        description=(
                            f"Window area is {room_window_area:.2f} m² for room area {room_area:.2f} m² "
                            f"(ratio: {actual_ratio*100:.1f}%, minimum required: {self.DEFAULT_MIN_RATIO*100:.0f}%)."
                        ),
                        measured_value=round(actual_ratio, 4),
                        required_value=self.DEFAULT_MIN_RATIO,
                        unit="ratio",
                        regulation_source=f"{self.regulation_source} {self.part} {self.section}",
                        confidence=room.confidence.value,
                        floor_level=floor.level,
                        recommendation=(
                            "Add or enlarge external window openings to provide at least "
                            f"{room_area * self.DEFAULT_MIN_RATIO:.2f} m² of aggregate glazing area."
                            if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED)
                            else "Window-to-floor ventilation ratio is compliant."
                        ),
                        evidence={
                            "room_id": str(room.id),
                            "room_area_m2": round(room_area, 2),
                            "window_area_m2": round(room_window_area, 2),
                            "windows_count": linked_windows,
                        },
                        violations=violations,
                    )
                )

        if not results:
            results.append(
                ComplianceResultData(
                    rule_id=self.rule_id,
                    status=ResultStatus.INSUFFICIENT_DATA,
                    severity=Severity.ADVISORY,
                    title="Ventilation Ratio Check",
                    description="No habitable rooms or windows found to evaluate ventilation ratios.",
                    confidence=ConfidenceLevel.LOW.value,
                )
            )

        return results
