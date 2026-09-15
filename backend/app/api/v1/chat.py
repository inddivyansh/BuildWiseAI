"""
RAG Chat API — Authoritative NBC 2016 Regulatory Q&A.

Workflow:
1. Receives natural language question (e.g. "What is the minimum corridor width?").
2. Queries the hybrid retrieval engine (BM25 + Dense Semantic Vector).
3. Extracts authoritative NBC 2016 chunks with exact Part, Clause, and Page citations.
4. Invokes the Gemini 3-model pool with strict anti-hallucination system prompt.
5. If Gemini is unavailable / in cooldown, falls back to direct grounded citation synthesis.
6. Returns structured answer, citations, and model metadata.
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.config import get_settings
from app.logging_config import get_logger
from engines.rag.retrieval import global_retriever

logger = get_logger(__name__)
router = APIRouter()


class ChatQueryRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Regulatory question regarding NBC 2016")
    document_ids: list[str] = Field(default_factory=list)
    max_citations: int = Field(default=4, ge=1, le=10)


class CitationItem(BaseModel):
    section: str
    clause: str
    volume: str
    part: str
    page: int
    filename: str
    sha256: str
    text: str
    relevance_score: float


class ChatQueryResponse(BaseModel):
    answer: str
    citations: list[CitationItem]
    llm_available: bool
    model_used: Optional[str] = None
    retrieved_chunk_count: int
    retrieval_mode: str


@router.post("/query", response_model=ChatQueryResponse, summary="Ask an NBC 2016 regulatory question")
async def chat_query(payload: ChatQueryRequest) -> ChatQueryResponse:
    """
    Answers regulatory questions grounded strictly in the 5 authoritative NBC 2016 PDFs.
    """
    query_text = payload.question.strip()
    if not query_text:
        return ChatQueryResponse(
            answer="Please enter a valid regulatory question.",
            citations=[],
            llm_available=False,
            model_used=None,
            retrieved_chunk_count=0,
            retrieval_mode="none",
        )

    # 1. Retrieve authoritative regulatory chunks via Hybrid RAG
    retrieved_chunks = await global_retriever.search(query_text, top_k=payload.max_citations)

    if not retrieved_chunks or (retrieved_chunks[0].bm25_score < 0.05 and retrieved_chunks[0].vector_score < 0.05):
        return ChatQueryResponse(
            answer="Insufficient evidence in the authoritative NBC 2016 corpus to provide a reliable regulatory answer.",
            citations=[],
            llm_available=False,
            model_used=None,
            retrieved_chunk_count=0,
            retrieval_mode="bm25",
        )

    # 2. Format citations
    citations: list[CitationItem] = []
    chunk_dicts_for_llm: list[dict[str, Any]] = []

    for c in retrieved_chunks:
        cite_dict = c.to_citation_dict()
        citations.append(
            CitationItem(
                section=cite_dict["section"],
                clause=c.clause_reference,
                volume=c.volume,
                part=c.part,
                page=c.page_number,
                filename=c.source_filename,
                sha256=c.source_sha256,
                text=c.content,
                relevance_score=cite_dict["relevance_score"],
            )
        )
        chunk_dicts_for_llm.append({
            "section_number": f"{c.code_standard} {c.part}, {c.clause_reference}",
            "page_number": c.page_number,
            "raw_text": c.content,
        })

    # 3. Attempt Gemini grounded answering
    settings = get_settings()
    llm_available = False
    model_used: Optional[str] = None
    final_answer: Optional[str] = None

    if settings.llm_available:
        try:
            from engines.llm.gemini_provider import GeminiProvider
            provider = GeminiProvider.from_settings()
            llm_res = await provider.answer_regulatory_query(
                question=query_text,
                retrieved_chunks=chunk_dicts_for_llm,
                max_tokens=768,
            )
            if llm_res.is_available and llm_res.text:
                llm_available = True
                model_used = llm_res.model_used
                final_answer = llm_res.text.strip()
        except Exception as e:
            logger.warning("Gemini query answering degraded to statutory fallback", error=str(e))

    # 4. Deterministic fallback if Gemini is offline or unavailable
    if not final_answer:
        top_c = retrieved_chunks[0]
        final_answer = (
            f"Under {top_c.code_standard} ({top_c.volume}, {top_c.part}), "
            f"per {top_c.clause_reference} (Source Page {top_c.page_number}):\n\n"
            f"{top_c.content}"
        )

    return ChatQueryResponse(
        answer=final_answer,
        citations=citations,
        llm_available=llm_available,
        model_used=model_used,
        retrieved_chunk_count=len(retrieved_chunks),
        retrieval_mode=retrieved_chunks[0].retrieval_mode,
    )
