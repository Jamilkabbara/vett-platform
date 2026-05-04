import { useState } from 'react';
import { Activity, Eye, Megaphone, Smile, Target, ShoppingCart, Image as ImageIcon, Globe, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export type KPITemplateId =
  | 'funnel_overview'
  | 'brand_awareness_builder'
  | 'ad_recall_optimizer'
  | 'brand_perception_shift'
  | 'consideration_driver'
  | 'purchase_intent_generator'
  | 'creative_effectiveness'
  | 'multi_market_comparison';

export interface KPITemplate {
  id: KPITemplateId;
  title: string;
  desc: string;
  questions: string[];
  icon: typeof Activity;
}

export const KPI_TEMPLATES: KPITemplate[] = [
  { id: 'funnel_overview',           title: 'Funnel Overview',           desc: 'The default. Awareness → Consideration → Intent in 10-12 questions.',
    icon: Activity,
    questions: ['Screening', 'Unaided ad recall', 'Aided ad recall', 'Unaided brand awareness', 'Aided brand awareness', 'Brand familiarity', 'Brand favorability', 'Brand consideration', 'Purchase intent', 'NPS', 'Message association', 'Channel-specific recall'] },
  { id: 'brand_awareness_builder',   title: 'Brand Awareness Builder',   desc: 'Top-funnel focus. More recall + recognition questions, lighter on intent.',
    icon: Eye,
    questions: ['Screening', 'Unaided ad recall (3 prompts)', 'Aided ad recall', 'Unaided brand awareness (open)', 'Aided brand awareness', 'Brand familiarity', 'Top-of-mind recall', 'Brand attribution by channel'] },
  { id: 'ad_recall_optimizer',       title: 'Ad Recall Optimizer',       desc: 'Diagnose creative recall. Memorability + brand attribution + execution recall.',
    icon: Megaphone,
    questions: ['Screening', 'Unaided ad recall', 'Aided ad recall', 'Memorability score', 'Brand attribution from creative', 'Execution element recall', 'Message takeaway', 'Creative likeability'] },
  { id: 'brand_perception_shift',    title: 'Brand Perception Shift',    desc: 'Tracking attribute shifts. Brand image attributes + competitive perception.',
    icon: Smile,
    questions: ['Screening', 'Brand familiarity', 'Brand attributes (5-7)', 'Competitive attribute comparison', 'Brand favorability', 'Brand trust', 'Recommendation likelihood', 'Open perception'] },
  { id: 'consideration_driver',      title: 'Consideration Driver',      desc: 'Mid-funnel focus. What drives buyers to put your brand on their list.',
    icon: Target,
    questions: ['Screening', 'Brand familiarity', 'Consideration set (multi)', 'Brand favorability', 'Reasons to consider (multi)', 'Reasons NOT to consider', 'Purchase intent', 'Intent timing'] },
  { id: 'purchase_intent_generator', title: 'Purchase Intent Generator', desc: 'Bottom-funnel focus. Intent strength + price sensitivity + barriers.',
    icon: ShoppingCart,
    questions: ['Screening', 'Brand consideration', 'Purchase intent (1-5)', 'Intent timing (30/60/90 days)', 'Price expectation', 'Purchase channel preference', 'Purchase barriers (multi)', 'Promotion sensitivity'] },
  { id: 'creative_effectiveness',    title: 'Creative Effectiveness',    desc: 'Diagnose the creative itself: stopping power, clarity, resonance.',
    icon: ImageIcon,
    questions: ['Screening', 'Stopping power', 'Likeability', 'Clarity of message', 'Brand attribution', 'Memorability', 'Emotional response', 'Action intent'] },
  { id: 'multi_market_comparison',   title: 'Multi-Market Comparison',   desc: 'Cross-country/region brand health. Same questions side-by-side.',
    icon: Globe,
    questions: ['Screening', 'Brand familiarity', 'Aided brand awareness', 'Brand favorability', 'Purchase intent', 'NPS', 'Reasons to choose', 'Cultural relevance'] },
];

interface Props {
  value: KPITemplateId;
  onChange: (next: KPITemplateId) => void;
  aiSuggestedId?: KPITemplateId;
}

/**
 * Pass 25 Phase 1C — KPI template picker (8 cards). Expandable preview.
 * AI auto-select highlighted with lime border.
 */
export function KPITemplatePicker({ value, onChange, aiSuggestedId }: Props) {
  const [expanded, setExpanded] = useState<KPITemplateId | null>(null);

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--t1)]">KPI Template</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">Pick a question structure tailored to your goal</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {KPI_TEMPLATES.map(t => {
          const selected = t.id === value;
          const aiPick = t.id === aiSuggestedId;
          const Icon = t.icon;
          const isOpen = expanded === t.id;
          return (
            <div
              key={t.id}
              className={`rounded-xl border transition ${
                selected
                  ? 'border-[var(--lime)] bg-[var(--lime)]/5'
                  : aiPick
                  ? 'border-[var(--lime)] bg-[var(--bg3)]'
                  : 'border-[var(--b1)] bg-[var(--bg3)]'
              }`}
            >
              <button
                type="button"
                onClick={() => onChange(t.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-5 h-5 mt-0.5 ${selected ? 'text-[var(--lime)]' : 'text-[var(--t2)]'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[var(--t1)]">{t.title}</span>
                      {aiPick && !selected && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--lime)]/15 text-[var(--lime)] flex items-center gap-0.5 uppercase">
                          <Sparkles className="w-2.5 h-2.5" /> AI pick
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--t3)] mt-1 leading-snug">{t.desc}</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : t.id)}
                className="w-full text-[10px] text-[var(--t3)] px-4 pb-2 flex items-center gap-1 hover:text-[var(--t1)]"
              >
                {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {isOpen ? 'Hide' : 'Show'} the {t.questions.length} questions
              </button>
              {isOpen && (
                <ol className="px-4 pb-3 text-[11px] text-[var(--t2)] space-y-0.5 list-decimal list-inside">
                  {t.questions.map(q => <li key={q}>{q}</li>)}
                </ol>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KPITemplatePicker;
