import React, { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Search, UserCheck, Award, Calendar, ChevronDown, Loader2, Lock } from 'lucide-react';
import { studentService } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import { generateStudentPDF, generateStudentExcel } from '../services/reportGenerator';
import { StudentStatistics } from '../components/StudentStatistics';
import type { Student, ComprehensiveReport } from '../types';

const Reports: React.FC = () => {
  const { user } = useAuth(); 
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [reportData, setReportData] = useState<ComprehensiveReport | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Load Initial Data
  useEffect(() => {
    const init = async () => {
      if (user?.role === 'STUDENT') {
        setLoading(true);
        let targetStudentId = user.uid; // Default: Coba pakai UID login

        // LOGIKA AUTO-DETECT (Pencocokan Email)
        if (user.email) {
          const matchedStudent = await studentService.getStudentByEmail(user.email);
          if (matchedStudent) {
            console.log("Auto-Detect: Data siswa ditemukan via email!", matchedStudent.name);
            targetStudentId = matchedStudent.id; 
          }
        }

        const data = await studentService.getComprehensiveReport(targetStudentId);
        setReportData(data);
        setLoading(false);
      } else if (user?.role === 'INSTRUCTOR') {
        const data = await studentService.getAllStudents();
        setStudents(data);
      }
    };
    init();
  }, [user]);

  // 2. Handle Pemilihan Siswa (Hanya untuk Instruktur)
  const handleStudentSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = e.target.value;
    setSelectedStudentId(studentId);

    if (studentId) {
      setLoading(true);
      const data = await studentService.getComprehensiveReport(studentId);
      setReportData(data);
      setLoading(false);
    } else {
      setReportData(null);
    }
  };

  const handleDownloadPDF = () => {
    if (reportData) {
      const instructorName = (reportData as any).classInstructorName 
        || (user?.role === 'INSTRUCTOR' ? user.displayName : "Ahdi Yourse");

      generateStudentPDF(reportData, {
        name: "LP3I COLLEGE INDRAMAYU",
        address: "Jl. Pahlawan No.9, Lemahmekar, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45212",
        logoUrl: "",
        headOfInstitution: "H. Fulan bin Fulan, M.Kom",
        instructorName: instructorName
      });
    }
  };

  const handleDownloadExcel = () => {
    if (reportData) generateStudentExcel(reportData);
  };

  // LOGIKA KUNCI TOMBOL (Hanya Lulus yang bisa download)
  const isGraduated = reportData?.student.status === 'GRADUATED';
  const canDownload = isGraduated || user?.role === 'INSTRUCTOR'; // Instruktur selalu bisa download

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

      {/* LOADING STATE */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={40} className="text-brand-blue animate-spin" />
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !reportData && (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 animate-fade-in">
          <Search size={64} className="mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-600">
            {user?.role === 'STUDENT' ? 'Belum ada data nilai.' : 'Belum ada siswa dipilih'}
          </h3>
          <p className="text-sm">
            {user?.role === 'STUDENT' 
              ? 'Data akademik Anda belum tersedia di sistem.' 
              : 'Silakan pilih nama siswa untuk menampilkan data.'}
          </p>
        </div>
      )}

      {/* REPORT CONTENT */}
      {!loading && reportData && (
        <div className="animate-fade-in-up space-y-8">
          
          {/* BANNER PERINGATAN (JIKA BELUM LULUS) */}
          {!canDownload && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm animate-pulse-slow">
              <Lock className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-amber-800 flex items-center gap-2">
                  Dokumen Terkunci
                  <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full uppercase">Status: {reportData.student.status}</span>
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Mohon maaf, Anda belum dapat mengunduh Sertifikat Kompetensi. Dokumen hanya tersedia bagi peserta didik yang telah menyelesaikan seluruh program dan dinyatakan <b>LULUS (GRADUATED)</b>.
                </p>
              </div>
            </div>
          )}

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

            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
              <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <UserCheck className="text-brand-blue" />
                Laporan Capaian Belajar
              </h3>
              
              {/* TOMBOL DOWNLOAD (DENGAN LOGIKA KUNCI) */}
              <div className="flex gap-3">
                {/* PDF BUTTON */}
                <button 
                  onClick={canDownload ? handleDownloadPDF : undefined}
                  disabled={!canDownload}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg shadow-sm transition-all text-sm font-medium ${
                    canDownload 
                      ? 'bg-brand-red hover:bg-red-700 text-white active:scale-95 shadow-red-200' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-70'
                  }`}
                  title={!canDownload ? "Menunggu status LULUS" : "Download Sertifikat"}
                >
                  {!canDownload ? <Lock size={16} /> : <FileText size={16} />}
                  Download Sertifikat
                </button>

                {/* EXCEL BUTTON */}
                <button 
                  onClick={canDownload ? handleDownloadExcel : undefined}
                  disabled={!canDownload}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg shadow-sm transition-all text-sm font-medium ${
                    canDownload 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 shadow-emerald-200' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-70'
                  }`}
                  title={!canDownload ? "Menunggu status LULUS" : "Download Transkrip"}
                >
                  {!canDownload ? <Lock size={16} /> : <FileSpreadsheet size={16} />}
                  Download Transkrip
                </button>
              </div>
            </div>

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
                    {reportData.modules.length > 0 ? (
                      reportData.modules.map((mod) => (
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
                    ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                           Belum ada data pertemuan yang dinilai.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <StudentStatistics report={reportData} />
          
        </div>
      )}
    </div>
  );
};

export default Reports;