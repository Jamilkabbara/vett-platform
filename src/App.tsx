import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ScrollToTop } from './components/shared/ScrollToTop';
import { PageLoader } from './components/shared/PageLoader';
import { replayFunnelQueue } from './lib/funnelTrack';
// Pass 29 A3 — LandingPage imported eagerly. It's the canonical entry
// point for cold visitors (every other page is gated on auth or a
// direct link), so the lazy-load round-trip costs an unavoidable
// extra RTT on the most common LCP path. Importing eagerly merges
// the LandingPage chunk into the main bundle, dropping one fetch
// from the cold-load critical path on /landing. Other pages stay
// lazy — direct visitors to /dashboard / /setup / /vs/* still pay
// only their own chunk's cost.
import { LandingPage } from './pages/LandingPage';

// ---------------------------------------------------------------------------
// Lazy-loaded pages — each becomes its own async chunk.
// All pages use named exports, so we must re-export as `default`.
// ---------------------------------------------------------------------------
const ActiveMissionPage   = lazy(() => import('./pages/ActiveMissionPage').then(m => ({ default: m.ActiveMissionPage })));
const MissionSetupPage    = lazy(() => import('./pages/MissionSetupPage').then(m => ({ default: m.MissionSetupPage })));
const DashboardPage       = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProfilePage         = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AboutPage           = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const CareersPage         = lazy(() => import('./pages/CareersPage').then(m => ({ default: m.CareersPage })));
const ContactPage         = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
// Pass 24 Bug 24.03 — legal pages backed by canonical markdown in
// src/content/legal/*.md. Old PrivacyPage / TermsPage stubs replaced.
const PrivacyPolicyPage   = lazy(() => import('./pages/legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage  = lazy(() => import('./pages/legal/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));
const RefundPolicyPage    = lazy(() => import('./pages/legal/RefundPolicyPage').then(m => ({ default: m.RefundPolicyPage })));
const BlogPage            = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogPostPage        = lazy(() => import('./pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const ApiPage             = lazy(() => import('./pages/ApiPage').then(m => ({ default: m.ApiPage })));
const HelpPage            = lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));
// Pass 32 C1 — single canonical list of every research methodology.
const MethodologiesPage   = lazy(() => import('./pages/MethodologiesPage').then(m => ({ default: m.MethodologiesPage })));
const MissionSuccessPage  = lazy(() => import('./pages/MissionSuccessPage').then(m => ({ default: m.MissionSuccessPage })));
// Pass 23 Bug 23.0e v2 — Stripe Checkout success/cancel landing pages.
const PaymentSuccessPage  = lazy(() => import('./pages/PaymentSuccessPage').then(m => ({ default: m.PaymentSuccessPage })));
const PaymentCancelPage   = lazy(() => import('./pages/PaymentCancelPage').then(m => ({ default: m.PaymentCancelPage })));
const ResultsPage         = lazy(() => import('./pages/ResultsPage').then(m => ({ default: m.ResultsPage })));
// Pass 25 Phase 0.2 — central router that probes mission.goal_type and
// dispatches to the right results page. /results/:id used to mount
// ResultsPage directly which broke for creative_attention missions.
const ResultsRouter       = lazy(() => import('./pages/ResultsRouter').then(m => ({ default: m.ResultsRouter })));
const MissionsListPage    = lazy(() => import('./pages/MissionsListPage').then(m => ({ default: m.MissionsListPage })));
const SignInPage          = lazy(() => import('./pages/SignInPage').then(m => ({ default: m.SignInPage })));
const ForgotPasswordPage  = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage   = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const AdminPage           = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const DesignSystemPreview           = lazy(() => import('./pages/DesignSystemPreview').then(m => ({ default: m.DesignSystemPreview })));
const CreativeAttentionPage         = lazy(() => import('./pages/CreativeAttentionPage').then(m => ({ default: m.CreativeAttentionPage })));
const CreativeAttentionResultsPage  = lazy(() => import('./pages/CreativeAttentionResultsPage').then(m => ({ default: m.CreativeAttentionResultsPage })));
// Pass 23 B2 — comparison pages. SurveyMonkey is the template;
// expansion pages (typeform / usertesting / pollfish / traditional)
// ship via Pass 23 Agent 3 fan-out after voice/tone sign-off.
const VsSurveyMonkeyPage            = lazy(() => import('./pages/vs/VsSurveyMonkeyPage').then(m => ({ default: m.VsSurveyMonkeyPage })));
const VsTypeformPage                = lazy(() => import('./pages/vs/VsTypeformPage').then(m => ({ default: m.VsTypeformPage })));
const VsUserTestingPage             = lazy(() => import('./pages/vs/VsUserTestingPage').then(m => ({ default: m.VsUserTestingPage })));
const VsPollfishPage                = lazy(() => import('./pages/vs/VsPollfishPage').then(m => ({ default: m.VsPollfishPage })));
const VsTraditionalPage             = lazy(() => import('./pages/vs/VsTraditionalPage').then(m => ({ default: m.VsTraditionalPage })));

function App() {
  // Pass 22 Bug 22.1 — drain any funnel events that got queued in
  // localStorage during a prior session (offline / network blip / browser
  // crash mid-emit). Best-effort; never blocks render.
  useEffect(() => {
    replayFunnelQueue().catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        containerStyle={{
          top: 80,
          // Must render above the highest modal in the app. The payment
          // modal is at z-[10000]; bumping the Toaster to 10100 keeps error
          // toasts visible when the modal is open — otherwise a payment
          // failure's toast renders behind the backdrop and the user sees
          // the spinner revert with "no error."
          zIndex: 10100,
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
            zIndex: 10100,
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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/landing" replace />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/setup" element={<MissionSetupPage />} />
              <Route path="/mission-control" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
              <Route path="/missions" element={<MissionsListPage />} />
              <Route path="/active" element={<ActiveMissionPage />} />
              <Route path="/mission-active" element={<ActiveMissionPage />} />
              <Route path="/dashboard" element={<MissionsListPage />} />
              <Route path="/dashboard/:missionId" element={<DashboardPage />} />
              <Route path="/mission/:missionId" element={<ActiveMissionPage />} />
              <Route path="/mission/:missionId/live" element={<ActiveMissionPage />} />
              <Route path="/mission-success" element={<MissionSuccessPage />} />

              {/* Pass 23 Bug 23.0e v2 — Stripe Checkout redirect landing pages. */}
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
              <Route path="/payment-cancel" element={<PaymentCancelPage />} />

              <Route path="/results/:missionId" element={<ResultsRouter />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Auth — full-page replacements for the old AuthModal. */}
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<Navigate to="/signin?tab=signup" replace />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/admin" element={<AdminPage />} />

              {/* Redirect old/obsolete routes to setup */}
              <Route path="/create" element={<Navigate to="/setup" replace />} />
              <Route path="/wizard" element={<Navigate to="/setup" replace />} />
              <Route path="/context" element={<Navigate to="/setup" replace />} />
              <Route path="/survey-setup" element={<Navigate to="/setup" replace />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/contact" element={<ContactPage />} />
              {/* Pass 24 Bug 24.03 — legal pages */}
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/refunds" element={<RefundPolicyPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/api" element={<ApiPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/methodologies" element={<MethodologiesPage />} />

              {/* Creative Attention Analysis */}
              <Route path="/creative-attention/new" element={<CreativeAttentionPage />} />
              <Route path="/creative-results/:missionId" element={<CreativeAttentionResultsPage />} />

              {/* Pass 23 B2 — comparison pages */}
              <Route path="/vs/surveymonkey" element={<VsSurveyMonkeyPage />} />
              <Route path="/vs/typeform" element={<VsTypeformPage />} />
              <Route path="/vs/usertesting" element={<VsUserTestingPage />} />
              <Route path="/vs/pollfish" element={<VsPollfishPage />} />
              <Route path="/vs/traditional" element={<VsTraditionalPage />} />

              {/* Internal design-system preview — not linked from the app. */}
              <Route path="/__design" element={<DesignSystemPreview />} />

              <Route path="*" element={<Navigate to="/landing" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
