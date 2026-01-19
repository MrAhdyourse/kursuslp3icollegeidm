import React, { useEffect, useState } from 'react';
import { X, Award, CheckCircle, XCircle } from 'lucide-react';
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
    if (isOpen && examId) {
      fetchResults();
    }
  }, [isOpen, examId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // 1. Ambil Sesi Ujian (yang examId cocok)
      // Note: Idealnya query filter by classId juga, tapi struktur exam_session kita belum nyimpen classId.
      // Jadi kita filter manual nanti.
      const q = query(collection(db, "exam_sessions"), where("examId", "==", examId));
      const snap = await getDocs(q);
      
      const sessions = snap.docs.map(d => d.data() as StudentExamSession);

      // 2. Ambil Data Siswa di Kelas Ini
      const students = await studentService.getAllStudents(); // Ambil semua dulu (cache)
      const classStudents = students.filter(s => s.classId === classId);

      // 3. Gabungkan Data (Join)
      const combined = classStudents.map(student => {
        const session = sessions.find(s => s.studentId === student.id);
        return {
          studentName: student.name,
          nis: student.nis,
          status: session ? session.status : 'BELUM MULAI',
          score: session?.finalScore || 0,
          startTime: session?.startTime,
          endTime: session?.endTime
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
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            <Award size={20} className="text-orange-500" /> Rekap Hasil Ujian
          </h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="p-0 overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold sticky top-0">
              <tr>
                <th className="p-4 border-b">Nama Siswa</th>
                <th className="p-4 border-b text-center">Status</th>
                <th className="p-4 border-b text-center">Nilai Akhir</th>
                <th className="p-4 border-b text-center">Keterangan</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Memuat data...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Belum ada data siswa.</td></tr>
              ) : (
                results.map((r, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{r.studentName}</div>
                      <div className="text-[10px] text-slate-400">{r.nis}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        r.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' :
                        r.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {r.status === 'SUBMITTED' ? 'SELESAI' : r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-lg">
                      {r.status === 'SUBMITTED' ? r.score : '-'}
                    </td>
                    <td className="p-4 text-center">
                      {r.status === 'SUBMITTED' ? (
                        r.score >= 75 ? 
                        <span className="flex items-center justify-center gap-1 text-green-600 font-bold text-xs"><CheckCircle size={14}/> LULUS</span> :
                        <span className="flex items-center justify-center gap-1 text-red-500 font-bold text-xs"><XCircle size={14}/> REMEDIAL</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
