/**
 * Layer 2 — "How it works", built as a VISUAL with a real survey question and
 * a real output panel, not abstract icons.
 *
 * SELF-CONTAINED BY DESIGN. This component imports nothing from the rest of
 * the app except React and lucide-react icons, and it styles itself with plain
 * Tailwind utilities (no `glass-panel`, no shared layout wrappers, no router).
 * That is deliberate: the landing page is being rebuilt in parallel, and this
 * block has to drop into whatever the new LandingPage looks like without a
 * merge conflict or a missing-import cascade. Render it anywhere:
 *
 *     <HowItWorksVisual />
 *
 * ── PROVENANCE OF THE ARTIFACTS BELOW ─────────────────────────────────────
 * Nothing here is a mockup of a VETT artifact. Both halves are real:
 *
 *  1. CANONICAL_WORDING — copied verbatim out of the generator prompts in the
 *     backend, vettit-backend/src/services/claudeAI.js:
 *       - Van Westendorp script          claudeAI.js:617-621
 *       - Kano functional/dysfunctional  claudeAI.js:765-766
 *       - MaxDiff best-worst set         claudeAI.js:762
 *       - NPS                            claudeAI.js:907
 *     These are the exact strings the instrument builder is told to emit.
 *
 *  2. REFERENCE_QUESTION + REFERENCE_OUTPUT — real values read out of the
 *     `missions` row for the completed reference mission
 *     5a07eaf8-a713-4411-aa5b-ae41b628f0ff (audience_profiling, n=60,
 *     12 questions). The question text is that mission's q6; the output panel
 *     is that mission's `missions.analysis` JSONB, produced by
 *     computeAudienceProfiling (vettit-backend/src/services/analysis/
 *     audienceProfiling.js).
 *
 *     This is an OWNER-RUN reference mission, not a customer's. No customer
 *     data appears on this page.
 *
 * ── COPY RULES ────────────────────────────────────────────────────────────
 * No em dashes and no en dashes anywhere in user-facing strings (hyphens or
 * the word "to"). Every claim in the step text is verified against the
 * backend; see the notes on MethodologyPage.tsx for the claim-by-claim map.
 */

import { FileText, Users, Braces, Sigma, Target } from 'lucide-react';

// ── Real canonical instrument wording, quoted from the generator prompts ────
const CANONICAL_WORDING: Array<{ method: string; text: string }> = [
  {
    method: 'Van Westendorp',
    text: 'At what price would [product] be SO EXPENSIVE you would not consider buying it?',
  },
  {
    method: 'Kano (functional)',
    text: 'How would you feel if [feature] WAS in the product?',
  },
  {
    method: 'MaxDiff',
    text: 'Of these 4 features, which is MOST important to you, and which is LEAST important?',
  },
  {
    method: 'NPS',
    text: 'How likely are you to recommend [brand] to a friend or colleague?',
  },
];

// ── The real question, verbatim from the reference mission ─────────────────
const REFERENCE_QUESTION = {
  id: 'q6',
  text: 'The grooming brands I use reflect my personal image and say something meaningful about who I am.',
  scale: 'Agreement, 1 to 5',
  battery: 'Status orientation',
};

// ── The real output, verbatim from that mission's analysis JSONB ────────────
const REFERENCE_OUTPUT = {
  n: 60,
  posture: 'segmented' as const,
  keyDimension: 'Status orientation',
  segments: [
    {
      id: 'seg_1',
      name: 'Status-seekers, early adopters',
      n: 43,
      sizePct: 71.7,
      signature: [
        { label: 'Status orientation', mean: 4.21, delta: 0.71 },
        { label: 'Novelty-seeking', mean: 3.7, delta: 0.62 },
        { label: 'Price sensitivity', mean: 2.44, delta: -0.49 },
      ],
    },
    {
      id: 'seg_2',
      name: 'Understated pragmatists',
      n: 17,
      sizePct: 28.3,
      signature: [
        { label: 'Status orientation', mean: 1.71, delta: -1.79 },
        { label: 'Novelty-seeking', mean: 1.53, delta: -1.55 },
        { label: 'Price sensitivity', mean: 4.18, delta: 1.25 },
      ],
    },
  ],
};

const STEPS: Array<{ n: string; title: string; body: string; Icon: typeof FileText }> = [
  {
    n: '1',
    title: 'You describe the decision.',
    body: 'Not a survey, a decision. "Should we launch this in Saudi?" "Which of these three concepts?" "What will people pay?" VETT works out what needs to be measured.',
    Icon: Target,
  },
  {
    n: '2',
    title: 'VETT builds the right instrument.',
    body: 'Every mission maps to an established research method with canonical question wording. Van Westendorp for price sensitivity. MaxDiff for feature trade-offs. Kano for satisfaction drivers. Exposed and control cells for campaign lift. Structural validators run at generation, before anything is fielded: an unbalanced MaxDiff set or a broken Kano pair is rejected and rebuilt, and if it still fails it comes back to you to fix rather than going out quietly.',
    Icon: FileText,
  },
  {
    n: '3',
    title: 'Respondents are built to match your audience.',
    body: 'Market, demographics, category behaviour, and any screening criteria you set. Screeners are enforced at generation, so the sample you specified is the sample that answers: no drop-off, no quota chasing, no fieldwork delay.',
    Icon: Users,
  },
  {
    n: '4',
    title: 'Each respondent answers in character.',
    body: 'Every respondent completes the full instrument individually and gives its reasoning for each answer. On missions up to 50 respondents that reasoning is stored next to the response, and any question in your report opens the actual reasoning behind a sample of the answers. Most research never shows you that.',
    Icon: Braces,
  },
  {
    n: '5',
    title: 'The analysis is deterministic.',
    body: 'Every survey figure in your report is computed by code. NPS, top-two-box intent, optimal price point, demand index, segment sizes, lift: calculated by the same statistical routines a research analyst would apply. The language model writes the narrative around those numbers. It does not produce them.',
    Icon: Sigma,
  },
];

function DeltaPill({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${
        up ? 'bg-[#BEF264]/10 text-[#BEF264]' : 'bg-white/5 text-white/45'
      }`}
    >
      {up ? '+' : ''}
      {delta.toFixed(2)}
    </span>
  );
}

export function HowItWorksVisual() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="w-full rounded-3xl border border-white/10 bg-[#0B0C15] p-6 sm:p-10"
    >
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#BEF264]">
        How it works
      </p>
      <h2
        id="how-it-works-heading"
        className="mb-10 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl"
      >
        A real instrument in, a computed answer out.
      </h2>

      {/* ── The five steps ─────────────────────────────────────────────── */}
      <ol className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map(({ n, title, body, Icon }) => (
          <li
            key={n}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#BEF264]/10 font-mono text-xs font-black text-[#BEF264]">
                {n}
              </span>
              <Icon className="h-4 w-4 text-white/35" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-base font-black leading-snug text-white">
              {title}
            </h3>
            <p className="text-[13px] leading-relaxed text-white/60">{body}</p>
          </li>
        ))}
      </ol>

      {/* ── The concrete half: a real question, a real output panel ─────── */}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-black text-white">
          What that actually looks like
        </h3>
        <p className="text-[11px] text-white/40">
          Real artifacts from a completed VETT mission, not a mockup
        </p>
      </div>

      {/* min-w-0 on BOTH children: grid items default to min-width:auto, so
          at 320 the nested padding chain (section 24 + card 20 + inner card 16
          + li border-l-2 pl-3) pushed min-content to 308px inside a 238px
          track and overflowed the page by 29px. Clean at 375 and above, which
          is why it hid. */}
      <div className="grid gap-4 lg:grid-cols-2 [&>div]:min-w-0">
        {/* LEFT — the instrument */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
            In: the instrument
          </p>

          {/* One real question, verbatim */}
          <div className="mb-5 rounded-xl border border-[#BEF264]/25 bg-[#BEF264]/[0.04] p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-[#BEF264]/15 px-1.5 py-0.5 font-mono text-[10px] font-black text-[#BEF264]">
                {REFERENCE_QUESTION.id.toUpperCase()}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/40">
                {REFERENCE_QUESTION.battery} battery
              </span>
            </div>
            <p className="mb-4 text-sm font-semibold leading-relaxed text-white">
              {REFERENCE_QUESTION.text}
            </p>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((v) => (
                <span
                  key={v}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] font-mono text-[11px] text-white/45"
                >
                  {v}
                </span>
              ))}
              <span className="ml-2 text-[10px] text-white/35">
                {REFERENCE_QUESTION.scale}
              </span>
            </div>
          </div>

          {/* Canonical wording, quoted from the generator */}
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
            Canonical wording, as generated
          </p>
          <ul className="space-y-2.5">
            {CANONICAL_WORDING.map((w) => (
              <li key={w.method} className="border-l-2 border-white/10 pl-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#BEF264]/70">
                  {w.method}
                </p>
                <p className="text-[12.5px] leading-relaxed text-white/65">
                  {w.text}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT — the output */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
              Out: the computed panel
            </p>
            <span className="rounded-md border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/50">
              n = {REFERENCE_OUTPUT.n}
            </span>
          </div>

          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] text-white/45">
              Segmentation gate cleared at n = 50. Clustering ran. Key
              dimension:{' '}
              <span className="font-semibold text-white/80">
                {REFERENCE_OUTPUT.keyDimension}
              </span>
              .
            </p>
          </div>

          <div className="space-y-3">
            {REFERENCE_OUTPUT.segments.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h4 className="text-sm font-black text-white">{s.name}</h4>
                  <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-[#BEF264]">
                    {s.sizePct}%
                  </span>
                </div>

                <div
                  className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
                  role="img"
                  aria-label={`${s.name}: ${s.sizePct} percent of the sample`}
                >
                  <div
                    className="h-full rounded-full bg-[#BEF264]"
                    style={{ width: `${s.sizePct}%` }}
                  />
                </div>

                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/35">
                  n = {s.n} · signature vs sample mean
                </p>
                <ul className="space-y-1.5">
                  {s.signature.map((d) => (
                    <li
                      key={d.label}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="truncate text-[12px] text-white/65">
                        {d.label}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="font-mono text-[12px] tabular-nums text-white/80">
                          {d.mean.toFixed(2)}
                        </span>
                        <DeltaPill delta={d.delta} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provenance. The whole point of the block is that it is checkable. */}
      <p className="mt-5 text-[11px] leading-relaxed text-white/35">
        Question wording is quoted from the instrument generator. The output
        panel is the stored analysis of a completed VETT reference mission
        (audience profiling, n = 60), run by us, not by a customer. Figures are
        reproduced as computed: k-means clustering with a fixed seed, so the
        same responses give the same segments every time.
      </p>
    </section>
  );
}

export default HowItWorksVisual;
