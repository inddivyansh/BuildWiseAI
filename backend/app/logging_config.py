"""
BuildWise AI — Structured Logging Configuration

Uses structlog for structured JSON logging in production
and colorized pretty-print in development.
"""

import logging
import sys
from typing import Any

import structlog
from structlog.types import EventDict, Processor

from app.config import get_settings


def add_app_info(logger: Any, method: str, event_dict: EventDict) -> EventDict:
    """Add application metadata to every log entry."""
    settings = get_settings()
    event_dict["app"] = settings.app_name
    event_dict["env"] = settings.app_env
    return event_dict


def setup_logging() -> None:
    """
    Configure structlog for the application.
    
    - Development: colorized, human-readable output
    - Production: JSON output for log aggregation
    """
    settings = get_settings()
    is_dev = settings.app_env == "development"
    is_test = settings.app_env == "test"

    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        add_app_info,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
    ]

    if is_dev or is_test:
        # Human-readable, colorized output for development
        processors: list[Processor] = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=not is_test),
        ]
    else:
        # JSON output for production log aggregation
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=not is_dev,
    )

    # Also configure stdlib logging to route through structlog
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if settings.debug else logging.INFO,
    )


def get_logger(name: str | None = None) -> structlog.BoundLogger:
    """Get a bound logger with the given name."""
    return structlog.get_logger(name)
