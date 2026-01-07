@echo off
title OTOMATISASI PUSH KE GITHUB
color 0A

echo ========================================================
echo   SISTEM DEPLOY OTOMATIS - LP3I COURSE SYSTEM
echo ========================================================
echo.

:: 1. Add Changes
echo [1/3] Menyiapkan file baru...
git add .
echo Berhasil ditambahkan.
echo.

:: 2. Commit
echo [2/3] Menyimpan perubahan lokal...
set /p commit_msg="Tulis pesan update (atau tekan ENTER untuk otomatis): "

:: Jika kosong, gunakan timestamp
if "%commit_msg%"=="" set commit_msg=Auto-Update %date% %time%

git commit -m "%commit_msg%"
echo.

:: 3. Push
echo [3/3] Mengirim ke GitHub...
git push origin main

echo.
echo ========================================================
echo   SUKSES! Kode terkirim. GitHub Actions sedang bekerja.
echo   Silakan cek website Anda dalam 1-2 menit.
echo ========================================================
echo.
pause
