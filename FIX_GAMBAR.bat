@echo off
echo MEMPERBAIKI MASALAH NAMA FILE GAMBAR...
echo.

:: 1. Hapus cache git untuk file gambar (agar dia lupa nama lamanya)
git rm --cached src/assets/images/landingutama.JPG
git rm --cached src/assets/images/landingutama.jpg

:: 2. Tambahkan ulang file yang sekarang ada (yang sudah lowercase)
git add src/assets/images/landingutama.jpg

:: 3. Commit dan Push
git commit -m "Fix: Force rename image to lowercase for Linux/GitHub Actions"
git push origin main

echo.
echo SELESAI. Silakan cek GitHub Actions.
pause
