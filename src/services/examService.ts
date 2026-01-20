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

// HELPER: Mapping Topik ke Meeting Number (Untuk Rapot)
const getExamMeetingNumber = (topicOrQuestionId: string): number => {
  const id = topicOrQuestionId.toUpperCase();
  if (id.includes('EXCEL')) return 91;
  if (id.includes('WORD')) return 92;
  if (id.includes('PPT') || id.includes('POWERPOINT')) return 93;
  if (id.includes('ARSIP')) return 94;
  if (id.includes('ESSAY') || id.includes('PRAKTIKUM')) return 95;
  return 99; // Omnibus / Default
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
    
    // 1. CEK KE CLOUD (FIRESTORE) TERLEBIH DAHULU
    // Kita gunakan ID dokumen yang konsisten: EXAMID_STUDENTID
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
    // Jika kita sampai di sini, artinya di Cloud tidak ada data. 
    // Jika di local ada, kita HAPUS karena admin sudah mereset di cloud.
    console.log("[ExamService] Sesi tidak ditemukan di Cloud. Memulai dari nol (Reset).");
    const freshSessions = sessions.filter((s: any) => s.studentId !== studentId);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(freshSessions));

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

    freshSessions.push(newSession);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(freshSessions));
    
    // --- FIX: CREATE DOC DI FIRESTORE IMMEDIATELY ---
    // Agar listener di ExamRoom tidak menganggap ini "Reset" karena data belum ada
    try {
      const docId = `${exam.id}_${studentId}`;
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
      
      // --- SINKRONISASI 1: KE RAPOT (AGAR MASUK NILAI) ---
      try {
        const sampleQ = questions[0];
        const topicId = sampleQ ? sampleQ.id : 'UMUM';
        const meetingNum = getExamMeetingNumber(topicId);
        
        // Tentukan Nama Topik yang Cantik
        let topicName = "Ujian Kompetensi";
        if (meetingNum === 91) topicName = "UJIKOM: Microsoft Excel";
        if (meetingNum === 92) topicName = "UJIKOM: Microsoft Word";
        if (meetingNum === 93) topicName = "UJIKOM: PowerPoint";
        if (meetingNum === 94) topicName = "UJIKOM: Kearsipan";
        if (meetingNum === 95) topicName = "UJIKOM: Praktikum (Upload)";
        if (meetingNum === 99) topicName = "UJIKOM: OMNIBUS (Teori)";

        console.log(`[ExamService] Syncing score to server... Topic: ${topicName}, Score: ${finalScore}`);

        await studentService.saveSessionRecord({
          studentId: session.studentId,
          meetingNumber: meetingNum,
          topic: topicName,
          attendance: 'HADIR',
          score: finalScore,
          notes: `Nilai otomatis dari sistem ujian (${new Date().toLocaleTimeString()}).`
        });

      } catch (error) {
        console.error("[ExamService] Gagal sinkron nilai ke rapot:", error);
      }

      // --- SINKRONISASI 2: KE LIVE MONITORING (CLOUD FIRESTORE) ---
      try {
        const firestoreSessionData = {
          ...sessions[sessionIndex],
          finalScore: finalScore,
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString() // Marker waktu sync
        };
        
        // Gunakan ID unik kombinasi: EXAMID_STUDENTID
        const docId = `${session.examId}_${session.studentId}`;
        const docRef = doc(db, "exam_sessions", docId);
        
        console.log(`[ExamService] Syncing to Firestore: ${docId}`, firestoreSessionData);
        
        // Gunakan merge: true agar jika ada field lain tidak terhapus
        await setDoc(docRef, firestoreSessionData, { merge: true });
        
        console.log("[ExamService] Live monitoring synced SUCCESS.");
      } catch (error) {
         console.error("[ExamService] CRITICAL: Gagal sinkron ke live monitoring:", error);
         // Kita tidak throw error agar user tidak stuck, tapi kita log merah
         // Di sistem produksi, kita bisa simpan di antrian 'offline sync'
      }

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