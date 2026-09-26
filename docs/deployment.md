# Deployment & Production Setup

This guide details deployment options for **DRscan** in primary health centres and district hospitals.

## Option 1: Quick Local Development (Without Docker)

### 1. Backend
```bash
cd backend
# Create virtual environment & install dependencies
uv venv .venv
uv pip install -r requirements.txt

# Initialize database & seed demo patients with sample fundus images
$env:PYTHONPATH="."
.\.venv\Scripts\python app/db/init_db.py

# Start FastAPI server on port 8000
.\.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# Application will run on http://localhost:5173 with proxy to backend
```

---

## Option 2: Production Containerized Deployment (Docker Compose)

Run the full stack with PostgreSQL database:
```bash
docker compose up --build -d
```
Services started:
- `backend`: FastAPI Python server at `http://localhost:8000`
- `frontend`: Nginx serving production React app at `http://localhost:3000`
- `db`: PostgreSQL 16 database at `localhost:5432`

---

## Rural Offline PHC Deployment Architecture
In rural areas with intermittent cellular or satellite connectivity:
1. Deploy the backend and frontend locally on a lightweight rugged edge PC or laptop at the PHC.
2. The technician activates **Rural Offline Mode** via the navigation bar.
3. Screenings are stored locally in the embedded SQLite database (`PENDING SYNC`).
4. When connectivity is restored or upon returning to the district hub, click **Sync** to automatically batch-upload records, Grad-CAM heatmaps, and images to the central district tele-ophthalmology repository.
