"""
Document Type Detection Engine — Content-aware document classification.
Identifies whether an uploaded blueprint is DXF, Vector PDF, Raster/Scanned PDF, or Image.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional


class DocumentType(str, Enum):
    DXF = "dxf"
    VECTOR_PDF = "vector_pdf"
    RASTER_PDF = "raster_pdf"
    IMAGE = "image"
    UNKNOWN = "unknown"


@dataclass
class DocumentTypeInfo:
    """Detailed classification of an uploaded architectural document."""
    doc_type: DocumentType
    is_vector: bool
    mime_type: str
    description: str
    recommended_pipeline: str
    page_count: int = 1
    confidence: float = 1.0
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "doc_type": self.doc_type.value,
            "is_vector": self.is_vector,
            "mime_type": self.mime_type,
            "description": self.description,
            "recommended_pipeline": self.recommended_pipeline,
            "page_count": self.page_count,
            "confidence": self.confidence,
            "details": self.details,
        }


class DocumentDetector:
    """Fast, non-destructive analyzer of file header and stream signatures."""

    @classmethod
    def detect(cls, content: bytes, filename: str) -> DocumentTypeInfo:
        if not content:
            return DocumentTypeInfo(
                doc_type=DocumentType.UNKNOWN,
                is_vector=False,
                mime_type="application/octet-stream",
                description="Empty document",
                recommended_pipeline="none",
                confidence=0.0,
            )

        ext = Path(filename).suffix.lower()

        # ─── 1. Check DXF ─────────────────────────────────────
        if ext == ".dxf" or cls._is_dxf_content(content):
            version_str = cls._sniff_dxf_version(content)
            return DocumentTypeInfo(
                doc_type=DocumentType.DXF,
                is_vector=True,
                mime_type="application/dxf",
                description="AutoCAD Drawing Exchange Format (DXF Vector Blueprint)",
                recommended_pipeline="dxf_pipeline",
                page_count=1,
                confidence=1.0,
                details={"acad_version": version_str},
            )

        # ─── 2. Check PDF (Vector vs Raster) ──────────────────
        if content.startswith(b"%PDF-") or ext == ".pdf":
            return cls._classify_pdf(content)

        # ─── 3. Check Image Formats (PNG, JPEG, WebP, BMP) ────
        if (
            content.startswith(b"\x89PNG\r\n\x1a\n")
            or content.startswith(b"\xff\xd8\xff")
            or content.startswith(b"BM")
            or (content.startswith(b"RIFF") and b"WEBP" in content[:16])
            or ext in (".png", ".jpg", ".jpeg", ".bmp", ".webp")
        ):
            img_format = "PNG" if content.startswith(b"\x89PNG") else "JPEG" if content.startswith(b"\xff\xd8\xff") else ext.lstrip(".").upper()
            return DocumentTypeInfo(
                doc_type=DocumentType.IMAGE,
                is_vector=False,
                mime_type=f"image/{img_format.lower()}",
                description=f"Raster Architectural Plan Image ({img_format})",
                recommended_pipeline="classical_cv_pipeline",
                page_count=1,
                confidence=0.95,
                details={"format": img_format},
            )

        # ─── 4. Fallback: Unknown ─────────────────────────────
        return DocumentTypeInfo(
            doc_type=DocumentType.UNKNOWN,
            is_vector=False,
            mime_type="application/octet-stream",
            description=f"Unrecognized file format ({ext})",
            recommended_pipeline="unsupported",
            confidence=0.0,
        )

    @classmethod
    def _is_dxf_content(cls, content: bytes) -> bool:
        sample = content[:1024].decode("latin-1", errors="ignore")
        return "SECTION" in sample or "HEADER" in sample or "ENTITIES" in sample or sample.strip().startswith("0")

    @classmethod
    def _sniff_dxf_version(cls, content: bytes) -> str:
        sample = content[:2048].decode("latin-1", errors="ignore")
        match = re.search(r"\$ACADVER\s+1\s+(AC\d+)", sample)
        return match.group(1) if match else "Unknown"

    @classmethod
    def _classify_pdf(cls, content: bytes) -> DocumentTypeInfo:
        """
        Distinguishes Vector architectural PDF from scanned/raster PDF.
        Inspects PDF content stream tokens without full parsing.
        """
        # Count vector drawing operators in decompressed or raw stream chunks
        # Standard PDF vector operators: m (moveto), l (lineto), c (curveto), re (rectangle), S/s (stroke)
        vector_ops = len(re.findall(rb"\b(?:re|m|l|c|S|s|f|F)\b", content))
        text_ops = len(re.findall(rb"\b(?:Tj|TJ|BT|ET)\b", content))
        image_ops = len(re.findall(rb"/(?:Image|XObject|DCTDecode|JPXDecode|FlateDecode)\b", content))

        # Basic page count estimation from /Count in /Pages
        page_match = re.search(rb"/Type\s*/Pages\b.*?/Count\s+(\d+)", content, re.DOTALL)
        page_count = int(page_match.group(1)) if page_match else max(len(re.findall(rb"/Type\s*/Page\b", content)), 1)

        # Architectural vector PDFs typically contain vector strokes/lines without dominant bitmap XObjects
        has_images = image_ops > 0 and (rb"DCTDecode" in content or rb"JPXDecode" in content or rb"/Subtype\s*/Image" in content)
        if has_images and vector_ops < 15:
            is_vector = False
        else:
            is_vector = vector_ops >= 3 or text_ops >= 5

        if is_vector:
            return DocumentTypeInfo(
                doc_type=DocumentType.VECTOR_PDF,
                is_vector=True,
                mime_type="application/pdf",
                description="Vector Architectural PDF (contain CAD lines and text)",
                recommended_pipeline="vector_pdf_pipeline",
                page_count=page_count,
                confidence=0.92,
                details={
                    "vector_operator_count": vector_ops,
                    "text_operator_count": text_ops,
                    "image_operator_count": image_ops,
                },
            )
        else:
            return DocumentTypeInfo(
                doc_type=DocumentType.RASTER_PDF,
                is_vector=False,
                mime_type="application/pdf",
                description="Raster / Scanned PDF (bitmap image inside PDF; requires vision pipeline)",
                recommended_pipeline="classical_cv_pipeline",
                page_count=page_count,
                confidence=0.88,
                details={
                    "vector_operator_count": vector_ops,
                    "text_operator_count": text_ops,
                    "image_operator_count": image_ops,
                    "notice": "Insufficient vector primitives found. Scanned drawing detected.",
                },
            )
