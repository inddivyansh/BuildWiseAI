"""
Mock LLM Provider — for testing without API calls

Use this in:
- Unit tests (always available, deterministic)
- CI/CD (no API key needed)
- Development without Gemini API key

Usage:
    provider = MockProvider()
    response = await provider.explain_violation(...)
    assert response.is_available  # Always True for MockProvider
"""

from __future__ import annotations

from typing import Any

from engines.llm.base import LLMProvider, LLMResponse


class MockProvider(LLMProvider):
    """
    Deterministic mock LLM provider for testing.
    Returns predictable responses without API calls.
    """

    def __init__(self, should_fail: bool = False, fail_reason: str = "Mock failure") -> None:
        """
        Args:
            should_fail: If True, all methods return unavailable responses.
            fail_reason: Reason string for failure responses.
        """
        self.should_fail = should_fail
        self.fail_reason = fail_reason
        self.call_count = 0

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
        self.call_count += 1
        if self.should_fail:
            return LLMResponse.unavailable(self.fail_reason)
        return LLMResponse.success(
            text=(
                f"[MOCK EXPLANATION] The {title} rule ({rule_id}) requires a minimum "
                f"of {required_value} {unit or ''}. The measured value of "
                f"{measured_value} {unit or ''} does not meet this requirement."
            ),
            model_used="mock-model",
            latency_ms=10,
        )

    async def answer_regulatory_query(
        self,
        question: str,
        retrieved_chunks: list[dict],
        max_tokens: int = 1024,
    ) -> LLMResponse:
        self.call_count += 1
        if self.should_fail:
            return LLMResponse.unavailable(self.fail_reason)
        chunk_count = len(retrieved_chunks)
        return LLMResponse.success(
            text=f"[MOCK ANSWER] Based on {chunk_count} retrieved regulation chunks, "
                 f"the answer to '{question}' is: This is a mock response for testing.",
            model_used="mock-model",
            latency_ms=5,
        )

    async def generate_recommendation(
        self,
        rule_id: str,
        violation_description: str,
        measured_value: float | None,
        required_value: float | None,
        unit: str | None,
    ) -> LLMResponse:
        self.call_count += 1
        if self.should_fail:
            return LLMResponse.unavailable(self.fail_reason)
        return LLMResponse.success(
            text=f"[MOCK RECOMMENDATION] To resolve this {rule_id} violation: "
                 f"Increase the measured value from {measured_value} to "
                 f"at least {required_value} {unit or ''}.",
            model_used="mock-model",
            latency_ms=5,
        )

    async def health_check(self) -> dict[str, bool]:
        return {"mock-model": not self.should_fail}
