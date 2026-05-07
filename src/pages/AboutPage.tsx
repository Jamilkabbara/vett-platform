import { OverlayPage } from '../components/layout/OverlayPage';
// Pass 31 Z1 — `Users` icon swapped for `Brain` to signal "synthetic
// respondents + methodology rigor" instead of the old (false) "real
// humans" framing.
import { Target, Brain, Zap } from 'lucide-react';

export const AboutPage = () => {
  return (
    <OverlayPage>
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-tight">
            We are killing the{' '}
            <span className="text-primary">'Gut Feeling'.</span>
          </h1>
          <p className="text-white/60 text-xl">
            Because your business deserves better than hunches.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16 items-stretch">
          <div className="flex flex-col">
            <div className="glass-panel rounded-3xl p-8 border-white/10 bg-background-dark/50 flex-1 flex flex-col justify-between h-full">
              <div className="space-y-6 text-white/70 text-lg leading-relaxed">
                <p>
                  Business history is littered with brilliant ideas that failed because they solved a
                  problem nobody had. We built VETT to ensure that never happens to you.
                </p>

                <p>
                  For decades, 'Market Research' was a luxury asset guarded by expensive agencies. It
                  cost $20,000 and took 4 weeks. We believe the kid in the dorm room deserves the
                  same truth as the CEO in the boardroom.
                </p>

                <p>
                  We don&apos;t sell validation. We sell honest research. We use AI
                  to build methodology-correct surveys and to simulate audience
                  responses through synthetic respondents calibrated to real
                  demographic patterns. The AI is the engine — but the methodology
                  is what makes the output trustworthy.
                </p>

                <div className="pt-6 border-t border-white/10">
                  <p className="text-primary font-black text-2xl italic">
                    "Stop betting on luck. Start betting on data."
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between h-full space-y-6">
            <div className="glass-panel rounded-3xl p-8 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-white font-black text-xl">Our Mission</h3>
              </div>
              <p className="text-white/60 leading-relaxed">
                Democratize market intelligence. Make world-class research accessible to every builder,
                not just Fortune 500 companies.
              </p>
            </div>

            <div className="glass-panel rounded-3xl p-8 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-white font-black text-xl">Methodology First</h3>
              </div>
              <p className="text-white/60 leading-relaxed">
                Every survey runs an industry-standard methodology — Van Westendorp
                pricing, MaxDiff feature prioritization, NPS, brand-health funnel —
                with synthetic respondents calibrated to real demographic patterns.
                The methodology is what makes the output trustworthy, not the panel.
                See the full{' '}
                <a href="/methodologies" className="text-primary hover:underline">
                  methodology library
                </a>{' '}
                for every framework we support.
              </p>
            </div>

            <div className="glass-panel rounded-3xl p-8 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-white font-black text-xl">Speed Matters</h3>
              </div>
              <p className="text-white/60 leading-relaxed">
                Get actionable insights in hours, not weeks. Speed without sacrificing quality or accuracy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </OverlayPage>
  );
};
