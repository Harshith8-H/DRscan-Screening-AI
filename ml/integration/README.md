# ML Integration Guide & Model Contract

This folder specifies the integration boundary between the Machine Learning pipeline (owned by the ML teammate) and the Screening Application Platform (FastAPI Backend + React Frontend).

## 1. Core Decoupling Philosophy
The backend does **not** depend on the ML training framework (PyTorch, TensorFlow, or MATLAB). It relies solely on a decoupled inference wrapper that adheres strictly to [`model_contract.json`](file:///c:/Users/saiva/Downloads/DRscan/ml/integration/model_contract.json).

## 2. Model Input Expectations
- **Image Formats**: JPEG, PNG, TIFF
- **Color Space**: RGB
- **Resolution**: 512x512 pixels recommended (backend automatically resizes & normalizes)
- **Quality Gate**: Images with blur variance < 100 or extreme over/underexposure are flagged before classification.

## 3. Output Requirements
For every inference run, the model returns:
1. `dr_level`: Integer from 0 (No DR) to 4 (Proliferative DR).
2. `label`: Clinical classification name according to ICDR (International Clinical Diabetic Retinopathy) disease severity scale.
3. `confidence`: Float between 0.0 and 1.0.
4. `referable`: Boolean (`true` if DR level >= 2 or high-risk findings).
5. `lesions`: Counts of microaneurysms, hemorrhages, hard exudates, and cotton wool spots.
6. `explainability`:
   - Grad-CAM heatmap highlighting visual regions contributing to the classification.
   - Lesion segmentation mask identifying pathology pixels.
   - Annotated detection overlay with bounding boxes/contours for specialist verification.

## 4. How to Swap Mock with Real Weights
1. Place the weights file (e.g. `densenet121_dr.pth` or exported ONNX/MATLAB artifact) in `ml/models/`.
2. Update `ML_PROVIDER=pytorch` (or `onnx` / `matlab`) in `.env`.
3. The `InferenceService` in `backend/app/services/inference_service.py` automatically routes requests to the active model provider.
