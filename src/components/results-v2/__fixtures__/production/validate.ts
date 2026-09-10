/**
 * GENERATED FROM PRODUCTION - do not hand-edit.
 *
 * validate - P47 meal-kit validation. Proves the validate() adapter (purchase intent + concept scores).
 *
 * Produced by running the backend's real `buildCanonicalReport(mission,
 * mission.analysis, mission_responses)` (vettit-backend
 * src/services/report/buildReport.js) against production mission
 * 38d1a0c9-bdca-4c8d-affe-30fc8e87adfb (n = 5 distinct personas,
 * completed 2026-06-13T19:37:41.91+00:00) and serialising the result. Nothing here is
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
    "title": "P47, meal-kit validation",
    "brief": "Validate demand for a subscription meal-kit service for busy UAE professionals who want healthy home-cooked dinners in under 20 minutes.",
    "methodology": "validate",
    "methodology_label": "Product Validation",
    "sample": {
      "n": 5,
      "qualified": 5,
      "delivered": 5,
      "posture": "directional",
      "completed_at": "2026-06-13T19:37:41.91+00:00",
      "mission_id": "38d1a0c9-bdca-4c8d-affe-30fc8e87adfb"
    }
  },
  "headline": {
    "metric": "Concept reaction (mean of 10)",
    "value": "7",
    "all": [
      {
        "label": "Concept reaction (mean of 10)",
        "value": "7"
      },
      {
        "label": "Relevance (mean of 7)",
        "value": "5"
      },
      {
        "label": "Uniqueness (mean of 7)",
        "value": "5.6"
      },
      {
        "label": "Believability (mean of 7)",
        "value": "6"
      },
      {
        "label": "Purchase intent (top-2-box)",
        "value": "100%"
      }
    ]
  },
  "centerpiece": {
    "methodology": "validate",
    "data": {
      "n": 5,
      "norms": null,
      "intent": {
        "n": 5,
        "top2_pct": 100,
        "distribution": {
          "Probably would buy": 5
        }
      },
      "scores": {
        "reaction": {
          "n": 5,
          "mean": 7,
          "ci_low": 5.4818,
          "stddev": 1.7321,
          "ci_high": 8.5182
        },
        "relevance": {
          "n": 1,
          "mean": 5,
          "ci_low": 5,
          "stddev": 0,
          "ci_high": 5
        },
        "uniqueness": {
          "n": 5,
          "mean": 5.6,
          "ci_low": 4.2707,
          "stddev": 1.5166,
          "ci_high": 6.9293
        },
        "believability": {
          "n": 5,
          "mean": 6,
          "ci_low": 4.4818,
          "stddev": 1.7321,
          "ci_high": 7.5182
        }
      },
      "verbatims": {
        "q7": {
          "n": 5,
          "items": [
            "Time-saving, healthy, family-friendly, convenient, reliable.",
            "Convenient, healthier, time-saving, practical, trustworthy.",
            "Convenient, healthy, time-saving, family-friendly, realistic.",
            "Convenient, healthy, time-saving, trustworthy, practical.",
            "Convenient, guilt-reducing, time-saving, authentic, uncertain."
          ],
          "question": "What words come to mind when you think about the subscription meal-kit service for busy UAE professionals? Please share up to 5 words."
        },
        "q8": {
          "n": 5,
          "items": [
            "My main worry is whether the meals will actually taste good and feel homemade, or if they'll feel like assembly-line cooking. Also, I'm not sure if the portions are right for a family of four, since I see the focus is on busy professionals like me.",
            "My kids can be picky eaters, and I'm not sure if the meals will appeal to them or if I'll waste money on food they refuse. Also, I work unpredictable hours, so I'm worried about whether I can use all the meals before they expire, or if I'll be locked into paying for a subscription I can't always use.",
            "My main concern is whether the meals will actually taste good and satisfy my family, especially my kids. I've tried convenient options before that felt like shortcuts. Also, I need to know if portion sizes work for someone watching his weight, and whether the service can handle my wife's travel schedule without wasting ingredients when she's away.",
            "Cost is my main worry. I'm already paying for delivery meals most nights, so I need to understand if this saves me money or just costs more because it's a subscription. Also, I'm skeptical that everything can really be done well in under 20 minutes, and I wonder if my family will actually eat it or if I'll waste food.",
            "My main worry is whether it actually saves time or just moves the problem around. I'm also concerned the portions might not satisfy my family, and I wonder if the meals will feel like real cooking or just assembly. Plus, I need to know it works during my peak audit weeks when I'm running on empty."
          ],
          "question": "What is your biggest concern or hesitation about the subscription meal-kit service for busy UAE professionals?"
        },
        "q9": {
          "n": 5,
          "items": [
            "People like me, honestly. Senior professionals working 10-hour days in Dubai who want to eat better but don't have time to cook from scratch. Probably especially people who are married with kids, because they feel guilty about not sitting down for home-cooked dinners but are too exhausted to make it happen.",
            "People like me: professionals with good income who work long hours in demanding jobs, want to eat healthier and spend more time with family, but don't have the time or energy to plan and cook from scratch. Parents especially, because they care about feeding their kids real food but are exhausted by the time they get home.",
            "It's best for people like me, honestly: working professionals with long hours who can't cook much during the week but want to eat healthy and spend actual time with their families instead of ordering delivery constantly. It works especially well for married couples where both partners work demanding jobs, and families with kids who want dinner together on weekends without spending two hours in the kitchen.",
            "People like me, honestly. Working professionals in Dubai, both men and women, who leave the office late and have families expecting dinner. People whose doctors or spouses are pushing them toward healthier eating but who don't have the energy or time to cook properly. Young married couples with kids, especially where both partners work.",
            "People like me, really. Working parents in the UAE who want home-cooked meals but don't have the energy or time for shopping and planning. Especially professionals with unpredictable hours or spouses who travel. Anyone trying to balance career ambition with not raising kids on takeaway."
          ],
          "question": "In your own words, who do you think the subscription meal-kit service for busy UAE professionals is best suited for?"
        }
      },
      "computed_at": "2026-06-17T08:12:08.653Z",
      "methodology": "validate",
      "price_fairness": null,
      "analysis_version": 1
    }
  },
  "key_findings": [
    {
      "label": "Concept reaction (mean of 10)",
      "trend": "neutral",
      "value": "7"
    },
    {
      "label": "Relevance (mean of 7)",
      "trend": "neutral",
      "value": "5"
    },
    {
      "label": "Uniqueness (mean of 7)",
      "trend": "neutral",
      "value": "5.6"
    }
  ],
  "recommendations": [
    "Act on the headline finding (Concept reaction (mean of 10): 7) and review the full survey below for the supporting detail behind it.",
    "Weigh Relevance (mean of 7) (5) in the decision, it is among the strongest signals in this study.",
    "Weigh Uniqueness (mean of 7) (5.6) in the decision, it is among the strongest signals in this study.",
    "Weigh Believability (mean of 7) (6) in the decision, it is among the strongest signals in this study.",
    "Weigh Purchase intent (top-2-box) (100%) in the decision, it is among the strongest signals in this study."
  ],
  "finding": "Every one of the 5 respondents said they would probably buy the meal-kit service, producing a 100% purchase intent top-2-box score, the single strongest signal in this directional sample.",
  "synthesis": "Every one of the 5 respondents said they would probably buy the meal-kit service, producing a 100% purchase intent top-2-box score, the single strongest signal in this directional sample. Supporting that enthusiasm, concept reaction averaged 7 out of 10 and believability averaged 6 out of 7, suggesting the proposition lands as credible, not just appealing. Concerns cluster around taste quality, portion sizing, and cost-versus-value rather than the core concept itself, indicating the idea is sound but the go-to-market messaging must directly address what respondents will get for their money and how meals will feel homemade rather than assembled. Before broader investment, the team should test pricing transparency and a 'taste guarantee' message with a larger, statistically robust sample to confirm whether resolving those specific hesitations converts intent into trial.",
  "personas": [
    {
      "name": "Mid-Career Professionals",
      "role": "Senior Accountant",
      "share": "60%",
      "n": 3,
      "description": "Prioritise health and family time; pragmatic decision-makers; ages 34-42."
    },
    {
      "name": "Senior Professionals",
      "role": "Senior Operations Manager",
      "share": "40%",
      "n": 2,
      "description": "Prioritise health and work-life balance; practical decision-makers; ages 41-42."
    }
  ],
  "screening": {
    "question_id": "q1",
    "question": "How often do you cook dinner at home during a typical week?",
    "qualified": 5,
    "distribution": {
      "1-2 times per week": 5
    }
  },
  "exec_summary": "Every one of the 5 respondents said they would probably buy the meal-kit service, producing a 100% purchase intent top-2-box score, the single strongest signal in this directional sample. Supporting that enthusiasm, concept reaction averaged 7 out of 10 and believability averaged 6 out of 7, suggesting the proposition lands as credible, not just appealing. Concerns cluster around taste quality, portion sizing, and cost-versus-value rather than the core concept itself, indicating the idea is sound but the go-to-market messaging must directly address what respondents will get for their money and how meals will feel homemade rather than assembled. Before broader investment, the team should test pricing transparency and a 'taste guarantee' message with a larger, statistically robust sample to confirm whether resolving those specific hesitations converts intent into trial.",
  "survey": [
    {
      "number": 1,
      "id": "q1",
      "text": "How often do you cook dinner at home during a typical week?",
      "type": "single",
      "renderer": "screener",
      "renderer_label": "screener",
      "options": [
        "3 or more times per week",
        "1-2 times per week",
        "Rarely or never"
      ],
      "isScreening": true,
      "data": {
        "distribution": {
          "1-2 times per week": 5
        },
        "n": 5
      },
      "insight": "All 5 respondents cook dinner at home only 1-2 times per week, confirming the sample is composed of infrequent home cooks, the core target persona for a meal-kit service."
    },
    {
      "number": 2,
      "id": "q2",
      "text": "What is your overall reaction to this concept: a subscription meal-kit service for busy UAE professionals?",
      "type": "rating",
      "renderer": "scale_generic",
      "renderer_label": "numeric scale",
      "options": [],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 10,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 1,
          "5": 0,
          "6": 0,
          "7": 1,
          "8": 3,
          "9": 0,
          "10": 0
        },
        "average": 7,
        "n": 5,
        "ci_low": 5.48,
        "ci_high": 8.52,
        "stddev": 1.73
      },
      "insight": "Overall reaction averaged 7/10, with 3 of 5 respondents scoring the concept an 8, suggesting a cautiously positive first impression rather than strong enthusiasm."
    },
    {
      "number": 3,
      "id": "q3",
      "text": "How relevant is the subscription meal-kit service for busy UAE professionals to your personal needs and lifestyle?",
      "type": "rating",
      "renderer": "scale_generic",
      "renderer_label": "numeric scale",
      "options": [],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 10,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 0,
          "5": 1,
          "6": 0,
          "7": 0,
          "8": 1,
          "9": 3,
          "10": 0
        },
        "average": 8,
        "n": 5,
        "ci_low": 6.48,
        "ci_high": 9.52,
        "stddev": 1.73
      },
      "insight": "Personal relevance scored higher than overall reaction, averaging 8/10, driven by 3 of 5 respondents rating it a 9, indicating the concept feels meaningfully applicable to these respondents' lives."
    },
    {
      "number": 4,
      "id": "q4",
      "text": "How different is the subscription meal-kit service for busy UAE professionals from other meal-kit and food delivery options you are aware of?",
      "type": "rating",
      "renderer": "scale_1_7",
      "renderer_label": "1-7 scale",
      "options": [],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 7,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 1,
          "4": 0,
          "5": 0,
          "6": 3,
          "7": 1
        },
        "average": 5.6,
        "n": 5,
        "ci_low": 4.27,
        "ci_high": 6.93,
        "stddev": 1.52
      },
      "insight": "Perceived differentiation averaged 5.6 out of 7, with 3 of 5 respondents scoring it a 6, pointing to a solid but not overwhelming sense that this concept stands apart from existing meal-kit and food delivery options."
    },
    {
      "number": 5,
      "id": "q5",
      "text": "How believable are the claims made about the subscription meal-kit service for busy UAE professionals, specifically that it enables healthy home-cooked dinners in under 20 minutes?",
      "type": "rating",
      "renderer": "scale_1_7",
      "renderer_label": "1-7 scale",
      "options": [],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 7,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 1,
          "4": 0,
          "5": 0,
          "6": 1,
          "7": 3
        },
        "average": 6,
        "n": 5,
        "ci_low": 4.48,
        "ci_high": 7.52,
        "stddev": 1.73
      },
      "insight": "The under-20-minute claim averaged 6/10 on believability, with 3 of 5 respondents scoring it a 7 (the maximum), suggesting the core functional promise lands as credible with most of this sample."
    },
    {
      "number": 6,
      "id": "q6",
      "text": "If this subscription meal-kit service for busy UAE professionals were available in your area, how likely would you be to buy it?",
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
      "insight": "All 5 respondents selected 'Probably would buy,' indicating a uniformly positive stated purchase intent, though this directional signal should be interpreted cautiously given the small sample of n=5."
    },
    {
      "number": 7,
      "id": "q7",
      "text": "What words come to mind when you think about the subscription meal-kit service for busy UAE professionals? Please share up to 5 words.",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "Time-saving, healthy, family-friendly, convenient, reliable.",
          "Convenient, healthier, time-saving, practical, trustworthy.",
          "Convenient, healthy, time-saving, family-friendly, realistic."
        ],
        "n": 5
      },
      "insight": "Five open-text responses were collected on word associations; review verbatims directly for the specific language respondents used to characterize the concept."
    },
    {
      "number": 8,
      "id": "q8",
      "text": "What is your biggest concern or hesitation about the subscription meal-kit service for busy UAE professionals?",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "My main worry is whether the meals will actually taste good and feel homemade, or if they'll feel like assembly-line cooking. Also, I'm not sure if the portions are right for a family of four, since I see the focus is on busy professionals like me.",
          "My kids can be picky eaters, and I'm not sure if the meals will appeal to them or if I'll waste money on food they refuse. Also, I work unpredictable hours, so I'm worried about whether I can use all the meals before they expire, or if I'll be locked into paying for a subscription I can't always use.",
          "My main concern is whether the meals will actually taste good and satisfy my family, especially my kids. I've tried convenient options before that felt like shortcuts. Also, I need to know if portion sizes work for someone watching his weight, and whether the service can handle my wife's travel schedule without wasting ingredients when she's away."
        ],
        "n": 5
      },
      "insight": "Five open-text responses were collected on concerns and hesitations; review verbatims directly to identify the friction points respondents flagged."
    },
    {
      "number": 9,
      "id": "q9",
      "text": "In your own words, who do you think the subscription meal-kit service for busy UAE professionals is best suited for?",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "People like me, honestly. Senior professionals working 10-hour days in Dubai who want to eat better but don't have time to cook from scratch. Probably especially people who are married with kids, because they feel guilty about not sitting down for home-cooked dinners but are too exhausted to make it happen.",
          "People like me: professionals with good income who work long hours in demanding jobs, want to eat healthier and spend more time with family, but don't have the time or energy to plan and cook from scratch. Parents especially, because they care about feeding their kids real food but are exhausted by the time they get home.",
          "It's best for people like me, honestly: working professionals with long hours who can't cook much during the week but want to eat healthy and spend actual time with their families instead of ordering delivery constantly. It works especially well for married couples where both partners work demanding jobs, and families with kids who want dinner together on weekends without spending two hours in the kitchen."
        ],
        "n": 5
      },
      "insight": "Five open-text responses were collected on perceived target audience; review verbatims directly to understand how respondents defined the ideal user for this service."
    }
  ],
  "data_quality_notes": [],
  "methodology_disclaimer": "Results are generated by AI synthetic respondents calibrated to the audience spec. They are directional signal, not a substitute for fielding with real customers, especially at small sample sizes. Combine with real-customer data before making absolute claims."
};

export const VALIDATE: CanonicalReport = RAW;
