"""
Geometric Room Extractor — Robust extraction of closed architectural rooms from line networks.

Used across DXF, Vector PDF, and Computer Vision ingestion adapters.
Uses Shapely polygonization, topological clean-up, and text label containment.
"""

from __future__ import annotations

import math
import uuid
from typing import Optional

from shapely.geometry import LineString, MultiLineString, Point, Polygon
from shapely.ops import polygonize, unary_union

from engines.geometry.models import (
    CGMOpening,
    CGMRoom,
    ConfidenceLevel,
    LineSegment,
    Point2D,
    Polygon2D,
    RoomType,
)

# Semantic mapping for architectural room labels
LABEL_TO_ROOM_TYPE: dict[str, RoomType] = {
    "bedroom": RoomType.BEDROOM,
    "bed": RoomType.BEDROOM,
    "mbr": RoomType.BEDROOM,
    "master bedroom": RoomType.BEDROOM,
    "kitchen": RoomType.KITCHEN,
    "kit": RoomType.KITCHEN,
    "pantry": RoomType.KITCHEN,
    "toilet": RoomType.TOILET,
    "wc": RoomType.TOILET,
    "bath": RoomType.BATHROOM,
    "bathroom": RoomType.BATHROOM,
    "powder": RoomType.TOILET,
    "living": RoomType.LIVING_ROOM,
    "hall": RoomType.HALL,
    "dining": RoomType.LIVING_ROOM,
    "drawing": RoomType.LIVING_ROOM,
    "corridor": RoomType.CORRIDOR,
    "passage": RoomType.CORRIDOR,
    "hallway": RoomType.CORRIDOR,
    "lobby": RoomType.LOBBY,
    "stair": RoomType.STAIRWELL,
    "stairs": RoomType.STAIRWELL,
    "staircase": RoomType.STAIRWELL,
    "office": RoomType.OFFICE,
    "balcony": RoomType.BALCONY,
    "utility": RoomType.UTILITY,
    "store": RoomType.STORAGE,
    "storage": RoomType.STORAGE,
    "parking": RoomType.PARKING,
    "garage": RoomType.PARKING,
}


def classify_room_label(text: str) -> tuple[RoomType, str]:
    """
    Classify extracted text into a standard RoomType without hallucination.
    Returns (RoomType, sanitized_label).
    """
    cleaned = text.strip()
    lower = cleaned.lower()
    for keyword, room_type in LABEL_TO_ROOM_TYPE.items():
        if keyword in lower:
            return room_type, cleaned
    return RoomType.UNKNOWN, cleaned


class RoomExtractor:
    """
    Extracts closed architectural room polygons from line segments and matches text labels.
    """

    @classmethod
    def extract_rooms_from_segments(
        cls,
        segments: list[LineSegment],
        text_labels: Optional[list[tuple[Point2D, str]]] = None,
        floor_level: int = 0,
        min_room_area: float = 1.0,     # m² (filter tiny slivers/artifacts)
        max_room_area: float = 2000.0,  # m² (filter outer envelope/bounding box)
        confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM,
    ) -> list[CGMRoom]:
        """
        Takes line segments, unions them into a planar graph, polygonizes closed cycles,
        and matches contained text labels to identify rooms.
        """
        if not segments or len(segments) < 3:
            return []

        shapely_lines = [
            LineString([(s.start.x, s.start.y), (s.end.x, s.end.y)])
            for s in segments
            if s.length > 0.05  # ignore micro-segments < 5cm
        ]

        if not shapely_lines:
            return []

        # Cluster and snap nearby line endpoints to bridge small gaps (e.g. 20cm)
        pts: list[tuple[float, float]] = []
        for l in shapely_lines:
            pts.append(l.coords[0])
            pts.append(l.coords[-1])

        clusters: list[list[tuple[float, float]]] = []
        cluster_tol = 0.25  # 25cm snapping tolerance
        for p in pts:
            matched = False
            for c in clusters:
                dx = p[0] - c[0][0]
                dy = p[1] - c[0][1]
                if math.sqrt(dx * dx + dy * dy) <= cluster_tol:
                    c.append(p)
                    matched = True
                    break
            if not matched:
                clusters.append([p])

        rep_map: dict[tuple[float, float], tuple[float, float]] = {}
        for c in clusters:
            avg_x = sum(pt[0] for pt in c) / len(c)
            avg_y = sum(pt[1] for pt in c) / len(c)
            for pt in c:
                rep_map[pt] = (avg_x, avg_y)

        snapped_lines: list[LineString] = []
        for l in shapely_lines:
            p0 = rep_map[l.coords[0]]
            p1 = rep_map[l.coords[-1]]
            if p0 != p1:
                snapped_lines.append(LineString([p0, p1]))

        try:
            # Union lines to ensure intersections form planar graph nodes
            merged_network = unary_union(snapped_lines)
            raw_polygons = list(polygonize(merged_network))
        except Exception:
            raw_polygons = []

        rooms: list[CGMRoom] = []
        text_labels = text_labels or []
        used_labels: set[int] = set()

        # Sort polygons by area ascending (small rooms before larger enclosing spaces)
        raw_polygons.sort(key=lambda p: p.area)

        room_counter = 1
        for poly in raw_polygons:
            # Validate and clean polygon
            if not poly.is_valid:
                poly = poly.buffer(0)
            if not isinstance(poly, Polygon) or poly.is_empty:
                continue

            area = poly.area
            # Filter out non-room artifacts and huge exterior boundaries
            if area < min_room_area or area > max_room_area:
                continue

            # Convert to CGM Polygon2D vertices
            exterior_coords = list(poly.exterior.coords)
            # Remove duplicated last vertex for Polygon2D (implicit closure)
            if len(exterior_coords) > 1 and exterior_coords[0] == exterior_coords[-1]:
                exterior_coords = exterior_coords[:-1]

            if len(exterior_coords) < 3:
                continue

            cgm_vertices = [Point2D(x=float(x), y=float(y)) for x, y in exterior_coords]
            cgm_polygon = Polygon2D(vertices=cgm_vertices)

            # Spatial containment: Find text labels located inside this room polygon
            matched_label: Optional[str] = None
            detected_type = RoomType.UNKNOWN

            for idx, (point, text) in enumerate(text_labels):
                if idx in used_labels:
                    continue
                sh_pt = Point(point.x, point.y)
                if poly.contains(sh_pt) or poly.touches(sh_pt):
                    rtype, slabel = classify_room_label(text)
                    detected_type = rtype
                    matched_label = slabel
                    used_labels.add(idx)
                    break

            # If no text label is present, assign deterministic generic identifier
            if not matched_label:
                matched_label = f"Room-{room_counter:02d}"

            # Calculate bounding box dimensions (width & length in meters)
            minx, miny, maxx, maxy = poly.bounds
            width_m = maxx - minx
            length_m = maxy - miny
            if width_m > length_m:
                width_m, length_m = length_m, width_m

            room = CGMRoom(
                id=uuid.uuid4(),
                room_type=detected_type,
                label=matched_label,
                boundary=cgm_polygon,
                area_m2=round(float(area), 2),
                perimeter_m=round(float(poly.length), 2),
                width_m=round(float(width_m), 2),
                length_m=round(float(length_m), 2),
                floor_level=floor_level,
                confidence=confidence,
                properties={
                    "centroid": [round(float(poly.centroid.x), 2), round(float(poly.centroid.y), 2)],
                    "bbox": [round(float(minx), 2), round(float(miny), 2), round(float(maxx), 2), round(float(maxy), 2)],
                },
            )
            rooms.append(room)
            room_counter += 1

        return rooms
