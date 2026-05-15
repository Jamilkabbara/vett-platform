import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';

// Pass 42 H1 — redirect *.vercel.app preview URLs to the canonical
// production domain. Backend CORS only allows https://www.vettit.ai
// and https://vettit.ai; preview deployments at
// vett-platform-XXXX-jamil-kabbaras-projects.vercel.app pass CORS
// but customer-shared links to preview hosts trigger "Failed to
// fetch" customer-confusion bugs. Redirect is a no-op for
// production hits and bounces previews to www.vettit.ai before any
// other code runs.
if (typeof window !== 'undefined') {
  const host = window.location.host;
  if (host.endsWith('.vercel.app') && host !== 'www.vettit.ai' && host !== 'vettit.ai') {
    const target = `https://www.vettit.ai${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(target);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
);
