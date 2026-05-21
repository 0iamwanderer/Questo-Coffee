@echo off
chcp 65001 >nul
title Questo - Baslatiliyor...
color 06

echo.
echo  Questo baslatiliyor...
echo.

cd /d "%~dp0"

echo  [1/4] Sunucu yeni pencerede aciliyor...
start "Questo Sunucu" cmd /k "chcp 65001 >nul & npm run dev:all"

REM Yeni penceredeki kill-ports'un bitmesini bekle
echo        (5 saniye hazirlik suresi)
timeout /t 5 /nobreak >nul

echo  [2/4] Emulator hazir olana kadar bekleniyor...
set /a emu_sure=0
:bekle_emu
powershell -NoProfile -Command "try{$r=(Invoke-WebRequest 'http://127.0.0.1:4400/emulators' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop).StatusCode;exit ($r -ne 200)}catch{exit 1}" >nul 2>&1
if errorlevel 1 (
    set /a emu_sure+=2
    if %emu_sure% geq 90 (
        echo.
        echo  HATA: Emulator 90 saniye icinde baslayamadi.
        echo  "Questo Sunucu" penceresini kontrol edin.
        pause
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto bekle_emu
)

echo  [3/4] Demo veri yukleniyor...
call npm run seed

echo.
echo  [4/4] Uygulama hazir olana kadar bekleniyor...
set /a next_sure=0
:bekle_next
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',3000)).Close();exit 0}catch{exit 1}" >nul 2>&1
if errorlevel 1 (
    set /a next_sure+=2
    if %next_sure% geq 60 (
        echo.
        echo  HATA: Next.js 60 saniye icinde baslayamadi.
        echo  "Questo Sunucu" penceresini kontrol edin.
        pause
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto bekle_next
)

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
