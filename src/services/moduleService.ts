import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";

export interface ModuleData {
  id?: string;
  title: string;
  description: string;
  programId: string; // Modul dikaitkan dengan Program (misal: "Microsoft Office")
  fileUrl: string;
  fileName: string;
  createdAt: number;
  uploadedBy: string;
}

export const moduleService = {
  // 1. Upload File PDF ke Cloudinary (World Class Storage)
  async uploadPDF(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "project_kursuslp3i"); // [MODIFIED BY GEMINI] Preset Unsigned Cloudinary

    try {
      // Direct Upload ke Cloudinary (Tanpa Backend Server)
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dxxbegnoz/auto/upload`, 
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Gagal upload ke Cloudinary");
      }

      const data = await response.json();
      return data.secure_url; // URL PDF HTTPS yang valid
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      throw error;
    }
  },

  // 2. Simpan Data Modul ke Firestore
  async addModule(data: Omit<ModuleData, "id">) {
    try {
      await addDoc(collection(db, "modules"), data);
      return { success: true };
    } catch (error) {
      console.error("Error adding module:", error);
      return { success: false, error };
    }
  },

  // 3. Ambil Modul berdasarkan Program
  async getModulesByProgram(programId: string) {
    try {
      // Cari modul yang programId-nya cocok (Case Insensitive search manual atau exact match)
      // Untuk simpelnya kita pakai exact match dulu, nanti bisa diimprovisasi
      const q = query(
        collection(db, "modules"), 
        where("programId", "==", programId),
        orderBy("createdAt", "asc")
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ModuleData[];
    } catch (error) {
      console.error("Error fetching modules:", error);
      return [];
    }
  },

  // 4. Hapus Modul
  async deleteModule(id: string) {
    try {
      await deleteDoc(doc(db, "modules", id));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }
};
