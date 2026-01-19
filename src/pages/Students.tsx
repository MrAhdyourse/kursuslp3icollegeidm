import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, Filter, BookOpen, ShieldAlert } from 'lucide-react';
import { Navigate } from 'react-router-dom'; // Import Navigate
import { studentService } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import type { Student } from '../types';
import { StudentFormModal } from '../components/StudentFormModal';
import { GradingModal } from '../components/GradingModal';
import { MOCK_CLASSES } from '../utils/mockData';
import toast from 'react-hot-toast';

const Students: React.FC = () => {
  const { user } = useAuth();

  // --- SECURITY GATEKEEPER ---
  // Jika bukan instruktur, tendang keluar.
  if (user?.role !== 'INSTRUCTOR') {
    return <Navigate to="/" replace />;
  }

  const isMobile = useIsMobile(); // Deteksi Mobile
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [gradingStudent, setGradingStudent] = useState<Student | null>(null);
  const [showSafetyWarning, setShowSafetyWarning] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  useEffect(() => {
    const unsubscribe = studentService.subscribeToStudents((data) => {
      setStudents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleGrade = (student: Student) => {
    setGradingStudent(student);
    setIsGradingOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus data siswa ${name}?`)) {
      toast.promise(studentService.deleteStudent(id), {
        loading: 'Menghapus...',
        success: 'Data terhapus',
        error: 'Gagal menghapus'
      });
    }
  };

  const handleModalSuccess = (newStudentId?: string) => {
    setIsModalOpen(false);
    setSearchTerm('');
    setSelectedClassFilter('ALL');
    if (newStudentId) toast.success("Siswa baru berhasil ditambahkan!", { duration: 4000 });
    else toast.success("Perubahan berhasil disimpan!");
  };

  const getClassName = (classId?: string) => {
    const foundClass = MOCK_CLASSES.find(c => c.id === classId);
    return foundClass ? foundClass.name : '-';
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.nis.includes(searchTerm) ||
                          (s.program || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassFilter === 'ALL' || s.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="animate-fade-in space-y-6 relative pb-20 md:pb-0">
      
      {/* --- SAFETY WARNING MODAL --- */}
      {showSafetyWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-300 border border-amber-100">
            <div className="bg-amber-50 p-6 flex flex-col items-center text-center border-b border-amber-100">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 shadow-inner ring-4 ring-white">
                <ShieldAlert size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800">PERHATIAN: AKSES ADMIN</h2>
              <p className="text-amber-700 font-bold text-sm mt-1">Mode Pengelolaan Data Lintas Program</p>
            </div>
            <div className="p-8 space-y-4 text-slate-600 leading-relaxed">
              <p>Halaman ini memberikan Anda akses penuh untuk <strong className="text-slate-800">Menambah, Mengubah, dan Menghapus</strong> data peserta.</p>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="text-xs text-red-600">Pastikan Anda <strong>hanya mengedit data kelas yang Anda ampu</strong>.</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowSafetyWarning(false)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95">SAYA MENGERTI</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Data Peserta</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">Kelola {students.length} peserta terdaftar.</p>
        </div>
        
        {/* Mobile Action Bar */}
        <div className="flex flex-col gap-3 w-full md:w-auto">
           <div className="flex gap-2">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <button onClick={handleAdd} className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 flex items-center gap-2">
               <Plus size={16} /> <span className="hidden xs:inline">Baru</span>
             </button>
           </div>
           
           {/* Class Filter Dropdown */}
           <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <select 
               className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none appearance-none"
               value={selectedClassFilter}
               onChange={e => setSelectedClassFilter(e.target.value)}
             >
               <option value="ALL">Semua Kelas</option>
               {MOCK_CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
           </div>
        </div>
      </div>

      {/* CONTENT: SMART SWITCH (MOBILE CARDS vs DESKTOP TABLE) */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-blue" size={32} /></div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Users size={48} className="mb-3 opacity-20" />
          <p className="font-medium text-sm">Tidak ada data ditemukan.</p>
        </div>
      ) : isMobile ? (
        // --- MOBILE CARD VIEW ---
        <div className="grid grid-cols-1 gap-4">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
               {/* Card Header: Avatar & Info */}
               <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {student.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover" /> : <Users size={20} className="m-3.5 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-base truncate">{student.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{student.nis}</p>
                    <div className="flex flex-wrap gap-1.5">
                       <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold">
                         {getClassName(student.classId)}
                       </span>
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${student.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                         {student.status}
                       </span>
                    </div>
                  </div>
               </div>
               
               {/* Card Actions (Full Width Buttons) */}
               <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => handleGrade(student)} className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition">
                    <BookOpen size={16} />
                    <span className="text-[10px] font-bold">Nilai</span>
                  </button>
                  <button onClick={() => handleEdit(student)} className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
                    <Edit size={16} />
                    <span className="text-[10px] font-bold">Edit</span>
                  </button>
                  <button onClick={() => handleDelete(student.id, student.name)} className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                    <Trash2 size={16} />
                    <span className="text-[10px] font-bold">Hapus</span>
                  </button>
               </div>
            </div>
          ))}
        </div>
      ) : (
        // --- DESKTOP TABLE VIEW ---
        <div className="glass-table-container">
            <table className="glass-table w-full">
              <thead>
                <tr>
                  <th className="pl-8 text-left">Peserta Didik</th>
                  <th className="text-left">Kelas & Program</th>
                  <th className="text-center">Status</th>
                  <th className="text-center pr-8">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="group transition-all duration-200">
                    <td className="pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 overflow-hidden shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                          {student.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover" /> : <Users size={24} className="m-3 text-slate-300" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-base">{student.name}</div>
                          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{student.nis}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-blue-700">{getClassName(student.classId)}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{student.program} (Lvl {(student as any).level || 1})</div>
                    </td>
                    <td className="text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${student.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="text-center pr-8">
                      <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleGrade(student)} className="w-9 h-9 rounded-xl bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 hover:scale-110 transition-all shadow-sm flex items-center justify-center" title="Buku Nilai"><BookOpen size={16} /></button>
                        <button onClick={() => handleEdit(student)} className="w-9 h-9 rounded-xl bg-white border border-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-200 hover:scale-110 transition-all shadow-sm flex items-center justify-center" title="Edit"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(student.id, student.name)} className="w-9 h-9 rounded-xl bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 hover:scale-110 transition-all shadow-sm flex items-center justify-center" title="Hapus"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}

      {/* MODALS */}
      <StudentFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleModalSuccess} studentToEdit={editingStudent} currentUser={user} />
      <GradingModal isOpen={isGradingOpen} onClose={() => setIsGradingOpen(false)} student={gradingStudent} />
    </div>
  );
};

// Loader2 shim (since it wasn't imported before but used in my code)
const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default Students;
