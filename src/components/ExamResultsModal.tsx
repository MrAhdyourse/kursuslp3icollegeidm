import React, { useEffect, useState } from 'react';
import { 
  X, Award, FileText, Download,
  Search, ChevronRight, User, Clock, 
  BarChart2, Trash2, RefreshCw, Wifi
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { StudentExamSession } from '../types/exam';import { OMNIBUS_EXAM_QUESTIONS } from '../utils/questions/omnibusQuestions';
import { studentService } from '../services/studentService';
import toast from 'react-hot-toast';

interface ExamResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
}

// --- TIPE DATA UI ---
interface EnhancedResult {
  sessionId: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  score: number;
  answers: Record<string, any>;
  submittedAt: string | null;
  timestamp: number; // Untuk sorting
}

export const ExamResultsModal: React.FC<ExamResultsModalProps> = ({ isOpen, onClose, examId }) => {
  const [results, setResults] = useState<EnhancedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null); // UBAH KE ID (Pointer)
  const [searchTerm, setSearchTerm] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Constants
  const allQuestions = OMNIBUS_EXAM_QUESTIONS;

  // DERIVED STATE: Cari data siswa terbaru dari hasil live
  // Ini kunci agar detail view selalu update otomatis!
  const activeStudent = results.find(r => r.sessionId === selectedSessionId) || null;

  // --- 1. REAL-TIME ENGINE (PURE FIRESTORE) ---
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    
    // Query ke Firestore (Single Source of Truth)
    const q = query(collection(db, "exam_sessions"), where("examId", "==", examId));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
       const firestoreSessions = snapshot.docs.map(d => d.data() as StudentExamSession);
       
       // Ambil Data Registry (Untuk fallback nama jika di sesi kosong)
       // Note: Idealnya nama sudah ada di sesi (Session-embedded identity), tapi kita jaga-jaga.
       const registeredStudents = await studentService.getAllStudents();

       const mapped: EnhancedResult[] = firestoreSessions.map(session => {
          // Logika Nama: Prioritaskan yang tertulis di Sesi (Inputan Siswa)
          let displayName = session.studentName;
          let displayNis = session.studentNis;

          // Fallback ke Registry
          if (!displayName || displayName === 'Peserta') {
             const reg = registeredStudents.find(s => s.id === session.studentId);
             if (reg) {
                displayName = reg.name;
                displayNis = reg.nis;
             }
          }

          // Fallback Terakhir
          if (!displayName) displayName = `Peserta (${session.studentId.substring(0,6)})`;

          return {
             sessionId: session.id,
             studentId: session.studentId,
             studentName: displayName,
             studentNis: displayNis || '-',
             status: session.status || 'IN_PROGRESS',
             score: session.finalScore || 0,
             answers: session.answers || {},
             submittedAt: session.endTime ? new Date(session.endTime).toLocaleString('id-ID') : '-',
             timestamp: session.startTime
          };
       });

       // Sort: Yang sudah submit di atas, lalu berdasarkan nama
       mapped.sort((a, b) => {
          if (a.status === 'SUBMITTED' && b.status !== 'SUBMITTED') return -1;
          if (a.status !== 'SUBMITTED' && b.status === 'SUBMITTED') return 1;
          return a.studentName.localeCompare(b.studentName);
       });

       setResults(mapped);
       setLoading(false);
    }, (err) => {
       console.error("Sync Error:", err);
       toast.error("Gagal sinkronisasi data real-time.");
       setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, examId]);


  // --- 2. ATOMIC RESET (BATCH DELETE) ---
  const handleResetData = async () => {
    if (results.length === 0) return;
    
    if (!confirm("⚠️ PERINGATAN KERAS\n\nAnda akan MENGHAPUS PERMANEN seluruh data ujian siswa yang tampil di layar ini.\n\nSiswa yang sedang ujian akan otomatis ter-reset. Lanjutkan?")) return;
    
    const code = prompt("Ketik 'RESET' untuk konfirmasi penghapusan massal:");
    if (code !== 'RESET') return;

    setIsResetting(true);
    const toastId = toast.loading("Menghapus data sesi...");

    try {
       // BATCH OPERATION: Menghapus banyak dokumen sekaligus dalam 1 request
       const batch = writeBatch(db);
       
       results.forEach(r => {
          // Gunakan ID unik kombinasi (EXAMID_STUDENTID) yang konsisten kita pakai
          const docRef = doc(db, "exam_sessions", `${examId}_${r.studentId}`);
          batch.delete(docRef);
       });

       await batch.commit();
       
       toast.success("Data berhasil dibersihkan total.", { id: toastId });
       setResults([]);
       setSelectedSessionId(null);
    } catch (e) {
       console.error("Batch Delete Error:", e);
       toast.error("Gagal menghapus sebagian data.", { id: toastId });
    } finally {
       setIsResetting(false);
    }
  };

  // --- RENDER HELPERS ---
  const filteredResults = results.filter(r => 
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.studentNis.includes(searchTerm)
  );

  const stats = {
    total: results.length,
    submitted: results.filter(r => r.status === 'SUBMITTED').length,
    avg: results.length > 0 ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length) : 0,
    pass: results.filter(r => r.score >= 75).length
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 font-sans animate-fade-in">
      <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-[2rem] shadow-2xl flex overflow-hidden border border-slate-200">
        
        {/* === PANEL KIRI: LIST SISWA === */}
        <div className={`w-full lg:w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col transition-all ${selectedSessionId ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* HEADER DASHBOARD */}
          <div className="p-6 border-b border-slate-200 bg-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                 <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                   <Award className="text-blue-600" /> Gradebook
                 </h2>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live Sync Active</span>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition">
                <X size={20} />
              </button>
            </div>
            
            {/* SEARCH & FILTER */}
            <div className="flex gap-2 mb-4">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Cari Siswa..." 
                   className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-200 transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               <button 
                 onClick={handleResetData}
                 disabled={isResetting || results.length === 0}
                 className="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center"
                 title="Hapus Semua Data (Reset)"
               >
                 {isResetting ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
               </button>
            </div>

            {/* STATS BAR */}
            <div className="grid grid-cols-3 gap-2">
               <div className="bg-blue-50 p-2 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-blue-400 uppercase">Submit</div>
                  <div className="font-black text-blue-700 text-lg">{stats.submitted}/{stats.total}</div>
               </div>
               <div className="bg-emerald-50 p-2 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase">Lulus</div>
                  <div className="font-black text-emerald-700 text-lg">{stats.pass}</div>
               </div>
               <div className="bg-slate-50 p-2 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata</div>
                  <div className="font-black text-slate-700 text-lg">{stats.avg}</div>
               </div>
            </div>
          </div>

          {/* LIST CONTAINER */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-40 space-y-3 opacity-50">
                  <RefreshCw size={24} className="animate-spin text-blue-500" />
                  <span className="text-xs font-bold">Menghubungkan ke Server...</span>
               </div>
            ) : filteredResults.length === 0 ? (
               <div className="text-center p-10 opacity-40">
                  <User size={48} className="mx-auto mb-2" />
                  <p className="text-sm font-bold">Belum ada data masuk.</p>
                  <p className="text-xs">Data akan muncul otomatis saat siswa mulai.</p>
               </div>
            ) : (
                              filteredResults.map((r) => (
                                 <button 
                                   key={r.sessionId}
                                   onClick={() => setSelectedSessionId(r.sessionId)}
                                   className={`w-full p-4 rounded-xl text-left transition-all border-2 relative group ${
                                      selectedSessionId === r.sessionId 
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-[1.02] z-10' 
                                      : 'bg-white border-slate-100 hover:border-blue-200 text-slate-600 hover:bg-slate-50'
                                   }`}
                                 >
                                    <div className="flex justify-between items-start mb-1">
                                       <div className="font-bold truncate max-w-[140px]">{r.studentName}</div>
                                       {r.status === 'SUBMITTED' ? (
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedSessionId === r.sessionId ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                                             {r.score} Poin
                                          </span>
                                       ) : (
                                          <span className="flex items-center gap-1 text-[10px] font-bold opacity-60">
                                             <Clock size={10} /> Proses
                                          </span>
                                       )}
                                    </div>
                                    <div className={`text-[10px] font-medium uppercase tracking-wider ${selectedSessionId === r.sessionId ? 'text-blue-200' : 'text-slate-400'}`}>
                                       {r.status === 'SUBMITTED' ? 'Selesai Mengerjakan' : 'Sedang Mengerjakan...'}
                                    </div>
                                 </button>
                              ))
            )}
          </div>
        </div>

                {/* === PANEL KANAN: DETAIL SISWA === */}
                <div className={`flex-1 bg-slate-50 flex flex-col ${!selectedSessionId ? 'hidden lg:flex' : 'flex'}`}>
                   {activeStudent ? (
                      <>
                         {/* HEADER DETAIL */}
                         <div className="bg-white p-8 border-b border-slate-200 shadow-sm flex justify-between items-end">
                            <div>
                               <button onClick={() => setSelectedSessionId(null)} className="lg:hidden mb-4 text-xs font-bold text-slate-500 flex items-center gap-1">
                                  <ChevronRight className="rotate-180" size={14}/> KEMBALI
                               </button>
                               <h1 className="text-3xl font-black text-slate-800 tracking-tight">{activeStudent.studentName}</h1>
                               <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  <span className="flex items-center gap-1"><User size={14}/> {activeStudent.studentNis}</span>
                                  <span className="flex items-center gap-1"><Clock size={14}/> {activeStudent.submittedAt}</span>
                               </div>
                            </div>
                            <div className="text-right">
                               <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nilai Akhir</div>
                               <div className={`text-5xl font-black ${activeStudent.score >= 75 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {activeStudent.score}
                               </div>
                            </div>
                         </div>
        
                         {/* CONTENT DETAIL */}
                         <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            
                            {/* 1. HASIL UPLOAD (DRIVE & SYSTEM) */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                               <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                                  <Award className="text-orange-500" /> FILE PRAKTIKUM & ESSAY
                               </h3>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {allQuestions.filter(q => q.type === 'ESSAY').map(q => {
                                     const answerUrl = activeStudent.answers[q.id];
                                     const hasFile = answerUrl && typeof answerUrl === 'string' && answerUrl.length > 5;
                                     
                                     return (
                                        <div key={q.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                                           <div className="mb-2">
                                              <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-1 rounded uppercase">
                                                 {q.id.replace('ESSAY-', '')}
                                              </span>
                                           </div>
                                           <p className="text-sm font-bold text-slate-700 mb-4 line-clamp-2">{q.text}</p>
                                           
                                           {hasFile ? (
                                              <div className="flex gap-2">
                                                 {/* VIEWER (Google Docs) */}
                                                 <a 
                                                    href={answerUrl.endsWith('.pdf') 
                                                       ? `https://docs.google.com/viewer?url=${encodeURIComponent(answerUrl)}&embedded=true`
                                                       : answerUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="flex-1 bg-blue-600 text-white rounded-xl py-2 px-4 text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                                                 >
                                                    <FileText size={16} /> LIHAT
                                                 </a>
                                                 {/* DOWNLOAD */}
                                                 <a 
                                                    href={answerUrl.replace('/upload/', '/upload/fl_attachment/')} 
                                                    className="bg-slate-200 text-slate-600 rounded-xl p-2 hover:bg-slate-300 transition"
                                                    title="Download Asli"
                                                 >
                                                    <Download size={18} />
                                                 </a>
                                              </div>
                                           ) : (
                                              <div className="text-center py-3 bg-slate-100 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-400">
                                                 Belum Upload
                                              </div>
                                           )}
                                        </div>
                                     )
                                  })}
                               </div>
                            </div>
        
                            {/* 2. ANALISIS PILIHAN GANDA */}
                            <div>
                               <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 px-2">
                                  <BarChart2 className="text-indigo-500" /> ANALISIS TEORI
                               </h3>
                               <div className="space-y-3">
                                                                                                                {allQuestions.filter(q => q.type !== 'ESSAY').map((q, idx) => {
                                                                                                                   // --- LOGIC SAKTI (FUZZY MATCH) ---
                                                                                                                   const rawAnswers = activeStudent.answers || {};
                                                                                                                   
                                                                                                                   // 1. Coba Direct Match
                                                                                                                   let userAnswer = rawAnswers[q.id];
                                                                                      
                                                                                                                   // 2. Coba Match tanpa Case (Huruf Besar/Kecil)
                                                                                                                   if (userAnswer === undefined) {
                                                                                                                      const foundKey = Object.keys(rawAnswers).find(k => k.toUpperCase() === q.id.toUpperCase());
                                                                                                                      if (foundKey) userAnswer = rawAnswers[foundKey];
                                                                                                                   }
                                                                                      
                                                                                                                   // 3. Normalisasi Tipe Data
                                                                                                                   if (typeof userAnswer === 'string' && !isNaN(Number(userAnswer))) {
                                                                                                                      userAnswer = Number(userAnswer);
                                                                                                                   }
                                                                                      
                                                                                                                   // 4. Debugging (Hanya di Console Developer)
                                                                                                                   if (idx === 0) console.log("Debug Answers:", activeStudent.studentName, rawAnswers);
                                                                                      
                                                                                                                   const isCorrect = userAnswer === q.correctIndex;
                                                                                                                   
                                                                                                                                                // Tampilkan Text Jawaban
                                                                                                                   
                                                                                                                                                let answerText = '-';
                                                                                                                   
                                                                                                                                                
                                                                                                                   
                                                                                                                                                // LOGIC BARBAR: Tampilkan apapun yang ada
                                                                                                                   
                                                                                                                                                if (userAnswer !== undefined && userAnswer !== null) {
                                                                                                                   
                                                                                                                                                   // Coba ambil text dari opsi
                                                                                                                   
                                                                                                                                                   if (q.options && q.options[userAnswer]) {
                                                                                                                   
                                                                                                                                                      answerText = `${String.fromCharCode(65 + userAnswer)}. ${q.options[userAnswer]}`;
                                                                                                                   
                                                                                                                                                   } else {
                                                                                                                   
                                                                                                                                                      // JIKA GAGAL MAPPING, TAMPILKAN ANGKA MENTAH (JANGAN '-' !!)
                                                                                                                   
                                                                                                                                                      answerText = `(Opsi ke-${userAnswer})`;
                                                                                                                   
                                                                                                                                                   }
                                                                                                                   
                                                                                                                                                } else {
                                                                                                                   
                                                                                                                                                   // Coba cari manual di rawAnswers kalau key-nya beda dikit
                                                                                                                   
                                                                                                                                                   const fuzzyKey = Object.keys(rawAnswers).find(k => k.includes(q.id) || q.id.includes(k));
                                                                                                                   
                                                                                                                                                   if (fuzzyKey) {
                                                                                                                   
                                                                                                                                                      answerText = `(Raw: ${rawAnswers[fuzzyKey]})`;
                                                                                                                   
                                                                                                                                                   }
                                                                                                                   
                                                                                                                                                }
                                                                                                                   
                                                                                                                   
                                                                                                                   
                                                                                                                                                const keyText = q.options 
                                                                                                                   
                                                                                                                                                   ? `${String.fromCharCode(65 + q.correctIndex)}. ${q.options[q.correctIndex]}` 
                                                                                                                   
                                                                                                                                                   : '-';
                                                                                                                   
                                                                                                                                                
                                                                                                                   
                                                                                                                                                return (
                                                                                                                   
                                                                                                                                                   <div key={q.id} className={`p-4 rounded-xl border-l-4 bg-white shadow-sm flex items-start gap-4 ${isCorrect ? 'border-emerald-500' : userAnswer === undefined ? 'border-slate-300' : 'border-red-500'}`}>
                                                                                                                   
                                                                                                                                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5 ${isCorrect ? 'bg-emerald-500' : userAnswer === undefined ? 'bg-slate-300' : 'bg-red-500'}`}>
                                                                                                                   
                                                                                                                                                         {idx + 1}
                                                                                                                   
                                                                                                                                                      </div>
                                                                                                                   
                                                                                                                                                      <div className="flex-1">
                                                                                                                   
                                                                                                                                                         <p className="text-sm font-medium text-slate-700 mb-2">{q.text}</p>
                                                                                                                   
                                                                                                                                                         <div className="flex flex-col gap-2 text-xs">
                                                                                                                   
                                                                                                                                                            <div className={`px-3 py-2 rounded-lg font-bold border ${isCorrect ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'}`}>
                                                                                                                   
                                                                                                                                                               Jawaban Siswa: {answerText}
                                                                                                                   
                                                                                                                                                            </div>
                                                                                                                   
                                                                                                                                                            {!isCorrect && (
                                                                                                                   
                                                                                                                                                               <div className="px-3 py-2 rounded-lg font-bold bg-slate-50 text-slate-600 border border-slate-200">
                                                                                                                   
                                                                                                                                                                  Kunci Jawaban: {keyText}
                                                                                                                   
                                                                                                                                                               </div>
                                                                                                                   
                                                                                                                                                            )}
                                                                                                                   
                                                                                                                                                         </div>
                                                                                                                   
                                                                                                                                                      </div>
                                                                                                                   
                                                                                                                                                   </div>
                                                                                                                   
                                                                                                                                                )
                                                                                                                   
                                                                                                                                             })}
                                                                                                                   
                                                                                                                                          </div>
                                                                                                                   
                                                                                                                                       </div>
                                                                                                                   
                                                                                                                   
                                                                                                                   
                                                                                                                                       {/* 3. DATA MENTAH (BUKTI DATABASE) */}
                                                                                                                   
                                                                                                                                       <div className="mt-8 p-4 bg-slate-100 rounded-2xl border border-slate-300">
                                                                                                                   
                                                                                                                                          <h4 className="font-bold text-slate-700 text-xs uppercase mb-2 flex items-center gap-2">
                                                                                                                   
                                                                                                                                             <Wifi size={14} className="text-blue-500"/> DATA MENTAH DARI DATABASE (DEBUG)
                                                                                                                   
                                                                                                                                          </h4>
                                                                                                                   
                                                                                                                                          <p className="text-[10px] text-slate-500 mb-2">
                                                                                                                   
                                                                                                                                             Jika di atas kosong, cek di sini. Ini adalah data asli yang diterima dari HP/Laptop siswa.
                                                                                                                   
                                                                                                                                          </p>
                                                                                                                   
                                                                                                                                          <div className="bg-slate-800 text-green-400 p-4 rounded-xl font-mono text-[10px] overflow-x-auto">
                                                                                                                   
                                                                                                                                             {JSON.stringify(activeStudent.answers, null, 2)}
                                                                                                                   
                                                                                                                                          </div>
                                                                                                                   
                                                                                                                                       </div>
                                                                                                                   
                                                                                                                   
                                                                                                                   
                                                                                                                                    </div>
                                                                                                                   
                                                                                                                                 </>
                                                                                                                   
                                                                                                                              ) : (              <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                 <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <User size={64} className="opacity-20" />
                 </div>
                 <h3 className="text-xl font-black text-slate-400">Pilih Siswa</h3>
                 <p className="text-sm font-medium">Klik nama di panel kiri untuk melihat detail.</p>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};
