# Explainable AI for Diabetic Retinopathy Screening in Rural India

## Backend + Frontend Developer README / Work Plan

> **SIH Problem Statement:** SIH26038\
> **Title:** Explainable AI for Diabetic Retinopathy Screening in Rural
> India\
> **Technology Bucket:** MedTech / BioTech / HealthTech\
> **Category:** Software

------------------------------------------------------------------------

# 1. Project Overview

This project is an AI-assisted diabetic retinopathy (DR) screening
platform designed for deployment in rural and primary-healthcare
settings.

The system accepts retinal fundus images, checks whether the image is
suitable for analysis, sends valid images to the ML inference pipeline,
receives a DR prediction and explainability information, and presents
the result through a doctor-friendly dashboard.

The system is **not intended to replace an ophthalmologist**. Its
purpose is to:

-   perform first-level screening,
-   identify potentially referable cases,
-   reject or request recapture of poor-quality images,
-   provide visual evidence supporting the AI prediction,
-   prioritize cases for specialist review,
-   maintain screening records,
-   support longitudinal monitoring,
-   operate under rural connectivity constraints,
-   and simulate large-scale screening capacity.

The ML teammate owns model development. This repository/workstream is
primarily responsible for the **backend, API, database, frontend,
inference integration, report generation, authentication, deployment
architecture, and system-level workflow**.

------------------------------------------------------------------------

# 2. Your Role

## Your responsibility

You are the **Backend + Frontend / Full-Stack Integration Developer**.

Your main responsibility is to build the software system around the ML
models.

You are NOT responsible for:

-   researching the best CNN architecture,
-   training the DR classifier,
-   tuning the ML model,
-   creating the final model weights,
-   proving the model's clinical validity independently.

You ARE responsible for:

-   defining the ML inference contract,
-   receiving and validating images,
-   connecting the frontend to the backend,
-   integrating the trained models,
-   storing patient/screening information,
-   handling inference results,
-   generating explainable results,
-   generating reports,
-   implementing doctor review,
-   implementing history and longitudinal tracking,
-   handling errors and low-confidence cases,
-   preparing the system for deployment,
-   and making the complete prototype usable.

------------------------------------------------------------------------

# 3. High-Level System Architecture

``` text
                         USER / DOCTOR
                              |
                              v
                    +-------------------+
                    |    FRONTEND       |
                    | React / Web App   |
                    +---------+---------+
                              |
                         REST / JSON
                              |
                              v
                    +-------------------+
                    |     BACKEND       |
                    | FastAPI / Python  |
                    +---------+---------+
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
   Image Management      Patient Data       Authentication
          |                   |                   |
          +-------------------+-------------------+
                              |
                              v
                    +-------------------+
                    | INFERENCE SERVICE |
                    | ML Model Wrapper  |
                    +---------+---------+
                              |
                 +------------+-------------+
                 |                          |
                 v                          v
          DR Classification          Lesion Analysis
                 |                          |
                 +------------+-------------+
                              |
                              v
                     Explainability
                     Grad-CAM / Masks
                              |
                              v
                    Result / Decision Layer
                              |
             +----------------+----------------+
             |                                 |
             v                                 v
      Screening Report                  Doctor Review
             |                                 |
             +----------------+----------------+
                              |
                              v
                         DATABASE
                              |
                              v
                    Patient History / Trends
```

------------------------------------------------------------------------

# 4. Recommended Technology Stack

## Frontend

Recommended:

-   React
-   Vite
-   TypeScript
-   Tailwind CSS or another consistent UI system
-   Axios / Fetch
-   React Router
-   Recharts or another charting library

The frontend should communicate with the backend only through APIs.

Do not put ML logic directly inside the frontend.

------------------------------------------------------------------------

## Backend

Recommended:

-   Python
-   FastAPI
-   Pydantic
-   SQLAlchemy
-   PostgreSQL for the main database
-   JWT-based authentication
-   Python image validation utilities
-   Report generation library

FastAPI is recommended because it gives a clean API layer between the
web application and the ML inference system.

------------------------------------------------------------------------

## ML Integration

The ML teammate can develop models in MATLAB/Python depending on the
agreed workflow.

Your backend should NOT care how the model was trained.

Your backend should only care about a stable inference interface.

For example:

``` json
{
  "score": 87,
  "confidence": 0.91,
  "dr_level": 2,
  "referable": true,
  "model_name": "DenseNet121",
  "model_version": "1.0"
}
```

The model can later be replaced without rewriting the frontend.

------------------------------------------------------------------------

# 5. Core Principle: Separate the ML Model from the Application

This is one of the most important architectural decisions.

Do NOT build:

``` text
Frontend
   |
   v
ML model directly
```

Build:

``` text
Frontend
   |
   v
Backend API
   |
   v
Inference Service
   |
   v
ML Model
```

This means your friend can replace:

``` text
DenseNet → EfficientNet
```

or:

``` text
PyTorch → MATLAB exported model
```

without requiring major frontend changes.

------------------------------------------------------------------------

# 6. Your Main Development Workflow

Your development should happen in the following order.

``` text
PHASE 0
Project architecture
        |
        v
PHASE 1
API + ML contract
        |
        v
PHASE 2
Database
        |
        v
PHASE 3
Image upload pipeline
        |
        v
PHASE 4
Mock inference service
        |
        v
PHASE 5
Frontend screening UI
        |
        v
PHASE 6
Real ML integration
        |
        v
PHASE 7
Explainability UI
        |
        v
PHASE 8
Patient history + doctor review
        |
        v
PHASE 9
Reports
        |
        v
PHASE 10
Offline / rural workflow
        |
        v
PHASE 11
Simulink integration
        |
        v
PHASE 12
Testing + deployment
```

The key idea is:

> **Build the backend and frontend using MOCK ML results before your
> friend's model is finished.**

This prevents the entire project from becoming blocked by ML
development.

------------------------------------------------------------------------

# 7. PHASE 0 --- Repository Architecture

Recommended repository:

``` text
dr-screening/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── patients.py
│   │   │   ├── screenings.py
│   │   │   ├── inference.py
│   │   │   ├── reports.py
│   │   │   └── doctors.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── logging.py
│   │   │
│   │   ├── models/
│   │   │   ├── patient.py
│   │   │   ├── screening.py
│   │   │   ├── user.py
│   │   │   └── report.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── patient.py
│   │   │   ├── screening.py
│   │   │   ├── inference.py
│   │   │   └── report.py
│   │   │
│   │   ├── services/
│   │   │   ├── inference_service.py
│   │   │   ├── image_service.py
│   │   │   ├── screening_service.py
│   │   │   └── report_service.py
│   │   │
│   │   └── db/
│   │       ├── database.py
│   │       └── migrations/
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── ml/
│   └── integration/
│       ├── README.md
│       └── model_contract.json
│
├── simulink/
│   └── README.md
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── ml-contract.md
│   └── deployment.md
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

The exact folder names can change, but keep the responsibilities
separated.

------------------------------------------------------------------------

# 8. PHASE 1 --- Define the ML Contract FIRST

This is the most important thing you should do with your ML teammate.

Before they finish the model, agree on:

## Input

What does the model accept?

Example:

``` text
JPEG
PNG
DICOM (future support)
```

Recommended initial prototype:

``` text
JPEG / PNG
```

Define:

-   image dimensions,
-   color format,
-   normalization,
-   preprocessing requirements,
-   maximum file size.

------------------------------------------------------------------------

## Output

Define one standard JSON response.

Recommended:

``` json
{
  "success": true,
  "model": {
    "name": "DenseNet121",
    "version": "1.0"
  },
  "prediction": {
    "dr_level": 2,
    "label": "Moderate NPDR",
    "confidence": 0.91,
    "referable": true
  },
  "quality": {
    "score": 0.94,
    "status": "good"
  },
  "lesions": {
    "microaneurysms": 12,
    "hemorrhages": 4,
    "exudates": 6
  },
  "explainability": {
    "gradcam_available": true,
    "heatmap_path": "/results/abc123/gradcam.png",
    "lesion_mask_path": "/results/abc123/lesions.png"
  },
  "recommendation": {
    "action": "REFER",
    "reason": "Referable DR detected"
  }
}
```

The actual fields can evolve, but the contract should be agreed upon.

------------------------------------------------------------------------

# 9. Model Versioning

Every ML model should have:

``` text
model_name
model_version
training_dataset
training_date
input_size
```

Example:

``` json
{
  "model_name": "DenseNet121-DR",
  "model_version": "1.0.0",
  "dataset": "APTOS2019",
  "input_size": "224x224"
}
```

This is important because later your friend may train:

``` text
1.0.0
1.1.0
2.0.0
```

Your backend should know which model produced each result.

------------------------------------------------------------------------

# 10. PHASE 2 --- Database

You need to store **screening information**, not unnecessarily store
everything inside the model.

Main entities:

``` text
User
 |
 +---- Doctor
 |
 +---- Screening
          |
          +---- Patient
          |
          +---- Fundus Image
          |
          +---- AI Result
          |
          +---- Explainability
          |
          +---- Doctor Review
```

------------------------------------------------------------------------

## Patient table

Example:

``` text
Patient
--------
id
patient_code
name
age
sex
diabetes_duration
created_at
```

Avoid storing unnecessary personal information in the prototype.

------------------------------------------------------------------------

## Screening table

``` text
Screening
---------
id
patient_id
image_path
status
created_at
model_version
```

Possible statuses:

``` text
UPLOADED
PROCESSING
COMPLETED
FAILED
REVIEW_REQUIRED
```

------------------------------------------------------------------------

## AI Result

``` text
AIResult
--------
id
screening_id
dr_level
label
confidence
referable
quality_score
model_name
model_version
created_at
```

------------------------------------------------------------------------

## Lesion Result

``` text
LesionResult
------------
id
screening_id
microaneurysms
hemorrhages
exudates
vessel_abnormalities
```

------------------------------------------------------------------------

## Doctor Review

``` text
DoctorReview
------------
id
screening_id
doctor_id
decision
notes
reviewed_at
```

Possible decisions:

``` text
CONFIRMED
REJECTED
REQUIRES_FURTHER_REVIEW
```

------------------------------------------------------------------------

# 11. PHASE 3 --- Image Upload Pipeline

Your backend should handle:

``` text
Upload
  ↓
Validate
  ↓
Store
  ↓
Create screening record
  ↓
Send to inference
```

Validation should include:

-   file type,
-   file size,
-   readable image,
-   valid dimensions,
-   corruption detection.

Example:

``` text
POST /api/screenings
```

Request:

``` text
multipart/form-data
patient_id
fundus_image
```

Response:

``` json
{
  "screening_id": "SCR-1024",
  "status": "PROCESSING"
}
```

------------------------------------------------------------------------

# 12. PHASE 4 --- Build a MOCK ML SERVICE

Do this BEFORE your friend gives you the real model.

Create:

``` text
/mock-inference
```

or a development inference service that returns realistic dummy results.

Example:

``` json
{
  "dr_level": 2,
  "label": "Moderate NPDR",
  "confidence": 0.91,
  "referable": true,
  "quality_score": 0.94
}
```

Now your frontend can be built immediately.

Later:

``` text
MOCK MODEL
     ↓
REAL MODEL
```

The API does not change.

This is one of the most important parts of your workflow.

------------------------------------------------------------------------

# 13. PHASE 5 --- Frontend

Build these pages.

## 1. Login

``` text
Doctor / Operator Login
```

------------------------------------------------------------------------

## 2. Dashboard

Show:

``` text
Total screenings
Today's screenings
Referable cases
Pending reviews
Poor-quality images
```

------------------------------------------------------------------------

## 3. New Screening

``` text
Patient
   ↓
Upload Fundus Image
   ↓
Analyze
```

------------------------------------------------------------------------

## 4. Analysis Page

Display:

``` text
Original Image
Quality Status
DR Grade
Confidence
Grad-CAM
Lesion Mask
Detected Lesions
Recommendation
```

------------------------------------------------------------------------

## 5. Doctor Review

Doctor can:

``` text
Confirm AI result
Reject AI result
Request further review
Add notes
```

------------------------------------------------------------------------

## 6. Patient History

Display:

``` text
Previous screening
Current screening
DR level over time
Previous images
AI results
Doctor decisions
```

------------------------------------------------------------------------

# 14. PHASE 6 --- Real ML Integration

Once your friend's model is ready, integrate it through the inference
service.

Your backend flow:

``` text
Frontend
   |
POST /screenings
   |
Backend
   |
Image validation
   |
Inference Service
   |
ML Model
   |
Prediction
   |
Grad-CAM
   |
Lesion masks
   |
Backend
   |
Database
   |
Frontend
```

Your backend should convert whatever raw format the model provides into
your standard API response.

------------------------------------------------------------------------

# 15. Do NOT Couple the Backend to the Training Code

Your friend might have:

``` text
train.py
model.pth
```

or:

``` text
MATLAB model
```

or:

``` text
ONNX model
```

Your backend should not contain:

``` text
training code
dataset code
augmentation code
```

It should only have:

``` text
load model
preprocess input
run inference
format result
```

------------------------------------------------------------------------

# 16. If the ML Model Is MATLAB-Based

If your friend develops the model in MATLAB, discuss deployment options
early.

Possible architecture:

``` text
FastAPI
   |
   v
MATLAB inference service / deployed model
   |
   v
Prediction
```

Alternatively, if the model can be exported into a deployment-friendly
format:

``` text
FastAPI
   |
   v
Inference Runtime
   |
   v
Model
```

The important thing is that **the API contract remains unchanged**.

Do not let the frontend depend on whether the model was created in
MATLAB, PyTorch, TensorFlow, or another framework.

------------------------------------------------------------------------

# 17. Explainability Integration

The backend should receive/store:

``` text
original image
Grad-CAM image
lesion mask
annotated image
```

For example:

``` text
results/
└── SCR-1024/
    ├── original.jpg
    ├── gradcam.jpg
    ├── lesion_mask.png
    └── annotated.jpg
```

The frontend can then display:

``` text
[ Original ]

[ Grad-CAM ]

[ Lesion Evidence ]

[ Annotated ]
```

------------------------------------------------------------------------

# 18. Decision Engine

Do not let the frontend decide whether someone is referable.

The backend should receive the model result and create a standardized
screening decision.

Example:

``` text
DR Level 0/1
        ↓
NON-REFERABLE

DR Level 2/3/4
        ↓
REFERABLE

Low confidence
        ↓
HUMAN REVIEW
```

The exact clinical thresholds must remain configurable and should
reflect the final validated project specification.

------------------------------------------------------------------------

# 19. Report Generation

Generate a screening report containing:

``` text
Patient ID
Screening date
Image quality
DR grade
Confidence
Detected lesions
Grad-CAM
Annotated image
Recommendation
Model name/version
Doctor review
```

Example:

``` text
=======================================
DIABETIC RETINOPATHY SCREENING REPORT
=======================================

Patient: P1024
Screening: SCR-1024
Date: 25/09/2026

IMAGE QUALITY
Status: GOOD
Score: 94%

AI RESULT
DR Level: 2
Classification: Moderate NPDR
Confidence: 91%

EVIDENCE
Microaneurysms: 12
Hemorrhages: 4
Exudates: 6

DECISION
REFERABLE

Recommendation:
Ophthalmologist review recommended.

MODEL
DenseNet121
Version 1.0.0
```

------------------------------------------------------------------------

# 20. Longitudinal Monitoring

This is one of the features that can differentiate the project.

The backend should support multiple screenings per patient.

Example:

``` text
Patient P1024

2026-09
DR Level 1

2027-03
DR Level 2

2027-09
DR Level 2
```

The frontend can display a graph:

``` text
DR Level
4 |
3 |
2 |        ●────●
1 |  ●
0 |
  +----------------
    Sep26 Mar27 Sep27
```

The system can flag:

``` text
Potential progression detected.
```

This should be treated as a screening/monitoring signal, not a
definitive clinical diagnosis.

------------------------------------------------------------------------

# 21. Rural / Low-Connectivity Mode

This should be considered during architecture, even if implemented
later.

Possible workflow:

``` text
PHC
 |
 |-- Fundus image
 |-- Local screening
 |-- Local result
 |
 +---- Internet available ----> District Hospital
                                  |
                                  v
                            Doctor review
```

A future offline-capable frontend can queue:

``` text
PENDING SYNC
```

and synchronize when connectivity returns.

For the SIH prototype, this can initially be simulated rather than fully
implementing a distributed offline system.

------------------------------------------------------------------------

# 22. Simulink Integration

Simulink belongs to the system-level part, not the frontend.

Your job is to expose the parameters that the simulation needs.

Example parameters:

``` text
patients_per_day
images_per_patient
camera_count
processing_time
network_latency
bandwidth
doctor_count
doctor_review_time
referral_rate
```

The simulation can answer:

``` text
How many patients can be screened?

How many doctors are required?

What happens if network bandwidth decreases?

What happens if patient volume increases?

Where is the bottleneck?
```

Your dashboard can later display summarized simulation results.

------------------------------------------------------------------------

# 23. API Structure

Recommended API:

``` text
/api/auth
    POST /login
    POST /logout

/api/patients
    POST /
    GET /
    GET /{patient_id}
    GET /{patient_id}/history

/api/screenings
    POST /
    GET /
    GET /{screening_id}
    GET /{screening_id}/status

/api/inference
    POST /analyze

/api/results
    GET /{screening_id}

/api/reports
    GET /{screening_id}
    GET /{screening_id}/download

/api/reviews
    POST /
    GET /pending
    PUT /{review_id}
```

The exact routes can change, but keep the API organized by domain.

------------------------------------------------------------------------

# 24. Example Complete Request Flow

When a doctor uploads an image:

``` text
1. Doctor opens New Screening
                ↓
2. Selects patient
                ↓
3. Uploads fundus image
                ↓
4. Frontend sends POST /screenings
                ↓
5. Backend validates image
                ↓
6. Backend stores image
                ↓
7. Screening record created
                ↓
8. Backend calls inference service
                ↓
9. ML model processes image
                ↓
10. Model returns prediction
                ↓
11. Backend stores result
                ↓
12. Backend stores Grad-CAM/masks
                ↓
13. Decision layer calculates screening status
                ↓
14. Frontend receives result
                ↓
15. Doctor sees explanation
                ↓
16. Doctor confirms/reviews result
                ↓
17. Review stored
                ↓
18. Patient history updated
```

------------------------------------------------------------------------

# 25. What You Should Ask Your ML Teammate

Before they finish their model, send them this checklist.

## Required information

### Model

-   Model architecture
-   Framework
-   Model file format
-   Model version

### Input

-   Accepted image formats
-   Expected dimensions
-   RGB/grayscale
-   Normalization
-   Required preprocessing

### Output

-   DR levels
-   Confidence format
-   Referable classification
-   Class probabilities

### Explainability

-   Grad-CAM output
-   Heatmap format
-   Layer used
-   Image dimensions

### Lesions

-   Which lesions are detected?
-   Segmentation mask format?
-   Bounding boxes?
-   Counts?

### Performance

-   Validation metrics
-   Test metrics
-   Referable DR sensitivity
-   Referable DR specificity
-   Dataset used
-   Test split

### Runtime

-   CPU/GPU requirement
-   Approximate inference time
-   Memory requirement

------------------------------------------------------------------------

# 26. Your GitHub Issue Breakdown

Create issues approximately like this:

## Backend

-   [ ] Initialize FastAPI project
-   [ ] Configure environment variables
-   [ ] Configure PostgreSQL
-   [ ] Create User model
-   [ ] Create Patient model
-   [ ] Create Screening model
-   [ ] Create AIResult model
-   [ ] Create DoctorReview model
-   [ ] Implement authentication
-   [ ] Implement patient APIs
-   [ ] Implement screening APIs
-   [ ] Implement inference API
-   [ ] Implement report generation
-   [ ] Implement history API

## ML Integration

-   [ ] Define ML contract
-   [ ] Build mock inference service
-   [ ] Integrate real classifier
-   [ ] Integrate Grad-CAM
-   [ ] Integrate lesion masks
-   [ ] Add model versioning
-   [ ] Add inference error handling

## Frontend

-   [ ] Create React project
-   [ ] Build login
-   [ ] Build dashboard
-   [ ] Build patient registration
-   [ ] Build image upload
-   [ ] Build screening page
-   [ ] Build result page
-   [ ] Build Grad-CAM viewer
-   [ ] Build lesion viewer
-   [ ] Build doctor review
-   [ ] Build patient history
-   [ ] Build report viewer

## Deployment

-   [ ] Dockerize backend
-   [ ] Dockerize frontend
-   [ ] Configure database
-   [ ] Configure CORS
-   [ ] Configure production environment
-   [ ] Test complete pipeline

## Simulation

-   [ ] Define Simulink inputs
-   [ ] Create rural workflow model
-   [ ] Simulate throughput
-   [ ] Simulate doctor capacity
-   [ ] Simulate network constraints
-   [ ] Export results

------------------------------------------------------------------------

# 27. Development Timeline

A practical order is:

## Stage 1 --- Foundation

``` text
Day 1–2

Repository
Backend
Frontend
Database
API skeleton
```

## Stage 2 --- Mock System

``` text
Day 3–4

Mock ML service
Image upload
Screening workflow
Dashboard
Result page
```

At this point you already have an end-to-end application.

------------------------------------------------------------------------

## Stage 3 --- Real ML

``` text
Day 5+

Friend provides model
       ↓
Integrate model
       ↓
Test inference
       ↓
Fix preprocessing mismatch
       ↓
Store actual results
```

------------------------------------------------------------------------

## Stage 4 --- Explainability

``` text
Grad-CAM
Lesion masks
Evidence display
Confidence
```

------------------------------------------------------------------------

## Stage 5 --- Clinical Workflow

``` text
Doctor review
Patient history
Reports
Referral workflow
```

------------------------------------------------------------------------

## Stage 6 --- SIH Differentiation

``` text
Image quality gate
Human-in-the-loop
Offline/low-connectivity workflow
Longitudinal monitoring
Simulink scaling
```

------------------------------------------------------------------------

# 28. Most Important Engineering Rules

## Rule 1 --- Frontend never talks directly to the model

Always:

``` text
Frontend → Backend → Inference
```

------------------------------------------------------------------------

## Rule 2 --- Don't wait for your friend

Use:

``` text
Mock ML → Real ML
```

Your frontend/backend should be almost completely functional before the
actual model arrives.

------------------------------------------------------------------------

## Rule 3 --- Freeze the API contract early

Your friend can change:

``` text
DenseNet → EfficientNet
PyTorch → MATLAB
```

without breaking your application.

------------------------------------------------------------------------

## Rule 4 --- Store model version with every result

Never have an anonymous prediction.

------------------------------------------------------------------------

## Rule 5 --- Don't claim diagnosis

The UI should consistently describe the output as:

> **AI-assisted screening / referral recommendation**

and not:

> **Definitive diagnosis**

------------------------------------------------------------------------

## Rule 6 --- Don't hide uncertainty

If confidence is low or image quality is inadequate:

``` text
HUMAN REVIEW
```

should be a valid outcome.

------------------------------------------------------------------------

# 29. Your Immediate To-Do List

Do **these first**, in this exact order:

### 🔴 Step 1

Create the GitHub repository structure.

### 🔴 Step 2

Create the backend FastAPI skeleton.

### 🔴 Step 3

Create the frontend React skeleton.

### 🔴 Step 4

Create the PostgreSQL schema.

### 🔴 Step 5

Define the ML inference contract with your friend.

### 🔴 Step 6

Build the mock inference service.

### 🔴 Step 7

Build:

``` text
Upload → API → Mock AI → Result
```

### 🔴 Step 8

Build the screening dashboard.

### 🔴 Step 9

When your friend finishes the first model, replace the mock service.

### 🔴 Step 10

Add Grad-CAM and lesion visualization.

### 🔴 Step 11

Add doctor review + history.

### 🔴 Step 12

Add Simulink and deployment simulation.

------------------------------------------------------------------------

# 30. Your Definition of "Backend + Frontend Complete"

You are done with your core job when this works:

``` text
                  DOCTOR
                    |
                    v
              Login
                    |
                    v
             Select Patient
                    |
                    v
            Upload Fundus
                    |
                    v
              Image Check
                    |
                    v
              AI Inference
                    |
                    v
        +-----------+-----------+
        |           |           |
        v           v           v
     DR Level    Grad-CAM    Lesions
        |           |           |
        +-----------+-----------+
                    |
                    v
             Screening Result
                    |
             +------+------+
             |             |
             v             v
          Monitor        Refer
                           |
                           v
                    Doctor Review
                           |
                           v
                    Patient History
                           |
                           v
                     Final Report
```

That is your **actual product**.

Your friend's ML model is one component inside it.

------------------------------------------------------------------------

# 31. The Most Important Mental Model

Do not think:

> **"My friend is building the AI and I am building the website."**

Think:

> **"My friend is building the intelligence engine. I am building the
> healthcare application that turns that intelligence into a usable
> screening workflow."**

That means your work is responsible for making the ML model:

**usable → accessible → explainable → trackable → reviewable →
deployable.**

The final SIH system should therefore be presented as a **complete
screening platform**, not as a CNN with a web interface.
