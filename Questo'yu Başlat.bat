@echo off
chcp 65001 >nul
title Questo - Kontrol Paneli
color 06

echo.
echo  ╔════════════════════════════════════════════╗
echo  ║      Questo Coffea Co. baslatiliyor...     ║
echo  ╚════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo  • Sunucu yeni pencerede aciliyor...
start "Questo Sunucu" cmd /k "chcp 65001 >nul && npm run dev:all"

echo  • Hazir olmasini bekliyoruz (20 saniye)...
timeout /t 20 /nobreak >nul

start http://localhost:3000

:menu
cls
echo.
echo  ╔════════════════════════════════════════════╗
echo  ║         Questo Kontrol Paneli              ║
echo  ╚════════════════════════════════════════════╝
echo.
echo   [1]  Demo veri yukle
echo   [2]  Tarayici ac  (localhost:3000)
echo   [3]  Sunucuyu durdur ve cik
echo   [4]  Sadece cik  (sunucu calismaya devam eder)
echo.
set /p "choice=  Seciminiz: "

if "%choice%"=="1" goto seed
if "%choice%"=="2" goto browser
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto quit
goto menu

:seed
echo.
echo  Demo veri yukleniyor...
call npm run seed
echo.
pause
goto menu

:browser
start http://localhost:3000
goto menu

:stop
echo.
echo  Durduruluyor...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM java.exe >nul 2>&1
echo  Tum islemler durduruldu.
timeout /t 2 /nobreak >nul
exit /b

:quit
exit /b
