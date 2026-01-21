import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, ChevronLeft, ChevronRight, List, FileSpreadsheet, FileText, Presentation, FolderOpen, Layers, Award, ArrowRightCircle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { examService } from '../services/examService';
import type { ExamConfig, StudentExamSession } from '../types/exam';
import toast from 'react-hot-toast';

const ExamRoom: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [exam, setExam] = useState<ExamConfig | null>(null);
  const [session, setSession] = useState<StudentExamSession | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(180 * 60); 
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);

  // --- URUTAN LEVEL ESTAFET ---
  const LEVEL_ORDER = ['EXCEL', 'WORD', 'PPT', 'ARSIP', 'PRAKTIKUM'];

  // --- 1. INITIALIZE & REAL-TIME SYNC (AUTO RESET) ---
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      toast.error("Anda tidak bisa keluar selama ujian berlangsung!", { icon: '🔒' });
    };
    window.addEventListener('popstate', handlePopState);

    if (!user) return;

    let unsubscribe = () => {};

    const initSession = async () => {
      const EXAM_ID = 'GLOBAL_UJIKOM';
      const DOC_ID = `${EXAM_ID}_${user.uid}`;
      const STORAGE_KEY = `ujikom_end_time_${user.uid}`;
      const COMPLETED_KEY = `ujikom_completed_${user.uid}`;

      // 1. LISTEN KE FIRESTORE (REAL-TIME)
      unsubscribe = onSnapshot(doc(db, "exam_sessions", DOC_ID), (docSnap) => {
         
         // SKENARIO A: ADMIN MERESET DATA (Dokumen hilang di server)
         if (!docSnap.exists()) {
            console.log("⚠️ RESET DETECTED! Clearing ALL local data...");
            
            // 1. WILD REMOVE: Hapus semua key yang berbau ujikom
            Object.keys(localStorage).forEach(key => {
               if (key.startsWith('ujikom_') || key.includes('exam_sessions')) {
                  localStorage.removeItem(key);
               }
            });
            
            // 2. Clear State
            setCompletedTopics([]); 
            setAnswers({});
            setSession(null);
            
            toast.error("UJIAN DI-RESET ADMIN. Halaman akan dimuat ulang...", { duration: 2000 });
               
            // 3. HARD RELOAD (Nuklir Option: Agar RAM bersih)
            setTimeout(() => {
               window.location.reload();
            }, 1000);
         }  
         // SKENARIO B: DATA ADA DI SERVER (Resume / Sync)
         else {
            const cloudData = docSnap.data() as StudentExamSession;
            console.log("Syncing from Cloud...");
            
            // Sync status
            if (cloudData.status === 'SUBMITTED') {
               // BYPASS MODE AKTIF: Komen baris redirect di bawah ini agar bisa tes berulang
               // navigate('/reports'); 
               toast("Mode Pengembang: Ujian sudah submit, tapi akses dibuka.", { icon: '🛠️' });
            }

            setSession(cloudData);
            if (cloudData.answers) setAnswers(cloudData.answers);
            
            // Sync Completed Topics (Opsional, jika disimpan di cloud)
            const savedCompleted = localStorage.getItem(COMPLETED_KEY);
            if (savedCompleted) setCompletedTopics(JSON.parse(savedCompleted));
         }
      });
      
      // Timer Setup (Local)
      let endTime = Number(localStorage.getItem(STORAGE_KEY));
      if (!endTime || endTime < Date.now()) {
        endTime = Date.now() + (180 * 60 * 1000);
        localStorage.setItem(STORAGE_KEY, endTime.toString());
      }
    };

    initSession();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      unsubscribe();
    };
  }, [user]);

  // --- 2. TIMER ENGINE ---
  useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((session.endTime - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        toast.error("WAKTU HABIS! Jawaban dikunci.", { duration: 5000, icon: '🛑' });
        setTimeout(() => {
           forceFinalSubmit(); 
        }, 1000);
      }
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // --- HELPER: DETEKSI KATEGORI ---
  const getCategoryInfo = (questionId: string) => {
    if (questionId.startsWith('EXCEL')) return { label: 'MICROSOFT EXCEL', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: FileSpreadsheet };
    if (questionId.startsWith('WORD')) return { label: 'MICROSOFT WORD', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: FileText };
    if (questionId.startsWith('PPT')) return { label: 'POWERPOINT', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: Presentation };
    if (questionId.startsWith('ARSIP')) return { label: 'KEARSIPAN', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: FolderOpen };
    if (questionId.startsWith('ESSAY')) return { label: 'UJIAN PRAKTIKUM', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: Award };
    return { label: 'UMUM', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: Layers };
  };

  const handleStartExam = async (topic: string) => {
    setLoading(true);
    setSelectedTopic(topic);
    setCurrentQIndex(0); 

    try {
      const userProgram = (user as any)?.program || "Administrasi Perkantoran"; 
      const examData = await examService.getExamByProgram(userProgram, topic);

      if (!examData || examData.questions.length === 0) {
        alert(`Soal untuk ${topic} belum tersedia.`);
        setLoading(false);
        return;
      }

      setExam(examData);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const markTopicAsCompleted = (topic: string) => {
    setCompletedTopics(prev => {
      const updated = prev.includes(topic) ? prev : [...prev, topic];
      if (user) {
        localStorage.setItem(`ujikom_completed_${user.uid}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleNextLevel = async () => {
    if (!selectedTopic) return;
    
    markTopicAsCompleted(selectedTopic);

    const currentIndex = LEVEL_ORDER.indexOf(selectedTopic);
    if (currentIndex >= 0 && currentIndex < LEVEL_ORDER.length - 1) {
      const nextTopic = LEVEL_ORDER[currentIndex + 1];
      
      toast.success(`Modul ${selectedTopic} Selesai! Melanjutkan ke ${nextTopic}...`, {
        icon: '🚀',
        style: { background: '#10B981', color: '#fff' }
      });

      await handleStartExam(nextTopic); 
    } else {
      handleSubmit();
    }
  };

  const handleAnswer = async (questionId: string, value: any) => {
    if (!session) return;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    // Simpan ke Service (bisa number atau string)
    await examService.saveAnswer(session.id, questionId, value);
  };

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && !confirm("Simpan jawaban modul ini dan kembali ke Menu Ujian?")) return;
    if (!session) return;

    setLoading(true);
    if (exam) {
       await examService.submitExam({ ...session, answers }, exam.questions);
    }
    
    if (selectedTopic) {
       markTopicAsCompleted(selectedTopic);
    }

    toast.success("Jawaban Tersimpan! Silakan lanjutkan modul lain atau cek progres Anda.", { duration: 4000 });
    
    setExam(null);
    setSelectedTopic(null);
    setLoading(false);
  };

  const forceFinalSubmit = async () => {
    if (!session) return;
    setLoading(true);
    const toastId = toast.loading("Menyerahkan seluruh jawaban...");

    try {
      // 1. Ambil Data Soal Lengkap (OMNIBUS) untuk Kalkulasi Skor Akhir
      const omnibusExam = await examService.getExamByProgram((user as any)?.program || 'Administrasi Perkantoran', 'OMNIBUS');
      
      // 2. Update Session dengan Jawaban Terakhir
      const finalSession = { ...session, answers };
      
      // 3. Submit ke Service (Local + Firebase Sync)
      if (omnibusExam && omnibusExam.questions) {
        await examService.submitExam(finalSession, omnibusExam.questions);
      } else {
        // Fallback jika gagal load soal (tetap submit status)
        await examService.submitExam(finalSession, []); 
      }

      toast.success("Ujian Selesai! Terima kasih.", { id: toastId });
      
      // 4. Redirect
      navigate('/reports');
    } catch (error) {
      console.error("Final Submit Error:", error);
      toast.error("Gagal menyerahkan ujian. Coba lagi.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const handleSmartNext = () => {
    if (!exam) return;
    const currentQ = exam.questions[currentQIndex];
    const nextQ = exam.questions[currentQIndex + 1];

    if (nextQ) {
       const currentCat = getCategoryInfo(currentQ.id).label;
       const nextCat = getCategoryInfo(nextQ.id).label;
       if (currentCat !== nextCat) {
          toast(`Sesi ${currentCat} Selesai! Masuk ke ${nextCat}.`, { icon: '🚀' });
       }
    }
    setCurrentQIndex(i => i + 1);
  };

  // Prevent Tab Close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (session) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session]);

  // --- RENDERS ---

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-sans">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mb-6"></div>
        <h2 className="text-xl font-bold tracking-widest animate-pulse uppercase">Memproses...</h2>
      </div>
    );
  }

  if (!exam || !session) {
    const userProgram = (user as any)?.program || "Administrasi Perkantoran";

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
               <Award className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                Ujian Kompetensi (Ujikom)
              </h1>
              <p className="text-slate-500 text-[10px] font-bold mt-1.5 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">{userProgram}</span>
                <span className="text-slate-300">|</span>
                <span>LP3I College Indramayu</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* TOMBOL KIRIM FINAL DI HEADER (CEPAT) */}
            {completedTopics.length > 0 && (
              <button 
                onClick={() => {
                  const isAllDone = LEVEL_ORDER.every(topic => completedTopics.includes(topic));
                  if(confirm(isAllDone ? "Yakin ingin menyerahkan seluruh hasil ujian?" : "Anda belum menyelesaikan semua modul. Yakin ingin mengirim hasil yang ada saja?")) {
                    forceFinalSubmit();
                  }
                }}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-xl hover:bg-emerald-700 hover:scale-105 transition-all flex items-center gap-2 animate-bounce-slow"
              >
                <ArrowRightCircle size={20} /> KIRIM HASIL AKHIR
              </button>
            )}

            <div className="flex flex-col items-end">
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sisa Waktu Global</span>
               <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono text-xl font-black border-2 ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                 <Clock size={18} /> {formatTime(timeLeft)}
               </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-red-500 font-bold text-[10px] bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              <div className="animate-pulse"><div className="w-2 h-2 bg-red-500 rounded-full"></div></div>
              TERKUNCI
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto w-full p-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold mb-2">Pilih Kategori Ujian</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Waktu berjalan secara realtime. Silakan pilih modul yang ingin dikerjakan terlebih dahulu.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { id: 'EXCEL', label: 'Excel', desc: 'Level 1 - Formula', icon: FileSpreadsheet, color: 'emerald' },
              { id: 'WORD', label: 'Word', desc: 'Level 2 - Documents', icon: FileText, color: 'blue' },
              { id: 'PPT', label: 'PowerPoint', desc: 'Level 3 - Visual', icon: Presentation, color: 'orange' },
              { id: 'ARSIP', label: 'Kearsipan', desc: 'Level 4 - Filing', icon: FolderOpen, color: 'purple' },
              { id: 'PRAKTIKUM', label: 'Praktikum', desc: 'Level 5 - Upload', icon: Award, color: 'indigo' }
            ].map((cat) => {
              const isDone = completedTopics.includes(cat.id);
              const Icon = cat.icon;
              return (
                <button 
                  key={cat.id}
                  disabled={isDone}
                  onClick={() => handleStartExam(cat.id)}
                  className={`group p-8 rounded-[2rem] border transition-all flex flex-col items-center text-center relative overflow-hidden ${
                    isDone ? 'bg-emerald-50 border-emerald-200 cursor-not-allowed opacity-80' : 'bg-white border-slate-200 hover:shadow-2xl hover:-translate-y-2'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-full h-2 bg-${isDone ? 'emerald' : cat.color}-500`}></div>
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${isDone ? 'bg-emerald-100 text-emerald-600' : `bg-${cat.color}-50 text-${cat.color}-600`} group-hover:scale-110 transition-transform`}>
                    {isDone ? <CheckCircle size={40} /> : <Icon size={40} />}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-1">{cat.label}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-6">{isDone ? 'Terekam di Sistem' : cat.desc}</p>
                  <span className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] ${isDone ? 'bg-emerald-200 text-emerald-800' : `bg-${cat.color}-50 text-${cat.color}-600`}`}>
                    {isDone ? 'SELESAI' : 'Mulai'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col items-center gap-6">
             {/* TOMBOL FINAL SUBMIT (JIKA MINIMAL 1 SELESAI) */}
             {completedTopics.length > 0 && (
               <div className="w-full max-w-2xl bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-8 text-center animate-fade-in-up">
                 <h3 className="text-2xl font-black text-emerald-700 mb-2 flex items-center justify-center gap-2">
                   <CheckCircle size={32} /> KONFIRMASI SELESAI
                 </h3>
                 <p className="text-emerald-600 mb-6 font-medium">
                   {LEVEL_ORDER.every(topic => completedTopics.includes(topic)) 
                     ? "Anda telah menyelesaikan semua tahapan ujian." 
                     : "Anda baru menyelesaikan sebagian modul. Yakin ingin menyerahkan sekarang?"}
                 </p>
                 <button 
                   onClick={() => {
                     const isPartial = !LEVEL_ORDER.every(topic => completedTopics.includes(topic));
                     const msg = isPartial 
                       ? "PERHATIAN: Anda belum menyelesaikan semua modul. Yakin ingin menyerahkan hasil seadanya?" 
                       : "Yakin ingin menyerahkan seluruh hasil ujian?";
                     
                     if(confirm(msg)) forceFinalSubmit();
                   }}
                   className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-bold shadow-xl hover:bg-emerald-700 hover:scale-105 transition-all flex items-center gap-3 mx-auto text-lg animate-pulse"
                 >
                   SERAHKAN JAWABAN & KELUAR <ArrowRightCircle size={24} />
                 </button>
               </div>
             )}

             <button onClick={() => handleStartExam('OMNIBUS')} className="bg-slate-900 text-white px-12 py-6 rounded-3xl flex items-center gap-5 hover:bg-slate-800 shadow-2xl transition-all hover:scale-105 group opacity-80 hover:opacity-100">
              <Layers size={32} className="text-yellow-400 group-hover:rotate-12 transition-transform" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opsi Tambahan</div>
                <div className="text-xl font-black tracking-tight">OMNIBUS (Mode Campuran)</div>
              </div>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- RENDER 3: EXAM INTERFACE ---
  if (!exam || !exam.questions || exam.questions.length === 0) return null;
  const currentQ = exam.questions[currentQIndex];
  if (!currentQ) return null;

  const nextQ = exam.questions[currentQIndex + 1];
  const currentCat = getCategoryInfo(currentQ.id || 'UMUM');
  const nextCat = nextQ ? getCategoryInfo(nextQ.id || 'UMUM') : null;
  const isSectionChange = nextCat && nextCat.label !== currentCat.label;
  const CurrentIcon = currentCat.icon;
  const todayDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      <div className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-2 rounded-lg"><Award size={24} className="text-yellow-400" /></div>
          <div>
            <h1 className="font-black text-lg tracking-wide">Ujikom {new Date().getFullYear()}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LP3I INDRAMAYU • {todayDate}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Sisa Waktu Global</span>
           <div className={`flex items-center gap-3 px-5 py-2 rounded-xl font-mono text-2xl font-black shadow-inner border-2 ${timeLeft < 300 ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-slate-800 border-slate-700'}`}>
             <Clock size={20} /> {formatTime(timeLeft)}
           </div>
        </div>

        <button onClick={() => handleSubmit(false)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
          <CheckCircle size={18} /> SELESAI UJIAN
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10 min-h-[500px] flex flex-col relative">
            <div className={`mb-6 flex items-center gap-2 px-4 py-2 rounded-xl w-fit ${currentCat.bg} ${currentCat.color} border ${currentCat.border}`}>
               <CurrentIcon size={16} />
               <span className="text-xs font-black tracking-widest uppercase">{currentCat.label}</span>
            </div>

            <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Soal {currentQIndex + 1} / {exam.questions.length}</span>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">{currentQ.points} Poin</span>
            </div>

            {currentQ.spreadsheetData && (
              <div className="mb-8 overflow-x-auto border border-slate-300 rounded-xl shadow-sm">
                <table className="w-full text-sm text-left border-collapse bg-white font-mono">
                  <tbody>
                    {currentQ.spreadsheetData.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className={`border border-slate-300 px-4 py-2 ${rIdx === 0 || cIdx === 0 ? 'bg-slate-100 font-bold text-slate-600' : 'text-slate-800'}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed mb-10">{currentQ.text}</h2>

            {currentQ.type === 'ESSAY' ? (
              <div className="bg-blue-50 p-8 rounded-3xl border-2 border-dashed border-blue-200 text-center hover:bg-blue-100/50 transition-colors relative">
                
                {answers[currentQ.id] ? (
                  <div className="flex flex-col items-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">File Berhasil Diupload!</h3>
                    <a href={answers[currentQ.id]} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium mb-6 break-all max-w-md truncate">
                      Lihat File Jawaban
                    </a>
                    <button 
                      onClick={() => handleAnswer(currentQ.id, null)} // Reset answer
                      className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition"
                    >
                      Ganti File
                    </button>
                  </div>
                ) : (
                  <>
                    <input 
                      type="file" 
                      id={`file-${currentQ.id}`}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // VALIDASI 7MB
                        if (file.size > 7 * 1024 * 1024) {
                          toast.error("File terlalu besar! Maksimal 7MB.");
                          return;
                        }

                        setLoading(true);
                        const toastId = toast.loading("Mengupload jawaban...");
                        
                        try {
                          const url = await examService.uploadExamFile(file, user?.uid || 'guest', session?.examId || 'exam', currentQ.id);
                          await handleAnswer(currentQ.id, url);
                          toast.success("Upload Berhasil!", { id: toastId });
                        } catch (err) {
                          console.error(err);
                          toast.error("Gagal upload. Coba lagi.", { id: toastId });
                        } finally {
                          setLoading(false);
                        }
                      }}
                    />
                    <label htmlFor={`file-${currentQ.id}`} className="cursor-pointer flex flex-col items-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                         {loading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div> : <FolderOpen size={32} className="text-blue-500" />}
                      </div>
                      <h3 className="font-bold text-slate-700 text-lg mb-1">Upload Hasil Praktikum</h3>
                      <p className="text-slate-400 text-sm mb-4">Format: PDF, Office, ZIP (Max 7MB)</p>
                      <span className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
                        Pilih File Komputer
                      </span>
                    </label>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === idx;
                  return (
                    <button key={idx} onClick={() => handleAnswer(currentQ.id, idx)} className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-5 group ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-600'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base border-2 flex-shrink-0 ${isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-slate-300 text-slate-400 group-hover:border-blue-300'}`}>{String.fromCharCode(65 + idx)}</div>
                      <span className="font-bold text-lg">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-auto pt-10 flex justify-between items-center border-t border-slate-100">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(i => i - 1)} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={20} /> Sebelumnya
              </button>
              
              {(() => {
                const isLastQuestion = currentQIndex === exam.questions.length - 1;
                const isOmnibus = selectedTopic === 'OMNIBUS';
                // Cek apakah topik saat ini adalah yang terakhir di LEVEL_ORDER (PRAKTIKUM)
                const isFinalLevel = selectedTopic === LEVEL_ORDER[LEVEL_ORDER.length - 1]; 
                
                // Cari topik selanjutnya untuk label tombol
                const currentLevelIdx = LEVEL_ORDER.indexOf(selectedTopic || '');
                const nextTopicLabel = (currentLevelIdx >= 0 && currentLevelIdx < LEVEL_ORDER.length - 1) 
                  ? LEVEL_ORDER[currentLevelIdx + 1] 
                  : 'BERIKUTNYA';

                if (isLastQuestion) {
                  if (isOmnibus || isFinalLevel) {
                    return (
                      <div className="flex gap-2">
                         <button onClick={() => handleSubmit(false)} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 animate-pulse">
                           <CheckCircle size={20} /> KUMPULKAN SEMUA
                         </button>
                      </div>
                    );
                  } else {
                    return (
                      <button onClick={handleNextLevel} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
                        SELESAI {selectedTopic} <ArrowRightCircle size={20} /> LANJUT {nextTopicLabel}
                      </button>
                    );
                  }
                } else {
                  return (
                    <button onClick={handleSmartNext} className={`px-8 py-4 rounded-2xl font-bold shadow-lg flex items-center gap-2 transition-all ${isSectionChange ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                      {isSectionChange ? <>LANJUT: {nextCat?.label} <ArrowRightCircle size={20} /></> : <>Selanjutnya <ChevronRight size={20} /></>}
                    </button>
                  );
                }
              })()}
            </div>
            
            {/* EMERGENCY EXIT */}
            <div className="mt-4 text-center">
               <button onClick={() => handleSubmit(true)} className="text-[10px] text-slate-300 hover:text-red-400 font-bold underline decoration-dotted cursor-pointer" title="Gunakan tombol ini jika tombol utama bermasalah">
                 Simpan & Keluar Paksa (Darurat)
               </button>
            </div>
          </div>
        </div>

        <div className="w-96 bg-white border-l border-slate-200 p-8 overflow-y-auto hidden lg:block">
          <h3 className="font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-widest text-sm"><List size={20} /> Navigasi Soal</h3>
          <div className="grid grid-cols-5 gap-3">
            {exam.questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = currentQIndex === idx;
              const qCat = getCategoryInfo(q.id);
              return (
                <button key={idx} onClick={() => setCurrentQIndex(idx)} className={`aspect-square rounded-2xl font-bold text-xs transition-all flex items-center justify-center border-2 ${isCurrent ? 'bg-blue-600 text-white border-blue-600 shadow-xl scale-110 ring-4 ring-blue-100 z-10' : isAnswered ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : `${qCat.bg} ${qCat.color} border-slate-100 hover:border-blue-400`}`}>{idx + 1}</button>
              );
            })}
          </div>
          <div className="mt-12 p-6 bg-blue-50 rounded-[2rem] border border-blue-100 shadow-inner">
            <h4 className="font-black text-blue-800 text-[10px] uppercase mb-3 tracking-[0.2em]">Progress Capaian</h4>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-3 overflow-hidden">
              <div className="bg-blue-600 h-full transition-all duration-1000 ease-out" style={{ width: `${(Object.keys(answers).length / exam.questions.length) * 100}%` }}></div>
            </div>
            <p className="text-xs text-blue-600 font-black">{Object.keys(answers).length} / {exam.questions.length} SOAL TERJAWAB</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamRoom;
