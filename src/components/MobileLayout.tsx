import React, { type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  GraduationCap 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileLayoutProps {
  children: ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isInstructor = user?.role === 'INSTRUCTOR';

  // Definisi Menu Navigasi Bawah (Dinamis Sesuai Role)
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    // Logika Percabangan Menu:
    // Jika Instruktur -> Buka Menu Kelola Siswa
    // Jika Siswa -> Buka Menu Teman Sekelas (Classmates)
    ...(isInstructor 
      ? [{ path: '/students', icon: Users, label: 'Kelola' }]
      : [{ path: '/classmates', icon: Users, label: 'Teman' }]
    ),
    { path: '/career', icon: GraduationCap, label: 'Karir' },
    { path: '/reports', icon: FileText, label: 'Laporan' },
    { path: '/settings', icon: Settings, label: 'Set' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Header Mobile Sederhana */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/assets/images/logo.png" alt="Logo" className="w-8 h-8 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">Kursus LP3I</h1>
            <p className="text-[10px] text-slate-500 font-medium">Mobile Edition</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-200">
          {user?.displayName?.charAt(0) || 'A'}
        </div>
      </header>

      {/* Main Content (Full Width) */}
      <main className="flex-1 p-4 w-full max-w-full overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Navigation Bar (Fixed) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around items-center z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive 
                  ? 'text-blue-600 bg-blue-50/80 font-semibold' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "drop-shadow-sm" : ""} />
              <span className="text-[10px] mt-1 truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
