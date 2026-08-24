@echo off
title CV. MASTER CIGARETTES - POS & Financial Journal
echo ========================================================
echo   CV. MASTER CIGARETTES - JURNAL & POS REAL-TIME
echo ========================================================
echo.
echo Menjalankan server aplikasi...
cd /d "%~dp0\backend"
start http://localhost:5000
node server.js
pause
