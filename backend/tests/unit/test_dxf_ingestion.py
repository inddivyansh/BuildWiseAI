"""
Unit tests — DXF Parser and Adapter

Tests the complete DXF → CGM pipeline using the fixture floor plan.
"""

import pytest
from tests.fixtures.simple_floor_plan import get_fixture_dxf


@pytest.fixture
def fixture_dxf() -> bytes:
    return get_fixture_dxf()


class TestDXFParser:
    def test_parses_without_error(self, fixture_dxf):
        from engines.ingestion.dxf.parser import DXFParser
        parser = DXFParser()
        result = parser.parse(fixture_dxf, "test.dxf")
        assert result.entity_count > 0

    def test_extracts_lines(self, fixture_dxf):
        from engines.ingestion.dxf.parser import DXFParser
        result = DXFParser().parse(fixture_dxf, "test.dxf")
        assert len(result.lines) >= 1

    def test_extracts_polylines(self, fixture_dxf):
        from engines.ingestion.dxf.parser import DXFParser
        result = DXFParser().parse(fixture_dxf, "test.dxf")
        assert len(result.polylines) >= 3  # 3 room polylines

    def test_extracts_texts(self, fixture_dxf):
        from engines.ingestion.dxf.parser import DXFParser
        result = DXFParser().parse(fixture_dxf, "test.dxf")
        assert len(result.texts) >= 1

    def test_reads_insunits(self, fixture_dxf):
        from engines.ingestion.dxf.parser import DXFParser
        result = DXFParser().parse(fixture_dxf, "test.dxf")
        assert result.units_code == 6  # meters

    def test_layers_extracted(self, fixture_dxf):
        from engines.ingestion.dxf.parser import DXFParser
        result = DXFParser().parse(fixture_dxf, "test.dxf")
        assert len(result.layers) > 0

    def test_rejects_empty_bytes(self):
        from engines.ingestion.dxf.parser import DXFParser
        parser = DXFParser()
        with pytest.raises(Exception):
            parser.parse(b"", "empty.dxf")

    def test_rejects_non_dxf(self):
        from engines.ingestion.dxf.parser import DXFParser
        parser = DXFParser()
        with pytest.raises(Exception):
            parser.parse(b"%PDF-1.4 fake pdf content", "fake.dxf")


class TestDXFAdapter:
    def test_produces_canonical_floor_plan(self, fixture_dxf):
        from engines.ingestion.dxf.adapter import DXFAdapter
        from engines.geometry.models import CanonicalFloorPlan
        adapter = DXFAdapter()
        cgm = adapter.parse(fixture_dxf, "test.dxf")
        assert isinstance(cgm, CanonicalFloorPlan)

    def test_floors_present(self, fixture_dxf):
        from engines.ingestion.dxf.adapter import DXFAdapter
        cgm = DXFAdapter().parse(fixture_dxf, "test.dxf")
        assert len(cgm.floors) >= 1

    def test_walls_extracted(self, fixture_dxf):
        from engines.ingestion.dxf.adapter import DXFAdapter
        cgm = DXFAdapter().parse(fixture_dxf, "test.dxf")
        total_walls = sum(len(f.walls) for f in cgm.floors)
        assert total_walls >= 1

    def test_rooms_extracted(self, fixture_dxf):
        from engines.ingestion.dxf.adapter import DXFAdapter
        cgm = DXFAdapter().parse(fixture_dxf, "test.dxf")
        total_rooms = sum(len(f.rooms) for f in cgm.floors)
        assert total_rooms >= 2  # At least 2 of our 3 rooms should be detected

    def test_bounding_box_valid(self, fixture_dxf):
        from engines.ingestion.dxf.adapter import DXFAdapter
        cgm = DXFAdapter().parse(fixture_dxf, "test.dxf")
        bb = cgm.bounding_box
        assert bb.xmax > bb.xmin
        assert bb.ymax > bb.ymin
        assert bb.width > 0
        assert bb.height > 0

    def test_bounding_box_approximately_9x9(self, fixture_dxf):
        """The fixture is a 9m x 9m building."""
        from engines.ingestion.dxf.adapter import DXFAdapter
        cgm = DXFAdapter().parse(fixture_dxf, "test.dxf")
        bb = cgm.bounding_box
        assert 8.0 <= bb.width <= 10.0
        assert 8.0 <= bb.height <= 10.0

    def test_metadata_format_is_dxf(self, fixture_dxf):
        from engines.ingestion.dxf.adapter import DXFAdapter
        cgm = DXFAdapter().parse(fixture_dxf, "test.dxf")
        assert cgm.metadata.source_format == "dxf"
        assert cgm.metadata.coordinate_unit == "meters"

    def test_room_areas_positive(self, fixture_dxf):
        from engines.ingestion.dxf.adapter import DXFAdapter
        cgm = DXFAdapter().parse(fixture_dxf, "test.dxf")
        for floor in cgm.floors:
            for room in floor.rooms:
                assert room.area_m2 is None or room.area_m2 > 0

    def test_can_handle_returns_true_for_dxf(self):
        from engines.ingestion.dxf.adapter import DXFAdapter
        adapter = DXFAdapter()
        assert adapter.can_handle("plan.dxf", b"") is True
        assert adapter.can_handle("plan.DXF", b"") is True
        assert adapter.can_handle("plan.pdf", b"") is False

    def test_raises_ingestion_error_for_empty(self):
        from engines.ingestion.dxf.adapter import DXFAdapter
        from engines.ingestion.base import IngestionError
        adapter = DXFAdapter()
        with pytest.raises((IngestionError, Exception)):
            adapter.parse(b"this is not a dxf", "bad.dxf")


class TestCGMSerialization:
    def test_round_trip_serialization(self, fixture_dxf):
        from engines.ingestion.dxf.adapter import DXFAdapter
        from engines.geometry.models import CanonicalFloorPlan
        cgm = DXFAdapter().parse(fixture_dxf, "test.dxf")

        # Serialize to dict (as stored in JSONB)
        data = cgm.to_storage_dict()
        assert isinstance(data, dict)
        assert "floors" in data
        assert "bounding_box" in data
        assert "metadata" in data

        # Deserialize back
        cgm2 = CanonicalFloorPlan.from_storage_dict(data)
        assert cgm2.floor_count == cgm.floor_count
        assert abs(cgm2.bounding_box.xmax - cgm.bounding_box.xmax) < 0.001

    def test_serialized_data_is_json_compatible(self, fixture_dxf):
        import json
        from engines.ingestion.dxf.adapter import DXFAdapter
        cgm = DXFAdapter().parse(fixture_dxf, "test.dxf")
        data = cgm.to_storage_dict()
        # Should not raise
        json_str = json.dumps(data)
        assert len(json_str) > 100
