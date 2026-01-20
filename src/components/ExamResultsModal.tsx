import React, { useEffect, useState } from 'react';
import { X, Award, CheckCircle, XCircle, FileText, Download } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { StudentExamSession } from '../types/exam';
import { studentService } from '../services/studentService';

interface ExamResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string; // ID Ujian yang mau dilihat
  classId: string; // Filter per kelas
}

export const ExamResultsModal: React.FC<ExamResultsModalProps> = ({ isOpen, onClose, examId, classId }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchResults();
    }
  }, [isOpen, examId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // 1. AMBIL SESI UJIAN (Dual Source: LocalStorage + Firestore)
      
      // A. LocalStorage (Prioritas Dev Lokal)
      const localSessionsRaw = localStorage.getItem('exam_sessions');
      let sessions: StudentExamSession[] = localSessionsRaw ? JSON.parse(localSessionsRaw) : [];

      // B. Firestore (Jika production/sudah connect)
      try {
        const q = query(collection(db, "exam_sessions"), where("examId", "==", examId));
        const snap = await getDocs(q);
        const firestoreSessions = snap.docs.map(d => d.data() as StudentExamSession);
        // Merge (hindari duplikat id)
        sessions = [...sessions, ...firestoreSessions.filter(fs => !sessions.some(ls => ls.id === fs.id))];
      } catch (e) {
        console.log("Firestore offline/empty, using local data only.");
      }

      // 2. Ambil Data Siswa
      // Mock Students jika service kosong (untuk demo)
      let students = await studentService.getAllStudents();
      if (students.length === 0) {
         // Fallback Mock Students for Demo
         students = [
           { id: 'ST-001', name: 'Budi Santoso', nis: '2024001', classId: classId } as any,
           { id: 'ST-002', name: 'Siti Aminah', nis: '2024002', classId: classId } as any
         ];
      }
      
      const classStudents = students.filter(s => s.classId === classId || !s.classId); // Tampilkan semua jika classId null (demo)

      // 3. Gabungkan Data
      const combined = classStudents.map(student => {
        // Cari sesi milik siswa ini
        const session = sessions.find(s => s.studentId === student.id);
        
        // Cari File Essay (Value jawaban yg berupa string URL)
        let essayFiles: string[] = [];
        if (session && session.answers) {
           Object.values(session.answers).forEach(val => {
              if (typeof val === 'string' && val.startsWith('http')) {
                 essayFiles.push(val);
              }
           });
        }

        return {
          studentName: student.name,
          nis: student.nis,
          status: session ? session.status : 'BELUM MULAI',
          score: session?.finalScore || 0,
          essayFiles: essayFiles,
          lastUpdate: session?.endTime
        };
      });

      setResults(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <Award size={20} className="text-orange-500" /> Rekap Hasil Ujian
            </h3>
            <p className="text-xs text-slate-500 mt-1">Data real-time dari sesi ujian siswa.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="p-0 overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 border-b">Peserta Didik</th>
                <th className="p-4 border-b text-center">Status</th>
                <th className="p-4 border-b text-center">Nilai PG</th>
                <th className="p-4 border-b text-center">File Praktik</th>
                <th className="p-4 border-b text-center">Keterangan</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">Mengambil data nilai...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">Belum ada siswa di kelas ini.</td></tr>
              ) : (
                results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{r.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.nis}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                        r.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-700' :
                        r.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {r.status === 'SUBMITTED' ? 'Selesai' : r.status === 'IN_PROGRESS' ? 'Sedang Ujian' : 'Belum Mulai'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {r.status === 'SUBMITTED' ? (
                         <span className="font-mono font-black text-lg text-slate-700">{r.score}</span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="p-4 text-center">
                      {r.essayFiles.length > 0 ? (
                        <div className="flex flex-col gap-1 items-center">
                          {r.essayFiles.map((url: string, fIdx: number) => {
                            const isBase64 = url.startsWith('data:');
                            return (
                              <a 
                                key={fIdx} 
                                href={url} 
                                download={isBase64 ? `Tugas_Siswa_${r.studentName}_${fIdx+1}` : undefined}
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 border border-blue-100 transition"
                              >
                                <FileText size={12} /> {isBase64 ? `Unduh File #${fIdx+1}` : `Link Drive #${fIdx+1}`}
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Tidak ada file</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {r.status === 'SUBMITTED' ? (
                        r.score >= 75 ? 
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
                          <CheckCircle size={14}/> LULUS
                        </div> :
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">
                          <XCircle size={14}/> REMEDIAL
                        </div>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
           <button onClick={() => alert("Fitur Export Excel akan segera aktif!")} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition">
              <Download size={16} /> Export ke Excel
           </button>
        </div>

      </div>
    </div>
  );
};
