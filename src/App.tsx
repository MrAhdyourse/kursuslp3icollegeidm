import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SplashScreen } from './components/SplashScreen';
import { PageTransition } from './components/PageTransition';

// Pages
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';

// Komponen Penjaga Pintu (Guard)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // ... (kode sama)
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return children;
};

function AppRoutes() {
  const location = useLocation(); // Kunci agar animasi jalan saat ganti URL

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <PageTransition><Login /></PageTransition>
        } />
        
        {/* Rute yang Dilindungi */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <PageTransition><Dashboard /></PageTransition>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/students" element={
          <ProtectedRoute>
            <Layout>
              <PageTransition><Students /></PageTransition>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Layout>
              <PageTransition><Reports /></PageTransition>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <PageTransition><Settings /></PageTransition>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;