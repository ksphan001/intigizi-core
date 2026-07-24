@echo off
title Switch to Deploy Environment
echo ==================================================
echo   Beralih ke Lingkungan Deploy / Produksi
echo ==================================================
echo.
set /p domain="Masukkan Domain API Kustom (Contoh: api.mydomain.com) atau tekan ENTER untuk default: "

echo.
if "%domain%"=="" (
    node "%~dp0switch-env.cjs" deploy
) else (
    node "%~dp0switch-env.cjs" deploy %domain%
)

echo.
pause
