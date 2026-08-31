/**
 * Recommended next missions: the repeat-purchase lever (owner decision: "c").
 *
 * Rule-based selection by the completed mission's goal_type, with the user's own
 * product context pre-filled into the follow-up setup. No AI call anywhere: the
 * context comes from the stored mission row, so rendering a recommendation costs
 * nothing and clicking one lands in /setup with the brief + Mission Context
 * already filled, one step from checkout.
 *
 * Gated (comingSoon) goal types are filtered at render via missionGoals.ts, so
 * newly un-gated types slot into these ladders automatically with no edits here.
 */

import { getGoalById, type MissionGoal } from '../data/missionGoals';

/** One-shot payload consumed (and cleared) by MissionSetupPage on mount. */
export const PREFILL_KEY = 'vett_setup_prefill';

export interface SetupPrefill {
  brief: string;
  brand?: string;
  category?: string;
  audience?: string;
  competitors?: string[];
}

/** The narrow mission-row slice the recommendation builder reads. */
export interface MissionContextRow {
  goal_type?: string | null;
  title?: string | null;
  brief?: string | null;
  brand_name?: string | null;
  category?: string | null;
  audience_description?: string | null;
  competitor_brands?: string[] | null;
}

export interface NextMission {
  goal: string;
  label: string;
  emoji: string;
  /** One line of card copy: why THIS follow-up, referencing their product. */
  why: string;
  prefill: SetupPrefill;
}

type Tpl = (product: string, category: string) => string;

interface Rule { goal: string; why: Tpl; brief: Tpl }

// The research ladder: what a team naturally asks next after each study type.
// Order matters (first = strongest recommendation). Max 3 render after the
// comingSoon filter.
const RULES: Record<string, Rule[]> = {
  validate: [
    { goal: 'pricing', why: (p) => `You know ${p} resonates. Now find the price the market will pay.`, brief: (p, c) => `Find the right price for ${p}${c ? ` (${c})` : ''}. We validated demand and now need willingness to pay: the acceptable range, the optimal price point, and where resistance starts.` },
    { goal: 'competitor', why: (p) => `See who ${p} is really up against before you commit positioning.`, brief: (p, c) => `How does ${p} stack up against the competition${c ? ` in ${c}` : ''}? Measure share of preference and the attributes where we win or lose.` },
    { goal: 'naming_messaging', why: () => 'Lock the name and message that carry the validated concept.', brief: (p) => `Test names and messaging for ${p}. We validated the concept and now need the name and message that make it land with the target audience.` },
  ],
  compare: [
    { goal: 'validate', why: () => 'Deep-dive the winning concept with a full validation read.', brief: (p) => `Validate the winning concept for ${p} in depth: appeal, purchase intent, and the objections we still need to answer.` },
    { goal: 'pricing', why: () => 'Price the winner while the signal is fresh.', brief: (p, c) => `Find the right price for the winning ${p} concept${c ? ` (${c})` : ''}: acceptable range, optimal point, and resistance thresholds.` },
    { goal: 'marketing', why: () => 'Turn the winning concept into an ad and test it before spend.', brief: (p) => `Test ad effectiveness for ${p}: does the creative built on the winning concept drive recall, message takeout, and intent?` },
  ],
  pricing: [
    { goal: 'competitor', why: (p) => `Price is set. Now position ${p} against the alternatives buyers compare.`, brief: (p, c) => `How does ${p} compare against competitors${c ? ` in ${c}` : ''} on the attributes that justify our price point?` },
    { goal: 'validate', why: () => 'Re-test the concept at the optimal price to confirm demand holds.', brief: (p) => `Validate demand for ${p} at the recommended price point: does purchase intent hold when the price is shown up front?` },
    { goal: 'roadmap', why: () => 'Find which features justify the premium and which to build next.', brief: (p) => `Prioritize the feature roadmap for ${p}: which features drive willingness to pay and which are must-haves vs nice-to-haves.` },
  ],
  marketing: [
    { goal: 'brand_lift', why: () => 'Measure the lift this campaign actually creates, exposed vs control.', brief: (p) => `Measure brand lift for ${p}: awareness, consideration, and intent among exposed vs control audiences for the current campaign.` },
    { goal: 'naming_messaging', why: () => 'Sharpen the message the ad test says is underperforming.', brief: (p) => `Test messaging variants for ${p}: which framing of the core message drives the strongest recall and intent?` },
    { goal: 'satisfaction', why: () => 'Check the promise the ad makes against what customers experience.', brief: (p) => `Measure customer satisfaction for ${p}: NPS, CSAT, and where the delivered experience diverges from the advertised promise.` },
  ],
  satisfaction: [
    { goal: 'churn_research', why: () => 'Your detractors are telling you why they leave. Get the full driver tree.', brief: (p) => `Understand churn for ${p}: the drivers behind cancellations, which are fixable, and what would win leavers back.` },
    { goal: 'roadmap', why: () => 'Turn the satisfaction gaps into a prioritized build list.', brief: (p) => `Prioritize the roadmap for ${p} from the satisfaction gaps: which fixes and features move NPS the most.` },
    { goal: 'competitor', why: () => 'See whether unhappy customers have somewhere better to go.', brief: (p, c) => `Benchmark ${p} against competitors${c ? ` in ${c}` : ''}: where rivals beat us on the drivers our customers care about.` },
  ],
  roadmap: [
    { goal: 'pricing', why: () => 'Price the top-ranked feature before you build it.', brief: (p) => `Find willingness to pay for the top roadmap features of ${p}: which justify a price increase or a premium tier.` },
    { goal: 'validate', why: () => 'Validate the highest-stakes feature as a standalone concept.', brief: (p) => `Validate the top-priority feature for ${p} as a concept: appeal, intent, and objections before committing build time.` },
    { goal: 'satisfaction', why: () => 'Baseline satisfaction now so you can prove the roadmap moved it.', brief: (p) => `Baseline customer satisfaction for ${p} (NPS, CSAT) before the next roadmap wave ships, so improvement is measurable.` },
  ],
  research: [
    { goal: 'validate', why: () => 'Turn the strongest insight into a testable concept.', brief: (p) => `Validate the strongest concept that came out of our research on ${p}: appeal, purchase intent, and objections.` },
    { goal: 'competitor', why: () => 'Map the competitive field the research surfaced.', brief: (p, c) => `Analyze the competitive landscape around ${p}${c ? ` in ${c}` : ''}: share of preference and attribute strengths.` },
    { goal: 'pricing', why: () => 'Put a number on the demand the research found.', brief: (p, c) => `Run a pricing study for ${p}${c ? ` (${c})` : ''}: acceptable range, optimal price point, and resistance thresholds.` },
  ],
  competitor: [
    { goal: 'naming_messaging', why: () => 'You know where you win. Say it in a message competitors cannot copy.', brief: (p) => `Test differentiated messaging for ${p} built on the attributes where we beat competitors.` },
    { goal: 'brand_lift', why: () => 'Track whether your brand is gaining or losing ground over time.', brief: (p) => `Measure brand health for ${p} vs key competitors: awareness, consideration, and preference movement.` },
    { goal: 'pricing', why: () => 'Price against the alternatives buyers actually compare you to.', brief: (p, c) => `Price ${p} relative to the competitive set${c ? ` in ${c}` : ''}: where the acceptable range sits vs the alternatives.` },
  ],
  naming_messaging: [
    { goal: 'marketing', why: () => 'Put the winning name into a real ad and test it before spend.', brief: (p) => `Test an ad for ${p} using the winning name and message: recall, takeout, and intent before media spend.` },
    { goal: 'validate', why: () => 'Confirm the full concept lands under its new name.', brief: (p) => `Validate the ${p} concept under the winning name: appeal and purchase intent with the final naming in place.` },
    { goal: 'brand_lift', why: () => 'Baseline the new name so you can measure it building equity.', brief: (p) => `Baseline brand awareness for ${p} under the new name, so future campaigns can be measured against it.` },
  ],
  churn_research: [
    { goal: 'roadmap', why: () => 'Build the fixes churners asked for, in the order that saves the most.', brief: (p) => `Prioritize retention fixes for ${p}: rank the churn-driver fixes by how many at-risk customers each one saves.` },
    { goal: 'satisfaction', why: () => 'Baseline CSAT now, then prove the fixes moved it.', brief: (p) => `Measure customer satisfaction for ${p} post-fix: NPS and CSAT among current customers, benchmarked against the churn study.` },
    { goal: 'pricing', why: () => 'Test whether pricing or packaging is quietly driving the churn.', brief: (p) => `Test pricing and packaging for ${p}: is the current price a churn driver, and what structure would retain more customers.` },
  ],
  brand_lift: [
    { goal: 'marketing', why: () => 'Test the next creative before it goes live, not after.', brief: (p) => `Test the next campaign creative for ${p}: recall, message takeout, and intent, before the media spend commits.` },
    { goal: 'competitor', why: () => 'See how the lift translates into competitive position.', brief: (p, c) => `Measure ${p} vs competitors${c ? ` in ${c}` : ''}: has the campaign moved share of preference and key attributes.` },
    { goal: 'satisfaction', why: () => 'New audiences arrived from the campaign. Check what they experience.', brief: (p) => `Measure satisfaction for ${p} among recent customers: are campaign-acquired customers as satisfied as the base.` },
  ],
};

/** Strip the "Goal Label: " prefix the setup flow prepends to briefs. */
function productFrom(row: MissionContextRow): string {
  const brand = (row.brand_name || '').trim();
  if (brand) return brand;
  const title = (row.title || '').trim();
  if (title) return title.replace(/^[^:]{0,40}:\s*/, '') || title;
  return 'our product';
}

/**
 * Build up to `max` recommendations for a completed mission. Returns [] when the
 * goal type has no ladder (unknown/gated types): callers hide the section.
 */
export function buildNextMissions(row: MissionContextRow, max = 3): NextMission[] {
  const rules = RULES[row.goal_type || ''] || [];
  const product = productFrom(row);
  const category = (row.category || '').trim();
  const out: NextMission[] = [];
  for (const rule of rules) {
    if (out.length >= max) break;
    const g: MissionGoal | undefined = getGoalById(rule.goal);
    if (!g || g.comingSoon) continue; // gated types drop out; auto-appear on un-gate
    out.push({
      goal: g.id,
      label: g.label,
      emoji: g.emoji,
      why: rule.why(product, category),
      prefill: {
        brief: rule.brief(product, category),
        brand: row.brand_name || undefined,
        category: row.category || undefined,
        audience: row.audience_description || undefined,
        competitors: Array.isArray(row.competitor_brands) && row.competitor_brands.length
          ? row.competitor_brands.slice(0, 5)
          : undefined,
      },
    });
  }
  return out;
}

/** Card click: stage the one-shot payload + goal, then route to /setup. */
export function stageNextMission(rec: NextMission): string {
  try {
    sessionStorage.setItem('vett_landing_goal', rec.goal); // survives OAuth redirects
    sessionStorage.setItem(PREFILL_KEY, JSON.stringify(rec.prefill));
  } catch { /* private mode: URL ?goal= still carries the goal; context is lost */ }
  return `/setup?goal=${encodeURIComponent(rec.goal)}`;
}
