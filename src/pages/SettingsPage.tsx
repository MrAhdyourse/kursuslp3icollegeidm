import React, { useState, useEffect } from 'react';
import { 
  User, BookOpen, Layers, ListOrdered, Plus, Trash2, LogOut, Save, 
  AlertTriangle, Clock, Award, ChevronRight, ArrowLeft, Camera, Shield,
  TrendingUp, CheckCircle2, Quote
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { doc, setDoc, collection, getDocs, deleteDoc, addDoc, getDoc } from 'firebase/firestore'; 
import { db, auth } from '../services/firebase';
import { examService } from '../services/examService';
import ScheduleManager from '../components/ScheduleManager';
import { useIsMobile } from '../hooks/useIsMobile';
import aboutImg from '../assets/images/tentangkami.png';

type SettingTab = 'PROFILE' | 'COURSES' | 'CURRICULUM' | 'SESSIONS' | 'SCHEDULE' | 'ABOUT';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<SettingTab>('PROFILE');
  const [mobileViewMode, setMobileViewMode] = useState<'MENU' | 'CONTENT'>(isMobile ? 'MENU' : 'CONTENT');

  const [loading, setLoading] = useState(false);

  // Profile State
  const [displayName, setDisplayName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Master Data State
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [modules, setModules] = useState<string[]>([]);
  const [newModule, setNewModule] = useState('');
  const [sessionCount, setSessionCount] = useState<number>(12);

  // Security State
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityAction, setSecurityAction] = useState<'RESET_SYSTEM' | 'WIPE_STUDENTS' | null>(null);
  const [securityInput, setSecurityInput] = useState('');

  // --- INITIALIZATION ---
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      if (user.role === 'INSTRUCTOR') fetchCourses();
    }
  }, [user]);

  useEffect(() => {
    if (!isMobile) setMobileViewMode('CONTENT');
  }, [isMobile]);

  useEffect(() => {
    if (activeTab === 'CURRICULUM' && selectedCourseId) fetchCurriculum(selectedCourseId, selectedLevel);
    if (activeTab === 'SESSIONS' && selectedCourseId) fetchSessionConfig(selectedCourseId, selectedLevel);
  }, [selectedCourseId, selectedLevel, activeTab]);

  // --- HANDLERS ---
  const handleTabClick = (tab: SettingTab) => {
    setActiveTab(tab);
    if (isMobile) setMobileViewMode('CONTENT');
  };

  const handleMobileBack = () => setMobileViewMode('MENU');

  // --- DATABASE & LOGIC (UTUH 100%) ---
  const fetchCourses = async () => {
    try {
      const snap = await getDocs(collection(db, "course_types"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCourses(list);
      if (list.length > 0 && !selectedCourseId) setSelectedCourseId(list[0].id);
    } catch (e) { console.error(e); }
  };

  const fetchCurriculum = async (courseId: string, level: number) => {
    const docId = `CURR_${courseId}_LVL${level}`;
    const snap = await getDoc(doc(db, "curriculums", docId));
    setModules(snap.exists() ? snap.data().modules || [] : []);
  };

  const saveCurriculum = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "curriculums", `CURR_${selectedCourseId}_LVL${selectedLevel}`), {
        courseId: selectedCourseId, level: selectedLevel, modules: modules, updatedAt: Date.now()
      });
      alert("Kurikulum tersimpan!");
    } catch (e) { alert("Gagal simpan kurikulum"); }
    finally { setLoading(false); }
  };

  const fetchSessionConfig = async (courseId: string, level: number) => {
    const docId = `SESS_${courseId}_LVL${level}`;
    const snap = await getDoc(doc(db, "session_configs", docId));
    setSessionCount(snap.exists() ? snap.data().totalSessions || 12 : 12);
  };

  const saveSessionConfig = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "session_configs", `SESS_${selectedCourseId}_LVL${selectedLevel}`), {
         totalSessions: sessionCount, updatedAt: Date.now() 
      });
      alert("Pengaturan sesi tersimpan!");
    } catch (e) { alert("Gagal simpan sesi"); }
    finally { setLoading(false); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = user?.uid || auth.currentUser?.uid;
    if (!uid) return;
    // VALIDASI UKURAN FILE (MAX 5MB)
    if (photoFile && photoFile.size > 5 * 1024 * 1024) {
      alert("Ukuran foto terlalu besar! Maksimal 5MB.");
      return;
    }

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

  const handleAddModule = () => { if (newModule.trim()) { setModules([...modules, newModule.trim()]); setNewModule(''); } };
  const removeModule = (i: number) => { setModules(modules.filter((_, idx) => idx !== i)); };
  const handleAddCourse = async (name: string) => { await addDoc(collection(db, "course_types"), { name, createdAt: Date.now() }); fetchCourses(); };
  const handleDeleteCourse = async (id: string) => { if (confirm("Hapus kursus ini?")) await deleteDoc(doc(db, "course_types", id)); fetchCourses(); };

  // --- FULL SECURITY LOGIC ---
  const handleSecurityChallenge = (action: 'RESET_SYSTEM' | 'WIPE_STUDENTS') => { 
    setSecurityAction(action); 
    setSecurityInput(''); 
    setShowSecurityModal(true); 
  };

  const executeSecureAction = async () => {
    if (securityInput !== '262003') {
      alert("AKSES DITOLAK: Kode Otorisasi Salah!");
      return;
    }
    setShowSecurityModal(false);
    setLoading(true);
    try {
      if (securityAction === 'RESET_SYSTEM') {
         const courseSnap = await getDocs(collection(db, "course_types"));
         courseSnap.forEach(d => deleteDoc(d.ref));
         const currSnap = await getDocs(collection(db, "curriculums"));
         currSnap.forEach(d => deleteDoc(d.ref));
         const sessSnap = await getDocs(collection(db, "session_configs"));
         sessSnap.forEach(d => deleteDoc(d.ref));
         const scheduleSnap = await getDocs(collection(db, "class_schedules"));
         scheduleSnap.forEach(d => deleteDoc(d.ref));
         const studentsSnap = await getDocs(collection(db, "students"));
         studentsSnap.forEach(d => setDoc(d.ref, { program: "", level: 1, classId: null }, { merge: true }));
         alert("Sistem Akademik Berhasil Di-reset.");
         window.location.reload();
      } else if (securityAction === 'WIPE_STUDENTS') {
         const snap = await getDocs(collection(db, "students"));
         const promises = snap.docs.map(d => deleteDoc(d.ref));
         await Promise.all(promises);
         alert("DATABASE PESERTA TELAH DIKOSONGKAN.");
         window.location.reload();
      }
    } catch (e) { alert("Terjadi Kesalahan: " + e); } 
    finally { setLoading(false); }
  };

  const handleSeedExam = async () => {
    if (!confirm("Buat Data Dummy Ujian untuk Testing?")) return;
    setLoading(true);
    try {
      await examService.createExam({
        programId: "Microsoft Office",
        title: "Ujian Akhir Kompetensi Office",
        durationMinutes: 180,
        passingGrade: 75,
        isActive: true,
        questions: [
          { id: "q1", text: "Fungsi shortcut CTRL + Z adalah...", options: ["Save", "Undo", "Cut", "Bold", "Print"], correctIndex: 1, points: 5 },
          { id: "q2", text: "Rumus jumlah Excel?", options: ["=COUNT", "=MAX", "=SUM", "=AVG", "=TOTAL"], correctIndex: 2, points: 5 },
          { id: "q3", text: "Mail Merge untuk...", options: ["Grafik", "Animasi", "Surat Massal", "Laporan", "Database"], correctIndex: 2, points: 5 }
        ]
      });
      alert("Data Ujian Dummy Berhasil Dibuat!");
    } catch (e) { alert("Gagal seed: " + e); } 
    finally { setLoading(false); }
  };

  // --- RENDER HELPERS ---
  const MenuRow = ({ id, icon: Icon, label }: { id?: SettingTab, icon: any, label: string }) => {
    const isActive = activeTab === id;
    if (!id) {
       return (
        <button onClick={logout} className="w-full flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-gray-200 transition-colors group">
           <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center group-hover:bg-gray-300">
             <LogOut size={20} className="text-black" />
           </div>
           <span className="flex-1 text-left font-semibold text-[15px] text-black">Keluar</span>
           <ChevronRight size={20} className="text-gray-400" />
        </button>
       );
    }
    return (
      <button onClick={() => handleTabClick(id)} className={`w-full flex items-center gap-4 px-2 py-3 rounded-lg transition-colors ${isActive && !isMobile ? 'bg-[#ebf5ff]' : 'hover:bg-gray-100'}`}>
         <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isActive && !isMobile ? 'bg-[#1877f2] text-white' : 'bg-gray-200 text-black'}`}>
            <Icon size={20} />
         </div>
         <span className={`flex-1 text-left font-semibold text-[15px] ${isActive && !isMobile ? 'text-[#1877f2]' : 'text-black'}`}>{label}</span>
         <ChevronRight size={20} className="text-gray-400" />
      </button>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f0f2f5] -m-8 p-4 md:p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        
        {/* MOBILE HEADER */}
        {isMobile && mobileViewMode === 'CONTENT' && (
           <div className="flex items-center gap-3 mb-4 sticky top-0 bg-[#f0f2f5] z-10 py-2">
              <button onClick={handleMobileBack} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                 <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-bold text-slate-800">Kembali</h2>
           </div>
        )}
        
        {/* DESKTOP HEADER */}
        {(!isMobile || mobileViewMode === 'MENU') && (
           <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#1c1e21]">Pengaturan & Privasi</h1>
           </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 items-start">
           
           {/* SIDEBAR (MENU LIST) */}
           {(!isMobile || mobileViewMode === 'MENU') && (
             <div className="w-full md:w-[360px] flex-shrink-0 space-y-4">
                <div className="bg-white rounded-xl shadow-sm p-4">
                   <div className="flex items-center gap-4 px-2 py-3 mb-2 border-b border-gray-100 pb-4">
                      <img src={user.photoURL || ''} className="w-10 h-10 rounded-full object-cover bg-gray-200" alt="Profile" />
                      <div className="overflow-hidden">
                         <div className="font-bold text-[#1c1e21] truncate">{user.displayName}</div>
                         <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                   </div>
                   <MenuRow id="PROFILE" icon={User} label="Detail Profil" />
                </div>

                {user.role === 'INSTRUCTOR' && (
                  <div className="bg-white rounded-xl shadow-sm p-4">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Manajemen Akademik</h3>
                     <MenuRow id="COURSES" icon={BookOpen} label="Jenis Kursus" />
                     <MenuRow id="CURRICULUM" icon={ListOrdered} label="Kurikulum & Materi" />
                     <MenuRow id="SESSIONS" icon={Layers} label="Konfigurasi Sesi" />
                     <MenuRow id="SCHEDULE" icon={Clock} label="Jadwal Kelas" />
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-sm p-4">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Lainnya</h3>
                   <MenuRow id="ABOUT" icon={AlertTriangle} label="Tentang E-Kursus" />
                   <div className="my-2 border-t border-gray-100"></div>
                   <MenuRow icon={LogOut} label="Keluar" />
                </div>
             </div>
           )}

           {/* CONTENT PANEL */}
           {(!isMobile || mobileViewMode === 'CONTENT') && (
             <div className="flex-1 bg-white rounded-xl shadow-sm min-h-[500px] w-full p-6 md:p-8">
                
                {/* 1. PROFILE */}
                {activeTab === 'PROFILE' && (
                   <div className="max-w-2xl animate-fade-in">
                      <h2 className="text-2xl font-bold text-[#1c1e21] mb-6">Informasi Pribadi</h2>
                      <div className="flex flex-col items-center mb-8">
                         <div className="relative group">
                            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-100">
                               <img src={previewUrl || user.photoURL || ''} className="w-full h-full object-cover" alt="Profile" />
                            </div>
                            <label className="absolute bottom-2 right-2 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors shadow-md">
                               <Camera size={20} className="text-black" />
                               <input type="file" className="hidden" accept="image/*" onChange={e => {
                                   if(e.target.files?.[0]) {
                                      const file = e.target.files[0];
                                      if (file.size > 5 * 1024 * 1024) {
                                        alert("Maksimal 5MB!");
                                        e.target.value = ""; // Reset input
                                        return;
                                      }
                                      setPhotoFile(file);
                                      setPreviewUrl(URL.createObjectURL(file));
                                   }
                               }} />
                            </label>
                         </div>
                         <p className="mt-4 text-sm text-gray-500 font-medium">Ubah Foto Profil</p>
                      </div>

                      <form onSubmit={handleSaveProfile} className="space-y-6">
                         <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Tampilan</label>
                            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-transparent font-bold text-lg text-[#1c1e21] outline-none border-b-2 border-transparent focus:border-[#1877f2] transition-all" />
                         </div>

                         {user.role === 'INSTRUCTOR' && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                               <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-sm"><Shield size={16} /> Otoritas Instruktur</div>
                               <div className="flex flex-wrap gap-2">
                                  {(user.authorizedPrograms || ['Guest']).map((p:string, i:number) => (
                                     <span key={i} className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 shadow-sm">{p}</span>
                                  ))}
                               </div>
                            </div>
                         )}

                         <button disabled={loading} className="w-full bg-[#1877f2] text-white py-3 rounded-lg font-bold hover:bg-[#166fe5] shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2">
                            {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
                         </button>
                      </form>

                      {user.role === 'INSTRUCTOR' && (
                         <div className="mt-12 pt-8 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle size={16}/> Zona Keamanan Master</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <button onClick={() => handleSecurityChallenge('RESET_SYSTEM')} className="p-4 text-left border border-red-100 rounded-xl bg-red-50 hover:bg-red-500 hover:text-white transition-all group">
                                  <div className="font-bold">Reset Sistem</div>
                                  <div className="text-[10px] opacity-70">Hapus Kursus & Kurikulum</div>
                               </button>
                               <button onClick={() => handleSecurityChallenge('WIPE_STUDENTS')} className="p-4 text-left border border-red-200 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all">
                                  <div className="font-bold">Musnahkan Data Siswa</div>
                                  <div className="text-[10px] opacity-70">Kosongkan Database Peserta</div>
                               </button>
                            </div>
                            <div className="mt-6 text-center"><button onClick={handleSeedExam} className="text-xs text-blue-500 hover:underline font-bold">[DEV] Seed Exam Data</button></div>
                         </div>
                      )}
                   </div>
                )}

                {/* 2. COURSES */}
                {activeTab === 'COURSES' && (
                   <div className="animate-fade-in">
                      <h2 className="text-2xl font-bold text-[#1c1e21] mb-6">Kelola Kursus</h2>
                      <div className="flex gap-2 mb-6">
                         <input id="courseInput" type="text" placeholder="Nama Program..." className="flex-1 bg-gray-100 px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-[#1877f2]" />
                         <button onClick={() => { const el = document.getElementById('courseInput') as HTMLInputElement; if(el.value) { handleAddCourse(el.value); el.value=''; } }} className="bg-[#1877f2] text-white px-6 rounded-lg font-bold flex items-center gap-2"><Plus size={18}/> Tambah</button>
                      </div>
                      <div className="space-y-2">
                         {courses.map(c => (
                            <div key={c.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                               <span className="font-bold text-gray-700">{c.name}</span>
                               <button onClick={() => handleDeleteCourse(c.id)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {/* 3. CURRICULUM */}
                {activeTab === 'CURRICULUM' && (
                   <div className="animate-fade-in">
                      <div className="flex justify-between items-center mb-6">
                         <h2 className="text-2xl font-bold text-[#1c1e21]">Editor Kurikulum</h2>
                         <button onClick={saveCurriculum} className="bg-[#1877f2] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-[#166fe5] flex items-center gap-2"><Save size={18}/> Simpan</button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                         <select className="bg-gray-100 p-3 rounded-lg font-bold text-gray-700 outline-none" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                            <option value="">Pilih Program</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                         <div className="flex bg-gray-100 p-1 rounded-lg">
                            {[1,2,3].map(l => <button key={l} onClick={() => setSelectedLevel(l)} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${selectedLevel === l ? 'bg-white shadow text-[#1877f2]' : 'text-gray-400'}`}>Lvl {l}</button>)}
                         </div>
                      </div>
                      {selectedCourseId ? (
                         <div className="border border-gray-200 rounded-xl p-4 bg-slate-50/50">
                            {modules.map((m, i) => (
                               <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-200 last:border-0">
                                  <div className="w-6 h-6 bg-blue-100 text-[#1877f2] rounded-full flex items-center justify-center text-xs font-bold">{i+1}</div>
                                  <div className="flex-1 font-medium text-gray-700">{m}</div>
                                  <button onClick={() => removeModule(i)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                               </div>
                            ))}
                            <div className="flex gap-2 mt-4">
                               <input type="text" placeholder="Ketik materi..." className="flex-1 bg-white px-4 py-2 rounded-lg border border-gray-200 outline-none" value={newModule} onChange={e => setNewModule(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddModule()} />
                               <button onClick={handleAddModule} className="bg-gray-800 text-white px-4 rounded-lg"><Plus size={20}/></button>
                            </div>
                         </div>
                      ) : <div className="text-center py-10 text-gray-400 font-medium">Silakan pilih kursus untuk mengedit materi.</div>}
                   </div>
                )}

                {/* 4. SESSIONS */}
                {activeTab === 'SESSIONS' && (
                   <div className="text-center py-10 animate-fade-in">
                      <h2 className="text-2xl font-bold text-[#1c1e21] mb-8">Konfigurasi Pertemuan</h2>
                      {selectedCourseId ? (
                         <div className="inline-block p-10 bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-100 w-full max-w-sm">
                            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Total Sesi Level {selectedLevel}</h3>
                            <div className="text-7xl font-black text-[#1c1e21] mb-8">{sessionCount}</div>
                            <div className="flex justify-center gap-6 mb-8">
                               <button onClick={() => setSessionCount(c => Math.max(1, c-1))} className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold">-</button>
                               <button onClick={() => setSessionCount(c => c+1)} className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center text-2xl font-bold">+</button>
                            </div>
                            <button onClick={saveSessionConfig} className="w-full py-4 bg-[#1877f2] text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-[#166fe5]">Simpan Konfigurasi</button>
                         </div>
                      ) : <div className="text-gray-400 font-bold">Pilih kursus di menu Kurikulum terlebih dahulu.</div>}
                </div>
                )}

                {/* 5. SCHEDULE */}
                {activeTab === 'SCHEDULE' && <ScheduleManager />}

                {/* 6. ABOUT */}
                {activeTab === 'ABOUT' && (
                   <div className="max-w-4xl mx-auto py-10 animate-fade-in text-center">
                      <div className="w-20 h-20 bg-[#1877f2] rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-xl rotate-3"><BookOpen size={40} /></div>
                      <h2 className="text-3xl font-black text-[#1c1e21]">E-KURSUS</h2>
                      <p className="text-gray-400 font-bold tracking-widest text-xs mt-2 uppercase">Professional Education System</p>
                      
                      <div className="mt-10 relative rounded-[3rem] overflow-hidden border border-gray-100 bg-white shadow-xl shadow-gray-200/50 flex flex-col md:flex-row-reverse">
                         {/* Gambar di sebelah kanan pada Desktop */}
                         <div className="w-full md:w-1/2 h-72 md:h-auto relative">
                            <img src={aboutImg} className="w-full h-full object-cover" alt="LP3I" />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                         </div>
                         
                         {/* Teks di sebelah kiri pada Desktop */}
                         <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center text-left bg-gradient-to-br from-white to-gray-50">
                            <Quote className="text-[#1877f2] opacity-10 mb-6" size={64} />
                            <p className="text-gray-700 italic text-xl md:text-2xl leading-relaxed font-serif relative z-10">
                               "Sistem ini dibangun untuk memberikan pengalaman akademik yang transparan, aman, dan berstandar internasional bagi seluruh sivitas LP3I Indramayu."
                            </p>
                            <div className="mt-8 flex items-center gap-4">
                               <div className="h-[2px] w-12 bg-[#1877f2]"></div>
                               <span className="font-bold text-[#1c1e21] uppercase tracking-widest text-sm">Ahdi Yourse & Dev Team</span>
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 px-4">
                         {[
                           { icon: CheckCircle2, label: 'Cloud Sync', color: 'text-emerald-500' },
                           { icon: Shield, label: 'Secure', color: 'text-blue-500' },
                           { icon: TrendingUp, label: 'Analytics', color: 'text-purple-500' },
                           { icon: Award, label: 'Certified', color: 'text-orange-500' }
                         ].map((item, idx) => (
                           <div key={idx} className="p-4 bg-white rounded-2xl border border-gray-100 flex flex-col items-center gap-2 shadow-sm">
                              <item.icon className={item.color} size={20} />
                              <span className="text-[10px] font-black uppercase text-gray-500">{item.label}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                )}

             </div>
           )}

        </div>
      </div>

      {/* SECURITY MODAL */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} /></div>
              <h3 className="font-bold text-xl text-gray-800 mb-2">Konfirmasi Master</h3>
              <p className="text-gray-500 text-sm mb-6">Tindakan ini permanen. Masukkan kode otorisasi super admin.</p>
              <input type="password" value={securityInput} onChange={e => setSecurityInput(e.target.value)} placeholder="KODE MASTER" className="w-full text-center p-4 bg-gray-50 border-2 border-gray-200 rounded-xl mb-4 font-black tracking-widest outline-none focus:border-red-500 transition-all uppercase" />
              <button onClick={executeSecureAction} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all">EKSEKUSI PERINTAH</button>
              <button onClick={() => setShowSecurityModal(false)} className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 mt-2">Batalkan</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
