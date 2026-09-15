"""
Vision Adapter (Mode A) — Converts Architectural Images/Sketches into CanonicalFloorPlan.

Uses classical computer vision (OpenCV + NumPy + Shapely) to detect wall lines,
merge collinear segments, snap orthogonally, and polygonize rooms.
Assigns explicit ConfidenceLevel (LOW/MEDIUM) to maintain compliance integrity.
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
from engines.geometry.room_extractor import RoomExtractor
from engines.ingestion.base import IngestionAdapter, IngestionError
from engines.ingestion.vision.line_detector import HoughLineDetector
from engines.ingestion.vision.preprocessor import ImagePreprocessor

logger = get_logger(__name__)


class VisionAdapter(IngestionAdapter):
    """Classical Computer Vision Ingestion Adapter for Blueprint Images & Sketches."""

    IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".webp"}

    def can_handle(self, filename: str, content: bytes) -> bool:
        ext = Path(filename).suffix.lower()
        if ext in self.IMAGE_EXTENSIONS:
            return True
        # Magic byte check
        return (
            content.startswith(b"\x89PNG\r\n\x1a\n")
            or content.startswith(b"\xff\xd8\xff")
            or content.startswith(b"BM")
            or (content.startswith(b"RIFF") and b"WEBP" in content[:16])
        )

    def parse(self, content: bytes, filename: str) -> CanonicalFloorPlan:
        # 1. Preprocess image
        gray, cleaned, edges, (img_h, img_w) = ImagePreprocessor.preprocess(content)

        # 2. Line detection via Hough transform
        raw_lines = HoughLineDetector.detect_lines(
            edges=edges,
            min_line_length=max(20, int(min(img_h, img_w) * 0.03)),
            max_line_gap=15,
            threshold=35,
        )

        if not raw_lines:
            raise IngestionError(
                "No architectural line structures detected in image. Ensure the drawing has clear high-contrast lines.",
                error_code="NO_LINES_DETECTED",
            )

        # 3. Orthogonal snapping
        snapped_lines = HoughLineDetector.orthogonal_snap(raw_lines, snap_angle_deg=12.0)

        # 4. Collinear merging
        merged_lines = HoughLineDetector.merge_collinear_lines(
            snapped_lines,
            dist_tol_px=10.0,
            gap_tol_px=30.0,
        )

        # 5. Scale Calibration:
        # Map pixel space to meters. Standard architectural floor plans span ~20 meters width.
        # Scale = target_meters / max_pixel_dimension
        max_dim = max(img_w, img_h)
        pixels_per_meter = max(max_dim / 25.0, 10.0)  # Default ~25m floor plan span
        scale = 1.0 / pixels_per_meter

        # 6. Convert to CGM LineSegments (origin at bottom-left)
        segments: list[LineSegment] = []
        all_x: list[float] = []
        all_y: list[float] = []

        for x0, y0, x1, y1 in merged_lines:
            # Invert y to standard Cartesian (0 at bottom)
            mx0, my0 = round(x0 * scale, 3), round((img_h - y0) * scale, 3)
            mx1, my1 = round(x1 * scale, 3), round((img_h - y1) * scale, 3)

            s = LineSegment(start=Point2D(x=mx0, y=my0), end=Point2D(x=mx1, y=my1))
            if s.length >= 0.2:  # Keep segments >= 20cm
                segments.append(s)
                all_x.extend([mx0, mx1])
                all_y.extend([my0, my1])

        # 7. Create Walls
        walls: list[CGMWall] = []
        if segments:
            wall = CGMWall(
                id=uuid.uuid4(),
                wall_type=WallType.PARTITION,
                segments=segments,
                thickness_m=0.20,
                height_m=2.8,
                floor_level=0,
                confidence=ConfidenceLevel.LOW,  # Mode A CV is inherently lower confidence than CAD
                source_layer="CV_DETECTED_WALLS",
            )
            walls.append(wall)

        # 8. Room extraction from merged segments
        rooms = RoomExtractor.extract_rooms_from_segments(
            segments=segments,
            text_labels=None,  # No OCR in basic Mode A
            floor_level=0,
            min_room_area=1.5,
            confidence=ConfidenceLevel.LOW,
        )

        # 9. Exits & Openings inference
        exits: list[CGMExit] = []
        openings: list[CGMOpening] = []

        if rooms:
            # Create a main exit on the perimeter of the primary room
            r0 = rooms[0]
            centroid = r0.boundary.centroid
            exits.append(
                CGMExit(
                    id=uuid.uuid4(),
                    exit_type=ExitType.MAIN_ENTRANCE,
                    position=Point2D(x=centroid.x + 2.0, y=centroid.y),
                    width_m=1.0,
                    floor_level=0,
                    confidence=ConfidenceLevel.LOW,
                )
            )

        # Global bounding box
        if all_x and all_y:
            bbox = CGMBoundingBox(
                xmin=round(min(all_x), 2),
                ymin=round(min(all_y), 2),
                xmax=round(max(all_x), 2),
                ymax=round(max(all_y), 2),
            )
        else:
            bbox = CGMBoundingBox(xmin=0.0, ymin=0.0, xmax=25.0, ymax=20.0)

        metadata = CGMMetadata(
            source_format="image",
            source_filename=filename,
            extraction_method="classical_cv_pipeline",
            coordinate_unit="meters",
            original_unit="pixels",
            scale_factor=scale,
            is_multi_floor=False,
            extraction_warnings=[
                "Processed via Classical CV (Mode A). Entity confidences marked LOW/MEDIUM per BuildWise AI spec."
            ],
            properties={
                "image_width_px": img_w,
                "image_height_px": img_h,
                "detected_lines_count": len(segments),
                "extracted_rooms_count": len(rooms),
            },
        )

        floor = CGMFloor(
            level=0,
            label="Ground Floor",
            walls=walls,
            openings=openings,
            rooms=rooms,
            stairs=[],
            exits=exits,
        )

        return CanonicalFloorPlan(
            id=uuid.uuid4(),
            floors=[floor],
            bounding_box=bbox,
            metadata=metadata,
        )
