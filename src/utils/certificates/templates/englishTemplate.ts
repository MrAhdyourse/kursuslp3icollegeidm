import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComprehensiveReport } from '../../../types';

export const generateEnglishCertificate = (report: ComprehensiveReport) => {
  // 1. Setup Dokumen (PORTRAIT A4) - SINGLE PAGE
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // --- BACKGROUND & BORDER ---
  doc.setDrawColor(180, 140, 50); // Gold
  doc.setLineWidth(1);
  doc.rect(10, 10, width - 20, height - 20); 
  doc.setLineWidth(0.3);
  doc.rect(11.5, 11.5, width - 23, height - 23);

  // --- HEADER ---
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(40, 40, 40);
  doc.text('CERTIFICATE', width / 2, 35, { align: 'center' });
  doc.setFontSize(20);
  doc.text('OF COMPLETION', width / 2, 43, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text('Verification No: 2026/CERT/GEN/' + report.student.id.substring(0,5), width / 2, 50, { align: 'center' });

  // --- BODY CONTENT ---
  let y = 65;
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('This is to certify that', width / 2, y, { align: 'center' });
  
  y += 12;
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(24);
  doc.setTextColor(160, 110, 20);
  doc.text(report.student.name, width / 2, y, { align: 'center' });
  
  y += 12;
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('has successfully completed the training in', width / 2, y, { align: 'center' });

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text(report.student.program || 'General Skill Training', width / 2, y, { align: 'center' });

  y += 15;

  // --- TABLE NILAI (Ringkas di halaman yang sama) ---
  const tableData = report.modules.map((m, index) => [
    index + 1,
    m.moduleInfo.title, 
    m.finalScore,
    m.finalScore >= 80 ? 'Good' : 'Satisfactory'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['No', 'Subject / Competency', 'Score', 'Grade']],
    body: tableData,
    theme: 'grid', 
    margin: { left: 25, right: 25 },
    headStyles: { fillColor: [240, 240, 240], textColor: 40, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { halign: 'center', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 }
    },
  });

  // --- FOOTER SIGNATURE ---
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text('Indramayu, 2026', 50, finalY, { align: 'center' });
  doc.text('Instructor,', 50, finalY + 5, { align: 'center' });
  doc.text('___________________', 50, finalY + 20, { align: 'center' });
  
  doc.text('Director,', width - 50, finalY + 5, { align: 'center' });
  doc.text('___________________', width - 50, finalY + 20, { align: 'center' });

  return doc;
};
