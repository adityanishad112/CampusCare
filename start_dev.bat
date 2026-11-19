@echo off
echo =======================================================
echo   Starting CampusCare - Local Development Environment
echo =======================================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3 is not found in PATH! Please install Python 3.10+.
    pause
    exit /b 1
)

:: Check for Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH! Please install Node 18+.
    pause
    exit /b 1
)

echo [1/3] Checking ML model artifacts and Database...
if not exist "backend\ml\model_artifacts\vectorizer.joblib" (
    echo Training ML Classifier model...
    cd backend
    python ml\data\generate_dataset.py
    python ml\train_classifier.py
    python ml\evaluate_classifier.py
    cd ..
) else (
    echo ML Classifier artifacts found.
)

if not exist "backend\campuscare.db" (
    echo Seeding demo database...
    cd backend
    python scripts\seed_data.py
    cd ..
) else (
    echo Database found.
)

if not exist "frontend\node_modules" (
    echo Installing frontend packages...
    cd frontend
    call npm install
    cd ..
)

echo.
echo [2/3] Starting CampusCare Backend on http://localhost:8000 ...
start "CampusCare Backend" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --reload --port 8000"

echo.
echo [3/3] Starting CampusCare Frontend on http://localhost:5173 ...
start "CampusCare Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =======================================================
echo CampusCare is launching!
echo Backend Swagger API: http://localhost:8000/docs
echo Frontend Portal:     http://localhost:5173
echo.
echo Demo Accounts:
echo   - Admin:      admin@campuscare.edu / Admin@123
echo   - IT Staff:   it_staff@campuscare.edu / Staff@123
echo   - Student:    alex.student@campuscare.edu / Student@123
echo =======================================================
