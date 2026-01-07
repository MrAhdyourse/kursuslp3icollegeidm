import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            // Gabungkan UID dari Auth dengan data dari Firestore agar field 'uid' tidak kosong
            const userData = { uid: firebaseUser.uid, ...docSnap.data() } as UserProfile;
            
            if (userData.status === 'BLOCKED') {
              await signOut(auth);
              setUser(null);
            } else if (userData.status === 'EXPIRED' && userData.licenseExpiry && Date.now() > userData.licenseExpiry) {
               await signOut(auth);
               setUser(null);
            } else {
               setUser(userData);
            }
          } else {
            console.warn("User profile not found in Firestore.");
            setUser(null);
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
      
      // Cek status user di Firestore setelah login berhasil
      const docRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data() as UserProfile;
        
        if (userData.status === 'BLOCKED') {
          await signOut(auth); // Tendang keluar lagi
          return { success: false, error: "Akun Anda diblokir. Hubungi Admin." };
        }
        
        if (userData.status === 'EXPIRED' && userData.licenseExpiry && Date.now() > userData.licenseExpiry) {
           await signOut(auth);
           return { success: false, error: "Lisensi akun Anda telah berakhir." };
        }

        setUser(userData);
        return { success: true };
      } else {
        // DATA TIDAK DITEMUKAN DI FIRESTORE
        await signOut(auth);
        return { success: false, error: "Data profil pengguna tidak ditemukan di database." };
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
