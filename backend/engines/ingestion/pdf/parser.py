"""
Vector PDF Parser — Extract architectural lines, curves, rectangles, and text.

Uses pdfplumber to parse raw vector PDF streams into structured geometry.
Detects raster/scanned PDFs and cleanly distinguishes them from vector PDFs.
"""

from __future__ import annotations

import io
from dataclasses import dataclass, field
from typing import Any, Optional

import pdfplumber

from app.logging_config import get_logger
from engines.ingestion.base import IngestionError

logger = get_logger(__name__)


@dataclass
class PDFLine:
    x0: float
    y0: float
    x1: float
    y1: float
    width: float = 1.0


@dataclass
class PDFRect:
    x0: float
    y0: float
    x1: float
    y1: float
    width: float
    height: float


@dataclass
class PDFWord:
    text: str
    x0: float
    top: float
    x1: float
    bottom: float
    cx: float
    cy: float


@dataclass
class ParsedPDFPage:
    page_number: int
    width_pt: float
    height_pt: float
    lines: list[PDFLine] = field(default_factory=list)
    rects: list[PDFRect] = field(default_factory=list)
    curves: list[list[tuple[float, float]]] = field(default_factory=list)
    words: list[PDFWord] = field(default_factory=list)
    image_count: int = 0
    is_vector: bool = True


@dataclass
class ParsedPDFDocument:
    pages: list[ParsedPDFPage]
    total_pages: int
    is_vector_document: bool
    filename: str


class PDFParser:
    """Parses architectural vector PDFs and validates vector density."""

    # Minimum combined vector primitives required to consider a page a valid vector blueprint
    MIN_VECTOR_PRIMITIVES = 10

    @classmethod
    def parse(cls, content: bytes, filename: str) -> ParsedPDFDocument:
        if not content:
            raise IngestionError("PDF content is empty", "EMPTY_FILE")

        # Fast pre-check: detect scanned/raster PDF before heavy parsing
        from engines.ingestion.detector import DocumentDetector, DocumentType
        doc_info = DocumentDetector.detect(content, filename)
        if doc_info.doc_type == DocumentType.RASTER_PDF:
            logger.warning("Fast pre-check: raster/scanned PDF detected", filename=filename)
            raise IngestionError(
                "Scanned/raster PDF detected. This document contains bitmap images rather than vector CAD geometry. "
                "Please use the classical computer vision (image) pipeline or upload a vector DXF/PDF.",
                error_code="RASTER_PDF_REQUIRES_VISION",
            )

        try:
            pdf_stream = io.BytesIO(content)
            pdf = pdfplumber.open(pdf_stream)
        except IngestionError:
            raise
        except Exception as e:
            logger.error("Failed to open PDF", error=str(e), filename=filename)
            raise IngestionError(f"Corrupt or invalid PDF file: {e}", "CORRUPT_PDF") from e

        parsed_pages: list[ParsedPDFPage] = []
        total_vector_primitives = 0
        total_images = 0

        try:
            for page_idx, page in enumerate(pdf.pages):
                w_pt = float(page.width)
                h_pt = float(page.height)

                lines: list[PDFLine] = []
                for l in (page.lines or []):
                    # In pdfplumber, top is 0 at the top. Normalize so y0/y1 have consistent orientation
                    lines.append(
                        PDFLine(
                            x0=float(l.get("x0", 0)),
                            y0=float(h_pt - l.get("y0", 0)),
                            x1=float(l.get("x1", 0)),
                            y1=float(h_pt - l.get("y1", 0)),
                            width=float(l.get("width", 1.0)),
                        )
                    )

                rects: list[PDFRect] = []
                for r in (page.rects or []):
                    x0 = float(r.get("x0", 0))
                    x1 = float(r.get("x1", 0))
                    # Invert y coordinates relative to bottom-left origin
                    y0 = float(h_pt - r.get("bottom", 0))
                    y1 = float(h_pt - r.get("top", 0))
                    rw = float(r.get("width", abs(x1 - x0)))
                    rh = float(r.get("height", abs(y1 - y0)))
                    rects.append(PDFRect(x0=x0, y0=y0, x1=x1, y1=y1, width=rw, height=rh))

                curves: list[list[tuple[float, float]]] = []
                for c in (page.curves or []):
                    pts = c.get("pts", [])
                    if pts:
                        norm_pts = [(float(px), float(h_pt - py)) for px, py in pts]
                        curves.append(norm_pts)

                words: list[PDFWord] = []
                try:
                    raw_words = page.extract_words() or []
                    for wd in raw_words:
                        tx = wd.get("text", "").strip()
                        if tx:
                            x0 = float(wd.get("x0", 0))
                            x1 = float(wd.get("x1", 0))
                            top = float(h_pt - wd.get("top", 0))
                            bottom = float(h_pt - wd.get("bottom", 0))
                            cx = (x0 + x1) / 2.0
                            cy = (top + bottom) / 2.0
                            words.append(PDFWord(text=tx, x0=x0, top=top, x1=x1, bottom=bottom, cx=cx, cy=cy))
                except Exception as ex:
                    logger.warning("Could not extract words from PDF page", page=page_idx, error=str(ex))

                img_count = len(page.images or [])
                total_images += img_count

                page_vector_primitives = len(lines) + len(rects) + len(curves)
                total_vector_primitives += page_vector_primitives
                is_vector_page = page_vector_primitives >= cls.MIN_VECTOR_PRIMITIVES

                parsed_pages.append(
                    ParsedPDFPage(
                        page_number=page_idx + 1,
                        width_pt=w_pt,
                        height_pt=h_pt,
                        lines=lines,
                        rects=rects,
                        curves=curves,
                        words=words,
                        image_count=img_count,
                        is_vector=is_vector_page,
                    )
                )

        finally:
            pdf.close()

        # ─── Scanned / Raster PDF Validation Check ───────────────
        is_vector_doc = total_vector_primitives >= cls.MIN_VECTOR_PRIMITIVES

        if not is_vector_doc and total_images > 0:
            logger.warning(
                "Raster/scanned PDF detected",
                filename=filename,
                vector_primitives=total_vector_primitives,
                images=total_images,
            )
            raise IngestionError(
                "Scanned/raster PDF detected. This document contains bitmap images rather than vector CAD geometry. "
                "Please use the classical computer vision (image) pipeline or upload a vector DXF/PDF.",
                error_code="RASTER_PDF_REQUIRES_VISION",
            )

        if total_vector_primitives == 0:
            raise IngestionError(
                "No geometric elements found in PDF. File appears empty or non-architectural.",
                error_code="NO_GEOMETRY_FOUND",
            )

        return ParsedPDFDocument(
            pages=parsed_pages,
            total_pages=len(parsed_pages),
            is_vector_document=is_vector_doc,
            filename=filename,
        )
