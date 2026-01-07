import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { studentService } from '../services/studentService';
import type { Student } from '../types';
import { StudentFormModal } from '../components/StudentFormModal';
import { MOCK_STUDENTS, MOCK_CLASSES } from '../utils/mockData';

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  const fetchStudents = async () => {
    setLoading(true);
    // Cek Firebase dulu
    const data = await studentService.getAllStudents();
    
    // LOGIKA HYBRID: Jika Firebase kosong, tampilkan Mock Data (untuk demo)
    if (data.length === 0) {
      setStudents(MOCK_STUDENTS);
    } else {
      setStudents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAdd = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data ${name}? Tindakan ini tidak dapat dibatalkan.`)) {
      const res = await studentService.deleteStudent(id);
      if (res.success) {
        alert("Data berhasil dihapus.");
        fetchStudents(); // Segarkan data langsung dari Firebase
      } else {
        alert(`Gagal menghapus: ${res.error}`);
      }
    }
  };

  // Helper untuk mendapatkan Nama Kelas dari ID
  const getClassName = (classId?: string) => {
    const foundClass = MOCK_CLASSES.find(c => c.id === classId);
    return foundClass ? foundClass.name : '-';
  };

  // Filter Logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm);
    const matchesClass = selectedClassFilter === 'ALL' || s.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Data Peserta</h1>
          <p className="text-slate-500 mt-2">Kelola {students.length} data peserta kursus aktif dan alumni.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          
          {/* Class Filter Dropdown */}
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <select 
               className="w-full md:w-48 pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none appearance-none bg-white"
               value={selectedClassFilter}
               onChange={e => setSelectedClassFilter(e.target.value)}
             >
               <option value="ALL">Semua Kelas</option>
               {MOCK_CLASSES.map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
               ))}
             </select>
          </div>

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau NIS..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAdd}
            className="bg-brand-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Tambah Peserta</span>
            <span className="md:hidden">Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content (Table/Grid) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Users size={48} className="mb-4 text-slate-200" />
            <p>Data tidak ditemukan.</p>
          </div>
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
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users size={20} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-500">{student.nis}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-brand-blue">{getClassName(student.classId)}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{student.program}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        student.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                        student.status === 'GRADUATED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {student.status === 'ACTIVE' ? 'Aktif' : student.status === 'GRADUATED' ? 'Lulus' : 'Keluar'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id, student.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Modal Form */}
      <StudentFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchStudents();
        }}
        studentToEdit={editingStudent}
      />
    </div>
  );
};

export default Students;