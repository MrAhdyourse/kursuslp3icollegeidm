import React, { type ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Github, Mail, MessageCircle } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50 font-sans text-slate-800 relative">
      
      {/* === SNAKE BORDER ANIMATION (Premium Slow) === */}
      <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
        {/* Top Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-blue to-transparent animate-snake-top"></div>
        {/* Right Line */}
        <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-red-500 to-transparent animate-snake-right [animation-delay:1.5s]"></div>
        {/* Bottom Line */}
        <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-transparent via-brand-blue to-transparent animate-snake-bottom [animation-delay:3s]"></div>
        {/* Left Line */}
        <div className="absolute bottom-0 left-0 w-[2px] h-full bg-gradient-to-t from-transparent via-red-500 to-transparent animate-snake-left [animation-delay:4.5s]"></div>
      </div>

      <Navbar />
      
      {/* Main Content Area - flex-1 pushes footer down */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {children}
      </main>

      {/* Futuristic Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200 py-8 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4 text-center">
          
          <p className="text-sm font-bold text-slate-600">
            © {new Date().getFullYear()} LP3I College Indramayu. All rights reserved.
          </p>

          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">
              Connect With Developer
            </span>
            
            <div className="flex items-center gap-8">
              {/* GitHub - Original Black */}
              <a 
                href="https://github.com/MrAhdyourse" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-black transition-all duration-300 transform hover:scale-125"
                title="GitHub"
              >
                <Github size={24} />
              </a>

              {/* Email - Proton Blue/Purple */}
              <a 
                href="mailto:ahdyours@proton.me" 
                className="text-slate-400 hover:text-blue-600 transition-all duration-300 transform hover:scale-125"
                title="Email"
              >
                <Mail size={24} />
              </a>

              {/* WhatsApp - Original Green */}
              <a 
                href="https://wa.me/6283867055809" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-green-500 transition-all duration-300 transform hover:scale-125"
                title="WhatsApp"
              >
                <MessageCircle size={24} />
              </a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};
