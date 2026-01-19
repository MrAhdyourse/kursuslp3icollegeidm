import type { ComprehensiveReport, Student, ClassGroup } from "../types";

// --- MOCK DATA KELAS ---
export const MOCK_CLASSES: ClassGroup[] = [
  {
    id: "CLS-001",
    name: "POA - Pagi A (Lvl 1)",
    programId: "PROG-POA",
    level: 1,
    schedule: "Senin & Rabu, 08:00 - 10:00",
    instructorId: "INST-001",
    isActive: true
  },
  {
    id: "CLS-002",
    name: "Acc - Siang B (Lvl 2)",
    programId: "PROG-ACC",
    level: 2,
    schedule: "Selasa & Kamis, 13:00 - 15:00",
    instructorId: "INST-002",
    isActive: true
  },
  {
    id: "CLS-003",
    name: "Design - Weekend (Lvl 3)",
    programId: "PROG-GD",
    level: 3,
    schedule: "Sabtu, 09:00 - 14:00",
    instructorId: "INST-001",
    isActive: true
  }
];

// --- MOCK DATA UJIAN (SCENARIO 5 PG + 2 ESSAY) ---
export const MOCK_EXAM_SCENARIO = {
  id: "EXAM-TEST-001",
  programId: "Microsoft Office",
  title: "UJIKOM KOMPUTER (Skenario Testing)",
  durationMinutes: 90,
  passingGrade: 70,
  isActive: true,
  questions: [
    // 5 Soal Pilihan Ganda
    { id: "Q1", type: "MULTIPLE_CHOICE", text: "Apa pintasan keyboard untuk 'Copy'?", options: ["Ctrl+C", "Ctrl+V", "Ctrl+X", "Ctrl+P", "Alt+F4"], correctIndex: 0, points: 10 },
    { id: "Q2", type: "MULTIPLE_CHOICE", text: "Fungsi Excel untuk menjumlahkan data adalah...", options: ["AVERAGE", "COUNT", "SUM", "MAX", "IF"], correctIndex: 2, points: 10 },
    { id: "Q3", type: "MULTIPLE_CHOICE", text: "Aplikasi pengolah kata dari Microsoft adalah...", options: ["Excel", "Word", "PowerPoint", "Access", "Outlook"], correctIndex: 1, points: 10 },
    { id: "Q4", type: "MULTIPLE_CHOICE", text: "Untuk membuat presentasi, kita menggunakan...", options: ["Ms. Word", "Ms. Excel", "Ms. PowerPoint", "Ms. Paint", "Notepad"], correctIndex: 2, points: 10 },
    { id: "Q5", type: "MULTIPLE_CHOICE", text: "Ekstensi file standar untuk Word 2019 adalah...", options: [".txt", ".pdf", ".docx", ".xlsx", ".pptx"], correctIndex: 2, points: 10 },
    
    // 2 Soal Essay
    { id: "Q6", type: "ESSAY", text: "Jelaskan langkah-langkah membuat Mail Merge di Microsoft Word!", options: [], correctIndex: 0, points: 25 },
    { id: "Q7", type: "ESSAY", text: "Buatlah rumus IF bertingkat untuk menentukan grade nilai (A, B, C)!", options: [], correctIndex: 0, points: 25 },
  ]
};

export const MOCK_STUDENTS: Student[] = [
  {
    id: "ST-001",
    nis: "2024.01.001",
    name: "Budi Santoso",
    batch: "2024",
    program: "Professional Office Administration",
    classId: "CLS-001", // Masuk Kelas Pagi
    status: "ACTIVE",
    createdAt: Date.now(),
    email: "budi@example.com"
  },
  {
    id: "ST-002",
    nis: "2024.01.002",
    name: "Ani Wijaya",
    batch: "2024",
    program: "Professional Office Administration",
    classId: "CLS-001", // Masuk Kelas Pagi
    status: "ACTIVE",
    createdAt: Date.now(),
    email: "ani@example.com"
  },
  {
    id: "ST-003",
    nis: "2024.01.003",
    name: "Candra Gunawan",
    batch: "2024",
    program: "Computerized Accounting",
    classId: "CLS-002", // Masuk Kelas Siang
    status: "ACTIVE",
    createdAt: Date.now(),
    email: "candra@example.com"
  },
  {
    id: "ST-004",
    nis: "2024.01.004",
    name: "Dewi Lestari",
    batch: "2024",
    program: "Computerized Accounting",
    classId: "CLS-002", // Masuk Kelas Siang
    status: "ACTIVE",
    createdAt: Date.now(),
    email: "dewi@example.com"
  },
  {
    id: "ST-005",
    nis: "2024.01.005",
    name: "Eko Prasetyo",
    batch: "2023",
    program: "Graphic Design",
    classId: "CLS-003", // Masuk Kelas Weekend
    status: "GRADUATED",
    createdAt: Date.now(),
    email: "eko@example.com"
  },
  {
    id: "ST-006",
    nis: "2024.01.006",
    name: "Fani Rahmawati",
    batch: "2024",
    program: "Graphic Design",
    classId: "CLS-003", // Masuk Kelas Weekend
    status: "ACTIVE",
    createdAt: Date.now(),
    email: "fani@example.com"
  }
];

// Report Default (Untuk Dashboard) - Menggunakan Budi
export const MOCK_REPORT: ComprehensiveReport = {
  student: MOCK_STUDENTS[0],
  summary: {
    totalMeetings: 12,
    attendancePercentage: 100,
    averageScore: 88.5,
    gradePredicate: "A"
  },
  modules: [
    {
      moduleInfo: {
        id: "MOD-01",
        category: "WORD",
        title: "Pengenalan UI & Formatting Dasar",
        meetingNumber: 1,
        maxScore: 100
      },
      finalScore: 85,
      record: {
        id: "REC-01",
        studentId: "ST-001",
        moduleId: "MOD-01",
        date: "2024-01-10T09:00:00Z",
        attendance: "HADIR",
        grades: [{ type: "PRAKTEK", score: 85 }],
        instructorNotes: "Pemahaman dasar sangat baik.",
        updatedAt: Date.now()
      }
    },
    {
      moduleInfo: {
        id: "MOD-02",
        category: "WORD",
        title: "Mail Merge & Surat Massal",
        meetingNumber: 2,
        maxScore: 100
      },
      finalScore: 92,
      record: {
        id: "REC-02",
        studentId: "ST-001",
        moduleId: "MOD-02",
        date: "2024-01-17T09:00:00Z",
        attendance: "HADIR",
        grades: [{ type: "PRAKTEK", score: 92 }],
        instructorNotes: "Logic Mail Merge sempurna tanpa error.",
        updatedAt: Date.now()
      }
    },
    {
      moduleInfo: {
        id: "MOD-03",
        category: "EXCEL",
        title: "Formula Dasar & Logika IF",
        meetingNumber: 3,
        maxScore: 100
      },
      finalScore: 88,
      record: {
        id: "REC-03",
        studentId: "ST-001",
        moduleId: "MOD-03",
        date: "2024-01-24T09:00:00Z",
        attendance: "HADIR",
        grades: [{ type: "PRAKTEK", score: 88 }],
        instructorNotes: "Perlu lebih teliti pada tanda kurung formula.",
        updatedAt: Date.now()
      }
    },
    {
      moduleInfo: {
        id: "MOD-04",
        category: "POWERPOINT",
        title: "Desain Slide & Animasi",
        meetingNumber: 4,
        maxScore: 100
      },
      finalScore: 95,
      record: {
        id: "REC-04",
        studentId: "ST-001",
        moduleId: "MOD-04",
        date: "2024-01-31T09:00:00Z",
        attendance: "HADIR",
        grades: [{ type: "PRAKTEK", score: 95 }],
        instructorNotes: "Kreativitas desain luar biasa.",
        updatedAt: Date.now()
      }
    }
  ]
};
