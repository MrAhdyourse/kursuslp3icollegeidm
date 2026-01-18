import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, BarChart2, Settings, LogOut, GraduationCap, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/images/logo.png';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

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
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed top-0 left-0 flex flex-col z-50">
      {/* HEADER LOGO */}
      <div className="h-20 flex items-center px-6 border-b border-slate-100">
        <img src={logoImg} alt="LP3I" className="w-8 h-8 object-contain mr-3" />
        <div>
          <h1 className="font-bold text-slate-800 leading-none tracking-tight">E-KURSUS</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest mt-1">LP3I INDRAMAYU</p>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-2">Menu Utama</p>
        {filteredLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-brand-blue text-white shadow-md shadow-blue-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <link.icon size={20} />
            {link.name}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER USER */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 overflow-hidden">
            {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : user?.displayName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.displayName}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </aside>
  );
};
