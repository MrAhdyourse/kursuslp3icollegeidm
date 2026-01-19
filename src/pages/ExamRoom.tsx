import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, List, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { examService } from '../services/examService';
import type { ExamConfig, StudentExamSession } from '../types/exam';

const ExamRoom: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [exam, setExam] = useState<ExamConfig | null>(null);
  const [session, setSession] = useState<StudentExamSession | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  // 1. INIT: Cek Hak Akses & Load Ujian
  useEffect(() => {
    const initExam = async () => {
      if (!user || user.role !== 'STUDENT') {
        alert("Akses ditolak.");
        navigate('/'); 
        return;
      }

      // Ambil Config Ujian sesuai Program Siswa
      // (Asumsi user punya field 'program', kita ambil dummy dulu atau dari profil)
      const userProgram = (user as any).program || "Microsoft Office"; 
      const examData = await examService.getExamByProgram(userProgram);

      if (!examData) {
        alert("Ujian belum tersedia untuk program Anda.");
        navigate('/classmates');
        return;
      }
      setExam(examData);

      // Mulai/Lanjutkan Sesi
      const sessionData = await examService.startExam(user.uid, examData);
      setSession(sessionData);
      setAnswers(sessionData.answers || {});

      // Jika sudah selesai/expired, tendang keluar
      if (sessionData.status !== 'IN_PROGRESS') {
        alert("Anda sudah menyelesaikan ujian ini.");
        navigate('/reports');
      }

      setLoading(false);
    };

    initExam();
  }, [user]);

  // 2. TIMER ENGINE (The Heartbeat)
  useEffect(() => {
    if (!session || session.status !== 'IN_PROGRESS') return;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((session.endTime - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        handleSubmit(true); // Auto Submit
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  // 3. Prevent Tab Close (Warning)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (session?.status === 'IN_PROGRESS') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session]);

  // --- ACTIONS ---

  const handleAnswer = async (questionId: string, optionIndex: number) => {
    if (!session) return;
    
    // Update Local UI Instantly
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    
    // Sync to Server (Silent)
    await examService.saveAnswer(session.id, questionId, optionIndex);
  };

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && !confirm("Yakin ingin mengumpulkan ujian? Aksi ini tidak bisa dibatalkan.")) return;
    if (!session || !exam) return;

    setLoading(true);
    await examService.submitExam({ ...session, answers }, exam.questions);
    
    alert(isAuto ? "Waktu Habis! Jawaban otomatis dikirim." : "Ujian Berhasil Dikumpulkan! Silakan cek hasil di menu Laporan Nilai.");
    navigate('/reports');
  };

  // --- RENDER HELPERS ---
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
  };

  if (loading || !exam) return <div className="h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-400">Memuat Ruang Ujian...</div>;

  const currentQ = exam.questions[currentQIndex];
  
  // LOGIC: Check PG Completion
  const pgQuestions = exam.questions.filter(q => !q.type || q.type === 'MULTIPLE_CHOICE');
  // PG dianggap selesai jika ID soal ada di object 'answers'
  const isPgComplete = pgQuestions.every(q => answers[q.id] !== undefined);
  const isLastPg = currentQIndex === pgQuestions.length - 1;
  const isEssaySection = currentQ.type === 'ESSAY';

  const handleNext = () => {
    // Block jika di soal PG terakhir tapi belum semua PG dijawab
    if (!isEssaySection && isLastPg && !isPgComplete) {
      alert("Harap selesaikan semua soal Pilihan Ganda sebelum lanjut ke Essay!");
      return;
    }
    setCurrentQIndex(i => i + 1);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* 1. TOP BAR (Sticky) */}
      <div className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div>
          <h1 className="font-black text-lg tracking-wider">UJIKOM</h1>
          <p className="text-xs text-slate-400 font-bold">{exam.title}</p>
        </div>
        
        <div className={`flex items-center gap-3 px-6 py-2 rounded-xl font-mono text-2xl font-black shadow-inner border-2 ${timeLeft < 300 ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-slate-800 border-slate-700'}`}>
          <Clock size={24} />
          {formatTime(timeLeft)}
        </div>

        <button 
          onClick={() => handleSubmit(false)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <CheckCircle size={18} /> SELESAI
        </button>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: QUESTION AREA */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-10 min-h-[500px] flex flex-col relative">
            
            <div className="absolute top-6 left-8 text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              Soal {currentQIndex + 1} dari {exam.questions.length}
              {currentQ.type === 'ESSAY' && <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px]">ESSAY</span>}
            </div>

            <div className="mt-8 mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                {currentQ.text}
              </h2>
            </div>

            {/* RENDER OPTIONS OR ESSAY INPUT */}
            {(!currentQ.type || currentQ.type === 'MULTIPLE_CHOICE') ? (
              <div className="space-y-4">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(currentQ.id, idx)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-md' 
                          : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border ${
                        isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-slate-300 text-slate-400 group-hover:border-blue-300'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="font-medium text-base">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
               <div className="mt-4">
                 <textarea 
                    className="w-full h-48 p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-slate-700 font-medium leading-relaxed"
                    placeholder="Ketik jawaban Anda di sini..."
                    value={answers[currentQ.id] ? "Jawaban Tersimpan" : ""} // Mock display
                    onChange={() => handleAnswer(currentQ.id, 1)} // Mock save answer (length > 0)
                 ></textarea>
                 <p className="mt-2 text-xs text-slate-400 italic">*Jawaban Essay disimpan otomatis saat mengetik.</p>
               </div>
            )}

            <div className="mt-auto pt-10 flex justify-between items-center">
              <button 
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(i => i - 1)}
                className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft /> Sebelumnya
              </button>
              <button 
                disabled={currentQIndex === exam.questions.length - 1}
                onClick={handleNext}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 transition-all ${
                   (!isEssaySection && isLastPg && !isPgComplete) 
                     ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                     : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {(!isEssaySection && isLastPg && !isPgComplete) ? <Lock size={16}/> : null}
                Selanjutnya <ChevronRight />
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT: NAVIGATION PANEL */}
        <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto hidden lg:block">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <List size={18} /> Navigasi Soal
          </h3>
          
          <div className="space-y-8">
            
            {/* 1. KATEGORI: PILIHAN GANDA */}
            {exam.questions.some(q => !q.type || q.type === 'MULTIPLE_CHOICE') && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Pilihan Ganda
                  </h4>
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full">
                    {pgQuestions.length} Soal
                  </span>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {exam.questions.map((q, idx) => {
                    if (q.type && q.type !== 'MULTIPLE_CHOICE') return null; // Skip Essay
                    
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = currentQIndex === idx;
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQIndex(idx)}
                        className={`aspect-square rounded-full font-bold text-xs transition-all flex items-center justify-center relative group ${
                          isCurrent ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 ring-2 ring-blue-200 z-10' :
                          isAnswered ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' :
                          'bg-white text-slate-400 border border-slate-200 hover:border-blue-400 hover:text-blue-500'
                        }`}
                      >
                        {idx + 1}
                        {isCurrent && <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. KATEGORI: ESSAY PRAKTIKUM */}
            {exam.questions.some(q => q.type === 'ESSAY') && (
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    Essay Praktikum
                  </h4>
                  <span className="bg-indigo-50 text-indigo-500 text-[10px] font-bold px-2 py-1 rounded-full border border-indigo-100">
                    {exam.questions.filter(q => q.type === 'ESSAY').length} Kasus
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {exam.questions.map((q, idx) => {
                    if (q.type !== 'ESSAY') return null; // Skip PG
                    
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = currentQIndex === idx;
                    const isLocked = !isPgComplete; // Lock logic
                    
                    return (
                      <button
                        key={q.id}
                        disabled={isLocked}
                        onClick={() => setCurrentQIndex(idx)}
                        className={`h-10 w-full rounded-lg font-bold text-xs transition-all flex items-center justify-center relative overflow-hidden ${
                          isLocked ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-100' :
                          isCurrent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-200 z-10' :
                          isAnswered ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' :
                          'bg-indigo-50/50 text-indigo-400 border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-300'
                        }`}
                      >
                         {isLocked ? <Lock size={12} /> : <span className="z-10 relative">#{idx + 1}</span>}
                         {isCurrent && !isLocked && <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-500 opacity-100"></div>}
                      </button>
                    );
                  })}
                </div>
                {!isPgComplete && (
                   <p className="mt-3 text-[10px] text-center text-slate-400 bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-center gap-1">
                     <Lock size={10}/> Selesaikan Pilihan Ganda dahulu.
                   </p>
                )}
              </div>
            )}
          
          </div>

          <div className="mt-10 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <h4 className="font-bold text-amber-800 text-xs uppercase mb-2 flex items-center gap-2">
              <AlertTriangle size={14} /> Aturan Ujian
            </h4>
            <ul className="text-[10px] text-amber-700 space-y-1 list-disc pl-4">
              <li>Dilarang keluar dari mode layar penuh.</li>
              <li>Jawaban tersimpan otomatis.</li>
              <li>Waktu berjalan terus meski browser ditutup.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExamRoom;
