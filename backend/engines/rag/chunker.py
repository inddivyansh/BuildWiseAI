"""
Regulatory Clause Chunker — Preserves clause hierarchy and reference identifiers.
"""

from __future__ import annotations

import re
import uuid

from engines.rag.contracts import DocumentChunk, RegulatoryDocument
from engines.rag.interfaces import DocumentChunker

# Pattern matching NBC clauses: e.g. "4.4.2", "Clause 12.2.1", "Table 5"
CLAUSE_PATTERN = re.compile(
    r"(?:(?:Clause|Section|Part)\s+)?(\d+\.\d+(?:\.\d+)?)|(Table\s+\d+)",
    re.IGNORECASE,
)


class NBCRegulatoryChunker(DocumentChunker):
    """Chunks National Building Code documents respecting clause boundaries."""

    def __init__(self, target_chunk_size: int = 500, overlap: int = 80) -> None:
        self.target_chunk_size = target_chunk_size
        self.overlap = overlap

    def chunk(self, document: RegulatoryDocument, pages: list[str]) -> list[DocumentChunk]:
        chunks: list[DocumentChunk] = []
        chunk_idx = 0

        for page_num, page_text in enumerate(pages, start=1):
            paragraphs = [p.strip() for p in page_text.split("\n\n") if p.strip()]

            current_clause: str | None = None
            current_buffer: list[str] = []
            current_length = 0

            for para in paragraphs:
                # Check for clause header
                match = CLAUSE_PATTERN.search(para[:60])
                if match:
                    clause_ref = match.group(1) or match.group(2)
                    if current_buffer:
                        # Flush current buffer
                        text = " ".join(current_buffer)
                        chunks.append(
                            DocumentChunk(
                                id=uuid.uuid4(),
                                document_id=document.id,
                                clause_reference=current_clause,
                                content=text,
                                page_number=page_num,
                                chunk_index=chunk_idx,
                                token_count=len(text.split()),
                                metadata={"standard": document.code_standard},
                            )
                        )
                        chunk_idx += 1
                        current_buffer = []
                        current_length = 0
                    current_clause = clause_ref

                current_buffer.append(para)
                current_length += len(para)

                if current_length >= self.target_chunk_size:
                    text = " ".join(current_buffer)
                    chunks.append(
                        DocumentChunk(
                            id=uuid.uuid4(),
                            document_id=document.id,
                            clause_reference=current_clause,
                            content=text,
                            page_number=page_num,
                            chunk_index=chunk_idx,
                            token_count=len(text.split()),
                            metadata={"standard": document.code_standard},
                        )
                    )
                    chunk_idx += 1
                    current_buffer = []
                    current_length = 0

            if current_buffer:
                text = " ".join(current_buffer)
                chunks.append(
                    DocumentChunk(
                        id=uuid.uuid4(),
                        document_id=document.id,
                        clause_reference=current_clause,
                        content=text,
                        page_number=page_num,
                        chunk_index=chunk_idx,
                        token_count=len(text.split()),
                        metadata={"standard": document.code_standard},
                    )
                )
                chunk_idx += 1

        return chunks
