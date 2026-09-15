"""
Phase 3 Unit Tests: NBC 2016 Source Grounding, Hybrid RAG, and Verified Compliance Citations.
"""

import pytest
from pathlib import Path

from engines.compliance.result import ComplianceResultData, ResultStatus, RuleVerificationStatus, Severity
from engines.compliance.statutory_registry import (
    AUTHORITATIVE_NBC_CITATIONS,
    get_statutory_citation,
)
from engines.compliance.rules.door_width import MinDoorWidthRule
from engines.compliance.rules.corridor_width import MinCorridorWidthRule
from engines.compliance.rules.travel_distance import MaxTravelDistanceRule
from engines.compliance.rules.dead_end import MaxDeadEndCorridorRule
from engines.compliance.rules.room_area import MinRoomAreaRule
from engines.compliance.rules.stair_width import MinStairWidthRule
from engines.compliance.rules.exit_count import MinExitCountRule
from engines.compliance.rules.ventilation_ratio import MinVentilationRatioRule
from engines.rag.bm25 import BM25Okapi, tokenize
from engines.rag.embeddings import compute_cosine_similarity
from engines.rag.ingestion import NBCDocumentIngestion, decode_bis_glyphs
from engines.rag.retrieval import HybridRegulatoryRetriever
from app.api.v1.chat import chat_query, ChatQueryRequest


class TestNBCSourceIntegrity:
    """Tests for authoritative NBC 2016 source document mapping and integrity."""

    def test_five_documents_mapped(self):
        file_map = NBCDocumentIngestion.FILE_VOLUME_MAP
        assert len(file_map) == 5
        assert "202503261284340577.pdf" in file_map
        assert "202503261347679918.pdf" in file_map
        assert "202503261462788962.pdf" in file_map
        assert "20250306344484706.pdf" in file_map
        assert "2025030624291923.pdf" in file_map

    def test_glyph_decoding(self):
        # /G50/G41/G52/G54 decodes to PART
        encoded = "/G50/G41/G52/G54 4 FIRE AND LIFE SAFETY"
        decoded = decode_bis_glyphs(encoded)
        assert decoded == "PART 4 FIRE AND LIFE SAFETY"

    def test_authoritative_citations_registry_complete(self):
        assert len(AUTHORITATIVE_NBC_CITATIONS) == 8
        for rule_id, cite in AUTHORITATIVE_NBC_CITATIONS.items():
            assert cite.rule_id == rule_id
            assert cite.code_standard == "NBC 2016"
            assert cite.volume in ("Volume 1", "Volume 2")
            assert cite.section_or_clause
            assert cite.page_number > 0
            assert cite.source_filename.endswith(".pdf")
            assert len(cite.source_sha256) == 64
            assert cite.verification_status == "VERIFIED"


class TestRuleVerificationState:
    """Tests for verified compliance rules and provenance attachment."""

    def test_all_rules_verified_status(self):
        rule_classes = [
            MinDoorWidthRule,
            MinCorridorWidthRule,
            MaxTravelDistanceRule,
            MaxDeadEndCorridorRule,
            MinRoomAreaRule,
            MinStairWidthRule,
            MinExitCountRule,
            MinVentilationRatioRule,
        ]
        for rc in rule_classes:
            rule = rc()
            assert rule.verification_status == RuleVerificationStatus.VERIFIED
            meta = rule.metadata_dict()
            assert meta["verification_status"] == "VERIFIED"
            assert meta["source_page"] is not None
            assert meta["clause"] is not None

    def test_populate_statutory_evidence(self):
        rule = MinDoorWidthRule()
        res = ComplianceResultData(
            rule_id="NBC-4-DW-001",
            status=ResultStatus.FAIL,
            severity=Severity.MAJOR,
            title="Door Width Check",
            measured_value=0.80,
            required_value=1.00,
            unit="m",
        )
        rule.populate_statutory_evidence(res)
        assert res.verification_status == "VERIFIED"
        assert res.statutory_clause == "Clause 4.4.2.4.1(b)"
        assert res.source_page == 287
        assert res.source_filename == "202503261284340577.pdf"
        assert len(res.source_sha256) == 64
        assert "No exit doorway shall be less than 1 000 mm" in res.verbatim_statutory_text

    def test_unverified_rule_behavior(self):
        rule = MinCorridorWidthRule()
        # Simulate unverified rule
        rule.verification_status = RuleVerificationStatus.REQUIRES_VERIFICATION
        # Non-compliance with unverified rule must produce UNVERIFIED status (never statutory FAIL)
        status = rule.resolve_status(is_compliant=False)
        assert status == ResultStatus.UNVERIFIED


class TestHybridRAGRetrieval:
    """Tests for BM25, semantic similarity, and RRF fusion."""

    def test_bm25_keyword_ranking(self):
        retriever = HybridRegulatoryRetriever()
        assert len(retriever.corpus) >= 8

        # Exact clause search
        results = retriever.bm25.search("corridor clear width")
        assert len(results) > 0
        top_doc, score = results[0]
        assert "Corridors" in top_doc["heading"]

    def test_cosine_similarity(self):
        vec_a = [1.0, 0.0, 0.0]
        vec_b = [1.0, 0.0, 0.0]
        vec_c = [0.0, 1.0, 0.0]
        assert compute_cosine_similarity(vec_a, vec_b) == pytest.approx(1.0)
        assert compute_cosine_similarity(vec_a, vec_c) == pytest.approx(0.0)

    @pytest.mark.asyncio
    async def test_hybrid_search_corridor_width(self):
        retriever = HybridRegulatoryRetriever()
        results = await retriever.search("What is the minimum corridor width?")
        assert len(results) > 0
        top = results[0]
        assert "4.4.2.4.2" in top.clause_reference or "Corridor" in top.heading
        assert top.page_number == 287

    @pytest.mark.asyncio
    async def test_hybrid_search_travel_distance(self):
        retriever = HybridRegulatoryRetriever()
        results = await retriever.search("What is the maximum travel distance to an exit?")
        assert len(results) > 0
        top = results[0]
        assert "4.4.2.2" in top.clause_reference
        assert "Table 5" in top.clause_reference
        assert top.page_number == 287

    @pytest.mark.asyncio
    async def test_hybrid_search_dead_end(self):
        retriever = HybridRegulatoryRetriever()
        results = await retriever.search("maximum dead end corridor length")
        assert len(results) > 0
        top = results[0]
        assert "4.4.2.2(c)" in top.clause_reference
        assert top.page_number == 285


class TestChatAndHallucinationProtection:
    """Tests for grounded answering and hallucination resistance."""

    @pytest.mark.asyncio
    async def test_grounded_answer_includes_citations(self):
        req = ChatQueryRequest(question="What is the minimum exit door width under NBC 2016?")
        resp = await chat_query(req)
        assert len(resp.citations) > 0
        assert "1 000 mm" in resp.answer or "1.00 m" in resp.answer
        first_cite = resp.citations[0]
        assert "Clause 4.4.2.4.1(b)" in first_cite.section or "Exit Doorways" in first_cite.text
        assert first_cite.page == 287
        assert first_cite.filename == "202503261284340577.pdf"

    @pytest.mark.asyncio
    async def test_hallucination_protection_on_missing_evidence(self):
        # Query on topic completely outside NBC 2016
        req = ChatQueryRequest(question="What is the recipe to bake a chocolate strawberry shortcake on Mars?")
        resp = await chat_query(req)
        assert resp.retrieved_chunk_count == 0
        assert len(resp.citations) == 0
        assert "Insufficient evidence" in resp.answer

    def test_compliance_result_serialization_with_statutory_fields(self):
        res = ComplianceResultData(
            rule_id="NBC-4-DW-001",
            status=ResultStatus.FAIL,
            severity=Severity.MAJOR,
            title="Door Clear Width",
            measured_value=0.85,
            required_value=1.00,
            unit="m",
            statutory_clause="Clause 4.4.2.4.1(b)",
            statutory_volume="Volume 1",
            source_page=287,
            source_filename="202503261284340577.pdf",
            source_sha256="899174d4deb15b5e0481ecad456c3282930b609e59ddebe5111eb4eb497588d3",
            verification_status="VERIFIED",
        )
        d = res.to_dict()
        assert d["statutory_clause"] == "Clause 4.4.2.4.1(b)"
        assert d["statutory_volume"] == "Volume 1"
        assert d["source_page"] == 287
        assert d["source_filename"] == "202503261284340577.pdf"
        assert d["verification_status"] == "VERIFIED"
