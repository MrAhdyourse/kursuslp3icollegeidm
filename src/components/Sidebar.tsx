import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, BarChart2, Settings, LogOut, GraduationCap, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/images/logo.png';

interface SidebarProps {
  isCollapsed: boolean;
  toggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggle }) => {
  const { user, logout } = useAuth();
  const [imgError, setImgError] = React.useState(false); // State untuk handle error gambar

  const links = [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Data Peserta', icon: Users, path: '/students', role: 'INSTRUCTOR' },
    { name: user?.role === 'STUDENT' ? 'Kelas Saya' : 'Daftar Kelas', icon: Layers, path: '/classmates' },
    { name: 'Laporan Nilai', icon: BarChart2, path: '/reports' },
    { name: 'Simulasi Karir', icon: GraduationCap, path: '/career' },
    { name: 'Pengaturan', icon: Settings, path: '/settings' },
  ];

  const filteredLinks = links.filter(l => !l.role || user?.role === l.role);

  return (
    <aside 
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 h-screen fixed top-0 left-0 flex flex-col z-50 transition-all duration-300 ease-in-out shadow-sm`}
    >
      {/* HEADER LOGO */}
      <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-6'} border-b border-slate-100 relative transition-all duration-300`}>
        <img src={logoImg} alt="LP3I" className={`w-8 h-8 object-contain transition-all duration-300 ${isCollapsed ? 'scale-110' : 'mr-3'}`} />
        
        <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <h1 className="font-bold text-slate-800 leading-none tracking-tight whitespace-nowrap">E-KURSUS</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest mt-1 whitespace-nowrap">LP3I INDRAMAYU</p>
        </div>

        {/* TOGGLE BUTTON (Cinematic Floating) */}
        <button 
          onClick={toggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all hover:scale-110 z-10"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <p className={`px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-2 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0' : 'opacity-100'}`}>
          Menu Utama
        </p>
        
        {filteredLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            title={isCollapsed ? link.name : ''} // Tooltip saat collapsed
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl transition-all duration-200 font-medium group relative overflow-hidden ${
                isActive
                  ? 'bg-brand-blue text-white shadow-md shadow-blue-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <div className="relative z-10 flex-shrink-0">
               <link.icon size={20} className={isCollapsed ? "" : ""} />
            </div>
            
            <span className={`whitespace-nowrap transition-all duration-300 ml-3 ${isCollapsed ? 'w-0 opacity-0 translate-x-10 absolute' : 'w-auto opacity-100 translate-x-0 relative'}`}>
              {link.name}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* FOOTER USER */}
      <div className="p-3 border-t border-slate-100">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl bg-slate-50 border border-slate-100 mb-2 transition-all duration-300`}>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 overflow-hidden flex-shrink-0">
            {!imgError && user?.photoURL ? (
              <img 
                src={user.photoURL} 
                className="w-full h-full object-cover" 
                onError={() => setImgError(true)} 
                alt="Profile"
              />
            ) : (
              user?.displayName?.charAt(0) || 'U'
            )}
          </div>
          <div className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <p className="text-xs font-bold text-slate-800 truncate">{user?.displayName}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        
        <button 
          onClick={logout}
          title={isCollapsed ? 'Keluar' : ''}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors`}
        >
          <LogOut size={18} />
          <span className={`transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>Keluar</span>
        </button>
      </div>
    </aside>
  );
};
