// ==========================================
// USER & AUTH MODELS
// ==========================================

export type UserRole = 'INSTRUCTOR' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'EXPIRED';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  licenseExpiry?: number; // Timestamp kapan akun expired
  createdAt: number;
}

// ==========================================
// CORE DATA MODELS (Blueprint Sistem)
// ==========================================

export type ModuleCategory = 'WORD' | 'EXCEL' | 'POWERPOINT' | 'OTHER';

// Definisi Program Kursus (Master Data)
export interface CourseProgram {
  id: string;
  code: string;       // Contoh: POA, GD, CA
  name: string;       // Contoh: "Professional Office Administration"
  durationMonths: number;
}

// Definisi Kelas / Rombongan Belajar
export interface ClassGroup {
  id: string;
  name: string;       // Contoh: "Reguler Pagi - Angkatan 1"
  programId: string;  // Link ke CourseProgram
  level: number;      // Tingkat 1, 2, 3
  schedule: string;   // Custom string: "Senin-Rabu, 08:00 - 10:00"
  instructorId: string; // ID Instruktur penanggung jawab
  isActive: boolean;
}

export interface CourseModule {
  id: string;
  category: ModuleCategory;
  title: string;          // Contoh: "Mail Merge & Layout"
  meetingNumber: number;  // Pertemuan ke-1, 2, dst
  description?: string;
  maxScore: number;       // Standar nilai maksimal (biasanya 100)
}

export interface GradeItem {
  type: 'TUGAS' | 'PRAKTEK' | 'UJIAN' | 'SIKAP';
  score: number;
}

export interface MeetingRecord {
  id: string;             // ID unik record
  studentId: string;
  moduleId: string;       // Mengacu ke CourseModule
  date: string;           // Tanggal pelaksanaan (ISO String)
  attendance: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPHA';
  grades: GradeItem[];    // Nilai-nilai dalam pertemuan ini
  instructorNotes?: string; // Catatan kualitatif (Penting untuk laporan narasi)
  updatedAt: number;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  email?: string;
  phone?: string;
  batch: string;          // Angkatan (Tahun)
  program: string;        // (Legacy string, tetap disimpan untuk kemudahan display)
  classId?: string;       // Link ke ClassGroup (Opsional karena mungkin belum masuk kelas)
  avatarUrl?: string;     
  status: 'ACTIVE' | 'GRADUATED' | 'DROPOUT';
  createdAt: number;
}

// ==========================================
// REPORT & EXPORT MODELS
// ==========================================

// Struktur data gabungan untuk keperluan Generate PDF/Excel
export interface ComprehensiveReport {
  student: Student;
  modules: {
    moduleInfo: CourseModule;
    record?: MeetingRecord; // Bisa undefined jika siswa belum ambil modul ini
    finalScore: number;     // Nilai akhir pertemuan ini (rata-rata terbobot)
  }[];
  summary: {
    totalMeetings: number;
    attendancePercentage: number;
    averageScore: number;
    gradePredicate: 'A' | 'B' | 'C' | 'D' | 'E';
  };
}

export interface InstitutionConfig {
  name: string;
  address: string;
  logoUrl: string;
  headOfInstitution: string; // Nama pimpinan untuk TTD
  instructorName: string;
}
