import jsPDF from 'jspdf';
import type { ComprehensiveReport } from '../../types';
import { generateComputerCertificate } from './templates/computerTemplate';
import { generateEnglishCertificate } from './templates/englishTemplate';

export type CertificateType = 'COMPUTER' | 'ENGLISH' | 'GENERAL';

export const generateCertificate = async (report: ComprehensiveReport, type: CertificateType = 'GENERAL'): Promise<jsPDF> => {
  // Router Cerdas:
  // Jika nama program adalah 'KELAS MS OFFICE I' atau mengandung 'Office', gunakan template COMPUTER (Landscape)
  const programName = report.student.program.toUpperCase();
  const isSpecialClass = programName.includes('MS OFFICE') || programName.includes('OFFICE');

  if (isSpecialClass || type === 'COMPUTER') {
    // Ini sekarang mengembalikan Promise<jsPDF>
    return await generateComputerCertificate(report);
  }

  // Selain itu, gunakan template Portrait 1 Halaman
  // Walaupun englishTemplate masih sinkron, kita wrap dalam Promise agar konsisten
  return Promise.resolve(generateEnglishCertificate(report));
};

// Fungsi helper untuk download PDF
export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};