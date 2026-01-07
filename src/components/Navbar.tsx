import React from 'react';
import { Menu, X, FileText, Users, Home, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/images/logo.png';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Menu items config
  const menuItems = [
    { name: 'Dashboard', icon: Home, href: '/' },
    { name: 'Data Peserta', icon: Users, href: '/students' },
    { name: 'Cek Nilai Siswa', icon: FileText, href: '/reports' },
    { name: 'Pengaturan', icon: Settings, href: '/settings' },
  ];

  return (
    <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/10 bg-brand-blue/95 backdrop-blur-md shadow-lg shadow-brand-blue/20">
      {/* Accent Gradient Line (LP3I Style) */}
      <div className="h-1 w-full bg-gradient-to-r from-white via-red-500 to-brand-dark"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between mx-auto p-4">
          
          {/* Logo / Brand Section */}
          <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse group">
            <div className="bg-white p-1 rounded-lg shadow-md group-hover:scale-105 transition-transform duration-300">
              <img src={logoImg} alt="Logo" className="w-9 h-9 object-contain" onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 const fallback = document.createElement('div');
                 fallback.className = "w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-dark rounded flex items-center justify-center text-white font-bold text-xs";
                 fallback.innerText = "LP3I";
                 e.currentTarget.parentElement!.appendChild(fallback);
              }} />
            </div>
            <div className="flex flex-col">
              <span className="self-center text-xl font-bold whitespace-nowrap text-white tracking-wide">
                Sistem Kursus
              </span>
              <span className="text-[10px] text-blue-100 uppercase tracking-wider font-medium">
                LP3I Indramayu
              </span>
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-blue-100 rounded-lg md:hidden hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <span className="sr-only">Open main menu</span>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Menu */}
          <div className="hidden w-full md:block md:w-auto">
            <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-blue-700 rounded-lg md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="flex items-center gap-2 py-2 px-3 text-white rounded hover:bg-white/10 md:hover:bg-transparent md:border-0 md:hover:text-blue-200 md:p-0 transition-colors duration-200"
                  >
                    <item.icon size={16} className="opacity-80" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown (Animation wrapper could be added here) */}
      {isOpen && (
        <div className="md:hidden bg-brand-dark/95 backdrop-blur-xl border-t border-white/10">
          <ul className="flex flex-col p-4 font-medium">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className="flex items-center gap-3 py-3 px-4 text-white rounded hover:bg-white/10 transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};
