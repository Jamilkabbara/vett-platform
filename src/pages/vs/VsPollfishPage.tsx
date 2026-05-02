/**
 * Pass 23 B2 expansion - VETT vs Pollfish comparison page.
 *
 * Route: /vs/pollfish
 *
 * Pollfish is a mobile-first DSP-integrated panel: real respondents
 * captured in-app via SDK partnerships, CPI pricing, real-time delivery.
 * VETT is synthetic. Different supply mechanisms; closer head-to-head
 * on the "fast quantitative survey" job than UserTesting was.
 *
 * Pricing on this page is hedged with cite-and-date because pollfish.com
 * was returning a TLS error on WebFetch at the time of writing - readers
 * are pointed to the live pricing page for current numbers.
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OverlayPage } from '../../components/layout/OverlayPage';
import { Check, X, ArrowRight, Zap, DollarSign, Globe, Sparkles } from 'lucide-react';

interface ComparisonRow {
  dimension: string;
  vett: string;
  competitor: string;
  vettWins: boolean;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { dimension: 'Respondent type',                 vett: 'AI personas generated to your screener',                        competitor: 'Real mobile users captured in-app via SDK partner network', vettWins: false },
  { dimension: 'Time to first insight',           vett: 'Minutes',                                                       competitor: 'Hours; sometimes minutes for low-friction screeners',  vettWins: true  },
  { dimension: 'Cost per respondent',             vett: '$0.40 - $3.50',                                                 competitor: 'CPI model; varies by demographic and survey length (check pollfish.com/pricing)', vettWins: false },
  { dimension: 'Pricing model',                   vett: 'Per mission ($9-$1,990 flat); no subscription',                 competitor: 'Pay-as-you-go CPI + minimum spend per study',          vettWins: true  },
  { dimension: 'Sample size per study',           vett: '5-5,000 personas per mission',                                  competitor: 'Hundreds to tens of thousands; depends on demographic supply', vettWins: false },
  { dimension: 'Screener strictness',             vett: 'Constraint-based generation - personas are generated TO the spec', competitor: 'Filter-based on real-mobile-user attributes; strict screeners cost more or take longer', vettWins: true  },
  { dimension: 'AI insight synthesis',            vett: 'Built-in: executive summary, contradictions, cross-cut',        competitor: 'Reporting dashboard + cross-tabs; AI synthesis layer is not the core deliverable', vettWins: true  },
  { dimension: 'Brand lift framework',            vett: 'Built-in 9-category Happydemics-style framework',               competitor: 'Templates available; methodology is DIY',              vettWins: true  },
  { dimension: 'Creative attention analysis',     vett: 'Frame-by-frame emotion, attention, message clarity for $19/asset', competitor: 'Concept-test templates; not frame-by-frame',          vettWins: true  },
  { dimension: 'Geographic reach',                vett: '193 countries (full ISO list, AI-modelled)',                    competitor: 'Strong supply in EU + emerging markets via mobile partners; coverage varies by country', vettWins: false },
  { dimension: 'Mobile-only audience',            vett: 'Targetable via screener (any device)',                          competitor: 'Native to product - all respondents are mobile users by definition', vettWins: false },
  { dimension: 'Best for...',                     vett: 'Pre-launch validation, brand-lift baselines, creative attention, screener-strict niches', competitor: 'Fast quantitative surveys to mobile users where real-respondent supply matters', vettWins: false },
];

const FAQS = [
  {
    q: 'Pollfish has real mobile users. Why use VETT?',
    a: "If real-respondent supply matters to you - because the deliverable is going to a stakeholder who needs to see \"verified humans\" or because you're testing creative reaction in a market where AI training data is thin - Pollfish is the right tool. VETT shines when you'd rather have AI-synthesised insight, screener-strict niches that real-panel supply struggles with, brand-lift framework or creative-attention output, or pre-launch validation where you don't have an audience or panel budget yet. Many teams use both: VETT for the cheap fast iteration loops ($9-$99 per round), Pollfish for the pre-launch real-respondent confirmation.",
  },
  {
    q: 'Can VETT match Pollfish on cost per respondent?',
    a: "VETT's cost per respondent is $0.40-$3.50 depending on tier (effective rate at $9 for 5 personas is $1.80; at $99 for 50 is $1.98; at $899 for 1,000 is $0.90). Pollfish's CPI varies by demographic targeting and survey length - typically a few dollars per completed interview, sometimes higher for niche demos or strict screeners (check pollfish.com/pricing for current numbers). On unit cost they're often in the same ballpark; the difference is what the unit IS - a synthetic persona response (VETT) vs a real mobile user response (Pollfish).",
  },
  {
    q: 'Where is Pollfish stronger geographically?',
    a: "Pollfish's supply is strongest in markets with deep mobile SDK integration: EU, parts of SEA, and tier-1 emerging markets where their app-publisher partner network has scale. They publish their country-coverage list - check it before committing to a study. VETT's coverage is AI-modelled across 193 countries (full ISO list, src/data/targetingOptions.ts), which means usable signal even in markets where Pollfish's real-supply is patchy. The trade-off: real respondents in Pollfish-strong countries vs synthetic personas everywhere.",
  },
  {
    q: 'Can I run the same study on VETT and Pollfish to compare?',
    a: "Yes - many teams do this on a small Sniff Test ($9, 5 personas) before committing to a full Pollfish run. The directional signal from a 5-persona VETT mission usually matches the eventual Pollfish result on the dominant question (which option wins, which segment cares most). Where they diverge: open-text emotional nuance and brand-recall depth on niche products. We recommend the cheap VETT pass first as a sanity check, then a Pollfish study at scale if the concept survives.",
  },
  {
    q: 'Does VETT do mobile-only audience targeting?',
    a: "Yes, but differently. VETT's screener accepts \"smartphone-only respondents\" or \"daily mobile-app users\" as targeting criteria, and the AI generates personas matching that profile. What VETT does not do is verify that those personas are actually using mobile devices the way Pollfish does (Pollfish's whole point is that respondents are caught in-app). If \"the respondent must demonstrably be on a phone right now\" is the requirement, Pollfish is the right tool. If \"the respondent's profile fits a mobile-first user persona\" is enough, VETT works.",
  },
  {
    q: 'Where does VETT lose to Pollfish?',
    a: 'Three real things: (1) Real-respondent supply - Pollfish hands you actual humans answering on actual phones; we hand you AI-modelled persona responses. For high-stakes decisions where verified-human is the requirement, that gap matters. (2) Mobile-native targeting - "this respondent is on iOS right now" is a Pollfish-only deliverable; we can target mobile-using personas but not verify the moment-of-response device. (3) Stakeholder credibility for "real consumer" claims - "1,000 real mobile respondents in 5 countries" reads stronger than "1,000 synthetic personas matching the same screener" to a board or a regulator. We tell users: pair us. VETT for the cheap iteration loops; Pollfish for the pre-launch real-respondent confirmation.',
  },
];

const OTHER_COMPARISONS = [
  { slug: 'surveymonkey', label: 'VETT vs SurveyMonkey' },
  { slug: 'typeform',     label: 'VETT vs Typeform' },
  { slug: 'usertesting',  label: 'VETT vs UserTesting' },
  { slug: 'traditional',  label: 'VETT vs traditional research agencies' },
];

export function VsPollfishPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'VETT vs Pollfish: Which Is Right for You?';

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    setMeta('description', "VETT vs Pollfish side-by-side. Synthetic AI personas vs mobile-first real-respondent panel. Speed, cost, screener strictness, AI synthesis, geographic reach.");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.getAttribute('href') ?? '';
    canonical.setAttribute('href', 'https://www.vettit.ai/vs/pollfish');

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'vs-pollfish-faq-schema';
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      setMeta('description', prevDesc);
      canonical?.setAttribute('href', prevCanonical);
      document.getElementById('vs-pollfish-faq-schema')?.remove();
    };
  }, []);

  return (
    <OverlayPage>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <header className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/60 mb-5">
            Comparison · VETT vs Pollfish
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight mb-4">
            VETT vs Pollfish: Which Is Right for You?
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl leading-relaxed">
            Pollfish is mobile-first real respondents captured in-app.
            VETT is AI-modelled personas generated to your screener.
            Both fast quantitative; different supply mechanisms.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary text-xs font-black uppercase tracking-widest">90-second TL;DR</span>
          </div>
          <ul className="space-y-3 text-white/80 text-base leading-relaxed">
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Speed:</strong> VETT in minutes; Pollfish in hours-to-minutes depending on demographic supply.</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Screener strictness:</strong> VETT generates personas TO your spec - no waiting for real-mobile supply to satisfy a tight filter.</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">AI synthesis:</strong> Built into VETT. Pollfish has reporting + cross-tabs but synthesis is mostly DIY.</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Pricing model:</strong> VETT $9-$1,990 flat per mission. Pollfish CPI + minimum spend per study.</span></li>
            <li className="flex gap-3"><X className="w-5 h-5 text-white/40 shrink-0 mt-0.5" /><span><strong className="text-white">Real respondents:</strong> Pollfish wins. Real mobile users captured in-app via SDK partner network.</span></li>
            <li className="flex gap-3"><X className="w-5 h-5 text-white/40 shrink-0 mt-0.5" /><span><strong className="text-white">Mobile-native targeting:</strong> Pollfish wins. "This respondent is on iOS right now" is theirs by definition.</span></li>
          </ul>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-6">Side-by-side comparison</h2>

          <div className="sm:hidden space-y-3">
            {COMPARISON_ROWS.map((row) => (
              <div key={row.dimension} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-3">{row.dimension}</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    {row.vettWins && <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-0.5">VETT</p>
                      <p className="text-white text-sm leading-relaxed">{row.vett}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    {!row.vettWins && <Check className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-0.5">Pollfish</p>
                      <p className="text-white/60 text-sm leading-relaxed">{row.competitor}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left px-4 py-3 text-white/60 font-bold uppercase tracking-widest text-xs">Dimension</th>
                    <th className="text-left px-4 py-3 text-primary font-black uppercase tracking-widest text-xs">VETT</th>
                    <th className="text-left px-4 py-3 text-white/60 font-black uppercase tracking-widest text-xs">Pollfish</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.dimension} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white/70 font-semibold align-top">{row.dimension}</td>
                      <td className="px-4 py-3 text-white align-top">
                        <span className="inline-flex items-start gap-2">
                          {row.vettWins && <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                          <span>{row.vett}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/60 align-top">
                        <span className="inline-flex items-start gap-2">
                          {!row.vettWins && <Check className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />}
                          <span>{row.competitor}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6 mb-14">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-white/70" />
              <h3 className="text-xl font-black text-white">When to use Pollfish</h3>
            </div>
            <ul className="space-y-3 text-white/70 text-base leading-relaxed">
              <li>You need real respondents on a mobile device, captured in-app, with verified human behaviour.</li>
              <li>Your audience is in markets where Pollfish has strong SDK-partner supply (EU, tier-1 SEA).</li>
              <li>You're presenting findings to stakeholders who need "verified mobile respondents" framing.</li>
              <li>You need scale - Pollfish can deliver tens of thousands of completes when supply allows.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-black text-primary">When to use VETT</h3>
            </div>
            <ul className="space-y-3 text-white/80 text-base leading-relaxed">
              <li>Pre-launch validation where you can't yet justify CPI + minimum-spend overhead.</li>
              <li>Strict screeners (high-income + niche profession + market) where real-panel supply is thin.</li>
              <li>You want AI synthesis (executive summary, tensions, cross-cut) baked in, not a DIY analyst step.</li>
              <li>You want a brand-lift baseline or creative-attention scorecard - both are templated in VETT.</li>
              <li>Your audience is in markets (MENA, parts of Africa) where Pollfish supply is patchy.</li>
              <li>You're price-sensitive: $9-$299 covers most early-stage iteration cycles.</li>
            </ul>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-6">FAQ</h2>
          <div className="space-y-4">
            {FAQS.map((f, i) => (
              <details key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 group" open={i === 0}>
                <summary className="cursor-pointer text-white font-bold text-base list-none flex items-center justify-between gap-3">
                  <span>{f.q}</span>
                  <span className="text-primary text-xl group-open:rotate-45 transition-transform inline-block">+</span>
                </summary>
                <p className="mt-3 text-white/70 text-sm md:text-base leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-8 md:p-10 text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-primary text-xs font-black uppercase tracking-widest">From $9</span>
          </div>
          <h3 className="text-2xl md:text-4xl font-black text-white mb-3">Cheap iteration before the real-panel run</h3>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-6">
            Run a 5-persona Sniff Test for $9 to gut-check before
            committing to a Pollfish CPI + minimum spend. Most teams find
            the directional signal lines up; the ones that don't, you
            saved real money on.
          </p>
          <Link
            to="/landing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-gray-900 font-black hover:scale-[1.02] transition-transform shadow-2xl shadow-primary/30"
          >
            Start your first mission
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <section className="border-t border-white/10 pt-8 mb-12">
          <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4">Other comparisons</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {OTHER_COMPARISONS.map((c) => (
              <Link
                key={c.slug}
                to={`/vs/${c.slug}`}
                className="rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-colors px-4 py-3 text-white/70 hover:text-white text-sm font-semibold flex items-center justify-between"
              >
                {c.label}
                <ArrowRight className="w-4 h-4 text-primary opacity-60" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </OverlayPage>
  );
}

export default VsPollfishPage;
