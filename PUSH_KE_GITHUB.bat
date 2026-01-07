@echo off
color 0A
title AUTO DEPLOY - LP3I INDRAMAYU SYSTEM

echo ========================================================
echo    SISTEM DEPLOYMENT OTOMATIS - KURSUS LP3I
echo ========================================================
echo.

:: 1. Cek Status Git
echo [1/4] Memeriksa status file...
git status
echo.

:: 2. Input Pesan Commit
set /p commitMsg="Masukkan Pesan Commit (contoh: Update sertifikat): "
if "%commitMsg%"=="" set commitMsg="Update rutin sistem"

:: 3. Eksekusi Git
echo.
echo [2/4] Menambahkan semua perubahan...
git add .

echo.
echo [3/4] Menyimpan (Commit) dengan pesan: "%commitMsg%"...
git commit -m "%commitMsg%"

echo.
echo [4/4] Mengirim ke GitHub (Push)...
git push origin main

echo.
echo ========================================================
if %ERRORLEVEL% EQU 0 (
    echo    SUKSES! PERUBAHAN TELAH TERKIRIM KE GITHUB.
    echo    Tunggu beberapa menit, GitHub Pages akan update otomatis.
) else (
    echo    GAGAL! Cek koneksi internet atau konflik file.
    color 0C
)
echo ========================================================
echo.
pause