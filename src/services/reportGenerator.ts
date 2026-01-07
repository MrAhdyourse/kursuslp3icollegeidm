import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ComprehensiveReport, InstitutionConfig } from '../types';

// Default Config jika tidak ada input kustom
const DEFAULT_CONFIG: InstitutionConfig = {
  name: "LP3I COLLEGE INDRAMAYU",
  address: "Jalan Jend. Sudirman No. 123, Indramayu, Jawa Barat",
  logoUrl: "", // Bisa diisi base64 string logo
  headOfInstitution: "Nama Kepala Cabang",
  instructorName: "Ahdi Yourse",
};

/**
 * GENERATE PDF REPORT
 * Membuat file PDF vektor yang solid dengan layout surat resmi.
 */
export const generateStudentPDF = (report: ComprehensiveReport, config: InstitutionConfig = DEFAULT_CONFIG) => {
  const doc = new jsPDF();
  
  // 1. KOP SURAT (HEADER) ==========================================
  // Background Header Gradient (Simulasi visual solid)
  doc.setFillColor(0, 86, 179); // Brand Blue
  doc.rect(0, 0, 210, 5, 'F'); // Top accent bar
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(config.name, 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(config.address, 105, 26, { align: 'center' });
  
  // Garis pemisah kop
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 32, 195, 32);

  // 2. INFO SISWA (METADATA) =======================================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 50, 100);
  doc.text("LAPORAN CAPAIAN BELAJAR", 105, 45, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  // Kolom Kiri
  const startY = 55;
  const col1 = 15;
  const col2 = 50;
  
  doc.text("Nama Peserta", col1, startY);
  doc.text(`: ${report.student.name}`, col2, startY);
  
  doc.text("Nomor Induk", col1, startY + 6);
  doc.text(`: ${report.student.nis}`, col2, startY + 6);
  
  doc.text("Program", col1, startY + 12);
  doc.text(`: ${report.student.program}`, col2, startY + 12);

  // Kolom Kanan (Summary Singkat)
  const col3 = 120;
  const col4 = 155;
  
  doc.text("Total Pertemuan", col3, startY);
  doc.text(`: ${report.summary.totalMeetings}`, col4, startY);
  
  doc.text("Rata-rata Nilai", col3, startY + 6);
  doc.text(`: ${report.summary.averageScore.toFixed(2)}`, col4, startY + 6);
  
  doc.text("Predikat Akhir", col3, startY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69); // Red accent for grade
  doc.text(`: ${report.summary.gradePredicate}`, col4, startY + 12);

  // 3. TABEL DATA NILAI (CORE CONTENT) =============================
  const tableData = report.modules.map((m, index) => [
    index + 1,
    m.moduleInfo.title,
    m.moduleInfo.meetingNumber,
    m.record ? new Date(m.record.date).toLocaleDateString('id-ID') : '-',
    m.record?.attendance || '-',
    m.finalScore > 0 ? m.finalScore.toFixed(1) : '-',
    m.record?.instructorNotes || '-' // Catatan masuk tabel agar rapi
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['No', 'Materi Pembelajaran', 'Pertemuan', 'Tanggal', 'Hadir', 'Nilai', 'Catatan']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 86, 179], // Brand Blue
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
      6: { cellWidth: 'auto' }
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    }
  });

  // 4. FOOTER & TANDA TANGAN =======================================
  // Ambil posisi Y terakhir dari tabel
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  // Tanggal Cetak
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Indramayu, ${today}`, 150, finalY, { align: 'center' });

  // Label TTD
  doc.text("Instruktur,", 150, finalY + 6, { align: 'center' });
  doc.text("Mengetahui,", 40, finalY + 6, { align: 'center' });
  doc.text("Pimpinan,", 40, finalY + 11, { align: 'center' });

  // Space TTD
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${config.instructorName} )`, 150, finalY + 40, { align: 'center' });
  doc.text(`( ${config.headOfInstitution} )`, 40, finalY + 40, { align: 'center' });

  // Simpan File
  doc.save(`Laporan_${report.student.name.replace(/\s+/g, '_')}.pdf`);
};

/**
 * GENERATE EXCEL REPORT
 * Membuat file spreadsheet yang rapi dan terstruktur data (XLSX).
 */
export const generateStudentExcel = (report: ComprehensiveReport) => {
  // 1. Persiapan Data Sheet
  const data = report.modules.map(m => ({
    "Materi": m.moduleInfo.title,
    "Kategori": m.moduleInfo.category,
    "Pertemuan Ke": m.moduleInfo.meetingNumber,
    "Tanggal": m.record ? new Date(m.record.date).toLocaleDateString('id-ID') : '-',
    "Kehadiran": m.record?.attendance || '-',
    "Nilai Akhir": m.finalScore,
    "Catatan": m.record?.instructorNotes || ''
  }));

  // 2. Buat Worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 3. Atur Lebar Kolom (Agar 'Solid' saat dibuka)
  const colWidths = [
    { wch: 30 }, // Materi
    { wch: 15 }, // Kategori
    { wch: 12 }, // Pertemuan
    { wch: 15 }, // Tanggal
    { wch: 10 }, // Kehadiran
    { wch: 10 }, // Nilai
    { wch: 40 }, // Catatan
  ];
  worksheet['!cols'] = colWidths;

  // 4. Buat Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Nilai");

  // 5. Download File
  XLSX.writeFile(workbook, `Data_Nilai_${report.student.name.replace(/\s+/g, '_')}.xlsx`);
};
