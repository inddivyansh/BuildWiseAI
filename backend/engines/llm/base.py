"""
LLM Provider — Abstract Base + Response Model

KEY ARCHITECTURAL RULE:
No code outside of engines/llm/ should import google.generativeai
or the google-genai SDK. All LLM access goes through LLMProvider.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Optional


@dataclass
class LLMResponse:
    """
    Standardized response from any LLM provider.
    
    text=None and is_available=False indicates the LLM was not reachable.
    The calling code should handle this gracefully — compliance always
    continues regardless of LLM availability.
    """
    text: Optional[str]          # Generated text, or None if unavailable
    model_used: Optional[str]    # Model that generated the response
    prompt_tokens: Optional[int]
    output_tokens: Optional[int]
    latency_ms: Optional[int]
    error: Optional[str]         # Error message if failed
    is_available: bool           # False if all models failed

    @classmethod
    def unavailable(cls, reason: str = "LLM unavailable") -> "LLMResponse":
        """Factory for a graceful failure response."""
        return cls(
            text=None,
            model_used=None,
            prompt_tokens=None,
            output_tokens=None,
            latency_ms=None,
            error=reason,
            is_available=False,
        )

    @classmethod
    def success(
        cls,
        text: str,
        model_used: str,
        prompt_tokens: int | None = None,
        output_tokens: int | None = None,
        latency_ms: int | None = None,
    ) -> "LLMResponse":
        """Factory for a successful response."""
        return cls(
            text=text,
            model_used=model_used,
            prompt_tokens=prompt_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            error=None,
            is_available=True,
        )


class LLMProvider(ABC):
    """
    Abstract LLM provider interface.
    
    All application code calls only these methods.
    The underlying model/API is completely encapsulated.
    
    CRITICAL: These methods must NEVER evaluate compliance.
    They receive already-computed results and generate explanations.
    """

    @abstractmethod
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
        """
        Generate a plain-language explanation of a compliance violation.
        
        NEVER changes the compliance result.
        NEVER evaluates whether the building passes or fails.
        ONLY explains why it failed, based on the deterministic result.
        """
        ...

    @abstractmethod
    async def answer_regulatory_query(
        self,
        question: str,
        retrieved_chunks: list[dict],
        max_tokens: int = 1024,
    ) -> LLMResponse:
        """
        Answer a regulatory question grounded in retrieved NBC chunks.
        
        Uses ONLY the provided chunks as context.
        Cites section numbers from chunks.
        Does NOT invent regulations.
        """
        ...

    @abstractmethod
    async def generate_recommendation(
        self,
        rule_id: str,
        violation_description: str,
        measured_value: float | None,
        required_value: float | None,
        unit: str | None,
    ) -> LLMResponse:
        """
        Generate a corrective recommendation for a violation.
        
        Based only on the violation data — does NOT re-evaluate compliance.
        """
        ...

    @abstractmethod
    async def health_check(self) -> dict[str, bool]:
        """
        Check which configured models are reachable.
        Returns {model_id: is_available} for each model in the pool.
        """
        ...
