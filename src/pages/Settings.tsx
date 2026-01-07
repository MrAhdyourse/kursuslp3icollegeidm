import React, { useState, useEffect } from 'react';
import { User, Mail, LogOut, Camera, Save, ShieldCheck, CreditCard, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  
  // State Lokal
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Efek: Sinkron data user ke form saat user ready
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || 'Pengguna Tanpa Nama');
    }
  }, [user]);

  // Fungsi Simpan
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let urlFoto = user.photoURL;

      // 1. Upload jika ada file baru
      if (photoFile) {
        const res = await studentService.uploadStudentPhoto(photoFile, `USER_${user.uid}`);
        if (res.success && res.url) {
          urlFoto = res.url;
        }
      }

      // 2. Update DB
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName,
        photoURL: urlFoto
      });

      // 3. Refresh
      window.location.reload();

    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  // --- TAMPILAN JIKA USER BELUM SIAP (SKELETON) ---
  if (!user) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center animate-pulse">
        <div className="h-40 bg-slate-200 rounded-xl mb-4"></div>
        <p className="text-slate-400">Memuat data profil...</p>
      </div>
    );
  }

  // --- TAMPILAN UTAMA ---
  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Akun & Lisensi</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-600" />
            Pusat Kontrol Identitas
          </p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} /> Keluar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KIRI: DIGITAL ID CARD (PREMIUM) */}
        <div className="lg:col-span-5">
           <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden min-h-[420px] flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-500">
              
              {/* Background Effects */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              {/* Card Top */}
              <div className="flex justify-between items-start z-10">
                 <div className="flex items-center gap-2">
                    <CreditCard className="text-blue-300" />
                    <span className="text-xs font-bold tracking-[0.3em] text-blue-200">DIGITAL ID</span>
                 </div>
                 <div className="w-12 h-9 bg-gradient-to-br from-yellow-200 to-yellow-600 rounded opacity-80 shadow-inner border border-yellow-700/50"></div>
              </div>

              {/* Card Center (Avatar) */}
              <div className="flex flex-col items-center z-10 mt-4">
                 <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-blue-400 to-cyan-300 shadow-[0_0_20px_rgba(56,189,248,0.3)] mb-4">
                    <img 
                      src={user.photoURL || 'https://via.placeholder.com/150'} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover border-4 border-slate-900 bg-slate-800"
                    />
                 </div>
                 <h2 className="text-2xl font-bold tracking-wide text-center">{user.displayName || 'No Name'}</h2>
                 <span className="mt-2 px-3 py-1 bg-white/10 rounded-full text-[10px] tracking-widest uppercase border border-white/10 font-bold">
                    {user.role}
                 </span>
              </div>

              {/* Card Bottom */}
              <div className="z-10 mt-8 space-y-3 pt-4 border-t border-white/10">
                 <div className="flex justify-between text-xs text-blue-200/50 uppercase tracking-wider">
                    <span>User ID</span>
                    <span className="text-white font-mono">{user.uid.slice(0, 12)}...</span>
                 </div>
                 <div className="flex justify-between text-xs text-blue-200/50 uppercase tracking-wider">
                    <span>Status</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                       <Activity size={10} /> {user.status}
                    </span>
                 </div>
              </div>
           </div>
        </div>

        {/* KANAN: FORM EDIT */}
        <div className="lg:col-span-7">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                 <h3 className="font-bold text-slate-800">Edit Profil</h3>
                 {!isEditing && (
                   <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-brand-blue hover:underline">
                     Ubah Data
                   </button>
                 )}
              </div>

              <div className="p-8">
                 <form onSubmit={handleSave} className="space-y-6">
                    
                    {/* Upload (Muncul saat edit) */}
                    {isEditing && (
                       <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                             <Camera size={20} />
                          </div>
                          <div className="flex-1">
                             <label className="text-sm font-medium text-slate-900 block mb-1">Ganti Foto</label>
                             <input 
                               type="file" 
                               accept="image/*"
                               onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)}
                               className="block w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-blue-200 file:text-blue-800 hover:file:bg-blue-300"
                             />
                          </div>
                       </div>
                    )}

                    <div className="space-y-1">
                       <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                       <div className="relative">
                          <User size={18} className="absolute left-3 top-3 text-slate-400" />
                          <input 
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            readOnly={!isEditing}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all ${isEditing ? 'border-slate-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20' : 'bg-slate-50 border-transparent text-slate-500'}`}
                          />
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-sm font-medium text-slate-700">Email</label>
                       <div className="relative">
                          <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                          <input 
                            type="text"
                            value={user.email}
                            readOnly
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-transparent bg-slate-50 text-slate-500 cursor-not-allowed"
                          />
                       </div>
                    </div>

                    {isEditing && (
                       <div className="pt-4 flex gap-3">
                          <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 bg-brand-blue text-white py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex justify-center items-center gap-2"
                          >
                             <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                          >
                             Batal
                          </button>
                       </div>
                    )}
                 </form>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
