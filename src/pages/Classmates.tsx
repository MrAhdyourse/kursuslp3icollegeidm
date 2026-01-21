import React, { useEffect, useState } from 'react';
import { 
  Users, BookOpen, FileText, Award, ChevronRight, Clock, 
  CheckCircle2, PlayCircle, Folder, Lock, ArrowLeft,
  Plus, Trash2, Settings, Timer, Search
} from 'lucide-react';import { studentService } from '../services/studentService';
import { scheduleService } from '../services/scheduleService';
import { moduleService, type ModuleData } from '../services/moduleService';
import { useAuth } from '../context/AuthContext';
import { ModuleUploadModal } from '../components/ModuleUploadModal';
import { ExamResultsModal } from '../components/ExamResultsModal';
import type { ClassGroup } from '../types';

type ClassTab = 'STUDENTS' | 'MODULES' | 'QUIZZES' | 'FINAL';

const Classmates: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Exam State
  const [showExamResults, setShowExamResults] = useState(false);
  const [activeExamId, setActiveExamId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ClassTab>('STUDENTS'); // [RESTORED]

  // COUNTDOWN LOGIC (Target: 20 Jan 2026 08:00)
  const [examCountdown, setExamCountdown] = useState<string>('');
  const [isExamOpen, setIsExamOpen] = useState(false);

  useEffect(() => {
    // Set Target Date: Selasa, 20 Januari 2026 jam 08:00 WIB
    const targetDate = new Date('2026-01-20T08:00:00').getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setIsExamOpen(true);
        setExamCountdown('UJIAN DIBUKA');
      } else {
        setIsExamOpen(false);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setExamCountdown(`${days} Hari : ${hours} Jam : ${minutes} Menit : ${seconds} Detik`);
      }
    };

    updateTimer(); // Initial call
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, []);

  // ... (Load Modules & Students Logic remains same) ...

  const loadModules = async (programId: string) => {
    if (!programId) return;
    const data = await moduleService.getModulesByProgram(programId);
    setModules(data);
  };

  // FETCH EXAM ID (Fix: Hardcode ke GLOBAL_UJIKOM agar sinkron dengan siswa)
  useEffect(() => {
    const fetchExam = async () => {
      const cls = classes.find(c => c.id === selectedClassId);
      if (cls && activeTab === 'FINAL') {
        // Kita force ID-nya sama dengan yang dipakai di ExamRoom.tsx
        setActiveExamId('GLOBAL_UJIKOM');
      }
    };
    fetchExam();
  }, [selectedClassId, activeTab, classes]);

  useEffect(() => {
    const unsubStudents = studentService.subscribeToPublicStudents((data) => {
      setStudents(data);
      
      // AUTO-LOCK FOR STUDENT
      if (user?.role === 'STUDENT') {
        // PRIORITY 1: Gunakan data dari AuthContext yang sudah di-merge (pasti akurat karena by Email)
        const userClassId = (user as any).classId;
        
        if (userClassId) {
             setSelectedClassId(userClassId);
        } else {
             // PRIORITY 2: Fallback cari di list (jika ID kebetulan cocok)
             const myProfile = data.find(s => s.id === user.uid); 
             if (myProfile && myProfile.classId) {
               setSelectedClassId(myProfile.classId);
             } else {
               setSelectedClassId('UNASSIGNED'); 
             }
        }
      }
      setLoading(false);
    });

    const unsubClasses = scheduleService.subscribeToActiveSchedules((data) => {
      setClasses(data);
    });

    return () => {
      unsubStudents();
      unsubClasses();
    };
  }, [user]);

  // Load Modules when Class Selected
  const selectedClass = classes.find(c => c.id === selectedClassId);
  
  useEffect(() => {
    if (selectedClass?.programId && activeTab === 'MODULES') {
      loadModules(selectedClass.programId);
    }
  }, [selectedClass, activeTab]);

  const handleDeleteModule = async (id: string) => {
    if (confirm("Hapus modul ini?")) {
      await moduleService.deleteModule(id);
      if (selectedClass?.programId) loadModules(selectedClass.programId);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.program.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentsInClass = (classId: string | null) => {
    if (user?.role === 'STUDENT' && classId !== selectedClassId) return [];
    return filteredStudents.filter(s => s.classId === classId);
  };

  const isStudent = user?.role === 'STUDENT';
  const isInstructor = user?.role === 'INSTRUCTOR';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Menyiapkan Direktori Kelas...</p>
      </div>
    );
  }

  // --- SUB-COMPONENTS RENDERER ---

  const renderContent = () => {
    switch (activeTab) {
      case 'STUDENTS':
        return (
          <div className="animate-fade-in-up">
             <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                  <Users className="text-blue-500" size={20} />
                  Daftar Peserta Didik
                </h3>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari peserta..." 
                    className="glass-input w-full pl-10 py-2 text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {getStudentsInClass(selectedClassId === 'UNASSIGNED' ? null : selectedClassId).map((student) => (
                <div key={student.id} className="glass-panel glass-panel-hover group p-6 relative overflow-hidden text-center">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden mb-4 border-4 border-white shadow-md transform group-hover:rotate-3 transition-transform">
                      {student.avatarUrl ? (
                        <img src={student.avatarUrl} className="w-full h-full object-cover" alt={student.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-400">
                          <Users size={32} />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors line-clamp-1">{student.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 mb-3">
                      {student.nis}
                    </p>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 px-3 py-1 rounded-full">
                      {student.program}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'MODULES':
        return (
          <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
               <div>
                 <h3 className="text-xl font-bold text-slate-800">Modul Pembelajaran</h3>
                 <p className="text-sm text-slate-500">Materi praktik dan teori sesuai kurikulum.</p>
               </div>
               {isInstructor && (
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="btn-primary px-4 py-2 flex items-center gap-2 text-xs"
                >
                  <Plus size={16} /> Upload Materi
                </button>
               )}
            </div>
            
            {/* Real Module List */}
            {modules.length > 0 ? (
              modules.map((mod, index) => (
                <div key={mod.id} className="glass-panel p-6 flex items-start gap-5 group hover:border-blue-300 transition-colors relative">
                  
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start pr-8">
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {mod.title}
                      </h3>
                    </div>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                      {mod.description}
                    </p>
                    
                    <div className="mt-5 flex gap-3">
                      {/* Tombol Preview (Direct Link) */}
                      <a 
                        href={mod.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-700 transition flex items-center gap-2"
                      >
                        <PlayCircle size={16} /> Buka Materi
                      </a>
                      
                      {/* Tombol Alternatif (Sama, untuk UX) */}
                      <a 
                        href={mod.fileUrl}
                        target="_blank"
                        rel="noreferrer" 
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition flex items-center gap-2"
                      >
                        <FileText size={16} /> Download
                      </a>

                      {isInstructor && (
                        <button 
                          onClick={() => handleDeleteModule(mod.id!)}
                          className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition flex items-center gap-2 ml-auto"
                        >
                          <Trash2 size={16} /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Folder size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Belum ada modul materi yang diupload.</p>
                {isInstructor && <p className="text-xs text-blue-500 mt-1 cursor-pointer hover:underline" onClick={() => setIsUploadModalOpen(true)}>Upload sekarang</p>}
              </div>
            )}
          </div>
        );

      case 'QUIZZES':
        return (
          <div className="animate-fade-in-up max-w-xl mx-auto py-12">
            <div className="relative bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 text-center shadow-2xl shadow-slate-200 border border-white overflow-hidden group">
               
               {/* Animated Background Blob */}
               <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-[80px] group-hover:bg-blue-400/30 transition-colors duration-1000"></div>
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-400/20 rounded-full blur-[80px] group-hover:bg-orange-400/30 transition-colors duration-1000"></div>

               <div className="relative z-10 flex flex-col items-center">
                 <div className="w-24 h-24 bg-gradient-to-tr from-slate-100 to-white rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-slate-200 border border-white transform rotate-6 hover:rotate-12 transition-transform duration-500">
                    <Settings size={48} className="text-slate-400 animate-spin-slow" />
                    <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-2 rounded-xl shadow-md border-2 border-white">
                      <Lock size={16} />
                    </div>
                 </div>
                 
                 <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Fitur Dalam Perawatan</h3>
                 <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto mb-8 font-medium">
                   Ups! Tim teknis kami sedang meningkatkan performa fitur ini agar pengalaman belajar Anda makin seru. Kembali lagi nanti ya! 🚀
                 </p>
                 
                 <div className="flex flex-col gap-2 w-full max-w-xs">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 w-3/4 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>Progress Update</span>
                       <span>75%</span>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        );

      case 'FINAL':
        return (
          <div className="animate-fade-in-up">
            <div className="glass-panel p-10 text-center border-2 border-yellow-400/30 bg-gradient-to-b from-yellow-50/40 to-white/60 relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/10 rounded-full blur-[100px] pointer-events-none"></div>

               <div className="relative z-10">
                 <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-orange-200 mb-8 animate-pulse rotate-3">
                    <Award size={48} />
                 </div>
                 <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Ujian Akhir Kursus</h2>
                 <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed mb-10 font-medium">
                   Ujian kompetensi menyeluruh sebagai syarat kelulusan dan pengambilan sertifikat. Pastikan Anda telah menyelesaikan seluruh modul prasyarat.
                 </p>
                 
                 {/* COUNTDOWN TIMER SECTION */}
                 {!isExamOpen && !isInstructor && (
                   <div className="mb-10 bg-slate-900 text-white p-6 rounded-2xl shadow-2xl max-w-lg mx-auto border-2 border-slate-700 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950"></div>
                     <div className="relative z-10">
                        <div className="flex items-center justify-center gap-2 text-yellow-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">
                           <Timer size={14} className="animate-pulse" /> Menuju Pembukaan Soal
                        </div>
                        <div className="text-2xl md:text-3xl font-black font-mono tracking-widest text-white tabular-nums drop-shadow-lg">
                           {examCountdown}
                        </div>
                        <p className="mt-4 text-xs text-slate-400 font-medium border-t border-slate-700 pt-4">
                           Akses akan terbuka otomatis pada <span className="text-yellow-400">Selasa, 20 Jan 2026 - 08:00 WIB</span>
                        </p>
                     </div>
                   </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10">
                    <div className="p-5 bg-white/80 rounded-2xl border border-yellow-100 shadow-sm backdrop-blur-sm">
                       <div className="text-3xl font-black text-slate-800">180</div>
                       <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Menit Durasi</div>
                    </div>
                    <div className="p-5 bg-white/80 rounded-2xl border border-yellow-100 shadow-sm backdrop-blur-sm">
                       <div className="text-3xl font-black text-slate-800">50</div>
                       <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Soal Kompetensi</div>
                    </div>
                    <div className="p-5 bg-white/80 rounded-2xl border border-yellow-100 shadow-sm backdrop-blur-sm">
                       <div className="text-3xl font-black text-slate-800">75</div>
                       <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Passing Grade</div>
                    </div>
                 </div>

                 {isInstructor ? (
                   <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => alert("Fitur Editor Soal akan segera hadir. Gunakan menu 'Generate Dummy' di Settings untuk saat ini.")}
                        className="btn-primary px-8 py-4 text-sm shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-red-500 border-none"
                      >
                        Konfigurasi Soal Final
                      </button>
                      <button 
                        onClick={() => setShowExamResults(true)}
                        className="px-8 py-4 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50"
                      >
                        Lihat Rekap Nilai
                      </button>
                   </div>
                 ) : (
                   <div className="text-center">
                     {isExamOpen ? (
                        <a 
                          href="#/exam" 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-3 px-12 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold shadow-xl shadow-orange-500/30 hover:scale-105 transition-transform animate-pulse"
                        >
                           <PlayCircle size={24} />
                           MULAI UJIAN SEKARANG
                        </a>
                     ) : (
                        <button disabled className="inline-flex items-center justify-center gap-3 px-12 py-4 bg-slate-200 text-slate-400 rounded-2xl font-bold cursor-not-allowed">
                           <Lock size={20} />
                           AKSES BELUM DIBUKA
                        </button>
                     )}
                     
                     <p className="mt-4 text-xs text-slate-500 font-medium">
                       ⚠️ <b>Peringatan:</b> Waktu 180 menit berjalan mundur tanpa henti.<br/>Pastikan koneksi stabil sebelum memulai.
                     </p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* HEADER & NAVIGASI KELAS (Jika Kelas Dipilih) */}
      {selectedClassId ? (
        <>
          {/* HEADER CARD */}
          <div className="glass-panel p-8 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div className="flex items-center gap-5">
                {!isStudent && (
                  <button 
                    onClick={() => {
                      setSelectedClassId(null);
                      setActiveTab('STUDENTS'); // Reset tab saat back
                    }}
                    className="p-3 bg-white hover:bg-slate-50 rounded-xl transition-all text-slate-500 hover:text-blue-600 shadow-sm border border-slate-100 group"
                  >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                  </button>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <Folder size={12} /> Ruang Kelas
                    </span>
                    {isStudent && selectedClassId === 'UNASSIGNED' && (
                      <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Lock size={12} /> Restricted Access
                      </span>
                    )}
                    {isStudent && selectedClassId !== 'UNASSIGNED' && (
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 size={12} /> Verified Student
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-black text-slate-800 leading-tight">
                    {selectedClassId === 'UNASSIGNED' ? "Belum Masuk Kelas" : selectedClass?.name}
                  </h1>
                  <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    {selectedClass?.programId || 'Program N/A'} 
                    <span className="text-slate-300">|</span> 
                    Instruktur: {selectedClass?.instructorId || 'N/A'}
                  </p>
                </div>
              </div>

              {/* TABS NAVIGATION (Floating Glass) */}
              <div className="flex bg-white/40 p-1.5 rounded-2xl backdrop-blur-md border border-white/60 shadow-sm">
                {(['STUDENTS', 'MODULES', 'QUIZZES', 'FINAL'] as ClassTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                      activeTab === tab 
                        ? 'bg-slate-800 text-white shadow-lg scale-105' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                    }`}
                  >
                    {tab === 'STUDENTS' && <Users size={16} />}
                    {tab === 'MODULES' && <BookOpen size={16} />}
                    {tab === 'QUIZZES' && <FileText size={16} />}
                    {tab === 'FINAL' && <Award size={16} />}
                    <span className="hidden md:inline">
                      {tab === 'STUDENTS' ? 'Peserta' : 
                       tab === 'MODULES' ? 'Modul' : 
                       tab === 'QUIZZES' ? 'Ujian' : 'Ujikom'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DYNAMIC CONTENT AREA */}
          {renderContent()}
        </>
      ) : (
        // --- VIEW 1: FOLDER LIST (Hanya Instruktur / Belum Pilih) ---
        <div className="space-y-8">
          <div className="flex items-center gap-4 px-4">
             <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Folder size={28} />
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-800">Direktori Kelas</h1>
                <p className="text-slate-500 font-medium">Pilih kelas untuk mengelola materi, ujian, dan memantau siswa.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {classes.map((cls) => {
              const count = students.filter(s => s.classId === cls.id).length;
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className="glass-panel glass-panel-hover group relative p-8 text-left overflow-hidden h-[280px] flex flex-col justify-between border-t-4 border-t-blue-500"
                >
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-14 h-14 bg-white border border-slate-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                          <Users size={28} />
                       </div>
                       <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                          Lvl {cls.level}
                       </span>
                    </div>
                    
                    <h2 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors leading-tight">
                      {cls.name}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                      <Clock size={14} /> {cls.schedule}
                    </p>
                  </div>

                  <div className="relative z-10 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Users size={14} /> {count} Peserta
                    </span>
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                       <ChevronRight size={18} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODULE UPLOAD MODAL */}
      <ModuleUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={() => loadModules(selectedClass?.programId || '')}
        programId={selectedClass?.programId || ''}
        uploaderId={user?.uid || 'SYSTEM'}
      />

      {/* EXAM RESULTS MODAL */}
      <ExamResultsModal 
        isOpen={showExamResults} 
        onClose={() => setShowExamResults(false)}
        examId={activeExamId}
        classId={selectedClassId || ''}
      />
    </div>
  );
};

export default Classmates;