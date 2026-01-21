// Tipe Data untuk Sistem Ujian

export interface Question {
  id: string;
  text: string; // Teks Soal
  type?: 'MULTIPLE_CHOICE' | 'ESSAY'; // Jenis Soal
  options: string[]; // Pilihan A, B, C, D, E
  correctIndex: number; // Kunci Jawaban (0-4)
  points: number; // Bobot nilai
  spreadsheetData?: string[][]; // OPTIONAL: Data untuk tabel Excel (Header + Rows)
}

export interface ExamConfig {
  id: string;
  programId: string; // Ujian ini untuk program apa (misal: "Microsoft Office")
  title: string;
  durationMinutes: number; // Durasi (180 menit)
  passingGrade: number;
  questions: Question[];
  isActive: boolean;
}

export interface StudentExamSession {
  id: string; // ID Unik Sesi
  studentId: string;
  studentName?: string; // Snapshot Nama Siswa saat ujian
  studentNis?: string;  // Snapshot NIS/Email saat ujian
  examId: string;
  startTime: number; // Timestamp mulai (ms)
  endTime: number;   // Timestamp wajib selesai (ms)
  answers: Record<string, any>; // Key: QuestionID, Value: SelectedIndex (number) OR Link (string)
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  finalScore?: number;
}
