import React, { useEffect, useState } from 'react';
import landingImg from '../assets/images/landingutama.jpg';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [loadingStarted, setLoadingStarted] = useState(false);
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    // Phase 1: Jeda 3 Detik Fokus ke Gambar
    const startDelay = setTimeout(() => {
      setLoadingStarted(true);
    }, 3000);

    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    if (loadingStarted) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setOpacity(0), 500); 
            setTimeout(onFinish, 1500);
            return 100;
          }
          return prev + Math.floor(Math.random() * 5) + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [loadingStarted, onFinish]);

  if (opacity === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050B14] transition-opacity duration-1000 ease-out"
      style={{ opacity: opacity / 100 }}
    >
      {/* 1. CINEMATIC IMAGE CENTERPIECE */}
      <div className="relative z-10 w-full max-w-4xl px-4 md:px-0 mb-12">
        {/* Glow Effect behind image */}
        <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-[3rem] opacity-50 animate-pulse"></div>
        
        <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-blue-900/20 group">
           <img 
            src={landingImg} 
            alt="LP3I College" 
            className="w-full h-auto max-h-[60vh] object-cover transform transition-transform duration-[10s] ease-in-out scale-100 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="h-64 flex items-center justify-center text-white font-bold bg-slate-800">IMAGE NOT FOUND</div>';
            }}
          />
          {/* Subtle Vignette Overlay on Image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          <div className="absolute bottom-6 left-6 text-white text-left">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-md">
              LP3I College Indramayu
            </h1>
            <p className="text-blue-200 text-sm font-light tracking-widest mt-1 uppercase">
              Professional Education Center
            </p>
          </div>
        </div>
      </div>

      {/* 2. LOADING BAR SECTION */}
      <div className={`w-full max-w-md px-8 transition-all duration-1000 ${loadingStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 tracking-widest uppercase">
          <span>System Initialization</span>
          <span className="text-blue-400">{Math.min(progress, 100)}%</span>
        </div>
        
        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-100 ease-out relative"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* 3. FOOTER CREDITS */}
      <div className="absolute bottom-8 z-10 text-center">
         <p className="text-slate-600 text-[10px] tracking-[0.3em] uppercase hover:text-slate-400 transition-colors cursor-default">
           Developed by <span className="text-slate-400 font-bold">Ahdi Yourse</span>
         </p>
      </div>
    </div>
  );
};
