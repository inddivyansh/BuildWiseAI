"""
Geometric Measurement Contracts — Structured physical dimensions extracted from CGM & Graph.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


class MeasurementCategory:
    WALL_LENGTH = "wall_length"
    DOOR_WIDTH = "door_width"
    CORRIDOR_WIDTH = "corridor_width"
    ROOM_DIMENSION = "room_dimension"
    STAIR_WIDTH = "stair_width"
    WINDOW_OPENING = "window_opening"
    TRAVEL_DISTANCE = "travel_distance"
    DEAD_END = "dead_end"
    EXIT_COUNT = "exit_count"


@dataclass
class GeometricMeasurement:
    """A verified physical measurement derived from Canonical Geometry Model."""
    measurement_id: str
    name: str
    category: str              # corridor_width | door_width | room_dimension | travel_distance | dead_end | stair_width | window_opening | wall_length | exit_count
    value: Optional[float]     # Measured numerical value, None if ambiguous
    unit: str                  # m | m2 | count | ratio
    confidence: str            # high | medium | low
    entity_type: str           # room | corridor | opening | stair | exit | wall | floor
    entity_id: Optional[str] = None
    entity_label: Optional[str] = None
    measurement_method: str = "direct_geometry" # minimum_rotated_rectangle | euclidean_path | segment_length | polygon_area
    geometry_references: list[Any] = field(default_factory=list) # Coordinates, lines, or polylines
    metadata: dict[str, Any] = field(default_factory=dict)
    floor_level: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "measurement_id": self.measurement_id,
            "name": self.name,
            "category": self.category,
            "value": round(self.value, 3) if self.value is not None else None,
            "unit": self.unit,
            "confidence": self.confidence,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "entity_label": self.entity_label,
            "measurement_method": self.measurement_method,
            "geometry_references": self.geometry_references,
            "metadata": self.metadata,
            "floor_level": self.floor_level,
        }
