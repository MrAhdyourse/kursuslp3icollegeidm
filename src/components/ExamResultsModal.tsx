import React, { useEffect, useState } from 'react';
import { 
  X, Award, CheckCircle, XCircle, FileText, 
  Search, ChevronRight, User, Clock, AlertCircle, 
  ExternalLink, BarChart2
} from 'lucide-react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { StudentExamSession, Question } from '../types/exam';
import { OMNIBUS_EXAM_QUESTIONS } from '../utils/questions/omnibusQuestions'; // Source of Truth Kunci Jawaban
import { studentService } from '../services/studentService';

interface ExamResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  classId: string;
}

// --- TIPE DATA LOCAL ---
interface EnhancedResult {
  sessionId: string;
  studentId: string;
  studentName: string;
  nis: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  score: number;
  answers: Record<string, any>; // Key: QuestionID, Value: UserAnswer
  submittedAt: string | null;
  durationMinutes: number;
}

export const ExamResultsModal: React.FC<ExamResultsModalProps> = ({ isOpen, onClose, examId }) => {
  const [results, setResults] = useState<EnhancedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<EnhancedResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // FILTER QUESTIONS (All Questions Data)
  const allQuestions = OMNIBUS_EXAM_QUESTIONS;

  // --- 1. CORE LOGIC: REAL-TIME DATA SYNC ---
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    let unsubscribe = () => {};

    const setupRealtimeListener = async () => {
      try {
        // A. Listener Firebase (Utama)
        // Kita dengarkan semua perubahan di koleksi 'exam_sessions' yang sesuai examId
        const q = query(collection(db, "exam_sessions"), where("examId", "==", examId));
        
        unsubscribe = onSnapshot(q, async (snapshot) => {
           console.log("Realtime Update Received:", snapshot.size, "docs");
           
           const firestoreSessions = snapshot.docs.map(d => d.data() as StudentExamSession);
           
           // B. Ambil Data Lokal (Backup/Dev)
           const localSessionsRaw = localStorage.getItem('exam_sessions');
           const localSessions: StudentExamSession[] = localSessionsRaw ? JSON.parse(localSessionsRaw) : [];
           
           // C. Gabungkan (Firestore menang jika ID sama)
           const allSessions = [...localSessions];
           firestoreSessions.forEach(fs => {
             const idx = allSessions.findIndex(ls => ls.id === fs.id);
             if (idx > -1) allSessions[idx] = fs;
             else allSessions.push(fs);
           });

           // D. Ambil Data Siswa & Mapping (Sama seperti sebelumnya)
           const registeredStudents = await studentService.getAllStudents();

           const mappedResults: EnhancedResult[] = allSessions.map(session => {
              const matchedStudent = registeredStudents.find(s => s.id === session.studentId);
              let displayName = matchedStudent?.name || "Peserta Tamu";
              let displayNis = matchedStudent?.nis || session.studentId.substring(0, 6).toUpperCase();

              if (!matchedStudent && session.studentId.length > 8) {
                 displayName = `User (${session.studentId.substring(0,6)}...)`;
              }

              return {
                sessionId: session.id,
                studentId: session.studentId,
                studentName: displayName,
                nis: displayNis,
                status: session.status || 'IN_PROGRESS',
                score: session.finalScore || 0,
                answers: session.answers || {},
                submittedAt: session.endTime ? new Date(session.endTime).toLocaleString() : null,
                durationMinutes: 180
              };
           });

           setResults(mappedResults);
           setLoading(false);
        }, (error) => {
           console.error("Realtime Error:", error);
           setLoading(false);
        });

      } catch (e) {
        console.error("Setup Error:", e);
        setLoading(false);
      }
    };

    setupRealtimeListener();

    return () => unsubscribe();
  }, [isOpen, examId]);

  // Hapus fungsi fetchComprehensiveResults manual karena sudah diganti useEffect di atas
  // const fetchComprehensiveResults = ... (DELETED)

  // --- RENDER HELPERS ---
  
  const getQuestionStatus = (q: Question, userAnswer: any) => {
    if (userAnswer === undefined || userAnswer === null) return 'unanswered';
    if (q.type === 'ESSAY') return 'review_needed'; // Essay butuh review manual (atau cek file)
    if (q.correctIndex !== undefined && userAnswer === q.correctIndex) return 'correct';
    return 'incorrect';
  };

  const filteredResults = results.filter(r => 
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.nis.includes(searchTerm)
  );

  const stats = {
    avg: results.length > 0 ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length) : 0,
    pass: results.filter(r => r.score >= 75).length,
    fail: results.filter(r => r.score < 75).length
  };

  // --- ADMIN ACTION: RESET DATA ---
  const handleResetData = async () => {
    if (!confirm("⚠️ BAHAYA: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA UJIAN ini?\n\nSemua nilai dan jawaban siswa akan hilang permanen. Tindakan ini tidak bisa dibatalkan.")) return;
    
    const doubleCheck = prompt("Ketik 'RESET' untuk konfirmasi penghapusan:");
    if (doubleCheck !== 'RESET') {
      alert("Penghapusan dibatalkan.");
      return;
    }

    setLoading(true);
    try {
      // Hapus data di Firestore
      const deletePromises = results.map(r => {
        if (r.sessionId) {
           return deleteDoc(doc(db, "exam_sessions", r.sessionId));
        }
        return Promise.resolve();
      });

      await Promise.all(deletePromises);

      // Hapus data di LocalStorage (Browser Instruktur saja)
      // Note: Siswa harus clear cache sendiri atau logic startExam akan overwrite jika tidak nemu di server
      localStorage.removeItem('exam_sessions');
      
      alert("✅ Data ujian berhasil di-reset. Semua siswa kembali ke status nol.");
      setResults([]); // Clear local view
    } catch (e) {
      console.error("Gagal reset:", e);
      alert("Terjadi kesalahan saat menghapus data.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 font-sans animate-fade-in">
      <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-[2rem] shadow-2xl flex overflow-hidden border border-slate-200">
        
        {/* === SIDEBAR: DAFTAR SISWA === */}
        <div className={`w-full lg:w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col transition-all ${selectedStudent ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Header Sidebar */}
          <div className="p-6 border-b border-slate-200 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Award className="text-blue-600" /> Gradebook
              </h2>
              <div className="flex gap-2">
                 <button onClick={handleResetData} className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1" title="Reset Semua Data Ujian">
                   <AlertCircle size={14} /> RESET
                 </button>
                 <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition">
                   <X size={20} />
                 </button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama atau NIS..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-transparent focus:bg-white focus:border-blue-300 rounded-xl text-sm font-medium outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Statistik Mini */}
          <div className="grid grid-cols-3 gap-1 px-6 py-4 bg-slate-50 border-b border-slate-200">
             <div className="text-center p-2 bg-white rounded-lg shadow-sm border border-slate-100">
               <div className="text-[10px] uppercase font-bold text-slate-400">Rata-rata</div>
               <div className="font-black text-blue-600 text-lg">{stats.avg}</div>
             </div>
             <div className="text-center p-2 bg-emerald-50 rounded-lg shadow-sm border border-emerald-100">
               <div className="text-[10px] uppercase font-bold text-emerald-600">Lulus</div>
               <div className="font-black text-emerald-700 text-lg">{stats.pass}</div>
             </div>
             <div className="text-center p-2 bg-red-50 rounded-lg shadow-sm border border-red-100">
               <div className="text-[10px] uppercase font-bold text-red-600">Remedial</div>
               <div className="font-black text-red-700 text-lg">{stats.fail}</div>
             </div>
          </div>

          {/* List Siswa */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-xs font-bold">Memuat Data...</span>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center p-8 text-slate-400 text-sm">Tidak ada data ditemukan.</div>
            ) : (
              filteredResults.map((student) => (
                <button 
                  key={student.sessionId}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all group relative overflow-hidden ${
                    selectedStudent?.sessionId === student.sessionId 
                    ? 'bg-white border-blue-500 shadow-lg ring-4 ring-blue-50 z-10' 
                    : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors truncate max-w-[150px]">{student.studentName}</div>
                      <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit">{student.nis}</div>
                    </div>
                    {student.score >= 75 
                      ? <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded text-xs font-black">{student.score}</span>
                      : <span className="text-red-500 bg-red-50 px-2 py-1 rounded text-xs font-black">{student.score}</span>
                    }
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                     <span className={`${student.status === 'SUBMITTED' ? 'text-emerald-600' : 'text-orange-500'}`}>
                       {student.status === 'SUBMITTED' ? 'SELESAI' : 'PROSES'}
                     </span>
                     <ChevronRight size={14} className={`text-slate-300 transform transition-transform ${selectedStudent?.sessionId === student.sessionId ? 'rotate-90' : ''}`} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* === MAIN CONTENT: DETAIL PENILAIAN === */}
        <div className={`flex-1 bg-white flex flex-col relative ${!selectedStudent ? 'hidden lg:flex' : 'flex'}`}>
          
          {selectedStudent ? (
            <>
              {/* Detail Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-end bg-slate-50/50 backdrop-blur">
                <div>
                  <button onClick={() => setSelectedStudent(null)} className="lg:hidden mb-4 flex items-center gap-1 text-slate-500 text-xs font-bold hover:text-blue-600">
                    <ChevronRight size={14} className="rotate-180" /> KEMBALI KE LIST
                  </button>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{selectedStudent.studentName}</h1>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1"><User size={14}/> {selectedStudent.nis}</span>
                    <span className="flex items-center gap-1"><Clock size={14}/> Dikumpulkan: {selectedStudent.submittedAt || '-'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Nilai Akhir</div>
                  <div className={`text-4xl font-black ${selectedStudent.score >= 75 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {selectedStudent.score}
                    <span className="text-lg text-slate-300 ml-1">/100</span>
                  </div>
                </div>
              </div>

              {/* Detail Jawaban List */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
                
                {/* 1. SECTION: PRAKTIKUM / ESSAY (PRIORITAS) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100">
                   <h3 className="font-black text-indigo-900 text-lg mb-6 flex items-center gap-2">
                     <Award className="text-indigo-500" /> HASIL PRAKTIKUM (FILE UPLOAD)
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allQuestions.filter(q => q.type === 'ESSAY').map((q) => {
                         const answerUrl = selectedStudent.answers[q.id];
                         const hasFile = answerUrl && typeof answerUrl === 'string' && answerUrl.length > 5;
                         
                         return (
                           <div key={q.id} className="p-4 border border-slate-200 rounded-2xl hover:border-indigo-200 transition-colors bg-slate-50/50">
                             <div className="mb-3">
                               <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded uppercase tracking-wide">
                                 {q.id.replace('ESSAY-', '')}
                               </span>
                             </div>
                             <p className="text-sm font-semibold text-slate-700 mb-4 line-clamp-2" title={q.text}>{q.text}</p>
                             
                             {hasFile ? (
                               <a 
                                 href={answerUrl} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md group transition-all"
                               >
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-red-100 text-red-500 rounded-lg flex items-center justify-center">
                                     <FileText size={20} />
                                   </div>
                                   <div className="text-left">
                                     <div className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Lihat File Jawaban</div>
                                     <div className="text-[10px] text-slate-400">Klik untuk unduh/preview</div>
                                   </div>
                                 </div>
                                 <ExternalLink size={16} className="text-slate-300 group-hover:text-blue-500" />
                               </a>
                             ) : (
                               <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl text-slate-400 text-xs font-bold border border-slate-200 border-dashed justify-center">
                                 <AlertCircle size={16} /> Siswa belum mengupload
                               </div>
                             )}
                           </div>
                         );
                      })}
                   </div>
                </div>

                {/* 2. SECTION: PILIHAN GANDA (ANALISIS) */}
                <div>
                  <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2 px-2">
                    <BarChart2 className="text-blue-500" /> ANALISIS JAWABAN TEORI
                  </h3>
                  <div className="space-y-4">
                    {allQuestions.filter(q => q.type !== 'ESSAY').map((q, idx) => {
                      const userAnswer = selectedStudent.answers[q.id];
                      const status = getQuestionStatus(q, userAnswer);
                      const isCorrect = status === 'correct';
                      
                      return (
                        <div key={q.id} className={`p-5 rounded-2xl border-l-4 shadow-sm bg-white ${isCorrect ? 'border-emerald-500' : userAnswer === undefined ? 'border-slate-300' : 'border-red-500'}`}>
                          <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isCorrect ? 'bg-emerald-500' : userAnswer === undefined ? 'bg-slate-300' : 'bg-red-500'}`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800 mb-3">{q.text}</p>
                              
                              <div className="flex flex-wrap gap-4 text-xs">
                                <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                  <span className="font-bold text-[10px] uppercase text-slate-400">Jawaban Siswa:</span>
                                  <span className="font-bold">
                                    {userAnswer !== undefined && q.options ? q.options[userAnswer] : '(Tidak Menjawab)'}
                                  </span>
                                  {isCorrect ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                                </div>

                                {!isCorrect && q.correctIndex !== undefined && q.options && (
                                  <div className="px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 text-slate-600 flex items-center gap-2 opacity-80">
                                    <span className="font-bold text-[10px] uppercase text-slate-400">Kunci Jawaban:</span>
                                    <span className="font-bold">{q.options[q.correctIndex]}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 text-center bg-slate-50">
              <div className="w-24 h-24 bg-white rounded-full mb-6 shadow-sm flex items-center justify-center">
                 <User size={48} className="opacity-20" />
              </div>
              <h3 className="text-xl font-black text-slate-400 mb-2">Pilih Siswa</h3>
              <p className="max-w-xs text-sm">Klik nama siswa di panel kiri untuk melihat detail jawaban, file upload, dan analisis nilai secara lengkap.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};