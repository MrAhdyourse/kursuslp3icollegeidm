import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, ChevronLeft, ChevronRight, 
  FileSpreadsheet, FileText, Presentation, FolderOpen, 
  Layers, Award, Lock, ArrowRightCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { examService } from '../services/examService';
import { db } from '../services/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import type { ExamConfig, StudentExamSession } from '../types/exam';
import toast from 'react-hot-toast';

// --- KONSTANTA ---
const EXAM_ID = 'GLOBAL_UJIKOM';
const LEVEL_ORDER = ['EXCEL', 'WORD', 'PPT', 'ARSIP', 'PRAKTIKUM'];

const ExamRoom: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<StudentExamSession | null>(null);
  const [exam, setExam] = useState<ExamConfig | null>(null);
  
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(180 * 60);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  // --- 1. CORE ENGINE: SYNC ---
  useEffect(() => {
    if (!user) return;
    const DOC_ID = `${EXAM_ID}_${user.uid}`;

    const deadline = new Date();
    deadline.setHours(23, 59, 59, 999);
    if (Date.now() > deadline.getTime()) {
       setIsExpired(true);
       return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(doc(db, "exam_sessions", DOC_ID), (docSnap) => {
       if (!docSnap.exists()) {
          setSession(null);
          setExam(null);
          setNeedsName(true); 
          setLoading(false);
       } else {
          const data = docSnap.data() as StudentExamSession;
          if (!data.studentName || data.studentName === 'Peserta') {
             setNeedsName(true);
          } else {
             setNeedsName(false);
          }
          setSession(data);
          const now = Date.now();
          setTimeLeft(Math.max(0, Math.ceil((data.endTime - now) / 1000)));
          setLoading(false);
       }
    });

    const timerInterval = setInterval(() => {
       setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
       unsubscribe();
       clearInterval(timerInterval);
    };
  }, [user]);

  // --- 2. ACTIONS ---
  const handleCreateSession = async () => {
     if (!user || !tempName.trim()) {
        toast.error("Nama wajib diisi!");
        return;
     }
     setLoading(true);
     try {
        await examService.startExam(user.uid, { id: EXAM_ID, durationMinutes: 180 } as any, {
           name: tempName,
           nis: user.email || user.uid
        });
        setLoading(false);
        setShowTips(true);
     } catch (e) {
        toast.error("Gagal memulai ujian.");
        setLoading(false);
     }
  };

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

  const handleAnswer = async (qId: string, val: any) => {
     if (!session || !user) return;
     try {
        const docRef = doc(db, "exam_sessions", `${EXAM_ID}_${user.uid}`);
        await updateDoc(docRef, { [`answers.${qId}`]: val });
     } catch (e) {
        toast.error("Gagal menyimpan jawaban! Cek koneksi.");
     }
  };

  const handleCompleteTopic = async (topic: string) => {
     if (!session || !user) return;
     const currentCompleted = session.completedTopics || [];
     if (!currentCompleted.includes(topic)) {
        const updated = [...currentCompleted, topic];
        const docRef = doc(db, "exam_sessions", `${EXAM_ID}_${user.uid}`);
        await updateDoc(docRef, { completedTopics: updated });
        toast.success(`Modul ${topic} Selesai!`);
     }
     setSelectedTopic(null);
     setExam(null);
  };

  const handleFinalSubmit = async () => {
     if (!confirm("KIRIM SEMUA JAWABAN KE INSTRUKTUR?")) return;
     if (!session || !user) return;
     setLoading(true);
     try {
        const docRef = doc(db, "exam_sessions", `${EXAM_ID}_${user.uid}`);
        const omnibus = await examService.getExamByProgram('Administrasi Perkantoran', 'OMNIBUS');
        const questions = omnibus?.questions || [];
        
        let totalPoints = 0;
        let maxPoints = 0;
        questions.forEach(q => {
           maxPoints += q.points;
           if (session.answers[q.id] === q.correctIndex) totalPoints += q.points;
        });
        const finalScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

        await updateDoc(docRef, { 
           status: 'SUBMITTED',
           finalScore: finalScore,
           submittedAt: new Date().toISOString()
        });

        await examService.submitExam(session, questions);
        setLoading(false);
        setShowSuccessModal(true);
     } catch (e) {
        toast.error("Gagal mengirim hasil.");
        setLoading(false);
     }
  };

  // --- RENDERERS ---
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

  if (isExpired) {
     return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-center p-6 text-white font-sans">
           <Lock size={48} className="text-red-500 mb-6" />
           <h1 className="text-3xl font-black mb-2">AKSES DITUTUP</h1>
           <p className="text-slate-400 max-w-md mb-8">Batas waktu akses ujian hari ini (23:59 WIB) telah berakhir.</p>
           <button onClick={() => navigate('/')} className="px-8 py-3 bg-slate-800 rounded-xl font-bold">Kembali</button>
        </div>
     );
  }

  if (needsName || !session) {
     return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Identitas Peserta</h2>
              <input type="text" placeholder="Nama Lengkap..." className="w-full text-center text-lg font-bold border-2 rounded-xl p-4 mb-4" value={tempName} onChange={e => setTempName(e.target.value.toUpperCase())} autoFocus />
              <button onClick={handleCreateSession} disabled={tempName.length < 3} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl">MULAI UJIAN</button>
           </div>
        </div>
     );
  }

  // --- RENDER 2: LOBBY UJIAN (WORLD CLASS REDESIGN) ---
  if (!exam) {
     const completed = session.completedTopics || [];
     const progressPercent = Math.round((completed.length / LEVEL_ORDER.length) * 100);
     
     return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
           {/* HEADER (Sticky & Glass) */}
           <header className="bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-200 sticky top-0 z-40 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
                    <Award size={20} />
                 </div>
                 <div>
                    <h1 className="font-black text-lg text-slate-800 tracking-tight leading-none">UJIKOM 2026</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{session.studentName}</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="hidden md:flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sisa Waktu</span>
                    <div className={`font-mono font-bold text-xl ${timeLeft < 600 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                       {formatTime(timeLeft)}
                    </div>
                 </div>
                 
                 {/* Mobile Timer Icon */}
                 <div className="md:hidden bg-slate-100 p-2 rounded-lg font-mono font-bold text-sm">
                    {formatTime(timeLeft)}
                 </div>
              </div>
           </header>

           <main className="max-w-6xl mx-auto p-6 md:p-8 space-y-10">
              
              {/* HERO SECTION (Progress) */}
              <div className="relative bg-slate-900 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl text-white">
                 {/* Background Decor */}
                 <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                 <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div className="w-full">
                       <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-widest mb-2">
                          <CheckCircle size={14} /> Progress Capaian
                       </div>
                       <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                          Halo, {(session.studentName || 'Peserta').split(' ')[0]}! <br/>
                          <span className="text-slate-400 font-medium text-lg">Selesaikan {LEVEL_ORDER.length - completed.length} modul lagi untuk lulus.</span>
                       </h2>
                       
                       {/* Progress Bar */}
                       <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden border border-slate-700">
                          <div 
                             className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-1000 ease-out relative"
                             style={{ width: `${progressPercent}%` }}
                          >
                             <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                          </div>
                       </div>
                       <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
                          <span>0%</span>
                          <span>{progressPercent}% Selesai</span>
                          <span>100%</span>
                       </div>
                    </div>

                    {/* ACTION BUTTON (Primary) */}
                    {completed.length > 0 && (
                       <button 
                         onClick={handleFinalSubmit}
                         className="w-full md:w-auto bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 hover:scale-105 transition-all flex items-center justify-center gap-3 animate-bounce-slow whitespace-nowrap"
                       >
                          <span>KIRIM SEMUA HASIL</span>
                          <ArrowRightCircle size={24} />
                       </button>
                    )}
                 </div>
              </div>

              {/* MODULE GRID */}
              <div>
                 <h3 className="font-black text-slate-800 text-xl mb-6 flex items-center gap-2">
                    <Layers className="text-slate-400" /> Daftar Modul Ujian
                 </h3>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {LEVEL_ORDER.map((topic, idx) => {
                       const isDone = completed.includes(topic);
                       // Visual Config
                       let config = { bg: 'from-slate-700 to-slate-900', icon: Layers, label: topic, accent: 'bg-slate-500' };
                       
                       if (topic === 'EXCEL') config = { bg: 'from-emerald-600 to-teal-800', icon: FileSpreadsheet, label: 'Microsoft Excel', accent: 'bg-emerald-500' };
                       if (topic === 'WORD') config = { bg: 'from-blue-600 to-indigo-800', icon: FileText, label: 'Microsoft Word', accent: 'bg-blue-500' };
                       if (topic === 'PPT') config = { bg: 'from-orange-500 to-red-700', icon: Presentation, label: 'PowerPoint', accent: 'bg-orange-500' };
                       if (topic === 'ARSIP') config = { bg: 'from-purple-600 to-fuchsia-800', icon: FolderOpen, label: 'Kearsipan', accent: 'bg-purple-500' };
                       if (topic === 'PRAKTIKUM') config = { bg: 'from-slate-700 to-black', icon: Award, label: 'Ujian Praktikum', accent: 'bg-indigo-500' };

                       const Icon = config.icon;

                       return (
                          <button 
                            key={topic}
                            onClick={() => !isDone && handleStartTopic(topic)}
                            disabled={isDone}
                            className={`group relative p-6 rounded-[2rem] text-left transition-all duration-300 overflow-hidden ${
                               isDone 
                               ? 'bg-slate-100 border-2 border-slate-200 opacity-60 cursor-not-allowed' 
                               : 'bg-white border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2'
                            }`}
                          >
                             {/* Card Header */}
                             <div className="flex justify-between items-start mb-12 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${config.bg} group-hover:scale-110 transition-transform duration-500`}>
                                   <Icon size={24} />
                                </div>
                                <div className="text-[10px] font-black text-slate-300 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-widest">
                                   Level {idx + 1}
                                </div>
                             </div>

                             {/* Card Body */}
                             <div className="relative z-10">
                                <h4 className={`text-lg font-black mb-1 ${isDone ? 'text-slate-400' : 'text-slate-800 group-hover:text-blue-600'} transition-colors`}>
                                   {config.label}
                                </h4>
                                <p className="text-xs text-slate-400 font-medium">
                                   {isDone ? 'Terekam di Server' : 'Klik untuk mengerjakan'}
                                </p>
                             </div>

                             {/* Status Badge */}
                             <div className="mt-6 flex items-center gap-2">
                                {isDone ? (
                                   <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                                      <CheckCircle size={14} /> SELESAI
                                   </div>
                                ) : (
                                   <div className="flex items-center gap-2 text-blue-600 font-bold text-xs group-hover:gap-3 transition-all">
                                      KERJAKAN SEKARANG <ArrowRightCircle size={16} />
                                   </div>
                                )}
                             </div>

                             {/* Decoration */}
                             <div className={`absolute -bottom-6 -right-6 w-32 h-32 rounded-full opacity-10 blur-2xl ${config.accent}`}></div>
                          </button>
                       )
                    })}
                 </div>
              </div>

              {/* FOOTER */}
              <div className="text-center pt-10 border-t border-slate-200">
                 <p className="text-xs text-slate-400 font-medium">
                    Ingin tantangan lebih? <button onClick={() => handleStartTopic('OMNIBUS')} className="text-slate-600 hover:text-blue-600 underline font-bold">Coba Mode Omnibus</button>
                 </p>
              </div>
           </main>
        </div>
     );
  }

  const q = exam.questions[currentQIndex];
  const cat = getCategoryInfo(q.id);
  const QIcon = cat.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <button onClick={() => setExam(null)} className="p-2 text-slate-500"><ChevronLeft size={24} /></button>
          <div className={`px-3 py-1 rounded text-[10px] font-black uppercase flex items-center gap-2 ${cat.bg} ${cat.color}`}><QIcon size={14} /> {cat.label}</div>
          <div className="font-mono font-bold text-lg">{formatTime(timeLeft)}</div>
       </div>
       <div className="flex-1 max-w-4xl mx-auto w-full p-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border min-h-[60vh] flex flex-col">
             <div className="mb-8"><span className="text-xs font-bold text-slate-400 uppercase">Soal {currentQIndex + 1}</span><h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-2">{q.text}</h2></div>
             {q.spreadsheetData && <div className="mb-8 overflow-x-auto border rounded-xl"><table className="w-full text-sm"><tbody>{q.spreadsheetData.map((row, i) => (<tr key={i} className={i===0 ? 'bg-slate-50 font-bold' : ''}>{row.map((cell, j) => (<td key={j} className="border px-4 py-2">{cell}</td>))}</tr>))}</tbody></table></div>}
             <div className="mt-4 flex-1">
                {q.type === 'ESSAY' ? (
                   <div className="space-y-6">
                      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100"><h4 className="font-bold text-orange-700 text-sm mb-2">LANGKAH 1: UPLOAD DRIVE</h4><a href="https://drive.google.com/drive/folders/1EUD6nuCcUDlcINxLw__fjZOQ6Mx7BVGO?usp=drive_link" target="_blank" className="block w-full bg-orange-600 text-white text-center py-3 rounded-xl font-bold">BUKA DRIVE</a></div>
                      <div className="bg-slate-50 p-6 rounded-2xl border text-center"><h4 className="font-bold text-slate-700 text-sm mb-4">LANGKAH 2: KONFIRMASI</h4>{session.answers[q.id] ? (<div className="text-emerald-600 font-bold flex flex-col items-center gap-2"><CheckCircle size={32} /><span>File Terupload!</span><button onClick={() => handleAnswer(q.id, null)} className="text-xs text-red-500 underline">Ganti File</button></div>) : (<input type="file" onChange={async (e) => { const f = e.target.files?.[0]; if(f) { const loadId = toast.loading("Uploading..."); try { const url = await examService.uploadExamFile(f, user?.uid ?? '', session.examId, q.id); await handleAnswer(q.id, url); toast.success("Sukses!", { id: loadId }); } catch { toast.error("Gagal", { id: loadId }); } } }} />)}</div>
                   </div>
                ) : (
                   <div className="space-y-3">
                      {q.options.map((opt, idx) => (
                         <button key={idx} onClick={() => handleAnswer(q.id, idx)} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${session.answers[q.id] === idx ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-100 hover:border-blue-200'}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${session.answers[q.id] === idx ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{String.fromCharCode(65+idx)}</div><span className="font-medium">{opt}</span></button>
                      ))}
                   </div>
                )}
             </div>
             <div className="mt-8 flex justify-between pt-6 border-t">
                <button disabled={currentQIndex===0} onClick={() => setCurrentQIndex(i => i-1)} className="flex items-center gap-2 text-slate-400 font-bold disabled:opacity-50"><ChevronLeft size={20} /> Sebelumnya</button>
                {currentQIndex === exam.questions.length - 1 ? (<button onClick={() => handleCompleteTopic(selectedTopic!)} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">SELESAI MODUL <CheckCircle size={20} /></button>) : (<button onClick={() => setCurrentQIndex(i => i+1)} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">Selanjutnya <ChevronRight size={20} /></button>)}
             </div>
          </div>
       </div>
       {showTips && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md"></div><div className="relative bg-white rounded-3xl max-w-lg w-full p-8 text-center">
             <h2 className="text-2xl font-black mb-4">🚀 TIPS SUKSES UJIAN</h2>
             <p className="mb-6 text-slate-600">Kerjakan yang mudah dulu, upload file ke Drive baru konfirmasi di sini, dan jangan lupa klik KIRIM HASIL AKHIR.</p>
             <button onClick={() => setShowTips(false)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl">SIAP! BISMILLAH</button>
          </div></div>
       )}
       {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"></div><div className="relative bg-white rounded-[3rem] max-w-lg w-full p-10 text-center">
             <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8"><Award size={56} /></div>
             <h2 className="text-3xl font-black mb-4">Alhamdulillah, Selesai!</h2>
             <p className="text-slate-600 mb-10">Data hasil ujian telah terkirim ke instruktur.</p>
             <button onClick={() => navigate('/reports')} className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3">LIHAT REKAP NILAI <ArrowRightCircle size={20} /></button>
          </div></div>
       )}
    </div>
  );
};

export default ExamRoom;