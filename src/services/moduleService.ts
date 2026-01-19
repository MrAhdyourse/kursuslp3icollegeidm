import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc
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
      // [FIXED] Hapus orderBy di query Firestore untuk menghindari 'Missing Index' error
      // Kita filter saja, sorting dilakukan di client side (JavaScript)
      const q = query(
        collection(db, "modules"), 
        where("programId", "==", programId)
      );
      
      const snapshot = await getDocs(q);
      const modules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ModuleData[];

      // Manual Sort di Client (Terbaru di bawah/Ascending)
      return modules.sort((a, b) => a.createdAt - b.createdAt);
      
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
