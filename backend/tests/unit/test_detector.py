"""
Unit tests for Document Type Detection (DXF, Vector PDF, Raster PDF, Images).
"""

import pytest

from engines.ingestion.detector import DocumentDetector, DocumentType


def test_detect_dxf():
    content = b"0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1027\n0\nENDSEC\n0\nEOF\n"
    info = DocumentDetector.detect(content, "blueprint.dxf")
    assert info.doc_type == DocumentType.DXF
    assert info.is_vector is True
    assert info.recommended_pipeline == "dxf_pipeline"
    assert info.confidence == 1.0


def test_detect_vector_pdf():
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 400] /Contents 4 0 R >>\nendobj\n"
        b"4 0 obj\n<< /Length 80 >>\nstream\n"
        b"10 10 100 100 re S\n"
        b"120 10 100 100 re S\n"
        b"endstream\nendobj\nxref\n0 5\n"
        b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n250\n%%EOF"
    )
    info = DocumentDetector.detect(pdf_content, "floor_plan.pdf")
    assert info.doc_type == DocumentType.VECTOR_PDF
    assert info.is_vector is True
    assert info.recommended_pipeline == "vector_pdf_pipeline"


def test_detect_raster_pdf():
    # PDF containing bitmap image XObject and no vector primitives
    scanned_pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n"
        b"4 0 obj\n<< /Length 20 >>\nstream\n/Im1 Do\nendstream\nendobj\n"
        b"5 0 obj\n<< /Type /XObject /Subtype /Image /Filter /DCTDecode >>\nstream\n...binary...\nendstream\nendobj\n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\n%%EOF"
    )
    info = DocumentDetector.detect(scanned_pdf, "scanned_blueprint.pdf")
    assert info.doc_type == DocumentType.RASTER_PDF
    assert info.is_vector is False
    assert info.recommended_pipeline == "classical_cv_pipeline"


def test_detect_png_image():
    png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x01\x00"
    info = DocumentDetector.detect(png_content, "sketch.png")
    assert info.doc_type == DocumentType.IMAGE
    assert info.is_vector is False
    assert info.recommended_pipeline == "classical_cv_pipeline"


def test_detect_empty_or_unknown():
    empty_info = DocumentDetector.detect(b"", "empty.xyz")
    assert empty_info.doc_type == DocumentType.UNKNOWN
    assert empty_info.confidence == 0.0

    unknown_info = DocumentDetector.detect(b"random binary data here", "unknown.dat")
    assert unknown_info.doc_type == DocumentType.UNKNOWN
