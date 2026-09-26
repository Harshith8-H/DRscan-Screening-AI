import os
import io
import uuid
from pathlib import Path
from typing import Tuple, List
from PIL import Image, ImageStat
import numpy as np
from fastapi import UploadFile, HTTPException
from app.core.config import settings
from app.schemas.inference import QualityMetrics
from app.core.logging import logger

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

class ImageService:
    @staticmethod
    async def validate_and_save_upload(file: UploadFile, screening_id: str) -> Tuple[str, QualityMetrics]:
        # 1. Check extension
        ext = Path(file.filename or "image.jpg").suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # 2. Read contents and check size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of 25MB (Size: {len(contents)/(1024*1024):.2f}MB)"
            )

        # 3. Verify readable PIL image
        try:
            image = Image.open(io.BytesIO(contents))
            image.verify()  # Check corruption
            # Reopen because verify() closes/invalidates the stream
            image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception as e:
            logger.error(f"Image corruption check failed: {str(e)}")
            raise HTTPException(status_code=400, detail="Corrupted or unreadable image file.")

        # 4. Check resolution
        w, h = image.size
        if w < 150 or h < 150:
            raise HTTPException(
                status_code=400,
                detail=f"Image resolution too low ({w}x{h}). Minimum required is 150x150 pixels."
            )

        # 5. Compute real image quality metrics
        quality = ImageService.evaluate_fundus_quality(image)

        # 6. Save original image to disk
        dest_filename = f"{screening_id}_original{ext if ext in ['.jpg', '.jpeg', '.png'] else '.jpg'}"
        dest_path = settings.UPLOAD_DIR / dest_filename
        image.save(dest_path, quality=95)

        # Return relative URL path and quality
        relative_url = f"/uploads/{dest_filename}"
        return relative_url, quality

    @staticmethod
    def evaluate_fundus_quality(image: Image.Image) -> QualityMetrics:
        issues: List[str] = []
        w, h = image.size
        img_np = np.array(image)

        # Grayscale representation for variance & gradient checks
        gray = np.array(image.convert("L"), dtype=np.float32)

        # Sharpness / Blur estimation via 2D discrete Laplacian kernel
        # [0, 1, 0], [1, -4, 1], [0, 1, 0]
        laplacian = (
            np.roll(gray, 1, axis=0) +
            np.roll(gray, -1, axis=0) +
            np.roll(gray, 1, axis=1) +
            np.roll(gray, -1, axis=1) -
            4 * gray
        )
        sharpness_var = float(np.var(laplacian))

        # Illumination metrics
        mean_brightness = float(np.mean(gray))
        contrast_std = float(np.std(gray))

        # Color distribution (fundus images have strong red/orange dominant background)
        r_mean = float(np.mean(img_np[:, :, 0]))
        g_mean = float(np.mean(img_np[:, :, 1]))
        b_mean = float(np.mean(img_np[:, :, 2]))

        # Quality scoring formula calibrated for fundus photographs
        score = 0.95

        # Check blur
        if sharpness_var < 50.0:
            issues.append("Severe motion blur or camera defocus detected.")
            score -= 0.40
        elif sharpness_var < 120.0:
            issues.append("Moderate blur; fine microvascular details may be degraded.")
            score -= 0.15

        # Check underexposure
        if mean_brightness < 35.0:
            issues.append("Severe underexposure; illumination inadequate.")
            score -= 0.35
        elif mean_brightness < 60.0:
            issues.append("Low illumination; periphery is underexposed.")
            score -= 0.15

        # Check overexposure / glare
        if mean_brightness > 195.0 or np.sum(gray > 245) > (0.15 * gray.size):
            issues.append("Excessive corneal reflection or flash glare artifact.")
            score -= 0.30

        # Check contrast
        if contrast_std < 22.0:
            issues.append("Poor contrast between retinal vessels and fundus background.")
            score -= 0.20

        # Check non-fundus characteristics (RGB channel check)
        if b_mean > r_mean and b_mean > 100:
            issues.append("Color spectrum abnormal for human retinal fundus imaging.")
            score -= 0.25

        score = max(0.10, min(0.99, score))

        if score >= 0.80:
            status = "good"
            is_acceptable = True
        elif score >= 0.60:
            status = "adequate"
            is_acceptable = True
        else:
            status = "poor"
            is_acceptable = False
            issues.append("Recapture recommended: Image quality below diagnostic threshold.")

        return QualityMetrics(
            score=round(score, 2),
            status=status,
            sharpness=round(sharpness_var, 1),
            illumination=round(mean_brightness, 1),
            is_acceptable=is_acceptable,
            issues=issues
        )
