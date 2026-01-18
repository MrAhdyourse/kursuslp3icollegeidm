import React from 'react';
import { Menu, X, FileText, Users, Home, Settings, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/images/logo.png';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  // Menu items config
  const allMenuItems = [
    { name: 'Beranda', icon: Home, href: '/' },
    { name: 'Data Peserta', icon: Users, href: '/students', roles: ['INSTRUCTOR'] },
    { name: 'Daftar Kelas', icon: Users, href: '/classmates', roles: ['INSTRUCTOR', 'STUDENT'] },
    { name: 'Cek Nilai Siswa', icon: FileText, href: '/reports', roles: ['INSTRUCTOR', 'STUDENT'] },
    { name: 'Karir & Gaji', icon: TrendingUp, href: '/career', roles: ['INSTRUCTOR', 'STUDENT'] },
    { name: 'Pengaturan', icon: Settings, href: '/settings', roles: ['INSTRUCTOR', 'STUDENT'] },
  ];

  // Filter menu berdasarkan role
  const menuItems = allMenuItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <nav className="fixed w-full z-50 top-0 start-0 bg-brand-blue/85 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between mx-auto p-4">
          
          {/* Logo / Brand Section */}
          <Link to="/" className="flex items-center group">
            <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300" />
            <div className="h-8 w-[1px] bg-white/20 mx-4"></div>
            <div className="flex flex-col justify-center">
              <span className="font-serif text-2xl font-bold text-white tracking-wide leading-none">
                E-KURSUS
              </span>
              <span className="text-[10px] text-orange-200 font-sans font-medium tracking-[0.15em] uppercase mt-1">
                LP3I COLLEGE INDRAMAYU
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

      {/* Mobile Menu Dropdown */}
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
