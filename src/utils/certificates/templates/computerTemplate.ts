import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComprehensiveReport } from '../../../types';
// Import Logo (Sesuaikan path relatif ke src/assets/images/logo.png)
import logoImg from '../../../assets/images/logo.png';

// Helper: Load Gambar Async dengan Cache Buster
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image();
    // Tambahkan cache buster untuk memastikan gambar terbaru dimuat
    const cacheBuster = `?t=${new Date().getTime()}`;
    img.src = url.includes('?') ? `${url}&cache=${new Date().getTime()}` : `${url}${cacheBuster}`;
    img.crossOrigin = "Anonymous"; 
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`Gagal memuat gambar: ${url}`);
      resolve(null as any);
    };
  });
};

export const generateComputerCertificate = async (report: ComprehensiveReport): Promise<jsPDF> => {
  // 1. Setup Dokumen (LANDSCAPE A4) - Standar Sertifikat Profesional
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Ambil Base URL untuk Vite compatibility
  const baseUrl = import.meta.env.BASE_URL || '/';
  const safeBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  try {
    // --- LOAD ASSETS PARALEL ---
    const [borderImage, ttdImage, logoImageObj] = await Promise.all([
      loadImage(`${safeBase}border.png`),     // Border dari public
      loadImage(`${safeBase}ttdsaya.png`),    // TTD dari public
      loadImage(logoImg)                      // Logo dari assets
    ]);

    // --- 1. BACKGROUND BORDER ---
    // Border dipasang di awal agar menjadi layer paling bawah
    if (borderImage) {
      doc.addImage(borderImage, 'PNG', 0, 0, width, height);
    } else {
      // Fallback border jika gambar gagal dimuat
      doc.setDrawColor(0, 84, 166);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, width - 20, height - 20);
      doc.setLineWidth(0.5);
      doc.rect(12, 12, width - 24, height - 24);
    }

    // --- 2. HEADER SECTION ---
    let cursorY = 22;
    
    // Logo Lembaga (Tengah)
    if (logoImageObj) {
      const imgWidth = 45;
      const imgHeight = 16;
      const xPos = (width - imgWidth) / 2;
      doc.addImage(logoImageObj, 'PNG', xPos, cursorY, imgWidth, imgHeight);
      cursorY += imgHeight + 6;
    }

    // Nama Lembaga
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("LP3I COLLEGE INDRAMAYU", width / 2, cursorY, { align: 'center' });
    
    cursorY += 5;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Jl. Pahlawan No.9, Lemahmekar, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45212", width / 2, cursorY, { align: 'center' });

    // --- 3. JUDUL SERTIFIKAT ---
    cursorY += 15; // Dikurangi dari 18
    doc.setFont('times', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(0, 84, 166); // Biru Khas LP3I
    doc.text("SERTIFIKAT KOMPETENSI", width / 2, cursorY, { align: 'center' });

    cursorY += 7; // Dikurangi dari 8
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.setFont('times', 'italic');
    const dateNow = new Date();
    const monthRom = dateNow.getMonth() + 1;
    doc.text(`Nomor: ${report.student.id.substring(0,4)}/KOMP/LP3I/${monthRom}/${dateNow.getFullYear()}`, width / 2, cursorY, { align: 'center' });

    // --- 4. IDENTITAS PENERIMA ---
    cursorY += 12; // Dikurangi dari 15
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    doc.setFont('times', 'normal');
    doc.text("Diberikan kepada:", width / 2, cursorY, { align: 'center' });

    cursorY += 12; // Dikurangi dari 14
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(30); // Diubah dari 36 agar tidak melebihi judul (32)
    doc.setTextColor(0, 0, 0);
    doc.text(report.student.name.toUpperCase(), width / 2, cursorY, { align: 'center' });

    cursorY += 7; // Dikurangi dari 8
    doc.setFont('times', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    doc.text(`NIS: ${report.student.nis || '-'}`, width / 2, cursorY, { align: 'center' });

    // --- 5. DETAIL PROGRAM ---
    cursorY += 10; // Dikurangi dari 12
    doc.text("Telah menyelesaikan program pelatihan komputer:", width / 2, cursorY, { align: 'center' });

    cursorY += 8; // Dikurangi dari 10
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(0, 84, 166);
    doc.text(report.student.program.toUpperCase() || 'MICROSOFT OFFICE PROFESSIONAL', width / 2, cursorY, { align: 'center' });

    // --- 6. TABEL NILAI (AutoTable) - Ringkasan Kompetensi ---
    const avgScore = Math.round(report.summary.averageScore);
    const tableData = [[
      1,
      report.student.program.toUpperCase() || 'MICROSOFT OFFICE PROFESSIONAL',
      avgScore,
      getGradeLetter(avgScore)
    ]];

    cursorY += 8; // Dikurangi dari 10
    autoTable(doc, {
      startY: cursorY,
      head: [['No', 'Unit Kompetensi / Materi Pelatihan', 'Nilai', 'Grade']],
      body: tableData,
      theme: 'grid',
      margin: { left: 55, right: 55 },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        font: 'times',
        halign: 'center',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      bodyStyles: {
        font: 'times',
        textColor: [0, 0, 0],
        halign: 'center',
        cellPadding: 6, // Padding lebih besar agar baris tunggal terlihat elegan
        fontSize: 11
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 }
      }
    });

    // --- 7. FOOTER & TANDA TANGAN ---
    let finalY = (doc as any).lastAutoTable.finalY + 8; // Dikurangi dari 12
    
    // Pastikan footer tidak keluar halaman
    if (finalY > height - 45) finalY = height - 45;

    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // Teks Lokasi & Tanggal
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Indramayu, ${dateStr}`, width / 2, finalY, { align: 'center' });
    
    finalY += 5; // Dikurangi dari 6
    doc.text("Instruktur Pengampu,", width / 2, finalY, { align: 'center' });

    // Gambar TTD + Cap
    if (ttdImage) {
      const ttdWidth = 40;
      const ttdHeight = 35; 
      doc.addImage(ttdImage, 'PNG', (width - ttdWidth) / 2, finalY + 1, ttdWidth, ttdHeight);
    }

    // Nama Pengampu
    finalY += 34; // Dikurangi dari 36
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text("AHDI AGHNI", width / 2, finalY, { align: 'center' });
    
    // Garis Bawah Nama
    doc.setLineWidth(0.5);
    doc.line((width/2) - 30, finalY + 1, (width/2) + 30, finalY + 1);

    // ==========================================
    // --- HALAMAN 2: TRANSKRIP NILAI RINCI ---
    // ==========================================
    doc.addPage();
    
    // Ulangi Background Border di Halaman 2 (Opsional, tapi bagus untuk konsistensi)
    if (borderImage) {
      doc.addImage(borderImage, 'PNG', 0, 0, width, height);
    }

    let yPos = 25;

    // Header Ringkas
    if (logoImageObj) {
      doc.addImage(logoImageObj, 'PNG', 20, yPos, 30, 11);
    }
    
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("TRANSKRIP NILAI KOMPETENSI", width / 2, yPos + 7, { align: 'center' });
    
    yPos += 18;
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(20, yPos, width - 20, yPos);

    // Identitas Siswa di Halaman 2
    yPos += 12;
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text(`Nama Siswa    : ${report.student.name.toUpperCase()}`, 25, yPos);
    doc.text(`Program           : ${report.student.program.toUpperCase()}`, width - 85, yPos);
    
    yPos += 6;
    doc.text(`NIS                   : ${report.student.nis || '-'}`, 25, yPos);
    doc.text(`Tanggal Cetak : ${dateStr}`, width - 85, yPos);

    // Tabel Rincian Materi (Dikelompokkan menjadi Maksimal 5 Kompetensi Utama)
    yPos += 10;
    
    // Logika Pengelompokan (Grouping) Spesifik Kurikulum 16 Pertemuan
    const groups: Record<string, { total: number, count: number, label: string }> = {
      'WORD': { total: 0, count: 0, label: 'Microsoft Office Word' },
      'EXCEL': { total: 0, count: 0, label: 'Microsoft Office Excel' },
      'PPT': { total: 0, count: 0, label: 'Microsoft PowerPoint' },
      'ARSIP': { total: 0, count: 0, label: 'Pengarsipan & Tata Kelola Dokumen' }
    };

    report.modules.forEach(m => {
      const text = (m.moduleInfo.title + ' ' + (m.moduleInfo.category || '')).toUpperCase();
      
      if (text.includes('WORD')) { groups['WORD'].total += m.finalScore; groups['WORD'].count++; }
      else if (text.includes('EXCEL')) { groups['EXCEL'].total += m.finalScore; groups['EXCEL'].count++; }
      else if (text.includes('POWER') || text.includes('PPT')) { groups['PPT'].total += m.finalScore; groups['PPT'].count++; }
      else if (text.includes('ARSIP') || text.includes('FILE') || text.includes('PENGARSIPAN') || text.includes('DOKUMEN')) { 
        groups['ARSIP'].total += m.finalScore; 
        groups['ARSIP'].count++; 
      }
    });

    const transcriptData = Object.values(groups)
      .filter(g => g.count > 0) // Hanya tampilkan materi yang benar-benar ada nilainya
      .slice(0, 4) // Fokus pada 4 materi utama sesuai permintaan
      .map((g, index) => {
        const score = Math.round(g.total / g.count);
        return [index + 1, g.label, score, getGradeLetter(score)];
      });

    autoTable(doc, {
      startY: yPos,
      head: [['No', 'Bidang Kompetensi Utama', 'Nilai Rata-rata', 'Grade']],
      body: transcriptData,
      theme: 'grid',
      margin: { left: 30, right: 30 },
      headStyles: {
        fillColor: [40, 40, 40],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        font: 'times',
        halign: 'center'
      },
      bodyStyles: {
        font: 'times',
        fontSize: 10,
        halign: 'center',
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 }
      }
    });

    // --- DESAIN RINGKASAN NILAI (MENARIK) ---
    yPos = (doc as any).lastAutoTable.finalY + 12;
    
    // Kotak Background Abu Muda
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(30, yPos, 80, 22, 2, 2, 'F');
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text("HASIL CAPAIAN AKHIR:", 35, yPos + 7);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 84, 166);
    doc.text(`NILAI RATA-RATA: ${avgScore}`, 35, yPos + 14);
    
    // Badge Predikat
    doc.setFillColor(0, 84, 166);
    doc.roundedRect(115, yPos, 60, 22, 2, 2, 'F');
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.text("PREDIKAT KELULUSAN:", 118, yPos + 7);
    doc.setFontSize(16);
    doc.text(report.summary.gradePredicate.toUpperCase(), 145, yPos + 16, { align: 'center' });

    // --- FOOTER TTD (AGAK KEATAS) ---
    const footerY = height - 55; // Dinaikkan dari 40
    doc.setTextColor(40);
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(`Indramayu, ${dateStr}`, width - 75, footerY, { align: 'center' });
    doc.text("Instruktur Pengampu,", width - 75, footerY + 5, { align: 'center' });
    
    if (ttdImage) {
      // TTD agak keatas juga
      doc.addImage(ttdImage, 'PNG', width - 90, footerY + 6, 30, 25);
    }
    
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text("AHDI AGHNI", width - 75, footerY + 34, { align: 'center' });
    doc.line(width - 95, footerY + 35, width - 55, footerY + 35);

  } catch (error) {
    console.error("Gagal generate sertifikat:", error);
    doc.text("Terjadi kesalahan saat membuat sertifikat.", 10, 10);
  }

  return doc;
};

// Fungsi Helper untuk Grade
function getGradeLetter(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}
