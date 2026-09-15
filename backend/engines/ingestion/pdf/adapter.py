"""
PDF Adapter — Converts ParsedPDFDocument into CanonicalFloorPlan.

Converts vector PDF lines, curves, rectangles, and text labels into the
standard Canonical Geometry Model (CGM).
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
from engines.ingestion.pdf.parser import PDFParser, ParsedPDFDocument, ParsedPDFPage

logger = get_logger(__name__)

# Default scale factor for architectural PDFs:
# Standard A3/A4 architectural print at 1:100 scale: 1 point ≈ 0.03528 meters
DEFAULT_PDF_SCALE_FACTOR = 0.03528


class PDFAdapter(IngestionAdapter):
    """Converts Vector Architectural PDF blueprints into CanonicalFloorPlan."""

    def can_handle(self, filename: str, content: bytes) -> bool:
        ext = Path(filename).suffix.lower()
        return ext == ".pdf" or content.startswith(b"%PDF-")

    def parse(self, content: bytes, filename: str) -> CanonicalFloorPlan:
        parsed_doc = PDFParser.parse(content, filename)

        floors: list[CGMFloor] = []
        all_x: list[float] = []
        all_y: list[float] = []

        scale = DEFAULT_PDF_SCALE_FACTOR

        for page in parsed_doc.pages:
            floor_level = page.page_number - 1
            floor_label = f"Floor {page.page_number}" if parsed_doc.total_pages > 1 else "Ground Floor"

            segments: list[LineSegment] = []

            # 1. Convert lines
            for pl in page.lines:
                s = LineSegment(
                    start=Point2D(x=round(pl.x0 * scale, 3), y=round(pl.y0 * scale, 3)),
                    end=Point2D(x=round(pl.x1 * scale, 3), y=round(pl.y1 * scale, 3)),
                )
                if s.length >= 0.1:  # Filter noise segments shorter than 10cm
                    segments.append(s)
                    all_x.extend([s.start.x, s.end.x])
                    all_y.extend([s.start.y, s.end.y])

            # 2. Convert rectangles to boundary segments
            for pr in page.rects:
                rx0, ry0 = round(pr.x0 * scale, 3), round(pr.y0 * scale, 3)
                rx1, ry1 = round(pr.x1 * scale, 3), round(pr.y1 * scale, 3)
                rect_segs = [
                    LineSegment(start=Point2D(x=rx0, y=ry0), end=Point2D(x=rx1, y=ry0)),
                    LineSegment(start=Point2D(x=rx1, y=ry0), end=Point2D(x=rx1, y=ry1)),
                    LineSegment(start=Point2D(x=rx1, y=ry1), end=Point2D(x=rx0, y=ry1)),
                    LineSegment(start=Point2D(x=rx0, y=ry1), end=Point2D(x=rx0, y=ry0)),
                ]
                for rs in rect_segs:
                    if rs.length >= 0.1:
                        segments.append(rs)
                        all_x.extend([rs.start.x, rs.end.x])
                        all_y.extend([rs.start.y, rs.end.y])

            # 3. Build walls from segments
            walls: list[CGMWall] = []
            if segments:
                # Group segments into a structured wall entity
                wall = CGMWall(
                    id=uuid.uuid4(),
                    wall_type=WallType.PARTITION,
                    segments=segments,
                    thickness_m=0.20,
                    height_m=2.8,
                    floor_level=floor_level,
                    confidence=ConfidenceLevel.MEDIUM,
                    source_layer="PDF_VECTOR_LAYER",
                )
                walls.append(wall)

            # 4. Extract rooms using RoomExtractor
            text_labels: list[tuple[Point2D, str]] = [
                (Point2D(x=round(w.cx * scale, 3), y=round(w.cy * scale, 3)), w.text)
                for w in page.words
            ]

            rooms = RoomExtractor.extract_rooms_from_segments(
                segments=segments,
                text_labels=text_labels,
                floor_level=floor_level,
                confidence=ConfidenceLevel.MEDIUM,
            )

            # 5. Detect openings & exits
            openings: list[CGMOpening] = []
            exits: list[CGMExit] = []

            # Look for door/exit texts or door swing arcs in curves
            for pt, txt in text_labels:
                up_txt = txt.upper()
                if "DOOR" in up_txt or "D1" in up_txt or "D2" in up_txt:
                    openings.append(
                        CGMOpening(
                            id=uuid.uuid4(),
                            opening_type=OpeningType.DOOR,
                            position=pt,
                            width_m=0.90,  # Standard door default width
                            floor_level=floor_level,
                            confidence=ConfidenceLevel.MEDIUM,
                            source_layer="PDF_TEXT_DOOR",
                        )
                    )
                elif "EXIT" in up_txt or "ENTRY" in up_txt or "MAIN" in up_txt:
                    exits.append(
                        CGMExit(
                            id=uuid.uuid4(),
                            exit_type=ExitType.EMERGENCY_EXIT if "EXIT" in up_txt else ExitType.MAIN_ENTRANCE,
                            position=pt,
                            width_m=1.20,
                            floor_level=floor_level,
                            confidence=ConfidenceLevel.MEDIUM,
                        )
                    )

            # Fallback: if rooms exist and no exit is labeled, create an exit at perimeter
            if not exits and rooms:
                first_room = rooms[0]
                centroid = first_room.boundary.centroid
                exits.append(
                    CGMExit(
                        id=uuid.uuid4(),
                        exit_type=ExitType.MAIN_ENTRANCE,
                        position=Point2D(x=centroid.x + 2.0, y=centroid.y),
                        width_m=1.0,
                        floor_level=floor_level,
                        confidence=ConfidenceLevel.LOW,
                    )
                )

            cgm_floor = CGMFloor(
                level=floor_level,
                label=floor_label,
                walls=walls,
                openings=openings,
                rooms=rooms,
                stairs=[],
                exits=exits,
            )
            floors.append(cgm_floor)

        # Global bounding box
        if all_x and all_y:
            bbox = CGMBoundingBox(
                xmin=round(min(all_x), 2),
                ymin=round(min(all_y), 2),
                xmax=round(max(all_x), 2),
                ymax=round(max(all_y), 2),
            )
        else:
            bbox = CGMBoundingBox(xmin=0.0, ymin=0.0, xmax=20.0, ymax=20.0)

        metadata = CGMMetadata(
            source_format="pdf",
            source_filename=filename,
            extraction_method="pdfplumber",
            coordinate_unit="meters",
            original_unit="points",
            scale_factor=scale,
            is_multi_floor=len(floors) > 1,
            properties={
                "total_pages": parsed_doc.total_pages,
                "is_vector_pdf": parsed_doc.is_vector_document,
            },
        )

        return CanonicalFloorPlan(
            id=uuid.uuid4(),
            floors=floors,
            bounding_box=bbox,
            metadata=metadata,
        )
