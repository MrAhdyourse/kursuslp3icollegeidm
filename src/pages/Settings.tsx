import React, { useState, useEffect } from 'react';
import { 
  User, Camera, CreditCard, 
  BadgeCheck, BookOpen, Layers, ListOrdered, Plus, Trash2, Settings2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { doc, setDoc, collection, getDocs, deleteDoc, addDoc } from 'firebase/firestore'; 
import { db } from '../services/firebase';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  
  // --- STATE AKUN ---
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // --- STATE MASTER DATA ---
  const [courses, setCourses] = useState<any[]>([]);
  const [newCourse, setNewCourse] = useState('');

  useEffect(() => {
    if (user) setDisplayName(user.displayName || '');
    if (user?.role === 'INSTRUCTOR') fetchMasterData();
  }, [user]);

  const fetchMasterData = async () => {
    const querySnapshot = await getDocs(collection(db, "course_types"));
    const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCourses(list);
  };

  const handleAddCourse = async () => {
    if (!newCourse) return;
    await addDoc(collection(db, "course_types"), { name: newCourse, createdAt: Date.now() });
    setNewCourse('');
    fetchMasterData();
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Hapus kursus ini?")) return;
    await deleteDoc(doc(db, "course_types", id));
    fetchMasterData();
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setLoadingAccount(true);
    try {
      let urlFoto = user?.photoURL || '';
      if (photoFile) {
        const res = await studentService.uploadStudentPhoto(photoFile, `USER_${user.uid}`, 'users');
        if (res.success) urlFoto = res.url!;
      }
      await setDoc(doc(db, 'users', user.uid), { displayName, photoURL: urlFoto }, { merge: true });
      window.location.reload();
    } catch (err) { alert('Gagal simpan profil.'); }
    finally { setLoadingAccount(false); }
  };

  if (!user) return <div className="p-20 text-center animate-pulse">Memuat...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in space-y-12">
      
      {/* 1. MASTER DATA CONTROL (Hanya Instruktur) */}
      {user.role === 'INSTRUCTOR' && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Settings2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Kursus & Kurikulum</h2>
              <p className="text-sm text-slate-500">Atur jenis kursus, materi, dan total sesi belajar.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* BOX 1: JENIS KURSUS */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 overflow-hidden">
               <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <BookOpen size={18} className="text-blue-600" />
                  <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Daftar Kursus</h3>
               </div>
               
               <div className="space-y-3 mb-6 max-h-[200px] overflow-y-auto pr-2">
                  {courses.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl group hover:bg-red-50 transition-colors">
                       <span className="text-sm font-bold text-slate-700">{c.name}</span>
                       <button onClick={() => handleDeleteCourse(c.id)} className="text-slate-300 hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                       </button>
                    </div>
                  ))}
               </div>

               <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nama Kursus Baru..." 
                    className="flex-1 px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={newCourse}
                    onChange={e => setNewCourse(e.target.value)}
                  />
                  <button onClick={handleAddCourse} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
                    <Plus size={20} />
                  </button>
               </div>
            </div>

            {/* BOX 2: TOTAL SESI & LEVEL */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col justify-center items-center text-center">
               <Layers size={32} className="text-slate-300 mb-4" />
               <h3 className="font-bold text-slate-800 text-sm mb-2">Pengaturan Sesi</h3>
               <p className="text-xs text-slate-500 mb-4">Level 1: 12 Sesi | Level 2: 12 Sesi | Level 3: 16 Sesi</p>
               <button className="text-[10px] font-black tracking-widest uppercase bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-all">
                  Modifikasi Sesi
               </button>
            </div>

            {/* BOX 3: MATERI PEMBELAJARAN */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col justify-center items-center text-center">
               <ListOrdered size={32} className="text-slate-300 mb-4" />
               <h3 className="font-bold text-slate-800 text-sm mb-2">Kurikulum Materi</h3>
               <p className="text-xs text-slate-500 mb-4">Kelola daftar materi yang dipelajari per tingkatan.</p>
               <button className="text-[10px] font-black tracking-widest uppercase bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-all">
                  Atur Materi
               </button>
            </div>

          </div>
        </section>
      )}

      {/* 2. AKUN & LISENSI (Sudah Ada - Dibuat Lebih Compact) */}
      <section className="pt-8 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-slate-900 rounded-lg text-white">
            <User size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Akun & Lisensi Digital</h2>
            <p className="text-sm text-slate-500">Informasi profil dan verifikasi akun pengguna.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* BAGIAN KIRI: CARD ID (KODE SAMA SEPERTI SEBELUMNYA) */}
          <div className="lg:col-span-5 xl:col-span-4">
             <div className="relative bg-gradient-to-br from-slate-900 via-[#0f172a] to-slate-900 rounded-3xl p-8 text-white shadow-2xl overflow-hidden min-h-[450px] flex flex-col border border-white/10">
                <div className="flex justify-between items-start z-10 mb-8">
                   <div className="flex items-center gap-2">
                      <CreditCard className="text-blue-400" size={24} />
                      <span className="text-[10px] font-black tracking-[0.4em] text-blue-200 uppercase">LP3I Digital ID</span>
                   </div>
                </div>
                <div className="flex flex-col items-center z-10 flex-1 justify-center">
                   <div className="relative">
                      <div className="w-32 h-32 rounded-[2rem] p-1 bg-gradient-to-b from-blue-500 to-transparent shadow-2xl mb-6 overflow-hidden">
                         <img src={user.photoURL || ''} alt="Profile" className="w-full h-full object-cover rounded-[1.8rem] bg-slate-800" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-1.5 rounded-xl border-4 border-slate-900 shadow-lg">
                         <BadgeCheck size={18} className="text-white" />
                      </div>
                   </div>
                   <h2 className="text-2xl font-black tracking-tight text-center">{user.displayName || 'No Name'}</h2>
                   <div className="mt-2 px-4 py-1 bg-blue-600/20 rounded-full border border-blue-500/30 text-[10px] font-black uppercase text-blue-300">{user.role}</div>
                </div>
                <div className="z-10 mt-10 pt-6 border-t border-white/5 flex justify-between items-end">
                   <div className="space-y-1">
                      <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Member UID</p>
                      <p className="text-xs font-mono text-blue-100">{user.uid.slice(0, 16)}...</p>
                   </div>
                   <p className="text-xs font-black text-emerald-400">{user.status}</p>
                </div>
             </div>
          </div>

          {/* BAGIAN KANAN: FORM (KODE SAMA SEPERTI SEBELUMNYA) */}
          <div className="lg:col-span-7 xl:col-span-8">
             <div className="bg-white rounded-[2rem] border border-slate-200 p-10 shadow-sm">
                <form onSubmit={handleSaveAccount} className="space-y-8">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Informasi Profil</h3>
                      {!isEditing && <button type="button" onClick={() => setIsEditing(true)} className="text-blue-600 font-bold text-xs">UBAH DATA</button>}
                   </div>
                   
                   {isEditing && (
                      <div className="p-4 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200 flex items-center gap-4">
                         <Camera size={24} className="text-blue-600" />
                         <input type="file" onChange={e => setPhotoFile(e.target.files ? e.target.files[0] : null)} className="text-xs text-slate-500" />
                      </div>
                   )}

                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
                         <input 
                           type="text" 
                           value={displayName} 
                           onChange={e => setDisplayName(e.target.value)} 
                           readOnly={!isEditing}
                           className={`w-full px-5 py-4 rounded-2xl border transition-all font-bold ${isEditing ? 'border-slate-300 focus:ring-4 focus:ring-blue-500/10' : 'bg-slate-50 border-transparent text-slate-500'}`} 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Email</label>
                         <input type="text" value={user.email} readOnly className="w-full px-5 py-4 rounded-2xl bg-slate-50 text-slate-400 font-bold border-transparent" />
                      </div>
                   </div>

                   {isEditing && (
                      <div className="flex gap-4 pt-4">
                         <button type="submit" disabled={loadingAccount} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700">
                            {loadingAccount ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
                         </button>
                         <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 text-slate-500 font-bold">BATAL</button>
                      </div>
                   )}
                </form>
             </div>
          </div>
        </div>
      </section>

      {/* FOOTER LOGOUT UNTUK MOBILE */}
      <div className="md:hidden pt-10">
         <button onClick={logout} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black border border-red-100">LOGOUT DARI SISTEM</button>
      </div>

    </div>
  );
};

export default Settings;