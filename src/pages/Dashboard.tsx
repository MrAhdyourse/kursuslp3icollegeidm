import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Clock, Calendar, ArrowRight, UserPlus, List, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { scheduleService } from '../services/scheduleService';
import { LocationCard } from '../components/LocationCard';
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
    // 1. Fetch Stats
    const fetchStats = async () => {
      const students = await studentService.getAllStudents();
      const courses = await studentService.getCourseTypes(); 
      setStats(prev => ({ ...prev, totalStudents: students.length, totalPrograms: courses.length }));
    };
    fetchStats();

    // 2. Real-time Schedules
    const unsubscribe = scheduleService.subscribeToActiveSchedules((activeSchedules) => {
      setActiveClassesList(activeSchedules);
      setStats(prev => ({ ...prev, activeClasses: activeSchedules.length }));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]); 

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
        <div className="glass-panel glass-panel-hover p-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-white border border-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Users size={26} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Peserta</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.totalStudents}</h3>
          </div>
        </div>
        
        <div className="glass-panel glass-panel-hover p-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-white border border-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
            <BookOpen size={26} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Kelas Aktif</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.activeClasses}</h3>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-white border border-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
             <Calendar size={26} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Program</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.totalPrograms}</h3>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE CLASSES GRID */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-600 rounded-full block"></span>
            Jadwal Kelas Aktif
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeClassesList.length > 0 ? (
             activeClassesList.map((kelas) => (
            <div key={kelas.id} className="glass-panel glass-panel-hover group relative overflow-hidden">
               <div className="p-6 relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Level {kelas.level}
                    </span>
                    <span className="text-slate-300 group-hover:text-blue-500 transition-colors">
                      <BookOpen size={20} />
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight group-hover:text-blue-700 transition-colors">
                    {kelas.name}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mb-6">{kelas.programId}</p>
                  
                  <div className="flex items-center gap-3 text-sm text-slate-600 bg-white/50 border border-white/50 p-3 rounded-xl backdrop-blur-sm">
                    <Clock size={18} className="text-red-500" />
                    <span className="font-bold">{kelas.schedule}</span>
                  </div>
               </div>
               
               <div className="px-6 py-4 border-t border-white/50 flex justify-between items-center bg-white/30 backdrop-blur-md">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                    Instruktur: <span className="text-slate-800">{kelas.instructorId}</span>
                  </span>
                  <Link 
                    to={user?.role === 'INSTRUCTOR' ? `/students` : `/classmates`} 
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm hover:scale-110 transition-transform"
                  >
                    <ArrowRight size={16} />
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

            

                  {/* 4. CAMPUS LOCATION */}

                  <LocationCard />

            

                </div>

              );

            };

export default Dashboard;
