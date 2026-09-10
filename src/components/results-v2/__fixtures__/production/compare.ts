/**
 * GENERATED FROM PRODUCTION - do not hand-edit.
 *
 * compare - P47 onboarding concept compare. Proves the compare() adapter (forced choice).
 *
 * Produced by running the backend's real `buildCanonicalReport(mission,
 * mission.analysis, mission_responses)` (vettit-backend
 * src/services/report/buildReport.js) against production mission
 * e130260f-8492-46f2-9096-5ad64cad7613 (n = 5 distinct personas,
 * completed 2026-06-13T19:38:03.814+00:00) and serialising the result. Nothing here is
 * hand-authored: `centerpiece.data` is the mission's stored `analysis`
 * column verbatim, which is exactly what the adapter reads in production.
 *
 * Two deliberate departures from the wire payload, both size-only and both
 * matching what the three fixtures already in this directory do:
 *   - open-text verbatims are capped at 3 per question, theme quotes at 2;
 *   - `centerpiece.gate` is dropped, because `buildCenterpiece()` returns
 *     before any adapter runs when `gate.suppress_headline` is set, and the
 *     point of this fixture is to execute the adapter. The gate the backend
 *     actually computed for this mission was:
 *       {"posture":"directional","note":"Directional read at n=5, strong on ranking and consensus, indicative on point magnitudes. We recommend n≥30 for confident estimates.","suppress_headline":false,"threshold":30,"n":5,"reason":"small_base"}
 */
import type { CanonicalReport } from '../../../results/report/useCanonicalReport';

/*
 * Assigned through a `const` rather than written as a literal on the exported
 * declaration on purpose. TypeScript's excess-property check only fires on a
 * FRESH object literal, and the wire payload carries fields the frontend's
 * `CanonicalReport` does not declare - production persona rows, for instance,
 * carry an `n`. A report parsed from `GET /api/results/:id/report` is not
 * excess-property-checked either, so narrowing this data to make a literal
 * compile would make the fixture LESS like production, which is the one thing
 * it must not be. Every declared field is still structurally checked.
 */
const RAW = {
  "schema_version": 1,
  "header": {
    "title": "P47, onboarding concept compare",
    "brief": "Compare two onboarding concepts for a personal-finance app. Concept A: a 3-step guided setup wizard. Concept B: an AI chat that builds your budget automatically from your bank data.",
    "methodology": "compare",
    "methodology_label": "Concept Comparison",
    "sample": {
      "n": 5,
      "qualified": 5,
      "delivered": 5,
      "posture": "directional",
      "completed_at": "2026-06-13T19:38:03.814+00:00",
      "mission_id": "e130260f-8492-46f2-9096-5ad64cad7613"
    }
  },
  "headline": {
    "metric": "Concept A (winner)",
    "value": "80% forced choice",
    "all": [
      {
        "label": "Concept A (winner)",
        "value": "80% forced choice"
      },
      {
        "label": "Concept B",
        "value": "20% forced choice"
      },
      {
        "label": "None of these",
        "value": "0%"
      }
    ]
  },
  "centerpiece": {
    "methodology": "compare",
    "data": {
      "n": 5,
      "concepts": [
        {
          "label": "Concept A",
          "concept_id": "cA",
          "dimensions": {
            "appeal": {
              "n": 5,
              "mean": 7,
              "ci_low": 7,
              "stddev": 0,
              "ci_high": 7
            },
            "intent": {
              "base": 5,
              "top2": {
                "pct": 100,
                "base": 5,
                "count": 5
              },
              "options": [
                "Definitely would buy",
                "Probably would buy",
                "Might or might not",
                "Probably would NOT buy",
                "Definitely would NOT buy"
              ],
              "distribution": {
                "Probably would buy": 5
              }
            },
            "relevance": {
              "n": 5,
              "mean": 6,
              "ci_low": 6,
              "stddev": 0,
              "ci_high": 6
            },
            "uniqueness": {
              "n": 5,
              "mean": 3.6,
              "ci_low": 3.1199,
              "stddev": 0.5477,
              "ci_high": 4.0801
            }
          },
          "final_choice_pct": {
            "pct": 80,
            "base": 5,
            "count": 4
          }
        },
        {
          "label": "Concept B",
          "concept_id": "cB",
          "dimensions": {
            "appeal": {
              "n": 5,
              "mean": 4.8,
              "ci_low": 3.1139,
              "stddev": 1.9235,
              "ci_high": 6.4861
            },
            "intent": {
              "base": 5,
              "top2": {
                "pct": 20,
                "base": 5,
                "count": 1
              },
              "options": [
                "Definitely would buy",
                "Probably would buy",
                "Might or might not",
                "Probably would NOT buy",
                "Definitely would NOT buy"
              ],
              "distribution": {
                "Might or might not": 2,
                "Probably would buy": 1,
                "Probably would NOT buy": 2
              }
            },
            "relevance": {
              "n": 5,
              "mean": 4.2,
              "ci_low": 2.5139,
              "stddev": 1.9235,
              "ci_high": 5.8861
            },
            "uniqueness": {
              "n": 5,
              "mean": 6,
              "ci_low": 6,
              "stddev": 0,
              "ci_high": 6
            }
          },
          "final_choice_pct": {
            "pct": 20,
            "base": 5,
            "count": 1
          }
        }
      ],
      "computed_at": "2026-06-17T08:12:05.513Z",
      "methodology": "compare",
      "final_choice": {
        "base": 5,
        "none": {
          "pct": 0,
          "count": 0
        },
        "options": {
          "Concept A": {
            "pct": 80,
            "count": 4
          },
          "Concept B": {
            "pct": 20,
            "count": 1
          }
        },
        "question_id": "q12"
      },
      "head_to_head": [
        {
          "delta": 2.2,
          "metric": "mean_diff",
          "dimension": "appeal",
          "winner_concept_id": "cA",
          "runner_up_concept_id": "cB"
        },
        {
          "delta": 1.8,
          "metric": "mean_diff",
          "dimension": "relevance",
          "winner_concept_id": "cA",
          "runner_up_concept_id": "cB"
        },
        {
          "delta": 2.4,
          "metric": "mean_diff",
          "dimension": "uniqueness",
          "winner_concept_id": "cB",
          "runner_up_concept_id": "cA"
        },
        {
          "delta": 80,
          "metric": "top2_pp_diff",
          "dimension": "intent",
          "winner_concept_id": "cA",
          "runner_up_concept_id": "cB"
        }
      ],
      "overall_winner": {
        "by": "final_choice",
        "concept_id": "cA"
      },
      "analysis_version": 1
    }
  },
  "key_findings": [
    {
      "label": "Concept A (winner)",
      "trend": "neutral",
      "value": "80% forced choice"
    },
    {
      "label": "Concept B",
      "trend": "neutral",
      "value": "20% forced choice"
    },
    {
      "label": "None of these",
      "trend": "neutral",
      "value": "0%"
    }
  ],
  "recommendations": [
    "Act on the headline finding (Concept A (winner): 80% forced choice) and review the full survey below for the supporting detail behind it.",
    "Weigh Concept B (20% forced choice) in the decision, it is among the strongest signals in this study.",
    "Weigh None of these (0%) in the decision, it is among the strongest signals in this study."
  ],
  "finding": "Concept A is the clear winner, chosen by 80% of respondents in a forced-choice final selection versus 20% for Concept B.",
  "synthesis": "Concept A is the clear winner, chosen by 80% of respondents in a forced-choice final selection versus 20% for Concept B. Concept A also dominated on purchase intent, 100% top-2 intent versus 20% for Concept B, an 80-percentage-point gap, and led on both appeal (mean 7.0 vs. 4.8) and relevance (mean 6.0 vs. 4.2); Concept B's only edge was uniqueness (mean 6.0 vs. 3.6, a 2.4-point delta). Given that Concept A wins on every commercially critical dimension, the forward-looking recommendation is to advance Concept A into the next development stage while exploring whether any of Concept B's uniqueness drivers can be incorporated to sharpen differentiation, noting that with n=5 this is a directional signal requiring validation at scale.",
  "personas": [
    {
      "name": "High-Income Respondents",
      "role": "Real Estate Consultant",
      "share": "40%",
      "n": 2,
      "description": "Prioritise stability and wealth accumulation; skeptical decision-makers; ages 42-42."
    },
    {
      "name": "Mid-Income Respondents",
      "role": "HR Manager",
      "share": "40%",
      "n": 2,
      "description": "Prioritise stability and security; methodical decision-makers; ages 42-42."
    }
  ],
  "screening": {
    "question_id": "q1",
    "question": "Which of the following best describes your relationship with personal finance apps?",
    "qualified": 5,
    "distribution": {
      "I have used a personal finance app in the past": 4,
      "I currently use a personal finance app": 1
    }
  },
  "exec_summary": "Concept A is the clear winner, chosen by 80% of respondents in a forced-choice final selection versus 20% for Concept B. Concept A also dominated on purchase intent, 100% top-2 intent versus 20% for Concept B, an 80-percentage-point gap, and led on both appeal (mean 7.0 vs. 4.8) and relevance (mean 6.0 vs. 4.2); Concept B's only edge was uniqueness (mean 6.0 vs. 3.6, a 2.4-point delta). Given that Concept A wins on every commercially critical dimension, the forward-looking recommendation is to advance Concept A into the next development stage while exploring whether any of Concept B's uniqueness drivers can be incorporated to sharpen differentiation, noting that with n=5 this is a directional signal requiring validation at scale.",
  "survey": [
    {
      "number": 1,
      "id": "q1",
      "text": "Which of the following best describes your relationship with personal finance apps?",
      "type": "single",
      "renderer": "screener",
      "renderer_label": "screener",
      "options": [
        "I currently use a personal finance app",
        "I have used a personal finance app in the past",
        "I have never used a personal finance app"
      ],
      "isScreening": true,
      "data": {
        "distribution": {
          "I have used a personal finance app in the past": 4,
          "I currently use a personal finance app": 1
        },
        "n": 5
      },
      "insight": "4 of 5 respondents are past users of personal finance apps and 1 currently uses one, meaning this directional sample skews toward lapsed users who may carry unmet expectations from prior tools."
    },
    {
      "number": 2,
      "id": "q2",
      "text": "Considering Concept A: a 3-step guided setup wizard that walks you through connecting your accounts, setting your goals, and reviewing a summary before you begin. How appealing is this concept?",
      "type": "rating",
      "renderer": "scale_generic",
      "renderer_label": "numeric scale",
      "options": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 10,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 0,
          "5": 0,
          "6": 0,
          "7": 5,
          "8": 0,
          "9": 0,
          "10": 0
        },
        "average": 7,
        "n": 5,
        "ci_low": 7,
        "ci_high": 7,
        "stddev": 0
      },
      "insight": "All 5 respondents rated Concept A's appeal at exactly 7 out of 10, producing a perfectly uniform average of 7.0, solid but not enthusiastic, with no one pushing into the 8-10 range in this small sample."
    },
    {
      "number": 3,
      "id": "q3",
      "text": "How relevant is Concept A, a 3-step guided setup wizard, to your needs when getting started with a personal-finance app?",
      "type": "rating",
      "renderer": "scale_1_7",
      "renderer_label": "1-7 scale",
      "options": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 7,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 0,
          "5": 0,
          "6": 5,
          "7": 0
        },
        "average": 6,
        "n": 5,
        "ci_low": 6,
        "ci_high": 6,
        "stddev": 0
      },
      "insight": "Every respondent rated Concept A's relevance at 6 out of 7, yielding a consensus average of 6.0, indicating the guided setup wizard lands as highly relevant to getting started, with no one rating it at the top score of 7 in this directional sample."
    },
    {
      "number": 4,
      "id": "q4",
      "text": "How different is Concept A, a 3-step guided setup wizard, from other onboarding concepts for personal-finance app options you have seen or used?",
      "type": "rating",
      "renderer": "scale_1_7",
      "renderer_label": "1-7 scale",
      "options": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 7,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 2,
          "4": 3,
          "5": 0,
          "6": 0,
          "7": 0
        },
        "average": 3.6,
        "n": 5,
        "ci_low": 3.12,
        "ci_high": 4.08,
        "stddev": 0.55
      },
      "insight": "Ratings split between 3 (2 respondents) and 4 (3 respondents), averaging 3.6 on a 1-7 scale, placing Concept A squarely in the middle, suggesting the guided wizard is perceived as familiar rather than a standout differentiator."
    },
    {
      "number": 5,
      "id": "q5",
      "text": "If Concept A, a 3-step guided setup wizard, were available in a personal-finance app, how likely would you be to use it?",
      "type": "single",
      "renderer": "single_select",
      "renderer_label": "single choice",
      "options": [
        "Definitely would buy",
        "Probably would buy",
        "Might or might not",
        "Probably would NOT buy",
        "Definitely would NOT buy"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Probably would buy": 5
        },
        "n": 5
      },
      "insight": "All 5 respondents said they 'Probably would buy' if Concept A were available, strong directional purchase intent, though this sample of 5 cannot support a statistically certain claim."
    },
    {
      "number": 6,
      "id": "q6",
      "text": "What is the best thing and the worst thing about Concept A, a 3-step guided setup wizard, as an onboarding experience for a personal-finance app?",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "The best thing is that it puts me in control. I review everything before it starts, so no transfer to my brother gets mislabeled as spending. The worst thing is that even three steps might be tedious on a weekend when I have family time, and I'm not sure the wizard handles multiple currencies and informal loans well.",
          "The best thing is that I can see exactly what I'm doing at each step and review everything before I commit. I had that with YNAB at first but then got tired of typing everything manually. The worst thing is that someone still has to do the work to connect everything correctly, and if you mess up a step, you might have to start over or fix things later.",
          "The best thing is that it's clear and straightforward, no confusion about what to do or where to start. The worst thing is it still doesn't solve the problem of having to manually enter transactions later, which is what made me stop using the other apps I tried."
        ],
        "n": 5
      },
      "insight": "Open-text responses were collected from all 5 respondents; themes should be reviewed in the verbatims directly, as no quantitative distribution is available to summarize here."
    },
    {
      "number": 7,
      "id": "q7",
      "text": "Considering Concept B: an AI chat that builds your budget automatically from your bank data by analyzing your transactions and generating a personalized budget without manual setup. How appealing is this concept?",
      "type": "rating",
      "renderer": "scale_generic",
      "renderer_label": "numeric scale",
      "options": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 10,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 1,
          "4": 2,
          "5": 1,
          "6": 0,
          "7": 0,
          "8": 1,
          "9": 0,
          "10": 0
        },
        "average": 4.8,
        "n": 5,
        "ci_low": 3.11,
        "ci_high": 6.49,
        "stddev": 1.92
      },
      "insight": "Concept B averaged 4.8 out of 10 on appeal, with ratings spread across 3, 4, 4, 5, and 8, a wide range that signals divided reactions, roughly 2 full points below Concept A's uniform 7.0 in this sample."
    },
    {
      "number": 8,
      "id": "q8",
      "text": "How relevant is Concept B, an AI chat that builds your budget automatically from your bank data, to your needs when getting started with a personal-finance app?",
      "type": "rating",
      "renderer": "scale_1_7",
      "renderer_label": "1-7 scale",
      "options": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 7,
        "distribution": {
          "1": 0,
          "2": 1,
          "3": 1,
          "4": 1,
          "5": 1,
          "6": 0,
          "7": 1
        },
        "average": 4.2,
        "n": 5,
        "ci_low": 2.51,
        "ci_high": 5.89,
        "stddev": 1.92
      },
      "insight": "Relevance ratings for Concept B spanned the full range from 2 to 7, averaging 4.2 out of 7, notably lower and more fragmented than Concept A's 6.0, pointing to uneven fit with respondents' actual needs in this directional sample."
    },
    {
      "number": 9,
      "id": "q9",
      "text": "How different is Concept B, an AI chat that builds your budget automatically from your bank data, from other onboarding concepts for personal-finance app options you have seen or used?",
      "type": "rating",
      "renderer": "scale_1_7",
      "renderer_label": "1-7 scale",
      "options": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 7,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 0,
          "5": 0,
          "6": 5,
          "7": 0
        },
        "average": 6,
        "n": 5,
        "ci_low": 6,
        "ci_high": 6,
        "stddev": 0
      },
      "insight": "All 5 respondents rated Concept B's differentiation at 6 out of 7, averaging 6.0, making it the clear perceived standout for novelty, the inverse of Concept A which averaged only 3.6 on the same scale."
    },
    {
      "number": 10,
      "id": "q10",
      "text": "If Concept B, an AI chat that builds your budget automatically from your bank data, were available in a personal-finance app, how likely would you be to use it?",
      "type": "single",
      "renderer": "single_select",
      "renderer_label": "single choice",
      "options": [
        "Definitely would buy",
        "Probably would buy",
        "Might or might not",
        "Probably would NOT buy",
        "Definitely would NOT buy"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Probably would NOT buy": 2,
          "Might or might not": 2,
          "Probably would buy": 1
        },
        "n": 5
      },
      "insight": "2 respondents said 'Probably would NOT buy,' 2 said 'Might or might not,' and only 1 said 'Probably would buy', purchase intent for Concept B is weak, contrasting sharply with Concept A's 5-of-5 'Probably would buy' result in this small sample."
    },
    {
      "number": 11,
      "id": "q11",
      "text": "What is the best thing and the worst thing about Concept B, an AI chat that builds your budget automatically from your bank data, as an onboarding experience for a personal-finance app?",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "The best thing is speed. If it actually worked correctly, I wouldn't need to spend my weekend evenings setting things up. The worst thing is trust. I don't believe an AI understands that my transfer to my brother is a loan, not spending, and I can't afford to discover categorization mistakes months later when I'm trying to plan my tax position or check my real cash flow.",
          "The best thing is that it saves me from all that tedious manual entry that made me quit my last app. I could just chat with it and let it figure things out. The worst thing is that I don't fully understand how it's deciding what goes in my budget, and I'm nervous about giving it access to all my bank data. What if it gets something wrong and I don't catch it? I need to know what's happening with my money.",
          "The best thing is that it does the heavy lifting for you, no manual data entry at all, which is exactly what frustrated me before. The worst thing is I need to trust that the AI understands my spending and my wife's spending separately, and I would worry about what happens to my transaction data and who can see it."
        ],
        "n": 5
      },
      "insight": "Open-text responses were collected from all 5 respondents; themes should be reviewed in the verbatims directly, as no quantitative distribution is available to summarize here."
    },
    {
      "number": 12,
      "id": "q12",
      "text": "Which concept did you find most appealing overall?",
      "type": "single",
      "renderer": "forced_choice",
      "renderer_label": "forced choice",
      "options": [
        "Concept A",
        "Concept B",
        "None of these"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Concept A": 4,
          "Concept B": 1
        },
        "n": 5
      },
      "insight": "4 of 5 respondents chose Concept A as the most appealing overall, with only 1 selecting Concept B, a clear directional preference for the guided wizard over the AI-automated approach in this sample."
    },
    {
      "number": 13,
      "id": "q13",
      "text": "Why?",
      "type": "text",
      "renderer": "forced_choice",
      "renderer_label": "forced choice",
      "options": [],
      "isScreening": false,
      "data": {
        "distribution": {
          "Concept A respects the complexity of my situation without trying to make assumptions I have to fight against later. I've been burned before with apps that don't understand rental income or family transfers. I'd rather spend an hour upfront in control than discover problems in my tax records three months down the line.": 1,
          "I prefer Concept A because I know exactly what I'm doing at each step. I understand the process, I can check things before I go forward, and I feel like I'm in control of my budget rather than trusting an AI to decide for me. I already worried about data privacy, and Concept B feels like I'm giving away too much visibility. Concept A feels safer.": 1,
          "Concept B solves the actual problem I gave up on with other apps, which was spending time every week entering transactions and fixing wrong categories. But I would need very clear information about how you keep my data private and whether the AI can tell the difference between my personal spending, my wife's spending, and my investment transactions. If you can guarantee that, I would definitely try it.": 1,
          "Concept A gives me the clarity and control I need. I can see what is happening at each step and decide if it is right for my family. Concept B sounds convenient but I am not comfortable with AI making decisions about my children's education savings and my family's security. I need to understand and approve what the app is doing with my money.": 1,
          "With Concept A, I can see what's happening and stop if something doesn't work for my business. I need to understand where every expense goes, especially across my three countries. Concept B sounds fast, but fast isn't worth losing control of my numbers.": 1
        },
        "n": 5
      },
      "insight": "All 4 Concept A choosers cited control, transparency, and step-by-step visibility as their reasons, while the 1 Concept B respondent acknowledged its appeal but conditioned adoption on explicit data-privacy guarantees, suggesting trust and agency are the dominant decision drivers in this directional sample."
    }
  ],
  "data_quality_notes": [],
  "methodology_disclaimer": "Results are generated by AI synthetic respondents calibrated to the audience spec. They are directional signal, not a substitute for fielding with real customers, especially at small sample sizes. Combine with real-customer data before making absolute claims."
};

export const COMPARE: CanonicalReport = RAW;
