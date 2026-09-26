# DRscan — Explainable AI for Diabetic Retinopathy Screening in Rural India

[![SIH Problem Statement](https://img.shields.io/badge/SIH_2026-SIH26038-teal)](https://sih.gov.in)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An end-to-end, medical-grade tele-ophthalmology screening platform tailored for deployment in rural Primary Health Centres (PHCs) and Community Health Centres (CHCs) across India.

The platform accepts retinal fundus photographs, subjects them to an automated **Image Quality Gate**, triggers deep **Explainable AI inference (Grad-CAM heatmaps & lesion segmentation)**, provides tele-ophthalmologist triage reviews, maintains **longitudinal progression history**, generates printable **clinical PDF reports**, and includes a **Simulink operational throughput simulator** to model rural screening bottlenecks.

---

## 🌟 Key Features

### 1. Automated Image Quality Gate
- Pre-inference validation checking sharpness (Laplacian variance), illumination uniformity, retinal disc presence, and flash glare.
- Flagged poor-quality captures prompt the PHC technician for immediate recapture, preventing erroneous AI classifications.

### 2. Multi-Modal Explainability Engine
- **Grad-CAM Activation Heatmaps**: Highlights pathological regions driving the network's diagnostic score (red/yellow hot-spots).
- **Lesion Segmentation Masks**: Color-coded microvascular pathology (Microaneurysms in Red, Blot Hemorrhages in Crimson, Hard Exudates in Yellow, and Cotton Wool Spots in Cyan).
- **Annotated Detections**: Anatomical bounding boxes identifying Optic Disc, Macular zone, and detected lesion clusters.
- Interactive opacity blending slider and multi-view comparison modes.

### 3. Clinical Referral Decision Layer
- Follows the International Clinical Diabetic Retinopathy (ICDR) 5-tier classification scale (Grade 0: No DR through Grade 4: Proliferative DR).
- Automated referral rules: Grades 2, 3, and 4 are flagged as **Referable DR** with urgency protocols (e.g. 48-hour tertiary referral for PDR).
- Clear clinical disclaimer: *AI-assisted screening triage — not a definitive automated diagnosis*.

### 4. Specialist Tele-Ophthalmology Portal
- Worklist for district ophthalmologists to inspect flagged screenings remotely.
- Actions: **Confirm**, **Modify (Override Grade)**, **Reject**, or **Request Tertiary Teleconsultation** with clinical notes and digital sign-off.

### 5. Longitudinal Progression Monitoring
- Patient timeline tracking DR severity over serial visits (e.g. 12 months ago: Grade 1 $\rightarrow$ 6 months ago: Grade 2 $\rightarrow$ Current: Grade 3).
- Automated **Progression Alerts** when rapid capillary degradation is detected between screenings.

### 6. Clinical PDF Report Generation
- One-click generation of official National Health Mission tele-ophthalmology PDF reports using ReportLab.
- Embeds patient demographics, fundus photo, Grad-CAM heatmap, lesion counts, clinical urgency, and specialist sign-off.

### 7. Rural Low-Connectivity & Offline Queue Mode
- Enables local offline operation at remote PHCs when cellular or satellite connectivity drops.
- Locally stored screenings (`PENDING SYNC`) can be batch-synchronized to the district hospital server with one click upon reconnection.

### 8. Simulink Operational Capacity Simulator
- Discrete-event capacity modeling of rural screening camps under constraints:
  - Fundus camera units
  - Imaging time per patient
  - Cellular/Satellite bandwidth (2G/3G/4G/Starlink)
  - District doctor availability and review time
- Diagnoses operational bottlenecks (**Camera Capacity**, **Telecom Uplink**, or **Doctor Shortage**) and provides engineering recommendations.

---

## 🏗️ Repository Architecture

```
DRscan/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # API Endpoints (Auth, Patients, Screenings, Reviews, Reports, Simulation, Sync)
│   │   ├── core/             # Configuration, JWT Security, Logging
│   │   ├── db/               # SQLAlchemy Engine, Database Seeder & Sample Generator
│   │   ├── models/           # User, Patient, Screening, AIResult, LesionResult, DoctorReview
│   │   ├── schemas/          # Pydantic Schemas strictly enforcing the ML Contract
│   │   ├── services/         # Image Quality, Explainable AI, PDF Report, and Simulink services
│   │   └── main.py           # Application Entrypoint
│   ├── uploads/              # Uploaded fundus images
│   ├── results/              # Generated Grad-CAM heatmaps, masks, and PDFs
│   ├── samples/              # Preset clinical fundus samples (Grades 0-4 + Poor Quality)
│   ├── tests/                # Pytest Test Suite
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile
│
├── frontend/                 # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Navbar with persona & connectivity switcher
│   │   ├── pages/            # Dashboard, NewScreening, AnalysisView, DoctorReview, PatientHistory, SimulationPortal
│   │   ├── services/         # API Client
│   │   └── types.ts          # TypeScript interfaces
│   ├── vite.config.ts        # Vite configuration with API reverse proxy
│   └── Dockerfile
│
├── ml/
│   └── integration/
│       ├── model_contract.json  # Frozen JSON schema defining ML input/output
│       └── README.md            # Guidelines for swapping ML models
│
├── simulink/
│   └── README.md             # Mathematical parameters for capacity simulation
│
├── docs/                     # Technical Documentation
│   ├── architecture.md       # Architecture diagrams and dataflow
│   ├── api.md                # REST API specifications
│   ├── ml-contract.md        # ML teammate handoff contract
│   └── deployment.md         # Deployment & Docker instructions
│
├── docker-compose.yml        # Full-stack containerization with PostgreSQL
├── .env.example              # Environment variables template
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+ (or `uv`)
- Node.js 18+ & npm

### 1. Start Backend
```bash
cd backend
# Create virtual environment and install packages
uv venv .venv
uv pip install -r requirements.txt

# Run database seeder (generates sample fundus images and longitudinal records)
$env:PYTHONPATH="."
.\.venv\Scripts\python app/db/init_db.py

# Launch FastAPI server
.\.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 👥 Pre-Configured Demo Accounts

| Persona | Username | Password | Role & Facility |
|---------|----------|----------|-----------------|
| **Dr. Priya Sharma** | `dr.priya` | `doctor123` | District Ophthalmologist, Civil Hospital |
| **Rajesh Kumar** | `operator.rajesh` | `operator123` | Screening Technician, Rampur Village PHC |

*You can seamlessly switch personas at any time using the dropdown in the top-right corner of the navigation bar.*

---

## 🧪 Testing the Complete Clinical Pipeline

1. **Dashboard**: Inspect overall cohort metrics, referable cases, and severity distributions.
2. **New Screening**:
   - Choose a patient (e.g. *Ramesh Patel* or *Mohammed Farooq*).
   - Click one of the **1-Click Clinical Test Samples** (e.g. *Grade 2 Moderate NPDR* or *Grade 4 PDR*).
   - Click **Run Explainable AI Screening Analysis**.
3. **Analysis View**:
   - Toggle between **Grad-CAM Heatmap**, **Lesion Mask**, and **Side-by-Side Comparison**.
   - Review detected biomarker counts (Microaneurysms, Hemorrhages, Exudates).
   - Click **Official Medical PDF** to view or download the ReportLab clinical report.
   - Enter clinical notes and click **Sign Off Doctor Tele-Review**.
4. **Patient History**: Inspect Ramesh Patel's longitudinal trajectory showing progression from Grade 1 to Grade 3 across serial visits.
5. **Simulink Simulation**: Test throughput under 2G network bandwidth vs. high-volume patient surges.

---

## 🐳 Containerized Deployment (Docker Compose)

To run the entire platform with PostgreSQL in production:
```bash
docker compose up --build -d
```
Access points:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

---

## 📜 Regulatory & Clinical Disclaimer
This software is intended as an AI-assisted decision support system for screening and referral prioritization in rural healthcare settings. It does not replace clinical judgment or comprehensive dilated eye examinations by a certified ophthalmologist.
