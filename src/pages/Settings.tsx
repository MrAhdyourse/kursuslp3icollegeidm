import React, { useState, useEffect } from 'react';
import { User, Mail, Smartphone, Camera, LogOut, Save, BadgeCheck, ShieldCheck, CreditCard, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Sinkronisasi data user ke state lokal saat user tersedia
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let newPhotoUrl = user.photoURL;

      if (photoFile) {
        const uploadRes = await studentService.uploadStudentPhoto(photoFile, `USER_${user.uid}`);
        if (uploadRes.success && uploadRes.url) {
          newPhotoUrl = uploadRes.url;
        }
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName,
        photoURL: newPhotoUrl
      });

      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal menyimpan perubahan.");
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  // --- SKELETON LOADER (Agar tidak blank saat loading) ---
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6 animate-pulse space-y-8">
        <div className="h-8 bg-slate-200 w-1/3 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
          <div className="col-span-2 h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Akun & Lisensi</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <ShieldCheck size={16} className="text-brand-blue" />
            Pusat Kontrol Identitas Digital
          </p>
        </div>
        <button 
          onClick={logout}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: KARTU IDENTITAS PREMIUM */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="relative group perspective-1000">
            {/* The Card */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl shadow-2xl p-6 text-white overflow-hidden relative min-h-[400px] flex flex-col justify-between border border-white/10 transition-transform duration-500 hover:rotate-y-2">
              
              {/* Decorative Effects */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl translate-y-10 -translate-x-5"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

              {/* Card Header */}
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-blue-300" size={20} />
                  <span className="text-xs font-bold tracking-[0.2em] text-blue-200 uppercase">LP3I Digital ID</span>
                </div>
                {/* Chip Image Simulation */}
                <div className="w-10 h-8 bg-gradient-to-br from-yellow-200 to-yellow-600 rounded-md border border-yellow-700 shadow-inner opacity-80"></div>
              </div>

              {/* Avatar Center */}
              <div className="flex flex-col items-center justify-center my-6 relative z-10">
                <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-blue-400 to-cyan-300 shadow-lg mb-4 relative">
                  <div className="w-full h-full rounded-full bg-slate-800 overflow-hidden">
                     {user.photoURL ? (
                       <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-500">
                         <User size={40} />
                       </div>
                     )}
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-slate-900 rounded-full flex items-center justify-center shadow-sm" title="Active">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
                <h2 className="text-xl font-bold tracking-wide text-center">{user.displayName}</h2>
                <div className="inline-block mt-2 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">
                  {user.role}
                </div>
              </div>

              {/* Card Footer */}
              <div className="space-y-3 relative z-10 border-t border-white/10 pt-4 mt-auto">
                 <div className="flex justify-between text-xs text-blue-200/60">
                    <span>ID Number</span>
                    <span className="font-mono text-white tracking-wider">{user.uid.substring(0, 12)}...</span>
                 </div>
                 <div className="flex justify-between text-xs text-blue-200/60">
                    <span>Valid Thru</span>
                    <span className="font-mono text-white">LIFETIME</span>
                 </div>
                 <div className="flex justify-between text-xs text-blue-200/60">
                    <span>Status</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <BadgeCheck size={12} /> VERIFIED
                    </span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: EDITOR MODERN */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                  <h3 className="font-bold text-slate-800 text-lg">Edit Profil</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Perbarui informasi pribadi Anda</p>
               </div>
               {!isEditing && (
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="text-sm font-medium bg-brand-blue/10 text-brand-blue px-4 py-2 rounded-lg hover:bg-brand-blue hover:text-white transition-all"
                 >
                   Edit Data
                 </button>
               )}
            </div>
            
            <div className="p-8 flex-1">
              <form onSubmit={handleSaveProfile} className="space-y-8 max-w-2xl">
                
                {/* Upload Zone */}
                {isEditing && (
                  <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <Camera size={24} />
                     </div>
                     <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-900 mb-1">Foto Profil</label>
                        <input 
                           type="file" 
                           accept="image/*"
                           className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                           onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)}
                        />
                        <p className="text-xs text-slate-400 mt-1">JPG, GIF or PNG. Max size of 2MB</p>
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <User size={16} /> Nama Lengkap
                      </label>
                      <input 
                        type="text" 
                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                          isEditing 
                            ? 'bg-white border-slate-300 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue shadow-sm' 
                            : 'bg-slate-50 border-transparent text-slate-600 cursor-not-allowed'
                        }`}
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        readOnly={!isEditing}
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Mail size={16} /> Email
                      </label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-3 rounded-xl border border-transparent bg-slate-50 text-slate-500 cursor-not-allowed outline-none font-mono text-sm"
                        value={user.email}
                        readOnly
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Smartphone size={16} /> User ID (System)
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border border-transparent bg-slate-50 text-slate-500 cursor-not-allowed outline-none font-mono text-xs tracking-wider"
                        value={user.uid}
                        readOnly
                      />
                   </div>
                </div>

                {isEditing && (
                  <div className="pt-6 flex items-center gap-4 animate-fade-in-up">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="px-8 py-3 bg-brand-blue text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95"
                    >
                      {loading ? "Menyimpan..." : (
                         <>
                           <Save size={18} /> Simpan Perubahan
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
                      className="px-6 py-3 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </form>
            </div>
            
            {/* System Status Footer */}
            <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
               <span className="flex items-center gap-2">
                 <Activity size={14} className="text-emerald-500" /> System Operational
               </span>
               <span>v1.2.0 LP3I Edition</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;