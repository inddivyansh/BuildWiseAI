"""Unit tests — Compliance Engine and NBC Rules."""

import pytest
from engines.compliance.base import RuleVerificationStatus
from engines.compliance.engine import ComplianceEngine
from engines.compliance.registry import rule_registry
from engines.compliance.result import ResultStatus, Severity
from engines.compliance.rules.corridor_width import MinCorridorWidthRule
from engines.compliance.rules.door_width import MinDoorWidthRule
from engines.compliance.rules.room_area import MinRoomAreaRule
from engines.geometry.models import (
    CGMBoundingBox,
    CGMFloor,
    CGMMetadata,
    CGMOpening,
    CGMRoom,
    CanonicalFloorPlan,
    ConfidenceLevel,
    OpeningType,
    Point2D,
    Polygon2D,
    RoomType,
)


@pytest.fixture
def sample_floor_plan() -> CanonicalFloorPlan:
    """Create a synthetic floor plan with various rooms, doors, and a corridor."""
    # Living room: 4m x 4m = 16 m2
    living = CGMRoom(
        label="Living Room",
        room_type=RoomType.LIVING_ROOM,
        boundary=Polygon2D(vertices=[
            Point2D(x=0, y=0),
            Point2D(x=4, y=0),
            Point2D(x=4, y=4),
            Point2D(x=0, y=4),
        ]),
        confidence=ConfidenceLevel.HIGH,
    )
    living.compute_area()

    # Small bedroom (sub-standard): 2m x 3m = 6 m2 (< 9.5 m2 requirement)
    small_bedroom = CGMRoom(
        label="Substandard Bedroom",
        room_type=RoomType.BEDROOM,
        boundary=Polygon2D(vertices=[
            Point2D(x=4, y=0),
            Point2D(x=6, y=0),
            Point2D(x=6, y=3),
            Point2D(x=4, y=3),
        ]),
        confidence=ConfidenceLevel.HIGH,
    )
    small_bedroom.compute_area()

    # Narrow corridor: 0.75m wide x 6m long (< 1.0m requirement)
    narrow_corridor = CGMRoom(
        label="Main Corridor",
        room_type=RoomType.CORRIDOR,
        boundary=Polygon2D(vertices=[
            Point2D(x=0, y=4),
            Point2D(x=6, y=4),
            Point2D(x=6, y=4.75),
            Point2D(x=0, y=4.75),
        ]),
        confidence=ConfidenceLevel.HIGH,
    )
    narrow_corridor.compute_area()

    # Narrow door: 0.7m (< 0.9m requirement)
    narrow_door = CGMOpening(
        opening_type=OpeningType.DOOR,
        position=Point2D(x=2.0, y=4.0),
        width_m=0.70,
        confidence=ConfidenceLevel.HIGH,
    )

    # Standard compliant door: 1.0m
    compliant_door = CGMOpening(
        opening_type=OpeningType.DOOR,
        position=Point2D(x=4.0, y=1.5),
        width_m=1.00,
        confidence=ConfidenceLevel.HIGH,
    )

    floor = CGMFloor(
        level=0,
        rooms=[living, small_bedroom, narrow_corridor],
        openings=[narrow_door, compliant_door],
    )

    return CanonicalFloorPlan(
        floors=[floor],
        bounding_box=CGMBoundingBox(xmin=0, ymin=0, xmax=6, ymax=4.75),
        metadata=CGMMetadata(
            source_format="synthetic",
            source_filename="test_floor.dxf",
            extraction_method="unit_test",
        ),
    )


class TestComplianceRuleRegistry:
    def test_registry_contains_rules(self):
        rules = rule_registry.list_rule_classes()
        assert len(rules) >= 8

    def test_lookup_corridor_rule(self):
        rule_cls = rule_registry.get_rule("NBC-4-CW-001")
        assert rule_cls is not None
        assert rule_cls.rule_id == "NBC-4-CW-001"

    def test_metadata_export(self):
        metadata_list = rule_registry.list_rules_metadata()
        assert len(metadata_list) >= 8
        first = metadata_list[0]
        assert "rule_id" in first
        assert "verification_status" in first


class TestMinCorridorWidthRule:
    def test_detects_substandard_corridor_width(self, sample_floor_plan):
        rule = MinCorridorWidthRule()
        results = rule.evaluate(sample_floor_plan)
        assert len(results) == 1
        res = results[0]
        # Because rule is REQUIRES_VERIFICATION, non-compliance produces UNVERIFIED (not premature FAIL)
        assert res.status == ResultStatus.UNVERIFIED
        assert res.measured_value is not None
        assert res.measured_value < 1.0
        assert len(res.violations) == 1
        assert res.violations[0].entity_type == "corridor"

    def test_low_confidence_produces_insufficient_data(self, sample_floor_plan):
        # Set corridor confidence to LOW
        sample_floor_plan.floors[0].rooms[2].confidence = ConfidenceLevel.LOW
        rule = MinCorridorWidthRule()
        results = rule.evaluate(sample_floor_plan)
        assert results[0].status == ResultStatus.INSUFFICIENT_DATA


class TestMinRoomAreaRule:
    def test_evaluates_living_and_bedroom(self, sample_floor_plan):
        rule = MinRoomAreaRule()
        results = rule.evaluate(sample_floor_plan)
        assert len(results) == 2

        # Living room (16 m2) should pass
        living_res = next(r for r in results if "Living" in r.title)
        assert living_res.status == ResultStatus.PASS
        assert living_res.measured_value == 16.0

        # Substandard bedroom (6 m2 < 9.5 m2) should be flagged UNVERIFIED (since rule requires verification)
        bed_res = next(r for r in results if "Bedroom" in r.title)
        assert bed_res.status == ResultStatus.UNVERIFIED
        assert bed_res.measured_value == 6.0
        assert len(bed_res.violations) == 1


class TestMinDoorWidthRule:
    def test_evaluates_doors(self, sample_floor_plan):
        rule = MinDoorWidthRule()
        results = rule.evaluate(sample_floor_plan)
        assert len(results) == 2

        # Compliant 1.0m door
        pass_res = next(r for r in results if r.measured_value == 1.00)
        assert pass_res.status == ResultStatus.PASS

        # Narrow 0.70m door
        narrow_res = next(r for r in results if r.measured_value == 0.70)
        assert narrow_res.status == ResultStatus.UNVERIFIED
        assert len(narrow_res.violations) == 1


class TestComplianceEngine:
    def test_full_evaluation_run(self, sample_floor_plan):
        engine = ComplianceEngine()
        output = engine.evaluate(sample_floor_plan)

        assert output.summary.total_checks > 0
        assert output.summary.passed > 0
        assert isinstance(output.summary.compliance_score_pct, float)
        assert len(output.results) == output.summary.total_checks

        # Verify JSON serializability of output
        out_dict = output.to_dict()
        assert "summary" in out_dict
        assert "results" in out_dict
        assert "compliance_score_pct" in out_dict["summary"]
