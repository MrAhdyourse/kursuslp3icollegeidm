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
  const { modules } = report;

  // 1. Data Grafik Trend (Nilai per Pertemuan)
  // Kita urutkan berdasarkan nomor pertemuan agar grafiknya rapi
  const sortedModules = [...modules].sort((a, b) => a.moduleInfo.meetingNumber - b.moduleInfo.meetingNumber);

  const trendData = sortedModules.map(m => ({
    name: `P${m.moduleInfo.meetingNumber}`, // Label P1, P2...
    nilai: m.finalScore,
    materi: m.moduleInfo.title || '(Tanpa Judul)'
  }));

  // 2. Data Statistik (Radar) - Analisis Keseimbangan Skill
  // Karena sekarang konsepnya per pertemuan, kita bisa grouping manual atau
  // menampilkan 5 aspek terakhir. Untuk simpelnya, kita ambil rata-rata per "Blok Pertemuan" (misal P1-4, P5-8)
  
  const blocks = [
    { name: 'Basic (1-4)', start: 1, end: 4 },
    { name: 'Intermediate (5-8)', start: 5, end: 8 },
    { name: 'Advanced (9-12)', start: 9, end: 12 },
    { name: 'Final (13-16)', start: 13, end: 16 },
  ];

  const radarData = blocks.map(block => {
    const relevantModules = modules.filter(m => 
      m.moduleInfo.meetingNumber >= block.start && 
      m.moduleInfo.meetingNumber <= block.end
    );
    
    const avg = relevantModules.length > 0
      ? relevantModules.reduce((sum, m) => sum + m.finalScore, 0) / relevantModules.length
      : 0;

    return {
      subject: block.name,
      A: Math.round(avg),
      fullMark: 100
    };
  });

  // Hitung ulang rata-rata total realtime
  const totalScore = modules.reduce((acc, curr) => acc + curr.finalScore, 0);
  const averageScore = modules.length > 0 ? totalScore / modules.length : 0;
  
  // Hitung Kehadiran Realtime
  const presentCount = modules.filter(m => m.record?.attendance === 'HADIR').length;
  const attendancePercentage = modules.length > 0 ? (presentCount / modules.length) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-8 bg-brand-red rounded-full block"></span>
          Analisis Statistik Performa
        </h3>
        <span className="text-sm text-slate-500">Data Real-time</span>
      </div>

      {/* GRAFIK 1: TREND NILAI PER PERTEMUAN */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Grafik Perkembangan (Per Pertemuan)</h4>
        <div className="h-[300px] w-full">
          {trendData.length > 0 ? (
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
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 italic">Belum ada data nilai yang diinput.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GRAFIK 2: RADAR KOMPETENSI (Per Blok Level) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
           <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 w-full text-left">Peta Kompetensi (Per Level)</h4>
           <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
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

        {/* GRAFIK 3: RINGKASAN DATA */}
        <div className="space-y-4">
           <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-500 font-medium">Rata-rata Kumulatif</p>
                <h3 className="text-4xl font-bold text-slate-800 mt-1">{averageScore.toFixed(1)}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                {averageScore >= 90 ? 'A' : averageScore >= 80 ? 'B' : averageScore >= 70 ? 'C' : 'D'}
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-end mb-2">
                <p className="text-sm text-slate-500 font-medium">Kehadiran ({presentCount}/{modules.length})</p>
                <span className="text-2xl font-bold text-slate-800">{Math.round(attendancePercentage)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div 
                  className="bg-brand-dark h-2.5 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${attendancePercentage}%` }}
                ></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};