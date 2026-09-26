@echo off
echo Starting DRscan FastAPI Backend on http://localhost:8000 ...
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
