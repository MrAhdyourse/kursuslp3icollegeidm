import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, Filter, BookOpen } from 'lucide-react';
import { studentService } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import type { Student } from '../types';
import { StudentFormModal } from '../components/StudentFormModal';
import { GradingModal } from '../components/GradingModal';
import { MOCK_CLASSES } from '../utils/mockData';

const Students: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [gradingStudent, setGradingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  useEffect(() => {
    // Berlangganan data secara real-time
    const unsubscribe = studentService.subscribeToStudents((data) => {
      setStudents(data);
      setLoading(false);
    });

    // Bersihkan listener saat halaman ditutup
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
    if (confirm(`Apakah Anda yakin ingin menghapus data ${name}?`)) {
      const res = await studentService.deleteStudent(id);
      if (!res.success) {
        alert(`Gagal menghapus: ${res.error}`);
      }
    }
  };

  const getClassName = (classId?: string) => {
    const foundClass = MOCK_CLASSES.find(c => c.id === classId);
    return foundClass ? foundClass.name : '-';
  };

  // --- LOGIKA FILTERING UTAMA (SECURITY & SEARCH) ---
  const filteredStudents = students.filter(s => {
    // 1. Filter Search (Nama/NIS)
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm);
    
    // 2. Filter Dropdown Kelas
    const matchesClass = selectedClassFilter === 'ALL' || s.classId === selectedClassFilter;
    
    // 3. ROW-LEVEL SECURITY: Filter Berdasarkan Izin Instruktur
    // Jika user adalah instruktur biasa (bukan superadmin/ALL), filter programnya
    let isAuthorized = true;
    if (user?.role === 'INSTRUCTOR') {
       const allowedPrograms = user.authorizedPrograms || [];
       
       // Jika punya akses 'ALL' atau array kosong (anggap akses semua sementara/dev), lolos
       if (allowedPrograms.includes('ALL') || allowedPrograms.length === 0) {
         isAuthorized = true;
       } else {
         // DEBUG: Membantu diagnosa kenapa data tidak muncul
         console.log(`[AUTH CHECK] Student: "${s.name}" | Program: "${s.program}" | Allowed: ${JSON.stringify(allowedPrograms)}`);
         
         isAuthorized = allowedPrograms.some(prog => 
           s.program && s.program.trim().toUpperCase().includes(prog.trim().toUpperCase())
         );

         if (isAuthorized) {
           console.log(`✅ MATCH FOUND for ${s.name}`);
         } else {
           console.log(`❌ NO MATCH for ${s.name}`);
         }
       }
    }

    return matchesSearch && matchesClass && isAuthorized;
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* ... (Header Section) ... */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Data Peserta</h1>
          <p className="text-slate-500 mt-2">Kelola {students.length} peserta kursus aktif.</p>
        </div>
        {/* ... (Search & Filter Section) ... */}
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <select 
               className="w-full md:w-48 pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none appearance-none bg-white"
               value={selectedClassFilter}
               onChange={e => setSelectedClassFilter(e.target.value)}
             >
               <option value="ALL">Semua Kelas</option>
               {MOCK_CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleAdd} className="bg-brand-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md">
            <Plus size={18} /> Tambah Peserta
          </button>
        </div>
      </div>

      {/* TABLE */}
      {/* ... (Table content - remains similar but uses real-time students state) ... */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div></div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400"><Users size={48} className="mb-4 opacity-20" /><p>Belum ada data.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Peserta</th>
                  <th className="px-6 py-4">Kelas & Program</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                          {student.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover" /> : <Users size={20} className="m-2.5 text-slate-400" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{student.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-mono">{student.nis}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-brand-blue">{getClassName(student.classId)}</div>
                      <div className="text-xs text-slate-500">{student.program} (Lvl {(student as any).level || 1})</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${student.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleGrade(student)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-100" title="Buku Nilai"><BookOpen size={16} /></button>
                        <button onClick={() => handleEdit(student)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100" title="Edit"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(student.id, student.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-100" title="Hapus"><Trash2 size={16} /></button>
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
        onSuccess={() => setIsModalOpen(false)}
        studentToEdit={editingStudent}
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
