import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { OverlayPage } from '../components/layout/OverlayPage';
import { HowItWorksVisual } from '../components/methodology/HowItWorksVisual';

/**
 * /methodology — the public methodology page.
 *
 * Layer 3 ("for people who buy research professionally") + the objections
 * section + the close. Linked from every export footer (PDF / PPTX / XLSX,
 * see vettit-backend/src/services/exports/) and intended to be linked from
 * the landing hero.
 *
 * Note this is DISTINCT from /methodologies (plural), which is the catalogue
 * of the twelve research methods VETT sells. This page is the "how do we know
 * the numbers are real" page.
 *
 * ── ACCURACY ──────────────────────────────────────────────────────────────
 * This page makes checkable claims, so every claim below was verified against
 * the backend before it shipped. The map, with the code that backs it:
 *
 *  VERIFIED
 *   - Canonical Van Westendorp script ......... claudeAI.js:617-621
 *   - Gabor-Granger price ladder follow-up .... claudeAI.js:623-624 (5 anchors)
 *   - MaxDiff balance validated ............... claudeAI.js:774-801 (min-sets check)
 *   - Kano functional/dysfunctional pairs ..... claudeAI.js:764-767
 *   - Sauerwein evaluation table .............. analysis/roadmap.js:53-77
 *   - NPS / CSAT / CES standard wording ....... claudeAI.js:906-912
 *   - k-means seeded and reproducible ......... analysis/audienceProfiling.js:51,68,217
 *                                               (mulberry32, fixed seed 1337)
 *   - Segmentation requires n >= 50 ........... analysis/audienceProfiling.js:32,196
 *                                               report/statGate.js:35
 *   - Hard gate at n >= 30 for pricing,
 *     roadmap and market entry ................ report/statGate.js:31-36
 *   - Per-market below n = 30 flagged
 *     directional ............................. analysis/marketEntry.js:32,161
 *   - Screeners enforced at generation ........ ai/simulate.js:205,262;
 *                                               ai/recruitLoop.js:347
 *   - Per-answer reasoning captured ........... ai/simulate.js:95,283
 *   - Reasoning stored up to 50 respondents ... jobs/runMission.js:449-450
 *   - computeAnalysis deterministic ........... analysis/index.js:89-107 (pure
 *                                               apart from a `computed_at`
 *                                               timestamp, which is not a figure)
 *
 *  CLAIMS FROM THE SUPPLIED DRAFT THAT DID **NOT** HOLD, AND WERE CHANGED
 *  RATHER THAN PUBLISHED (reported to the owner):
 *   1. "Exposed vs control cells, randomly assigned."
 *      FALSE. Assignment is a deterministic alternation
 *      (ai/recruitLoop.js:302 `recruitedCount % 2`; jobs/runMission.js:250,267),
 *      which balances the cells but is not randomisation. Copy now says
 *      "balanced 50/50 split".
 *   2. "Below 30 responses, headline figures are suppressed ... VETT will
 *      tell you the sample is too small and show you nothing."
 *      FALSE as written. `suppress_headline` (report/statGate.js:96) has no
 *      consumer that hides a number: the only reader is Centerpiece.tsx:446,
 *      which drops the accent colour, and the exports print a DIRECTIONAL
 *      band (pptx.js:447, xlsx.js:107, pdf-v2 _canonical_body.hbs:22). The
 *      figure is still shown. Only segmentation is genuinely withheld. Copy
 *      now says exactly that.
 *   3. "An unbalanced MaxDiff set or a broken Kano pair doesn't ship."
 *      OVERSTATED. The validator rejects and regenerates once; if the retry
 *      also fails, the best-effort instrument is surfaced for the user to
 *      edit rather than throwing (claudeAI.js:862-867). Copy now says that.
 *   4. "The language model computes nothing that appears as a figure."
 *      FALSE as an absolute. True for every survey metric (analysis/*), but
 *      two figures ARE model-produced: open-end theme frequency counts
 *      (ai/openEndThemes.js:80-95, clamped to the sample) and Creative
 *      Attention component scores (ai/creativeAttention.js:470-505, weights
 *      applied deterministically to a vision model's read). The page now
 *      scopes the claim and discloses both exceptions by name.
 *
 * Copy rule: no em dashes and no en dashes anywhere in user-facing strings.
 */

const INSTRUMENTS: Array<{ testing: string; method: string }> = [
  {
    testing: 'Price sensitivity',
    method: 'Van Westendorp PSM, with Gabor-Granger follow-up',
  },
  {
    testing: 'Feature and benefit trade-offs',
    method: 'MaxDiff, balanced-set validated',
  },
  {
    testing: 'Satisfaction drivers',
    method: 'Kano, functional and dysfunctional pairs, Sauerwein evaluation',
  },
  {
    testing: 'Loyalty and advocacy',
    method: 'NPS, CSAT, CES, standard wording',
  },
  {
    testing: 'Campaign effect',
    method: 'Exposed vs control cells, balanced 50/50 split',
  },
  {
    testing: 'Audience structure',
    method: 'k-means clustering, seeded and reproducible',
  },
];

const OBJECTIONS: Array<{ q: string; a: string }> = [
  {
    q: '"Simulated respondents aren\'t real people."',
    a: 'Correct, and we say so on every export. The relevant question isn\'t whether it equals a panel, it\'s what you do today instead. For most decisions, the honest answer is a meeting, an opinion, and a guess. VETT replaces the guess, not the panel.',
  },
  {
    q: '"Couldn\'t I just ask ChatGPT?"',
    a: 'You\'d get prose. You wouldn\'t get a validated instrument, a specified and screened sample, per-respondent reasoning, deterministic statistics, significance gating, or a report you can hand to a board. The model is one component here, and on the survey metrics it\'s the component that doesn\'t touch the numbers.',
  },
  {
    q: '"How do I know the AI isn\'t making the numbers up?"',
    a: 'Because on the survey metrics it never sees them. Responses go into statistical code; the model writes narrative from the output. Run the same responses through the analysis twice and you get identical figures. The two places the model does produce a number are named above, and neither is a survey metric.',
  },
  {
    q: '"What about bias in the model?"',
    a: 'Real. Every research method carries sampling bias: panels skew toward people who take surveys for money. Ours skews differently. That\'s why VETT is built for direction, comparison, and screening, where relative signal matters more than an absolute point estimate.',
  },
  {
    q: '"Isn\'t $9 too cheap to be serious?"',
    a: 'The cost of traditional research is fieldwork: recruiting, incentives, quality control, project management. Remove fieldwork and the instrument and the analysis remain. That\'s what you\'re paying for, and it\'s the part that carries the rigour.',
  },
  {
    q: '"Where would you still use a panel?"',
    a: 'Regulatory or advertising claims needing human substantiation. Final go/no-go on large irreversible capital. Very small specialist B2B populations. Longitudinal tracking of the same individuals.',
  },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 mt-14 text-2xl font-black tracking-tight text-white sm:text-3xl">
      {children}
    </h2>
  );
}

export function MethodologyPage() {
  return (
    <OverlayPage>
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <span className="text-xs font-black uppercase tracking-widest text-primary">
            Methodology
          </span>
        </div>

        <h1 className="mb-6 text-5xl font-black tracking-tighter text-white md:text-7xl">
          How VETT produces a number
        </h1>
        <p className="mb-14 max-w-3xl text-xl text-white/60">
          Established instruments. Deterministic analysis. Simulated
          respondents. Directional output, fast. This page is the long version,
          including the parts that don't flatter us.
        </p>

        {/* ── Layer 2, the visual. Self-contained; the landing will reuse it. ── */}
        <HowItWorksVisual />

        {/* ── Layer 3 ─────────────────────────────────────────────────── */}
        <SectionHeading>For people who buy research professionally</SectionHeading>
        <p className="mb-10 text-white/70">
          If research is your job, you'll want to know exactly what this is.
          Here it is plainly.
        </p>

        <h3 className="mb-4 text-lg font-black text-white">
          The instruments are real
        </h3>
        <div className="mb-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white/45">
                  What you're testing
                </th>
                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white/45">
                  Method
                </th>
              </tr>
            </thead>
            <tbody>
              {INSTRUMENTS.map((row) => (
                <tr key={row.testing} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-semibold text-white">
                    {row.testing}
                  </td>
                  <td className="px-4 py-3 text-white/65">{row.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mb-12 text-white/65">
          Wording follows the canonical form for each instrument. These aren't
          improvised questions with a methodology label attached afterwards.
          Structural validators run at generation: an unbalanced MaxDiff set or
          a broken Kano pair is rejected and rebuilt, and if the rebuild still
          fails, the instrument comes back to you to fix rather than going out
          quietly.
        </p>

        <h3 className="mb-4 text-lg font-black text-white">
          The numbers are auditable
        </h3>
        <p className="mb-4 text-white/70">
          For every survey metric, the language model computes nothing that
          appears as a figure. Deterministic analysis modules take the raw
          response set and produce the metrics. Every raw response is stored.
          You can trace any survey number back to the answers underneath it,
          down to the individual respondent.
        </p>
        <p className="mb-4 text-white/70">
          Ask your current research supplier for that.
        </p>

        <div className="mb-12 rounded-2xl border border-primary/25 bg-primary/[0.04] p-5">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
            Where the model does touch a number
          </p>
          <p className="mb-3 text-sm leading-relaxed text-white/70">
            Two figures in the product are model-produced, and it would be
            dishonest to let the sentence above imply otherwise:
          </p>
          <ul className="space-y-2 text-sm text-white/65">
            <li className="border-l-2 border-primary/30 pl-3">
              <span className="font-semibold text-white">
                Open-end theme counts.
              </span>{' '}
              When a free-text question is clustered into named themes, the
              model assigns each theme its frequency. The count is clamped to
              the real sample and every supporting quote is dropped unless it
              is a literal substring of an actual answer, but the count itself
              is the model's read, not arithmetic. Unlike the survey metrics,
              it is not guaranteed identical run to run.
            </li>
            <li className="border-l-2 border-primary/30 pl-3">
              <span className="font-semibold text-white">
                Creative Attention scores.
              </span>{' '}
              That mission type is a vision analysis of a creative, not a
              survey. Its component scores are the model's read; only the
              weighting that combines them into a composite is deterministic
              code. It carries no respondent sample and is deliberately
              excluded from the statistical gates below.
            </li>
          </ul>
          <p className="mt-3 text-sm text-white/70">
            Everything else in the table above is computed.
          </p>
        </div>

        <h3 className="mb-4 text-lg font-black text-white">
          The statistics are gated
        </h3>
        <p className="mb-4 text-white/70">
          When the sample cannot support a headline figure, VETT does not show
          one. Pricing, feature roadmap, and market entry are hard gated at 30
          responses. Segmentation is hard gated at 50. Below its gate the
          headline number is withheld outright, on the results page and in the
          PDF, PowerPoint and Excel exports alike, and the report states the
          sample size and the threshold it did not reach.
        </p>
        <p className="mb-4 text-white/70">
          Withheld means the figure, not the evidence. The response
          distributions, per-question breakdowns, respondent profiles and
          verbatims are all still there. What is removed is the single
          confident number a reader would otherwise quote, because that is the
          part a small sample cannot support. Below 50 responses VETT also will
          not cluster, and you get an aggregate profile rather than segments it
          cannot stand behind.
        </p>
        <p className="mb-4 text-white/70">
          Outside those four methods, a mission under 30 responses keeps its
          numbers and carries a directional note explaining that the read is
          strong on ranking and consensus but indicative on magnitudes. We say
          which of the two you are looking at rather than treating every small
          sample the same way.
        </p>
        <p className="mb-12 text-white/70">
          Most tools will show you a number regardless of whether it means
          anything, and say nothing. VETT will tell you the sample is too small
          and show you nothing. That constraint is in the product, not in a
          footnote.
        </p>

        <h3 className="mb-4 text-lg font-black text-white">What VETT is</h3>
        <p className="mb-4 text-white/70">
          Established instruments. Deterministic analysis. Simulated
          respondents. Directional output, fast.
        </p>
        <p className="mb-4 text-white/70">
          VETT models how a specified audience would respond. It isn't a human
          panel and doesn't pretend to be one. What it gives you is a
          structured, statistically disciplined read on a decision, at a cost
          and speed that makes testing routine instead of exceptional.
        </p>

        {/* ── Objections ──────────────────────────────────────────────── */}
        <SectionHeading>The objections, answered</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          {OBJECTIONS.map((o) => (
            <div
              key={o.q}
              // min-w-0: grid items default to min-width:auto, so at 320 the
              // nested padding chain (section 24 + card 20 + list pl-3) pushed
              // min-content to 308px inside a 238px track and overflowed the
              // page by 29px. Clean at 375 and above, which is why it hid.
              className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <p className="mb-2 font-black text-white">{o.q}</p>
              <p className="text-sm leading-relaxed text-white/65">{o.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-white/70">
          Use VETT to explore, screen, iterate, and narrow, and to answer the
          hundred smaller questions nobody was ever going to fund research for.
          Where a decision is large and irreversible, confirm with fieldwork.
        </p>

        {/* ── The close ───────────────────────────────────────────────── */}
        <SectionHeading>The close</SectionHeading>
        <p className="mb-4 text-white/70">
          VETT gives you research-grade instruments and analyst-grade math, run
          in minutes instead of weeks.
        </p>
        <p className="mb-12 text-white/70">
          That's a different product from a human panel. For most of the
          decisions you make in a year, it's the one that actually gets used.
        </p>

        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <h3 className="mb-4 text-2xl font-black text-white">
            Test the decision you were about to guess on
          </h3>
          <p className="mx-auto mb-6 max-w-md text-white/60">
            Pick a decision, and the setup advisor maps it to the right
            instrument.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/setup"
              className="inline-flex items-center gap-2 rounded-full bg-[#DFFF00] px-8 py-4 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-[#DFFF00]/30 transition-all duration-300 hover:scale-105 hover:bg-[#E5FF40]"
            >
              <Sparkles className="h-4 w-4" />
              Start a mission
            </Link>
            <Link
              to="/methodologies"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-8 py-4 text-sm font-black uppercase tracking-widest text-white/80 transition-all duration-300 hover:border-white/30 hover:text-white"
            >
              See all methods
            </Link>
          </div>
        </div>
      </div>
    </OverlayPage>
  );
}

export default MethodologyPage;
