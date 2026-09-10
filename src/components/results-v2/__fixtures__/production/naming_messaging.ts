/**
 * GENERATED FROM PRODUCTION - do not hand-edit.
 *
 * naming_messaging - P47 sparkling water naming. Proves the naming() adapter, which is also the adapter for the bare 'naming' key.
 *
 * Produced by running the backend's real `buildCanonicalReport(mission,
 * mission.analysis, mission_responses)` (vettit-backend
 * src/services/report/buildReport.js) against production mission
 * 3cd77b6c-b36f-4156-a9af-8d73c3632109 (n = 5 distinct personas,
 * completed 2026-06-13T19:37:46.432+00:00) and serialising the result. Nothing here is
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
    "title": "P47, sparkling water naming",
    "brief": "Test three names for a new premium sparkling-water brand on memorability, distinctiveness, and premium feel.",
    "methodology": "naming_messaging",
    "methodology_label": "Naming & Messaging",
    "sample": {
      "n": 5,
      "qualified": 5,
      "delivered": 5,
      "posture": "directional",
      "completed_at": "2026-06-13T19:37:46.432+00:00",
      "mission_id": "3cd77b6c-b36f-4156-a9af-8d73c3632109"
    }
  },
  "headline": {
    "metric": "Lumio (winner)",
    "value": "100% win rate",
    "all": [
      {
        "label": "Lumio (winner)",
        "value": "100% win rate"
      },
      {
        "label": "Brightly",
        "value": "50% win rate"
      },
      {
        "label": "Glowex",
        "value": "0% win rate"
      }
    ]
  },
  "centerpiece": {
    "methodology": "naming",
    "data": {
      "n": 5,
      "turf": null,
      "winner": {
        "by": "pairwise_win_rate",
        "candidate_id": "c1"
      },
      "pairwise": {
        "comparisons": [
          {
            "base": 5,
            "results": [
              {
                "wins": 5,
                "label": "Lumio",
                "win_pct": 100,
                "candidate_id": "c1"
              },
              {
                "wins": 0,
                "label": "Brightly",
                "win_pct": 0,
                "candidate_id": "c2"
              }
            ],
            "question_id": "q19"
          },
          {
            "base": 5,
            "results": [
              {
                "wins": 5,
                "label": "Brightly",
                "win_pct": 100,
                "candidate_id": "c2"
              },
              {
                "wins": 0,
                "label": "Glowex",
                "win_pct": 0,
                "candidate_id": "c3"
              }
            ],
            "question_id": "q20"
          }
        ]
      },
      "candidates": [
        {
          "label": "Lumio",
          "criteria": {
            "premium": {
              "n": 5,
              "mean": 5,
              "ci_low": 5,
              "stddev": 0,
              "ci_high": 5
            },
            "memorable": {
              "n": 5,
              "mean": 6,
              "ci_low": 6,
              "stddev": 0,
              "ci_high": 6
            },
            "distinctive": {
              "n": 5,
              "mean": 6.6,
              "ci_low": 6.1199,
              "stddev": 0.5477,
              "ci_high": 7.0801
            },
            "easy_to_pronounce": {
              "n": 5,
              "mean": 7,
              "ci_low": 7,
              "stddev": 0,
              "ci_high": 7
            }
          },
          "composite": 6.15,
          "candidate_id": "c1",
          "pairwise_win_rate": {
            "pct": 100,
            "wins": 5,
            "appearances": 5
          }
        },
        {
          "label": "Brightly",
          "criteria": {
            "premium": {
              "n": 5,
              "mean": 6,
              "ci_low": 6,
              "stddev": 0,
              "ci_high": 6
            },
            "memorable": {
              "n": 5,
              "mean": 5,
              "ci_low": 5,
              "stddev": 0,
              "ci_high": 5
            },
            "distinctive": {
              "n": 5,
              "mean": 3.6,
              "ci_low": 3.1199,
              "stddev": 0.5477,
              "ci_high": 4.0801
            },
            "easy_to_pronounce": {
              "n": 5,
              "mean": 7,
              "ci_low": 7,
              "stddev": 0,
              "ci_high": 7
            }
          },
          "composite": 5.4,
          "candidate_id": "c2",
          "pairwise_win_rate": {
            "pct": 50,
            "wins": 5,
            "appearances": 10
          }
        },
        {
          "label": "Glowex",
          "criteria": {
            "premium": {
              "n": 5,
              "mean": 4.2,
              "ci_low": 3.808,
              "stddev": 0.4472,
              "ci_high": 4.592
            },
            "memorable": {
              "n": 5,
              "mean": 4,
              "ci_low": 4,
              "stddev": 0,
              "ci_high": 4
            },
            "distinctive": {
              "n": 5,
              "mean": 5.2,
              "ci_low": 4.808,
              "stddev": 0.4472,
              "ci_high": 5.592
            },
            "easy_to_pronounce": {
              "n": 5,
              "mean": 5.6,
              "ci_low": 5.1199,
              "stddev": 0.5477,
              "ci_high": 6.0801
            }
          },
          "composite": 4.75,
          "candidate_id": "c3",
          "pairwise_win_rate": {
            "pct": 0,
            "wins": 0,
            "appearances": 5
          }
        }
      ],
      "computed_at": "2026-06-17T08:12:06.638Z",
      "methodology": "naming",
      "analysis_version": 1
    }
  },
  "key_findings": [
    {
      "label": "Lumio (winner)",
      "trend": "neutral",
      "value": "100% win rate"
    },
    {
      "label": "Brightly",
      "trend": "neutral",
      "value": "50% win rate"
    },
    {
      "label": "Glowex",
      "trend": "neutral",
      "value": "0% win rate"
    }
  ],
  "recommendations": [
    "Act on the headline finding (Lumio (winner): 100% win rate) and review the full survey below for the supporting detail behind it.",
    "Weigh Brightly (50% win rate) in the decision, it is among the strongest signals in this study.",
    "Weigh Glowex (0% win rate) in the decision, it is among the strongest signals in this study."
  ],
  "finding": "Lumio is the clear naming winner, achieving a 100% pairwise win rate across all 5 head-to-head matchups and a composite score of 6.15 out of 7, versus 5.4 for Brightly and 4.75 for Glowex.",
  "synthesis": "Lumio is the clear naming winner, achieving a 100% pairwise win rate across all 5 head-to-head matchups and a composite score of 6.15 out of 7, versus 5.4 for Brightly and 4.75 for Glowex. Lumio's edge was sharpest on ease of pronunciation (mean 7.0, zero variance) and distinctiveness (mean 6.6), the two criteria most predictive of consumer recall at shelf. Given this is a directional sample of n=5, results should be treated as a strong signal rather than statistical certainty, the recommendation is to advance Lumio into a larger confirmatory test focused on purchase intent and brand fit before finalizing the name.",
  "personas": [
    {
      "name": "Intuitive But Informed Decision-Makers",
      "role": "Interior Designer",
      "share": "40%",
      "n": 2,
      "description": "Prioritise quality and aesthetics; intuitive but informed decision-makers; ages 34-42."
    },
    {
      "name": "Intuitive With Research Decision-Makers",
      "role": "Senior Interior Designer",
      "share": "40%",
      "n": 2,
      "description": "Prioritise wellness and aesthetics; intuitive with research decision-makers; ages 42-42."
    }
  ],
  "screening": {
    "question_id": "q1",
    "question": "How often do you purchase premium sparkling water (e.g., brands priced above standard sparkling water)?",
    "qualified": 5,
    "distribution": {
      "At least once a month": 5
    }
  },
  "exec_summary": "Lumio is the clear naming winner, achieving a 100% pairwise win rate across all 5 head-to-head matchups and a composite score of 6.15 out of 7, versus 5.4 for Brightly and 4.75 for Glowex. Lumio's edge was sharpest on ease of pronunciation (mean 7.0, zero variance) and distinctiveness (mean 6.6), the two criteria most predictive of consumer recall at shelf. Given this is a directional sample of n=5, results should be treated as a strong signal rather than statistical certainty, the recommendation is to advance Lumio into a larger confirmatory test focused on purchase intent and brand fit before finalizing the name.",
  "survey": [
    {
      "number": 1,
      "id": "q1",
      "text": "How often do you purchase premium sparkling water (e.g., brands priced above standard sparkling water)?",
      "type": "single",
      "renderer": "screener",
      "renderer_label": "screener",
      "options": [
        "At least once a month",
        "A few times a year",
        "Never"
      ],
      "isScreening": true,
      "data": {
        "distribution": {
          "At least once a month": 5
        },
        "n": 5
      },
      "insight": "All 5 respondents purchase premium sparkling water at least once a month, confirming the sample is composed entirely of active category buyers."
    },
    {
      "number": 2,
      "id": "q2",
      "text": "On a 1-7 scale, how memorable is Lumio?",
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
      "insight": "Lumio scores an average of 6 out of 7 on memorability, with all 5 respondents rating it a 6, a strong and consistent result in this directional sample."
    },
    {
      "number": 3,
      "id": "q3",
      "text": "On a 1-7 scale, how distinctive is Lumio?",
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
          "3": 0,
          "4": 0,
          "5": 0,
          "6": 2,
          "7": 3
        },
        "average": 6.6,
        "n": 5,
        "ci_low": 6.12,
        "ci_high": 7.08,
        "stddev": 0.55
      },
      "insight": "Lumio earns an average distinctiveness score of 6.6 out of 7, with 3 of 5 respondents rating it a 7 and 2 rating it a 6, suggesting the name feels highly ownable in this sample."
    },
    {
      "number": 4,
      "id": "q4",
      "text": "On a 1-7 scale, how relevant to the category is Lumio?",
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
          "3": 0,
          "4": 0,
          "5": 5,
          "6": 0,
          "7": 0
        },
        "average": 5,
        "n": 5,
        "ci_low": 5,
        "ci_high": 5,
        "stddev": 0
      },
      "insight": "Lumio's category relevance averages exactly 5 out of 7, with all 5 respondents landing on that midpoint, indicating moderate fit with the sparkling water category but no strong signal of clear relevance."
    },
    {
      "number": 5,
      "id": "q5",
      "text": "On a 1-7 scale, how easy to pronounce is Lumio?",
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
          "3": 0,
          "4": 0,
          "5": 0,
          "6": 0,
          "7": 5
        },
        "average": 7,
        "n": 5,
        "ci_low": 7,
        "ci_high": 7,
        "stddev": 0
      },
      "insight": "Lumio achieves a perfect 7.0 average on ease of pronunciation, with all 5 respondents giving it the top score, the name presents zero perceived pronunciation barrier in this sample."
    },
    {
      "number": 6,
      "id": "q6",
      "text": "What does Lumio make you think of? Up to 5 words.",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "Light, modern, sleek, sophisticated, Italian",
          "Light, clarity, modern elegance, premium, refined",
          "Light, clarity, effervescence, modern, sophisticated."
        ],
        "n": 5
      },
      "insight": "Five open-text responses were collected on Lumio's word associations; review verbatims directly for thematic patterns as no quantitative distribution is available."
    },
    {
      "number": 7,
      "id": "q7",
      "text": "On a 1-7 scale, how memorable is Brightly?",
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
          "3": 0,
          "4": 0,
          "5": 5,
          "6": 0,
          "7": 0
        },
        "average": 5,
        "n": 5,
        "ci_low": 5,
        "ci_high": 5,
        "stddev": 0
      },
      "insight": "Brightly averages 5 out of 7 on memorability, with all 5 respondents rating it a 5, a middling and uniform score that trails Lumio's 6.0 average in this sample."
    },
    {
      "number": 8,
      "id": "q8",
      "text": "On a 1-7 scale, how distinctive is Brightly?",
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
      "insight": "Brightly scores an average of 3.6 out of 7 on distinctiveness, with 2 respondents rating it a 3 and 3 rating it a 4, the lowest distinctiveness score across all three names tested."
    },
    {
      "number": 9,
      "id": "q9",
      "text": "On a 1-7 scale, how relevant to the category is Brightly?",
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
      "insight": "Brightly earns the highest category relevance score of the three names at 6.0 out of 7, with all 5 respondents giving it a 6, suggesting it reads most clearly as a sparkling water name."
    },
    {
      "number": 10,
      "id": "q10",
      "text": "On a 1-7 scale, how easy to pronounce is Brightly?",
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
          "3": 0,
          "4": 0,
          "5": 0,
          "6": 0,
          "7": 5
        },
        "average": 7,
        "n": 5,
        "ci_low": 7,
        "ci_high": 7,
        "stddev": 0
      },
      "insight": "Like Lumio, Brightly scores a perfect 7.0 on ease of pronunciation, with all 5 respondents rating it a 7, both names are perceived as equally effortless to say."
    },
    {
      "number": 11,
      "id": "q11",
      "text": "What does Brightly make you think of? Up to 5 words.",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "Happy, cheerful, accessible, basic, wellness",
          "Happiness, wellness, fresh, approachable, light",
          "Cheerful, optimistic, accessible, generic, obvious."
        ],
        "n": 5
      },
      "insight": "Five open-text responses were collected on Brightly's word associations; review verbatims directly for thematic patterns as no quantitative distribution is available."
    },
    {
      "number": 12,
      "id": "q12",
      "text": "On a 1-7 scale, how memorable is Glowex?",
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
          "3": 0,
          "4": 5,
          "5": 0,
          "6": 0,
          "7": 0
        },
        "average": 4,
        "n": 5,
        "ci_low": 4,
        "ci_high": 4,
        "stddev": 0
      },
      "insight": "Glowex averages 4 out of 7 on memorability, with all 5 respondents rating it a 4, the lowest memorability score among the three names and a full 2 points below Lumio's average."
    },
    {
      "number": 13,
      "id": "q13",
      "text": "On a 1-7 scale, how distinctive is Glowex?",
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
          "3": 0,
          "4": 0,
          "5": 4,
          "6": 1,
          "7": 0
        },
        "average": 5.2,
        "n": 5,
        "ci_low": 4.81,
        "ci_high": 5.59,
        "stddev": 0.45
      },
      "insight": "Glowex scores 5.2 out of 7 on distinctiveness, with 4 respondents rating it a 5 and 1 rating it a 6, placing it between Brightly (3.6) and Lumio (6.6) on this dimension."
    },
    {
      "number": 14,
      "id": "q14",
      "text": "On a 1-7 scale, how relevant to the category is Glowex?",
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
          "3": 0,
          "4": 4,
          "5": 1,
          "6": 0,
          "7": 0
        },
        "average": 4.2,
        "n": 5,
        "ci_low": 3.81,
        "ci_high": 4.59,
        "stddev": 0.45
      },
      "insight": "Glowex averages 4.2 out of 7 on category relevance, with 4 respondents rating it a 4 and 1 rating it a 5, the lowest relevance score of the three names, suggesting it feels least connected to sparkling water."
    },
    {
      "number": 15,
      "id": "q15",
      "text": "On a 1-7 scale, how easy to pronounce is Glowex?",
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
          "3": 0,
          "4": 0,
          "5": 2,
          "6": 3,
          "7": 0
        },
        "average": 5.6,
        "n": 5,
        "ci_low": 5.12,
        "ci_high": 6.08,
        "stddev": 0.55
      },
      "insight": "Glowex scores 5.6 out of 7 on ease of pronunciation, with 3 respondents rating it a 6 and 2 rating it a 5, noticeably harder to say than both Lumio and Brightly, which each scored a perfect 7.0."
    },
    {
      "number": 16,
      "id": "q16",
      "text": "What does Glowex make you think of? Up to 5 words.",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "Energy, artificial, tech, bold, slightly trendy",
          "Artificial, chemistry, trendy, unclear, supplement-like",
          "Chemical, artificial, dated, tech-ish, uncomfortable."
        ],
        "n": 5
      },
      "insight": "Five open-text responses were collected on Glowex's word associations; review verbatims directly for thematic patterns as no quantitative distribution is available."
    },
    {
      "number": 17,
      "id": "q17",
      "text": "Which candidate did you find most appealing overall?",
      "type": "single",
      "renderer": "single_select",
      "renderer_label": "single choice",
      "options": [
        "Lumio",
        "Brightly",
        "Glowex"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Lumio": 5
        },
        "n": 5
      },
      "insight": "All 5 respondents selected Lumio as the most appealing name overall, a unanimous preference in this directional sample."
    },
    {
      "number": 18,
      "id": "q18",
      "text": "Why?",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "Lumio feels like the kind of name I'd actually use in conversation with my guests without hesitation. It's elegant, modern, and suggests quality without being obvious. The other two felt either too generic or slightly forced.",
          "Lumio feels genuinely premium and architecturally considered, like something a designer brand would create. It's memorable without being gimmicky, and it would look perfect on my kitchen counter. Brightly is nice but too mainstream, and Glowex feels forced and supplement-y.",
          "Lumio feels effortlessly sophisticated and visual, the kind of name that works as well on an elegant bottle label as it does in conversation. Brightly is too obvious and mass-market, while Glowex feels constructed and artificial. For entertaining, I want something that signals taste."
        ],
        "n": 5
      },
      "insight": "Five open-text explanations for the Lumio preference were collected; review verbatims directly for the stated reasons as no quantitative distribution is available."
    },
    {
      "number": 19,
      "id": "q19",
      "text": "Which would you choose: Lumio OR Brightly?",
      "type": "single",
      "renderer": "paired_comparison",
      "renderer_label": "paired comparison",
      "options": [
        "Lumio",
        "Brightly"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Lumio": 5
        },
        "n": 5
      },
      "insight": "In a direct head-to-head, all 5 respondents chose Lumio over Brightly, reinforcing the overall appeal finding with a unanimous paired result."
    },
    {
      "number": 20,
      "id": "q20",
      "text": "Which would you choose: Brightly OR Glowex?",
      "type": "single",
      "renderer": "paired_comparison",
      "renderer_label": "paired comparison",
      "options": [
        "Brightly",
        "Glowex"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Brightly": 5
        },
        "n": 5
      },
      "insight": "In a direct head-to-head between the two lower-ranked names, all 5 respondents chose Brightly over Glowex, suggesting Brightly is a clear second choice despite its lower distinctiveness score."
    }
  ],
  "data_quality_notes": [],
  "methodology_disclaimer": "Results are generated by AI synthetic respondents calibrated to the audience spec. They are directional signal, not a substitute for fielding with real customers, especially at small sample sizes. Combine with real-customer data before making absolute claims."
};

export const NAMING_MESSAGING: CanonicalReport = RAW;
