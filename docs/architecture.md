# System Architecture & Technical Specifications

> **Project:** Explainable AI for Diabetic Retinopathy Screening in Rural India (SIH26038)

## 1. High-Level System Architecture
```
                         PRIMARY HEALTH CENTRE (PHC)
                                     |
                         [ Fundus Camera / Operator ]
                                     |
                                     v
                        +-------------------------+
                        |  React / Vite Frontend  |
                        | (Online / Offline Mode) |
                        +------------+------------+
                                     |
                            REST API / JSON / Upload
                                     |
                                     v
                        +-------------------------+
                        |  FastAPI Backend Engine |
                        +------------+------------+
                                     |
            +------------------------+------------------------+
            |                        |                        |
            v                        v                        v
    [ Image Service ]       [ Database / ORM ]       [ Auth & Security ]
    - Format Validation     - Patient Registry       - JWT & Role Auth
    - Resolution Check      - Screening Sessions     - Doctor / Operator
    - Quality Scoring       - Doctor Tele-Reviews    - Tele-Audit Logs
            |                        |                        |
            +------------------------+------------------------+
                                     |
                                     v
                       +---------------------------+
                       | ML Inference Wrapper      |
                       | (Decoupled Model Contract)|
                       +-------------+-------------+
                                     |
                    +----------------+----------------+
                    |                                 |
                    v                                 v
        [ DR Classification Engine ]      [ Explainability Engine ]
        - 5-Tier ICDR Grading (0 - 4)     - Grad-CAM Heatmaps
        - Confidence Calibration          - Lesion Segmentation Masks
        - Referable Triage Protocol       - Bounding Box Annotations
                    |                                 |
                    +----------------+----------------+
                                     |
                                     v
                       +---------------------------+
                       | Clinical Decision Layer   |
                       | - Non-Referable vs Refer  |
                       | - Urgency & Action Plan   |
                       +-------------+-------------+
                                     |
                    +----------------+----------------+
                    |                                 |
                    v                                 v
        [ ReportLab PDF Service ]         [ Tele-Ophthalmology Portal ]
        - Printable Clinical Report       - Specialist Confirmation
        - Tri-view Visual Evidence        - Grade Override / Tele-consult
```

## 2. Decoupled Inference Contract
The backend does not import or depend on training scripts, dataset loaders, or augmentation pipelines. It interacts strictly through [`model_contract.json`](file:///c:/Users/saiva/Downloads/DRscan/ml/integration/model_contract.json).
When the ML teammate produces PyTorch (`.pth`), ONNX (`.onnx`), or MATLAB exported weights, they are placed in `ml/models/` and referenced via environment variable `ML_PROVIDER`.

## 3. Data Entities
- **User**: Authentication for District Ophthalmologists and Rural PHC Technicians.
- **Patient**: Rural demographic profile, diabetes duration, fasting glucose, HbA1c.
- **Screening**: Eye evaluated (OD/OS), fundus image path, quality metrics, offline queue tracking.
- **AIResult**: DR level (0-4), confidence, posterior probabilities, Grad-CAM and lesion mask paths.
- **LesionResult**: Microaneurysms, blot hemorrhages, hard exudates, cotton wool spots count.
- **DoctorReview**: Specialist confirmation, grade adjustment, referral hospital, clinical notes.

## 4. Rural Resilience & Simulink Modeling
1. **Low-Connectivity / Offline Mode**: Local queuing when cellular/satellite connection drops; automatic batch synchronization upon reconnection.
2. **Simulink Simulation Service**: Mathematical modeling of rural clinic throughput, identifying whether the bottleneck is Fundus Camera units, 2G/3G network upload bandwidth, or District Doctor review capacity.
