import { 
  collection, 
  addDoc, 
  query,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { db } from "./firebase";
import type { Student, MeetingRecord, ComprehensiveReport, CourseModule } from "../types";

const STUDENTS_COLLECTION = "students";
const RECORDS_COLLECTION = "academic_records"; 

export const studentService = {
  
  // Real-time Listener untuk Daftar Siswa (Full - Untuk Admin)
  subscribeToStudents: (callback: (data: Student[]) => void) => {
    const q = query(collection(db, STUDENTS_COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Student));
      callback(students);
    });
  },

  // Real-time Listener untuk Publik (Untuk sesama Siswa)
  // Tidak menyertakan data sensitif di level koding (Safety)
  subscribeToPublicStudents: (callback: (data: any[]) => void) => {
    const q = query(collection(db, STUDENTS_COLLECTION), orderBy("name", "asc"));
    return onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name,
          avatarUrl: d.avatarUrl,
          program: d.program,
          classId: d.classId,
          batch: d.batch,
          status: d.status
        };
      });
      callback(students);
    });
  },

  // --- STUDENT CRUD ---

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

  async getStudentById(id: string): Promise<Student | null> {
    try {
      const docRef = doc(db, STUDENTS_COLLECTION, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Student;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // Fitur Deteksi Otomatis via Email (Request User)
  async getStudentByEmail(email: string): Promise<Student | null> {
    try {
      const q = query(collection(db, STUDENTS_COLLECTION), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Ambil data pertama yang cocok
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Student;
      }
      return null;
    } catch (error) {
      console.error("Error finding student by email:", error);
      return null;
    }
  },

  async updateStudent(id: string, data: Partial<Student>) {
    try {
      const studentRef = doc(db, STUDENTS_COLLECTION, id);
      await updateDoc(studentRef, {
        ...data,
        updatedAt: Date.now()
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating student: ", error);
      return { success: false, error: error.message };
    }
  },

  async deleteStudent(id: string) {
    try {
      await deleteDoc(doc(db, STUDENTS_COLLECTION, id));
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting student: ", error);
      return { success: false, error: error.message };
    }
  },

  async getAllStudents(filterPrograms?: string[]) {
    try {
      const q = query(collection(db, STUDENTS_COLLECTION), orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const allStudents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];

      // Jika tidak ada filter atau user punya akses 'ALL', kembalikan semua
      if (!filterPrograms || filterPrograms.length === 0 || filterPrograms.includes('ALL')) {
        return allStudents;
      }

      // Filter Logic: Siswa hanya muncul jika programnya mengandung kata kunci yang diizinkan
      return allStudents.filter(student => 
        filterPrograms.some(allowed => 
          student.program && student.program.toUpperCase().includes(allowed.toUpperCase())
        )
      );

    } catch (error) {
      console.error("Error getting students: ", error);
      return [];
    }
  },

  async getCourseTypes() {
    try {
      const q = query(collection(db, "course_types"), orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
    } catch (error) {
      console.error("Error getting course types:", error);
      return [];
    }
  },

  // --- ACADEMIC RECORDS & REPORTS ---

  async getStudentRecords(studentId: string) {
    try {
      const q = query(collection(db, RECORDS_COLLECTION), where("studentId", "==", studentId));
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MeetingRecord[];
      return records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error("Error getting records: ", error);
      return [];
    }
  },

  // Alias untuk kompatibilitas dengan GradingModal
  async getStudentGrades(studentId: string) {
    return this.getStudentRecords(studentId);
  },

  async getComprehensiveReport(studentId: string): Promise<ComprehensiveReport | null> {
    try {
      const student = await studentService.getStudentById(studentId);
      if (!student) return null;

      const records = await studentService.getStudentRecords(studentId);

      const modulesReport = records.map(rec => {
        const modInfo = (rec as any).moduleInfo || {
          title: 'Materi Pertemuan',
          category: 'UMUM',
          meetingNumber: 0,
          maxScore: 100
        };
        const mainGrade = rec.grades.find(g => g.type === 'PRAKTEK' || g.type === 'TUGAS')?.score || 0;

        return {
          moduleInfo: {
            id: rec.moduleId || `MOD-${rec.id}`,
            category: modInfo.category || 'OTHER',
            title: modInfo.title || 'Materi Tanpa Judul',
            meetingNumber: modInfo.meetingNumber || 0,
            maxScore: 100
          } as CourseModule,
          finalScore: mainGrade,
          record: rec
        };
      });

      const totalMeetings = modulesReport.length;
      const totalScore = modulesReport.reduce((sum, m) => sum + m.finalScore, 0);
      const avgScore = totalMeetings > 0 ? totalScore / totalMeetings : 0;
      
      let predicate: 'A'|'B'|'C'|'D'|'E' = 'E';
      if (avgScore >= 85) predicate = 'A';
      else if (avgScore >= 75) predicate = 'B';
      else if (avgScore >= 60) predicate = 'C';
      else if (avgScore >= 50) predicate = 'D';

      // 5. AMBIL NAMA INSTRUKTUR DARI KELAS
      let classInstructor = "Instruktur Pengampu"; 
      if (student.classId) {
        try {
          const docRef = doc(db, "class_schedules", student.classId);
          const clsSnap = await getDoc(docRef);
          if (clsSnap.exists()) {
            // Ambil field instructorId (yg isinya nama instruktur)
            classInstructor = clsSnap.data().instructorId || classInstructor;
          }
        } catch (e) { 
          console.warn("Gagal ambil data instruktur kelas", e); 
        }
      }

      return {
        student,
        modules: modulesReport,
        summary: {
          totalMeetings,
          attendancePercentage: 100,
          averageScore: avgScore,
          gradePredicate: predicate
        },
        classInstructorName: classInstructor
      } as any; // Cast any karena tipe ComprehensiveReport belum diupdate (gapapa utk JS logic)

    } catch (error) {
      console.error("Gagal generate laporan:", error);
      return null;
    }
  },

  async saveSessionRecord(data: {
    studentId: string;
    meetingNumber: number;
    topic: string;
    attendance: string;
    score: number;
    notes: string;
  }) {
    try {
      const docId = `REC_${data.studentId}_S${data.meetingNumber}`;
      const recordRef = doc(db, RECORDS_COLLECTION, docId);
      const recordData = {
        studentId: data.studentId,
        date: new Date().toISOString(),
        attendance: data.attendance,
        instructorNotes: data.notes,
        grades: [{ type: 'PRAKTEK', score: Number(data.score) }],
        moduleInfo: {
          title: data.topic,
          meetingNumber: data.meetingNumber
        },
        updatedAt: Date.now()
      };
      await setDoc(recordRef, recordData, { merge: true });
      return { success: true };
    } catch (error: any) {
      console.error("Error saving grade:", error);
      return { success: false, error: error.message };
    }
  },

  // --- UTILS ---
  async uploadStudentPhoto(file: File, _fileName: string, _folderName: string = 'students') {
    return new Promise<{ success: boolean; url?: string; error?: string }>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (base64String.length > 800000) {
          resolve({ success: false, error: "Foto terlalu besar (Max 500KB)." });
        } else {
          resolve({ success: true, url: base64String });
        }
      };
      reader.onerror = () => resolve({ success: false, error: "Gagal membaca foto." });
      reader.readAsDataURL(file);
    });
  }
};
