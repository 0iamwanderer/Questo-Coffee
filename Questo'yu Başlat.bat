@echo off
chcp 65001 >nul
title Questo - Baslatiliyor...
color 06

echo.
echo  Questo baslatiliyor...
echo.

cd /d "%~dp0"

echo  [1/4] Sunucu yeni pencerede aciliyor...
start "Questo Sunucu" cmd /k "chcp 65001 >nul && npm run dev:all"

echo  [2/4] Emulator hazir olana kadar bekleniyor...
:bekle_emu
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',8080)).Close();exit 0}catch{exit 1}" >nul 2>&1
if errorlevel 1 ( timeout /t 2 /nobreak >nul & goto bekle_emu )

echo  [3/4] Demo veri yukleniyor...
call npm run seed

echo.
echo  [4/4] Uygulama hazir olana kadar bekleniyor...
:bekle_next
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',3000)).Close();exit 0}catch{exit 1}" >nul 2>&1
if errorlevel 1 ( timeout /t 2 /nobreak >nul & goto bekle_next )

start http://localhost:3000

cls
title Questo - Calisiyor
color 0A
echo.
echo  ╔════════════════════════════════════════════╗
echo  ║     Questo hazir!  →  localhost:3000       ║
echo  ╚════════════════════════════════════════════╝
echo.
echo   Sunucu arka planda calisiyor.
echo   Bu pencereyi kapatabilirsiniz, sunucu devam eder.
echo.
echo   Tamamen durdurmak icin: Questo'yu Durdur.bat
echo.
pause
