@echo off
chcp 65001 >nul
setlocal enableextensions enabledelayedexpansion
title Questo - Durduruluyor
color 04
cd /d "%~dp0"

REM Self-elevate (UAC) - Baslat'tan gelen prosesler admin yetkili olabilir;
REM normal user'dan taskkill yapilamaz. Buradan yonetici yetki iste.
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo.
    echo   Yonetici yetkisi gerekiyor - UAC iletisinde "Evet" deyin.
    timeout /t 2 /nobreak >nul
    powershell -NoProfile -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','\"%~f0\"' -Verb RunAs"
    exit /b
)

echo.
echo   Questo durduruluyor...
echo.

REM [1/4] Periodic yedek scripti (sadece bu, baska powershell'lere dokunma)
echo   [1/4] Periodic yedek scripti kapatiliyor...
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*yedek-periodic.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

REM [2/4] Adisyonlari diske yaz (emulator hala calisirken kapanis yedegi al).
REM      Force-kill --export-on-exit'i tetiklemedigi icin bu adim adisyonlarin
REM      kaybolmasini onler. Emulator zaten durmussa sessizce gecer.
echo   [2/4] Adisyonlar kaydediliyor (kapanis yedegi)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kapanis-yedek.ps1"

REM [3/4] Next.js (node.exe)
echo   [3/4] Next.js (node) kapatiliyor...
taskkill /F /IM node.exe >nul 2>&1

REM [4/4] Emulator (java.exe)
echo   [4/4] Emulator (java) kapatiliyor...
taskkill /F /IM java.exe >nul 2>&1

REM Dogrulama - portlar gercekten serbest mi?
timeout /t 2 /nobreak >nul
set "DURUM=Tum portlar bos"
for %%p in (3000 8080 9099) do (
    powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',%%p)).Close();exit 0}catch{exit 1}" >nul 2>&1
    if not errorlevel 1 set "DURUM=UYARI: bazi portlar hala dolu (3000/8080/9099)"
)

echo.
echo   !DURUM!
echo.
timeout /t 3 /nobreak >nul
endlocal
exit /b 0
