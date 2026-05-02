/**
 * Pass 23 B2 expansion - VETT vs UserTesting comparison page.
 *
 * Route: /vs/usertesting
 *
 * Honest framing: UserTesting is a different category (video usability
 * sessions with real humans). VETT does not do video usability testing.
 * The page exists for SEO traffic from "VETT vs UserTesting" searches and
 * answers the "are these the same product?" question with a clear "no,
 * different jobs" - then shows where each one's the right tool.
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
  { dimension: 'Output format',                   vett: 'Survey responses + AI synthesis (exec summary, tensions, cross-cut)', competitor: 'Recorded video sessions of a real tester narrating their experience', vettWins: false },
  { dimension: 'Respondent type',                 vett: 'AI personas generated to your screener',                        competitor: 'Real human testers from a managed panel',               vettWins: false },
  { dimension: 'Time to first insight',           vett: 'Minutes (synthetic responses)',                                 competitor: 'Hours to a day (testers schedule + record + transcript)', vettWins: true  },
  { dimension: 'Cost per respondent',             vett: '$0.40 - $3.50',                                                 competitor: 'Public per-session cost not disclosed; enterprise contracts typical', vettWins: true  },
  { dimension: 'Pricing model',                   vett: 'Per mission ($9-$1,990 flat); no subscription',                 competitor: 'Enterprise sales: Advanced / Ultimate / Ultimate+ tiers; contact sales for quote', vettWins: true  },
  { dimension: 'Sample size per study',           vett: '5-5,000 personas per mission',                                  competitor: '5-30 testers per study is typical (video review takes time)', vettWins: true  },
  { dimension: 'Video usability testing',         vett: 'Not in product',                                                competitor: 'Core capability - this is what they do',                vettWins: false },
  { dimension: 'Mobile-app walk-through testing', vett: 'Not in product',                                                competitor: 'Native iOS / Android session recording',                vettWins: false },
  { dimension: 'Survey-style quantitative data',  vett: 'Yes - structured cross-tabs, segments, scoring',                competitor: 'Limited - testimonial patterns + AI summaries; not the core deliverable', vettWins: true  },
  { dimension: 'Brand lift framework',            vett: 'Built-in 9-category Happydemics-style framework',               competitor: 'Not in product',                                       vettWins: true  },
  { dimension: 'Geographic reach',                vett: '193 countries (full ISO list, AI-modelled)',                    competitor: 'Tester panels across major markets; emerging-market depth varies', vettWins: false },
  { dimension: 'Best for...',                     vett: 'Pre-launch validation, brand-lift baselines, message testing, persona research at scale', competitor: 'Live product UX testing, mobile-app usability, observing real users actually clicking', vettWins: false },
];

const FAQS = [
  {
    q: 'Is VETT an alternative to UserTesting?',
    a: "Mostly no - we solve different problems. UserTesting is for live product UX: watching a real human navigate your app, click around, narrate confusion, surface friction. VETT is for survey-style validation: asking 50-1,000 personas structured questions and getting AI-synthesised insight back. If you want to know whether your checkout flow has a usability bug, use UserTesting. If you want to know whether your concept resonates with a target market, use VETT. Some teams run both - VETT for the early-validation loops (cheap, fast, 50+ personas), UserTesting for the pre-launch UX audit (real humans, 5-15 testers, video).",
  },
  {
    q: 'Can VETT do video usability testing?',
    a: "No. We don't generate video walk-throughs of a real or synthetic user clicking through your product. The closest VETT does is open-text feedback on a creative or concept (text, images, or video uploaded for the persona to react to). For actual usability sessions, UserTesting (or Maze, Lookback, PlaybookUX) is the right tool.",
  },
  {
    q: 'Can VETT do mobile-app testing?',
    a: "Not in the same sense as UserTesting. VETT can target mobile-using personas in your screener (\"smartphone-only respondents in MENA aged 25-34\") and ask them survey questions about an app concept, screenshot, or value prop. We don't record a real human navigating the app. If you need that, UserTesting's native iOS/Android session recording is the standard.",
  },
  {
    q: 'When do I use UserTesting vs VETT?',
    a: "A rough split: use UserTesting when the question is \"is this product easy to use?\" or \"where does this UX break?\" - questions that need observation of a real tester. Use VETT when the question is \"would this audience care about this concept?\" or \"which version of this message lands harder?\" - questions that need scale + screener flexibility + AI synthesis. Many teams use both at different stages: VETT for the first 5-10 concept-validation iterations ($9-$99 per round), UserTesting for the polish-the-UX phase before launch (5-15 video sessions).",
  },
  {
    q: 'How much does UserTesting cost vs VETT?',
    a: "UserTesting doesn't publish per-session pricing - their plans (Advanced / Ultimate / Ultimate+) are quoted via sales based on user count and test volume. Industry chatter puts a typical enterprise contract in the low-five-figures-per-year range, with per-session cost roughly $49-$80 in the older publicly-listed tiers (this can be wrong as of 2026 - check usertesting.com/plans for current). VETT charges per mission: $9 for a 5-respondent Sniff Test, $99 for 50 respondents (Confidence tier), $899 for 1,000 (Scale tier). No subscription. The two products serve different jobs, so price-per-unit comparisons are tricky.",
  },
  {
    q: 'Where does VETT lose to UserTesting?',
    a: 'Three real things: (1) Real-human observation - watching an actual tester struggle with a checkout flow is a deliverable VETT cannot produce. We have AI personas reacting to text and concepts, not real fingers on glass. (2) Mobile-app session recording - native iOS/Android tester sessions are core UserTesting; not in our product. (3) Stakeholder credibility for UX claims - "watch this video of a real customer fail to find the CTA" is dramatically more persuasive in a stakeholder review than survey aggregates. We tell users: pair us. VETT for the upstream validation work; UserTesting for the downstream usability proof.',
  },
];

const OTHER_COMPARISONS = [
  { slug: 'surveymonkey', label: 'VETT vs SurveyMonkey' },
  { slug: 'typeform',     label: 'VETT vs Typeform' },
  { slug: 'pollfish',     label: 'VETT vs Pollfish' },
  { slug: 'traditional',  label: 'VETT vs traditional research agencies' },
];

export function VsUserTestingPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'VETT vs UserTesting: Which Is Right for You?';

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
    setMeta('description', "VETT vs UserTesting side-by-side. Survey-style synthetic research vs video usability sessions. Honest framing: different jobs, sometimes both.");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.getAttribute('href') ?? '';
    canonical.setAttribute('href', 'https://www.vettit.ai/vs/usertesting');

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'vs-usertesting-faq-schema';
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
      document.getElementById('vs-usertesting-faq-schema')?.remove();
    };
  }, []);

  return (
    <OverlayPage>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <header className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/60 mb-5">
            Comparison · VETT vs UserTesting
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight mb-4">
            VETT vs UserTesting: Which Is Right for You?
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl leading-relaxed">
            UserTesting watches real humans use your product. VETT runs
            surveys against AI personas. Different jobs, sometimes both.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary text-xs font-black uppercase tracking-widest">90-second TL;DR</span>
          </div>
          <ul className="space-y-3 text-white/80 text-base leading-relaxed">
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Output format:</strong> VETT delivers structured survey responses + AI synthesis. UserTesting delivers video recordings of real testers narrating their experience. Different deliverables.</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Sample size:</strong> VETT runs 5-5,000 personas per mission. UserTesting studies typically use 5-30 testers (video review takes time).</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Time to insight:</strong> VETT in minutes. UserTesting in hours-to-a-day per round (testers schedule + record + transcript).</span></li>
            <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span><strong className="text-white">Pricing:</strong> VETT $9-$1,990 per mission, no subscription. UserTesting is enterprise-sales; per-session pricing not publicly listed.</span></li>
            <li className="flex gap-3"><X className="w-5 h-5 text-white/40 shrink-0 mt-0.5" /><span><strong className="text-white">Real humans:</strong> UserTesting wins. Watching an actual tester use your product is irreplaceable for usability work.</span></li>
            <li className="flex gap-3"><X className="w-5 h-5 text-white/40 shrink-0 mt-0.5" /><span><strong className="text-white">Mobile-app walkthroughs:</strong> UserTesting wins. Native iOS / Android session recording isn't in VETT.</span></li>
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
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-0.5">UserTesting</p>
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
                    <th className="text-left px-4 py-3 text-white/60 font-black uppercase tracking-widest text-xs">UserTesting</th>
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
              <h3 className="text-xl font-black text-white">When to use UserTesting</h3>
            </div>
            <ul className="space-y-3 text-white/70 text-base leading-relaxed">
              <li>You're past the concept stage and have a working product to test.</li>
              <li>You need to see a real human actually use the thing - clicks, hesitation, confusion, fixes.</li>
              <li>You're auditing mobile-app usability where session recording is the deliverable.</li>
              <li>You're prepping a stakeholder review and "watch this video" beats "look at this dashboard."</li>
              <li>You're at enterprise scale and an annual contract makes sense.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-black text-primary">When to use VETT</h3>
            </div>
            <ul className="space-y-3 text-white/80 text-base leading-relaxed">
              <li>Pre-launch validation: you don't have a product yet, or you have only mockups.</li>
              <li>You need 50+ responses to a screener-targeted persona, not 5 video sessions.</li>
              <li>You're testing a concept, message, or positioning - not a UX flow.</li>
              <li>You want AI-synthesised insight (executive summary, tensions, cross-cut) on cheap iterations.</li>
              <li>You want to test creative (image / video) for emotion + attention + clarity at $19/asset.</li>
              <li>Your audience is in MENA / emerging markets where tester panels are thin.</li>
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
          <h3 className="text-2xl md:text-4xl font-black text-white mb-3">Validate the concept before you test the UX</h3>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-6">
            Run a 5-persona Sniff Test for $9 to gut-check the idea, then
            invest in real-tester video sessions on the version that
            survived. UserTesting after VETT, not instead of.
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

export default VsUserTestingPage;
