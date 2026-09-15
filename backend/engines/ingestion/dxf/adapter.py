"""
DXF Adapter — converts ParsedDXF into CanonicalFloorPlan.

This is the semantic interpretation layer:
  Raw DXF entities → CGM walls, rooms, openings, exits

Strategy:
1. Classify polylines/lines by layer name heuristics
2. Identify closed polylines as potential room boundaries
3. Classify open polylines as walls
4. Detect doors/openings from INSERT block names and layer names
5. Build bounding box
6. Normalize coordinates to meters

Layer name heuristics (common AutoCAD architectural standards):
  Wall layers:    names containing WALL, A-WALL, W-, PARTI
  Door layers:    names containing DOOR, A-DOOR, D-
  Window layers:  names containing WIND, A-GLAZ, WIN
  Room layers:    names containing ROOM, AREA, SPACE, A-AREA
  Stair layers:   names containing STAIR, A-STAIR, STEP
  Exit layers:    names containing EXIT, EGRES
  Text layers:    names containing TEXT, ANNO, LABL

These are soft heuristics — geometry on unrecognized layers is still
extracted as raw walls (unknown type) with LOW confidence.
"""

from __future__ import annotations

import math
import uuid
from pathlib import Path
from typing import Optional

from app.logging_config import get_logger
from engines.geometry.models import (
    CanonicalFloorPlan,
    CGMBoundingBox,
    CGMExit,
    CGMFloor,
    CGMMetadata,
    CGMOpening,
    CGMRoom,
    CGMStair,
    CGMWall,
    ConfidenceLevel,
    ExitType,
    LineSegment,
    OpeningType,
    Point2D,
    Polygon2D,
    RoomType,
    StairDirection,
    WallType,
)
from engines.ingestion.base import IngestionAdapter, IngestionError
from engines.ingestion.dxf.parser import (
    INSUNITS_TO_METERS,
    DXFParser,
    ParsedDXF,
    RawInsert,
    RawLine,
    RawPolyline,
    RawText,
)

logger = get_logger(__name__)

# ─── Layer classification keywords (case-insensitive) ─────
WALL_KEYWORDS = {"wall", "a-wall", "parti", "mur", "wand"}
DOOR_KEYWORDS = {"door", "a-door", "porte", "tür", "a-glaz"}
WINDOW_KEYWORDS = {"wind", "window", "glaz", "fenêt", "fenster"}
ROOM_KEYWORDS = {"room", "area", "space", "a-area", "spc", "zimmer", "raum"}
STAIR_KEYWORDS = {"stair", "step", "escal", "treppe", "a-stair"}
EXIT_KEYWORDS = {"exit", "egres", "ausgang", "issue"}
TEXT_KEYWORDS = {"text", "anno", "labl", "symb"}
COLUMN_KEYWORDS = {"column", "col", "pillar", "struct", "a-cols"}


def _layer_matches(layer: str, keywords: set[str]) -> bool:
    """True if any keyword appears in the layer name."""
    low = layer.lower()
    return any(k in low for k in keywords)


def _poly_is_closed_and_valid(poly: RawPolyline, min_points: int = 3) -> bool:
    """True if the polyline is a valid closed polygon."""
    return poly.is_closed and len(poly.points) >= min_points


def _poly_length(pts: list[tuple[float, float]]) -> float:
    """Total length of a polyline."""
    total = 0.0
    for i in range(len(pts) - 1):
        dx = pts[i + 1][0] - pts[i][0]
        dy = pts[i + 1][1] - pts[i][1]
        total += math.sqrt(dx * dx + dy * dy)
    return total


def _compute_polygon_area(pts: list[tuple[float, float]]) -> float:
    """Shoelace formula."""
    n = len(pts)
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += pts[i][0] * pts[j][1]
        area -= pts[j][0] * pts[i][1]
    return abs(area) / 2.0


def _centroid(pts: list[tuple[float, float]]) -> tuple[float, float]:
    """Simple centroid of a list of points."""
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def _find_text_near(
    texts: list[RawText],
    cx: float, cy: float,
    radius: float,
    scale: float,
) -> Optional[str]:
    """Find the closest text label within radius (in drawing units)."""
    best_dist = radius * scale
    best = None
    for t in texts:
        d = math.sqrt((t.x - cx) ** 2 + (t.y - cy) ** 2)
        if d < best_dist:
            best_dist = d
            best = t.text
    return best


def _classify_room_type(label: Optional[str]) -> RoomType:
    """Infer RoomType from a text label."""
    if not label:
        return RoomType.UNKNOWN
    low = label.lower()
    mapping = {
        ("bed", "bdr", "mbr", "master"): RoomType.BEDROOM,
        ("living", "lounge", "sitting", "drawing"): RoomType.LIVING_ROOM,
        ("kitchen", "kitch", "kit"): RoomType.KITCHEN,
        ("bath", "wc", "toilet", "lavat", "restroom", "shower"): RoomType.BATHROOM,
        ("corridor", "hallway", "passage", "lobby", "foyer", "hall"): RoomType.CORRIDOR,
        ("stair", "steps"): RoomType.STAIRWELL,
        ("balcony", "terrace"): RoomType.BALCONY,
        ("store", "storage", "utility", "mech"): RoomType.STORAGE,
        ("park", "garage"): RoomType.PARKING,
        ("office", "study"): RoomType.OFFICE,
    }
    for keywords, room_type in mapping.items():
        if any(k in low for k in keywords):
            return room_type
    return RoomType.UNKNOWN


# Minimum area thresholds (in m²) for room detection
MIN_ROOM_AREA_M2 = 0.5     # Smaller than this → not a room
MAX_ROOM_AREA_M2 = 50000   # Larger than this → likely a site boundary


class DXFAdapter(IngestionAdapter):
    """
    Converts a ParsedDXF into a CanonicalFloorPlan.
    
    Called by the pipeline runner. Does not import ezdxf directly —
    that is isolated to DXFParser.
    """

    def can_handle(self, filename: str, content: bytes) -> bool:
        return Path(filename).suffix.lower() == ".dxf"

    def parse(self, content: bytes, filename: str = "upload.dxf") -> CanonicalFloorPlan:
        """Full parse pipeline: DXFParser → semantic extraction → CGM."""
        parser = DXFParser()
        try:
            raw = parser.parse(content, filename)
        except ValueError as e:
            raise IngestionError(str(e), "INVALID_DXF") from e

        if raw.entity_count == 0:
            raise IngestionError("DXF file contains no drawable entities", "EMPTY_DXF")

        return self._build_cgm(raw, filename)

    def _build_cgm(self, raw: ParsedDXF, filename: str) -> CanonicalFloorPlan:
        """Convert ParsedDXF to CanonicalFloorPlan."""
        # Scale factor: original units → meters
        scale = INSUNITS_TO_METERS.get(raw.units_code, 1.0)
        original_unit = self._unit_name(raw.units_code)
        warnings = list(raw.warnings)

        walls: list[CGMWall] = []
        rooms: list[CGMRoom] = []
        openings: list[CGMOpening] = []
        stairs: list[CGMStair] = []
        exits: list[CGMExit] = []

        # ─── Process lines → walls ─────────────────────────
        for line in raw.lines:
            wall_type, confidence = self._classify_wall(line.layer)
            seg = LineSegment(
                start=Point2D(x=line.x1 * scale, y=line.y1 * scale),
                end=Point2D(x=line.x2 * scale, y=line.y2 * scale),
            )
            # Skip zero-length lines
            if seg.length < 1e-6:
                continue
            walls.append(CGMWall(
                wall_type=wall_type,
                segments=[seg],
                floor_level=0,
                confidence=confidence,
                source_layer=line.layer,
            ))

        # ─── Process polylines ─────────────────────────────
        for poly in raw.polylines:
            # Skip single points
            if len(poly.points) < 2:
                continue

            # Closed polylines with enough area → potential rooms
            if _poly_is_closed_and_valid(poly, min_points=3):
                scaled_pts = [(p[0] * scale, p[1] * scale) for p in poly.points]
                area = _compute_polygon_area(scaled_pts)

                if MIN_ROOM_AREA_M2 <= area <= MAX_ROOM_AREA_M2:
                    cx, cy = _centroid(scaled_pts)
                    label = _find_text_near(raw.texts, cx / scale, cy / scale, radius=5.0, scale=scale)
                    room_type = _classify_room_type(label)
                    confidence = self._poly_confidence(poly.layer, area)

                    if _layer_matches(poly.layer, STAIR_KEYWORDS):
                        stairs.append(CGMStair(
                            boundary=Polygon2D(vertices=[Point2D(x=p[0], y=p[1]) for p in scaled_pts]),
                            direction=StairDirection.UNKNOWN,
                            floor_level=0,
                            confidence=confidence,
                            source_layer=poly.layer,
                        ))
                    else:
                        rooms.append(CGMRoom(
                            room_type=room_type,
                            label=label,
                            boundary=Polygon2D(vertices=[Point2D(x=p[0], y=p[1]) for p in scaled_pts]),
                            area_m2=round(area, 3),
                            floor_level=0,
                            confidence=confidence,
                            source_layer=poly.layer,
                        ))
                else:
                    # Too small or too large — treat as wall outline
                    self._polyline_to_walls(poly, scale, walls)
            else:
                # Open polyline → wall segments
                self._polyline_to_walls(poly, scale, walls)

        # ─── Process INSERTs → openings/exits ─────────────
        for ins in raw.inserts:
            self._classify_insert(ins, scale, openings, exits)

        # ─── Compute bounding box ──────────────────────────
        bbox = self._compute_bbox(walls, rooms, scale)

        # ─── Build metadata ────────────────────────────────
        metadata = CGMMetadata(
            source_format="dxf",
            source_filename=filename,
            extraction_method="ezdxf",
            coordinate_unit="meters",
            original_unit=original_unit,
            scale_factor=scale,
            is_multi_floor=False,
            extraction_warnings=warnings,
        )

        floor = CGMFloor(
            level=0,
            label="Ground Floor",
            walls=walls,
            openings=openings,
            rooms=rooms,
            stairs=stairs,
            exits=exits,
        )

        if not walls and not rooms:
            metadata.extraction_warnings.append(
                "No walls or rooms detected. The DXF may use unsupported entity types "
                "or the drawing is not an architectural floor plan."
            )

        logger.info(
            "CGM built from DXF",
            walls=len(walls),
            rooms=len(rooms),
            openings=len(openings),
            stairs=len(stairs),
            exits=len(exits),
            bbox=f"[{bbox.xmin:.1f},{bbox.ymin:.1f} → {bbox.xmax:.1f},{bbox.ymax:.1f}]",
        )

        return CanonicalFloorPlan(
            floors=[floor],
            bounding_box=bbox,
            metadata=metadata,
        )

    def _classify_wall(self, layer: str) -> tuple[WallType, ConfidenceLevel]:
        """Classify a line's wall type and confidence from layer name."""
        if _layer_matches(layer, WALL_KEYWORDS):
            low = layer.lower()
            if "ext" in low or "outer" in low or "perimeter" in low:
                return WallType.EXTERIOR, ConfidenceLevel.HIGH
            return WallType.INTERIOR, ConfidenceLevel.HIGH
        if _layer_matches(layer, COLUMN_KEYWORDS):
            return WallType.STRUCTURAL, ConfidenceLevel.HIGH
        # Unknown layer — still extract but flag as low confidence
        return WallType.UNKNOWN, ConfidenceLevel.LOW

    def _poly_confidence(self, layer: str, area_m2: float) -> ConfidenceLevel:
        """Determine confidence for a room polygon."""
        if _layer_matches(layer, ROOM_KEYWORDS):
            return ConfidenceLevel.HIGH
        if _layer_matches(layer, WALL_KEYWORDS):
            return ConfidenceLevel.MEDIUM
        # Unknown layer — use MEDIUM for reasonable-sized polygons
        return ConfidenceLevel.MEDIUM

    def _polyline_to_walls(
        self, poly: RawPolyline, scale: float, walls: list[CGMWall]
    ) -> None:
        """Convert an open (or degenerate) polyline into wall segments."""
        wall_type, confidence = self._classify_wall(poly.layer)
        pts = poly.points
        segments = []
        for i in range(len(pts) - 1):
            seg = LineSegment(
                start=Point2D(x=pts[i][0] * scale, y=pts[i][1] * scale),
                end=Point2D(x=pts[i + 1][0] * scale, y=pts[i + 1][1] * scale),
            )
            if seg.length > 1e-6:
                segments.append(seg)
        if poly.is_closed and len(pts) >= 2:
            seg = LineSegment(
                start=Point2D(x=pts[-1][0] * scale, y=pts[-1][1] * scale),
                end=Point2D(x=pts[0][0] * scale, y=pts[0][1] * scale),
            )
            if seg.length > 1e-6:
                segments.append(seg)
        if segments:
            walls.append(CGMWall(
                wall_type=wall_type,
                segments=segments,
                floor_level=0,
                confidence=confidence,
                source_layer=poly.layer,
            ))

    def _classify_insert(
        self,
        ins: RawInsert,
        scale: float,
        openings: list[CGMOpening],
        exits: list[CGMExit],
    ) -> None:
        """Classify a DXF INSERT block reference as opening or exit."""
        block_low = ins.block_name.lower()
        layer_low = ins.layer.lower()
        combined = block_low + " " + layer_low

        pos = Point2D(x=ins.x * scale, y=ins.y * scale)

        if any(k in combined for k in ("exit", "egres", "fire_door")):
            exits.append(CGMExit(
                exit_type=ExitType.EMERGENCY_EXIT,
                position=pos,
                floor_level=0,
                confidence=ConfidenceLevel.MEDIUM,
            ))
        elif any(k in combined for k in ("door", "porte", "dr", "d_")):
            openings.append(CGMOpening(
                opening_type=OpeningType.DOOR,
                position=pos,
                floor_level=0,
                confidence=ConfidenceLevel.MEDIUM,
                source_layer=ins.layer,
            ))
        elif any(k in combined for k in ("wind", "window", "wn", "w_", "glaz")):
            openings.append(CGMOpening(
                opening_type=OpeningType.WINDOW,
                position=pos,
                floor_level=0,
                confidence=ConfidenceLevel.MEDIUM,
                source_layer=ins.layer,
            ))

    def _compute_bbox(
        self,
        walls: list[CGMWall],
        rooms: list[CGMRoom],
        scale: float,
    ) -> CGMBoundingBox:
        """Compute axis-aligned bounding box from all geometry."""
        xs: list[float] = []
        ys: list[float] = []

        for wall in walls:
            for seg in wall.segments:
                xs += [seg.start.x, seg.end.x]
                ys += [seg.start.y, seg.end.y]

        for room in rooms:
            for v in room.boundary.vertices:
                xs.append(v.x)
                ys.append(v.y)

        if not xs:
            return CGMBoundingBox(xmin=0, ymin=0, xmax=1, ymax=1)

        return CGMBoundingBox(
            xmin=min(xs), ymin=min(ys),
            xmax=max(xs), ymax=max(ys),
        )

    def _unit_name(self, code: int) -> str:
        names = {
            0: "unitless", 1: "inches", 2: "feet", 4: "millimeters",
            5: "centimeters", 6: "meters", 14: "decameters",
        }
        return names.get(code, f"insunits_{code}")
