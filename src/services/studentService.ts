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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
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

  async uploadStudentPhoto(file: File, fileName: string, folderName: string = 'students') {
    console.log(`Starting upload to ${folderName}...`);
    try {
      const timestamp = Date.now();
      const safeName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      // Gunakan path yang lebih pendek dan bersih
      const path = `${folderName}/${safeName}_${timestamp}`;
      
      const storageRef = ref(storage, path);
      
      // Upload dengan proteksi
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log("Upload Success! URL:", downloadURL);
      return { success: true, url: downloadURL };
    } catch (error: any) {
      console.error("Firebase Storage Error Detail:", error);
      return { success: false, error: error.message };
    }
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
