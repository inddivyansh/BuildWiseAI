"""
Integration tests for End-to-End DXF and Vector PDF Pipelines.
"""

from engines.compliance.engine import ComplianceEngine
from engines.graph.builder import FloorPlanGraphBuilder
from engines.ingestion.dxf.adapter import DXFAdapter
from engines.ingestion.pdf.adapter import PDFAdapter
from tests.fixtures.simple_floor_plan import get_fixture_dxf
from tests.unit.test_pdf_ingestion import SAMPLE_VECTOR_PDF


def test_e2e_dxf_pipeline():
    # 1. Ingestion: DXF -> CGM
    adapter = DXFAdapter()
    cgm = adapter.parse(get_fixture_dxf(), "office.dxf")
    assert len(cgm.floors) >= 1
    assert len(cgm.floors[0].rooms) >= 1

    # 2. Graph Construction: CGM -> FloorPlanGraph
    builder = FloorPlanGraphBuilder()
    graph = builder.build(cgm)
    assert len(graph.nodes) >= 1

    # 3. Deterministic Compliance Evaluation
    compliance_engine = ComplianceEngine()
    output = compliance_engine.evaluate(cgm=cgm, graph=graph, context={"occupancy_type": "commercial"})

    assert output.summary.total_checks > 0
    assert len(output.results) > 0
    # Every result must have an explicit status
    for r in output.results:
        assert r.status in ("PASS", "FAIL", "UNVERIFIED", "INSUFFICIENT_DATA", "WARNING", "NOT_APPLICABLE")


def test_e2e_vector_pdf_pipeline():
    # 1. Ingestion: PDF -> CGM
    adapter = PDFAdapter()
    cgm = adapter.parse(SAMPLE_VECTOR_PDF, "plan.pdf")
    assert len(cgm.floors) >= 1

    # 2. Graph Construction: CGM -> FloorPlanGraph
    builder = FloorPlanGraphBuilder()
    graph = builder.build(cgm)
    assert len(graph.nodes) >= 1

    # 3. Deterministic Compliance Evaluation
    compliance_engine = ComplianceEngine()
    output = compliance_engine.evaluate(cgm=cgm, graph=graph, context={"occupancy_type": "residential"})

    assert output.summary.total_checks > 0
    assert len(output.results) > 0
