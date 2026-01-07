import React, { useState, useEffect } from 'react';
import { 
  Camera, CreditCard, BadgeCheck, BookOpen, Layers, 
  ListOrdered, Plus, Trash2, LogOut, Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { doc, setDoc, collection, getDocs, deleteDoc, addDoc } from 'firebase/firestore'; 
import { db } from '../services/firebase';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  
  // --- States ---
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [newCourse, setNewCourse] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      if (user.role === 'INSTRUCTOR') fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const snap = await getDocs(collection(db, "course_types"));
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const handleAddCourse = async () => {
    if (!newCourse) return;
    setLoading(true);
    await addDoc(collection(db, "course_types"), { name: newCourse, createdAt: Date.now() });
    setNewCourse('');
    await fetchCourses();
    setLoading(false);
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Hapus kursus ini?")) return;
    setLoading(true);
    await deleteDoc(doc(db, "course_types", id));
    await fetchCourses();
    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setLoading(true);
    try {
      let urlFoto = user?.photoURL || '';
      if (photoFile) {
        const res = await studentService.uploadStudentPhoto(photoFile, `USER_${user.uid}`, 'users');
        if (res.success) urlFoto = res.url!;
      }
      await setDoc(doc(db, 'users', user.uid), { displayName, photoURL: urlFoto }, { merge: true });
      window.location.reload();
    } catch (err) { alert('Gagal simpan profil.'); }
    finally { setLoading(false); }
  };

  if (!user) return <div className="p-20 text-center animate-pulse text-slate-400 tracking-widest">SINKRONISASI...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in px-4">
      
      {/* 1. TOP BAR - MINIMALIST */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive Panel</h1>
          <p className="text-slate-500 font-medium">Manajemen identitas dan kontrol kurikulum sistem.</p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all active:scale-95"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* KOLOM KIRI: IDENTITAS (VIP STYLE) */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-white/5 group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="flex justify-between items-start mb-10">
                 <div className="flex items-center gap-2">
                    <CreditCard className="text-blue-400" size={24} />
                    <span className="text-[10px] font-black tracking-[0.4em] text-blue-200 uppercase">Digital Pass</span>
                 </div>
                 <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[8px] font-black rounded-full border border-emerald-500/30 uppercase tracking-widest">Active</div>
              </div>

              <div className="flex flex-col items-center mb-10">
                 <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-blue-500 via-cyan-300 to-blue-600 shadow-2xl">
                       <img src={user.photoURL || ''} alt="Profile" className="w-full h-full object-cover rounded-full bg-slate-800 border-4 border-[#0f172a]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-xl border-4 border-[#0f172a]">
                       <BadgeCheck size={16} className="text-white" />
                    </div>
                 </div>
                 <h2 className="text-2xl font-black text-center tracking-tight">{user.displayName || 'No Name'}</h2>
                 <p className="text-blue-300/60 text-xs font-bold uppercase tracking-widest mt-1">{user.role}</p>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Credential ID</span>
                    <span className="text-xs font-mono text-blue-100">{user.uid.slice(0, 12).toUpperCase()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">License</span>
                    <span className="text-[10px] font-black text-emerald-400 tracking-widest">VIP ENTERPRISE</span>
                 </div>
              </div>
           </div>

           {/* EDIT PROFILE FORM - MINIMALIST */}
           <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Edit Profil</h3>
                 {!isEditing && <button onClick={() => setIsEditing(true)} className="text-blue-600 font-bold text-xs hover:underline">UBAH</button>}
              </div>
              
              <form onSubmit={handleSaveProfile} className="space-y-5">
                 {isEditing && (
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                       <Camera size={20} className="text-slate-400" />
                       <input type="file" onChange={e => setPhotoFile(e.target.files ? e.target.files[0] : null)} className="text-[10px] text-slate-500" />
                    </div>
                 )}
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={e => setDisplayName(e.target.value)} 
                      readOnly={!isEditing}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold transition-all ${isEditing ? 'border-blue-200 focus:ring-4 focus:ring-blue-500/5' : 'border-transparent bg-slate-50 text-slate-500'}`} 
                    />
                 </div>
                 {isEditing && (
                    <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs shadow-lg flex justify-center items-center gap-2">
                       <Save size={14} /> {loading ? 'SAVING...' : 'SIMPAN PERUBAHAN'}
                    </button>
                 )}
              </form>
           </div>
        </div>

        {/* KOLOM KANAN: MASTER DATA (ADMIN ONLY) */}
        <div className="lg:col-span-8 space-y-8">
           {user.role === 'INSTRUCTOR' && (
             <>
               {/* MODUL 1: MANAJEMEN KURSUS */}
               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                           <BookOpen size={20} />
                        </div>
                        <div>
                           <h3 className="font-black text-slate-800 text-xl">Daftar Kursus</h3>
                           <p className="text-xs text-slate-500">Kelola varian program pendidikan LP3I.</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="p-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {courses.map(c => (
                          <div key={c.id} className="flex justify-between items-center p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group">
                             <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-black text-slate-700">{c.name}</span>
                             </div>
                             <button onClick={() => handleDeleteCourse(c.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                                <Trash2 size={16} />
                             </button>
                          </div>
                        ))}
                     </div>

                     <div className="flex gap-3 bg-slate-900 p-2 rounded-2xl shadow-xl">
                        <input 
                          type="text" 
                          placeholder="Ketik Nama Kursus Baru..." 
                          className="flex-1 px-6 py-3 bg-transparent text-white text-sm font-bold outline-none"
                          value={newCourse}
                          onChange={e => setNewCourse(e.target.value)}
                        />
                        <button onClick={handleAddCourse} disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-500 transition-all flex items-center gap-2">
                           <Plus size={18} /> TAMBAH
                        </button>
                     </div>
                  </div>
               </div>

               {/* MODUL 2 & 3: QUICK CONTROLS */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex items-center gap-6 group hover:border-blue-400 transition-all cursor-pointer">
                     <div className="p-5 bg-slate-100 rounded-[2rem] text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                        <Layers size={32} />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-1">Pengaturan Sesi</h4>
                        <p className="text-xs text-slate-500">Konfigurasi total pertemuan per level.</p>
                     </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex items-center gap-6 group hover:border-blue-400 transition-all cursor-pointer">
                     <div className="p-5 bg-slate-100 rounded-[2rem] text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                        <ListOrdered size={32} />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-1">Update Kurikulum</h4>
                        <p className="text-xs text-slate-500">Modifikasi daftar materi per tingkatan.</p>
                     </div>
                  </div>
               </div>
             </>
           )}
        </div>

      </div>
    </div>
  );
};

export default Settings;
