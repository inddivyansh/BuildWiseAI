"""
Hough Line Detection, Merging, and Orthogonal Snapping (Mode A).

Performs:
1. Probabilistic Hough Transform (HoughLinesP)
2. Collinear line merging
3. Orthogonal snapping (snapping near 0/90/180/270 degrees to horizontal/vertical)
"""

from __future__ import annotations

import math
from typing import Optional

import cv2
import numpy as np


class HoughLineDetector:
    """Detects and cleans architectural wall lines from edge maps."""

    @classmethod
    def detect_lines(
        cls,
        edges: np.ndarray,
        min_line_length: int = 25,
        max_line_gap: int = 15,
        threshold: int = 30,
    ) -> list[tuple[float, float, float, float]]:
        """
        Executes Probabilistic Hough Line Transform.
        Returns list of segments: [(x0, y0, x1, y1), ...]
        """
        raw_lines = cv2.HoughLinesP(
            edges,
            rho=1,
            theta=np.pi / 180.0,
            threshold=threshold,
            minLineLength=min_line_length,
            maxLineGap=max_line_gap,
        )

        if raw_lines is None:
            return []

        segments: list[tuple[float, float, float, float]] = []
        for line in raw_lines:
            coords = np.array(line).flatten()
            if len(coords) >= 4:
                segments.append((float(coords[0]), float(coords[1]), float(coords[2]), float(coords[3])))

        return segments

    @classmethod
    def orthogonal_snap(
        cls,
        lines: list[tuple[float, float, float, float]],
        snap_angle_deg: float = 12.0,
    ) -> list[tuple[float, float, float, float]]:
        """
        Snaps lines close to 0°, 90°, 180°, 270° into perfectly horizontal or vertical lines.
        Crucial for architectural blueprints and clean CAD-like planar geometry.
        """
        snapped: list[tuple[float, float, float, float]] = []

        for x0, y0, x1, y1 in lines:
            dx = x1 - x0
            dy = y1 - y0
            angle_deg = math.degrees(math.atan2(abs(dy), abs(dx)))

            # Close to horizontal (angle ≈ 0°)
            if angle_deg <= snap_angle_deg or angle_deg >= (180.0 - snap_angle_deg):
                mid_y = (y0 + y1) / 2.0
                snapped.append((x0, mid_y, x1, mid_y))
            # Close to vertical (angle ≈ 90°)
            elif abs(angle_deg - 90.0) <= snap_angle_deg:
                mid_x = (x0 + x1) / 2.0
                snapped.append((mid_x, y0, mid_x, y1))
            else:
                # Retain angled lines (slanted walls, diagonal corridors)
                snapped.append((x0, y0, x1, y1))

        return snapped

    @classmethod
    def merge_collinear_lines(
        cls,
        lines: list[tuple[float, float, float, float]],
        dist_tol_px: float = 12.0,
        gap_tol_px: float = 25.0,
    ) -> list[tuple[float, float, float, float]]:
        """
        Merges overlapping or broken collinear line segments into unified continuous wall spans.
        """
        if not lines:
            return []

        # Separate horizontal, vertical, and other lines
        horizontal: list[tuple[float, float, float, float]] = []
        vertical: list[tuple[float, float, float, float]] = []
        others: list[tuple[float, float, float, float]] = []

        for x0, y0, x1, y1 in lines:
            if abs(y1 - y0) < 1e-4:
                # Ensure x0 <= x1
                horizontal.append((min(x0, x1), y0, max(x0, x1), y1))
            elif abs(x1 - x0) < 1e-4:
                # Ensure y0 <= y1
                vertical.append((x0, min(y0, y1), x1, max(y0, y1)))
            else:
                others.append((x0, y0, x1, y1))

        # Merge horizontal lines
        merged_h: list[tuple[float, float, float, float]] = []
        horizontal.sort(key=lambda s: (s[1], s[0]))

        used_h = [False] * len(horizontal)
        for i in range(len(horizontal)):
            if used_h[i]:
                continue
            x0, y, x1, _ = horizontal[i]
            for j in range(i + 1, len(horizontal)):
                if used_h[j]:
                    continue
                jx0, jy, jx1, _ = horizontal[j]
                if abs(jy - y) <= dist_tol_px:
                    # Check overlap or small gap
                    if jx0 <= x1 + gap_tol_px and jx1 >= x0 - gap_tol_px:
                        x0 = min(x0, jx0)
                        x1 = max(x1, jx1)
                        y = (y + jy) / 2.0
                        used_h[j] = True
            merged_h.append((x0, y, x1, y))

        # Merge vertical lines
        merged_v: list[tuple[float, float, float, float]] = []
        vertical.sort(key=lambda s: (s[0], s[1]))

        used_v = [False] * len(vertical)
        for i in range(len(vertical)):
            if used_v[i]:
                continue
            x, y0, _, y1 = vertical[i]
            for j in range(i + 1, len(vertical)):
                if used_v[j]:
                    continue
                jx, jy0, _, jy1 = vertical[j]
                if abs(jx - x) <= dist_tol_px:
                    if jy0 <= y1 + gap_tol_px and jy1 >= y0 - gap_tol_px:
                        y0 = min(y0, jy0)
                        y1 = max(y1, jy1)
                        x = (x + jx) / 2.0
                        used_v[j] = True
            merged_v.append((x, y0, x, y1))

        return merged_h + merged_v + others
