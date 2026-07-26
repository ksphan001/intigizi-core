@echo off
title Switch to Deploy - IntiGizi Dapur
echo ==================================================
echo   IntiGizi Dapur - Beralih ke Lingkungan Deploy
echo ==================================================
echo.
echo  Konfigurasi domain diambil dari: intigizi.deploy.json
echo  Untuk mengganti domain, masukkan root domain di bawah.
echo.
set /p domain="Root Domain (Contoh: intigizi.ksphan.id) atau tekan ENTER untuk pakai konfigurasi saat ini: "

echo.
if "%domain%"=="" (
    node "%~dp0switch-env.cjs" deploy
) else (
    node "%~dp0switch-env.cjs" deploy %domain%
)

echo.
pause
