/**
 * Pass 23 B2 expansion - VETT vs Typeform comparison page.
 *
 * Route: /vs/typeform
 *
 * Reuses the SurveyMonkey template structure post-refinement (R5 stable
 * JSON-LD id, R6 mobile-card layout, R1/R2 cite-with-date copy norms).
 * Custom comparison rows + FAQs + when-to-use bullets per competitor.
 *
 * Tone: confident, factually accurate, generous to competitor. Typeform
 * is the best-in-class form builder; VETT is a different category. Win
 * on synthetic-respondent supply, AI synthesis, brand-lift framework,
 * creative attention; concede on form UX, conversion rates, integrations,
 * templates marketplace.
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
  { dimension: 'Time to first insight',          vett: 'Minutes (synthetic respondents generated on demand)',           competitor: 'As fast as your audience replies (you bring the list)', vettWins: true  },
  { dimension: 'Respondent supply',               vett: 'AI personas generated to your screener spec',                   competitor: 'You bring your own audience (email list, embed, link)', vettWins: true  },
  { dimension: 'Form / survey UX',                vett: 'Functional: question types, branching, screening',              competitor: 'Best-in-class: conversational, one-question-at-a-time', vettWins: false },
  { dimension: 'Pricing model',                   vett: 'Per mission ($9-$1,990 flat); no subscription',                 competitor: 'Subscription: Basic $39/mo, Plus $79/mo, Business $129/mo (USD, monthly billing)', vettWins: true  },
  { dimension: 'Geographic reach',                vett: '193 countries (full ISO list, AI-modelled)',                    competitor: 'Wherever you can recruit your own respondents',         vettWins: true  },
  { dimension: 'AI insight synthesis',            vett: 'Built-in: executive summary, contradictions, cross-cut',        competitor: 'Some AI question-suggestion in Talent plan; not a research-synthesis layer', vettWins: true  },
  { dimension: 'Brand lift framework',            vett: 'Built-in 9-category Happydemics-style framework',               competitor: 'DIY in form builder',                                  vettWins: true  },
  { dimension: 'Creative attention analysis',     vett: 'Frame-by-frame emotion, attention, message clarity for $19/asset', competitor: 'Not in core product',                              vettWins: true  },
  { dimension: 'Conditional logic / branching',   vett: 'Per-question screening + per-segment branching',                competitor: 'Mature logic jumps + conditional fields',              vettWins: false },
  { dimension: 'Integrations marketplace',        vett: 'CSV / PDF export today; API on roadmap',                        competitor: 'Mature marketplace (Zapier, Salesforce, HubSpot, Slack, Notion)', vettWins: false },
  { dimension: 'Templates library',               vett: '14 goal-type missions (Sniff Test, Validate, Brand Lift, Creative Attention, ...)', competitor: '800+ form templates across categories', vettWins: false },
  { dimension: 'Best for...',                     vett: 'Pre-launch validation, no existing audience, MENA/emerging markets', competitor: 'Engagement-first surveys with your existing list, lead-gen, embedded customer feedback', vettWins: false },
];

const FAQS = [
  {
    q: 'Can Typeform do panel research?',
    a: "No - Typeform is a form builder. You bring your own audience (email list, embed on a website, share a link). Typeform's job is to make that form gorgeous and high-converting; respondent recruiting is on you. VETT is the inverse: we generate the respondents (AI personas trained to your screener) and the survey runs in minutes against them. The two products solve adjacent problems.",
  },
  {
    q: 'What if I already have an audience? Why would I use VETT?',
    a: "If you already have a list of qualified respondents, Typeform (or any form builder) is probably the right tool for THAT survey. VETT shines in three cases your existing list can't help with: (1) pre-launch validation when you don't have customers yet, (2) testing concepts in markets where your list has no coverage (e.g. MENA, emerging markets), (3) iteration loops where you'd burn out your list with 5-10 surveys in a week. Many teams use both - Typeform for known-audience research, VETT for unknown-audience validation.",
  },
  {
    q: 'How much does VETT cost vs Typeform?',
    a: "Different pricing units, hard to compare 1:1. Typeform's published USD pricing as of May 2026 (typeform.com/pricing): Basic $39/month for 100 responses, Plus $79/month for 1,000 responses, Business $129/month for 10,000 responses (monthly billing; annual saves ~17%). VETT charges per mission: $9 for a 5-respondent Sniff Test, $99 for 50 respondents (Confidence tier), $899 for 1,000 (Scale tier). No subscription required. If you run 1-2 research missions a month and don't have an audience, VETT is cheaper. If you run dozens of customer surveys a month with an existing list, Typeform is cheaper. They're not really competing on the same job.",
  },
  {
    q: 'Can I import a Typeform survey design into VETT?',
    a: "Not directly today - that's an API surface that's on the roadmap rather than shipped. The current workaround: copy your Typeform questions into VETT's mission setup (it supports the same question types - multiple choice, rating, open-text, branching screeners). If your Typeform has logic jumps, you map them to VETT's per-segment branching. Most teams find the manual port takes 5-10 minutes for a 10-question survey.",
  },
  {
    q: 'Typeform has thousands of templates. Does VETT?',
    a: "We have 14 goal-type missions instead of a flat templates library: Sniff Test (5 personas, $9), Validate (10), Confidence (50), Scale (1,000), Brand Lift (9-category framework), Creative Attention (frame-by-frame video / image emotion + attention), and more. The trade-off: fewer cosmetic options, more research-grade defaults. If you need a polished customer-feedback form for an existing audience, Typeform's templates ship faster. If you need a brand-lift study or a creative-attention test, VETT's templates encode the methodology - Typeform makes you build that yourself.",
  },
  {
    q: 'Where does VETT lose to Typeform?',
    a: 'Three real things: (1) Form UX - Typeform\'s conversational one-question-at-a-time format converts dramatically better than VETT\'s research-style form, and that\'s by design (we\'re showing personas, not converting visitors). (2) Integrations - Zapier / Salesforce / HubSpot / Slack / Notion all hook into Typeform; VETT has CSV / PDF export and an API on the roadmap. (3) Templates marketplace - 800+ form templates vs our 14 mission types. We tell users: use Typeform for any survey where the audience is yours and the conversation matters; use VETT when you need synthetic respondents and AI synthesis at the back end.',
  },
];

const OTHER_COMPARISONS = [
  { slug: 'surveymonkey', label: 'VETT vs SurveyMonkey' },
  { slug: 'usertesting',  label: 'VETT vs UserTesting' },
  { slug: 'pollfish',     label: 'VETT vs Pollfish' },
  { slug: 'traditional',  label: 'VETT vs traditional research agencies' },
];

export function VsTypeformPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'VETT vs Typeform: Which Is Right for You?';

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
    setMeta('description', "VETT vs Typeform side-by-side. Form UX vs synthetic-respondent research, pricing, AI synthesis, integrations, templates. Honest comparison from $9.");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.getAttribute('href') ?? '';
    canonical.setAttribute('href', 'https://www.vettit.ai/vs/typeform');

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'vs-typeform-faq-schema';
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
      document.getElementById('vs-typeform-faq-schema')?.remove();
    };
  }, []);

  return (
    <OverlayPage>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* H1 */}
        <header className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/60 mb-5">
            Comparison · VETT vs Typeform
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight mb-4">
            VETT vs Typeform: Which Is Right for You?
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl leading-relaxed">
            Two adjacent products solving different jobs. Typeform makes
            forms beautiful for the audience you already have; VETT
            generates the audience when you don't.
          </p>
        </header>

        {/* 90-second TL;DR */}
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary text-xs font-black uppercase tracking-widest">90-second TL;DR</span>
          </div>
          <ul className="space-y-3 text-white/80 text-base leading-relaxed">
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Audience:</strong> VETT generates synthetic respondents to your screener. Typeform requires you to bring your own audience.</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">AI synthesis:</strong> VETT ships executive summaries, contradictions, and cross-cut analysis built in. Typeform has some AI question-help in Talent plan, not a synthesis layer.</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Brand lift + creative attention:</strong> VETT has a 9-category brand-lift framework and frame-by-frame creative attention for $19/asset. Typeform doesn't.</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Pricing model:</strong> VETT charges $9-$1,990 per mission, no subscription. Typeform is $39-$129/month + an Enterprise tier.</span></li>
            <li className="flex gap-3"><X className="w-5 h-5 text-white/40 shrink-0 mt-0.5" /><span><strong className="text-white">Form UX:</strong> Typeform wins. Conversational one-question-at-a-time formatting, best-in-class conversion rates, polished embedded experience.</span></li>
            <li className="flex gap-3"><X className="w-5 h-5 text-white/40 shrink-0 mt-0.5" /><span><strong className="text-white">Integrations + templates:</strong> Typeform wins. Mature Zapier / Salesforce / HubSpot connectors and 800+ form templates.</span></li>
          </ul>
        </section>

        {/* Side-by-side comparison */}
        <section className="mb-14">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-6">Side-by-side comparison</h2>

          {/* Mobile (<640px): stacked cards. */}
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
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-0.5">Typeform</p>
                      <p className="text-white/60 text-sm leading-relaxed">{row.competitor}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet/Desktop (>=640px): table with horizontal-scroll fallback. */}
          <div className="hidden sm:block rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left px-4 py-3 text-white/60 font-bold uppercase tracking-widest text-xs">Dimension</th>
                    <th className="text-left px-4 py-3 text-primary font-black uppercase tracking-widest text-xs">VETT</th>
                    <th className="text-left px-4 py-3 text-white/60 font-black uppercase tracking-widest text-xs">Typeform</th>
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
              <h3 className="text-xl font-black text-white">When to use Typeform</h3>
            </div>
            <ul className="space-y-3 text-white/70 text-base leading-relaxed">
              <li>You already have an audience (customer list, leads, employees, community).</li>
              <li>You need a form to convert - lead capture, NPS, customer feedback, registration.</li>
              <li>You're embedding a survey on a website or in an email and conversion rate matters.</li>
              <li>You depend on Zapier / Salesforce / HubSpot / Slack / Notion automation.</li>
              <li>Your team prefers a templates marketplace over a methodology-led product.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-black text-primary">When to use VETT</h3>
            </div>
            <ul className="space-y-3 text-white/80 text-base leading-relaxed">
              <li>You don't have an audience yet (pre-launch, new market, new persona).</li>
              <li>You need synthetic respondents to a strict screener that your existing list can't satisfy.</li>
              <li>You want AI synthesis of the results - executive summary, tensions, cross-cut - not raw responses.</li>
              <li>You need a brand-lift baseline without paying $5K to an agency.</li>
              <li>You want to test creative (image / video) for emotion + attention + clarity at $19/asset.</li>
              <li>Your audience is in MENA / emerging markets where panel quality is patchy.</li>
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
          <h3 className="text-2xl md:text-4xl font-black text-white mb-3">No audience? No problem.</h3>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-6">
            Run a 5-persona Sniff Test for $9. Synthetic respondents
            generated to your exact screener, AI synthesis included. No
            email list required.
          </p>
          <Link
            to="/landing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-gray-900 font-black hover:scale-[1.02] transition-transform shadow-2xl shadow-primary/30"
          >
            Start your first mission
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Other comparisons */}
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

export default VsTypeformPage;
