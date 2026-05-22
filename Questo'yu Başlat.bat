@echo off
chcp 65001 >nul
title Questo - Baslatiliyor...
color 06
cd /d "%~dp0"

echo.
echo  Questo baslatiliyor...
echo.

echo  [1/5] Portlar temizleniyor...
call npm run kill-ports

echo  [2/5] Emulator baslatiliyor...
start "Questo - Emulator" cmd /k "cd /d "%~dp0" && npm run emulators"

echo  [3/5] Emulator hazir olana kadar bekleniyor...
set /a emu_sure=0
:bekle_emu
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',8080)).Close();(New-Object Net.Sockets.TcpClient('127.0.0.1',9099)).Close();exit 0}catch{exit 1}" >nul 2>&1
if errorlevel 1 (
    set /a emu_sure+=2
    if %emu_sure% geq 90 (
        echo.
        echo  HATA: Emulator 90 saniye icinde baslayamadi.
        echo  "Questo - Emulator" penceresini kontrol edin.
        pause
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto bekle_emu
)

echo  [4/5] Demo veri yukleniyor...
call npm run seed

echo  [5/5] Next.js baslatiliyor...
start "Questo - Next.js" cmd /k "cd /d "%~dp0" && npm run dev"

set /a next_sure=0
:bekle_next
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',3000)).Close();exit 0}catch{exit 1}" >nul 2>&1
if errorlevel 1 (
    set /a next_sure+=2
    if %next_sure% geq 60 (
        echo.
        echo  HATA: Next.js 60 saniye icinde baslayamadi.
        echo  "Questo - Next.js" penceresini kontrol edin.
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
echo  Questo hazir!  ^>  localhost:3000
echo.
echo  Durdurmak icin: Questo'yu Durdur.bat
echo.
pause
