@echo off
chcp 65001 >nul
setlocal enableextensions enabledelayedexpansion
title Questo - Baslatiliyor...
color 06
cd /d "%~dp0"

set "QUESTO_URL=http://localhost:3000"
set "LOG=logs"

echo.
echo   Questo baslatiliyor...
echo.

rem [1/5] Portlari temizle
echo   [1/5] Portlar temizleniyor...
call npm run kill-ports

rem Onceki periodic yedek instance'ini durdur (wmic yerine Get-CimInstance)
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*yedek-periodic.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

rem Logs klasoru + eski logu temizle
if not exist "%LOG%" mkdir "%LOG%"
for %%f in (emulator.log nextjs.log seed.log yedek.log) do (
    if exist "%LOG%\%%f" del /q "%LOG%\%%f"
)

rem [2/5] Emulator (gizli pencere, vbs launcher)
echo   [2/5] Emulator baslatiliyor (gizli, log: %LOG%\emulator.log)...
wscript "%~dp0scripts\gizli-calistir.vbs" "emulator.log" "npm run emulators"

rem [3/5] Emulator portlarini bekle (firestore 8080, auth 9099) - max 90 sn
echo   [3/5] Emulator hazir olana kadar bekleniyor...
set /a emu_sure=0
:bekle_emu
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',8080)).Close();(New-Object Net.Sockets.TcpClient('127.0.0.1',9099)).Close();exit 0}catch{exit 1}" >nul 2>&1
if errorlevel 1 (
    set /a emu_sure+=2
    if !emu_sure! geq 90 (
        echo.
        echo   HATA: Emulator 90 saniye icinde baslamadi.
        echo   Log: %LOG%\emulator.log
        pause
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto bekle_emu
)

rem [4/5] Demo veri yukle
echo   [4/5] Demo veri yukleniyor...
call npm run seed > "%LOG%\seed.log" 2>&1

rem [5/5] Next.js (gizli pencere)
echo   [5/5] Next.js baslatiliyor (gizli, log: %LOG%\nextjs.log)...
wscript "%~dp0scripts\gizli-calistir.vbs" "nextjs.log" "npm run dev"

rem Periodic yedek scripti (15 dk'da bir export + gunluk zip)
echo   [+]   Periodic yedek scripti baslatiliyor (log: %LOG%\yedek.log)...
wscript "%~dp0scripts\gizli-calistir.vbs" "yedek.log" "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\yedek-periodic.ps1"

rem Next.js portunu bekle (3000) - max 60 sn
set /a next_sure=0
:bekle_next
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',3000)).Close();exit 0}catch{exit 1}" >nul 2>&1
if errorlevel 1 (
    set /a next_sure+=2
    if !next_sure! geq 60 (
        echo.
        echo   HATA: Next.js 60 saniye icinde baslamadi.
        echo   Log: %LOG%\nextjs.log
        pause
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto bekle_next
)

rem Tarayiciyi ac - Chrome onceligi, Edge fallback, son care: shell URL handler
set "TARAYICI=?"
set "CHROME_X64=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME_X86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "EDGE_X86=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "EDGE_X64=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if exist "%CHROME_X64%" (
    start "" "%CHROME_X64%" "%QUESTO_URL%"
    set "TARAYICI=Chrome"
) else if exist "%CHROME_X86%" (
    start "" "%CHROME_X86%" "%QUESTO_URL%"
    set "TARAYICI=Chrome"
) else if exist "%EDGE_X86%" (
    start "" "%EDGE_X86%" "%QUESTO_URL%"
    set "TARAYICI=Edge"
) else if exist "%EDGE_X64%" (
    start "" "%EDGE_X64%" "%QUESTO_URL%"
    set "TARAYICI=Edge"
) else (
    rundll32 url.dll,FileProtocolHandler %QUESTO_URL%
    set "TARAYICI=Default"
)

rem Son ekran
cls
title Questo - Calisiyor
color 0A
echo.
echo   Questo hazir!  ^>  %QUESTO_URL%
echo.
echo   Tarayici:   !TARAYICI!   (acilmadiysa URL'i manuel acin)
echo   Loglar:     %LOG%\emulator.log  /  %LOG%\nextjs.log  /  %LOG%\yedek.log
echo   Durdurmak:  Questo'yu Durdur.bat
echo.
echo   Bu pencere 5 saniye sonra otomatik kapanacak...
timeout /t 5 /nobreak >nul
endlocal
exit /b 0
