import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, Filter, BookOpen, RefreshCw } from 'lucide-react';
import { studentService } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import type { Student } from '../types';
import { StudentFormModal } from '../components/StudentFormModal';
import { GradingModal } from '../components/GradingModal';
import { MOCK_CLASSES } from '../utils/mockData';
import toast from 'react-hot-toast';

const Students: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [gradingStudent, setGradingStudent] = useState<Student | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  const handleRefresh = () => {
    setLoading(true);
    studentService.getAllStudents().then(data => {
      setStudents(data);
      setLoading(false);
      toast.success("Data disinkronkan dari server");
    });
  };

  useEffect(() => {
    // Berlangganan data secara real-time
    const unsubscribe = studentService.subscribeToStudents((data) => {
      // Filter Sisi Client (Opsional: Jika ingin strict hanya menampilkan data milik sendiri)
      // Tapi untuk sekarang kita tampilkan semua agar data baru tidak hilang.
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
    // Reset filter agar item baru terlihat
    setSearchTerm('');
    setSelectedClassFilter('ALL');
    
    if (newStudentId) {
      toast.success("Siswa baru berhasil ditambahkan!", { duration: 4000 });
      // Opsional: Scroll ke item atau highlight (bisa dikembangkan nanti)
    } else {
      toast.success("Perubahan berhasil disimpan!");
    }
  };

  const getClassName = (classId?: string) => {
    const foundClass = MOCK_CLASSES.find(c => c.id === classId);
    return foundClass ? foundClass.name : '-';
  };

  // --- LOGIKA FILTERING (SEARCH & KELAS) ---
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.nis.includes(searchTerm) ||
                          (s.program || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClassFilter === 'ALL' || s.classId === selectedClassFilter;
    
    return matchesSearch && matchesClass;
  });

  return (
    <div className="animate-fade-in space-y-8">
      {/* ... (Header Section) ... */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Data Peserta</h1>
          <p className="text-slate-500 font-medium mt-2">
            Kelola {students.length} peserta terdaftar.
          </p>
        </div>
        {/* ... (Search & Filter Section) ... */}
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <select 
               className="glass-input w-full md:w-56 pl-12"
               value={selectedClassFilter}
               onChange={e => setSelectedClassFilter(e.target.value)}
             >
               <option value="ALL">Semua Kelas</option>
               {MOCK_CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau NIS..." 
              className="glass-input w-full pl-12"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleRefresh} className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-blue-600 hover:border-blue-200 transition-colors" title="Refresh Manual">
            <RefreshCw size={20} />
          </button>
          <button onClick={handleAdd} className="btn-primary px-6 py-3 flex items-center gap-2 text-sm">
            <Plus size={18} /> Tambah
          </button>
        </div>
      </div>

      {/* TABLE (PLATINUM GLASS DESIGN) */}
      <div className="glass-table-container">
        {loading ? (
          <div className="flex items-center justify-center h-80"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400"><Users size={64} className="mb-4 opacity-20" /><p className="font-medium">Belum ada data siswa yang cocok.</p></div>
        ) : (
          <div className="overflow-x-auto">
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
      </div>

      {/* MODALS */}
      <StudentFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleModalSuccess} 
        studentToEdit={editingStudent}
        currentUser={user}
      />
      <GradingModal 
        isOpen={isGradingOpen} 
        onClose={() => setIsGradingOpen(false)} 
        student={gradingStudent} 
      />
    </div>
  );
};

export default Students;
