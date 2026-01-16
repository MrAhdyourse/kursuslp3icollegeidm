import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComprehensiveReport } from '../../../types';

export const generateEnglishCertificate = (report: ComprehensiveReport) => {
  // 1. Setup Dokumen (Landscape A4)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // --- BACKGROUND & BORDER KHUSUS ENGLISH (Gaya Klasik) ---
  doc.setDrawColor(200, 150, 50); // Warna Emas/Gold
  doc.setLineWidth(3);
  doc.rect(10, 10, width - 20, height - 20); 
  
  // Ornamen Sudut (Simpel)
  doc.setDrawColor(200, 150, 50);
  doc.line(10, 10, 30, 30);
  doc.line(width - 10, 10, width - 30, 30);
  doc.line(10, height - 10, 30, height - 30);
  doc.line(width - 10, height - 10, width - 30, height - 30);

  // --- HEADER ---
  doc.setFont('times', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(50, 50, 50); // Abu Gelap
  doc.text('CERTIFICATE OF COMPLETION', width / 2, 45, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Number: 001/ENG/LP3I/I/2026', width / 2, 55, { align: 'center' });

  // --- BODY ---
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('This is to certify that:', width / 2, 75, { align: 'center' });

  // Nama Siswa
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(32);
  doc.setTextColor(180, 120, 20); // Gold Text
  doc.text(report.student.name, width / 2, 90, { align: 'center' });

  // Garis bawah nama
  doc.setDrawColor(180, 120, 20);
  doc.setLineWidth(0.5);
  doc.line((width / 2) - 60, 92, (width / 2) + 60, 92);

  // Keterangan Program
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Has successfully completed the training program in:', width / 2, 105, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(report.student.program || 'English Communication Program', width / 2, 115, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Final Grade: ${report.summary.gradePredicate} (${report.summary.averageScore})`, width / 2, 125, { align: 'center' });

  // --- TRANSKRIP NILAI (TABEL INGGRIS) ---
  const tableData = report.modules.map((m, index) => [
    index + 1,
    m.moduleInfo.title, // Asumsi judul modul sudah Inggris, atau bisa ditranslate manual disini jika perlu
    m.finalScore,
    getEnglishPredicate(m.finalScore)
  ]);

  autoTable(doc, {
    startY: 135,
    head: [['No', 'Subject / Competency', 'Score', 'Grade']],
    body: tableData,
    theme: 'plain', // Tema plain lebih klasik
    headStyles: { 
      fillColor: [255, 255, 255], 
      textColor: 0, 
      fontStyle: 'bold', 
      lineWidth: 0.1, 
      lineColor: 0,
      halign: 'center' 
    },
    bodyStyles: { 
      halign: 'center',
      lineWidth: 0.1,
      lineColor: 200 
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 }
    },
    margin: { left: 40, right: 40 }
  });

  // --- FOOTER & SIGNATURE ---
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  // TTD Kiri (Instructor)
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.text('Indramayu, January 16, 2026', 50, finalY, { align: 'center' });
  doc.text('English Instructor,', 50, finalY + 7, { align: 'center' });
  doc.text('___________________', 50, finalY + 30, { align: 'center' });
  
  // TTD Kanan (Director)
  doc.text('Acknowledged by,', width - 50, finalY + 7, { align: 'center' });
  doc.text('Director', width - 50, finalY + 12, { align: 'center' });
  doc.text('___________________', width - 50, finalY + 30, { align: 'center' });

  return doc;
};

// Helper Predikat Inggris
const getEnglishPredicate = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Satisfactory';
  return 'Fair'; // Atau 'Poor'
};
