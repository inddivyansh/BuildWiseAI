"""
Rule NBC-3-RA-001: Minimum Habitable Room Area and Dimensions.
Reference: National Building Code of India (NBC) 2016, Part 3, Clause 12.2.
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
from engines.geometry.models import CanonicalFloorPlan, ConfidenceLevel, RoomType


class MinRoomAreaRule(ComplianceRule):
    rule_id = "NBC-3-RA-001"
    title = "Minimum Habitable Room Area"
    description = (
        "Rooms intended for human habitation must satisfy minimum floor area requirements "
        "to ensure adequate volume, ventilation, and living standards under NBC 2016 Part 3."
    )
    category = "spatial"
    severity = Severity.MAJOR
    regulation_source = "NBC 2016"
    part = "Part 3"
    clause = "Clause 12.2"
    parameter = "min_room_area"
    unit = "m2"
    verification_status = RuleVerificationStatus.REQUIRES_VERIFICATION

    # NBC 2016 Part 3 minimum floor area standards (m²):
    MIN_AREAS = {
        RoomType.BEDROOM: 9.5,
        RoomType.LIVING_ROOM: 9.5,
        RoomType.KITCHEN: 5.0,
        RoomType.BATHROOM: 1.8,
        RoomType.TOILET: 1.1,
    }

    def evaluate(
        self,
        cgm: CanonicalFloorPlan,
        graph: Optional[Any] = None,
        context: Optional[dict[str, Any]] = None,
    ) -> list[ComplianceResultData]:
        results: list[ComplianceResultData] = []
        habitable_rooms_checked = 0

        for floor in cgm.floors:
            for room in floor.rooms:
                if room.room_type not in self.MIN_AREAS:
                    continue

                habitable_rooms_checked += 1
                required_min = self.MIN_AREAS[room.room_type]
                measured_area = room.area_m2 or 0.0

                is_compliant = measured_area >= required_min
                status = self.resolve_status(is_compliant, room.confidence)

                violations: list[ViolationData] = []
                if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED):
                    violations.append(
                        ViolationData(
                            entity_type="room",
                            entity_id=room.id,
                            geometry_hint="polygon",
                            coordinates=room.boundary.to_list(),
                            label_text=f"Area {measured_area:.2f}m² < {required_min:.1f}m²",
                            label_position={
                                "x": room.boundary.centroid.x,
                                "y": room.boundary.centroid.y,
                            },
                            floor_level=floor.level,
                        )
                    )

                type_name = room.room_type.value.replace("_", " ").title()
                results.append(
                    ComplianceResultData(
                        rule_id=self.rule_id,
                        status=status,
                        severity=self.severity,
                        title=f"Room Area — {room.label or type_name}",
                        description=(
                            f"{type_name} area is {measured_area:.2f} m² "
                            f"(minimum required: {required_min:.1f} m²)."
                        ),
                        measured_value=round(measured_area, 2),
                        required_value=required_min,
                        unit="m2",
                        regulation_source=f"{self.regulation_source} {self.part} {self.clause}",
                        confidence=room.confidence.value,
                        floor_level=floor.level,
                        recommendation=(
                            f"Expand room '{room.label or type_name}' to at least {required_min:.1f} m² "
                            "to meet minimum statutory habitable space standards."
                            if status in (ResultStatus.FAIL, ResultStatus.UNVERIFIED)
                            else f"{type_name} meets minimum area requirement."
                        ),
                        evidence={
                            "room_id": str(room.id),
                            "room_type": room.room_type.value,
                            "measured_area_m2": round(measured_area, 2),
                            "required_min_m2": required_min,
                        },
                        violations=violations,
                    )
                )

        if habitable_rooms_checked == 0:
            results.append(
                ComplianceResultData(
                    rule_id=self.rule_id,
                    status=ResultStatus.INSUFFICIENT_DATA,
                    severity=Severity.ADVISORY,
                    title="Room Area Check",
                    description="No classified habitable rooms (bedroom, living, kitchen, bath) found.",
                    confidence=ConfidenceLevel.LOW.value,
                )
            )

        return results
