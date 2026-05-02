/**
 * Pass 23 B2 — VETT vs SurveyMonkey comparison page (sample / template).
 *
 * Route: /vs/surveymonkey
 *
 * Structure:
 *   - H1 + 90-second TL;DR card
 *   - Side-by-side comparison table (12 dimensions)
 *   - "When to use SurveyMonkey" + "When to use VETT" honest framing
 *   - 6 FAQs with FAQPage schema
 *   - CTA to /landing
 *   - Internal links to other comparison pages (placeholder for now)
 *
 * Tone: confident, factually accurate, generous to competitor. The goal
 * is to build trust, not to bash. SurveyMonkey serves real customers
 * well; VETT is a different category (synthetic AI vs real-panel
 * coordination). Win on speed, AI, per-respondent cost; concede on
 * brand recognition, integrations, real-respondent verification.
 *
 * After Jamil reviews voice/tone, this template ships for
 * vs/typeform, vs/usertesting, vs/pollfish, vs/traditional.
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
  { dimension: 'Time to first insight',          vett: 'Minutes',                              competitor: 'Days to weeks (panel recruit)',     vettWins: true  },
  { dimension: 'Cost per respondent',             vett: '$0.40 – $3.50',                        competitor: '$1 – $5 (basic) / $10+ (qualified)', vettWins: true  },
  { dimension: 'Minimum mission cost',            vett: '$9 (Sniff Test, 5 personas)',          competitor: '~$1+/response, panels min ~$200',   vettWins: true  },
  { dimension: 'Geographic reach',                vett: '193 countries (full ISO list, AI-modelled)', competitor: '~190 countries via Audience panel', vettWins: false },
  { dimension: 'Custom screener',                 vett: 'Constraint-based generation, persona is generated TO the spec', competitor: 'Filter-based on real panelists; longer wait if strict', vettWins: true  },
  { dimension: 'Real human respondents',          vett: 'No - synthetic personas with realistic distributions',          competitor: 'Yes - verified panel members',  vettWins: false },
  { dimension: 'Demographic depth',               vett: 'Persona-level: occupation, income, behaviours, decision style', competitor: 'Demographic targeting + screening filters', vettWins: false },
  { dimension: 'AI insight synthesis',            vett: 'Built-in: executive summary, contradictions, cross-cut',        competitor: 'Manual analysis or third-party add-on', vettWins: true  },
  { dimension: 'Creative attention analysis',     vett: 'Frame-by-frame emotion, attention, message clarity for $19/asset',   competitor: 'Not in core product',           vettWins: true  },
  { dimension: 'Brand lift framework',            vett: 'Built-in 9-category Happydemics-style framework',               competitor: 'DIY in Survey Builder',         vettWins: true  },
  { dimension: 'Integrations (Salesforce, etc.)', vett: 'CSV / PDF export today; API on roadmap',                        competitor: 'Mature integrations marketplace',vettWins: false },
  { dimension: 'Best for…',                       vett: 'Early validation, pre-launch sanity, MENA/emerging markets',    competitor: 'Established research programs with budget for real panels', vettWins: false },
];

const FAQS = [
  {
    q: 'Can synthetic respondents really replace real panel research?',
    a: "For early validation, the directional signals from VETT missions - which option wins, what concerns emerge - often align with the patterns confirmed by real-panel studies run with the same screener. Where they can diverge: open-text emotional nuance and brand-recall depth on niche products, where a real panel still adds confidence. For high-stakes decisions where you need legally defensible quotes from verified humans, real panels are the right tool. We recommend VETT for the first 3-5 validation iterations, then a real-panel study before launch.",
  },
  {
    q: 'How is this different from just asking ChatGPT?',
    a: "ChatGPT gives you one perspective per prompt. VETT generates a population of 5-5,000 distinct personas, each with their own background, motivations, and decision style, and simulates a full survey flow with screening + branching + open-text + ratings. The output is statistically structured (cross-tabs, segment breakdowns, confidence intervals) the way a market-research report is - not a conversation. Same underlying AI, completely different deliverable.",
  },
  {
    q: 'How much does VETT cost vs SurveyMonkey?',
    a: "SurveyMonkey's pricing varies by region and changes periodically; check surveymonkey.com/pricing for current numbers (as of May 2026, their entry tier was AED 129/month - roughly $35 USD/month - in the UAE storefront, with SurveyMonkey Audience responses sold separately at AED 0.50+ per additional response). A 100-person targeted survey on SurveyMonkey Audience typically lands several hundred dollars depending on screener strictness. VETT charges $9 for a 5-respondent Sniff Test, $99 for 50 respondents (Confidence tier), or $899 for 1,000 (Scale tier). No subscription required. For first-iteration validation, VETT is roughly 5-10× cheaper.",
  },
  {
    q: "What if my screener is so strict that you can't generate matching personas?",
    a: "Our generation pipeline tells the AI the exact screener criteria up front, so every persona is generated to satisfy them, not filtered against them. If a generated persona somehow misses the spec (rare; ~2% of the time), we regenerate that slot with stricter constraints. We don't refund-on-partial - the promise is 'you set the number, we deliver it.'",
  },
  {
    q: 'Can I run the same survey on VETT and SurveyMonkey to compare?',
    a: 'Yes - many of our users do exactly that on a small Sniff Test ($9, 5 personas) before committing to a full SurveyMonkey panel order. The VETT signal is usually directionally identical to the panel result, which is what you want from a sanity check before spending real-panel money.',
  },
  {
    q: 'Where does VETT lose to SurveyMonkey?',
    a: 'Three real things: (1) integrations - SurveyMonkey has a mature marketplace (Salesforce, Marketo, HubSpot); we have CSV / PDF export and an API on the roadmap. (2) Brand recognition - if you need to convince a board or a regulator, "validated by SurveyMonkey panel" carries 20 years of trust. (3) Verified-human quotes - for legal / compliance / press use cases, real respondents are the only acceptable answer. We tell users: use VETT for the iteration loop, then a real-panel study for the launch announcement.',
  },
];

export function VsSurveyMonkeyPage() {
  // Pass 23 B1 + B2 — page-level SEO. Title + description + canonical
  // updated for this route. The Schema.org FAQPage JSON-LD is injected
  // inline via a useEffect so we can dehydrate clean if React unmounts
  // (e.g. SPA back-navigation).
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'VETT vs SurveyMonkey: Which Is Right for You?';

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
    setMeta('description', "VETT vs SurveyMonkey side-by-side. Speed, cost, AI, screener strictness, creative attention, brand-lift framework. Honest comparison from $9.");

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.getAttribute('href') ?? '';
    canonical.setAttribute('href', 'https://www.vettit.ai/vs/surveymonkey');

    // FAQPage JSON-LD
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'vs-surveymonkey-faq-schema';
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
      document.getElementById('vs-surveymonkey-faq-schema')?.remove();
    };
  }, []);

  return (
    <OverlayPage>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* H1 */}
        <header className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/60 mb-5">
            Comparison · VETT vs SurveyMonkey
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight mb-4">
            VETT vs SurveyMonkey: Which Is Right for You?
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl leading-relaxed">
            Two different categories solving overlapping problems. Use this page
            to figure out which one fits your next research question.
          </p>
        </header>

        {/* 90-second TL;DR */}
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary text-xs font-black uppercase tracking-widest">90-second TL;DR</span>
          </div>
          <ul className="space-y-3 text-white/80 text-base leading-relaxed">
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Speed:</strong> VETT runs a 50-respondent study in minutes. SurveyMonkey Audience takes hours to days.</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Cost:</strong> $9 for 5 personas to $1,990 for 5,000. SurveyMonkey panels start ~$200 minimum and scale faster.</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Screener:</strong> VETT generates personas TO your spec. SurveyMonkey filters real panelists against your spec - strict screeners mean longer waits or attrition.</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">AI synthesis:</strong> Built into VETT. SurveyMonkey reports are mostly DIY analysis or paid add-on.</span></li>
            <li className="flex gap-3"><X className="w-5 h-5 text-white/40 shrink-0 mt-0.5" /><span><strong className="text-white">Real humans:</strong> SurveyMonkey wins. VETT is synthetic-only - better for iteration, not for legally defensible quotes.</span></li>
            <li className="flex gap-3"><X className="w-5 h-5 text-white/40 shrink-0 mt-0.5" /><span><strong className="text-white">Integrations:</strong> SurveyMonkey wins. Mature Salesforce/HubSpot/Marketo connectors. VETT has CSV + PDF + an API on the roadmap.</span></li>
          </ul>
        </section>

        {/* Side-by-side comparison */}
        <section className="mb-14">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-6">Side-by-side comparison</h2>

          {/* Mobile (<640px): stacked cards. Avoids horizontal overflow on
              a 12-row 3-column table at small viewports. */}
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
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-0.5">SurveyMonkey</p>
                      <p className="text-white/60 text-sm leading-relaxed">{row.competitor}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet/Desktop (>=640px): table inside an overflow-x-auto wrapper
              with min-w-[600px] so narrow viewports scroll the table inside
              its own region instead of pushing the whole page. */}
          <div className="hidden sm:block rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left px-4 py-3 text-white/60 font-bold uppercase tracking-widest text-xs">Dimension</th>
                    <th className="text-left px-4 py-3 text-primary font-black uppercase tracking-widest text-xs">VETT</th>
                    <th className="text-left px-4 py-3 text-white/60 font-black uppercase tracking-widest text-xs">SurveyMonkey</th>
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

        {/* When to use what */}
        <section className="grid md:grid-cols-2 gap-6 mb-14">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-white/70" />
              <h3 className="text-xl font-black text-white">When to use SurveyMonkey</h3>
            </div>
            <ul className="space-y-3 text-white/70 text-base leading-relaxed">
              <li>You need legally defensible quotes from verified humans (compliance, regulatory, PR).</li>
              <li>You're running an established research program with budget for real-panel cost-per-response.</li>
              <li>You depend on Salesforce / HubSpot / Marketo automation hooks.</li>
              <li>Your audience is so niche that synthetic distributions can't model it (e.g. specific medical conditions, security-cleared roles).</li>
              <li>You need 20+ years of brand-recognition trust with stakeholders.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-black text-primary">When to use VETT</h3>
            </div>
            <ul className="space-y-3 text-white/80 text-base leading-relaxed">
              <li>Early-stage validation: you want signal in minutes, not days.</li>
              <li>You're iterating on positioning / pricing / naming and need 5-10 cycles before launch.</li>
              <li>Your audience is in an emerging market (MENA, Africa, SEA) where panel quality is patchy and expensive.</li>
              <li>You want a brand-lift baseline without paying $5K to an agency.</li>
              <li>You want to test creative (image / video) for emotion + attention + clarity at $19/asset.</li>
              <li>You're price-sensitive: $9-$299 covers most early-stage needs.</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
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

        {/* CTA */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-8 md:p-10 text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-primary text-xs font-black uppercase tracking-widest">From $9</span>
          </div>
          <h3 className="text-2xl md:text-4xl font-black text-white mb-3">Try VETT before you next pay for a panel</h3>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-6">
            Run a 5-persona Sniff Test for $9. If it doesn&rsquo;t give you signal,
            you&rsquo;ve lost the price of a sandwich. If it does, you saved a week
            of panel coordination.
          </p>
          <Link
            to="/landing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-gray-900 font-black hover:scale-[1.02] transition-transform shadow-2xl shadow-primary/30"
          >
            Start your first mission
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Other comparisons (placeholders for now) */}
        <section className="border-t border-white/10 pt-8 mb-12">
          <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4">Other comparisons</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { slug: 'typeform',     label: 'VETT vs Typeform' },
              { slug: 'usertesting',  label: 'VETT vs UserTesting' },
              { slug: 'pollfish',     label: 'VETT vs Pollfish' },
              { slug: 'traditional',  label: 'VETT vs traditional research agencies' },
            ].map((c) => (
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

export default VsSurveyMonkeyPage;
