import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, LogIn, AlertCircle, User, GraduationCap, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/images/logo.png';
import welcomeImg from '../assets/images/selamatdatang.png';

type LoginMode = 'INSTRUCTOR' | 'STUDENT';

const Login: React.FC = () => {
  const [mode, setMode] = useState<LoginMode>('INSTRUCTOR');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Konfigurasi Link WhatsApp
  const waNumber = "6283867055809";
  const waMessage = encodeURIComponent(
    `Halo Admin LP3I, saya ingin mengajukan pembuatan akun baru sebagai ${mode === 'INSTRUCTOR' ? 'Instruktur' : 'Peserta Didik'} untuk Sistem Kursus. Mohon bantuannya.`
  );
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    
    if (res.success) {
      navigate('/'); 
    } else {
      setError(res.error || "Login gagal. Periksa kembali data Anda.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Mewah (Animated Gradient) */}
      <div className={`absolute inset-0 transition-colors duration-700 ease-in-out ${
        mode === 'INSTRUCTOR' 
          ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' 
          : 'bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900'
      }`}></div>
      
      {/* Dekorasi Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
         <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
         <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-5xl bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row min-h-[600px] animate-fade-in-up">
        
        {/* SIDEBAR KIRI: LOGO & VISUAL WITH WELCOME IMAGE */}
        <div className="hidden md:flex flex-col justify-between p-12 w-[45%] relative text-white overflow-hidden border-r border-white/10">
          
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0">
            <img 
              src={welcomeImg} 
              alt="Welcome" 
              className="w-full h-full object-cover scale-110 animate-[zoom-slow_20s_infinite_alternate]" 
            />
            {/* Dark Overlay Gradient - Menyesuaikan Mode */}
            <div className={`absolute inset-0 transition-colors duration-500 ${
              mode === 'INSTRUCTOR' 
                ? 'bg-gradient-to-b from-blue-900/80 via-blue-900/40 to-slate-900/90' 
                : 'bg-gradient-to-b from-emerald-900/80 via-emerald-900/40 to-slate-900/90'
            }`}></div>
          </div>

          <div className="relative z-10">
            {/* LOGO AREA - PREMIUM DISPLAY */}
            <div className="bg-white p-6 rounded-2xl w-fit shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] mb-10 group-hover:scale-105 transition-transform duration-500">
               <img src={logoImg} alt="LP3I Logo" className="h-20 w-auto object-contain drop-shadow-md" />
            </div>
            
            <h2 className="text-4xl font-bold leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white drop-shadow-sm">
              E-Kursus <br/> LP3I Indramayu
            </h2>
            <p className="text-white/80 text-lg font-light leading-relaxed">
              Selamat datang di portal capaian belajar. Pantau kompetensi dan raih masa depan gemilang.
            </p>
          </div>

          <div className="relative z-10">
             {/* SIMPLIFIED DEDICATION */}
             <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl inline-flex items-center gap-3 shadow-inner">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                   <User size={16} className="text-blue-200" />
                </div>
                <span className="text-xs font-medium tracking-wide text-blue-100 italic">Dedicated to LP3I College Indramayu</span>
             </div>
          </div>
        </div>

        {/* SIDEBAR KANAN: FORM LOGIN */}
        <div className="flex-1 p-8 md:p-12 bg-white flex flex-col justify-center">
          
          {/* Header Mobile (Only show on mobile) */}
          <div className="md:hidden mb-8 text-center">
             <h1 className="text-2xl font-bold text-slate-800">Selamat Datang</h1>
             <p className="text-slate-500">Silakan masuk ke akun Anda</p>
          </div>

          {/* TABS SWITCHER */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8 relative">
             {/* Slider Animation Background */}
             <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
               mode === 'INSTRUCTOR' ? 'left-1.5' : 'left-[calc(50%+3px)]'
             }`}></div>

             <button 
               onClick={() => setMode('INSTRUCTOR')}
               className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold relative z-10 transition-colors ${
                 mode === 'INSTRUCTOR' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <User size={18} />
               Instruktur
             </button>
             <button 
               onClick={() => setMode('STUDENT')}
               className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold relative z-10 transition-colors ${
                 mode === 'STUDENT' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <GraduationCap size={18} />
               Peserta Didik
             </button>
          </div>

          {/* FORM */}
          <div className="mb-8">
            <h3 className={`text-xl font-bold mb-1 ${mode === 'INSTRUCTOR' ? 'text-blue-700' : 'text-emerald-700'}`}>
              Login {mode === 'INSTRUCTOR' ? 'Instruktur' : 'Peserta'}
            </h3>
            <p className="text-slate-500 text-sm">Masukan kredensial akun Anda untuk melanjutkan.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm animate-fade-in">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Akun</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  className={`w-full pl-10 pr-4 py-3.5 border bg-slate-50 rounded-xl focus:bg-white outline-none transition-all ${
                    mode === 'INSTRUCTOR' 
                    ? 'focus:ring-2 focus:ring-blue-100 focus:border-blue-500' 
                    : 'focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500'
                  }`}
                  placeholder={mode === 'INSTRUCTOR' ? "admin@lp3i.com" : "siswa@lp3i.com"}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Kata Sandi</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors" size={18} />
                <input 
                  type="password" 
                  required
                  className={`w-full pl-10 pr-4 py-3.5 border bg-slate-50 rounded-xl focus:bg-white outline-none transition-all ${
                    mode === 'INSTRUCTOR' 
                    ? 'focus:ring-2 focus:ring-blue-100 focus:border-blue-500' 
                    : 'focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500'
                  }`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4 ${
                mode === 'INSTRUCTOR' 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  Masuk Sekarang
                </>
              )}
            </button>
          </form>

          {/* FOOTER LINK WA */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
            <p className="text-sm text-slate-500">Belum memiliki akun?</p>
            <a 
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-green-600 transition-colors px-4 py-2 rounded-full hover:bg-green-50"
            >
              <MessageCircle size={18} className="text-green-500" />
              Hubungi Admin via WhatsApp
            </a>
          </div>

        </div>
      </div>

      <div className="absolute bottom-4 text-white/30 text-xs">
        &copy; {new Date().getFullYear()} LP3I College Indramayu. All Rights Reserved.
      </div>
    </div>
  );
};

export default Login;