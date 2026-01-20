import type { ExamConfig, StudentExamSession, Question } from '../types/exam';
import { MOCK_EXAM_SCENARIO } from '../utils/mockData';
import { EXCEL_QUESTIONS, WORD_QUESTIONS, PPT_QUESTIONS, ARSIP_QUESTIONS, OMNIBUS_EXAM_QUESTIONS, ESSAY_QUESTIONS } from '../utils/questions/omnibusQuestions';
import { cloudinaryService } from './cloudinaryService';

// Simulasi Database di LocalStorage
const STORAGE_KEYS = {
  SESSIONS: 'exam_sessions',
};

// HELPER: Get Questions by Topic
const getQuestionsByTopic = (topic: string): Question[] => {
  switch (topic.toUpperCase()) {
    case 'EXCEL': return EXCEL_QUESTIONS;
    case 'WORD': return WORD_QUESTIONS;
    case 'PPT': return PPT_QUESTIONS;
    case 'ARSIP': return ARSIP_QUESTIONS;
    case 'PRAKTIKUM': return ESSAY_QUESTIONS;
    case 'OMNIBUS': return OMNIBUS_EXAM_QUESTIONS;
    default: return MOCK_EXAM_SCENARIO.questions as Question[];
  }
};

export const examService = {
  // Ambil Konfigurasi Ujian (Mock)
  getExamByProgram: async (programName: string, topic: string = 'OMNIBUS'): Promise<ExamConfig | null> => {
    // Simulasi delay network
    await new Promise(resolve => setTimeout(resolve, 800));

    const questions = getQuestionsByTopic(topic);

    return {
      ...MOCK_EXAM_SCENARIO,
      id: `EXAM-${topic}-${Date.now()}`,
      title: `Ujikom: ${topic === 'OMNIBUS' ? 'OMNIBUS (ALL MODULES)' : topic}`,
      questions: questions,
      durationMinutes: 180, // GLOBAL TIMER: 3 JAM (180 MENIT)
      passingGrade: 75,
      isActive: true,
      programId: programName
    };
  },

  // Mulai Ujian Baru
  startExam: async (studentId: string, exam: ExamConfig): Promise<StudentExamSession> => {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    
    // Cek apakah ada sesi yang belum selesai untuk ujian ini?
    // Untuk simplicity project ini, kita selalu buat sesi baru jika user request
    // Tapi idealnya resume sesi jika belum expired.
    
    const startTime = Date.now();
    const endTime = startTime + (exam.durationMinutes * 60 * 1000);

    const newSession: StudentExamSession = {
      id: `SES-${Date.now()}`,
      studentId,
      examId: exam.id,
      startTime,
      endTime,
      answers: {},
      status: 'IN_PROGRESS'
    };

    sessions.push(newSession);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    
    return newSession;
  },

  // UPLOAD FILE JAWABAN (VIA CLOUDINARY)
  uploadExamFile: async (file: File, _studentId: string, _examId: string, _questionId: string): Promise<string> => {
    try {
      // Validasi Ukuran (Max 10MB untuk Cloudinary Free Tier aman)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File terlalu besar. Maksimal 10MB.");
      }

      console.log("Uploading to Cloudinary...");
      const downloadURL = await cloudinaryService.uploadFile(file);
      console.log("File Uploaded:", downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error("Upload Service Error:", error);
      throw error;
    }
  },

  // Simpan Jawaban per Soal
  saveAnswer: async (sessionId: string, questionId: string, answerIndex: any) => {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const sessionIndex = sessions.findIndex((s: any) => s.id === sessionId);
    
    if (sessionIndex > -1) {
      sessions[sessionIndex].answers[questionId] = answerIndex;
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    }
  },

  // Submit Ujian
  submitExam: async (session: StudentExamSession, questions: Question[]) => {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const sessionIndex = sessions.findIndex((s: any) => s.id === session.id);

    if (sessionIndex > -1) {
      // Hitung Nilai
      let totalPoints = 0;
      let maxPoints = 0;

      questions.forEach(q => {
        maxPoints += q.points;
        // Cek jawaban (hanya PG yang bisa auto-score, Essay manual/skip logic here)
        if (session.answers[q.id] === q.correctIndex) {
          totalPoints += q.points;
        }
      });

      // Simple Scoring: (Perolehan / Max) * 100
      const finalScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

      sessions[sessionIndex].status = 'SUBMITTED';
      sessions[sessionIndex].finalScore = finalScore;
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      
      return finalScore;
    }
    return 0;
  },

  // Method Tambahan untuk Seed Data (Fix build error di SettingsPage)
  createExam: async (examData: Partial<ExamConfig>) => {
    console.log("Mock createExam called with:", examData);
    // Di aplikasi nyata, ini akan push ke Firestore
    return { success: true, id: `EXAM-${Date.now()}` };
  }
};