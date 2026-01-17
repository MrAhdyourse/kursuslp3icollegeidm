import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, CheckCircle, ChevronRight, Sparkles } from 'lucide-react';
import { studentService } from '../services/studentService';
import type { Student, MeetingRecord } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const GradingModal: React.FC<GradingModalProps> = ({ isOpen, onClose, student }) => {
  const [records, setRecords] = useState<Record<number, MeetingRecord>>({});
  const [activeSession, setActiveSession] = useState<number>(1); // Default session 1
  const [curriculumTopics, setCurriculumTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    topic: '',
    attendance: 'HADIR',
    score: '', 
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchCurriculumForStudent = async () => {
    if (!student) return;
    try {
      // Cari Course ID berdasarkan Nama Program (Workaround karena kita simpan Nama, bukan ID)
      const coursesSnap = await getDocs(collection(db, "course_types"));
      const course = coursesSnap.docs.find(d => d.data().name === student.program);
      
      if (course) {
        const courseId = course.id;
        const level = (student as any).level || 1;
        const currId = `CURR_${courseId}_LVL${level}`;
        
        // Ambil Dokumen Kurikulum
        const currSnap = await getDocs(query(collection(db, "curriculums"), where("__name__", "==", currId)));
        if (!currSnap.empty) {
          const modules = currSnap.docs[0].data().modules || [];
          setCurriculumTopics(modules);
        } else {
          setCurriculumTopics([]);
        }
      }
    } catch (e) {
      console.error("Gagal ambil kurikulum", e);
    }
  };

  const loadGradeData = async () => {
    if (!student) return;
    const existingRecords = await studentService.getStudentRecords(student.id);
    const recMap: Record<number, MeetingRecord> = {};
    existingRecords.forEach((r: any) => {
      // @ts-ignore
      const meetNum = r.moduleInfo?.meetingNumber || 0;
      if (meetNum > 0) recMap[meetNum] = r;
    });
    setRecords(recMap);
  };

  // 1. Load Data Nilai & Kurikulum
  useEffect(() => {
    if (isOpen && student) {
      loadGradeData();
      fetchCurriculumForStudent();
    }
  }, [isOpen, student]);

  const handleSave = async () => {
    if (!student) return;
    
    if (!formData.topic.trim()) return alert("Materi tidak boleh kosong.");

    setLoading(true);
    await studentService.saveSessionRecord({
      studentId: student.id,
      meetingNumber: activeSession,
      topic: formData.topic,
      attendance: formData.attendance,
      score: Number(formData.score) || 0,
      notes: formData.notes
    });

    await loadGradeData(); // Refresh data lokal
    setLoading(false);
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-slate-200">
        
        {/* HEADER */}
        <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Buku Nilai Cerdas</h2>
              <p className="text-slate-500 text-sm font-medium">
                {student.name} • <span className="text-blue-600">{student.program}</span> (Lvl {(student as any).level || 1})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        {/* CONTENT (SPLIT VIEW) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR: LIST PERTEMUAN */}
          <div className="w-1/3 bg-slate-50 border-r border-slate-200 overflow-y-auto p-4 space-y-2">
            <div className="px-2 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Daftar Pertemuan
            </div>
            {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => {
              const isDone = !!records[num];
              const isActive = activeSession === num;
              
              return (
                <button
                  key={num}
                  onClick={() => setActiveSession(num)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center gap-3 border ${
                    isActive 
                      ? 'bg-white border-blue-200 shadow-lg shadow-blue-100 ring-1 ring-blue-100 scale-[1.02] z-10' 
                      : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isDone ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                      {isDone ? (records[num] as any).moduleInfo.title : `Pertemuan ${num}`}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {isDone ? `Nilai: ${records[num].grades[0].score}` : 'Belum dinilai'}
                    </p>
                  </div>
                  {isDone && <CheckCircle size={16} className="text-green-500" />}
                  {isActive && <ChevronRight size={16} className="text-blue-500" />}
                </button>
              );
            })}
          </div>

          {/* MAIN AREA: FORM INPUT */}
          <div className="flex-1 overflow-y-auto bg-white p-8">
            <div className="max-w-xl mx-auto animate-fade-in">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
                  Sesi #{activeSession}
                </div>
                <h3 className="text-lg font-bold text-slate-700">Input Data Akademik</h3>
              </div>

              <div className="space-y-6">
                
                {/* MATERI */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase flex justify-between">
                    Materi Pembelajaran
                    {curriculumTopics[activeSession - 1] && !records[activeSession] && (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <Sparkles size={12} /> Auto-suggested
                      </span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder="Contoh: Pengenalan Dasar"
                    value={formData.topic}
                    onChange={e => setFormData({...formData, topic: e.target.value})}
                  />
                  <p className="text-[10px] text-slate-400">
                    Judul materi akan otomatis muncul jika Kurikulum sudah diatur di Settings.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* ABSENSI */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Absensi</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['HADIR', 'IZIN', 'SAKIT', 'ALPHA'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFormData({...formData, attendance: status})}
                          className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                            formData.attendance === status 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* NILAI */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Nilai (0-100)</label>
                    <div className="relative">
                       <input 
                        type="number" 
                        className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-3xl text-center text-blue-600 focus:border-blue-500 outline-none transition-all shadow-inner"
                        value={formData.score}
                        onChange={e => setFormData({...formData, score: e.target.value})}
                        placeholder="0"
                        min="0" max="100"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">%</div>
                    </div>
                  </div>
                </div>

                {/* CATATAN */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Catatan Instruktur</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-600 outline-none focus:bg-white focus:border-blue-300 min-h-[100px] resize-none"
                    placeholder="Berikan catatan evaluasi untuk siswa..."
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-6 flex justify-end gap-4 border-t border-slate-100">
                  <button 
                     onClick={handleSave}
                     disabled={loading}
                     className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-200 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? "Menyimpan..." : (
                      <>
                        <Save size={20} /> SIMPAN NILAI
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};