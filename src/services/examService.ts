import type { ExamConfig, StudentExamSession, Question } from '../types/exam';
import { MOCK_EXAM_SCENARIO } from '../utils/mockData';
import { EXCEL_QUESTIONS, WORD_QUESTIONS, PPT_QUESTIONS, ARSIP_QUESTIONS, OMNIBUS_EXAM_QUESTIONS, ESSAY_QUESTIONS } from '../utils/questions/omnibusQuestions';
import { cloudinaryService } from './cloudinaryService';

import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { studentService } from './studentService';

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
  startExam: async (studentId: string, exam: ExamConfig, studentProfile?: { name: string, nis: string }): Promise<StudentExamSession> => {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    
    // 1. CEK KE CLOUD (FIRESTORE) TERLEBIH DAHULU
    const docId = `${exam.id}_${studentId}`;
    try {
      const docRef = doc(db, "exam_sessions", docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cloudData = docSnap.data() as StudentExamSession;
        console.log("[ExamService] Menemukan sesi aktif di Cloud. Melanjutkan...");
        
        // Update Local Storage agar sinkron dengan Cloud
        const updatedLocal = sessions.filter((s: any) => s.id !== cloudData.id);
        updatedLocal.push(cloudData);
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updatedLocal));
        
        return cloudData;
      }
    } catch (e) {
      console.warn("[ExamService] Gagal cek Cloud (mungkin offline):", e);
    }

    // 2. JIKA DI CLOUD TIDAK ADA, CEK LOKAL (Tapi anggap Reset jika Cloud Kosong & kita Online)
    console.log("[ExamService] Sesi tidak ditemukan di Cloud. Memulai dari nol (Reset).");
    const freshSessions = sessions.filter((s: any) => s.studentId !== studentId);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(freshSessions));

    const startTime = Date.now();
    const endTime = startTime + (exam.durationMinutes * 60 * 1000);

    const newSession: StudentExamSession = {
      id: `SES-${Date.now()}`,
      studentId,
      studentName: studentProfile?.name || 'Peserta', // Simpan Nama
      studentNis: studentProfile?.nis || '',         // Simpan NIS/Email
      examId: exam.id,
      startTime,
      endTime,
      answers: {},
      status: 'IN_PROGRESS'
    };

    freshSessions.push(newSession);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(freshSessions));
    
    // --- FIX: CREATE DOC DI FIRESTORE IMMEDIATELY ---
    try {
      await setDoc(doc(db, "exam_sessions", docId), newSession);
    } catch (e) {
      console.error("Gagal init firestore session:", e);
    }

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
    // KITA TIDAK PAKAI LOGIC LOCALSTORAGE LAGI UNTUK NILAI AKHIR
    // KITA AMBIL DARI FIRESTORE (SOURCE OF TRUTH) AGAR AKURAT
    
    const docId = `${session.examId}_${session.studentId}`;
    const docRef = doc(db, "exam_sessions", docId);
    
    try {
      // 1. Ambil data terbaru dari Cloud (Jaga-jaga jika parameter session stale)
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
         throw new Error("Dokumen sesi tidak ditemukan di Cloud!");
      }
      
      const cloudData = docSnap.data() as StudentExamSession;
      const finalAnswers = { ...cloudData.answers, ...(session.answers || {}) };

      // 2. Hitung Nilai (Server-Side Logic Simulation)
      let totalPoints = 0;
      let maxPoints = 0;

      questions.forEach(q => {
        maxPoints += q.points;
        // Cek jawaban
        if (finalAnswers[q.id] === q.correctIndex) {
          totalPoints += q.points;
        }
      });

      const finalScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

      // 3. Update Status & Score di Cloud (JANGAN TIMPA ANSWERS)
      // Kita hanya update field yang relevan untuk submit
      const updatePayload = {
         status: 'SUBMITTED',
         finalScore: finalScore,
         submittedAt: new Date().toISOString(),
         lastSyncedAt: new Date().toISOString()
      };
      
      console.log(`[ExamService] Submitting Score: ${finalScore}. Payload:`, updatePayload);
      
      await setDoc(docRef, updatePayload, { merge: true });
      
      // 4. Update LocalStorage (Hanya untuk konsistensi, walau UI pakai Cloud)
      const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
      const idx = sessions.findIndex((s: any) => s.id === session.id);
      if (idx > -1) {
         sessions[idx].status = 'SUBMITTED';
         sessions[idx].finalScore = finalScore;
         localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      }

      // --- SINKRONISASI RAPOT (SAMA SEPERTI SEBELUMNYA) ---
      // ... (Code sinkron ke rapot siswa tetap sama)
      try {
        const meetingNum = 99; // Omnibus
        let topicName = "UJIKOM: OMNIBUS (Final)";
        await studentService.saveSessionRecord({
          studentId: session.studentId,
          meetingNumber: meetingNum,
          topic: topicName,
          attendance: 'HADIR',
          score: finalScore,
          notes: `Nilai Ujikom Final: ${finalScore}`
        });
      } catch (e) { console.error("Rapot sync failed", e); }

      return finalScore;

    } catch (error) {
       console.error("CRITICAL SUBMIT ERROR:", error);
       throw error;
    }
  },

  // Method Tambahan untuk Seed Data (Fix build error di SettingsPage)
  createExam: async (examData: Partial<ExamConfig>) => {
    console.log("Mock createExam called with:", examData);
    // Di aplikasi nyata, ini akan push ke Firestore
    return { success: true, id: `EXAM-${Date.now()}` };
  }
};