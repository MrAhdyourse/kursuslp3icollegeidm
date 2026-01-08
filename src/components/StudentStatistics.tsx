import React, { useState } from 'react';
import { 
  BarChart2, Activity, PieChart as PieIcon, Hexagon, Layers, 
  Target, Circle, Filter, Layout 
} from 'lucide-react';
import type { ComprehensiveReport } from '../types';

// Import Modular Charts
import { TrendAreaChart } from './charts/TrendAreaChart';
import { PerformanceBarChart } from './charts/PerformanceBarChart';
import { ProgressLineChart } from './charts/ProgressLineChart';
import { CompetencyRadarChart } from './charts/CompetencyRadarChart';
import { ScorePieChart } from './charts/ScorePieChart';

// (Placeholder untuk chart lain yang belum dibuat file-nya, bisa pakai generic Recharts di sini atau dibuatkan file nanti)
// Untuk efisiensi, saya akan render sisa chart langsung di sini atau reuse komponen yang ada.

import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line, ScatterChart, Scatter, RadialBarChart, RadialBar, FunnelChart, Funnel, LabelList, Treemap } from 'recharts';

interface StudentStatisticsProps {
  report: ComprehensiveReport;
}

type ChartType = 'AREA' | 'BAR' | 'LINE' | 'COMPOSED' | 'SCATTER' | 'RADAR_BIG' | 'PIE' | 'RADIAL' | 'FUNNEL' | 'TREEMAP';

export const StudentStatistics: React.FC<StudentStatisticsProps> = ({ report }) => {
  const { modules } = report;
  const [chartType, setChartType] = useState<ChartType>('AREA');

  // --- DATA PREPARATION ---
  const sortedModules = [...modules].sort((a, b) => a.moduleInfo.meetingNumber - b.moduleInfo.meetingNumber);

  const trendData = sortedModules.map(m => ({
    name: `P${m.moduleInfo.meetingNumber}`,
    nilai: m.finalScore,
    target: 85,
    materi: m.moduleInfo.title || '(Tanpa Judul)',
    amt: m.finalScore,
  }));

  const pieData = [
    { name: 'Sangat Baik (>85)', value: modules.filter(m => m.finalScore >= 85).length, color: '#0056b3' },
    { name: 'Baik (75-84)', value: modules.filter(m => m.finalScore >= 75 && m.finalScore < 85).length, color: '#00a8e8' },
    { name: 'Cukup (<75)', value: modules.filter(m => m.finalScore < 75).length, color: '#d62828' },
  ].filter(d => d.value > 0);

  const blocks = [
    { name: 'Basic (1-4)', start: 1, end: 4 },
    { name: 'Interm (5-8)', start: 5, end: 8 },
    { name: 'Adv (9-12)', start: 9, end: 12 },
    { name: 'Final (13+)', start: 13, end: 16 },
  ];
  const radarData = blocks.map(block => {
    const relevant = modules.filter(m => m.moduleInfo.meetingNumber >= block.start && m.moduleInfo.meetingNumber <= block.end);
    const avg = relevant.length > 0 ? relevant.reduce((sum, m) => sum + m.finalScore, 0) / relevant.length : 0;
    return { subject: block.name, A: Math.round(avg), fullMark: 100 };
  });

  const treemapData = sortedModules.map(m => ({
    name: `P${m.moduleInfo.meetingNumber}`,
    size: m.finalScore,
    fill: m.finalScore >= 85 ? '#0056b3' : m.finalScore >= 75 ? '#00a8e8' : '#d62828'
  }));

  // Stats
  const totalScore = modules.reduce((acc, curr) => acc + curr.finalScore, 0);
  const averageScore = modules.length > 0 ? totalScore / modules.length : 0;
  const presentCount = modules.filter(m => m.record?.attendance === 'HADIR').length;
  const attendancePercentage = modules.length > 0 ? (presentCount / modules.length) * 100 : 0;

  // --- CHART RENDERER (Modular Switch) ---
  const renderChart = () => {
    if (trendData.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 italic">Belum ada data nilai.</div>;

    switch (chartType) {
      case 'AREA': return <TrendAreaChart data={trendData} />;
      case 'BAR': return <PerformanceBarChart data={trendData} />;
      case 'LINE': return <ProgressLineChart data={trendData} />;
      case 'RADAR_BIG': return <CompetencyRadarChart data={radarData} />;
      case 'PIE': return <ScorePieChart data={pieData} />;
      
      // Inline Renderers for Less Common Charts (To save file count, or create files later if needed)
      case 'COMPOSED':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData}>
              <CartesianGrid stroke="#f5f5f5" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="nilai" barSize={20} fill="#413ea0" radius={[4,4,0,0]} />
              <Line type="monotone" dataKey="nilai" stroke="#ff7300" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'SCATTER':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid />
              <XAxis dataKey="name" name="Pertemuan" />
              <YAxis dataKey="nilai" name="Nilai" domain={[0, 100]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Nilai" data={trendData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'RADIAL':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={trendData}>
              <RadialBar label={{ position: 'insideStart', fill: '#fff' }} background dataKey="nilai" />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        );
      case 'FUNNEL':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip />
              <Funnel data={trendData} dataKey="nilai">
                <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );
      case 'TREEMAP':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap data={treemapData} dataKey="size" aspectRatio={4/3} stroke="#fff" fill="#8884d8" />
          </ResponsiveContainer>
        );
      default: return <TrendAreaChart data={trendData} />;
    }
  };

  const ChartButton = ({ type, icon: Icon, label }: { type: ChartType; icon: any; label: string }) => (
    <button
      onClick={() => setChartType(type)}
      className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${
        chartType === type 
          ? 'bg-brand-blue text-white shadow-md scale-105' 
          : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
      }`}
      title={label}
    >
      <Icon size={16} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-8 bg-brand-red rounded-full block"></span>
            Analisis Statistik Performa
          </h3>
          <p className="text-xs text-slate-400 mt-1 ml-4">Visualisasi Data Real-time</p>
        </div>
        
        {/* CHART SWITCHER ARSENAL */}
        <div className="flex flex-wrap gap-2">
          <ChartButton type="AREA" icon={Activity} label="Area" />
          <ChartButton type="BAR" icon={BarChart2} label="Bar" />
          <ChartButton type="LINE" icon={Activity} label="Line" />
          <ChartButton type="COMPOSED" icon={Layers} label="Combo" />
          <ChartButton type="SCATTER" icon={Circle} label="Scatter" />
          <ChartButton type="RADAR_BIG" icon={Hexagon} label="Radar" />
          <ChartButton type="PIE" icon={PieIcon} label="Pie" />
          <ChartButton type="RADIAL" icon={Target} label="Radial" />
          <ChartButton type="FUNNEL" icon={Filter} label="Funnel" />
          <ChartButton type="TREEMAP" icon={Layout} label="Tree" />
        </div>
      </div>

      {/* GRAFIK UTAMA (SWAPPABLE) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex justify-between items-center">
          Grafik Perkembangan ({chartType})
          <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-400">Auto-Update</span>
        </h4>
        <div className="h-[400px] w-full bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-2">
          {renderChart()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RADAR KOMPETENSI (TETAP ADA SEBAGAI STANDAR) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
           <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 w-full text-left">Peta Kompetensi (Per Level)</h4>
           <div className="h-[250px] w-full">
             <CompetencyRadarChart data={radarData} />
           </div>
        </div>

        {/* RINGKASAN DATA */}
        <div className="space-y-4">
           <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between transition-all hover:scale-[1.02]">
              <div>
                <p className="text-sm text-blue-500 font-medium">Rata-rata Kumulatif</p>
                <h3 className="text-4xl font-bold text-slate-800 mt-1">{averageScore.toFixed(1)}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shadow-inner">
                {averageScore >= 90 ? 'A' : averageScore >= 80 ? 'B' : averageScore >= 70 ? 'C' : 'D'}
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:scale-[1.02]">
              <div className="flex justify-between items-end mb-2">
                <p className="text-sm text-slate-500 font-medium">Kehadiran ({presentCount}/{modules.length})</p>
                <span className="text-2xl font-bold text-slate-800">{Math.round(attendancePercentage)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-brand-dark h-2.5 rounded-full transition-all duration-1000 ease-out animate-pulse" 
                  style={{ width: `${attendancePercentage}%` }}
                ></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
