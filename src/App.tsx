import React, { useState, Component, type ErrorInfo, type ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ResponsiveLayoutWrapper as Layout } from './components/ResponsiveLayoutWrapper';
import { useAuth } from './context/AuthContext';
import { SplashScreen } from './components/SplashScreen';
import { PageTransition } from './components/PageTransition';
import { Toaster } from 'react-hot-toast';

// ... (Imports Pages) ...
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Reports from './pages/Reports';
import Settings from './pages/SettingsPage'; // Renamed import
import Login from './pages/Login';
import CareerSimulator from './pages/CareerSimulator';
import Classmates from './pages/Classmates';
import ExamRoom from './pages/ExamRoom';
import NotFound from './pages/NotFound'; // Import 404

// --- ERROR BOUNDARY ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
          <h1 className="text-3xl font-black text-slate-800 mb-2">Terjadi Kesalahan Sistem</h1>
          <p className="text-slate-500 mb-6 max-w-md">
            Aplikasi mengalami crash. Silakan refresh halaman atau hubungi admin.
          </p>
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-mono text-xs text-left w-full max-w-lg overflow-auto mb-6">
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Refresh Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ... (ProtectedRoute Component) ...
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Cek apakah splash sudah pernah tampil di sesi ini
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splash_shown');
  });

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
    return (
      <SplashScreen 
        onFinish={() => {
          sessionStorage.setItem('splash_shown', 'true');
          setShowSplash(false);
        }} 
      />
    );
  }

  return children;
};

function AppRoutes() {
  const location = useLocation(); 

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
        <Route path="/career" element={
          <ProtectedRoute>
            <Layout>
              <PageTransition><CareerSimulator /></PageTransition>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/classmates" element={
          <ProtectedRoute>
            <Layout>
              <PageTransition><Classmates /></PageTransition>
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* HALAMAN UJIAN (STANDALONE - TANPA LAYOUT) */}
        <Route path="/exam" element={
          <ProtectedRoute>
            <PageTransition><ExamRoom /></PageTransition>
          </ProtectedRoute>
        } />

        {/* 404 CATCH ALL */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff' } }} />
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;