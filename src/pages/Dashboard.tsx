import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Clock, Calendar, ArrowRight, UserPlus, List, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { scheduleService } from '../services/scheduleService';
import type { ClassGroup } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth(); // Ambil role user
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeClasses: 0,
    totalPrograms: 3
  });
  const [activeClassesList, setActiveClassesList] = useState<ClassGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Students & Programs (One-time)
    const fetchStats = async () => {
      const students = await studentService.getAllStudents();
      const courses = await studentService.getCourseTypes(); // Ambil Total Program Real
      
      setStats(prev => ({ 
        ...prev, 
        totalStudents: students.length,
        totalPrograms: courses.length // Update Angka Real
      }));
    };
    fetchStats();

    // 2. Subscribe to Schedules (Real-time)
    const unsubscribe = scheduleService.subscribeToActiveSchedules((activeSchedules) => {
      setActiveClassesList(activeSchedules);
      setStats(prev => ({ ...prev, activeClasses: activeSchedules.length }));
      setIsLoading(false);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 size={40} className="text-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* 1. WELCOME SECTION */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-dark rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
          <BookOpen size={200} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Selamat Datang, {user?.displayName}! 👋</h1>
          <p className="text-blue-100 max-w-2xl">
            {user?.role === 'INSTRUCTOR' 
              ? 'Ini adalah Pusat Kontrol Instruktur Anda. Pantau perkembangan kelas dan evaluasi hasil belajar.' 
              : 'Pantau perkembangan kursus Anda, lihat statistik nilai, dan unduh laporan capaian belajar secara mandiri.'}
          </p>
          <div className="mt-6 flex gap-3">
             {user?.role === 'INSTRUCTOR' ? (
               <>
                 <Link to="/students" className="bg-white text-brand-blue px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition flex items-center gap-2">
                    <UserPlus size={18} /> Kelola Peserta
                 </Link>
                 <Link to="/reports" className="bg-blue-700/50 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2">
                    <List size={18} /> Cek Nilai
                 </Link>
               </>
             ) : (
               <Link to="/reports" className="bg-white text-brand-blue px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition flex items-center gap-2">
                  <List size={18} /> Lihat Nilai Saya
               </Link>
             )}
          </div>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Peserta Didik</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalStudents}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Kelas Aktif</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.activeClasses}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
             <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Program</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalPrograms}</h3>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE CLASSES GRID */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="text-brand-blue" />
            Jadwal Kelas Aktif
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeClassesList.length > 0 ? (
             activeClassesList.map((kelas) => (
            <div key={kelas.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
               <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                      Level {kelas.level}
                    </span>
                    <span className="text-slate-400">
                      <BookOpen size={18} />
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-brand-blue transition-colors">
                    {kelas.name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">{kelas.programId}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    <Clock size={16} className="text-brand-red" />
                    {kelas.schedule}
                  </div>
               </div>
               <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-b-xl">
                  <span className="text-xs text-slate-500 font-medium">Instruktur: {kelas.instructorId}</span>
                  <Link to={`/students`} className="text-brand-blue hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                    Lihat <ArrowRight size={14} />
                  </Link>
               </div>
            </div>
          ))
          ) : (
             <div className="col-span-3 text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
               <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
               <p className="text-slate-500 font-medium">Belum ada kelas aktif saat ini.</p>
             </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
