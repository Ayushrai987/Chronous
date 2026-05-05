@echo off
echo =========================================
echo    PROJECT CHRONOS - CLINICAL OS
echo =========================================

echo 🔍 Cleaning up old sessions...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM python.exe /T 2>nul

echo 🚀 Starting AI Engine (Backend)...
:: Try python, then python3, then py
start "Chronos Backend" cmd /k "cd backend && (python -m uvicorn app.main:app --port 8000 || python3 -m uvicorn app.main:app --port 8000 || py -m uvicorn app.main:app --port 8000 || echo ERROR: Could not start Python. Please ensure Python is installed and in your PATH.)"

echo 🖥️ Starting Dashboard (Frontend)...
start "Chronos Dashboard" cmd /k "cd frontend && npm run dev"

echo.
echo =========================================
echo [OK] Startup sequence initiated.
echo 1. Check the 'Chronos Backend' window for errors.
echo 2. Once ready, visit: http://localhost:3000
echo =========================================
echo.
pause
