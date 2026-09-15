"""
Unit tests for Computer Vision Pipeline (Mode A).
"""

import cv2
import numpy as np
import pytest

from engines.geometry.models import CanonicalFloorPlan, ConfidenceLevel
from engines.ingestion.vision.adapter import VisionAdapter
from engines.ingestion.vision.line_detector import HoughLineDetector
from engines.ingestion.vision.preprocessor import ImagePreprocessor


def create_synthetic_blueprint_image() -> bytes:
    """Draws a clean black-and-white 2-room floor plan sketch."""
    img = np.full((400, 400, 3), 255, dtype=np.uint8)
    # Outer walls
    cv2.rectangle(img, (40, 40), (360, 360), (0, 0, 0), thickness=4)
    # Interior dividing wall
    cv2.line(img, (200, 40), (200, 360), (0, 0, 0), thickness=4)
    _, encoded = cv2.imencode(".png", img)
    return encoded.tobytes()


def test_image_preprocessor():
    png_bytes = create_synthetic_blueprint_image()
    gray, thresh, edges, (h, w) = ImagePreprocessor.preprocess(png_bytes)

    assert h == 400 and w == 400
    assert gray.shape == (400, 400)
    assert thresh.shape == (400, 400)
    assert edges.shape == (400, 400)
    # Edge map should contain edge pixels for drawn walls
    assert np.count_nonzero(edges) > 100


def test_orthogonal_snapping():
    # 2° off horizontal and 88° off vertical lines
    slanted_lines = [
        (10.0, 10.0, 100.0, 12.0),   # ~1.27° -> should snap to horizontal
        (50.0, 20.0, 52.0, 150.0),   # ~88.9° -> should snap to vertical
        (10.0, 10.0, 80.0, 80.0),    # 45° -> diagonal, should not snap
    ]
    snapped = HoughLineDetector.orthogonal_snap(slanted_lines, snap_angle_deg=10.0)
    assert len(snapped) == 3
    # First line snapped: y0 == y1
    assert abs(snapped[0][1] - snapped[0][3]) < 1e-4
    # Second line snapped: x0 == x1
    assert abs(snapped[1][0] - snapped[1][2]) < 1e-4
    # Diagonal unchanged
    assert abs(snapped[2][1] - snapped[2][3]) > 1.0


def test_collinear_merging():
    # Two broken horizontal line segments along y=50 with small gap
    broken_segments = [
        (10.0, 50.0, 100.0, 50.0),
        (110.0, 50.0, 200.0, 50.0),
    ]
    merged = HoughLineDetector.merge_collinear_lines(broken_segments, gap_tol_px=20.0)
    assert len(merged) == 1
    # Spans from 10 to 200
    assert merged[0][0] == 10.0 and merged[0][2] == 200.0


def test_vision_adapter_e2e():
    png_bytes = create_synthetic_blueprint_image()
    adapter = VisionAdapter()

    assert adapter.can_handle("sketch.png", png_bytes) is True
    assert adapter.can_handle("plan.dxf", b"0\nSECTION") is False

    cgm = adapter.parse(png_bytes, "sketch.png")
    assert isinstance(cgm, CanonicalFloorPlan)
    assert len(cgm.floors) == 1
    assert cgm.metadata.source_format == "image"
    assert cgm.metadata.extraction_method == "classical_cv_pipeline"

    floor = cgm.floors[0]
    assert len(floor.walls) >= 1
    # Extracted entities must have LOW confidence per spec
    assert floor.walls[0].confidence == ConfidenceLevel.LOW
    if floor.rooms:
        assert floor.rooms[0].confidence == ConfidenceLevel.LOW
