"""
RAG Engine Package — Interfaces and clause chunkers for regulatory documents.
"""

from engines.rag.chunker import NBCRegulatoryChunker
from engines.rag.contracts import (
    DocumentChunk,
    GroundedAnswer,
    RegulatoryDocument,
    RetrievalResult,
)
from engines.rag.interfaces import (
    DocumentChunker,
    DocumentExtractor,
    EmbeddingProvider,
    RAGPipeline,
    VectorStore,
)

__all__ = [
    "RegulatoryDocument",
    "DocumentChunk",
    "RetrievalResult",
    "GroundedAnswer",
    "DocumentExtractor",
    "DocumentChunker",
    "EmbeddingProvider",
    "VectorStore",
    "RAGPipeline",
    "NBCRegulatoryChunker",
]
