"""Unit tests — Graph builder"""

import pytest
from tests.fixtures.simple_floor_plan import get_fixture_dxf


@pytest.fixture
def cgm():
    from engines.ingestion.dxf.adapter import DXFAdapter
    return DXFAdapter().parse(get_fixture_dxf(), "test.dxf")


class TestGraphBuilder:
    def test_builds_graph_without_error(self, cgm):
        from engines.graph.builder import FloorPlanGraphBuilder
        builder = FloorPlanGraphBuilder()
        graph = builder.build(cgm)
        assert graph is not None

    def test_nodes_present(self, cgm):
        from engines.graph.builder import FloorPlanGraphBuilder
        graph = FloorPlanGraphBuilder().build(cgm)
        assert len(graph.nodes) >= 1

    def test_node_types_are_valid(self, cgm):
        from engines.graph.builder import FloorPlanGraphBuilder
        graph = FloorPlanGraphBuilder().build(cgm)
        valid_types = {"room", "corridor", "stair", "exit", "lobby"}
        for node in graph.nodes:
            assert node.node_type in valid_types

    def test_serializes_to_dict(self, cgm):
        from engines.graph.builder import FloorPlanGraphBuilder
        graph = FloorPlanGraphBuilder().build(cgm)
        d = graph.to_dict()
        assert "nodes" in d
        assert "edges" in d
        assert "stats" in d

    def test_dict_is_json_compatible(self, cgm):
        import json
        from engines.graph.builder import FloorPlanGraphBuilder
        graph = FloorPlanGraphBuilder().build(cgm)
        d = graph.to_dict()
        json_str = json.dumps(d)  # Should not raise
        assert len(json_str) > 10

    def test_stats_present(self, cgm):
        from engines.graph.builder import FloorPlanGraphBuilder
        graph = FloorPlanGraphBuilder().build(cgm)
        d = graph.to_dict()
        stats = d["stats"]
        assert "node_count" in stats
        assert "edge_count" in stats
        assert "is_fully_connected" in stats
        assert "connected_components" in stats

    def test_node_centroids_finite(self, cgm):
        import math
        from engines.graph.builder import FloorPlanGraphBuilder
        graph = FloorPlanGraphBuilder().build(cgm)
        for node in graph.nodes:
            assert math.isfinite(node.centroid_x)
            assert math.isfinite(node.centroid_y)
