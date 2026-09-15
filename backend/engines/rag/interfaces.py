"""
RAG Engine — Abstract interfaces for document extraction, chunking, embeddings, and vector store.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Optional

from engines.rag.contracts import (
    DocumentChunk,
    GroundedAnswer,
    RegulatoryDocument,
    RetrievalResult,
)


class DocumentExtractor(ABC):
    """Extracts raw text and structural metadata from regulatory PDFs."""

    @abstractmethod
    def extract_document(self, content: bytes, filename: str) -> tuple[RegulatoryDocument, list[str]]:
        """Returns (RegulatoryDocument, list_of_page_texts)."""
        ...


class DocumentChunker(ABC):
    """Segments regulatory text into semantic, clause-preserving chunks."""

    @abstractmethod
    def chunk(self, document: RegulatoryDocument, pages: list[str]) -> list[DocumentChunk]:
        ...


class EmbeddingProvider(ABC):
    """Generates dense semantic vector embeddings for text chunks."""

    @abstractmethod
    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        ...

    @abstractmethod
    async def embed_query(self, query: str) -> list[float]:
        ...


class VectorStore(ABC):
    """Vector database storage (targeting PostgreSQL + pgvector)."""

    @abstractmethod
    async def store_chunks(self, chunks: list[DocumentChunk], embeddings: list[list[float]]) -> None:
        ...

    @abstractmethod
    async def search(
        self,
        query_embedding: list[float],
        top_k: int = 5,
        filters: Optional[dict[str, Any]] = None,
    ) -> list[RetrievalResult]:
        ...


class RAGPipeline(ABC):
    """End-to-end grounded query pipeline."""

    @abstractmethod
    async def answer(self, query: str, top_k: int = 5) -> GroundedAnswer:
        ...
