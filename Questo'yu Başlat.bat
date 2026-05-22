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

rem Logs klasoru ve onceki loglar
if not exist "logs" mkdir "logs"
if exist "logs\emulator.log" del /q "logs\emulator.log"
if exist "logs\nextjs.log"   del /q "logs\nextjs.log"
if exist "logs\seed.log"     del /q "logs\seed.log"

echo  [2/5] Emulator baslatiliyor (gizli, log: logs\emulator.log)...
wscript "%~dp0scripts\gizli-calistir.vbs" "emulator.log" "npm run emulators"

echo  [3/5] Emulator hazir olana kadar bekleniyor...
set /a emu_sure=0
:bekle_emu
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',8080)).Close();(New-Object Net.Sockets.TcpClient('127.0.0.1',9099)).Close();exit 0}catch{exit 1}" >nul 2>&1
if errorlevel 1 (
    set /a emu_sure+=2
    if %emu_sure% geq 90 (
        echo.
        echo  HATA: Emulator 90 saniye icinde baslayamadi.
        echo  Log: logs\emulator.log
        pause
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto bekle_emu
)

echo  [4/5] Demo veri yukleniyor...
call npm run seed > "logs\seed.log" 2>&1

echo  [5/5] Next.js baslatiliyor (gizli, log: logs\nextjs.log)...
wscript "%~dp0scripts\gizli-calistir.vbs" "nextjs.log" "npm run dev"

set /a next_sure=0
:bekle_next
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',3000)).Close();exit 0}catch{exit 1}" >nul 2>&1
if errorlevel 1 (
    set /a next_sure+=2
    if %next_sure% geq 60 (
        echo.
        echo  HATA: Next.js 60 saniye icinde baslayamadi.
        echo  Log: logs\nextjs.log
        pause
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto bekle_next
)

rem Default browser association bozulmus PC'lerde "Uygulama bulunamadi"
rem hatasi gelmesin diye Edge -> Chrome bilinen yollarini, son care olarak
rem default URL handler'i deniyoruz.
set "QUESTO_URL=http://localhost:3000"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME_X86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if exist "%EDGE%" (
    start "" "%EDGE%" "%QUESTO_URL%"
) else if exist "%CHROME%" (
    start "" "%CHROME%" "%QUESTO_URL%"
) else if exist "%CHROME_X86%" (
    start "" "%CHROME_X86%" "%QUESTO_URL%"
) else (
    start "" "%QUESTO_URL%"
)

cls
title Questo - Calisiyor
color 0A
echo.
echo  Questo hazir!  ^>  localhost:3000
echo.
echo  Loglar:     logs\emulator.log  /  logs\nextjs.log
echo  Durdurmak:  Questo'yu Durdur.bat
echo.
echo  Bu pencere 5 saniye sonra otomatik kapanacak...
timeout /t 5 /nobreak >nul
exit /b 0
