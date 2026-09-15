"""Documents API — file upload and document management"""

import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db_session
from app.logging_config import get_logger
from app.models.document import UploadedDocument
from app.models.project import Project
from app.schemas.document import DocumentResponse, DocumentListResponse
from app.storage.local import LocalStorage

router = APIRouter()
logger = get_logger(__name__)

DbSession = Annotated[AsyncSession, Depends(get_db_session)]

# Allowed extensions and their MIME type prefixes
ALLOWED_EXTENSIONS = {".dxf", ".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES = {
    "image/png", "image/jpeg", "application/pdf",
    "application/dxf", "application/octet-stream",
    "image/vnd.dxf",
}

# Magic bytes for file type validation
MAGIC_BYTES: dict[str, bytes] = {
    ".pdf": b"%PDF",
    ".png": b"\x89PNG",
    ".jpg": b"\xff\xd8\xff",
    ".jpeg": b"\xff\xd8\xff",
}


def validate_file_magic(content: bytes, extension: str) -> bool:
    """Validate file magic bytes match the declared extension."""
    if extension not in MAGIC_BYTES:
        # DXF is ASCII, no reliable magic bytes — skip magic check
        return True
    magic = MAGIC_BYTES[extension]
    return content[:len(magic)] == magic


def safe_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and unsafe characters."""
    # Keep only alphanumeric, dots, hyphens, underscores
    name = Path(filename).name
    safe = "".join(c if c.isalnum() or c in "._-" else "_" for c in name)
    # Prevent hidden files
    if safe.startswith("."):
        safe = "_" + safe
    return safe[:255]  # max filename length


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload architectural file",
)
async def upload_document(
    db: DbSession,
    project_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
):
    """
    Upload an architectural floor plan file.
    
    Supported formats: DXF, PDF, PNG, JPG/JPEG
    Maximum size: configurable via MAX_UPLOAD_SIZE_MB env var
    
    Performs:
    - Extension validation
    - File size check
    - Magic byte validation (for PDF, PNG, JPEG)
    - Safe filename sanitization
    - Storage to persistent volume
    - Database record creation
    """
    settings = get_settings()

    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Extension check
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read content
    content = await file.read()

    # Size check
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_upload_size_mb}MB",
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # Magic byte check
    if not validate_file_magic(content, ext):
        raise HTTPException(
            status_code=400,
            detail=f"File content does not match the declared format '{ext}'",
        )

    # Generate safe storage key
    doc_id = uuid.uuid4()
    sanitized_name = safe_filename(file.filename)
    storage_key = f"uploads/{project_id}/{doc_id}/{sanitized_name}"

    # Save to storage
    storage = LocalStorage(settings.storage_path)
    await storage.save(storage_key, content)

    # Compute checksum
    import hashlib
    checksum = hashlib.sha256(content).hexdigest()

    # Create DB record
    document = UploadedDocument(
        id=doc_id,
        project_id=project_id,
        original_name=file.filename,
        storage_key=storage_key,
        file_format=ext.lstrip("."),
        mime_type=file.content_type,
        file_size_bytes=len(content),
        checksum_sha256=checksum,
    )
    db.add(document)
    await db.flush()
    await db.refresh(document)

    logger.info(
        "Document uploaded",
        document_id=str(doc_id),
        project_id=str(project_id),
        filename=file.filename,
        size_bytes=len(content),
        format=ext,
    )

    return document


@router.get("/{document_id}", response_model=DocumentResponse, summary="Get document metadata")
async def get_document(document_id: uuid.UUID, db: DbSession):
    """Get document metadata by ID."""
    result = await db.execute(
        select(UploadedDocument).where(UploadedDocument.id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found")
    return doc


@router.get("/project/{project_id}", response_model=DocumentListResponse, summary="List project documents")
async def list_project_documents(project_id: uuid.UUID, db: DbSession):
    """List all documents for a project."""
    result = await db.execute(
        select(UploadedDocument)
        .where(UploadedDocument.project_id == project_id)
        .order_by(UploadedDocument.uploaded_at.desc())
    )
    documents = result.scalars().all()
    return DocumentListResponse(items=documents, total=len(documents))


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete document")
async def delete_document(document_id: uuid.UUID, db: DbSession):
    """Delete a document and remove its file from storage."""
    settings = get_settings()
    result = await db.execute(
        select(UploadedDocument).where(UploadedDocument.id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found")

    # Delete from storage
    storage = LocalStorage(settings.storage_path)
    try:
        await storage.delete(doc.storage_key)
    except Exception as e:
        logger.warning("Failed to delete file from storage", error=str(e), key=doc.storage_key)

    await db.delete(doc)
    logger.info("Document deleted", document_id=str(document_id))
