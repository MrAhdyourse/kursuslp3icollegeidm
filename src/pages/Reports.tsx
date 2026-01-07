import React, { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Search, UserCheck, Award, Calendar, ChevronDown } from 'lucide-react';
import { studentService } from '../services/studentService';
import { generateStudentPDF, generateStudentExcel } from '../services/reportGenerator';
import { StudentStatistics } from '../components/StudentStatistics';
import { MOCK_REPORT, MOCK_STUDENTS } from '../utils/mockData';
import type { Student, ComprehensiveReport } from '../types';

const Reports: React.FC = () => {
  const { user } = useAuth(); // Ambil user yang sedang login
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [reportData, setReportData] = useState<ComprehensiveReport | null>(null);

  // 1. Load Data
  useEffect(() => {
    const loadData = async () => {
      if (user?.role === 'STUDENT') {
        // JIKA SISWA: Langsung set reportData pake data sendiri
        // Ambil dari MOCK_REPORT tapi timpa datanya sesuai profil user login
        setReportData({
          ...MOCK_REPORT,
          student: {
            ...MOCK_STUDENTS[0], // Ambil template
            id: user.uid,
            name: user.displayName,
            email: user.email,
            avatarUrl: user.photoURL,
            nis: 'TERDAFTAR', // NIS bisa diambil dari profil jika sudah ada fieldnya
          }
        });
      } else {
        // JIKA INSTRUKTUR: Load semua siswa untuk dipilih
        const data = await studentService.getAllStudents();
        setStudents(data.length > 0 ? data : MOCK_STUDENTS);
      }
    };
    loadData();
  }, [user]);

  // ... (handleStudentSelect tetap sama)

  return (
    <div className="animate-fade-in space-y-6">
      {/* HEADER & FILTER SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {user?.role === 'STUDENT' ? 'Nilai Capaian Saya' : 'Cek Nilai Siswa'}
            </h1>
            <p className="text-slate-500 mt-1">
              {user?.role === 'STUDENT' 
                ? 'Berikut adalah rekapitulasi nilai dan laporan akademik Anda.' 
                : 'Pilih siswa untuk melihat transkrip nilai detail, statistik, dan unduh laporan.'}
            </p>
          </div>
        </div>

        {/* SEARCH BAR (Hanya muncul untuk Instruktur) */}
        {user?.role === 'INSTRUCTOR' && (
          <div className="relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <select
              className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm shadow-sm appearance-none cursor-pointer transition-all hover:border-brand-blue"
              value={selectedStudentId}
              onChange={handleStudentSelect}
            >
              <option value="">-- Pilih Siswa untuk Melihat Laporan --</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} — {student.program}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        )}
      </div>

      {/* EMPTY STATE */}
      {!reportData && (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 animate-fade-in">
          <Search size={64} className="mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-600">Belum ada siswa dipilih</h3>
          <p className="text-sm">Silakan pilih nama siswa di atas untuk menampilkan data.</p>
        </div>
      )}

      {/* REPORT CONTENT (Hanya muncul jika siswa dipilih) */}
      {reportData && (
        <div className="animate-fade-in-up space-y-8">
          
          {/* 1. STUDENT PROFILE & SUMMARY */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-blue to-brand-dark p-6 text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-2xl font-bold">
                    {reportData.student.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{reportData.student.name}</h2>
                    <p className="text-blue-100 text-sm mt-1">{reportData.student.nis} • {reportData.student.program}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Award size={16} /> Predikat: {reportData.summary.gradePredicate}
                  </span>
                  <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Calendar size={16} /> {reportData.summary.totalMeetings} Pertemuan
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
              <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <UserCheck className="text-brand-blue" />
                Laporan Capaian Belajar
              </h3>
              <div className="flex gap-3">
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-5 py-2 rounded-lg shadow-sm transition-all active:scale-95 text-sm font-medium"
                >
                  <FileText size={16} />
                  Download PDF
                </button>
                <button 
                  onClick={handleDownloadExcel}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg shadow-sm transition-all active:scale-95 text-sm font-medium"
                >
                  <FileSpreadsheet size={16} />
                  Download Excel
                </button>
              </div>
            </div>

            {/* 2. TABLE NILAI */}
            <div className="p-6">
               <div className="overflow-x-auto border border-slate-100 rounded-lg">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Pertemuan</th>
                      <th className="px-6 py-3">Materi</th>
                      <th className="px-6 py-3 text-center">Kehadiran</th>
                      <th className="px-6 py-3 text-center">Nilai</th>
                      <th className="px-6 py-3">Catatan Instruktur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.modules.map((mod) => (
                      <tr key={mod.moduleInfo.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-brand-blue">
                          #{mod.moduleInfo.meetingNumber}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {mod.moduleInfo.title}
                          <span className="block text-xs text-slate-400 font-normal mt-0.5">{mod.moduleInfo.category}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {mod.record?.attendance}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">
                          {mod.finalScore}
                        </td>
                        <td className="px-6 py-4 italic text-slate-500">
                          "{mod.record?.instructorNotes}"
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3. STATISTICS COMPONENT */}
          <StudentStatistics report={reportData} />
          
        </div>
      )}
    </div>
  );
};

export default Reports;