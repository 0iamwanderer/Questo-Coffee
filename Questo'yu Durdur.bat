@echo off
chcp 65001 >nul
title Questo - Durduruluyor
color 04

REM ===== Self-elevate (UAC) =====
REM Başlat.bat yönetici olarak çalışmışsa node/java prosesleri admin
REM yetkili olur; normal user'dan taskkill yapılamaz. Buradan UAC iste.
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo.
    echo  Yonetici yetkisi gerekiyor — UAC iletisinde "Evet" deyin.
    timeout /t 2 /nobreak >nul
    powershell -NoProfile -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','\"%~f0\"' -Verb RunAs"
    exit /b
)

echo.
echo  ╔════════════════════════════════════════════╗
echo  ║          Questo durduruluyor...            ║
echo  ╚════════════════════════════════════════════╝
echo.

REM Periodic yedek scriptini sonlandir (sadece bu scripti, baska powershell'lere dokunma)
echo  • Periodic yedek scripti kapatiliyor...
wmic process where "name='powershell.exe' and CommandLine like '%%yedek-periodic.ps1%%'" delete >nul 2>&1

REM Node.js ve Java (emulator) işlemlerini sonlandır
echo  • Next.js (node) kapatiliyor...
taskkill /F /IM node.exe >nul 2>&1

echo  • Emulator (java) kapatiliyor...
taskkill /F /IM java.exe >nul 2>&1

echo.
echo  ✓ Tum islemler durduruldu.
echo.
timeout /t 3 /nobreak >nul
