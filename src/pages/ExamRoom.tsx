import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, ChevronLeft, ChevronRight, 
  FileSpreadsheet, FileText, Presentation, FolderOpen, 
  Layers, Award, Lock, ArrowRightCircle
} from 'lucide-react';import { useAuth } from '../context/AuthContext';
import { examService } from '../services/examService';
import { db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import type { ExamConfig, StudentExamSession } from '../types/exam';
import toast from 'react-hot-toast';

// --- KONSTANTA ---
const EXAM_ID = 'GLOBAL_UJIKOM';
const LEVEL_ORDER = ['EXCEL', 'WORD', 'PPT', 'ARSIP', 'PRAKTIKUM'];

const ExamRoom: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- STATE SEDERHANA (HANYA UI) ---
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<StudentExamSession | null>(null);
  const [exam, setExam] = useState<ExamConfig | null>(null);
  
  // State UI Lokal
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(180 * 60);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Modal Selamat

  // State Input Nama (Gatekeeper)
  const [needsName, setNeedsName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showTips, setShowTips] = useState(false); // Modal Tips & Trik

  // --- STATE ---
  const [isExpired, setIsExpired] = useState(false);

  // --- 1. CORE ENGINE: SINGLE SOURCE OF TRUTH (FIRESTORE) ---
  useEffect(() => {
    if (!user) return;
    const DOC_ID = `${EXAM_ID}_${user.uid}`;

    // ATURAN 1: DEADLINE HARIAN (23:59:59 HARI INI)
    // Dalam produksi, tanggal ini bisa diambil dari ExamConfig
    const deadline = new Date();
    deadline.setHours(23, 59, 59, 999);
    
    if (Date.now() > deadline.getTime()) {
       setIsExpired(true);
       return;
    }

    setLoading(true);

    // Listener Real-time
    const unsubscribe = onSnapshot(doc(db, "exam_sessions", DOC_ID), async (docSnap) => {
       if (!docSnap.exists()) {
          // KASUS 1: DATA TIDAK ADA (BELUM MULAI / DI-RESET ADMIN)
          console.log("Status: No Session (Reset/New)");
          setSession(null);
          setExam(null);
          setNeedsName(true); 
          setLoading(false);
       } else {
          // KASUS 2: DATA ADA (SYNC)
          const data = docSnap.data() as StudentExamSession;
          
          // ATURAN 2: STRICT ONE-TIME SUBMISSION
          // Jika status SUBMITTED, kita cek apakah ini 'Fresh Load' (baru masuk) atau 'Live Update' (baru selesai)
          if (data.status === 'SUBMITTED') {
             // LOGIKA BARU: Cek flag di sessionStorage untuk membedakan 'Baru Selesai' vs 'Login Ulang'
             const justFinished = sessionStorage.getItem('JUST_FINISHED_EXAM');
             
             if (!justFinished) {
                // Jika bukan baru selesai (berarti login ulang), tendang ke laporan
                toast("Anda sudah menyelesaikan ujian ini.", { icon: '🔒' });
                navigate('/reports'); 
                return;
             }
             // Jika justFinished ada, berarti dia baru saja submit. Biarkan Modal Selamat muncul.
          }
          
          // Cek Nama (Double Protection)
          if (!data.studentName || data.studentName === 'Peserta') {
             setNeedsName(true);
          } else {
             setNeedsName(false);
          }

          setSession(data);

          // Hitung Mundur Server-Side
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((data.endTime - now) / 1000));
          setTimeLeft(remaining);
          
          setLoading(false);
       }
    }, (error) => {
       console.error("Connection Error:", error);
       toast.error("Koneksi terputus. Mencoba menghubungkan...");
    });

    // Timer Interval (Hanya untuk update UI per detik)
    const timerInterval = setInterval(() => {
       setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
       unsubscribe();
       clearInterval(timerInterval);
    };
  }, [user]);

  // --- 2. ACTIONS: CREATE SESSION (SETELAH INPUT NAMA) ---
  const handleCreateSession = async () => {
     if (!user || !tempName.trim()) {
        toast.error("Nama wajib diisi!");
        return;
     }

     setLoading(true);
     try {
        const dummyExamData: any = { id: EXAM_ID, durationMinutes: 180 };
        await examService.startExam(user.uid, dummyExamData, {
           name: tempName,
           nis: user.email || user.uid
        });
        setLoading(false);
        setShowTips(true); // TAMPILKAN TIPS DULU SEBELUM LOBBY
     } catch (e) {
        toast.error("Gagal memulai ujian. Cek koneksi.");
        setLoading(false);
     }
  };

  // --- 3. ACTIONS: LOAD SOAL ---
  const handleStartTopic = async (topic: string) => {
    setLoading(true);
    try {
      const userProgram = (user as any)?.program || "Administrasi Perkantoran"; 
      const examData = await examService.getExamByProgram(userProgram, topic);
      setExam(examData);
      setSelectedTopic(topic);
      setCurrentQIndex(0);
    } catch (e) {
      toast.error("Gagal memuat soal.");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. ACTIONS: JAWAB & KIRIM LANGSUNG (DIRECT STREAM) ---
  const handleAnswer = async (qId: string, val: any) => {
     if (!session || !user) return; 
     
     // Optimistic UI Update (Agar terasa cepat)
     const newAnswers = { ...session.answers, [qId]: val };
     setSession({ ...session, answers: newAnswers });

     // KIRIM KE SERVER DETIK ITU JUGA (Background)
     try {
        const docRef = doc(db, "exam_sessions", `${EXAM_ID}_${user.uid}`);
        await updateDoc(docRef, {
           [`answers.${qId}`]: val
        });
     } catch (e) {
        console.error("Gagal simpan jawaban:", e);
        toast.error("Gagal menyimpan jawaban! Cek koneksi internet.");
     }
  };

  // --- 5. ACTIONS: MARK COMPLETED & FINISH ---
  const handleCompleteTopic = async (topic: string) => {
     if (!session || !user) return;

     const currentCompleted = session.completedTopics || [];
     if (!currentCompleted.includes(topic)) {
        const updated = [...currentCompleted, topic];
        const docRef = doc(db, "exam_sessions", `${EXAM_ID}_${user.uid}`);
        await updateDoc(docRef, { completedTopics: updated });
        toast.success(`Modul ${topic} Selesai!`);
     }
     
     // Pindah ke next topic atau menu
     setSelectedTopic(null);
     setExam(null);
  };

  const handleFinalSubmit = async () => {
     if (!confirm("KIRIM SEMUA JAWABAN KE INSTRUKTUR?\n\nPastikan semua file sudah terupload. Aksi ini tidak bisa dibatalkan.")) return;
     if (!session || !user) return;

     setLoading(true);
     try {
        // AMBIL STATE TERBARU (Dari session.answers karena kita update session saat jawab)
        const currentAnswers = session.answers || {};
        
        console.log("FINAL SUBMIT PAYLOAD:", currentAnswers); // Debug di console siswa

        // 1. SYNC PAKSA KE FIRESTORE (DOUBLE TAP)
        // Gunakan setDoc merge untuk memastikan semua jawaban masuk
        const docRef = doc(db, "exam_sessions", `${EXAM_ID}_${user.uid}`);
        await setDoc(docRef, { 
           answers: currentAnswers,
           status: 'SUBMITTED', // Sekalian kunci
           submittedAt: new Date().toISOString()
        }, { merge: true });

        // 2. Set Flag agar tidak auto-redirect oleh onSnapshot (UI Handling)
        sessionStorage.setItem('JUST_FINISHED_EXAM', 'true');

        // 3. Service Call (Untuk scoring/rekap tambahan jika ada logic di sana)
        const omnibus = await examService.getExamByProgram('Administrasi Perkantoran', 'OMNIBUS');
        await examService.submitExam({ ...session, answers: currentAnswers }, omnibus?.questions || []);
        
        setLoading(false);
        setShowSuccessModal(true); 
     } catch (e) {
        console.error("Final Submit Error:", e);
        toast.error("Gagal mengirim. Periksa koneksi internet Anda!");
        setLoading(false);
     }
  };


  // --- HELPERS UI ---
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
  };

  const getCategoryInfo = (questionId: string) => {
    if (questionId.startsWith('EXCEL')) return { label: 'MICROSOFT EXCEL', icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (questionId.startsWith('WORD')) return { label: 'MICROSOFT WORD', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' };
    if (questionId.startsWith('PPT')) return { label: 'POWERPOINT', icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-50' };
    if (questionId.startsWith('ARSIP')) return { label: 'KEARSIPAN', icon: FolderOpen, color: 'text-purple-600', bg: 'bg-purple-50' };
    if (questionId.startsWith('ESSAY')) return { label: 'PRAKTIKUM', icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' };
    return { label: 'UMUM', icon: Layers, color: 'text-slate-600', bg: 'bg-slate-50' };
  };


  // --- RENDER 1: LOADING & NAME INPUT ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

  if (isExpired) {
     return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-center p-6 text-white font-sans">
           <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Lock size={48} className="text-red-500" />
           </div>
           <h1 className="text-3xl font-black mb-2 tracking-tight">AKSES DITUTUP</h1>
           <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
              Batas waktu akses ujian hari ini (23:59 WIB) telah berakhir. <br/>Silakan hubungi instruktur jika Anda mengalami kendala teknis.
           </p>
           <button onClick={() => navigate('/')} className="px-8 py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition">
              Kembali ke Dashboard
           </button>
        </div>
     )
  }

  if (needsName || !session) {
     return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in-up">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <UserIcon size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Identitas Peserta</h2>
              <p className="text-slate-500 mb-6 text-sm">Wajib mengisi nama lengkap sesuai KTP/Absen agar nilai tidak tertukar.</p>
              
              <input 
                type="text" 
                placeholder="Ketik Nama Lengkap Anda..."
                className="w-full text-center text-lg font-bold border-2 border-slate-200 rounded-xl p-4 mb-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                value={tempName}
                onChange={e => setTempName(e.target.value.toUpperCase())}
                autoFocus
              />
              
              <button 
                onClick={handleCreateSession}
                disabled={tempName.length < 3}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
              >
                 MULAI UJIAN SEKARANG
              </button>
           </div>
        </div>
     );
  }

  // --- RENDER 2: LOBBY UJIAN ---
  if (!exam) {
     const completed = session.completedTopics || [];
     return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
           {/* HEADER */}
           <header className="bg-white px-6 py-4 border-b border-slate-200 sticky top-0 z-40 flex justify-between items-center shadow-sm">
              <div>
                 <h1 className="font-black text-xl text-slate-800">Ujikom 2026</h1>
                 <p className="text-xs text-slate-500 font-bold">{session.studentName} | {session.studentNis}</p>
              </div>
              <div className="flex items-center gap-4">
                 {/* TOMBOL KIRIM HASIL (Muncul jika ada progress) */}
                 {completed.length > 0 && (
                    <button onClick={handleFinalSubmit} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold animate-pulse hover:bg-emerald-700 shadow-lg shadow-emerald-500/30">
                       KIRIM HASIL ({completed.length}/{LEVEL_ORDER.length})
                    </button>
                 )}
                 <div className="bg-slate-900 text-white px-4 py-2 rounded-lg font-mono font-bold text-lg">
                    {formatTime(timeLeft)}
                 </div>
              </div>
           </header>

           <main className="max-w-5xl mx-auto p-6">
              <div className="text-center mb-10 mt-4">
                 <h2 className="text-3xl font-black text-slate-800 mb-2">Pilih Modul Ujian</h2>
                 <p className="text-slate-500">Status tersimpan otomatis di server.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                 {LEVEL_ORDER.map(topic => {
                    const isDone = completed.includes(topic);
                    // Mapping Info
                    let label = topic;
                    let color = 'bg-white';
                    let text = 'text-slate-600';
                    let Icon = Layers;
                    
                    if (topic === 'EXCEL') { label = 'Excel'; color = 'bg-emerald-50'; text = 'text-emerald-600'; Icon = FileSpreadsheet; }
                    if (topic === 'WORD') { label = 'Word'; color = 'bg-blue-50'; text = 'text-blue-600'; Icon = FileText; }
                    if (topic === 'PPT') { label = 'PowerPoint'; color = 'bg-orange-50'; text = 'text-orange-600'; Icon = Presentation; }
                    if (topic === 'ARSIP') { label = 'Kearsipan'; color = 'bg-purple-50'; text = 'text-purple-600'; Icon = FolderOpen; }
                    if (topic === 'PRAKTIKUM') { label = 'Praktikum'; color = 'bg-indigo-50'; text = 'text-indigo-600'; Icon = Award; }

                    return (
                       <button 
                         key={topic}
                         onClick={() => !isDone && handleStartTopic(topic)}
                         disabled={isDone}
                         className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 relative overflow-hidden ${isDone ? 'border-emerald-200 bg-emerald-50 opacity-80' : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-xl hover:-translate-y-1'}`}
                       >
                          {isDone && <div className="absolute top-3 right-3 text-emerald-600"><CheckCircle size={24} /></div>}
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDone ? 'bg-emerald-200 text-emerald-700' : `${color} ${text}`}`}>
                             <Icon size={32} />
                          </div>
                          <div className="text-center">
                             <div className="font-black text-lg text-slate-700">{label}</div>
                             <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {isDone ? 'SELESAI' : 'KERJAKAN'}
                             </div>
                          </div>
                       </button>
                    )
                 })}
              </div>

              {/* TOMBOL OMNIBUS (OPSIONAL) */}
              <div className="mt-12 text-center">
                 <button onClick={() => handleStartTopic('OMNIBUS')} className="text-xs font-bold text-slate-400 hover:text-slate-600 underline">
                    Mode OMNIBUS (Campuran)
                 </button>
              </div>
           </main>
        </div>
     );
  }

  // --- RENDER 3: EXAM INTERFACE ---
  const q = exam.questions[currentQIndex];
  const cat = getCategoryInfo(q.id);
  const QIcon = cat.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       {/* EXAM HEADER */}
       <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
             <button onClick={() => setExam(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <ChevronLeft size={24} />
             </button>
             <div className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${cat.bg} ${cat.color}`}>
                <QIcon size={14} /> {cat.label}
             </div>
          </div>
          <div className="font-mono font-bold text-slate-800 text-lg">
             {formatTime(timeLeft)}
          </div>
       </div>

       {/* CONTENT */}
       <div className="flex-1 max-w-4xl mx-auto w-full p-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 min-h-[60vh] flex flex-col">
             
             {/* PROGRESS BAR */}
             <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
                <div className="bg-blue-600 h-full transition-all" style={{ width: `${((currentQIndex + 1) / exam.questions.length) * 100}%` }}></div>
             </div>

             {/* QUESTION */}
             <div className="mb-8">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Soal {currentQIndex + 1}</span>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-2 leading-relaxed">{q.text}</h2>
             </div>
             
             {/* DATA TABLE (IF ANY) */}
             {q.spreadsheetData && (
                <div className="mb-8 overflow-x-auto border border-slate-200 rounded-xl">
                   <table className="w-full text-sm text-left">
                      <tbody>
                         {q.spreadsheetData.map((row, i) => (
                            <tr key={i} className={i===0 ? 'bg-slate-50 font-bold' : ''}>
                               {row.map((cell, j) => (
                                  <td key={j} className="border px-4 py-2">{cell}</td>
                               ))}
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             )}

             {/* ANSWER AREA */}
             <div className="mt-4 flex-1">
                {q.type === 'ESSAY' ? (
                   <div className="space-y-6">
                      {/* DRIVE LINK */}
                      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                         <h4 className="font-bold text-orange-700 text-sm mb-2 flex items-center gap-2"><FolderOpen size={16}/> LANGKAH 1: UPLOAD KE DRIVE</h4>
                         <a href="https://drive.google.com/drive/folders/1EUD6nuCcUDlcINxLw__fjZOQ6Mx7BVGO?usp=drive_link" target="_blank" className="block w-full bg-orange-600 text-white text-center py-3 rounded-xl font-bold hover:bg-orange-700 transition text-sm">
                            BUKA FOLDER PENGUMPULAN
                         </a>
                      </div>
                      
                      {/* SYSTEM UPLOAD */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                         <h4 className="font-bold text-slate-700 text-sm mb-4">LANGKAH 2: KONFIRMASI DI SINI</h4>
                         {session.answers[q.id] ? (
                            <div className="text-emerald-600 font-bold flex flex-col items-center gap-2">
                               <CheckCircle size={32} />
                               <span>File Terupload!</span>
                               <button onClick={() => handleAnswer(q.id, null)} className="text-xs text-red-500 underline">Ganti File</button>
                            </div>
                         ) : (
                            <input type="file" onChange={async (e) => {
                               const f = e.target.files?.[0];
                               if(f) {
                                  const loadId = toast.loading("Uploading...");
                                  try {
                                     const url = await examService.uploadExamFile(f, user?.uid ?? '', session.examId, q.id);
                                     await handleAnswer(q.id, url);
                                     toast.success("Sukses!", { id: loadId });
                                  } catch { toast.error("Gagal", { id: loadId }); }
                               }
                            }} />
                         )}
                      </div>
                   </div>
                ) : (
                   <div className="space-y-3">
                      {q.options.map((opt, idx) => (
                         <button 
                           key={idx}
                           onClick={() => handleAnswer(q.id, idx)}
                           className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${session.answers[q.id] === idx ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-100 hover:border-blue-200'}`}
                         >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${session.answers[q.id] === idx ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                               {String.fromCharCode(65+idx)}
                            </div>
                            <span className="font-medium">{opt}</span>
                         </button>
                      ))}
                   </div>
                )}
             </div>

             {/*NAVIGATION */}
             <div className="mt-8 flex justify-between pt-6 border-t border-slate-100">
                <button disabled={currentQIndex===0} onClick={() => setCurrentQIndex(i => i-1)} className="flex items-center gap-2 text-slate-400 font-bold disabled:opacity-50">
                   <ChevronLeft size={20} /> Sebelumnya
                </button>
                
                {currentQIndex === exam.questions.length - 1 ? (
                   <button onClick={() => handleCompleteTopic(selectedTopic!)} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 flex items-center gap-2">
                      SELESAI MODUL INI <CheckCircle size={20} />
                   </button>
                ) : (
                   <button onClick={() => setCurrentQIndex(i => i+1)} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-700 flex items-center gap-2">
                      Selanjutnya <ChevronRight size={20} />
                   </button>
                )}
             </div>

          </div>
       </div>

       {/* === MODAL TIPS & TRIK (ONBOARDING) === */}
       {showTips && session && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md animate-fade-in"></div>
             
             <div className="relative bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-zoom-in">
                <div className="text-center mb-6">
                   <h2 className="text-2xl font-black text-slate-800 mb-2">🚀 TIPS SUKSES UJIAN</h2>
                   <p className="text-slate-500 text-sm">Baca sebentar biar nggak panik nanti.</p>
                </div>

                <div className="space-y-4 mb-8">
                   <div className="flex gap-4 items-start bg-blue-50 p-4 rounded-2xl">
                      <div className="bg-blue-200 text-blue-700 p-2 rounded-lg font-bold text-xs">1</div>
                      <div>
                         <h4 className="font-bold text-slate-800 text-sm">Kerjakan yang Mudah Dulu</h4>
                         <p className="text-xs text-slate-500 mt-1">Jangan terpaku pada satu soal susah. Waktu terus berjalan!</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start bg-orange-50 p-4 rounded-2xl">
                      <div className="bg-orange-200 text-orange-700 p-2 rounded-lg font-bold text-xs">2</div>
                      <div>
                         <h4 className="font-bold text-slate-800 text-sm">Wajib Upload ke Drive</h4>
                         <p className="text-xs text-slate-500 mt-1">Untuk soal Essay/Praktik, upload dulu ke link Google Drive yang disediakan, baru konfirmasi di sini.</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start bg-emerald-50 p-4 rounded-2xl">
                      <div className="bg-emerald-200 text-emerald-700 p-2 rounded-lg font-bold text-xs">3</div>
                      <div>
                         <h4 className="font-bold text-slate-800 text-sm">Kirim Hasil Akhir</h4>
                         <p className="text-xs text-slate-500 mt-1">Setelah semua modul selesai, jangan lupa klik tombol "KIRIM HASIL" di bagian atas.</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => setShowTips(false)} className="py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-xs">
                      BERUSAHA PAHAM 😅
                   </button>
                   <button onClick={() => setShowTips(false)} className="py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 text-xs">
                      SIAP! BISMILLAH 🤲
                   </button>
                </div>
             </div>
          </div>
       )}

       {/* === MODAL SELAMAT (CELEBRATION) === */}
       {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
             <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl animate-fade-in"></div>
             
             <div className="relative bg-white rounded-[3rem] max-w-lg w-full p-10 text-center shadow-2xl border border-white/20 animate-fade-in-up">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200 rotate-6 transform hover:rotate-12 transition-transform duration-500">
                   <Award size={56} className="text-white" />
                </div>

                <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
                   Alhamdulillah, Selesai!
                </h2>
                
                <div className="space-y-4 mb-10">
                   <p className="text-slate-600 leading-relaxed font-medium">
                      Kerja keras Anda hari ini telah terekam dengan baik di sistem kami.
                   </p>
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Data Hasil Ujian Telah Dikirim ke Instruktur
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                   <button 
                     onClick={() => navigate('/reports')}
                     className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3 group"
                   >
                      LIHAT REKAP NILAI SAYA
                      <ArrowRightCircle size={20} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      LP3I COLLEGE INDRAMAYU • PROFESIONAL IT & OFFICE
                   </p>
                </div>

                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
             </div>
          </div>
       )}
    </div>
  );
};

// Helper Icon for Name Input
const UserIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

export default ExamRoom;