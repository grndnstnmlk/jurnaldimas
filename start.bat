@echo off
title CV. MASTER CIGARETTES - POS dan Jurnal Keuangan
echo ========================================================
echo   CV. MASTER CIGARETTES - JURNAL & POS REAL-TIME
echo ========================================================
echo.

:: Pastikan Node.js ada di PATH
set "PATH=%PATH%;C:\Program Files\nodejs"

:: Masuk ke folder backend
cd /d "%~dp0\backend"

:: Cek apakah dependencies backend sudah terinstall
if not exist "node_modules\express" (
  echo [Info] Menginstall modul backend untuk pertama kali...
  call npm install
)

:: Cek apakah frontend sudah di-build
if not exist "..\frontend\dist\index.html" (
  echo [Info] Membangun antarmuka frontend...
  cd /d "%~dp0\frontend"
  call npm install
  call npm run build
  cd /d "%~dp0\backend"
)

echo.
echo [OK] Membuka aplikasi di browser...
start http://localhost:5000
echo [OK] Server POS & Realtime WS aktif di port 5000.
echo Tekan Ctrl+C untuk menghentikan server.
echo ========================================================
node server.js
pause
