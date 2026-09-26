# ML Model Contract Specification

This document details the exact contract between the Backend/Frontend Application and the ML Teammate for **SIH26038**.

## 1. Input Specification
- **Supported Formats**: JPEG (`.jpg`, `.jpeg`), PNG (`.png`), TIFF (`.tif`, `.tiff`).
- **Input Channels**: 3-channel RGB.
- **Resolution**: 512x512 pixels (backend automatically crops and normalizes).
- **Quality Requirements**:
  - Sharpness: Laplacian variance $\ge 50$.
  - Illumination: Mean pixel brightness between 40 and 190.
  - Retinal Disc Coverage: Central macula and optic disk must not be obscured by flash reflection.

## 2. Output Schema
The model response must conform to JSON schema [`model_contract.json`](file:///c:/Users/saiva/Downloads/DRscan/ml/integration/model_contract.json):
```json
{
  "success": true,
  "inference_time_ms": 210.5,
  "model": {
    "name": "DenseNet121-Explainable-DR",
    "version": "1.0.0",
    "architecture": "DenseNet121 + Dual-Attention FPN",
    "dataset": "APTOS2019 / EyePACS",
    "input_size": "512x512"
  },
  "prediction": {
    "dr_level": 2,
    "label": "Moderate NPDR (Grade 2)",
    "confidence": 0.912,
    "referable": true,
    "class_probabilities": {
      "grade_0": 0.02,
      "grade_1": 0.068,
      "grade_2": 0.912,
      "grade_3": 0.0,
      "grade_4": 0.0
    }
  },
  "quality": {
    "score": 0.94,
    "status": "good",
    "sharpness": 142.5,
    "illumination": 118.0,
    "is_acceptable": true,
    "issues": []
  },
  "lesions": {
    "microaneurysms": 14,
    "hemorrhages": 4,
    "exudates": 8,
    "cotton_wool_spots": 0,
    "foveal_involvement": false
  },
  "explainability": {
    "gradcam_available": true,
    "heatmap_path": "/results/SCR-1002/SCR-1002_gradcam.jpg",
    "lesion_mask_path": "/results/SCR-1002/SCR-1002_lesion_mask.png",
    "annotated_path": "/results/SCR-1002/SCR-1002_annotated.jpg",
    "salient_regions": []
  },
  "recommendation": {
    "action": "REFER_OPHTHALMOLOGIST",
    "urgency": "priority_30_days",
    "reason": "Moderate Non-Proliferative DR. Referable Diabetic Retinopathy detected.",
    "clinical_guideline": "Refer to District Hospital Ophthalmologist within 4-6 weeks."
  }
}
```

## 3. Checklist for ML Teammate
Before handing over model weights:
- [ ] Ensure input dimensions match $512 \times 512$ RGB.
- [ ] Export weights to `.pth` (PyTorch) or `.onnx`.
- [ ] Provide Grad-CAM forward/backward hook layer name (e.g. `features.denseblock4.denselayer16`).
- [ ] Document sensitivity and specificity for Referable DR ($DR \ge 2$). Target: Sensitivity $\ge 90\%$, Specificity $\ge 85\%$.
