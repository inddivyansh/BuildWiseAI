"""
Canonical Geometry Model (CGM) — Pydantic Schema

The CGM is the central data contract for BuildWise AI.
ALL ingestion adapters (DXF, PDF, Image, IFC) produce a CanonicalFloorPlan.
ALL downstream systems (graph, compliance, reporting) consume CanonicalFloorPlan.

Design principles:
- All coordinates in METERS (regardless of input unit)
- All entities have stable UUIDs (used for violation↔geometry linking)
- ConfidenceLevel drives compliance result status:
    HIGH/MEDIUM → can produce PASS or FAIL
    LOW         → produces INSUFFICIENT_DATA (never FAIL)
    INFERRED    → produces UNVERIFIED
- Multi-floor from day one via CGMFloor[]
- Shapely-compatible coordinates: [(x, y), ...]

This schema is the source of truth. TypeScript frontend types in
frontend/src/types/geometry.ts are generated/mirrored from this.
"""

from __future__ import annotations

import uuid
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


# ─── Enumerations ─────────────────────────────────────────

class ConfidenceLevel(str, Enum):
    """
    Confidence in the accuracy of a detected/extracted entity.
    
    Drives compliance result status:
    - HIGH:       Directly measured (DXF entities with explicit dimensions)
    - MEDIUM:     Computed with high reliability (closed polygon from walls)
    - LOW:        Heuristic or partially detected (sketch/image inference)
    - INFERRED:   Logical inference with no geometric evidence
    """
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFERRED = "inferred"


class RoomType(str, Enum):
    """Semantic classification of room/space type."""
    BEDROOM = "bedroom"
    LIVING_ROOM = "living_room"
    KITCHEN = "kitchen"
    BATHROOM = "bathroom"
    TOILET = "toilet"
    CORRIDOR = "corridor"
    STAIRWELL = "stairwell"
    LOBBY = "lobby"
    OFFICE = "office"
    HALL = "hall"
    BALCONY = "balcony"
    UTILITY = "utility"
    STORAGE = "storage"
    PARKING = "parking"
    COMMERCIAL = "commercial"
    EXIT_DISCHARGE = "exit_discharge"
    UNKNOWN = "unknown"


class WallType(str, Enum):
    """Structural classification of wall."""
    EXTERIOR = "exterior"
    INTERIOR = "interior"
    STRUCTURAL = "structural"
    PARTITION = "partition"
    UNKNOWN = "unknown"


class OpeningType(str, Enum):
    """Type of opening in a wall."""
    DOOR = "door"
    WINDOW = "window"
    SLIDING_DOOR = "sliding_door"
    DOUBLE_DOOR = "double_door"
    EMERGENCY_EXIT = "emergency_exit"
    OPENING = "opening"   # Generic passageway with no door


class StairDirection(str, Enum):
    """Direction of stair travel."""
    UP = "up"
    DOWN = "down"
    BOTH = "both"
    UNKNOWN = "unknown"


class ExitType(str, Enum):
    """Classification of exit/egress point."""
    MAIN_ENTRANCE = "main_entrance"
    EMERGENCY_EXIT = "emergency_exit"
    STAIR_EXIT = "stair_exit"
    FIRE_DOOR = "fire_door"
    UNKNOWN = "unknown"


# ─── Primitive Types ──────────────────────────────────────

class Point2D(BaseModel):
    """2D coordinate in meters."""
    x: float
    y: float

    def as_tuple(self) -> tuple[float, float]:
        return (self.x, self.y)


class LineSegment(BaseModel):
    """A line segment defined by two endpoints."""
    start: Point2D
    end: Point2D

    @property
    def length(self) -> float:
        """Length of the segment in meters."""
        import math
        return math.sqrt((self.end.x - self.start.x) ** 2 + (self.end.y - self.start.y) ** 2)


class Polygon2D(BaseModel):
    """
    A closed polygon defined by an ordered list of vertices.
    Vertices should be in counter-clockwise order (standard geometric convention).
    Last point does NOT repeat first point — it is implicitly closed.
    """
    vertices: list[Point2D] = Field(..., min_length=3)

    def as_shapely(self):
        """Convert to Shapely Polygon for geometric operations."""
        from shapely.geometry import Polygon
        return Polygon([(v.x, v.y) for v in self.vertices])

    @property
    def area(self) -> float:
        """Shoelace formula for polygon area in m²."""
        n = len(self.vertices)
        area = 0.0
        for i in range(n):
            j = (i + 1) % n
            area += self.vertices[i].x * self.vertices[j].y
            area -= self.vertices[j].x * self.vertices[i].y
        return abs(area) / 2.0

    @property
    def centroid(self) -> Point2D:
        """Centroid of the polygon."""
        xs = [v.x for v in self.vertices]
        ys = [v.y for v in self.vertices]
        return Point2D(x=sum(xs) / len(xs), y=sum(ys) / len(ys))

    def to_list(self) -> list[list[float]]:
        """Return coordinates as list of [x, y] pairs."""
        return [[v.x, v.y] for v in self.vertices]


# ─── CGM Entities ─────────────────────────────────────────

class CGMWall(BaseModel):
    """A wall segment or polyline."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    wall_type: WallType = WallType.UNKNOWN
    segments: list[LineSegment]  # Can be a multi-segment wall
    thickness_m: Optional[float] = None  # Wall thickness in meters
    height_m: Optional[float] = None     # Wall height in meters
    floor_level: int = 0
    confidence: ConfidenceLevel = ConfidenceLevel.HIGH
    source_layer: Optional[str] = None  # DXF layer name for traceability
    properties: dict[str, Any] = Field(default_factory=dict)


class CGMOpening(BaseModel):
    """A door, window, or passage in a wall."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    opening_type: OpeningType = OpeningType.DOOR
    position: Point2D          # Center point of the opening
    width_m: Optional[float] = None  # Opening width in meters
    height_m: Optional[float] = None
    swing_angle_deg: Optional[float] = None  # Door swing angle
    swing_direction: Optional[str] = None    # "left" | "right" | "both"
    wall_id: Optional[uuid.UUID] = None      # Wall this opening is in
    room_ids: list[uuid.UUID] = Field(default_factory=list)  # Connected rooms
    floor_level: int = 0
    confidence: ConfidenceLevel = ConfidenceLevel.HIGH
    source_layer: Optional[str] = None
    properties: dict[str, Any] = Field(default_factory=dict)


class CGMRoom(BaseModel):
    """
    A room or enclosed space.
    
    The boundary polygon is the defining geometric element.
    All measurements (area, perimeter) are derived from the polygon.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    room_type: RoomType = RoomType.UNKNOWN
    label: Optional[str] = None          # Text label from drawing
    boundary: Polygon2D                   # Room boundary polygon
    area_m2: Optional[float] = None      # Computed from boundary
    perimeter_m: Optional[float] = None
    width_m: Optional[float] = None      # Minimum bounding box width
    length_m: Optional[float] = None     # Minimum bounding box length
    height_m: Optional[float] = None     # Room height (if provided)
    floor_level: int = 0
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    source_layer: Optional[str] = None
    wall_ids: list[uuid.UUID] = Field(default_factory=list)
    opening_ids: list[uuid.UUID] = Field(default_factory=list)
    properties: dict[str, Any] = Field(default_factory=dict)

    def compute_area(self) -> float:
        """Compute and cache area from boundary polygon."""
        area = self.boundary.area
        self.area_m2 = area
        return area

    def to_shapely(self):
        """Convert boundary to Shapely Polygon."""
        return self.boundary.as_shapely()


class CGMStair(BaseModel):
    """A staircase, including all geometric and dimensional information."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    boundary: Polygon2D               # Stair footprint polygon
    width_m: Optional[float] = None  # Stair clear width in meters
    riser_height_m: Optional[float] = None
    tread_depth_m: Optional[float] = None
    num_risers: Optional[int] = None
    direction: StairDirection = StairDirection.UNKNOWN
    connects_floors: list[int] = Field(default_factory=list)  # e.g., [0, 1]
    floor_level: int = 0
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    source_layer: Optional[str] = None
    properties: dict[str, Any] = Field(default_factory=dict)


class CGMExit(BaseModel):
    """A building exit point for egress analysis."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    exit_type: ExitType = ExitType.UNKNOWN
    position: Point2D
    opening_id: Optional[uuid.UUID] = None  # If exit is through a door
    room_id: Optional[uuid.UUID] = None     # Room the exit leads from
    width_m: Optional[float] = None
    floor_level: int = 0
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    properties: dict[str, Any] = Field(default_factory=dict)


# ─── Floor and Building Level ─────────────────────────────

class CGMFloor(BaseModel):
    """A single floor/level of the building."""
    level: int = 0             # 0 = ground floor, 1 = first floor, -1 = basement
    label: Optional[str] = None  # e.g., "Ground Floor", "First Floor"
    elevation_m: Optional[float] = None  # Elevation above ground
    floor_height_m: Optional[float] = None

    walls: list[CGMWall] = Field(default_factory=list)
    openings: list[CGMOpening] = Field(default_factory=list)
    rooms: list[CGMRoom] = Field(default_factory=list)
    stairs: list[CGMStair] = Field(default_factory=list)
    exits: list[CGMExit] = Field(default_factory=list)

    @property
    def total_area_m2(self) -> float:
        """Sum of all room areas on this floor."""
        return sum(r.area_m2 or r.boundary.area for r in self.rooms)

    @property
    def room_count(self) -> int:
        return len(self.rooms)

    @property
    def exit_count(self) -> int:
        return len(self.exits)


class CGMBoundingBox(BaseModel):
    """Axis-aligned bounding box of the entire floor plan."""
    xmin: float
    ymin: float
    xmax: float
    ymax: float

    @property
    def width(self) -> float:
        return self.xmax - self.xmin

    @property
    def height(self) -> float:
        return self.ymax - self.ymin

    @property
    def center(self) -> Point2D:
        return Point2D(x=(self.xmin + self.xmax) / 2, y=(self.ymin + self.ymax) / 2)


class CGMMetadata(BaseModel):
    """Source document and extraction metadata."""
    source_format: str                # 'dxf' | 'pdf' | 'image'
    source_filename: str
    extraction_method: str            # 'ezdxf' | 'pdfplumber' | 'opencv_pipeline'
    coordinate_unit: str = "meters"  # Always meters in CGM
    original_unit: Optional[str] = None  # Original unit before normalization
    scale_factor: Optional[float] = None  # Multiplier applied to original coords
    is_multi_floor: bool = False
    extraction_warnings: list[str] = Field(default_factory=list)
    extraction_errors: list[str] = Field(default_factory=list)
    properties: dict[str, Any] = Field(default_factory=dict)


# ─── Top-Level Model ──────────────────────────────────────

class CanonicalFloorPlan(BaseModel):
    """
    The Canonical Geometry Model (CGM).
    
    This is the central data contract of BuildWise AI.
    Every ingestion adapter produces exactly one CanonicalFloorPlan.
    Every downstream engine (graph, compliance, reporting) consumes it.
    
    The CGM is stored as JSONB in floor_plan_snapshots.floor_data.
    It is never modified after ingestion — it's an immutable snapshot.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    floors: list[CGMFloor] = Field(..., min_length=1)
    bounding_box: CGMBoundingBox
    metadata: CGMMetadata

    @property
    def floor_count(self) -> int:
        return len(self.floors)

    @property
    def total_area_m2(self) -> float:
        return sum(f.total_area_m2 for f in self.floors)

    @property
    def all_rooms(self) -> list[CGMRoom]:
        """Flat list of all rooms across all floors."""
        return [room for floor in self.floors for room in floor.rooms]

    @property
    def all_exits(self) -> list[CGMExit]:
        """Flat list of all exits across all floors."""
        return [exit_ for floor in self.floors for exit_ in floor.exits]

    @property
    def all_stairs(self) -> list[CGMStair]:
        return [stair for floor in self.floors for stair in floor.stairs]

    def get_floor(self, level: int) -> Optional[CGMFloor]:
        """Get a floor by level number."""
        for floor in self.floors:
            if floor.level == level:
                return floor
        return None

    def get_room_by_id(self, room_id: uuid.UUID) -> Optional[CGMRoom]:
        """Find a room by its UUID across all floors."""
        for floor in self.floors:
            for room in floor.rooms:
                if room.id == room_id:
                    return room
        return None

    def to_storage_dict(self) -> dict:
        """Serialize to dict for JSONB storage."""
        return self.model_dump(mode="json")

    @classmethod
    def from_storage_dict(cls, data: dict) -> "CanonicalFloorPlan":
        """Deserialize from JSONB storage dict."""
        return cls.model_validate(data)
