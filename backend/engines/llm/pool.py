"""
Gemini Model Pool — Round-Robin Selection with Exponential Backoff

Manages a pool of configured Gemini models.
Rotates through them on each request.
Applies per-model cooldown on failures (not infinite retry).
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Optional

from app.logging_config import get_logger

logger = get_logger(__name__)

# Cooldown durations in seconds for each consecutive failure
COOLDOWN_SCHEDULE = [60, 300, 900]  # 1min, 5min, 15min


@dataclass
class ModelSlot:
    """One slot in the model pool."""
    model_id: str
    api_key: str
    failure_count: int = 0
    last_failure_at: Optional[float] = None   # Unix timestamp
    cooldown_until: Optional[float] = None    # Unix timestamp

    def is_available(self) -> bool:
        """Return True if the model is not in cooldown."""
        if self.cooldown_until is None:
            return True
        return time.time() >= self.cooldown_until

    def cooldown_remaining_seconds(self) -> float:
        """Seconds remaining in cooldown (0 if not in cooldown)."""
        if not self.cooldown_until:
            return 0.0
        remaining = self.cooldown_until - time.time()
        return max(0.0, remaining)

    def mark_failure(self, error_type: str = "") -> None:
        """Record a failure and set appropriate cooldown."""
        self.failure_count += 1
        self.last_failure_at = time.time()
        # Clamp to max cooldown entry
        cooldown_idx = min(self.failure_count - 1, len(COOLDOWN_SCHEDULE) - 1)
        cooldown_seconds = COOLDOWN_SCHEDULE[cooldown_idx]
        self.cooldown_until = time.time() + cooldown_seconds
        logger.warning(
            "Model marked as failed",
            model_id=self.model_id,
            failure_count=self.failure_count,
            cooldown_seconds=cooldown_seconds,
            error_type=error_type,
        )

    def mark_success(self) -> None:
        """Reset failure tracking after a successful request."""
        if self.failure_count > 0:
            logger.info("Model recovered", model_id=self.model_id, prev_failures=self.failure_count)
        self.failure_count = 0
        self.last_failure_at = None
        self.cooldown_until = None


class ModelPool:
    """
    Round-robin model pool with per-model exponential backoff.
    
    Behavior:
    1. Start at current_index
    2. Find next available (not in cooldown) model
    3. Rotate current_index after each use
    4. If all models in cooldown: return None (graceful failure)
    5. Maximum MAX_ATTEMPTS_PER_REQUEST total attempts across all models
    
    Thread-safe: uses a simple counter; no mutex needed for Python asyncio.
    """

    MAX_ATTEMPTS_PER_REQUEST = 3

    def __init__(self, slots: list[ModelSlot]) -> None:
        if not slots:
            raise ValueError("ModelPool requires at least one model slot")
        self.slots = slots
        self._current_index = 0

    @classmethod
    def from_config(cls, model_pool_config: list[dict]) -> "ModelPool":
        """
        Create a ModelPool from the Settings.gemini_model_pool property.
        
        model_pool_config: [{"model_id": "...", "api_key": "..."}, ...]
        """
        slots = [
            ModelSlot(model_id=cfg["model_id"], api_key=cfg["api_key"])
            for cfg in model_pool_config
            if cfg.get("model_id") and cfg.get("api_key")
        ]
        if not slots:
            raise ValueError("No valid Gemini model slots configured")
        logger.info(
            "ModelPool initialized",
            model_ids=[s.model_id for s in slots],
            slot_count=len(slots),
        )
        return cls(slots)

    def get_next_available(self) -> Optional[ModelSlot]:
        """
        Return the next available (not in cooldown) model slot.
        Rotates current_index to distribute load.
        Returns None if all models are in cooldown.
        """
        n = len(self.slots)
        start = self._current_index

        for i in range(n):
            idx = (start + i) % n
            slot = self.slots[idx]
            if slot.is_available():
                self._current_index = (idx + 1) % n  # advance for next call
                return slot

        logger.error(
            "All models in cooldown",
            cooldowns={s.model_id: f"{s.cooldown_remaining_seconds():.0f}s" for s in self.slots},
        )
        return None

    def mark_failure(self, model_id: str, error_type: str = "") -> None:
        """Mark a model slot as failed."""
        for slot in self.slots:
            if slot.model_id == model_id:
                slot.mark_failure(error_type)
                return

    def mark_success(self, model_id: str) -> None:
        """Mark a model slot as successful."""
        for slot in self.slots:
            if slot.model_id == model_id:
                slot.mark_success()
                return

    def status(self) -> list[dict]:
        """Return current status of all model slots."""
        return [
            {
                "model_id": s.model_id,
                "available": s.is_available(),
                "failure_count": s.failure_count,
                "cooldown_remaining_s": round(s.cooldown_remaining_seconds(), 1),
            }
            for s in self.slots
        ]
