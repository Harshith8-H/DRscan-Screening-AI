# API Reference & Endpoints

Base URL: `http://localhost:8000/api`

## 1. Authentication (`/api/auth`)
- `POST /api/auth/login`
  - Body: `{"username": "dr.priya", "password": "doctor123"}`
  - Response: `{ "access_token": "...", "token_type": "bearer", "user": { ... } }`
- `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Response: Current user profile
- `GET /api/auth/demo-users`
  - Returns pre-configured demo users (Doctor & Operator) for instant persona switching.

## 2. Patients (`/api/patients`)
- `GET /api/patients?search=<query>`
  - List registered patients with screening count and search filter.
- `POST /api/patients`
  - Body: Patient registration fields (`name`, `age`, `sex`, `diabetes_duration_years`, `village_or_phc`, `hba1c`, etc.)
- `GET /api/patients/{patient_id}`
  - Fetch patient details.
- `GET /api/patients/{patient_id}/history`
  - Returns longitudinal screening history, DR grade progression timeline, and progression alerts.

## 3. Screenings (`/api/screenings`)
- `GET /api/screenings`
  - Query parameters: `patient_id`, `status`, `referable_only`, `limit`.
- `GET /api/screenings/dashboard-stats`
  - Aggregate metrics: total screenings, referable cases, pending reviews, quality pass rate, grade distribution.
- `GET /api/screenings/samples/list`
  - Preset clinical sample fundus images for 1-click testing.
- `POST /api/screenings`
  - Multipart Form: `patient_id`, `eye_side` ("RIGHT" | "LEFT"), `fundus_image` (File), `is_offline_queued` (bool).
  - Automatically runs quality check, triggers Explainable AI inference, saves Grad-CAM and lesion masks, and returns complete findings.
- `POST /api/screenings/use-sample`
  - 1-click test using preset fundus sample.
- `GET /api/screenings/{screening_id}`
  - Detailed screening output with images, probabilities, lesion counts, and doctor reviews.

## 4. Doctor Reviews (`/api/reviews`)
- `GET /api/reviews/pending`
  - Worklist of referable and flagged screenings awaiting ophthalmologist confirmation.
- `POST /api/reviews`
  - Body: `{"screening_id": "SCR-1003", "decision": "CONFIRMED", "final_dr_level": 3, "clinical_notes": "...", "referral_facility": "..."}`

## 5. Reports (`/api/reports`)
- `GET /api/reports/{screening_id}`
  - Structured clinical screening summary.
- `GET /api/reports/{screening_id}/download`
  - Streams high-resolution printable PDF report with fundus photos, Grad-CAM, lesion breakdown, and doctor sign-off.

## 6. Simulink Rural Capacity Simulation (`/api/simulation`)
- `POST /api/simulation/run`
  - Body: `SimulationParams` (`patients_per_day`, `camera_count`, `bandwidth_mbps`, `doctor_count`, etc.)
  - Returns completion rate, queue bottlenecks, utilization percentages, and recommendations.

## 7. Rural Offline Sync (`/api/sync`)
- `GET /api/sync/status`
  - Returns pending offline screenings count.
- `POST /api/sync/batch`
  - Batch synchronizes locally queued screenings to the district server.
