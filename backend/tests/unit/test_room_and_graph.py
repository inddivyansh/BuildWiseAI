"""
Unit tests for RoomExtractor and Topological Floor Plan Graph.
"""

from engines.geometry.models import (
    CanonicalFloorPlan,
    CGMBoundingBox,
    CGMExit,
    CGMFloor,
    CGMMetadata,
    CGMOpening,
    CGMRoom,
    ConfidenceLevel,
    ExitType,
    LineSegment,
    OpeningType,
    Point2D,
    Polygon2D,
    RoomType,
)
from engines.geometry.room_extractor import RoomExtractor
from engines.graph.builder import FloorPlanGraphBuilder, compute_shortest_path


def test_room_extractor_polygonization_and_labels():
    # 2 adjacent rooms: (0,0)-(4,4) Bedroom and (4,0)-(8,4) Kitchen
    s1 = LineSegment(start=Point2D(x=0, y=0), end=Point2D(x=4, y=0))
    s2 = LineSegment(start=Point2D(x=4, y=0), end=Point2D(x=4, y=4))
    s3 = LineSegment(start=Point2D(x=4, y=4), end=Point2D(x=0, y=4))
    s4 = LineSegment(start=Point2D(x=0, y=4), end=Point2D(x=0, y=0))

    s5 = LineSegment(start=Point2D(x=4, y=0), end=Point2D(x=8, y=0))
    s6 = LineSegment(start=Point2D(x=8, y=0), end=Point2D(x=8, y=4))
    s7 = LineSegment(start=Point2D(x=8, y=4), end=Point2D(x=4, y=4))

    all_segments = [s1, s2, s3, s4, s5, s6, s7]
    labels = [
        (Point2D(x=2.0, y=2.0), "MASTER BEDROOM"),
        (Point2D(x=6.0, y=2.0), "KITCHEN"),
    ]

    rooms = RoomExtractor.extract_rooms_from_segments(all_segments, text_labels=labels)
    assert len(rooms) == 2

    # Check semantic classification
    types = {r.room_type for r in rooms}
    assert RoomType.BEDROOM in types
    assert RoomType.KITCHEN in types

    for r in rooms:
        assert r.area_m2 == 16.0
        assert r.width_m == 4.0
        assert r.length_m == 4.0


def test_graph_builder_connectivity_and_shortest_path():
    r1 = CGMRoom(
        room_type=RoomType.BEDROOM,
        label="Bedroom",
        boundary=Polygon2D(vertices=[Point2D(x=0, y=0), Point2D(x=4, y=0), Point2D(x=4, y=4), Point2D(x=0, y=4)]),
    )
    r2 = CGMRoom(
        room_type=RoomType.CORRIDOR,
        label="Corridor",
        boundary=Polygon2D(vertices=[Point2D(x=4, y=0), Point2D(x=6, y=0), Point2D(x=6, y=4), Point2D(x=4, y=4)]),
    )
    door = CGMOpening(
        opening_type=OpeningType.DOOR,
        position=Point2D(x=4.0, y=2.0),
        width_m=0.90,
    )
    exit1 = CGMExit(
        exit_type=ExitType.MAIN_ENTRANCE,
        position=Point2D(x=6.0, y=2.0),
        width_m=1.20,
    )

    floor = CGMFloor(level=0, rooms=[r1, r2], openings=[door], exits=[exit1])
    cgm = CanonicalFloorPlan(
        floors=[floor],
        bounding_box=CGMBoundingBox(xmin=0, ymin=0, xmax=6, ymax=4),
        metadata=CGMMetadata(source_format="dxf", source_filename="test.dxf", extraction_method="test"),
    )

    builder = FloorPlanGraphBuilder()
    graph = builder.build(cgm)
    g_dict = graph.to_dict()

    assert g_dict["stats"]["connected_components"] == 1
    assert g_dict["stats"]["is_fully_connected"] is True
    assert len(g_dict["stats"]["rooms_without_exit_access"]) == 0

    # Shortest path between Bedroom and Exit
    path = compute_shortest_path(g_dict, str(r1.id), str(exit1.id))
    assert path is not None
    assert path[0] == str(r1.id)
    assert path[-1] == str(exit1.id)
