@echo off
chcp 65001 >nul
title Questo - Baslatiliyor...
color 06
cd /d "%~dp0"

echo.
echo  Questo baslatiliyor...
echo.

echo  [1/5] Portlar temizleniyor...
npm run kill-ports

echo  [2/5] Emulator baslatiliyor...
start "Questo - Emulator" cmd /k npm run emulators

echo  [3/5] Emulator hazir olana kadar bekleniyor...
:bekle_emu
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',8080)).Close();exit 0}catch{exit 1}" >nul 2>&1
if errorlevel 1 (timeout /t 2 /nobreak >nul & goto bekle_emu)

echo  [4/5] Demo veri yukleniyor...
npm run seed

echo  [5/5] Next.js baslatiliyor...
start "Questo - Next.js" cmd /k npm run dev

:bekle_next
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',3000)).Close();exit 0}catch{exit 1}" >nul 2>&1
if errorlevel 1 (timeout /t 2 /nobreak >nul & goto bekle_next)

start http://localhost:3000

cls
title Questo - Calisiyor
color 0A
echo.
echo  Questo hazir!  ^>  localhost:3000
echo.
echo  Durdurmak icin: Questo'yu Durdur.bat
echo.
pause
