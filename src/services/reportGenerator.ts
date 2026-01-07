import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ComprehensiveReport, InstitutionConfig } from '../types';
import logoImg from '../assets/images/logo.png'; 

const DEFAULT_CONFIG: InstitutionConfig = {
  name: "LP3I COLLEGE INDRAMAYU",
  address: "Jl. Pahlawan No.9, Lemahmekar, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45212",
  logoUrl: "",
  headOfInstitution: "H. Fulan bin Fulan, M.Kom",
  instructorName: "Ahdi Yourse",
};

export const generateStudentPDF = (report: ComprehensiveReport, config: InstitutionConfig = DEFAULT_CONFIG) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // --- 1. BACKGROUND BORDER IMAGE (METODE AMAN & OTOMATIS) ---
  // import.meta.env.BASE_URL akan otomatis menyesuaikan:
  // - Localhost: "/" -> "/border.png"
  // - GitHub: "/nama-repo/" -> "/nama-repo/border.png"
  try {
    const baseUrl = import.meta.env.BASE_URL;
    // Hapus slash di awal 'border.png' karena BASE_URL biasanya sudah punya slash di akhir
    const borderPath = `${baseUrl}border.png`; 
    
    doc.addImage(borderPath, 'PNG', 0, 0, width, height);
  } catch (e) {
    // Jika file tidak ada, dia akan lewat ke sini tanpa error biru
    console.warn("File /public/border.png belum tersedia.");
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.rect(5, 5, width - 10, height - 10);
  }

  // --- 2. HEADER & LOGO ---
  let cursorY = 35;
  const imgWidth = 35;
  const imgHeight = 13; 
  const xPos = (width - imgWidth) / 2;
  
  try {
    doc.addImage(logoImg, 'PNG', xPos, cursorY, imgWidth, imgHeight);
    cursorY += imgHeight + 8;
  } catch (e) {
    cursorY += 20;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(60, 60, 60); 
  doc.text(config.name.toUpperCase(), width / 2, cursorY, { align: 'center' });
  
  cursorY += 6;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(config.address, width / 2, cursorY, { align: 'center' });

  // --- 3. JUDUL BESAR ---
  cursorY += 20;
  doc.setFont('times', 'bold');
  doc.setFontSize(28); 
  doc.setTextColor(0, 84, 166); 
  doc.text("SERTIFIKAT APRESIASI", width / 2, cursorY, { align: 'center' });

  cursorY += 8;
  doc.setFontSize(11);
  doc.setTextColor(150, 150, 150);
  doc.setFont('times', 'italic');
  doc.text(`Nomor: APR/${new Date().getFullYear()}/${report.student.nis}`, width / 2, cursorY, { align: 'center' });

  // --- 4. ISI SERTIFIKAT ---
  cursorY += 20;
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text("Diberikan sebagai penghargaan atas dedikasi dan kompetensi kepada:", width / 2, cursorY, { align: 'center' });

  cursorY += 15;
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(26);
  doc.setTextColor(0, 0, 0); 
  doc.text(report.student.name, width / 2, cursorY, { align: 'center' });

  cursorY += 8;
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.text(`NIS: ${report.student.nis}`, width / 2, cursorY, { align: 'center' });

  cursorY += 15;
  doc.text("Telah menyelesaikan pembelajaran kursus:", width / 2, cursorY, { align: 'center' });
  
  cursorY += 10;
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 84, 166);
  
  const level = (report.student as any).level || 1;
  const levelRoman = level === 1 ? 'TINGKAT I' : level === 2 ? 'TINGKAT II' : level === 3 ? 'TINGKAT III' : '';
  const programTitle = `${report.student.program.toUpperCase()} ${levelRoman}`;
  
  doc.text(programTitle, width / 2, cursorY, { align: 'center' });

  // --- 5. LOGIKA GROUPING ---
  const groupedModules: Record<string, { total: number, count: number, name: string }> = {};

  report.modules.forEach(m => {
    const key = m.moduleInfo.category || "UMUM";
    let displayName: string = key;
    if (key === 'WORD') displayName = "Microsoft Office Word";
    else if (key === 'EXCEL') displayName = "Microsoft Office Excel";
    else if (key === 'POWERPOINT') displayName = "Microsoft PowerPoint";
    else if (key === 'OTHER' || key === 'UMUM') displayName = "Unit Kompetensi Praktikum"; 

    if (!groupedModules[key]) {
      groupedModules[key] = { total: 0, count: 0, name: displayName };
    }
    groupedModules[key].total += m.finalScore;
    groupedModules[key].count += 1;
  });

  const tableData = Object.values(groupedModules).map((grp, index) => {
    const avgScore = grp.total / grp.count;
    const letter = getGradeLetter(avgScore);
    return [index + 1, grp.name, getPredicateLabel(letter), letter];
  });

  // --- 6. TABEL MODERN (Clean Lines, Black Borders, Symmetrical) ---
  cursorY += 15;
  
  autoTable(doc, {
    startY: cursorY,
    head: [['No', 'Unit Kompetensi', 'Kualifikasi', 'Grade']],
    body: tableData,
    theme: 'grid', // Pakai Grid agar bergaris penuh
    margin: { left: 35, right: 35 },
    tableLineColor: [0, 0, 0], // Garis Tabel Luar HITAM
    tableLineWidth: 0.1,
    headStyles: {
      fillColor: [255, 255, 255], 
      textColor: [0, 0, 0], // Header Teks Hitam
      fontStyle: 'bold',
      font: 'times', // Font Times
      lineWidth: 0.1, // Garis Header Hitam
      lineColor: [0, 0, 0],
      halign: 'center' // Rata Tengah Presisi
    },
    bodyStyles: {
      font: 'times',
      textColor: [0, 0, 0], // Body Teks Hitam
      lineColor: [0, 0, 0], // Garis Body Hitam
      lineWidth: 0.1,
      cellPadding: 3,
      valign: 'middle',
      halign: 'center' // Semua isi RATA TENGAH (Symmetrical)
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto' }, 
      2: { cellWidth: 50 },
      3: { cellWidth: 20, fontStyle: 'bold' } 
    },
    didDrawPage: (data) => {
      if (data.cursor) cursorY = data.cursor.y;
    }
  });

  // --- 6. FOOTER ---
  let finalY = (doc as any).lastAutoTable.finalY + 20;
  
  if (finalY > height - 60) {
    doc.addPage();
    finalY = 40;
  }

  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Indramayu, ${dateStr}`, width / 2, finalY, { align: 'center' });
  doc.text("Instruktur Pengampu,", width / 2, finalY + 6, { align: 'center' });

  finalY += 35;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(config.instructorName, width / 2, finalY, { align: 'center' });
  
  // Garis bawah nama (HITAM)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line((width/2) - 25, finalY + 2, (width/2) + 25, finalY + 2);

  // Simpan
  doc.save(`Sertifikat_${report.student.name.replace(/\s+/g, '_')}.pdf`);
};

// Helper
function getGradeLetter(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

function getPredicateLabel(grade: string): string {
  switch (grade) {
    case 'A': return "Sangat Kompeten"; 
    case 'B': return "Kompeten";
    case 'C': return "Cukup Kompeten";
    case 'D': return "Belum Kompeten";
    default: return "Gagal";
  }
}

export const generateStudentExcel = (report: ComprehensiveReport) => {
  const data = report.modules.map(m => ({
    "Materi": m.moduleInfo.title,
    "Nilai": m.finalScore,
    "Predikat": getGradeLetter(m.finalScore)
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Nilai");
  XLSX.writeFile(workbook, `Nilai_${report.student.name}.xlsx`);
};