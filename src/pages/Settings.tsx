import React, { useState, useEffect } from 'react';
import { 
  User, BookOpen, Layers, ListOrdered, Plus, Trash2, LogOut, Save, 
  GraduationCap, AlertTriangle, Clock, TrendingUp, Award, CheckCircle2,
  Quote 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { doc, setDoc, collection, getDocs, deleteDoc, addDoc, getDoc } from 'firebase/firestore'; 
import { db, auth } from '../services/firebase';
import ScheduleManager from '../components/ScheduleManager';
import aboutImg from '../assets/images/tentangkami.png';

type SettingTab = 'PROFILE' | 'COURSES' | 'CURRICULUM' | 'SESSIONS' | 'SCHEDULE' | 'ABOUT';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Navigation
  const [activeTab, setActiveTab] = useState<SettingTab>('PROFILE');
  const [loading, setLoading] = useState(false);

  // Profile State
  const [displayName, setDisplayName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Master Data State
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  
  // Curriculum State
  const [modules, setModules] = useState<string[]>([]);
  const [newModule, setNewModule] = useState('');
  
  // Sessions State
  const [sessionCount, setSessionCount] = useState<number>(12);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      if (user.role === 'INSTRUCTOR') fetchCourses();
    }
  }, [user]);

  // Fetch saat ganti kursus/level di tab kurikulum
  useEffect(() => {
    if (activeTab === 'CURRICULUM' && selectedCourseId) {
      fetchCurriculum(selectedCourseId, selectedLevel);
    }
    if (activeTab === 'SESSIONS' && selectedCourseId) {
      fetchSessionConfig(selectedCourseId, selectedLevel);
    }
  }, [selectedCourseId, selectedLevel, activeTab]);

  // --- DATABASE FUNCTIONS ---

  const fetchCourses = async () => {
    try {
      const snap = await getDocs(collection(db, "course_types"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCourses(list);
      // Auto select first course if available
      if (list.length > 0 && !selectedCourseId) setSelectedCourseId(list[0].id);
    } catch (e) { console.error(e); }
  };

  const fetchCurriculum = async (courseId: string, level: number) => {
    const docId = `CURR_${courseId}_LVL${level}`;
    const snap = await getDoc(doc(db, "curriculums", docId));
    if (snap.exists()) {
      setModules(snap.data().modules || []);
    } else {
      setModules([]);
    }
  };

  const saveCurriculum = async () => {
    if (!selectedCourseId) return;
    const finalId = `CURR_${selectedCourseId}_LVL${selectedLevel}`;
    
    try {
      await setDoc(doc(db, "curriculums", finalId), {
        courseId: selectedCourseId,
        level: selectedLevel,
        modules: modules,
        updatedAt: Date.now()
      });
      alert("Kurikulum tersimpan!");
    } catch (e) { alert("Gagal simpan kurikulum"); }
  };

  const fetchSessionConfig = async (courseId: string, level: number) => {
    const docId = `SESS_${courseId}_LVL${level}`;
    const snap = await getDoc(doc(db, "session_configs", docId));
    if (snap.exists()) {
      setSessionCount(snap.data().totalSessions || 12);
    } else {
      setSessionCount(12); // Default
    }
  };

  const saveSessionConfig = async () => {
    if (!selectedCourseId) return;
    const docId = `SESS_${selectedCourseId}_LVL${selectedLevel}`;
    try {
      await setDoc(doc(db, "session_configs", docId), {
        totalSessions: sessionCount,
        updatedAt: Date.now()
      });
      alert("Pengaturan sesi tersimpan!");
    } catch (e) { alert("Gagal simpan sesi"); }
  };

  // --- HANDLERS ---

  const handleAddModule = () => {
    if (newModule.trim()) {
      setModules([...modules, newModule.trim()]);
      setNewModule('');
    }
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = user?.uid || auth.currentUser?.uid;
    if (!uid) return;
    setLoading(true);
    try {
      let url = user?.photoURL || '';
      if (photoFile) {
        const res = await studentService.uploadStudentPhoto(photoFile, `USER_${uid}`, 'users');
        if (res.success) url = res.url!;
      }
      await setDoc(doc(db, 'users', uid), { displayName, photoURL: url, uid }, { merge: true });
      window.location.reload();
    } catch (e) { alert("Gagal simpan profil"); }
    finally { setLoading(false); }
  };

  const handleAddCourse = async (name: string) => {
    await addDoc(collection(db, "course_types"), { name, createdAt: Date.now() });
    fetchCourses();
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Hapus kursus ini?")) await deleteDoc(doc(db, "course_types", id));
    fetchCourses();
  };

  if (!user) return <div className="p-20 text-center animate-pulse">Memuat...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-8 px-4">Pengaturan Sistem</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-1 space-y-2">
          <button onClick={() => setActiveTab('PROFILE')} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 ${activeTab === 'PROFILE' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' : 'bg-white/50 hover:bg-white/80 text-slate-500 hover:text-blue-600'}`}>
            <User size={20} /> <span className="font-bold text-sm">Profil Akun</span>
          </button>
          
          {user.role === 'INSTRUCTOR' ? (
            <>
              <div className="pt-6 pb-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kurikulum</div>
              <button onClick={() => setActiveTab('COURSES')} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 ${activeTab === 'COURSES' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' : 'bg-white/50 hover:bg-white/80 text-slate-500 hover:text-blue-600'}`}>
                <BookOpen size={20} /> <span className="font-bold text-sm">Jenis Kursus</span>
              </button>
              <button onClick={() => setActiveTab('CURRICULUM')} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 ${activeTab === 'CURRICULUM' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' : 'bg-white/50 hover:bg-white/80 text-slate-500 hover:text-blue-600'}`}>
                <ListOrdered size={20} /> <span className="font-bold text-sm">Materi & Modul</span>
              </button>
              <button onClick={() => setActiveTab('SESSIONS')} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 ${activeTab === 'SESSIONS' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' : 'bg-white/50 hover:bg-white/80 text-slate-500 hover:text-blue-600'}`}>
                <Layers size={20} /> <span className="font-bold text-sm">Total Sesi</span>
              </button>
              <button onClick={() => setActiveTab('SCHEDULE')} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 ${activeTab === 'SCHEDULE' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' : 'bg-white/50 hover:bg-white/80 text-slate-500 hover:text-blue-600'}`}>
                <Clock size={20} /> <span className="font-bold text-sm">Jadwal Kelas</span>
              </button>
            </>
          ) : (
            <>
              <div className="pt-6 pb-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Akademik</div>
              <div className="w-full flex items-center gap-4 p-4 rounded-2xl text-left bg-white/30 border border-white/50 opacity-60 cursor-not-allowed">
                <GraduationCap size={20} className="text-slate-400" /> 
                <div className="flex-1">
                   <span className="font-bold text-sm block text-slate-500">Program Saya</span>
                   <span className="text-[10px] text-slate-400">Lihat di menu Nilai</span>
                </div>
              </div>
            </>
          )}

          <div className="pt-8 space-y-2">
            <button onClick={() => setActiveTab('ABOUT')} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 ${activeTab === 'ABOUT' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white/50 hover:bg-white/80 text-slate-500 hover:text-slate-800'}`}>
              <AlertTriangle size={20} /> <span className="font-bold text-sm">Tentang E-Kursus</span>
            </button>
            <button onClick={logout} className="w-full flex items-center gap-2 p-4 text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-colors">
              <LogOut size={18} /> Keluar
            </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-3">
          <div className="glass-panel min-h-[600px] p-8 relative">
            
            {/* 1. PROFILE TAB */}
            {activeTab === 'PROFILE' && (
              <div className="max-w-xl animate-fade-in">
                <h2 className="text-2xl font-black text-slate-800 mb-6">Identitas Pengguna</h2>
                <div className="flex items-center gap-6 mb-8 p-6 bg-white/50 rounded-3xl border border-white/60 shadow-sm backdrop-blur-sm">
                   <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-lg">
                      <img src={user.photoURL || ''} className="w-full h-full object-cover" alt="" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-800">{user.displayName}</h3>
                      <p className="text-sm text-slate-500 font-medium">{user.email}</p>
                      <span className="inline-block mt-3 px-4 py-1.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-lg uppercase tracking-wider">{user.role}</span>
                   </div>
                </div>

                {/* INFO OTORITAS PROGRAM (KHUSUS INSTRUKTUR) */}
                {user.role === 'INSTRUCTOR' && (
                  <div className="mb-8 p-6 bg-amber-50/80 rounded-3xl border border-amber-100/50">
                    <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                       <Award size={16} /> Program Studi yang Diampu
                    </h4>
                    <div className="flex flex-wrap gap-2">
                       {(!user.authorizedPrograms || user.authorizedPrograms.length === 0) ? (
                          <span className="text-xs text-amber-600 italic font-medium">Belum ada program yang ditugaskan. Hubungi Admin Master.</span>
                       ) : user.authorizedPrograms.includes('ALL') ? (
                          <span className="px-3 py-1 bg-amber-400 text-amber-900 text-xs font-black rounded-lg shadow-sm shadow-amber-200">
                             AKSES PENUH (SUPER ADMIN)
                          </span>
                       ) : (
                          user.authorizedPrograms.map((prog, idx) => (
                             <span key={idx} className="px-3 py-1 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-lg shadow-sm">
                                {prog}
                             </span>
                          ))
                       )}
                    </div>
                    <p className="text-[10px] text-amber-700/60 mt-3 leading-relaxed font-medium">
                       *Sistem hanya akan menampilkan data siswa yang terdaftar dalam program studi di atas.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-6">
                   <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-2 tracking-wide">Ganti Nama</label>
                      <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="glass-input w-full font-bold text-slate-800" />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-2 tracking-wide">Upload Foto Baru</label>
                      <input type="file" onChange={e => setPhotoFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
                   </div>
                   <button disabled={loading} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 w-full md:w-auto">
                      {loading ? "Menyimpan..." : "Simpan Perubahan"}
                   </button>
                </form>

                {/* DANGER ZONE: RESET DATABASE (Instruktur Only) */}
                {user.role === 'INSTRUCTOR' && (
                  <div className="mt-16 pt-8 border-t border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                      <AlertTriangle className="text-red-500" />
                      Zona Bahaya (Danger Zone)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* CARD 1: RESET SYSTEM (COURSES & CURRICULUM) */}
                      <div className="relative overflow-hidden p-6 rounded-3xl border border-red-100 bg-red-50/30 group hover:border-red-200 transition-all">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BookOpen size={80} className="text-red-500 transform rotate-12" />
                         </div>
                         <h4 className="text-lg font-black text-slate-800 mb-2">Reset Sistem Akademik</h4>
                         <p className="text-xs text-slate-500 mb-6 leading-relaxed min-h-[60px]">
                            Menghapus seluruh <b>Jenis Kursus</b>, <b>Kurikulum</b>, dan <b>Konfigurasi Sesi</b>. 
                            Status program siswa akan di-reset (un-enroll), tapi data siswa TETAP ADA.
                         </p>
                         <button 
                           onClick={async () => {
                             if (confirm("KONFIRMASI: Hapus semua Data Kursus & Kurikulum?\n(Data siswa tidak akan dihapus, hanya di-reset programnya)")) {
                               setLoading(true);
                               try {
                                 // 1. Hapus Master Data
                                 const courseSnap = await getDocs(collection(db, "course_types"));
                                 courseSnap.forEach(d => deleteDoc(d.ref));
                                 
                                 const currSnap = await getDocs(collection(db, "curriculums"));
                                 currSnap.forEach(d => deleteDoc(d.ref));
                                 
                                 const sessSnap = await getDocs(collection(db, "session_configs"));
                                 sessSnap.forEach(d => deleteDoc(d.ref));

                                 // 4. Hapus Jadwal Kelas (Agar dashboard siswa bersih)
                                 const scheduleSnap = await getDocs(collection(db, "class_schedules"));
                                 scheduleSnap.forEach(d => deleteDoc(d.ref));

                                 // 2. Un-enroll Siswa (Update only)
                                 const studentsSnap = await getDocs(collection(db, "students"));
                                 studentsSnap.forEach(d => setDoc(d.ref, { program: "", level: 1, classId: null }, { merge: true }));

                                 alert("Sistem Akademik Berhasil Di-reset.");
                                 window.location.reload();
                               } catch (e) { alert("Error: " + e); setLoading(false); }
                             }
                           }}
                           className="w-full py-3 bg-white border-2 border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                         >
                           Reset Kursus & Kurikulum
                         </button>
                      </div>

                      {/* CARD 2: WIPE STUDENTS (DATA PESERTA) */}
                      <div className="relative overflow-hidden p-6 rounded-3xl border border-red-100 bg-red-50/30 group hover:border-red-200 transition-all">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <User size={80} className="text-red-500 transform -rotate-12" />
                         </div>
                         <h4 className="text-lg font-black text-slate-800 mb-2">Hapus Semua Peserta</h4>
                         <p className="text-xs text-slate-500 mb-6 leading-relaxed min-h-[60px]">
                            Menghapus <b>SEMUA DATA SISWA</b> dari tabel peserta.
                            <br/><span className="text-red-500 font-bold">PERINGATAN:</span> Daftar siswa akan menjadi kosong melompong. Akun login mereka tidak terhapus.
                         </p>
                         <button 
                           onClick={async () => {
                             if (confirm("PERINGATAN FATAL: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA PESERTA?\n\nDaftar siswa akan menjadi kosong. Tindakan ini tidak dapat dibatalkan.")) {
                               if (confirm("YAKIN SEKALI LAGI? Data biodata, nilai, dan absensi mereka akan hilang selamanya.")) {
                                 setLoading(true);
                                 try {
                                   const snap = await getDocs(collection(db, "students"));
                                   const promises = snap.docs.map(d => deleteDoc(d.ref));
                                   await Promise.all(promises);
                                   
                                   alert("DATABASE PESERTA TELAH DIKOSONGKAN.");
                                   window.location.reload();
                                 } catch (e) { alert("Error: " + e); setLoading(false); }
                               }
                             }
                           }}
                           className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all shadow-red-200"
                         >
                           MUSNAHKAN DATA PESERTA
                         </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. COURSES TAB */}
            {activeTab === 'COURSES' && (
              <div className="animate-fade-in">
                 <h2 className="text-2xl font-black text-slate-800 mb-2">Jenis Kursus</h2>
                 <p className="text-slate-500 text-sm mb-8">Tambah program studi baru yang tersedia di LP3I.</p>
                 
                 <div className="flex gap-2 mb-8">
                    <input id="newCourseInput" type="text" placeholder="Nama Kursus (cth: Web Design)" className="glass-input flex-1 font-bold" />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('newCourseInput') as HTMLInputElement;
                        if (input.value) { handleAddCourse(input.value); input.value = ''; }
                      }}
                      className="px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg"
                    >
                      TAMBAH
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map(c => (
                       <div key={c.id} className="flex justify-between items-center p-5 bg-white/50 rounded-2xl border border-white/60 group hover:border-blue-200 transition-all shadow-sm">
                          <span className="font-bold text-slate-700">{c.name}</span>
                          <button onClick={() => handleDeleteCourse(c.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {/* 3. CURRICULUM EDITOR (BARU & CANGGIH) */}
            {activeTab === 'CURRICULUM' && (
               <div className="animate-fade-in max-w-2xl">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-black text-slate-800">Editor Kurikulum</h2>
                     <button onClick={saveCurriculum} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 shadow-md">
                        <Save size={16} /> Simpan
                     </button>
                  </div>

                  {/* Selector */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pilih Kursus</label>
                        <select 
                          className="glass-input w-full font-bold text-slate-700"
                          value={selectedCourseId}
                          onChange={e => setSelectedCourseId(e.target.value)}
                        >
                           <option value="">-- Pilih --</option>
                           {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pilih Level</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                           {[1, 2, 3].map(lvl => (
                              <button 
                                key={lvl}
                                onClick={() => setSelectedLevel(lvl)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${selectedLevel === lvl ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                 Level {lvl}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* List Materi */}
                  {selectedCourseId ? (
                     <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100/50">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                           <ListOrdered size={18} className="text-blue-500" />
                           Daftar Materi (Level {selectedLevel})
                        </h3>
                        
                        <div className="space-y-2 mb-4">
                           {modules.map((mod, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-white/60 shadow-sm">
                                 <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                 <span className="flex-1 text-sm font-medium text-slate-700">{mod}</span>
                                 <button onClick={() => removeModule(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                              </div>
                           ))}
                           {modules.length === 0 && <p className="text-center text-slate-400 text-sm py-4 italic">Belum ada materi.</p>}
                        </div>

                        <div className="flex gap-2">
                           <input 
                             type="text" 
                             className="glass-input flex-1 text-sm"
                             placeholder="Tambah materi baru..."
                             value={newModule}
                             onChange={e => setNewModule(e.target.value)}
                             onKeyDown={e => e.key === 'Enter' && handleAddModule()}
                           />
                           <button onClick={handleAddModule} className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700"><Plus size={20} /></button>
                        </div>
                     </div>
                  ) : (
                     <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        Pilih kursus terlebih dahulu.
                     </div>
                  )}
               </div>
            )}

            {/* 4. SESSIONS CONFIG */}
            {activeTab === 'SESSIONS' && (
               <div className="animate-fade-in max-w-xl">
                  <h2 className="text-2xl font-black text-slate-800 mb-6">Konfigurasi Sesi</h2>
                  
                  {selectedCourseId ? (
                     <div className="bg-slate-50/50 p-8 rounded-[2.5rem] text-center border border-slate-100">
                        <div className="mb-6">
                           <GraduationCap size={48} className="mx-auto text-blue-200 mb-4" />
                           <h3 className="text-lg font-bold text-slate-700">Atur Total Pertemuan</h3>
                           <p className="text-sm text-slate-500">Berapa kali pertemuan untuk menyelesaikan Level {selectedLevel}?</p>
                        </div>

                        <div className="flex items-center justify-center gap-6 mb-8">
                           <button onClick={() => setSessionCount(c => Math.max(1, c - 1))} className="w-12 h-12 rounded-full bg-white shadow hover:bg-slate-100 font-bold text-xl">-</button>
                           <div className="text-5xl font-black text-slate-800">{sessionCount}</div>
                           <button onClick={() => setSessionCount(c => c + 1)} className="w-12 h-12 rounded-full bg-white shadow hover:bg-slate-100 font-bold text-xl">+</button>
                        </div>

                        <button onClick={saveSessionConfig} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                           SIMPAN PENGATURAN
                        </button>
                     </div>
                  ) : (
                     <div className="text-center py-10 text-slate-400">Silakan kembali ke menu Kurikulum dan pilih kursus dulu.</div>
                  )}
               </div>
            )}

            {/* 5. SCHEDULE MANAGER */}
            {activeTab === 'SCHEDULE' && (
               <div className="animate-fade-in">
                  <ScheduleManager />
               </div>
            )}

            {/* 6. ABOUT TAB */}
            {activeTab === 'ABOUT' && (
              <div className="max-w-4xl mx-auto py-10 animate-fade-in">
                {/* ... (About content remains similar, just removed dark mode classes implicitly by full replacement) ... */}
                {/* Header Section */}
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl mb-6 rotate-12 transition-transform hover:rotate-0 duration-500">
                    <BookOpen size={40} />
                  </div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tighter">E-KURSUS</h2>
                  <p className="text-blue-600 font-bold tracking-[0.3em] text-[10px] mt-2 uppercase">Platform v1.5 Professional</p>
                </div>

                {/* Developer Message Section */}
                <div className="relative bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl shadow-blue-100 border border-slate-100 overflow-hidden flex flex-col md:flex-row mb-12">
                   <div className="w-full md:w-2/5 relative h-64 md:h-auto overflow-hidden">
                      <img src={aboutImg} className="w-full h-full object-cover object-top md:object-cover scale-105 hover:scale-110 transition-transform duration-1000" alt="Developer Model" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-white"></div>
                   </div>

                   <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center relative">
                      <Quote className="absolute top-4 right-6 md:top-8 md:right-10 text-slate-100 opacity-50 w-16 h-16 md:w-24 md:h-24" />
                      
                      <div className="relative z-10">
                        <h3 className="text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-3 md:mb-4">Pesan Dari Pengembang</h3>
                        <p className="font-serif text-lg md:text-2xl text-slate-700 leading-relaxed italic">
                          "E-Kursus lahir dari sebuah visi untuk mendigitalisasi setiap capaian belajar dengan presisi tinggi. Meski masih dalam tahap awal pengembangan, sistem ini dibangun dengan dedikasi penuh untuk memberikan standar akademik terbaik bagi institusi."
                        </p>
                        
                        <div className="mt-6 md:mt-8 flex items-center gap-4">
                           <div className="h-[1px] w-8 md:w-12 bg-blue-600"></div>
                           <span className="font-sans font-bold text-slate-800 text-[10px] md:text-sm tracking-widest uppercase">Ahdi Yourse & Dev Team</span>
                        </div>
                      </div>
                   </div>
                </div>

                {/* System Specs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-2">Misi Utama</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Mengintegrasikan pemantauan kehadiran, penilaian praktikum, dan pelaporan capaian belajar secara real-time untuk LP3I College Indramayu.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
                      <TrendingUp className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                      <h5 className="font-bold text-xs text-slate-800 uppercase">Analisis Data</h5>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight">Visualisasi performa dengan 10+ diagram interaktif.</p>
                    </div>
                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-orange-200 transition-all">
                      <Award className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                      <h5 className="font-bold text-xs text-slate-800 uppercase">Sertifikasi</h5>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight">Generate sertifikat otomatis berstandar formal.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-100 flex flex-wrap justify-center gap-8 text-slate-300">
                   <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><CheckCircle2 size={14} className="text-blue-500" /> Cloud Sync</div>
                   <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><CheckCircle2 size={14} className="text-blue-500" /> Real-time DB</div>
                   <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><CheckCircle2 size={14} className="text-blue-500" /> Data Secure</div>
                </div>

                <div className="text-center mt-12">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">Dedicated to LP3I College Indramayu</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
