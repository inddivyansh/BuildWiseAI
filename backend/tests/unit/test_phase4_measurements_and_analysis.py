"""Unit tests for Phase 4: Real Geometric Measurements, Violation Intelligence, and Recommendations"""

import uuid
import pytest

from engines.geometry.models import (
    CanonicalFloorPlan,
    CGMFloor,
    CGMWall,
    CGMRoom,
    CGMOpening,
    CGMStair,
    CGMExit,
    CGMBoundingBox,
    CGMMetadata,
    Polygon2D,
    Point2D,
    LineSegment,
    RoomType,
    OpeningType,
    ExitType,
    ConfidenceLevel,
)
from engines.graph.builder import FloorPlanGraphBuilder
from engines.measurements.contracts import GeometricMeasurement, MeasurementCategory
from engines.measurements.extractor import GeometricMeasurementExtractor
from engines.compliance.recommendations import RecommendationEngine
from engines.compliance.rules import (
    MaxTravelDistanceRule,
    MaxDeadEndCorridorRule,
    MinCorridorWidthRule,
    MinDoorWidthRule,
    MinRoomAreaRule,
    MinExitCountRule,
    MinVentilationRatioRule,
)
from engines.compliance.result import ResultStatus
from app.schemas.analysis import (
    MeasurementItem,
    AnalysisMeasurementsResponse,
    EgressPathItem,
    AnalysisEgressPathsResponse,
    AnalysisSummaryResponse,
    IndividualViolationResponse,
    AnalysisHistoryItem,
    AnalysisHistoryResponse,
)


def create_sample_cgm() -> CanonicalFloorPlan:
    """Deterministic floor plan with rooms, corridor, door, stair, window, and exit."""
    room1 = CGMRoom(
        room_type=RoomType.LIVING_ROOM,
        label="Executive Room",
        boundary=Polygon2D(vertices=[Point2D(x=0, y=0), Point2D(x=4, y=0), Point2D(x=4, y=5), Point2D(x=0, y=5)]),
        area_m2=20.0,
        floor_level=0,
        confidence=ConfidenceLevel.HIGH,
    )
    corridor = CGMRoom(
        room_type=RoomType.CORRIDOR,
        label="Main Corridor",
        boundary=Polygon2D(vertices=[Point2D(x=4, y=0), Point2D(x=5.2, y=0), Point2D(x=5.2, y=10), Point2D(x=4, y=10)]),
        area_m2=12.0,
        floor_level=0,
        confidence=ConfidenceLevel.HIGH,
    )
    wall = CGMWall(
        segments=[LineSegment(start=Point2D(x=0, y=0), end=Point2D(x=4, y=0))],
        thickness_m=0.2,
        floor_level=0,
        confidence=ConfidenceLevel.HIGH,
    )
    door = CGMOpening(
        opening_type=OpeningType.DOOR,
        position=Point2D(x=4.0, y=2.5),
        width_m=0.80,
        floor_level=0,
        confidence=ConfidenceLevel.HIGH,
    )
    window = CGMOpening(
        opening_type=OpeningType.WINDOW,
        position=Point2D(x=0.0, y=2.5),
        width_m=1.5,
        floor_level=0,
        confidence=ConfidenceLevel.HIGH,
    )
    stair = CGMStair(
        width_m=1.2,
        boundary=Polygon2D(vertices=[Point2D(x=4, y=7), Point2D(x=5.2, y=7), Point2D(x=5.2, y=9), Point2D(x=4, y=9)]),
        floor_level=0,
        confidence=ConfidenceLevel.HIGH,
    )
    exit_door = CGMExit(
        exit_type=ExitType.MAIN_ENTRANCE,
        position=Point2D(x=4.6, y=10.0),
        width_m=1.5,
        floor_level=0,
        confidence=ConfidenceLevel.HIGH,
    )

    floor = CGMFloor(
        level=0,
        rooms=[room1, corridor],
        walls=[wall],
        openings=[door, window],
        stairs=[stair],
        exits=[exit_door],
    )
    return CanonicalFloorPlan(
        floors=[floor],
        bounding_box=CGMBoundingBox(xmin=0, ymin=0, xmax=6, ymax=10),
        metadata=CGMMetadata(source_format="dxf", source_filename="test_floor.dxf", extraction_method="test"),
    )


def test_measurements_extraction():
    cgm = create_sample_cgm()
    graph_builder = FloorPlanGraphBuilder()
    graph = graph_builder.build(cgm)
    measurements = GeometricMeasurementExtractor.extract_all(cgm, graph)

    assert len(measurements) > 0
    categories = {m.category for m in measurements}
    assert MeasurementCategory.WALL_LENGTH in categories
    assert MeasurementCategory.DOOR_WIDTH in categories
    assert MeasurementCategory.CORRIDOR_WIDTH in categories
    assert MeasurementCategory.ROOM_DIMENSION in categories
    assert MeasurementCategory.STAIR_WIDTH in categories
    assert MeasurementCategory.WINDOW_OPENING in categories
    assert MeasurementCategory.TRAVEL_DISTANCE in categories
    assert MeasurementCategory.EXIT_COUNT in categories

    # Verify door width measurement
    door_m = next(m for m in measurements if m.category == MeasurementCategory.DOOR_WIDTH)
    assert door_m.value == 0.80
    assert door_m.unit == "m"

    # Verify corridor width measurement
    corr_m = next(m for m in measurements if m.category == MeasurementCategory.CORRIDOR_WIDTH)
    assert 1.15 <= corr_m.value <= 1.25


def test_shortest_path_travel_distance_with_polyline():
    cgm = create_sample_cgm()
    graph = FloorPlanGraphBuilder().build(cgm)
    rule = MaxTravelDistanceRule()
    results = rule.evaluate(cgm=cgm, graph=graph, context={"occupancy_type": "Business/Office"})
    assert len(results) >= 1
    res = results[0]

    assert res.status in (ResultStatus.PASS, ResultStatus.FAIL)
    assert res.measured_value is not None
    assert res.measured_value > 0
    assert res.required_value == 30.0  # Business/Office limit

    # Inspect violations or egress path
    if res.violations:
        viol = res.violations[0]
        assert viol.geometry_hint in ("polyline", "polygon", "point")


def test_dead_end_corridor_evaluation():
    cgm = create_sample_cgm()
    graph = FloorPlanGraphBuilder().build(cgm)
    rule = MaxDeadEndCorridorRule()
    results = rule.evaluate(cgm=cgm, graph=graph, context={"occupancy_type": "Business/Office"})
    assert len(results) >= 1
    res = results[0]

    assert res.status in (ResultStatus.PASS, ResultStatus.INSUFFICIENT_DATA, ResultStatus.FAIL)
    assert "NBC 2016" in res.regulation_source


def test_insufficient_data_on_ambiguous_geometry():
    """Verify uncertainty is NEVER turned into statutory FAIL."""
    room_empty = CGMRoom(
        room_type=RoomType.UNKNOWN,
        label="Unknown Space",
        boundary=Polygon2D(vertices=[Point2D(x=0, y=0), Point2D(x=1, y=0), Point2D(x=0, y=1)]),
        area_m2=None,
        confidence=ConfidenceLevel.LOW,
    )
    floor = CGMFloor(level=0, rooms=[room_empty], walls=[], openings=[])
    cgm = CanonicalFloorPlan(
        floors=[floor],
        bounding_box=CGMBoundingBox(xmin=0, ymin=0, xmax=5, ymax=5),
        metadata=CGMMetadata(source_format="dxf", source_filename="ambiguous.dxf", extraction_method="test"),
    )
    graph = FloorPlanGraphBuilder().build(cgm)
    rule = MinRoomAreaRule()
    results = rule.evaluate(cgm=cgm, graph=graph, context={"occupancy_type": "Residential"})
    assert len(results) >= 1
    res = results[0]

    assert res.status == ResultStatus.INSUFFICIENT_DATA
    assert res.status != ResultStatus.FAIL


def test_deterministic_recommendation_engine():
    # Corridor shortfall
    rec_corr = RecommendationEngine.generate_recommendation(
        rule_id="NBC-4-CW-001",
        measured=1.18,
        required=1.50,
        unit="m",
        entity_name="Main Corridor",
    )
    assert "0.32 m" in rec_corr
    assert "Increase clear corridor width" in rec_corr
    assert "feasibility" in rec_corr.lower()

    # Door shortfall
    rec_door = RecommendationEngine.generate_recommendation(
        rule_id="NBC-4-DW-001",
        measured=0.75,
        required=0.90,
        unit="m",
        entity_name="Entry Door",
    )
    assert "0.15 m" in rec_door
    assert "Widen door clear opening" in rec_door

    # Compliant case
    rec_pass = RecommendationEngine.generate_recommendation(
        rule_id="NBC-4-DW-001",
        measured=1.20,
        required=0.90,
        unit="m",
    )
    assert "compliant" in rec_pass.lower()


def test_pydantic_api_schemas_and_contracts():
    meas_item = MeasurementItem(
        id="m-1",
        category="door_width",
        name="Conference Door",
        value=0.85,
        unit="m",
        confidence="high",
        method="geometric_opening_span",
        entity_ids=["door_101"],
    )
    assert meas_item.value == 0.85

    resp = AnalysisMeasurementsResponse(
        run_id=str(uuid.uuid4()),
        total=1,
        measurements=[meas_item],
    )
    assert resp.total == 1

    egress_path = EgressPathItem(
        origin_room="Office 101",
        destination_exit="Exit Door A",
        distance_m=14.5,
        threshold_m=30.0,
        status="PASS",
        confidence="high",
        polyline=[[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]],
    )
    assert egress_path.distance_m == 14.5
    assert len(egress_path.polyline) == 3

    history_item = AnalysisHistoryItem(
        id=uuid.uuid4(),
        run_number=1,
        project_id=uuid.uuid4(),
        document_id=uuid.uuid4(),
        document_filename="office_layout.dxf",
        occupancy_type="Business/Office",
        status="complete",
        created_at="2026-09-15T12:00:00Z",
        passed_count=4,
        failed_count=1,
        insufficient_count=0,
        total_checks=5,
    )
    assert history_item.run_number == 1
    assert history_item.failed_count == 1
