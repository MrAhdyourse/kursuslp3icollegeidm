import React, { useEffect, useState } from 'react';
import { Users, Search, GraduationCap, SearchCode, Folder, ArrowLeft, ChevronRight, UserPlus } from 'lucide-react';
import { studentService } from '../services/studentService';
import { scheduleService } from '../services/scheduleService';
import type { ClassGroup } from '../types';

const Classmates: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  useEffect(() => {
    const unsubStudents = studentService.subscribeToPublicStudents((data) => {
      setStudents(data);
      setLoading(false);
    });

    const unsubClasses = scheduleService.subscribeToActiveSchedules((data) => {
      setClasses(data);
    });

    return () => {
      unsubStudents();
      unsubClasses();
    };
  }, []);

  // Filter siswa berdasarkan pencarian
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.program.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentsInClass = (classId: string | null) => {
    return filteredStudents.filter(s => s.classId === classId);
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Menyiapkan Direktori Rekan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* HEADER & SEARCH */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          {selectedClassId && (
            <button 
              onClick={() => setSelectedClassId(null)}
              className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all text-slate-600"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              {!selectedClassId ? <Users className="text-blue-600" size={32} /> : <Folder className="text-blue-600" size={32} />}
              {selectedClassId ? selectedClass?.name : "Direktori Rekan Kursus"}
            </h1>
            <p className="text-slate-500 mt-1">
              {selectedClassId 
                ? `Menampilkan ${getStudentsInClass(selectedClassId).length} rekan di kelas ini.` 
                : "Pilih folder kelas untuk melihat daftar rekan belajar."}
            </p>
          </div>
        </div>
        
        {!selectedClassId && (
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari nama rekan..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* VIEW 1: FOLDER GRID (Main View) */}
      {!selectedClassId ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((cls) => {
            const count = students.filter(s => s.classId === cls.id).length;
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className="group relative bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-2 transition-all duration-500 text-left overflow-hidden"
              >
                {/* Folder Icon Decor */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <Folder className="absolute top-8 right-8 text-blue-100 group-hover:text-blue-200 transition-colors" size={64} />

                <div className="relative z-10">
                  <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-6 group-hover:rotate-6 transition-transform">
                    <Users size={28} />
                  </div>
                  
                  <h2 className="text-xl font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                    {cls.name}
                  </h2>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                      {cls.instructorId}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {cls.schedule}
                    </span>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex -space-x-3">
                       {/* Mini Avatar Previews */}
                       {getStudentsInClass(cls.id).slice(0, 3).map((s, i) => (
                         <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                            {s.avatarUrl ? <img src={s.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-400">?</div>}
                         </div>
                       ))}
                       {count > 3 && (
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">
                           +{count - 3}
                         </div>
                       )}
                    </div>
                    <span className="text-sm font-black text-blue-600 flex items-center gap-1 group-hover:translate-x-2 transition-transform">
                      Buka <ChevronRight size={16} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Folder Khusus: Belum Masuk Kelas */}
          {students.filter(s => !s.classId).length > 0 && (
            <button
              onClick={() => setSelectedClassId('UNASSIGNED')}
              className="group bg-slate-50 p-8 rounded-[3rem] border border-dashed border-slate-300 hover:bg-white hover:border-slate-400 transition-all duration-500 text-left"
            >
              <div className="w-14 h-14 bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center mb-6">
                <UserPlus size={28} />
              </div>
              <h2 className="text-xl font-black text-slate-500 mb-2 uppercase tracking-tight">Belum Ada Kelas</h2>
              <p className="text-xs text-slate-400 font-medium">Siswa yang belum diklasifikasikan ke dalam jadwal.</p>
              <div className="mt-8 flex justify-between items-center text-slate-400">
                <span className="text-sm font-bold">{getStudentsInClass(null).length} Siswa</span>
                <ChevronRight size={16} />
              </div>
            </button>
          )}
        </div>
      ) : (
        /* VIEW 2: STUDENT LIST (Detailed View) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
          {getStudentsInClass(selectedClassId === 'UNASSIGNED' ? null : selectedClassId).map((student) => (
            <div key={student.id} className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-100 transition-all duration-500 relative overflow-hidden text-center">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-3xl bg-slate-100 overflow-hidden mb-4 border-4 border-white shadow-md transform group-hover:rotate-3 transition-transform">
                  {student.avatarUrl ? (
                    <img src={student.avatarUrl} className="w-full h-full object-cover" alt={student.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-400">
                      <Users size={40} />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{student.name}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1 justify-center">
                  <GraduationCap size={14} /> Angkatan {student.batch}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 w-full">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 px-3 py-1 rounded-full">
                    {student.program}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECURITY NOTICE */}
      <div className="bg-slate-900 text-white p-6 rounded-[2rem] flex items-center gap-4 shadow-xl">
        <SearchCode className="text-blue-400 shrink-0" size={24} />
        <p className="text-xs text-slate-300 leading-relaxed">
          <b>Sistem Keamanan Privasi:</b> Untuk melindungi privasi rekan belajar, detail kontak dan riwayat nilai bersifat rahasia dan hanya dapat diakses oleh Instruktur serta pemilik akun yang bersangkutan.
        </p>
      </div>

    </div>
  );
};

export default Classmates;