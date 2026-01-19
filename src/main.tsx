import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'

console.log("[Main] App initializing..."); // DEBUG LOG

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <HashRouter>
      <App />
    </HashRouter>
  </AuthProvider>
)
