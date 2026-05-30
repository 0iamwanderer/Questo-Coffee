@echo off
chcp 65001 >nul
setlocal enableextensions
title Questo - Internet engelini kaldir
color 06

rem Proje kokune gec (bu script scripts\ altinda)
cd /d "%~dp0.."

echo.
echo   Questo - Internet engeli (Mark of the Web) kaldiriliyor...
echo   Klasor: %CD%
echo.

rem Proje kokundeki TUM dosyalardan Zone.Identifier (internet isareti) kaldirilir.
rem Bu islem dosya icerigini DEGISTIRMEZ; yalnizca Windows'un ekledigi gizli
rem meta veriyi siler. Yonetici yetkisi GEREKMEZ.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath '%CD%' -Recurse -File | Unblock-File"

echo.
echo   Tamam. Artik 'Questo'yu Baslat.bat' ve scripts\*.vbs dosyalari
echo   Windows tarafindan 'guvenli olmayabilir' diye engellenmemeli.
echo.
echo   Bu pencere 5 saniye sonra kapanacak...
timeout /t 5 /nobreak >nul
endlocal
exit /b 0
