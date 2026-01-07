import React, { useState } from 'react';
import { User, Mail, Shield, Smartphone, Camera, LogOut, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService'; // Kita pinjam fungsi upload foto dari sini
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

      // 1. Upload Foto Baru jika ada
      if (photoFile) {
        const uploadRes = await studentService.uploadStudentPhoto(photoFile, `USER_${user.uid}`);
        if (uploadRes.success && uploadRes.url) {
          newPhotoUrl = uploadRes.url;
        }
      }

      // 2. Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName,
        photoURL: newPhotoUrl
      });

      // 3. Reload halaman agar Context refresh (cara simpel)
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
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
       <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Pengaturan Akun</h1>
          <p className="text-slate-500 mt-1">Kelola informasi profil dan lisensi Anda.</p>
        </div>
        <button 
          onClick={logout}
          className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2 border border-red-200 transition-colors font-medium"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: KTP DIGITAL */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden relative group">
            {/* Background Pattern */}
            <div className="h-24 bg-gradient-to-r from-brand-blue to-brand-dark"></div>
            
            <div className="px-6 pb-6 relative">
              {/* Foto Profil */}
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-slate-200 absolute -top-12 left-1/2 -translate-x-1/2 overflow-hidden flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-slate-400" />
                )}
              </div>

              <div className="mt-14 text-center">
                <h2 className="text-xl font-bold text-slate-800">{user.displayName}</h2>
                <p className="text-sm text-slate-500 mb-4">{user.email}</p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                  <Shield size={12} />
                  {user.role}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Status Akun</span>
                    <span className="text-green-600 font-bold flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      {user.status}
                    </span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Member Sejak</span>
                    <span className="text-slate-700 font-medium">
                      {new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                    </span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: FORM EDIT PROFIL */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-slate-800">Edit Profil</h3>
               {!isEditing && (
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="text-brand-blue hover:text-blue-800 text-sm font-medium"
                 >
                   Ubah Data
                 </button>
               )}
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="space-y-5">
                {/* Upload Foto (Hanya muncul saat edit) */}
                {isEditing && (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer transition relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)}
                    />
                    <Camera size={24} className="mb-2" />
                    <span className="text-sm">{photoFile ? photoFile.name : "Klik untuk ganti foto profil"}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none ${isEditing ? 'border-slate-300 focus:ring-2 focus:ring-brand-blue bg-white' : 'border-transparent bg-slate-50 text-slate-500'}`}
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      readOnly={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email (Tidak dapat diubah)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      className="w-full pl-10 pr-4 py-2 border border-transparent bg-slate-50 rounded-lg text-slate-500 outline-none cursor-not-allowed"
                      value={user.email}
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID Pengguna (UID)</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-2 border border-transparent bg-slate-50 rounded-lg text-slate-500 outline-none cursor-not-allowed font-mono text-xs"
                      value={user.uid}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="mt-8 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(user.displayName);
                      setPhotoFile(null);
                    }}
                    className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center gap-2 shadow-lg"
                  >
                    {loading ? "Menyimpan..." : (
                      <>
                        <Save size={18} /> Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">System Version 1.0.0 (Alpha)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;