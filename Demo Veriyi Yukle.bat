@echo off
chcp 65001 >nul
title Questo - Demo Veri
color 0E

echo.
echo  ╔════════════════════════════════════════════╗
echo  ║       Demo veri yukleniyor...              ║
echo  ╚════════════════════════════════════════════╝
echo.
echo  Bu komut:
echo   • 4 kategori
echo   • 28 urun
echo   • 20 masa (M1-M20)
echo   olusturur.
echo.
echo  Emulator acik olmali! Once 'Questo'yu Baslat.bat' calisir olmali.
echo.

cd /d "%~dp0"
call npm run seed

echo.
echo  Tamamlandi. Bu pencereyi kapatabilirsiniz.
pause
