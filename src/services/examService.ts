import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc // Added this
} from "firebase/firestore";
import { db } from "./firebase";
import type { ExamConfig, StudentExamSession, Question } from "../types/exam";

import { MOCK_EXAM_SCENARIO } from "../utils/mockData";

export const examService = {
  
  // ... (previous functions remain the same) ...

  // 1. AMBIL SOAL UJIAN (Berdasarkan Program)
  async getExamByProgram(_programId: string): Promise<ExamConfig | null> {
    // [MODIFIED BY GEMINI] FORCE RETURN MOCK DATA UNTUK TESTING SKENARIO 5 PG + 2 ESSAY
    return MOCK_EXAM_SCENARIO as unknown as ExamConfig;

    /* KODE ASLI DISIMPAN:
    try {
      const q = query(collection(db, "exams"), where("programId", "==", programId), where("isActive", "==", true));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as ExamConfig;
      }
      return null;
    } catch (e) {
      console.error("Gagal ambil data ujian:", e);
      return null;
    }
    */
  },

  // 2. MULAI UJIAN (Cek Sesi Lama atau Buat Baru)
  async startExam(studentId: string, examConfig: ExamConfig): Promise<StudentExamSession> {
    const sessionId = `EXAM_SESS_${studentId}_${examConfig.id}`;
    const sessionRef = doc(db, "exam_sessions", sessionId);
    const sessionSnap = await getDoc(sessionRef);

    // SKENARIO A: SISWA SUDAH PERNAH MULAI
    const BYPASS_LIMIT_FOR_TESTING = true; // [MODIFIED BY GEMINI] Set TRUE untuk unlimted retake (Testing Mode)
    
    if (sessionSnap.exists() && !BYPASS_LIMIT_FOR_TESTING) {
      const sessionData = sessionSnap.data() as StudentExamSession;
      
      // Cek apakah waktu sudah habis saat dia offline?
      if (sessionData.status === 'IN_PROGRESS' && Date.now() > sessionData.endTime) {
        // Otomatis tutup sesi jika waktu expired
        await updateDoc(sessionRef, { status: 'EXPIRED' });
        return { ...sessionData, status: 'EXPIRED' };
      }
      
      return { ...sessionData, id: sessionId };
    }

    // SKENARIO B: MULAI BARU
    const now = Date.now();
    const durationMs = examConfig.durationMinutes * 60 * 1000;
    
    const newSession: StudentExamSession = {
      id: sessionId,
      studentId,
      examId: examConfig.id,
      startTime: now,
      endTime: now + durationMs, // INI KUNCINYA (Server Time Lock)
      answers: {},
      status: 'IN_PROGRESS'
    };

    await setDoc(sessionRef, newSession);
    return newSession;
  },

  // 3. SIMPAN JAWABAN (Auto-Save per nomor)
  async saveAnswer(sessionId: string, questionId: string, answerIndex: number) {
    const sessionRef = doc(db, "exam_sessions", sessionId);
    // Menggunakan dot notation untuk update field dalam object 'answers' tanpa menimpa yang lain
    await updateDoc(sessionRef, {
      [`answers.${questionId}`]: answerIndex
    });
  },

  // 4. SUBMIT FINAL (Hitung Nilai)
  async submitExam(session: StudentExamSession, questions: Question[]) {
    let correctCount = 0;
    let totalPoints = 0;
    
    questions.forEach(q => {
      const userAnswer = session.answers[q.id];
      if (userAnswer === q.correctIndex) {
        correctCount += q.points; // Atau +1 jika bobot sama
      }
      totalPoints += q.points;
    });

    const finalScore = totalPoints > 0 ? (correctCount / totalPoints) * 100 : 0;
    
    const sessionRef = doc(db, "exam_sessions", session.id);
    await updateDoc(sessionRef, {
      status: 'SUBMITTED',
      finalScore: Math.round(finalScore)
    });

    return Math.round(finalScore);
  },

  // 5. BUAT UJIAN BARU (Untuk Instruktur - Seed Data)
  async createExam(data: Omit<ExamConfig, "id">) {
    try {
      const ref = await addDoc(collection(db, "exams"), data);
      return ref.id;
    } catch (error) {
      console.error("Error creating exam:", error);
      throw error;
    }
  }
};
