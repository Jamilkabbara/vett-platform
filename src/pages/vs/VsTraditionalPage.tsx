/**
 * Pass 23 B2 expansion - VETT vs traditional research agencies.
 *
 * Route: /vs/traditional
 *
 * Category piece, not a single-competitor comparison. Targets the
 * "Kantar / Ipsos / Nielsen / boutique-MENA-agency" search intent.
 * Honest framing: agencies bring project management + sample
 * procurement + analyst interpretation + stakeholder polish; VETT
 * compresses the iteration loop that happens before any of that
 * matters. Bridge framing - "use VETT for the upstream, agencies for
 * the launch deliverable."
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
  { dimension: 'Time to first insight',           vett: 'Minutes',                                                       competitor: '4-12 weeks per study (brief, sample, field, analysis, report)', vettWins: true  },
  { dimension: 'Cost per study',                  vett: '$9 (Sniff Test) - $1,990 (Scale)',                              competitor: '$5,000 - $50,000+ depending on scope, sample, polish', vettWins: true  },
  { dimension: 'Iteration cost',                  vett: '$9-$99 per validation round',                                   competitor: 'Each round is a new SOW; iteration is rare',           vettWins: true  },
  { dimension: 'Sample size flexibility',         vett: '5-5,000 personas per mission',                                  competitor: 'Custom - typically 200-2,000 real respondents at panel cost', vettWins: true  },
  { dimension: 'Project management',              vett: 'Self-serve (you set up the mission)',                           competitor: 'Done for you - account team handles brief, fielding, timeline', vettWins: false },
  { dimension: 'Analyst interpretation',          vett: 'AI synthesis (executive summary, tensions, cross-cut)',         competitor: 'Senior researcher interprets, recommends, presents',   vettWins: false },
  { dimension: 'Stakeholder polish',              vett: 'Clean dashboards + PDF / PPTX / CSV exports',                   competitor: 'Custom-branded report decks, board-ready narratives',  vettWins: false },
  { dimension: 'Methodology rigour',              vett: 'Templated frameworks (Brand Lift 9-category, Creative Attention)', competitor: 'Custom-designed methodology, peer-reviewable, defensible to a regulator', vettWins: false },
  { dimension: 'Real-respondent supply',          vett: 'No - synthetic personas with realistic distributions',           competitor: 'Yes - verified panel + custom recruit',                vettWins: false },
  { dimension: 'Geographic reach',                vett: '193 countries (full ISO list, AI-modelled)',                    competitor: 'Global, agency-specific (Kantar / Ipsos / Nielsen / regional boutiques)', vettWins: false },
  { dimension: 'AI insight synthesis',            vett: 'Built-in',                                                      competitor: 'Some agencies offer it as an add-on; not core',         vettWins: true  },
  { dimension: 'Best for...',                     vett: 'Pre-launch validation, iteration loops, MENA/emerging markets, cheap signal', competitor: 'Launch-grade studies, regulatory or board deliverables, custom methodology', vettWins: false },
];

const FAQS = [
  {
    q: 'Can VETT replace my research agency?',
    a: "Depends what you're using them for. Agencies do four things VETT cannot: (1) custom methodology design that's defensible to a board or regulator, (2) sample procurement for hard-to-reach niches that AI can't model well, (3) analyst interpretation - a senior researcher who walks the C-suite through what the data means, (4) stakeholder polish - custom-branded decks, narrative arcs, board-ready storytelling. VETT compresses the part that happens BEFORE all that: the cheap fast iteration loops where you're still figuring out what to ask. Most teams use both, in sequence: VETT for the first 5-10 cycles ($9-$99 each), agency for the launch-grade study.",
  },
  {
    q: 'What about analyst interpretation? An AI summary is not the same as a senior researcher.',
    a: "Correct, and we don't pretend otherwise. VETT's AI synthesis surfaces the dominant findings (executive summary, tensions across segments, cross-cut analysis, recommended next step) at the data layer. What it doesn't do is sit in your boardroom and read the room while presenting. For high-stakes presentations where the analyst's framing is part of the deliverable - regulatory submissions, M&A diligence, brand-strategy pivots - the agency's interpretation layer is genuinely irreplaceable. We tell users: VETT replaces \"the consultant who runs surveys for me\" cheaply; it does not replace \"the senior advisor who interprets data in a stakeholder context.\"",
  },
  {
    q: 'How do I present VETT data to a board used to agency reports?',
    a: "Two practical patterns: (1) Use VETT's PDF / PPTX exports as the data layer + write a 1-2 page narrative cover yourself. The agency-style polish was always the cover, not the data. (2) Use VETT for the iteration loops, then commission an agency for the LAUNCH study with a tighter brief because you've already burned through the questions an agency would charge $50K to discover. Cost goes from $50K to $15K because the brief is concrete. Most teams report the second pattern as the bigger ROI.",
  },
  {
    q: 'Where does traditional research win?',
    a: 'Five real things: (1) Defensible methodology - peer-reviewable rigour for regulatory or M&A use cases. (2) Verified-human respondents for legal, compliance, or PR claims. (3) Senior analyst interpretation, including reading the room in a stakeholder context. (4) Hard-to-reach niches where AI training data is thin (specific medical conditions, security-cleared roles, B2B procurement leaders at named accounts). (5) Brand recognition - "validated by Kantar / Ipsos / Nielsen" carries decades of trust with skeptical stakeholders. Where VETT wins: speed, cost, iteration loops, AI synthesis, and the ability to ask 50 questions you weren\'t sure mattered for $9-$99 a round.',
  },
  {
    q: 'When do agencies recommend AI tools alongside their own work?',
    a: "Increasingly often. Several mid-market agencies in MENA, EU, and SEA are using AI-modelled research as an upstream phase: cheap exploration to refine the brief before they field a real-panel study. The agency still owns the methodology, the field, the interpretation, and the deliverable - but the brief is sharper because the upstream work happened on AI personas at a fraction of the cost. We've seen the pattern emerge organically; we built the API roadmap partly to support it.",
  },
  {
    q: 'Where does VETT lose to traditional research?',
    a: 'Three real things: (1) Stakeholder credibility for "validated by [agency]" framing - decades of trust matter in conservative industries. (2) Custom methodology that\'s defensible to peer review or a regulator - VETT has templated frameworks, not custom designs. (3) Done-for-you workflow - if your team doesn\'t want to set up missions and read AI summaries, the agency\'s account team is doing real work that we are not replacing. We tell users: use VETT for the iteration loops, the agency for the launch.',
  },
];

const OTHER_COMPARISONS = [
  { slug: 'surveymonkey', label: 'VETT vs SurveyMonkey' },
  { slug: 'typeform',     label: 'VETT vs Typeform' },
  { slug: 'usertesting',  label: 'VETT vs UserTesting' },
  { slug: 'pollfish',     label: 'VETT vs Pollfish' },
];

export function VsTraditionalPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'VETT vs Traditional Research Agencies: Which Is Right for You?';

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
    setMeta('description', "VETT vs traditional research agencies (Kantar, Ipsos, Nielsen, boutique). Speed, cost, iteration, AI synthesis vs methodology rigour, analyst interpretation, stakeholder polish.");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.getAttribute('href') ?? '';
    canonical.setAttribute('href', 'https://www.vettit.ai/vs/traditional');

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'vs-traditional-faq-schema';
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
      document.getElementById('vs-traditional-faq-schema')?.remove();
    };
  }, []);

  return (
    <OverlayPage>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <header className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/60 mb-5">
            Comparison · VETT vs traditional research
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight mb-4">
            VETT vs Traditional Research: Which Is Right for You?
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl leading-relaxed">
            Agencies bring methodology rigour, analyst interpretation,
            and stakeholder-grade polish. VETT compresses the iteration
            loop that happens before any of that matters. Most teams
            need both, in sequence.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary text-xs font-black uppercase tracking-widest">90-second TL;DR</span>
          </div>
          <ul className="space-y-3 text-white/80 text-base leading-relaxed">
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Time:</strong> VETT in minutes per study. Agencies in 4-12 weeks (brief, sample, field, analysis, report).</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Cost:</strong> VETT $9-$1,990 per mission. Agency studies $5K-$50K+ depending on scope, sample, and polish.</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Iteration:</strong> VETT supports 5-10 cheap loops. Agencies are typically a one-and-done SOW per study.</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">AI synthesis:</strong> Built into VETT. A few agencies add it; most don't.</span></li>
            <li className="flex gap-3"><X className="w-5 h-5 text-white/40 shrink-0 mt-0.5" /><span><strong className="text-white">Methodology rigour:</strong> Agencies win. Custom-designed methodology, peer-reviewable, regulatory-grade.</span></li>
            <li className="flex gap-3"><X className="w-5 h-5 text-white/40 shrink-0 mt-0.5" /><span><strong className="text-white">Analyst + polish:</strong> Agencies win. Senior researcher interprets, presents, owns the stakeholder narrative.</span></li>
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
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-0.5">Agencies</p>
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
                    <th className="text-left px-4 py-3 text-white/60 font-black uppercase tracking-widest text-xs">Agencies</th>
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
              <h3 className="text-xl font-black text-white">When to use a research agency</h3>
            </div>
            <ul className="space-y-3 text-white/70 text-base leading-relaxed">
              <li>You need a regulator-grade or board-grade deliverable (M&A diligence, brand-strategy pivot, regulatory submission).</li>
              <li>Your audience is a hard-to-reach niche (specific medical conditions, security-cleared roles, B2B procurement leaders at named accounts).</li>
              <li>You want a senior analyst to interpret the data in a stakeholder context, not just a dashboard.</li>
              <li>You need custom-designed methodology, peer-reviewable rigour, defensible to a journalist or regulator.</li>
              <li>"Validated by [Kantar / Ipsos / Nielsen / boutique]" carries trust your team needs.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-black text-primary">When to use VETT</h3>
            </div>
            <ul className="space-y-3 text-white/80 text-base leading-relaxed">
              <li>Pre-launch iteration: 5-10 cheap validation cycles before commissioning the agency-grade study.</li>
              <li>You can't justify a $20K SOW for the question you're asking yet.</li>
              <li>You want AI synthesis (executive summary, tensions, cross-cut) baked in, not as a custom add-on.</li>
              <li>Your audience is in MENA / emerging markets where regional agency quality is patchy.</li>
              <li>You want a brand-lift baseline or creative-attention scorecard - both are templated and shippable in minutes.</li>
              <li>You're sharpening the brief BEFORE the agency starts so the SOW is concrete and the cost is lower.</li>
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
          <h3 className="text-2xl md:text-4xl font-black text-white mb-3">Sharpen the brief before you sign the SOW</h3>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-6">
            Run 5-10 cheap iteration cycles on VETT first. Most teams
            cut their agency SOW cost roughly in half because the brief
            is concrete by the time the contract gets signed.
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

export default VsTraditionalPage;
