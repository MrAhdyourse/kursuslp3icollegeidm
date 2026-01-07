import { 
  collection, 
  addDoc, 
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import type { Student, MeetingRecord } from "../types";

const STUDENTS_COLLECTION = "students";
const RECORDS_COLLECTION = "academic_records"; 

export const studentService = {
  // --- STUDENT MANAGEMENT ---

  async addStudent(student: Omit<Student, "id">) {
    try {
      const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), {
        ...student,
        createdAt: Date.now()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding student: ", error);
      return { success: false, error };
    }
  },

  async updateStudent(id: string, data: Partial<Student>) {
    try {
      const studentRef = doc(db, STUDENTS_COLLECTION, id);
      await updateDoc(studentRef, data);
      return { success: true };
    } catch (error) {
      console.error("Error updating student: ", error);
      return { success: false, error };
    }
  },

  async deleteStudent(id: string) {
    try {
      await deleteDoc(doc(db, STUDENTS_COLLECTION, id));
      return { success: true };
    } catch (error) {
      console.error("Error deleting student: ", error);
      return { success: false, error };
    }
  },

  /**
   * Mengonversi Foto jadi Teks Base64 (Anti-CORS & Instan)
   */
  async uploadStudentPhoto(file: File, _fileName: string, _folderName: string = 'students') {
    return new Promise<{ success: boolean; url?: string; error?: string }>((resolve) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        // Proteksi: Firestore punya limit 1MB per dokumen.
        // Kita limit agar foto yang diupload tidak lebih dari ~600KB setelah jadi teks.
        if (base64String.length > 800000) {
          resolve({ success: false, error: "Ukuran foto terlalu besar. Silakan gunakan foto yang lebih kecil (di bawah 500KB)." });
        } else {
          resolve({ success: true, url: base64String });
        }
      };

      reader.onerror = () => {
        resolve({ success: false, error: "Gagal membaca file foto." });
      };

      reader.readAsDataURL(file);
    });
  },

  async getAllStudents() {
    try {
      const q = query(collection(db, STUDENTS_COLLECTION), orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
    } catch (error) {
      console.error("Error getting students: ", error);
      return [];
    }
  },

  // --- ACADEMIC RECORDS (NILAI) ---

  /**
   * Menyimpan nilai pertemuan (Word/Excel/PPT)
   */
  async addMeetingRecord(record: Omit<MeetingRecord, "id">) {
    try {
      const docRef = await addDoc(collection(db, RECORDS_COLLECTION), {
        ...record,
        updatedAt: Date.now()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding record: ", error);
      return { success: false, error };
    }
  },

  /**
   * Mengambil semua nilai milik satu siswa tertentu
   * Penting untuk menu Statistik!
   */
  async getStudentRecords(studentId: string) {
    try {
      const q = query(
        collection(db, RECORDS_COLLECTION), 
        where("studentId", "==", studentId)
        // Note: orderBy butuh composite index di Firebase, kita sort manual di JS saja biar aman di awal
      );
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MeetingRecord[];
      
      // Urutkan berdasarkan tanggal
      return records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error("Error getting records: ", error);
      return [];
    }
  }
};
