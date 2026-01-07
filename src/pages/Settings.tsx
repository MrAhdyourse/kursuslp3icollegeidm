import React, { useState, useEffect } from 'react';
import { User, Mail, LogOut, Camera, Save, ShieldCheck, CreditCard, Activity, BadgeCheck, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  
  // State Lokal dengan proteksi nilai awal
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Efek: Sinkron data user ke form saat user ready
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  // Fungsi Simpan (Proteksi Penuh)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
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

      // 3. Refresh halaman untuk sinkronisasi state global
      window.location.reload();

    } catch (err) {
      console.error("Save Profile Error:", err);
      alert('Terjadi kendala saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  // --- TAMPILAN SKELETON (Jika data belum ditarik) ---
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center animate-pulse">
        <div className="h-64 bg-slate-100 rounded-3xl mb-6"></div>
        <p className="text-slate-400 font-medium tracking-widest">MENYINKRONKAN IDENTITAS DIGITAL...</p>
      </div>
    );
  }

  // Ambil UID dengan aman untuk keperluan display
  const safeUID = user?.uid || "NON-REGISTERED";

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-fade-in">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-8 mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Akun & Lisensi</h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2 font-medium">
            <ShieldCheck size={18} className="text-blue-600" />
            Pengaturan Profil & Keamanan Sistem
          </p>
        </div>
        <button 
          onClick={logout}
          className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold shadow-sm active:scale-95"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          Keluar Sesi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* KOLOM KIRI: PREMIUM BLACK CARD (ID DIGITAL) */}
        <div className="lg:col-span-5 xl:col-span-4">
           <div className="relative group">
              {/* Efek Cahaya di Belakang Kartu */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              
              {/* KARTU UTAMA */}
              <div className="relative bg-gradient-to-br from-slate-900 via-[#0f172a] to-slate-900 rounded-3xl p-8 text-white shadow-2xl overflow-hidden min-h-[450px] flex flex-col border border-white/10">
                 
                 {/* Decorative Abstract Patterns */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                 <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>

                 {/* Card Header */}
                 <div className="flex justify-between items-start z-10 mb-8">
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-2">
                          <CreditCard className="text-blue-400" size={24} />
                          <span className="text-[10px] font-black tracking-[0.4em] text-blue-200 uppercase">LP3I Digital ID</span>
                       </div>
                       <p className="text-[8px] text-white/30 tracking-widest uppercase">Verified System Member</p>
                    </div>
                    <div className="w-14 h-10 bg-gradient-to-br from-yellow-100 via-yellow-400 to-yellow-600 rounded-lg shadow-inner border border-white/20 flex items-center justify-center overflow-hidden">
                       <div className="w-full h-[1px] bg-black/10 my-1"></div>
                    </div>
                 </div>

                 {/* Avatar Display */}
                 <div className="flex flex-col items-center z-10 flex-1 justify-center">
                    <div className="relative">
                       <div className="w-36 h-32 rounded-3xl p-1 bg-gradient-to-b from-blue-500 to-transparent shadow-2xl mb-6">
                          <div className="w-full h-full rounded-[1.4rem] bg-slate-800 overflow-hidden border-2 border-slate-900">
                             {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
                                   <User size={50} />
                                </div>
                             )}
                          </div>
                       </div>
                       {/* Status Badge */}
                       <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-1.5 rounded-xl border-4 border-slate-900 shadow-lg">
                          <BadgeCheck size={18} className="text-white" />
                       </div>
                    </div>
                    
                    <h2 className="text-2xl font-black tracking-tight text-center mb-1">{user.displayName || 'No Name'}</h2>
                    <div className="px-4 py-1.5 bg-blue-600/20 backdrop-blur-md rounded-full border border-blue-500/30">
                       <span className="text-[10px] font-black tracking-[0.2em] uppercase text-blue-300">{user.role || 'GUEST'}</span>
                    </div>
                 </div>

                 {/* Card Footer */}
                 <div className="z-10 mt-10 space-y-4 pt-6 border-t border-white/5">
                    <div className="flex justify-between items-end">
                       <div className="space-y-1">
                          <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Identification Number</p>
                          <p className="text-sm font-mono tracking-tighter text-blue-100">
                             {safeUID.substring(0, 4)} • {safeUID.substring(4, 8)} • {safeUID.substring(8, 12)}
                          </p>
                       </div>
                       <div className="text-right space-y-1">
                          <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Status</p>
                          <p className="text-xs font-black text-emerald-400">{user.status || 'ACTIVE'}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* KOLOM KANAN: PROFILE EDITOR (MODERN) */}
        <div className="lg:col-span-7 xl:col-span-8">
           <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
              <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div>
                    <h3 className="font-black text-slate-800 text-xl tracking-tight">Informasi Personal</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Pastikan data Anda selalu sinkron dengan sistem pusat.</p>
                 </div>
                 {!isEditing && (
                   <button 
                    onClick={() => setIsEditing(true)} 
                    className="text-sm font-bold bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95"
                   >
                     Ubah Profil
                   </button>
                 )}
              </div>

              <div className="p-10 flex-1">
                 <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
                    
                    {/* Media Management Area (Saat Edit) */}
                    {isEditing && (
                       <div className="group relative flex items-center gap-6 p-6 bg-blue-50/50 rounded-[1.5rem] border-2 border-dashed border-blue-200 transition-all hover:bg-blue-50">
                          <div className="w-20 h-20 bg-white shadow-md rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
                             <Camera size={32} />
                          </div>
                          <div className="flex-1">
                             <label className="text-sm font-black text-slate-800 block mb-1 uppercase tracking-wide">Foto Profil Baru</label>
                             <input 
                               type="file" 
                               accept="image/*"
                               onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)}
                               className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                             />
                             <p className="text-[10px] text-slate-400 mt-2 font-medium italic">Format yang didukung: JPG, PNG, GIF (Maks. 2MB)</p>
                          </div>
                       </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-[0.1em] flex items-center gap-2">
                            <User size={14} className="text-blue-600" /> Nama Lengkap
                          </label>
                          <input 
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            readOnly={!isEditing}
                            placeholder="Masukkan nama lengkap..."
                            className={`w-full px-5 py-4 rounded-2xl border transition-all outline-none font-bold text-slate-800 ${isEditing ? 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white' : 'border-transparent bg-slate-50 text-slate-500 cursor-not-allowed'}`}
                          />
                       </div>

                       <div className="space-y-2">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-[0.1em] flex items-center gap-2">
                            <Mail size={14} className="text-blue-600" /> Alamat Email
                          </label>
                          <div className="relative">
                             <input 
                                type="text"
                                value={user.email || ''}
                                readOnly
                                className="w-full px-5 py-4 rounded-2xl border border-transparent bg-slate-50 text-slate-500 cursor-not-allowed outline-none font-mono text-sm font-bold"
                             />
                             <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <BadgeCheck size={16} className="text-emerald-500" />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-[0.1em] flex items-center gap-2">
                            <Smartphone size={14} className="text-blue-600" /> UID Sistem
                          </label>
                          <input 
                            type="text"
                            value={user.uid || ''}
                            readOnly
                            className="w-full px-5 py-4 rounded-2xl border border-transparent bg-slate-50 text-slate-400 cursor-not-allowed outline-none font-mono text-[10px] tracking-[0.2em]"
                          />
                       </div>
                    </div>

                    {isEditing && (
                       <div className="pt-8 flex items-center gap-4 animate-fade-in-up">
                          <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex justify-center items-center gap-3 active:scale-[0.98]"
                          >
                             {loading ? (
                                <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
                             ) : (
                                <>
                                  <Save size={20} /> SIMPAN PERUBAHAN
                                </>
                             )}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                               setIsEditing(false);
                               setDisplayName(user.displayName || '');
                               setPhotoFile(null);
                            }}
                            className="px-8 py-4 text-slate-500 hover:text-slate-900 font-bold transition-colors"
                          >
                             BATAL
                          </button>
                       </div>
                    )}
                 </form>
              </div>
              
              {/* SYSTEM STATUS FOOTER */}
              <div className="bg-slate-900 px-10 py-5 flex justify-between items-center text-[10px]">
                 <span className="flex items-center gap-2 text-slate-400 font-bold tracking-widest uppercase">
                   <Activity size={14} className="text-emerald-500" /> Operational Stable
                 </span>
                 <span className="text-slate-500 font-black tracking-widest uppercase">v1.5.0 LP3I Edition</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
