import React, { useState } from 'react';
import { User, Mail, Shield, Smartphone, Camera, LogOut, Save, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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
      console.error("Gagal update profil:", error);
      alert("Gagal menyimpan perubahan.");
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-12">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Pengaturan Akun</h1>
          <p className="text-slate-500 mt-1">Kelola identitas digital dan preferensi sistem Anda.</p>
        </div>
        <button 
          onClick={logout}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-medium shadow-sm active:scale-95"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Keluar Sesi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: KTP DIGITAL (4 Kolom) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CARD UTAMA */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden relative">
            {/* Header Background */}
            <div className="h-32 bg-gradient-to-br from-brand-blue to-brand-dark relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
            </div>

            <div className="px-6 pb-8 relative">
               {/* Avatar Container */}
               <div className="relative -mt-16 mb-4 flex justify-center">
                 <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-slate-100 overflow-hidden relative group cursor-pointer">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <User size={48} />
                      </div>
                    )}
                 </div>
                 {/* Badge Role */}
                 <div className="absolute bottom-2 right-[calc(50%-3rem)] bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm border-2 border-white uppercase tracking-wider">
                   {user.role}
                 </div>
               </div>

               {/* User Info */}
               <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-800">{user.displayName}</h2>
                 <p className="text-slate-500 text-sm">{user.email}</p>
               </div>

               {/* Status Badge */}
               <div className="flex justify-center mb-8">
                 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                   <BadgeCheck size={14} />
                   AKUN TERVERIFIKASI
                 </span>
               </div>

               {/* Detail Grid */}
               <div className="space-y-4 border-t border-slate-100 pt-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 flex items-center gap-2">
                       <Shield size={14} /> Status
                    </span>
                    <span className="font-semibold text-slate-700">{user.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 flex items-center gap-2">
                       <Smartphone size={14} /> ID Pengguna
                    </span>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                      {user.uid.substring(0, 8)}...
                    </span>
                  </div>
               </div>
            </div>
          </div>

          {/* SYSTEM INFO MINI CARD */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
             <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Versi Sistem</p>
             <p className="text-slate-600 font-medium">v1.0.0 (Stable Release)</p>
          </div>
        </div>

        {/* KOLOM KANAN: FORM EDIT (8 Kolom) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-lg">Edit Informasi Profil</h3>
               {!isEditing && (
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="text-sm font-medium text-brand-blue hover:text-blue-700 hover:underline underline-offset-4"
                 >
                   Ubah Data
                 </button>
               )}
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                {/* Upload Zone (Hanya muncul saat edit) */}
                {isEditing && (
                  <div className="bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-xl p-6 text-center transition-all hover:bg-blue-50 group cursor-pointer relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)}
                    />
                    <div className="w-12 h-12 bg-white rounded-full text-brand-blue flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                       <Camera size={24} />
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      {photoFile ? photoFile.name : "Klik untuk mengganti foto profil"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Format: JPG, PNG (Max 2MB)</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-lg transition-all outline-none ${
                            isEditing 
                              ? 'bg-white border-slate-300 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue' 
                              : 'bg-slate-50 border-transparent text-slate-600'
                          }`}
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          readOnly={!isEditing}
                        />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Alamat Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="email" 
                          className="w-full pl-10 pr-4 py-2.5 border border-transparent bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed outline-none"
                          value={user.email}
                          readOnly
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 text-right">Email tidak dapat diubah</p>
                   </div>
                </div>

                {isEditing && (
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3 animate-fade-in">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditing(false);
                        setDisplayName(user.displayName);
                        setPhotoFile(null);
                      }}
                      className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="px-6 py-2.5 bg-brand-blue text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95"
                    >
                      {loading ? (
                         <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                         <>
                           <Save size={18} />
                           Simpan Perubahan
                         </>
                      )}
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
