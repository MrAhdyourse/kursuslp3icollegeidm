import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Clock, Calendar, ArrowRight, UserPlus, List, Loader2, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { scheduleService } from '../services/scheduleService';
import { LocationCard } from '../components/LocationCard';
import { ScorePieChart } from '../components/charts/ScorePieChart'; // Import Chart
import type { ClassGroup } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth(); // Ambil role user
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeClasses: 0,
    totalPrograms: 3
  });
  
  // Data Mock untuk Grafik
  const chartData = [
    { name: 'Sangat Baik', value: 35, color: '#10b981' },
    { name: 'Baik', value: 45, color: '#3b82f6' },
    { name: 'Cukup', value: 15, color: '#f59e0b' },
    { name: 'Perlu Perbaikan', value: 5, color: '#ef4444' },
  ];

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

      {/* 2.5 STATISTIK VISUAL SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 lg:col-span-1 flex flex-col">
          <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
            Distribusi Nilai
          </h3>
          <div className="flex-1 min-h-[300px] w-full relative">
             {/* Container Chart yang Responsif */}
             <ScorePieChart data={chartData} />
          </div>
        </div>

        <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-center items-center text-center bg-gradient-to-br from-blue-50 to-white border-blue-100">
           <div className="max-w-md">
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
               <BookOpen size={32} />
             </div>
             <h3 className="text-xl font-black text-slate-800 mb-2">Laporan Pembelajaran</h3>
             <p className="text-slate-500 mb-6">Analisis mendalam mengenai perkembangan siswa tersedia di modul laporan.</p>
             <Link to="/reports" className="btn-primary inline-flex">
               Lihat Detail Laporan <ArrowRight size={18} />
             </Link>
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
             activeClassesList.map((kelas) => {
               // Theme logic based on Level
               const themeColor = kelas.level === 1 ? 'blue' : kelas.level === 2 ? 'indigo' : 'emerald';
               const borderColor = kelas.level === 1 ? 'border-blue-100' : kelas.level === 2 ? 'border-indigo-100' : 'border-emerald-100';
               const bgColor = kelas.level === 1 ? 'bg-blue-50' : kelas.level === 2 ? 'bg-indigo-50' : 'bg-emerald-50';
               const textColor = kelas.level === 1 ? 'text-blue-600' : kelas.level === 2 ? 'text-indigo-600' : 'text-emerald-600';

               return (
                <div key={kelas.id} className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                   
                   {/* Decorative Top Gradient */}
                   <div className={`h-2 w-full bg-gradient-to-r from-${themeColor}-500 to-${themeColor}-400`}></div>

                   <div className="p-7 flex-1">
                      {/* Header: Level & Icon */}
                      <div className="flex justify-between items-start mb-5">
                        <span className={`${bgColor} ${textColor} border ${borderColor} text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm`}>
                          Level {kelas.level}
                        </span>
                        <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center ${textColor} opacity-80 group-hover:scale-110 transition-transform`}>
                           <BookOpen size={18} />
                        </div>
                      </div>

                      {/* Content: Title & Program */}
                      <div className="mb-6">
                        <h3 className="text-xl font-black text-slate-800 mb-1 leading-snug group-hover:text-blue-600 transition-colors">
                          {kelas.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                          {kelas.programId}
                        </p>
                      </div>
                      
                      {/* Schedule Pill */}
                      <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl w-full">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm text-slate-400">
                           <Clock size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-600">{kelas.schedule}</span>
                      </div>
                   </div>
                   
                   {/* Footer: Instructor & Action */}
                   <div className="px-7 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-slate-500">
                           {kelas.instructorId.substring(0,2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Instruktur</span>
                           <span className="text-xs font-bold text-slate-700">{kelas.instructorId}</span>
                        </div>
                      </div>
                      
                      <Link 
                        to={user?.role === 'INSTRUCTOR' ? `/students` : `/classmates`} 
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-md hover:scale-110 transition-all"
                      >
                        <ArrowRight size={18} />
                      </Link>
                   </div>
                </div>
              );
            })
          ) : (
               <div className="col-span-3 text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Calendar size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-700 mb-1">Tidak Ada Kelas Aktif</h3>
                 <p className="text-slate-400 text-sm">Anda belum terdaftar di kelas manapun saat ini.</p>
               </div>
          )}
        </div>
      </div>

            

                  {/* 4. CAMPUS LOCATION */}

                  <LocationCard />

        {/* DASHBOARD SPECIFIC FOOTER */}
        <footer className="mt-20 pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm font-medium">
            
            <div className="flex items-center gap-2">
              <span>&copy; {new Date().getFullYear()} LP3I College Indramayu.</span>
              <span className="hidden md:inline text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                Crafted with <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" /> by 
                <span className="bg-gradient-to-r from-blue-700 via-purple-600 to-pink-600 bg-clip-text text-transparent font-black tracking-wider hover:scale-105 transition-transform cursor-default">
                  ITDEPARTEMENTCAMPUS
                </span>
              </span>
            </div>

            <div className="flex items-center gap-5">
              {/* 1. WHATSAPP (Official Brand) */}
              <a href="https://wa.me/6283867055809" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:bg-green-50 px-3 py-1.5 rounded-full transition-all group" title="WhatsApp Kami">
                <svg viewBox="0 0 24 24" width="20" height="20" className="fill-[#25D366] group-hover:scale-110 transition-transform">
                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="hidden sm:inline font-bold text-slate-600 group-hover:text-green-600">WhatsApp</span>
              </a>
              
              {/* 2. GMAIL (Official Brand) */}
              <a href="mailto:ahdi.aghnii@gmail.com" className="flex items-center gap-2 hover:bg-red-50 px-3 py-1.5 rounded-full transition-all group" title="Kirim Email">
                <svg viewBox="0 0 24 24" width="20" height="20" className="group-hover:scale-110 transition-transform">
                  <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                </svg>
                <span className="hidden sm:inline font-bold text-slate-600 group-hover:text-red-600">Gmail</span>
              </a>

              {/* 3. INSTAGRAM (Official Brand) */}
              <a href="https://instagram.com/ahdiyourse" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:bg-pink-50 px-3 py-1.5 rounded-full transition-all group" title="Instagram">
                <svg viewBox="0 0 24 24" width="20" height="20" className="fill-slate-600 group-hover:fill-[#E4405F] group-hover:scale-110 transition-transform">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.012-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.073-4.947-.2-4.356-2.612-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <span className="hidden sm:inline font-bold text-slate-600 group-hover:text-pink-600">Instagram</span>
              </a>

              {/* 4. GITHUB (Official Brand) */}
              <a href="https://github.com/MrAhdyourse" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:bg-slate-100 px-3 py-1.5 rounded-full transition-all group" title="GitHub Profile">
                <svg viewBox="0 0 24 24" width="20" height="20" className="fill-slate-600 group-hover:fill-black group-hover:scale-110 transition-transform">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                <span className="hidden sm:inline font-bold text-slate-600 group-hover:text-black">GitHub</span>
              </a>

              {/* 5. PORTFOLIO (Web Brand) */}
              <a href="https://mrahdyourse.github.io/cv-ahdiaghni-online/" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-all group" title="Portfolio">
                <svg viewBox="0 0 24 24" width="20" height="20" className="fill-slate-600 group-hover:fill-blue-600 group-hover:scale-110 transition-transform">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-15h2v8h-2zm0 10h2v2h-2z" fillOpacity="0" />
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span className="hidden sm:inline font-bold text-slate-600 group-hover:text-blue-600">Portfolio</span>
              </a>
            </div>
          </div>
        </footer>

            

                </div>

              );

            };

export default Dashboard;
