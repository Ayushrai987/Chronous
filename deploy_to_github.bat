@echo off
echo ======================================================
echo   🚀 Project Chronos — GitHub Deployment Script
echo ======================================================
echo.

echo [1/4] Initializing Local Repository...
git init

echo [2/4] Staging Files (using root .gitignore)...
git add .

echo [3/4] Creating Initial Commit...
git commit -m "feat: High-Fidelity Clinical OS - Added Deceased Audit, Hardware Failure Engine, and 108 Patient Cohort"

echo [4/4] Connecting to Remote & Pushing to Main...
git branch -M main
git remote add origin https://github.com/Ayushrai987/Chronous
git push -u origin main --force

echo.
echo ======================================================
echo   ✅ Deployment Complete! 
echo   View your code at: https://github.com/Ayushrai987/Chronous
echo ======================================================
pause
