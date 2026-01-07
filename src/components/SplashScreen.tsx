import React, { useEffect, useState } from 'react';
import landingImg from '../assets/images/landingutama.jpg';
import logoImg from '../assets/images/logo.png';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [loadingStarted, setLoadingStarted] = useState(false);
  const [opacity, setOpacity] = useState(100); // Untuk efek fade out akhir

  useEffect(() => {
    // Phase 1: Jeda 3 Detik (Display Logo & Background Only)
    const startDelay = setTimeout(() => {
      setLoadingStarted(true);
    }, 3000);

    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    // Phase 2: Loading Process (0% -> 100%)
    if (loadingStarted) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // Phase 3: Selesai, mulai fade out
            setTimeout(() => setOpacity(0), 500); 
            setTimeout(onFinish, 1500); // Tunggu animasi fade out selesai baru unmount
            return 100;
          }
          // Kecepatan loading (random biar terasa organik)
          return prev + Math.floor(Math.random() * 5) + 1;
        });
      }, 50); // Kecepatan update frame

      return () => clearInterval(interval);
    }
  }, [loadingStarted, onFinish]);

  if (opacity === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ease-out"
      style={{ opacity: opacity / 100 }}
    >
      {/* BACKGROUND IMAGE - Full Screen */}
      <div className="absolute inset-0 z-0">
        <img 
          src={landingImg} 
          alt="Background" 
          className="w-full h-full object-cover opacity-60 scale-105 animate-[pulse_10s_ease-in-out_infinite]"
          onError={(e) => {
            // Fallback Mewah jika gambar belum diupload
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-slate-900', 'via-blue-900', 'to-black');
          }}
        />
        {/* Overlay Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
      </div>

      {/* KONTEN TENGAH */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-8">
        
        {/* Logo Animation */}
        <div className="mb-12 relative">
           <div className="absolute inset-0 bg-blue-500 blur-[60px] opacity-20 rounded-full animate-pulse"></div>
           <img src={logoImg} alt="LP3I" className="h-24 w-auto relative drop-shadow-2xl" />
        </div>

        {/* Loading Bar Container */}
        <div className={`w-full transition-all duration-1000 ${loadingStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex justify-between text-xs font-bold text-blue-200 mb-2 tracking-widest uppercase">
            <span>Memuat Sistem</span>
            <span>{Math.min(progress, 100)}%</span>
          </div>
          
          {/* The Bar */}
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-white shadow-[0_0_15px_rgba(56,189,248,0.8)] transition-all duration-100 ease-out relative"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              {/* Kilauan di ujung bar */}
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white blur-[2px]"></div>
            </div>
          </div>
          
          <p className="text-center text-white/40 text-[10px] mt-4 tracking-widest animate-pulse">
            MENYIAPKAN DATA BASE & DASHBOARD...
          </p>
        </div>
      </div>

      {/* FOOTER CREDITS */}
      <div className="absolute bottom-10 z-10 text-center space-y-2">
         <p className="text-white/80 font-light text-sm tracking-wide">
           Dikembangkan oleh: <span className="font-bold text-white">Ahdi Yourse</span>
         </p>
         <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto"></div>
         <p className="text-white/50 text-xs tracking-widest uppercase">
           Didedikasikan untuk LP3I College Indramayu
         </p>
      </div>
    </div>
  );
};
