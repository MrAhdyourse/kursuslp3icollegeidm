import { useState, useEffect } from 'react';

/**
 * Custom Hook untuk mendeteksi apakah pengguna menggunakan perangkat mobile/tablet.
 * Breakpoint diatur pada 768px (standar iPad/Tablet Portrait).
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // Cek awal saat render pertama (SSR safe check)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Dengarkan perubahan ukuran layar (misal: rotasi HP)
    window.addEventListener('resize', checkMobile);
    
    // Panggil sekali untuk inisialisasi
    checkMobile();

    // Bersihkan listener saat unmount
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};
