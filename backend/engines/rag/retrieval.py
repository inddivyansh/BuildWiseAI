"""
Hybrid Regulatory Retrieval Engine for NBC 2016.

Combines:
1. Okapi BM25 keyword retrieval (exact clause, terminology, numeric matching)
2. Dense semantic vector retrieval (conceptual matching)
3. Reciprocal Rank Fusion (RRF) ranking aggregation

Maintains strict provenance tracking:
Every retrieved result includes Volume, Part, Clause, Page Number, File, and SHA-256 checksum.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any, Optional

from app.logging_config import get_logger
from engines.compliance.statutory_registry import AUTHORITATIVE_NBC_CITATIONS
from engines.rag.bm25 import BM25Okapi
from engines.rag.contracts import DocumentChunk, RetrievalResult
from engines.rag.embeddings import (
    BaseEmbeddingProvider,
    compute_cosine_similarity,
)

logger = get_logger(__name__)


@dataclass
class RetrievedRegulatoryChunk:
    chunk_id: str
    code_standard: str
    volume: str
    part: str
    clause_reference: str
    page_number: int
    source_filename: str
    source_sha256: str
    heading: str
    content: str
    bm25_score: float = 0.0
    vector_score: float = 0.0
    rrf_score: float = 0.0
    retrieval_mode: str = "hybrid"  # "hybrid" | "bm25" | "vector"

    def to_citation_dict(self) -> dict[str, Any]:
        return {
            "section": f"{self.code_standard} {self.part}, {self.clause_reference}",
            "clause": self.clause_reference,
            "volume": self.volume,
            "part": self.part,
            "page": self.page_number,
            "filename": self.source_filename,
            "sha256": self.source_sha256,
            "text": self.content[:300] + ("..." if len(self.content) > 300 else ""),
            "relevance_score": round(self.rrf_score if self.rrf_score > 0 else self.bm25_score, 4),
        }


class HybridRegulatoryRetriever:
    """
    Hybrid retriever orchestrating BM25 keyword matching and dense vector similarity.
    Pre-seeded with authoritative NBC statutory chunks and extensible with ingested PDF pages.
    """

    def __init__(
        self,
        embedding_provider: Optional[BaseEmbeddingProvider] = None,
        rrf_k: int = 60,
    ) -> None:
        self.embedding_provider = embedding_provider
        self.rrf_k = rrf_k
        self.corpus: list[dict[str, Any]] = []
        self.embeddings: list[list[float]] = []
        self.bm25: Optional[BM25Okapi] = None

        self._seed_authoritative_registry()

    def _seed_authoritative_registry(self) -> None:
        """Seeds the retriever with the verified statutory citations extracted from NBC PDFs."""
        for rule_id, cite in AUTHORITATIVE_NBC_CITATIONS.items():
            entry = {
                "id": str(uuid.uuid4()),
                "code_standard": cite.code_standard,
                "volume": cite.volume,
                "part": cite.part,
                "clause_reference": cite.section_or_clause,
                "page_number": cite.page_number,
                "source_filename": cite.source_filename,
                "source_sha256": cite.source_sha256,
                "heading": cite.statutory_title,
                "content": f"{cite.statutory_title}. {cite.statutory_title}. {cite.verbatim_text} {cite.threshold_summary}",
                "rule_id": rule_id,
            }
            self.corpus.append(entry)

        self._rebuild_bm25()

    def add_chunks(self, chunks: list[dict[str, Any]]) -> None:
        """Add additional extracted regulatory chunks to the corpus."""
        for c in chunks:
            self.corpus.append(c)
        self._rebuild_bm25()

    def _rebuild_bm25(self) -> None:
        self.bm25 = BM25Okapi(self.corpus, text_field="content")

    async def search(
        self,
        query: str,
        top_k: int = 5,
        filter_part: Optional[str] = None,
    ) -> list[RetrievedRegulatoryChunk]:
        """
        Executes hybrid retrieval using Reciprocal Rank Fusion of BM25 + Vector results.
        """
        if not self.corpus:
            return []

        # 1. BM25 Keyword Search
        bm25_results = self.bm25.search(query, top_k=top_k * 2) if self.bm25 else []
        bm25_ranks = {doc["id"]: rank for rank, (doc, _) in enumerate(bm25_results, start=1)}
        bm25_scores = {doc["id"]: score for doc, score in bm25_results}

        # 2. Vector Semantic Search (if embedding provider available)
        vector_ranks: dict[str, int] = {}
        vector_scores: dict[str, float] = {}

        if self.embedding_provider and self.embedding_provider.is_available and self.embeddings:
            try:
                query_vec = await self.embedding_provider.embed_query(query)
                scored_docs = []
                for i, doc in enumerate(self.corpus):
                    if i < len(self.embeddings):
                        sim = compute_cosine_similarity(query_vec, self.embeddings[i])
                        scored_docs.append((doc, sim))
                scored_docs.sort(key=lambda x: x[1], reverse=True)
                for rank, (doc, sim) in enumerate(scored_docs[:top_k * 2], start=1):
                    vector_ranks[doc["id"]] = rank
                    vector_scores[doc["id"]] = sim
            except Exception as e:
                logger.warning("Vector search step bypassed", error=str(e))

        # 3. Reciprocal Rank Fusion (RRF)
        all_candidate_ids = set(bm25_ranks.keys()) | set(vector_ranks.keys())
        if not all_candidate_ids:
            return []

        fused_scores: list[tuple[dict[str, Any], float, float, float]] = []
        for doc_id in all_candidate_ids:
            doc = next(d for d in self.corpus if d["id"] == doc_id)

            if filter_part and filter_part.lower() not in doc.get("part", "").lower():
                continue

            r_bm25 = bm25_ranks.get(doc_id)
            r_vec = vector_ranks.get(doc_id)

            rrf_score = 0.0
            if r_bm25 is not None:
                rrf_score += 1.0 / (self.rrf_k + r_bm25)
            if r_vec is not None:
                rrf_score += 1.0 / (self.rrf_k + r_vec)

            fused_scores.append(
                (doc, rrf_score, bm25_scores.get(doc_id, 0.0), vector_scores.get(doc_id, 0.0))
            )

        fused_scores.sort(key=lambda x: x[1], reverse=True)

        results: list[RetrievedRegulatoryChunk] = []
        for doc, rrf, b_score, v_score in fused_scores[:top_k]:
            results.append(
                RetrievedRegulatoryChunk(
                    chunk_id=doc["id"],
                    code_standard=doc.get("code_standard", "NBC 2016"),
                    volume=doc.get("volume", "Volume 1"),
                    part=doc.get("part", ""),
                    clause_reference=doc.get("clause_reference", ""),
                    page_number=doc.get("page_number", 1),
                    source_filename=doc.get("source_filename", ""),
                    source_sha256=doc.get("source_sha256", ""),
                    heading=doc.get("heading", ""),
                    content=doc.get("content", ""),
                    bm25_score=b_score,
                    vector_score=v_score,
                    rrf_score=rrf,
                    retrieval_mode="hybrid" if v_score > 0 else "bm25",
                )
            )

        return results


# Global singleton instance for application use
global_retriever = HybridRegulatoryRetriever()
