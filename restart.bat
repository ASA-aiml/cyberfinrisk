@echo off
title CyberFinRisk — Restart
echo.
echo ================================================
echo   CyberFinRisk — Killing existing sessions...
echo ================================================

:: Kill any running Python (uvicorn) processes
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM python3.exe >nul 2>&1

:: Kill any running Node (Next.js) processes on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo   ✓ Old sessions killed.
echo.
echo ================================================
echo   Starting Backend (Uvicorn on :8000)...
echo ================================================

start "CyberFinRisk — Backend" /D "d:\Hobby projects\cyberfinrisk\backend" cmd /k ".\venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: Short delay to let backend start connecting to MongoDB before frontend spins up
timeout /t 3 /nobreak >nul

echo   ✓ Backend window launched.
echo.
echo ================================================
echo   Starting Frontend (Next.js on :3000)...
echo ================================================

start "CyberFinRisk — Frontend" /D "d:\Hobby projects\cyberfinrisk\frontend" cmd /k "npm run dev"

echo   ✓ Frontend window launched.
echo.
echo ================================================
echo   All done! Open http://localhost:3000
echo ================================================
echo.
pause
