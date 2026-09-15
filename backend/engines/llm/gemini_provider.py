"""
Gemini Provider — Production LLM implementation using google-genai SDK

Only this file imports the google-genai SDK.
All other code uses LLMProvider interface only.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Optional

from app.config import get_settings
from app.logging_config import get_logger
from engines.llm.base import LLMProvider, LLMResponse
from engines.llm.pool import ModelPool

logger = get_logger(__name__)


class GeminiProvider(LLMProvider):
    """
    LLM provider backed by the Google Gemini API.
    
    Uses google-genai SDK (official Python SDK).
    Manages a ModelPool for round-robin + fallback.
    All methods implement graceful degradation:
        - Returns LLMResponse.unavailable() on all failures
        - Never raises exceptions to the caller
    """

    def __init__(self, model_pool: ModelPool, timeout_seconds: int = 30) -> None:
        self._pool = model_pool
        self._timeout = timeout_seconds
        self._client = None  # Lazy initialization

    @classmethod
    def from_settings(cls) -> "GeminiProvider":
        """Create GeminiProvider from application settings."""
        settings = get_settings()
        if not settings.llm_available:
            raise ValueError("GEMINI_API_KEY not configured")
        pool = ModelPool.from_config(settings.gemini_model_pool)
        return cls(pool, timeout_seconds=settings.gemini_request_timeout_seconds)

    def _get_client(self, api_key: str):
        """
        Get a google-genai client for the given API key.
        Lazy import: google-genai SDK is only imported here.
        """
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            return client
        except ImportError:
            raise ImportError(
                "google-genai package not installed. "
                "Run: pip install google-genai"
            )

    async def _generate(
        self,
        prompt: str,
        system_instruction: str | None = None,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        """
        Core generation method with round-robin + fallback.
        
        Tries each available model in pool order.
        Returns LLMResponse.unavailable() if all models fail.
        """
        settings = get_settings()
        max_tokens = max_tokens or settings.gemini_max_output_tokens
        attempts = 0

        while attempts < ModelPool.MAX_ATTEMPTS_PER_REQUEST:
            slot = self._pool.get_next_available()
            if slot is None:
                logger.error("All Gemini models unavailable")
                return LLMResponse.unavailable("All models in cooldown")

            attempts += 1
            start_time = time.time()

            try:
                client = self._get_client(slot.api_key)

                # Build content
                from google.genai import types

                contents = prompt
                config = types.GenerateContentConfig(
                    max_output_tokens=max_tokens,
                    temperature=0.1,  # Low temperature for factual regulatory content
                )
                if system_instruction:
                    config.system_instruction = system_instruction

                # Run in thread pool (SDK is synchronous)
                loop = asyncio.get_event_loop()
                response = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: client.models.generate_content(
                            model=slot.model_id,
                            contents=contents,
                            config=config,
                        )
                    ),
                    timeout=self._timeout,
                )

                latency_ms = int((time.time() - start_time) * 1000)
                text = response.text

                self._pool.mark_success(slot.model_id)
                logger.info(
                    "Gemini request succeeded",
                    model=slot.model_id,
                    latency_ms=latency_ms,
                    tokens_out=len(text.split()) if text else 0,
                )

                return LLMResponse.success(
                    text=text,
                    model_used=slot.model_id,
                    latency_ms=latency_ms,
                )

            except asyncio.TimeoutError:
                logger.warning("Gemini request timed out", model=slot.model_id, timeout=self._timeout)
                self._pool.mark_failure(slot.model_id, "TimeoutError")
            except Exception as e:
                error_type = type(e).__name__
                logger.warning(
                    "Gemini request failed",
                    model=slot.model_id,
                    error_type=error_type,
                    error=str(e),
                )
                self._pool.mark_failure(slot.model_id, error_type)

        return LLMResponse.unavailable(f"All {attempts} attempts failed")

    async def explain_violation(
        self,
        rule_id: str,
        title: str,
        measured_value: float | None,
        required_value: float | None,
        unit: str | None,
        regulation_chunks: list[str],
        building_context: dict[str, Any],
    ) -> LLMResponse:
        """Generate plain-language explanation of a compliance violation."""
        chunks_text = "\n\n".join(regulation_chunks[:3]) if regulation_chunks else "No regulation text available."

        prompt = f"""You are a building code expert explaining a compliance issue to an architect.

COMPLIANCE VIOLATION:
Rule: {title} ({rule_id})
Measured: {measured_value} {unit or ''}
Required: {required_value} {unit or ''}

RELEVANT REGULATION TEXT:
{chunks_text}

BUILDING CONTEXT:
{building_context}

Provide a clear, professional explanation of:
1. What the regulation requires and why
2. What was found in this floor plan
3. The practical safety or habitability implications

Be specific and cite the regulation text above. Do not add requirements not mentioned in the regulation text."""

        system = (
            "You are a building code compliance expert. "
            "Explain violations clearly and professionally. "
            "Never invent regulation clauses. Only reference provided text."
        )

        return await self._generate(prompt, system_instruction=system, max_tokens=512)

    async def answer_regulatory_query(
        self,
        question: str,
        retrieved_chunks: list[dict],
        max_tokens: int = 1024,
    ) -> LLMResponse:
        """Answer a regulatory question from retrieved NBC chunks."""
        if not retrieved_chunks:
            return LLMResponse.unavailable("No relevant regulation text found")

        chunks_text = "\n\n---\n\n".join(
            f"[{c.get('section_number', 'Unknown')} | Page {c.get('page_number', '?')}]\n{c.get('raw_text', '')}"
            for c in retrieved_chunks[:8]
        )

        prompt = f"""You are an expert on the National Building Code of India 2016.

QUESTION: {question}

RETRIEVED REGULATION TEXT:
{chunks_text}

Answer the question based ONLY on the regulation text above.
- Cite specific section numbers and page numbers
- Be precise about measurements and requirements
- If the regulation text doesn't fully answer the question, say so
- Do not invent requirements

ANSWER:"""

        system = (
            "You are a National Building Code of India expert. "
            "Answer ONLY from provided regulation text. "
            "Cite sections. Never invent requirements."
        )

        return await self._generate(prompt, system_instruction=system, max_tokens=max_tokens)

    async def generate_recommendation(
        self,
        rule_id: str,
        violation_description: str,
        measured_value: float | None,
        required_value: float | None,
        unit: str | None,
    ) -> LLMResponse:
        """Generate a corrective recommendation for a violation."""
        prompt = f"""As a building code expert, provide a concise corrective recommendation.

VIOLATION: {violation_description}
Measured: {measured_value} {unit or ''}
Required minimum: {required_value} {unit or ''}
Rule: {rule_id}

Provide 2-3 specific, actionable recommendations to bring this into compliance.
Be practical. Keep it under 150 words."""

        return await self._generate(prompt, max_tokens=256)

    async def health_check(self) -> dict[str, bool]:
        """Check which configured models are reachable."""
        results = {}
        for slot in self._pool.slots:
            try:
                client = self._get_client(slot.api_key)
                loop = asyncio.get_event_loop()
                response = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: client.models.generate_content(
                            model=slot.model_id,
                            contents="Reply with: ok",
                        )
                    ),
                    timeout=10,
                )
                results[slot.model_id] = bool(response.text)
            except Exception as e:
                logger.warning("Model health check failed", model=slot.model_id, error=str(e))
                results[slot.model_id] = False
        return results
