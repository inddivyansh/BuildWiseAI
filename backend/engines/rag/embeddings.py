"""
Embedding Provider Interface and Implementations.

Supports:
- Gemini text-embedding-004 (via official google-genai SDK)
- Local sentence-transformers (all-MiniLM-L6-v2) if installed
- Explicit failure reporting if no embedding provider is available (NEVER silently produces fake vectors)
"""

from __future__ import annotations

import math
from abc import ABC, abstractmethod
from typing import Optional

import numpy as np

from app.logging_config import get_logger

logger = get_logger(__name__)


class EmbeddingProviderUnavailableError(RuntimeError):
    """Raised when an embedding provider is not available or unconfigured."""
    pass


class BaseEmbeddingProvider(ABC):
    """Abstract interface for text embedding models."""

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @property
    @abstractmethod
    def dimension(self) -> int:
        ...

    @property
    @abstractmethod
    def is_available(self) -> bool:
        ...

    @abstractmethod
    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        ...

    @abstractmethod
    async def embed_query(self, query: str) -> list[float]:
        ...


class GeminiEmbeddingProvider(BaseEmbeddingProvider):
    """Embeddings powered by Google Gemini API (text-embedding-004)."""

    def __init__(self, api_key: Optional[str] = None, model_name: str = "text-embedding-004") -> None:
        self._api_key = api_key
        self._model_name = model_name
        self._dimension = 768

    @property
    def name(self) -> str:
        return f"gemini:{self._model_name}"

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def is_available(self) -> bool:
        return bool(self._api_key)

    def _get_client(self):
        if not self.is_available:
            raise EmbeddingProviderUnavailableError("Gemini API key is not configured for embeddings.")
        try:
            from google import genai
            return genai.Client(api_key=self._api_key)
        except ImportError:
            raise EmbeddingProviderUnavailableError("google-genai package is not installed.")

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        client = self._get_client()
        embeddings: list[list[float]] = []
        for text in texts:
            try:
                response = client.models.embed_content(
                    model=self._model_name,
                    contents=text,
                )
                if hasattr(response, "embedding") and hasattr(response.embedding, "values"):
                    embeddings.append(list(response.embedding.values))
                elif hasattr(response, "embeddings") and len(response.embeddings) > 0:
                    embeddings.append(list(response.embeddings[0].values))
                else:
                    raise ValueError("Unexpected embedding response structure from Gemini API.")
            except Exception as e:
                logger.error("Gemini embedding generation failed", error=str(e))
                raise EmbeddingProviderUnavailableError(f"Gemini embedding failed: {str(e)}") from e
        return embeddings

    async def embed_query(self, query: str) -> list[float]:
        res = await self.embed_texts([query])
        return res[0]


class LocalSentenceTransformerProvider(BaseEmbeddingProvider):
    """Local embedding provider using sentence-transformers if available."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2") -> None:
        self._model_name = model_name
        self._model = None
        self._is_available = False
        self._dimension = 384
        self._try_load()

    def _try_load(self) -> None:
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self._model_name)
            self._is_available = True
        except Exception:
            self._is_available = False

    @property
    def name(self) -> str:
        return f"sentence-transformer:{self._model_name}"

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def is_available(self) -> bool:
        return self._is_available

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not self.is_available or self._model is None:
            raise EmbeddingProviderUnavailableError(
                "Local sentence-transformers model is not installed or available."
            )
        vectors = self._model.encode(texts, convert_to_numpy=True)
        return [v.tolist() for v in vectors]

    async def embed_query(self, query: str) -> list[float]:
        res = await self.embed_texts([query])
        return res[0]


def compute_cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Computes cosine similarity between two float vectors using numpy."""
    a = np.asarray(vec_a, dtype=np.float32)
    b = np.asarray(vec_b, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))
