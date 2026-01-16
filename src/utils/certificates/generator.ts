import jsPDF from 'jspdf';
import type { ComprehensiveReport } from '../../types';
import { generateComputerCertificate } from './templates/computerTemplate';
import { generateEnglishCertificate } from './templates/englishTemplate';

export type CertificateType = 'COMPUTER' | 'ENGLISH' | 'GENERAL';

export const generateCertificate = (report: ComprehensiveReport, type: CertificateType = 'GENERAL') => {
  // Router Cerdas:
  // COMPUTER = Template Khusus "Ahdi Yourse"
  // ENGLISH / GENERAL = Template Universal (Bahasa Inggris & Kursus Tambahan)
  switch (type) {
    case 'COMPUTER':
      return generateComputerCertificate(report);
    case 'ENGLISH':
    case 'GENERAL':
    default:
      // Kursus Bahasa Inggris & Tambahan Lainnya menggunakan template yang sama
      return generateEnglishCertificate(report);
  }
};

// Fungsi helper untuk download PDF
export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};
