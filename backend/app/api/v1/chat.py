"""RAG Chat API — regulatory Q&A with Gemini"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ChatQueryRequest(BaseModel):
    question: str
    document_ids: list[str] = []


@router.post("/query", summary="Ask a regulatory question")
async def chat_query(payload: ChatQueryRequest):
    """
    Answer regulatory questions using hybrid retrieval + Gemini.
    Available after NBC regulations are ingested (Phase 1).
    """
    return {
        "answer": "Regulatory Q&A is available after Phase 1 (NBC PDF ingestion).",
        "citations": [],
        "llm_available": False,
        "retrieved_chunk_count": 0,
    }
