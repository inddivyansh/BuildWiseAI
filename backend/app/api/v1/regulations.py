"""Regulations API — RAG corpus management"""

from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="List regulation documents")
async def list_regulations():
    """List all ingested regulation documents in the RAG corpus."""
    return {"message": "Regulation corpus endpoint — available in Phase 1"}
