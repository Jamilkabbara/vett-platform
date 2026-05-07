import { OverlayPage } from '../components/layout/OverlayPage';
import { Code, Lock, Zap } from 'lucide-react';

export const ApiPage = () => {
  return (
    <OverlayPage>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
            VETT API v1.0
          </h1>
          <p className="text-white/60 text-xl">
            Programmatic access to methodology-correct synthetic research.
          </p>
        </div>

        <div className="glass-panel p-12 rounded-3xl mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Closed Beta</h2>
              <p className="text-white/60">Currently invite-only</p>
            </div>
          </div>

          <p className="text-white/80 text-lg leading-relaxed mb-8">
            The API lets you programmatically create missions, gather
            synthetic respondent data, and analyze sentiment using the same
            industry-standard methodologies (Van Westendorp, MaxDiff, NPS,
            brand-health funnel, ad effectiveness) that ship in the web
            product. Perfect for integrating directional market signal into
            your product development workflow.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Code className="w-5 h-5 text-primary" />
                <h3 className="text-white font-black uppercase tracking-wider text-sm">
                  REST API
                </h3>
              </div>
              <p className="text-white/60 text-sm">
                Standard RESTful endpoints with JSON responses
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="text-white font-black uppercase tracking-wider text-sm">
                  Webhooks
                </h3>
              </div>
              <p className="text-white/60 text-sm">
                Real-time updates when missions complete
              </p>
            </div>
          </div>

          <div className="bg-background-dark/50 rounded-2xl p-6 border border-white/10">
            <p className="text-white/40 text-sm font-mono mb-4">Example Request:</p>
            <pre className="text-primary text-sm font-mono overflow-x-auto">
{`POST /v1/missions
{
  "title": "AI Wearables Survey",
  "questions": [...],
  "target_audience": "gen_z",
  "sample_size": 100
}`}
            </pre>
          </div>
        </div>

        <div className="text-center">
          <button className="px-12 py-6 rounded-full font-black text-base uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:shadow-[0_0_60px_rgba(99,102,241,0.8)] transition-all duration-500 hover:scale-105">
            Request API Access
          </button>
          <p className="text-white/40 text-sm mt-6">
            We'll review your application and get back to you within 48 hours.
          </p>
        </div>
      </div>
    </OverlayPage>
  );
};
