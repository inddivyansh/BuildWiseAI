"""
DXF Parser — low-level entity extraction using ezdxf.

Reads raw DXF content and produces a flat list of raw geometric primitives.
Does NOT apply semantic interpretation (which entities are walls, rooms, etc.).
The adapter layer handles semantic classification.

Supported entities:
  LINE        → line segment
  LWPOLYLINE  → multi-segment polyline (most common for room boundaries)
  POLYLINE    → legacy polyline
  ARC         → circular arc (approximated as chord + metadata)
  CIRCLE      → circle (approximated as polygon with arc metadata)
  SPLINE      → approximated as polyline via fit points
  INSERT      → block reference (position only, geometry not expanded)
  TEXT/MTEXT  → text label extraction
"""

from __future__ import annotations

import io
import math
from dataclasses import dataclass, field
from typing import Optional

from app.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class RawLine:
    layer: str
    x1: float; y1: float
    x2: float; y2: float


@dataclass
class RawPolyline:
    layer: str
    points: list[tuple[float, float]]
    is_closed: bool
    has_width: bool = False


@dataclass
class RawArc:
    layer: str
    center_x: float; center_y: float
    radius: float
    start_angle_deg: float
    end_angle_deg: float


@dataclass
class RawCircle:
    layer: str
    center_x: float; center_y: float
    radius: float


@dataclass
class RawText:
    layer: str
    x: float; y: float
    text: str
    height: float = 0.0


@dataclass
class RawInsert:
    """Block reference — records position only."""
    layer: str
    block_name: str
    x: float; y: float
    x_scale: float = 1.0
    y_scale: float = 1.0
    rotation_deg: float = 0.0


@dataclass
class ParsedDXF:
    """All raw entities extracted from a DXF file."""
    lines: list[RawLine] = field(default_factory=list)
    polylines: list[RawPolyline] = field(default_factory=list)
    arcs: list[RawArc] = field(default_factory=list)
    circles: list[RawCircle] = field(default_factory=list)
    texts: list[RawText] = field(default_factory=list)
    inserts: list[RawInsert] = field(default_factory=list)

    # Metadata
    layers: set[str] = field(default_factory=set)
    units_code: int = 0          # DXF INSUNITS code
    warnings: list[str] = field(default_factory=list)
    entity_count: int = 0
    skipped_count: int = 0


# DXF INSUNITS → meters conversion factors
# https://help.autodesk.com/view/OARX/2024/ENU/?guid=GUID-A6E82B6A-1B24-4F29-A2A4-F37E1A0B3D5A
INSUNITS_TO_METERS: dict[int, float] = {
    0:  1.0,        # Unitless — treat as meters (warn)
    1:  0.0254,     # Inches
    2:  0.3048,     # Feet
    3:  1609.344,   # Miles
    4:  0.001,      # Millimeters
    5:  0.01,       # Centimeters
    6:  1.0,        # Meters
    7:  1000.0,     # Kilometers
    8:  0.0000254,  # Microinches
    9:  0.0000254,  # Mils
    10: 1852.0,     # Nautical miles
    11: 0.000001,   # Angstroms
    12: 0.000000001,# Nanometers
    13: 0.000001,   # Microns
    14: 100.0,      # Decameters
    15: 1000.0,     # Hectometers
    16: 1000000.0,  # Gigameters
    17: 9.461e15,   # Astronomical units (light years)
    18: 9.461e15,   # Light years
    19: 3.086e16,   # Parsecs
    20: 0.3048,     # US Survey Feet
}


def arc_to_polyline(
    cx: float, cy: float, radius: float,
    start_deg: float, end_deg: float,
    segments: int = 12,
) -> list[tuple[float, float]]:
    """Approximate an arc as a polyline with `segments` segments."""
    start_rad = math.radians(start_deg)
    end_rad = math.radians(end_deg)
    if end_rad <= start_rad:
        end_rad += 2 * math.pi
    angles = [start_rad + (end_rad - start_rad) * i / segments for i in range(segments + 1)]
    return [(cx + radius * math.cos(a), cy + radius * math.sin(a)) for a in angles]


def circle_to_polyline(
    cx: float, cy: float, radius: float, segments: int = 24,
) -> list[tuple[float, float]]:
    """Approximate a circle as a closed polyline."""
    angles = [2 * math.pi * i / segments for i in range(segments)]
    return [(cx + radius * math.cos(a), cy + radius * math.sin(a)) for a in angles]


class DXFParser:
    """
    Parses a DXF file (bytes) using ezdxf and returns a ParsedDXF.
    
    All coordinates are returned in their original DXF units.
    Unit conversion to meters is applied by the DXFAdapter layer.
    """

    def parse(self, content: bytes, filename: str = "upload.dxf") -> ParsedDXF:
        """Parse DXF bytes into a ParsedDXF structure."""
        try:
            import ezdxf
            from ezdxf import recover
        except ImportError:
            raise ImportError("ezdxf not installed — run: pip install ezdxf")

        result = ParsedDXF()

        # Try standard load first, then recovery mode
        try:
            doc = ezdxf.read(io.StringIO(content.decode("utf-8", errors="replace")))
        except Exception as e:
            logger.warning("Standard DXF load failed, trying recovery", error=str(e))
            try:
                doc, audit = recover.readbytes(content)
                if audit.has_errors:
                    result.warnings.append(f"DXF recovery mode: {len(audit.errors)} errors fixed")
            except Exception as e2:
                raise ValueError(f"Cannot parse DXF file: {e2}") from e2

        # Extract INSUNITS
        try:
            header = doc.header
            result.units_code = header.get("$INSUNITS", 0)
        except Exception:
            result.units_code = 0
            result.warnings.append("Could not read $INSUNITS — assuming meters")

        if result.units_code == 0:
            result.warnings.append(
                "DXF has no units set ($INSUNITS=0). Treating as meters. "
                "If the drawing appears wrong, set $INSUNITS in your CAD software."
            )

        # Iterate all modelspace entities
        try:
            msp = doc.modelspace()
        except Exception as e:
            raise ValueError(f"Cannot access DXF modelspace: {e}") from e

        for entity in msp:
            result.entity_count += 1
            layer = entity.dxf.layer if entity.dxf.hasattr("layer") else "0"
            result.layers.add(layer)
            dxf_type = entity.dxftype()

            try:
                if dxf_type == "LINE":
                    s = entity.dxf.start
                    e = entity.dxf.end
                    result.lines.append(RawLine(
                        layer=layer,
                        x1=s.x, y1=s.y, x2=e.x, y2=e.y,
                    ))

                elif dxf_type == "LWPOLYLINE":
                    pts = [(p[0], p[1]) for p in entity.get_points()]
                    if len(pts) >= 2:
                        result.polylines.append(RawPolyline(
                            layer=layer,
                            points=pts,
                            is_closed=bool(entity.is_closed),
                            has_width=entity.dxf.get("const_width", 0) > 0,
                        ))

                elif dxf_type == "POLYLINE":
                    pts = [(v.dxf.location.x, v.dxf.location.y) for v in entity.vertices]
                    if len(pts) >= 2:
                        result.polylines.append(RawPolyline(
                            layer=layer,
                            points=pts,
                            is_closed=entity.is_closed,
                        ))

                elif dxf_type == "ARC":
                    cx, cy = entity.dxf.center.x, entity.dxf.center.y
                    r = entity.dxf.radius
                    sa = entity.dxf.start_angle
                    ea = entity.dxf.end_angle
                    result.arcs.append(RawArc(layer, cx, cy, r, sa, ea))
                    # Also add as polyline approximation for geometry processing
                    pts = arc_to_polyline(cx, cy, r, sa, ea)
                    result.polylines.append(RawPolyline(layer=layer, points=pts, is_closed=False))

                elif dxf_type == "CIRCLE":
                    cx, cy = entity.dxf.center.x, entity.dxf.center.y
                    r = entity.dxf.radius
                    result.circles.append(RawCircle(layer, cx, cy, r))
                    # Add as closed polyline approximation
                    pts = circle_to_polyline(cx, cy, r)
                    result.polylines.append(RawPolyline(layer=layer, points=pts, is_closed=True))

                elif dxf_type == "SPLINE":
                    # Use fit points or control points as polyline approximation
                    try:
                        pts = [(p.x, p[1]) for p in entity.fit_points]
                    except Exception:
                        try:
                            pts = [(p.x, p.y) for p in entity.control_points]
                        except Exception:
                            pts = []
                    if len(pts) >= 2:
                        result.polylines.append(RawPolyline(layer=layer, points=pts, is_closed=False))

                elif dxf_type in ("TEXT", "MTEXT"):
                    try:
                        if dxf_type == "TEXT":
                            x = entity.dxf.insert.x
                            y = entity.dxf.insert.y
                            text = entity.dxf.text
                            height = entity.dxf.get("height", 0.25)
                        else:
                            x = entity.dxf.insert.x
                            y = entity.dxf.insert.y
                            text = entity.text
                            height = entity.dxf.get("char_height", 0.25)
                        if text and text.strip():
                            result.texts.append(RawText(layer, x, y, text.strip(), height))
                    except Exception:
                        pass

                elif dxf_type == "INSERT":
                    try:
                        result.inserts.append(RawInsert(
                            layer=layer,
                            block_name=entity.dxf.name,
                            x=entity.dxf.insert.x,
                            y=entity.dxf.insert.y,
                            x_scale=entity.dxf.get("xscale", 1.0),
                            y_scale=entity.dxf.get("yscale", 1.0),
                            rotation_deg=entity.dxf.get("rotation", 0.0),
                        ))
                    except Exception:
                        pass

                else:
                    result.skipped_count += 1

            except Exception as e:
                result.skipped_count += 1
                result.warnings.append(f"Skipped {dxf_type} on layer '{layer}': {e}")

        logger.info(
            "DXF parsed",
            filename=filename,
            entities=result.entity_count,
            lines=len(result.lines),
            polylines=len(result.polylines),
            arcs=len(result.arcs),
            texts=len(result.texts),
            skipped=result.skipped_count,
            layers=len(result.layers),
            units=result.units_code,
        )

        return result
