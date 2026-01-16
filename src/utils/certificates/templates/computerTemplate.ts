import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComprehensiveReport } from '../../../types';

export const generateComputerCertificate = (report: ComprehensiveReport) => {
  // 1. Setup Dokumen (Landscape A4)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // --- BACKGROUND & BORDER ---
  // Warna border elegan (Biru Tua LP3I style atau Netral)
  doc.setDrawColor(20, 50, 100); 
  doc.setLineWidth(2);
  doc.rect(10, 10, width - 20, height - 20); // Border Luar
  
  doc.setLineWidth(0.5);
  doc.rect(12, 12, width - 24, height - 24); // Border Dalam Tipis

  // --- HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(20, 50, 100);
  doc.text('SERTIFIKAT KOMPETENSI', width / 2, 40, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text('Nomor: 001/SERT/LP3I/I/2026', width / 2, 50, { align: 'center' });

  // --- BODY ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Diberikan kepada:', width / 2, 70, { align: 'center' });

  // Nama Siswa (Besar & Elegan)
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(32);
  doc.setTextColor(20, 50, 100);
  doc.text(report.student.name, width / 2, 85, { align: 'center' });

  // Garis bawah nama
  doc.setDrawColor(150);
  doc.setLineWidth(0.5);
  doc.line((width / 2) - 60, 87, (width / 2) + 60, 87);

  // Keterangan Program
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Atas kelulusannya dalam program pelatihan:', width / 2, 100, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(report.student.program || 'Program Kursus Komputer', width / 2, 110, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Predikat: ${report.summary.gradePredicate} (${report.summary.averageScore})`, width / 2, 120, { align: 'center' });

  // --- TRANSKRIP NILAI (TABEL) ---
  // Menggunakan autoTable untuk layout tabel yang otomatis rapi
  const tableData = report.modules.map((m, index) => [
    index + 1,
    m.moduleInfo.title,
    m.finalScore,
    getPredicate(m.finalScore)
  ]);

  autoTable(doc, {
    startY: 130,
    head: [['No', 'Mata Pelajaran / Kompetensi', 'Nilai Angka', 'Predikat']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [20, 50, 100], textColor: 255, halign: 'center' },
    bodyStyles: { halign: 'center' },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 }
    },
    margin: { left: 40, right: 40 }
  });

  // --- FOOTER & TTD ---
  const finalY = (doc as any).lastAutoTable.finalY + 20; // Posisi Y setelah tabel
  
  // TTD Kiri (Instruktur)
  doc.setFontSize(11);
  doc.text('Indramayu, 16 Januari 2026', 50, finalY, { align: 'center' });
  doc.text('Instruktur,', 50, finalY + 7, { align: 'center' });
  doc.text('___________________', 50, finalY + 30, { align: 'center' });
  doc.text('( Tanda Tangan )', 50, finalY + 35, { align: 'center' });

  // TTD Kanan (Direktur/Pimpinan)
  doc.text('Mengetahui,', width - 50, finalY + 7, { align: 'center' });
  doc.text('Pimpinan Lembaga', width - 50, finalY + 12, { align: 'center' });
  doc.text('___________________', width - 50, finalY + 30, { align: 'center' });
  doc.text('( Nama Pimpinan )', width - 50, finalY + 35, { align: 'center' });

  return doc;
};

// Helper Predikat
const getPredicate = (score: number): string => {
  if (score >= 90) return 'Sangat Baik';
  if (score >= 80) return 'Baik';
  if (score >= 70) return 'Cukup';
  return 'Kurang';
};
