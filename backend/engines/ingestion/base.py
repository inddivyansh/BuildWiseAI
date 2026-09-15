"""
Ingestion base — abstract adapter interface.
Every file format adapter (DXF, PDF, Image) implements this.
"""

from abc import ABC, abstractmethod
from pathlib import Path

from engines.geometry.models import CanonicalFloorPlan


class IngestionAdapter(ABC):
    """
    Abstract ingestion adapter.
    Input: raw bytes of the uploaded file.
    Output: CanonicalFloorPlan.
    """

    @abstractmethod
    def can_handle(self, filename: str, content: bytes) -> bool:
        """Return True if this adapter can parse the given file."""
        ...

    @abstractmethod
    def parse(self, content: bytes, filename: str) -> CanonicalFloorPlan:
        """
        Parse file content into a CanonicalFloorPlan.
        Must raise IngestionError on unrecoverable failures.
        Should attach warnings to CGMMetadata.extraction_warnings for soft failures.
        """
        ...


class IngestionError(Exception):
    """Raised when file ingestion fails unrecoverably."""
    def __init__(self, message: str, error_code: str = "EXTRACTION_FAILED"):
        super().__init__(message)
        self.error_code = error_code
