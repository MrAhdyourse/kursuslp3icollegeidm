import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import type { ComprehensiveReport } from '../types';

interface StudentStatisticsProps {
  report: ComprehensiveReport;
}

export const StudentStatistics: React.FC<StudentStatisticsProps> = ({ report }) => {
  const { summary, modules } = report;

  // 1. Persiapan Data Grafik Trend (Line/Area)
  const trendData = modules.map(m => ({
    name: `P${m.moduleInfo.meetingNumber}`, // Label P1, P2
    nilai: m.finalScore,
    materi: m.moduleInfo.title
  }));

  // 2. Persiapan Data Radar (Skill per Kategori)
  // Menghitung rata-rata per kategori (WORD, EXCEL, PPT)
  const categoryScores: Record<string, { total: number; count: number }> = {};
  
  modules.forEach(m => {
    const cat = m.moduleInfo.category;
    if (!categoryScores[cat]) categoryScores[cat] = { total: 0, count: 0 };
    categoryScores[cat].total += m.finalScore;
    categoryScores[cat].count += 1;
  });

  const radarData = Object.keys(categoryScores).map(cat => ({
    subject: cat,
    A: Math.round(categoryScores[cat].total / categoryScores[cat].count),
    fullMark: 100
  }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-8 bg-brand-red rounded-full block"></span>
          Analisis Statistik Performa
        </h3>
        <span className="text-sm text-slate-500">Data Real-time</span>
      </div>

      {/* SECTION 1: GRAFIK TREND NILAI (Utama) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Grafik Perkembangan Nilai</h4>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorNilai" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0056b3" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0056b3" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#0056b3', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="nilai" 
                stroke="#0056b3" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorNilai)" 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 2: RADAR SKILL (Kompetensi) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
           <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 w-full text-left">Peta Kompetensi Siswa</h4>
           <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Siswa"
                  dataKey="A"
                  stroke="#d62828"
                  strokeWidth={2}
                  fill="#d62828"
                  fillOpacity={0.4}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* SECTION 3: RINGKASAN STATISTIK (Angka) */}
        <div className="space-y-4">
           {/* Card 1: Rata-rata */}
           <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-500 font-medium">Rata-rata Nilai</p>
                <h3 className="text-4xl font-bold text-slate-800 mt-1">{summary.averageScore.toFixed(1)}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                {summary.gradePredicate}
              </div>
           </div>

           {/* Card 2: Kehadiran */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-end mb-2">
                <p className="text-sm text-slate-500 font-medium">Tingkat Kehadiran</p>
                <span className="text-2xl font-bold text-slate-800">{summary.attendancePercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div 
                  className="bg-brand-dark h-2.5 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${summary.attendancePercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Hadir {summary.totalMeetings} dari {summary.totalMeetings} pertemuan terjadwal
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
