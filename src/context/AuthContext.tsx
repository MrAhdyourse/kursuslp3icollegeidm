import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import type { UserProfile, Student } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// Helper untuk menggabungkan data User (Auth) + Student (Akademik)
const mergeStudentData = async (baseProfile: UserProfile): Promise<UserProfile> => {
    if (baseProfile.role !== 'STUDENT') return baseProfile;

    try {
        const q = query(
            collection(db, "students"), 
            where("email", "==", baseProfile.email)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const academicData = querySnapshot.docs[0].data() as Student;
            console.log("Found academic record, merging...", academicData);
            
            // Gabungkan data: Akademik (Student) menimpa data dasar (User) jika ada konflik
            // Kecuali UID dan Role yang tetap ikut User Auth
            return {
                ...baseProfile,
                ...academicData, // Ambil program, classId, nis, batch, level, dll
                uid: baseProfile.uid, // Pertahankan UID asli Auth
                role: 'STUDENT',      // Pertahankan Role
                displayName: academicData.name || baseProfile.displayName // Prefer nama dari data akademik
            };
        }
    } catch (e) {
        console.warn("Failed to merge academic data:", e);
    }
    return baseProfile;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // 1. CEK DI KOLEKSI 'USERS' (Akun Utama)
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            let userData = { uid: firebaseUser.uid, ...userSnap.data() } as UserProfile;
            
            // CEK STATUS BLOKIR
            if (userData.status === 'BLOCKED') {
              await signOut(auth);
              setUser(null);
              setLoading(false);
              return;
            } 
            
            // CEK EXPIRED
            if (userData.status === 'EXPIRED' && userData.licenseExpiry && Date.now() > userData.licenseExpiry) {
               await signOut(auth);
               setUser(null);
               setLoading(false);
               return;
            }

            // MERGE DATA AKADEMIK (Jika dia Siswa)
            // Ini penting: Data Admin (di tabel students) -> Masuk ke Sesi Login
            if (userData.role === 'STUDENT') {
                userData = await mergeStudentData(userData);
            }

            setUser(userData);

          } else {
            // 2. JIKA TIDAK DI 'USERS', CARI DI 'STUDENTS' (Fallback - Unregistered User)
            const q = query(
                collection(db, "students"), 
                where("email", "==", firebaseUser.email)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const studentDoc = querySnapshot.docs[0];
                const studentData = studentDoc.data() as Student;
                
                // FIX: Spread studentData FIRST to avoid "duplicate identifier" errors
                // and explicitly map types to satisfy UserProfile
                const userProfile: UserProfile = {
                    ...studentData, // Base: ambil batch, program, classId, dll
                    
                    // Overrides & Essential Auth Fields
                    uid: studentDoc.id, 
                    email: studentData.email || firebaseUser.email || '',
                    displayName: studentData.name,
                    role: 'STUDENT',
                    status: studentData.status, // Sekarang valid karena Type UserStatus sudah diupdate
                    createdAt: studentData.createdAt,
                    photoURL: studentData.avatarUrl
                };
                
                setUser(userProfile);
            } else {
                console.warn("User/Student profile not found in Firestore.");
                setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth State Change Error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      
      // LOGIKA LOGIN MANUAL (Mirroring logic useEffect)
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        let userData = { uid: result.user.uid, ...userSnap.data() } as UserProfile;
        
        if (userData.status === 'BLOCKED') {
          await signOut(auth); 
          return { success: false, error: "Akun Anda diblokir. Hubungi Admin." };
        }
        
        if (userData.status === 'EXPIRED' && userData.licenseExpiry && Date.now() > userData.licenseExpiry) {
           await signOut(auth);
           return { success: false, error: "Lisensi akun Anda telah berakhir." };
        }

        // MERGE DATA AKADEMIK
        if (userData.role === 'STUDENT') {
            userData = await mergeStudentData(userData);
        }

        setUser(userData);
        return { success: true, user: userData };
      } else {
        // FALLBACK LOGIN: Cek Students via Email
        const q = query(
            collection(db, "students"), 
            where("email", "==", email)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const studentDoc = querySnapshot.docs[0];
            const studentData = studentDoc.data() as Student;
             
            // FIX: Consistent object construction
            const userProfile: UserProfile = {
                ...studentData,
                uid: studentDoc.id,
                email: studentData.email || email,
                displayName: studentData.name,
                role: 'STUDENT',
                status: studentData.status,
                createdAt: studentData.createdAt,
                photoURL: studentData.avatarUrl
            };
            
            setUser(userProfile);
            return { success: true, user: userProfile };
        }

        await signOut(auth);
        return { success: false, error: "Data profil pengguna/siswa tidak ditemukan." };
      }

    } catch (error: any) {
      console.error("Login Error:", error);
      let msg = "Gagal login.";
      if (error.code === 'auth/invalid-credential') msg = "Email atau password salah.";
      if (error.code === 'auth/user-not-found') msg = "Akun tidak terdaftar.";
      if (error.code === 'auth/wrong-password') msg = "Password salah.";
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};