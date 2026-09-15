"""
Unit tests for Vector PDF Ingestion Adapter.
"""

import pytest

from engines.geometry.models import CanonicalFloorPlan
from engines.ingestion.base import IngestionError
from engines.ingestion.pdf.adapter import PDFAdapter
from engines.ingestion.pdf.parser import PDFParser


# Synthetic 2-room vector PDF
SAMPLE_VECTOR_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 400] /Contents 4 0 R >>\nendobj\n"
    b"4 0 obj\n<< /Length 150 >>\nstream\n"
    b"50 50 200 150 re S\n"
    b"250 50 200 150 re S\n"
    b"50 200 400 50 re S\n"
    b"BT /F1 12 Tf 100 100 Td (BEDROOM) Tj ET\n"
    b"BT /F1 12 Tf 300 100 Td (LIVING) Tj ET\n"
    b"endstream\nendobj\nxref\n0 5\n"
    b"trailer\n<< /Size 5 /Root 1 0 R >>\n%%EOF"
)

# Scanned raster PDF with an image stream and no CAD vector primitives
SCANNED_RASTER_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 400] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n"
    b"4 0 obj\n<< /Length 20 >>\nstream\n/Im1 Do\nendstream\nendobj\n"
    b"5 0 obj\n<< /Type /XObject /Subtype /Image /Width 100 /Height 100 /ColorSpace /DeviceRGB /Filter /DCTDecode >>\nstream\n"
    b"...bitmap...\nendstream\nendobj\n"
    b"trailer\n<< /Size 6 /Root 1 0 R >>\n%%EOF"
)


def test_pdf_adapter_can_handle():
    adapter = PDFAdapter()
    assert adapter.can_handle("plan.pdf", b"%PDF-1.4") is True
    assert adapter.can_handle("plan.dxf", b"0\nSECTION") is False


def test_vector_pdf_parsing_and_cgm():
    adapter = PDFAdapter()
    cgm = adapter.parse(SAMPLE_VECTOR_PDF, "plan.pdf")

    assert isinstance(cgm, CanonicalFloorPlan)
    assert len(cgm.floors) == 1
    assert cgm.metadata.source_format == "pdf"
    assert cgm.metadata.extraction_method == "pdfplumber"

    floor = cgm.floors[0]
    assert len(floor.walls) >= 1
    # Bounding box should be calculated in meters
    assert cgm.bounding_box.width > 0
    assert cgm.bounding_box.height > 0


def test_scanned_pdf_rejection():
    adapter = PDFAdapter()
    with pytest.raises(IngestionError) as exc_info:
        adapter.parse(SCANNED_RASTER_PDF, "scan.pdf")

    assert exc_info.value.error_code == "RASTER_PDF_REQUIRES_VISION"
    assert "Scanned/raster PDF detected" in str(exc_info.value)
