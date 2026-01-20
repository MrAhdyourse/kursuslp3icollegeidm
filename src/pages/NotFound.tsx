import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <AlertTriangle size={48} />
      </div>
      <h1 className="text-6xl font-black text-slate-800 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-slate-600 mb-4">Halaman Tidak Ditemukan</h2>
      <p className="text-slate-400 max-w-md mb-8">
        Maaf, halaman yang Anda cari mungkin telah dihapus, dipindahkan, atau tidak tersedia.
      </p>
      <button 
        onClick={() => navigate('/')}
        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1"
      >
        <Home size={18} /> Kembali ke Dashboard
      </button>
    </div>
  );
};

export default NotFound;
