import { Link } from 'react-router-dom';
import { ChevronRight, Beaker, Sparkles } from 'lucide-react';
import { OverlayPage } from '../components/layout/OverlayPage';

/**
 * Pass 32 C1 — /methodologies marketing page.
 *
 * Single canonical list of every research methodology VETT supports,
 * with the academic grounding for each one. Honest framing throughout:
 *   - "synthetic respondents" not "real consumers"
 *   - methodology binding called out explicitly
 *   - in-progress methodologies marked as such (not pretended-shipped)
 *
 * Lives at /methodologies. Links from llms.txt, /help, and the
 * landing-page nav.
 */

interface Methodology {
  id: string;
  name: string;
  short: string;
  detail: string;
  framework: string;
  startsAt: string;
  status: 'live' | 'in_progress';
  goalId?: string;
}

const METHODOLOGIES: Methodology[] = [
  {
    id: 'validate',
    name: 'Concept Test',
    short: 'Single-concept monadic acceptance for product ideas before you build.',
    detail: 'Each persona evaluates the concept on uniqueness, relevance, believability, and purchase intent. Output: composite acceptance score, persona-level objections, demographic cuts.',
    framework: 'Monadic concept acceptance — borrowed from BASES / ASSESSOR with synthetic-respondent simulation.',
    startsAt: '$9',
    status: 'live',
    goalId: 'validate',
  },
  {
    id: 'compare',
    name: 'Sequential Monadic Comparison',
    short: 'Compare 2–5 concepts head-to-head with rotation balancing.',
    detail: 'Each persona evaluates one concept at a time in randomized order. Output: per-concept scores, head-to-head winner, demographic-segmented preference, rotation-bias diagnostic.',
    framework: 'Sequential monadic with Latin-square rotation — standard concept-comparison protocol.',
    startsAt: '$35',
    status: 'live',
    goalId: 'compare',
  },
  {
    id: 'marketing',
    name: 'Ad Effectiveness',
    short: 'Test ad copy, visuals, and messaging before you spend on media.',
    detail: 'Per-ad scoring on attention, relevance, intended message, brand fit, and call-to-action clarity. Output: KPI panel, channel/format fit, message-association strength.',
    framework: 'Ad effectiveness diagnostics — Millward Brown LinkPlus / System1-style framework adapted for synthetic personas.',
    startsAt: '$35',
    status: 'live',
    goalId: 'marketing',
  },
  {
    id: 'creative_attention',
    name: 'Creative Attention',
    short: 'Frame-by-frame attention prediction + emotion taxonomy on video and static creative.',
    detail: 'Per-frame analysis of 24 emotions (Plutchik 8 + 16 nuanced), attention decay curves, distinctive brand asset score, channel-specific predicted dwell time, platform fit.',
    framework: 'Attention prediction calibrated to TVision / Lumen industry norms; emotion taxonomy from peer-reviewed Plutchik + research-derived nuanced set.',
    startsAt: '$19',
    status: 'live',
    goalId: 'creative_attention',
  },
  {
    id: 'brand_lift',
    name: 'Brand Lift',
    short: 'Pre/post incrementality across 9 brand-health KPIs.',
    detail: 'Exposed vs control split with calibrated lift sizes (aided recall +20-40pp, awareness +5-15pp, consideration +3-10pp, intent +2-8pp, NPS +1-4 pts). Industry-standard 9-category framework.',
    framework: 'Incrementality study with exposed/control simulation — based on Nielsen Brand Effect / Kantar Brand Lift methodology.',
    startsAt: '$99',
    status: 'live',
    goalId: 'brand_lift',
  },
  {
    id: 'pricing',
    name: 'Pricing Research',
    short: 'Find the price point that maximizes revenue.',
    detail: 'Van Westendorp Price Sensitivity Meter (PSM) for acceptable price range + Gabor-Granger for direct willingness-to-pay distribution. Output: optimum price point, indifference price, marginal cheap/expensive thresholds.',
    framework: 'Van Westendorp (1976) + Gabor-Granger (1965) — peer-reviewed pricing-research methodologies.',
    startsAt: '$99',
    status: 'live',
    goalId: 'pricing_research',
  },
  {
    id: 'feature_roadmap',
    name: 'Feature Roadmap',
    short: 'Let your audience tell you what to build next.',
    detail: 'MaxDiff (best-worst scaling) for feature prioritization + Kano model for must-have / performance / delighter classification. Output: ranked feature list, Kano quadrant chart, must-have threshold.',
    framework: 'MaxDiff (Sawtooth) + Kano model (1984) — gold-standard feature-prioritization frameworks.',
    startsAt: '$99',
    status: 'live',
    goalId: 'feature_roadmap',
  },
  {
    id: 'customer_satisfaction',
    name: 'Customer Satisfaction',
    short: 'NPS + CSAT + CES across any touchpoint.',
    detail: 'Net Promoter Score (Reichheld), Customer Satisfaction Score, Customer Effort Score — all three on a single mission with touchpoint anchoring + recency window control.',
    framework: 'Reichheld NPS (2003) + CSAT + CES — industry-standard satisfaction trio.',
    startsAt: '$99',
    status: 'live',
    goalId: 'customer_satisfaction',
  },
  {
    id: 'competitor',
    name: 'Brand Health Tracker',
    short: 'Benchmark against competitors across attribute dimensions.',
    detail: 'Per-brand awareness funnel (aware → consider → prefer → recommend), attribute battery scoring across 6-12 attributes, competitive heatmap, share-of-voice estimate.',
    framework: 'Brand health tracking — Kantar BrandZ / Millward Brown attribute-equity framework.',
    startsAt: '$99',
    status: 'live',
    goalId: 'competitor_analysis',
  },
  {
    id: 'naming_messaging',
    name: 'Naming & Messaging',
    short: 'Test names, taglines, and positioning across audience.',
    detail: 'Three test types: monadic (single name), paired comparison (head-to-head), or TURF reach (which combination of names captures the most audience). Output: per-name memorability, fit, and reach scores.',
    framework: 'Monadic + paired comparison + TURF (Total Unduplicated Reach and Frequency) — established naming-research toolkit.',
    startsAt: '$35',
    status: 'live',
    goalId: 'naming_messaging',
  },
  {
    id: 'churn_research',
    name: 'Churn Research',
    short: 'Why customers leave and what would bring them back.',
    detail: 'Driver tree: surfaces the top reasons for churn ranked by mention rate + impact. Win-back: per-segment offer testing (discount, feature, service tier) to identify what would re-engage churned users.',
    framework: 'Churn driver-tree analysis + win-back offer testing — combined retention-research framework.',
    startsAt: '$99',
    status: 'live',
    goalId: 'churn_research',
  },
  {
    id: 'audience_profiling',
    name: 'Audience Profiling',
    short: 'K-means segmentation across psychographic + behavioral attributes.',
    detail: 'Generate a population, run K-means clustering on the response matrix, surface 3-5 segments with prototype personas, decision drivers, and addressable size.',
    framework: 'K-means clustering segmentation — McKinsey-style psychographic profiling.',
    startsAt: '$99',
    status: 'in_progress',
    goalId: 'audience_profiling',
  },
  {
    id: 'market_entry',
    name: 'Market Entry',
    short: 'Validate demand before expanding to a new geography.',
    detail: 'Multi-market routing: per-country persona generation, parallel simulation, cross-market deltas on awareness, intent, willingness-to-pay, and category fit.',
    framework: 'Combined market-entry framework with country-specific persona conditioning.',
    startsAt: '$99',
    status: 'in_progress',
    goalId: 'market_entry',
  },
];

export const MethodologiesPage = () => {
  const live = METHODOLOGIES.filter(m => m.status === 'live');
  const inProgress = METHODOLOGIES.filter(m => m.status === 'in_progress');

  return (
    <OverlayPage>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Beaker className="w-8 h-8 text-primary" />
          <span className="text-xs font-black text-primary uppercase tracking-widest">
            Methodology First
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
          Research methodologies
        </h1>
        <p className="text-white/60 text-xl mb-16 max-w-3xl">
          Every VETT mission runs an industry-standard research framework.
          The methodologies themselves — Van Westendorp pricing, MaxDiff
          feature prioritization, NPS, brand-health funnel — are
          peer-reviewed in the academic literature. VETT outputs are
          synthetic-respondent simulations of those frameworks, not
          panel-grade truth.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {live.map((m) => (
            <Link
              key={m.id}
              to={m.goalId ? `/setup?goal=${m.goalId}` : '/setup'}
              className="block glass-panel rounded-2xl border border-white/5 hover:border-primary/40 transition-all p-6 group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors">
                  {m.name}
                </h3>
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                  {m.startsAt}
                </span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                {m.short}
              </p>
              <div className="border-t border-white/5 pt-4 mt-4">
                <p className="text-white/50 text-xs leading-relaxed mb-3">
                  {m.detail}
                </p>
                <p className="text-white/40 text-[11px] italic leading-relaxed">
                  {m.framework}
                </p>
              </div>
              <div className="flex items-center justify-end gap-1 mt-4 text-primary text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Start a mission <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>

        {inProgress.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary/70" />
              <h2 className="text-xs font-black text-primary/70 uppercase tracking-widest">
                In progress — coming soon
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {inProgress.map((m) => (
                <div
                  key={m.id}
                  className="glass-panel rounded-2xl border border-white/5 p-6 opacity-60"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-black text-white">{m.name}</h3>
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-white/5 text-white/50 text-xs font-black uppercase tracking-widest">
                      Soon
                    </span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed mb-4">
                    {m.short}
                  </p>
                  <div className="border-t border-white/5 pt-4 mt-4">
                    <p className="text-white/50 text-xs leading-relaxed mb-3">
                      {m.detail}
                    </p>
                    <p className="text-white/40 text-[11px] italic leading-relaxed">
                      {m.framework}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center glass-panel p-12 rounded-3xl border border-white/5">
          <h3 className="text-2xl font-black text-white mb-4">
            Not sure which methodology fits?
          </h3>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Start a mission and the setup advisor will pick the right one
            based on your research question.
          </p>
          <Link
            to="/setup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest bg-[#DFFF00] hover:bg-[#E5FF40] text-black shadow-lg shadow-[#DFFF00]/30 transition-all duration-300 hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            Start a mission
          </Link>
        </div>
      </div>
    </OverlayPage>
  );
};

export default MethodologiesPage;
