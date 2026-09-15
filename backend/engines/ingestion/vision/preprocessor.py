"""
Classical CV Preprocessor (Mode A).

Image -> Grayscale -> Denoise -> Adaptive/OTSU Threshold -> Morphological Cleanup -> Edge Detection.
"""

from __future__ import annotations

import cv2
import numpy as np

from app.logging_config import get_logger
from engines.ingestion.base import IngestionError

logger = get_logger(__name__)


class ImagePreprocessor:
    """Preprocesses architectural blueprint images into clean binary and edge maps."""

    @classmethod
    def preprocess(
        cls,
        image_bytes: bytes,
        blur_kernel: tuple[int, int] = (5, 5),
        morph_kernel_size: int = 3,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, tuple[int, int]]:
        """
        Executes the classical CV preprocessing pipeline.

        Returns:
            (gray_image, binary_thresholded, edge_map, (height, width))
        """
        if not image_bytes:
            raise IngestionError("Image byte content is empty", "EMPTY_IMAGE")

        # 1. Decode image from bytes
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise IngestionError("Failed to decode image. Unsupported or corrupted image format.", "CORRUPT_IMAGE")

        height, width = img.shape[:2]

        # 2. Grayscale conversion
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 3. Denoising using Gaussian blur
        denoised = cv2.GaussianBlur(gray, blur_kernel, 0)

        # 4. Otsu thresholding (invert so walls/drawn lines are white foreground on dark background)
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # 5. Morphological cleanup (closing small gaps in hand-drawn or scanned walls)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (morph_kernel_size, morph_kernel_size))
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=1)

        # 6. Canny edge detection
        edges = cv2.Canny(cleaned, 50, 150, apertureSize=3)

        return gray, cleaned, edges, (height, width)
