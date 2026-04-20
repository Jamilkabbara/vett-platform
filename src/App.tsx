import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LandingPage } from './pages/LandingPage';
import { ActiveMissionPage } from './pages/ActiveMissionPage';
import { MissionSetupPage } from './pages/MissionSetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutPage } from './pages/AboutPage';
import { CareersPage } from './pages/CareersPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { BlogPage } from './pages/BlogPage';
import { ApiPage } from './pages/ApiPage';
import { HelpPage } from './pages/HelpPage';
import { MissionSuccessPage } from './pages/MissionSuccessPage';
import { ResultsPage } from './pages/ResultsPage';
import { MissionsListPage } from './pages/MissionsListPage';
import { SignInPage } from './pages/SignInPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DesignSystemPreview } from './pages/DesignSystemPreview';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ScrollToTop } from './components/shared/ScrollToTop';

function App() {
  const [idea, setIdea] = useState('');

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        containerStyle={{
          top: 80,
          zIndex: 9999,
        }}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#111111',
            color: '#FFFFFF',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 9999,
          },
          success: {
            iconTheme: {
              primary: '#DFFF00',
              secondary: '#111111',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF4D4D',
              secondary: '#111111',
            },
          },
          loading: {
            iconTheme: {
              primary: '#DFFF00',
              secondary: '#111111',
            },
          },
        }}
      />
      <div className="w-full min-h-[100dvh] bg-[#0B0C15] flex justify-center overflow-x-hidden pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        <div className="w-full max-w-full lg:max-w-[1920px] flex flex-col relative">
          <ScrollToTop />
          <Routes>
          <Route path="/" element={<Navigate to="/landing" replace />} />
          <Route path="/landing" element={<LandingPage idea={idea} setIdea={setIdea} />} />
          <Route path="/setup" element={<MissionSetupPage />} />
          <Route path="/mission-control" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
          <Route path="/missions" element={<MissionsListPage />} />
          <Route path="/active" element={<ActiveMissionPage />} />
          <Route path="/mission-active" element={<ActiveMissionPage />} />
          <Route path="/dashboard" element={<MissionsListPage />} />
          <Route path="/dashboard/:missionId" element={<DashboardPage />} />
          <Route path="/mission/:missionId" element={<ActiveMissionPage />} />
          <Route path="/mission-success" element={<MissionSuccessPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Auth — full-page replacements for the old AuthModal. */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<Navigate to="/signin?tab=signup" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Redirect old/obsolete routes to setup */}
          <Route path="/create" element={<Navigate to="/setup" replace />} />
          <Route path="/wizard" element={<Navigate to="/setup" replace />} />
          <Route path="/context" element={<Navigate to="/setup" replace />} />
          <Route path="/survey-setup" element={<Navigate to="/setup" replace />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/api" element={<ApiPage />} />
          <Route path="/help" element={<HelpPage />} />

          {/* Internal design-system preview — not linked from the app. */}
          <Route path="/__design" element={<DesignSystemPreview />} />

          <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
