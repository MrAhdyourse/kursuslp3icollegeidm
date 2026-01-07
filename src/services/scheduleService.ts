import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import type { ClassGroup } from '../types';

const COLLECTION_NAME = 'class_schedules';

export const scheduleService = {
  // Real-time Listener untuk Dashboard Siswa
  subscribeToActiveSchedules: (callback: (data: ClassGroup[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), where("isActive", "==", true));
    return onSnapshot(q, (snapshot) => {
      const schedules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClassGroup));
      callback(schedules);
    });
  },

  // Ambil SEMUA jadwal (Untuk Admin)
  getAllSchedules: async (): Promise<ClassGroup[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClassGroup));
    } catch (error) {
      console.error("Error fetching schedules:", error);
      return [];
    }
  },

  // Ambil Jadwal yang AKTIF saja (Untuk Dashboard Siswa)
  getActiveSchedules: async (): Promise<ClassGroup[]> => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where("isActive", "==", true));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClassGroup));
    } catch (error) {
      console.error("Error fetching active schedules:", error);
      return [];
    }
  },

  // Tambah Jadwal Baru
  addSchedule: async (schedule: Omit<ClassGroup, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), schedule);
      return { id: docRef.id, ...schedule };
    } catch (error) {
      console.error("Error adding schedule:", error);
      throw error;
    }
  },

  // Update Jadwal
  updateSchedule: async (updatedSchedule: ClassGroup) => {
    try {
      const scheduleRef = doc(db, COLLECTION_NAME, updatedSchedule.id);
      // Hapus field 'id' dari data yang akan disimpan agar tidak duplikat di dalam dokumen
      const { id, ...dataToSave } = updatedSchedule;
      await updateDoc(scheduleRef, dataToSave);
    } catch (error) {
      console.error("Error updating schedule:", error);
      throw error;
    }
  },

  // Delete Jadwal
  deleteSchedule: async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting schedule:", error);
      throw error;
    }
  },

  // Toggle Status (Publish/Unpublish)
  toggleStatus: async (id: string, currentStatus: boolean) => {
    try {
      const scheduleRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(scheduleRef, { isActive: !currentStatus });
    } catch (error) {
      console.error("Error toggling status:", error);
      throw error;
    }
  }
};