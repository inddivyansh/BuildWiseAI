"""
Authoritative NBC 2016 PDF Ingestion Engine.

Ingests the 5 official National Building Code of India 2016 PDFs:
- Volume 1: 3 PDFs
- Volume 2: 2 PDFs

Preserves:
- Document filename and SHA-256 integrity hash
- Volume and Part numbers
- Section headings and clause identifiers (e.g. "4.4.2.2", "Table 5", "Clause 12.2.2")
- Exact source PDF page numbers
- Verbatim statutory text (cleanly decoded from BIS font glyphs)
"""

from __future__ import annotations

import hashlib
import re
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Generator, Optional

import pypdf

from app.logging_config import get_logger

logger = get_logger(__name__)

# Pattern matching BIS font glyph hex encodings e.g. /G50/G41/G52/G54 -> PART
GLYPH_PATTERN = re.compile(r"/G([0-9a-fA-F]{2})")

# Pattern matching NBC clause numbers e.g. "4.4.2.4.1", "12.2.2", "Table 5"
CLAUSE_PATTERN = re.compile(
    r"(?:(?:Clause|Section|Part)\s+)?(\b\d+\.\d+(?:\.\d+)*(?:\([a-zA-Z0-9]+\))?)|(Table\s+\d+)",
    re.IGNORECASE,
)


def decode_bis_glyphs(text: str) -> str:
    """Decodes BIS font glyph hex tokens into standard ASCII / UTF-8 text."""
    if "/G" not in text:
        return text

    def repl(m: re.Match) -> str:
        try:
            return chr(int(m.group(1), 16))
        except Exception:
            return m.group(0)

    return GLYPH_PATTERN.sub(repl, text)


@dataclass
class ExtractedRegulatoryPage:
    page_number: int
    raw_text: str
    cleaned_text: str
    volume: str
    part: Optional[str] = None
    section: Optional[str] = None


@dataclass
class RegulatoryChunkRecord:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    document_filename: str = ""
    document_sha256: str = ""
    volume: str = ""
    part: str = ""
    clause_reference: Optional[str] = None
    heading: Optional[str] = None
    page_number: int = 1
    chunk_index: int = 0
    text: str = ""
    token_count: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)


class NBCDocumentIngestion:
    """Ingestion adapter for the five authoritative NBC 2016 source PDFs."""

    # Volume and Part detection heuristics based on source analysis
    FILE_VOLUME_MAP = {
        "202503261284340577.pdf": ("Volume 1", "Parts 0, 1, 2, 3, 4, 5"),
        "202503261347679918.pdf": ("Volume 1", "Part 6 Structural Design (Sections 1-4)"),
        "202503261462788962.pdf": ("Volume 1", "Part 6 Structural Design (Sections 5-7)"),
        "20250306344484706.pdf": ("Volume 2", "Parts 7, 8 (Sections 1-4)"),
        "2025030624291923.pdf": ("Volume 2", "Parts 8 (Sections 5-6), 9, 10, 11, 12"),
    }

    @classmethod
    def compute_sha256(cls, filepath: Path) -> str:
        hasher = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()

    @classmethod
    def extract_page_text(cls, reader: pypdf.PdfReader, page_idx: int) -> str:
        try:
            page = reader.pages[page_idx]
            raw = page.extract_text() or ""
            return decode_bis_glyphs(raw)
        except Exception as e:
            logger.warning("Error extracting text from page", page=page_idx, error=str(e))
            return ""

    @classmethod
    def ingest_pdf_file(
        cls,
        pdf_path: Path,
        max_pages: Optional[int] = None,
    ) -> tuple[dict[str, Any], list[RegulatoryChunkRecord]]:
        """
        Ingests a single NBC PDF file and decomposes it into clause-indexed chunks.
        """
        if not pdf_path.exists():
            raise FileNotFoundError(f"NBC PDF file not found: {pdf_path}")

        filename = pdf_path.name
        sha256_hash = cls.compute_sha256(pdf_path)
        vol_info = cls.FILE_VOLUME_MAP.get(filename, ("Volume Unknown", "Parts General"))

        reader = pypdf.PdfReader(str(pdf_path))
        total_pages = len(reader.pages)
        process_count = min(total_pages, max_pages) if max_pages else total_pages

        logger.info(
            "Ingesting NBC 2016 PDF",
            filename=filename,
            total_pages=total_pages,
            volume=vol_info[0],
            sha256=sha256_hash[:16],
        )

        chunks: list[RegulatoryChunkRecord] = []
        chunk_idx = 0

        current_part = vol_info[1]
        current_section: str | None = None

        for page_num in range(1, process_count + 1):
            text = cls.extract_page_text(reader, page_num - 1)
            if not text.strip():
                continue

            # Check header for Part changes
            for line in text.splitlines()[:5]:
                l_str = line.strip().upper()
                if l_str.startswith("PART ") and len(l_str) < 80:
                    current_part = line.strip()
                    break

            # Decompose page text into coherent paragraphs and clauses
            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            if not paragraphs:
                paragraphs = [text.strip()]

            buffer_text: list[str] = []
            buffer_clause: str | None = None
            buffer_heading: str | None = None

            for para in paragraphs:
                # Detect clause or table reference
                m = CLAUSE_PATTERN.search(para[:80])
                if m:
                    clause_ref = m.group(1) or m.group(2)
                    first_line = para.splitlines()[0][:100]

                    if buffer_text:
                        full_content = " ".join(buffer_text)
                        chunks.append(
                            RegulatoryChunkRecord(
                                id=uuid.uuid4(),
                                document_filename=filename,
                                document_sha256=sha256_hash,
                                volume=vol_info[0],
                                part=current_part,
                                clause_reference=buffer_clause,
                                heading=buffer_heading,
                                page_number=page_num,
                                chunk_index=chunk_idx,
                                text=full_content,
                                token_count=len(full_content.split()),
                                metadata={
                                    "source": "NBC_2016",
                                    "filename": filename,
                                    "page": page_num,
                                },
                            )
                        )
                        chunk_idx += 1
                        buffer_text = []

                    buffer_clause = clause_ref
                    buffer_heading = first_line

                buffer_text.append(para)

                if sum(len(p) for p in buffer_text) >= 700:
                    full_content = " ".join(buffer_text)
                    chunks.append(
                        RegulatoryChunkRecord(
                            id=uuid.uuid4(),
                            document_filename=filename,
                            document_sha256=sha256_hash,
                            volume=vol_info[0],
                            part=current_part,
                            clause_reference=buffer_clause,
                            heading=buffer_heading,
                            page_number=page_num,
                            chunk_index=chunk_idx,
                            text=full_content,
                            token_count=len(full_content.split()),
                            metadata={
                                "source": "NBC_2016",
                                "filename": filename,
                                "page": page_num,
                            },
                        )
                    )
                    chunk_idx += 1
                    buffer_text = []

            if buffer_text:
                full_content = " ".join(buffer_text)
                chunks.append(
                    RegulatoryChunkRecord(
                        id=uuid.uuid4(),
                        document_filename=filename,
                        document_sha256=sha256_hash,
                        volume=vol_info[0],
                        part=current_part,
                        clause_reference=buffer_clause,
                        heading=buffer_heading,
                        page_number=page_num,
                        chunk_index=chunk_idx,
                        text=full_content,
                        token_count=len(full_content.split()),
                        metadata={
                            "source": "NBC_2016",
                            "filename": filename,
                            "page": page_num,
                        },
                    )
                )
                chunk_idx += 1

        doc_metadata = {
            "filename": filename,
            "sha256": sha256_hash,
            "volume": vol_info[0],
            "parts": vol_info[1],
            "total_pages": total_pages,
            "processed_pages": process_count,
            "chunks_count": len(chunks),
        }

        return doc_metadata, chunks
