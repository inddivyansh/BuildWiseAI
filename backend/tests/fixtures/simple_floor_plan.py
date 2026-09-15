"""
Minimal architectural DXF fixture for testing.
Generates a simple 3-room floor plan as a DXF file in memory.

Layout (all units in meters, 1:1):

  ┌──────────────┬──────────────┐
  │   Bedroom    │   Kitchen    │
  │   (5m x 4m)  │   (4m x 4m) │
  ├──────────────┴──────────────┤
  │        Living Room          │
  │         (9m x 5m)           │
  └─────────────────────────────┘

Total building footprint: 9m x 9m
"""

import io
from pathlib import Path


def generate_simple_floor_plan_dxf() -> bytes:
    """
    Generate a minimal valid DXF with:
    - 3 closed room polygons (LWPOLYLINE, closed)
    - Layer names matching room/wall heuristics
    - INSUNITS=6 (meters)
    Returns raw DXF bytes.
    """
    try:
        import ezdxf
        doc = ezdxf.new("R2010")
        doc.header["$INSUNITS"] = 6  # Meters

        msp = doc.modelspace()

        # Living room: 9m x 5m at origin
        living = [(0, 0), (9, 0), (9, 5), (0, 5)]
        pl = msp.add_lwpolyline(living, dxfattribs={"layer": "A-ROOM-AREA"})
        pl.close(True)

        # Bedroom: 5m x 4m top-left
        bedroom = [(0, 5), (5, 5), (5, 9), (0, 9)]
        pl = msp.add_lwpolyline(bedroom, dxfattribs={"layer": "A-ROOM-AREA"})
        pl.close(True)

        # Kitchen: 4m x 4m top-right
        kitchen = [(5, 5), (9, 5), (9, 9), (5, 9)]
        pl = msp.add_lwpolyline(kitchen, dxfattribs={"layer": "A-ROOM-AREA"})
        pl.close(True)

        # Exterior walls
        ext_pts = [(0, 0), (9, 0), (9, 9), (0, 9)]
        pl = msp.add_lwpolyline(ext_pts, dxfattribs={"layer": "A-WALL-EXTR"})
        pl.close(True)

        # Interior wall (bedroom/kitchen separator)
        msp.add_line((5, 5), (5, 9), dxfattribs={"layer": "A-WALL-INTR"})
        # Interior wall (living/upstairs separator)
        msp.add_line((0, 5), (9, 5), dxfattribs={"layer": "A-WALL-INTR"})

        # Door from living to bedroom
        msp.add_blockref("DOOR", (2.5, 5), dxfattribs={"layer": "A-DOOR"})
        # Door from living to kitchen
        msp.add_blockref("DOOR", (7, 5), dxfattribs={"layer": "A-DOOR"})
        # Main exit
        msp.add_blockref("EXIT", (4.5, 0), dxfattribs={"layer": "A-DOOR"})

        # Text labels
        msp.add_text("LIVING ROOM", dxfattribs={"layer": "A-ANNO-TEXT", "height": 0.3}).set_placement(
            (3.5, 2.5)
        )
        msp.add_text("BEDROOM", dxfattribs={"layer": "A-ANNO-TEXT", "height": 0.3}).set_placement(
            (1.5, 7.0)
        )
        msp.add_text("KITCHEN", dxfattribs={"layer": "A-ANNO-TEXT", "height": 0.3}).set_placement(
            (6.5, 7.0)
        )

        # Serialize to bytes
        stream = io.StringIO()
        doc.write(stream)
        return stream.getvalue().encode("utf-8")

    except ImportError:
        # Fallback: minimal hand-crafted DXF if ezdxf not available in test env
        return _minimal_dxf_bytes()


def _minimal_dxf_bytes() -> bytes:
    """Ultra-minimal DXF for environments without ezdxf."""
    return b"""  0\nSECTION\n  2\nHEADER\n  9\n$INSUNITS\n 70\n     6\n  0\nENDSEC\n  0\nSECTION\n  2\nENTITIES\n  0\nLINE\n  8\nA-WALL\n 10\n0.0\n 20\n0.0\n 30\n0.0\n 11\n9.0\n 21\n0.0\n 31\n0.0\n  0\nENDSEC\n  0\nEOF\n"""


# Pre-generate and cache the fixture
FIXTURE_DXF_BYTES: bytes = None


def get_fixture_dxf() -> bytes:
    """Return cached fixture DXF bytes."""
    global FIXTURE_DXF_BYTES
    if FIXTURE_DXF_BYTES is None:
        FIXTURE_DXF_BYTES = generate_simple_floor_plan_dxf()
    return FIXTURE_DXF_BYTES


def save_fixture_to_file(path: Path) -> Path:
    """Save the fixture DXF to a file for manual inspection."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(get_fixture_dxf())
    return path
