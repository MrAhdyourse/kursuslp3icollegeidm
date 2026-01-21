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

  if (!exam) {
     const completed = session.completedTopics || [];
     if (session.status === 'SUBMITTED' && !showSuccessModal) {
        navigate('/reports');
        return null;
     }
     return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
           <header className="bg-white px-6 py-4 border-b sticky top-0 z-40 flex justify-between items-center shadow-sm">
              <div><h1 className="font-black text-xl text-slate-800">Ujikom 2026</h1><p className="text-xs text-slate-500 font-bold">{session.studentName}</p></div>
              <div className="flex items-center gap-4">
                 {completed.length > 0 && <button onClick={handleFinalSubmit} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold animate-pulse">KIRIM HASIL ({completed.length}/5)</button>}
                 <div className="bg-slate-900 text-white px-4 py-2 rounded-lg font-mono font-bold text-lg">{formatTime(timeLeft)}</div>
              </div>
           </header>
           <main className="max-w-5xl mx-auto p-6">
              <div className="text-center mb-10 mt-4"><h2 className="text-3xl font-black text-slate-800 mb-2">Pilih Modul Ujian</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                 {LEVEL_ORDER.map(topic => {
                    const isDone = completed.includes(topic);
                    return (
                       <button key={topic} onClick={() => !isDone && handleStartTopic(topic)} disabled={isDone} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${isDone ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:border-blue-400'}`}>
                          {isDone && <CheckCircle className="text-emerald-600" size={24} />}
                          <h3 className="font-black">{topic}</h3>
                          <span className="text-[10px] font-bold uppercase">{isDone ? 'SELESAI' : 'MULAI'}</span>
                       </button>
                    )
                 })}
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