/**
 * GENERATED FROM PRODUCTION - do not hand-edit.
 *
 * roadmap - P47 budgeting app roadmap. Proves the roadmap() adapter (MaxDiff utilities + Kano).
 *
 * Produced by running the backend's real `buildCanonicalReport(mission,
 * mission.analysis, mission_responses)` (vettit-backend
 * src/services/report/buildReport.js) against production mission
 * d51e09ad-85ab-4578-8268-b0fd09444afe (n = 5 distinct personas,
 * completed 2026-06-13T19:38:02.321+00:00) and serialising the result. Nothing here is
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
 *       {"posture":"directional","note":"Sample too small for reliable feature utilities, read the priority order, not the point scores.","suppress_headline":true,"threshold":30,"n":5,"reason":"below_threshold"}
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
    "title": "P47, budgeting app roadmap",
    "brief": "Prioritize the next features for our budgeting app: shared wallets, bill reminders, investment tracking, cash-back rewards, and offline mode. Use MaxDiff and Kano.",
    "methodology": "roadmap",
    "methodology_label": "Feature Roadmap",
    "sample": {
      "n": 5,
      "qualified": 5,
      "delivered": 5,
      "posture": "directional",
      "completed_at": "2026-06-13T19:38:02.321+00:00",
      "mission_id": "d51e09ad-85ab-4578-8268-b0fd09444afe"
    }
  },
  "headline": {
    "metric": "MaxDiff: Shared Wallets",
    "value": "utility 1",
    "all": [
      {
        "label": "MaxDiff: Shared Wallets",
        "value": "utility 1"
      },
      {
        "label": "MaxDiff: Bill Reminders",
        "value": "utility 0.18"
      },
      {
        "label": "MaxDiff: Investment Tracking",
        "value": "utility 0"
      },
      {
        "label": "MaxDiff: Offline Mode",
        "value": "utility -0.36"
      },
      {
        "label": "MaxDiff: Cash-Back Rewards",
        "value": "utility -0.84"
      },
      {
        "label": "MaxDiff base (n)",
        "value": "5"
      }
    ]
  },
  "centerpiece": {
    "methodology": "roadmap",
    "data": {
      "n": 5,
      "kano": {
        "features": [
          {
            "n": 5,
            "label": "Shared Wallets",
            "counts": {
              "must_be": 1,
              "reverse": 0,
              "attractive": 0,
              "indifferent": 0,
              "performance": 4,
              "questionable": 0
            },
            "feature_id": "f1",
            "classification": "performance"
          },
          {
            "n": 5,
            "label": "Bill Reminders",
            "counts": {
              "must_be": 1,
              "reverse": 0,
              "attractive": 0,
              "indifferent": 4,
              "performance": 0,
              "questionable": 0
            },
            "feature_id": "f2",
            "classification": "indifferent"
          },
          {
            "n": 5,
            "label": "Investment Tracking",
            "counts": {
              "must_be": 0,
              "reverse": 1,
              "attractive": 2,
              "indifferent": 2,
              "performance": 0,
              "questionable": 0
            },
            "feature_id": "f3",
            "classification": "attractive"
          },
          {
            "n": 4,
            "label": "Cash-Back Rewards",
            "counts": {
              "must_be": 0,
              "reverse": 4,
              "attractive": 0,
              "indifferent": 0,
              "performance": 0,
              "questionable": 0
            },
            "feature_id": "f4",
            "classification": "reverse"
          },
          {
            "n": 4,
            "label": "Offline Mode",
            "counts": {
              "must_be": 0,
              "reverse": 1,
              "attractive": 1,
              "indifferent": 2,
              "performance": 0,
              "questionable": 0
            },
            "feature_id": "f5",
            "classification": "indifferent"
          }
        ]
      },
      "maxdiff": {
        "n": 5,
        "ranking": [
          "f1",
          "f2",
          "f3",
          "f5",
          "f4"
        ],
        "features": [
          {
            "best": 50,
            "label": "Shared Wallets",
            "worst": 0,
            "utility": 1,
            "feature_id": "f1",
            "appearances": 50
          },
          {
            "best": 8,
            "label": "Bill Reminders",
            "worst": 0,
            "utility": 0.1778,
            "feature_id": "f2",
            "appearances": 45
          },
          {
            "best": 2,
            "label": "Investment Tracking",
            "worst": 2,
            "utility": 0,
            "feature_id": "f3",
            "appearances": 50
          },
          {
            "best": 0,
            "label": "Offline Mode",
            "worst": 16,
            "utility": -0.3556,
            "feature_id": "f5",
            "appearances": 45
          },
          {
            "best": 0,
            "label": "Cash-Back Rewards",
            "worst": 42,
            "utility": -0.84,
            "feature_id": "f4",
            "appearances": 50
          }
        ]
      },
      "computed_at": "2026-06-17T08:12:06.977Z",
      "methodology": "roadmap",
      "analysis_version": 1,
      "kano_degenerate_reason": null,
      "maxdiff_degenerate_reason": null
    }
  },
  "key_findings": [
    {
      "label": "MaxDiff: Shared Wallets",
      "trend": "neutral",
      "value": "utility 1"
    },
    {
      "label": "MaxDiff: Bill Reminders",
      "trend": "neutral",
      "value": "utility 0.18"
    },
    {
      "label": "MaxDiff: Investment Tracking",
      "trend": "neutral",
      "value": "utility 0"
    }
  ],
  "recommendations": [
    "Act on the headline finding (MaxDiff: Shared Wallets: utility 1) and review the full survey below for the supporting detail behind it.",
    "Weigh MaxDiff: Bill Reminders (utility 0.18) in the decision, it is among the strongest signals in this study.",
    "Weigh MaxDiff: Investment Tracking (utility 0) in the decision, it is among the strongest signals in this study.",
    "Weigh MaxDiff: Offline Mode (utility -0.36) in the decision, it is among the strongest signals in this study.",
    "Weigh MaxDiff: Cash-Back Rewards (utility -0.84) in the decision, it is among the strongest signals in this study."
  ],
  "finding": "Shared Wallets is the standout priority for this roadmap: it earned the highest MaxDiff utility score of 1.0 (the top anchor) and was classified as a performance feature by 4 of 5 respondents, meaning users expect it and satisfaction suffers without it.",
  "synthesis": "Shared Wallets is the standout priority for this roadmap: it earned the highest MaxDiff utility score of 1.0 (the top anchor) and was classified as a performance feature by 4 of 5 respondents, meaning users expect it and satisfaction suffers without it. Cash-Back Rewards is an active liability, all 4 respondents who evaluated it classified it as reverse, and it scored the lowest MaxDiff utility at -0.84, suggesting it could reduce satisfaction if built. Investment Tracking showed split signals (classified attractive, utility 0.0), making it a candidate for further validation before committing resources. Given the directional nature of this n=5 sample, the immediate recommendation is to lock Shared Wallets into the near-term build and deprioritize Cash-Back Rewards, while fielding a larger study on Investment Tracking to determine whether it belongs in the roadmap at all.",
  "personas": [
    {
      "name": "Mid-Career Professionals",
      "role": "Senior Accountant",
      "share": "60%",
      "n": 3,
      "description": "Prioritise transparency and control; data-driven decision-makers; ages 34-42."
    },
    {
      "name": "Senior Professionals",
      "role": "Finance Manager",
      "share": "40%",
      "n": 2,
      "description": "Prioritise security and transparency; data-driven decision-makers; ages 42-42."
    }
  ],
  "screening": {
    "question_id": "q1",
    "question": "Which of the following best describes your current use of personal finance or budgeting tools?",
    "qualified": 5,
    "distribution": {
      "I actively use a budgeting or personal finance app": 5
    }
  },
  "exec_summary": "Shared Wallets is the standout priority for this roadmap: it earned the highest MaxDiff utility score of 1.0 (the top anchor) and was classified as a performance feature by 4 of 5 respondents, meaning users expect it and satisfaction suffers without it. Cash-Back Rewards is an active liability, all 4 respondents who evaluated it classified it as reverse, and it scored the lowest MaxDiff utility at -0.84, suggesting it could reduce satisfaction if built. Investment Tracking showed split signals (classified attractive, utility 0.0), making it a candidate for further validation before committing resources. Given the directional nature of this n=5 sample, the immediate recommendation is to lock Shared Wallets into the near-term build and deprioritize Cash-Back Rewards, while fielding a larger study on Investment Tracking to determine whether it belongs in the roadmap at all.",
  "survey": [
    {
      "number": 1,
      "id": "q1",
      "text": "Which of the following best describes your current use of personal finance or budgeting tools?",
      "type": "single",
      "renderer": "screener",
      "renderer_label": "screener",
      "options": [
        "I actively use a budgeting or personal finance app",
        "I have used one in the past but not currently",
        "I have never used a budgeting or personal finance app"
      ],
      "isScreening": true,
      "data": {
        "distribution": {
          "I actively use a budgeting or personal finance app": 5
        },
        "n": 5
      },
      "insight": "All 5 respondents actively use a budgeting or personal finance app, meaning this sample represents engaged, experienced users rather than casual or non-users."
    },
    {
      "number": 2,
      "id": "q2",
      "text": "Of these 4 features, which is MOST important to you, and which is LEAST important?",
      "type": "max_diff_set",
      "renderer": "max_diff",
      "renderer_label": "MaxDiff (best/worst)",
      "options": [
        "Shared Wallets",
        "Bill Reminders",
        "Investment Tracking",
        "Cash-Back Rewards"
      ],
      "isScreening": false,
      "data": {
        "best": {
          "Shared Wallets": 5
        },
        "worst": {
          "Cash-Back Rewards": 5
        },
        "n": 5,
        "feature_set": [
          "f1",
          "f2",
          "f3",
          "f4"
        ]
      },
      "insight": "Shared Wallets swept all 5 'most important' votes while Cash-Back Rewards swept all 5 'least important' votes, marking a clean polar split in this round."
    },
    {
      "number": 3,
      "id": "q3",
      "text": "Of these 4 features, which is MOST important to you, and which is LEAST important?",
      "type": "max_diff_set",
      "renderer": "max_diff",
      "renderer_label": "MaxDiff (best/worst)",
      "options": [
        "Shared Wallets",
        "Bill Reminders",
        "Investment Tracking",
        "Offline Mode"
      ],
      "isScreening": false,
      "data": {
        "best": {
          "Shared Wallets": 5
        },
        "worst": {
          "Offline Mode": 5
        },
        "n": 5,
        "feature_set": [
          "f1",
          "f2",
          "f3",
          "f5"
        ]
      },
      "insight": "Shared Wallets again claimed all 5 'most important' picks, with Offline Mode taking all 5 'least important' votes, a unanimous trade-off in this set."
    },
    {
      "number": 4,
      "id": "q4",
      "text": "Of these 4 features, which is MOST important to you, and which is LEAST important?",
      "type": "max_diff_set",
      "renderer": "max_diff",
      "renderer_label": "MaxDiff (best/worst)",
      "options": [
        "Shared Wallets",
        "Bill Reminders",
        "Cash-Back Rewards",
        "Offline Mode"
      ],
      "isScreening": false,
      "data": {
        "best": {
          "Shared Wallets": 5
        },
        "worst": {
          "Cash-Back Rewards": 2,
          "Offline Mode": 3
        },
        "n": 5,
        "feature_set": [
          "f1",
          "f2",
          "f4",
          "f5"
        ]
      },
      "insight": "Shared Wallets held all 5 'most important' selections; 'least important' split between Offline Mode (3 votes) and Cash-Back Rewards (2 votes), suggesting these two are interchangeable as low-priority features."
    },
    {
      "number": 5,
      "id": "q5",
      "text": "Of these 4 features, which is MOST important to you, and which is LEAST important?",
      "type": "max_diff_set",
      "renderer": "max_diff",
      "renderer_label": "MaxDiff (best/worst)",
      "options": [
        "Shared Wallets",
        "Investment Tracking",
        "Cash-Back Rewards",
        "Offline Mode"
      ],
      "isScreening": false,
      "data": {
        "best": {
          "Shared Wallets": 5
        },
        "worst": {
          "Cash-Back Rewards": 5
        },
        "n": 5,
        "feature_set": [
          "f1",
          "f3",
          "f4",
          "f5"
        ]
      },
      "insight": "Shared Wallets captured all 5 'most important' votes and Cash-Back Rewards captured all 5 'least important' votes, replicating the q2 result exactly."
    },
    {
      "number": 6,
      "id": "q6",
      "text": "Of these 4 features, which is MOST important to you, and which is LEAST important?",
      "type": "max_diff_set",
      "renderer": "max_diff",
      "renderer_label": "MaxDiff (best/worst)",
      "options": [
        "Bill Reminders",
        "Investment Tracking",
        "Cash-Back Rewards",
        "Offline Mode"
      ],
      "isScreening": false,
      "data": {
        "best": {
          "Bill Reminders": 4,
          "Investment Tracking": 1
        },
        "worst": {
          "Cash-Back Rewards": 5
        },
        "n": 5,
        "feature_set": [
          "f2",
          "f3",
          "f4",
          "f5"
        ]
      },
      "insight": "Bill Reminders led 'most important' with 4 votes versus Investment Tracking's 1, while Cash-Back Rewards collected all 5 'least important' votes, the only round where Shared Wallets did not dominate best."
    },
    {
      "number": 7,
      "id": "q7",
      "text": "Of these 4 features, which is MOST important to you, and which is LEAST important?",
      "type": "max_diff_set",
      "renderer": "max_diff",
      "renderer_label": "MaxDiff (best/worst)",
      "options": [
        "Shared Wallets",
        "Bill Reminders",
        "Investment Tracking",
        "Cash-Back Rewards"
      ],
      "isScreening": false,
      "data": {
        "best": {
          "Shared Wallets": 5
        },
        "worst": {
          "Cash-Back Rewards": 4,
          "Investment Tracking": 1
        },
        "n": 5,
        "feature_set": [
          "f1",
          "f2",
          "f3",
          "f4"
        ]
      },
      "insight": "Shared Wallets took all 5 'most important' votes; 'least important' went mostly to Cash-Back Rewards (4) with Investment Tracking picking up the remaining 1."
    },
    {
      "number": 8,
      "id": "q8",
      "text": "Of these 4 features, which is MOST important to you, and which is LEAST important?",
      "type": "max_diff_set",
      "renderer": "max_diff",
      "renderer_label": "MaxDiff (best/worst)",
      "options": [
        "Shared Wallets",
        "Bill Reminders",
        "Investment Tracking",
        "Offline Mode"
      ],
      "isScreening": false,
      "data": {
        "best": {
          "Shared Wallets": 5
        },
        "worst": {
          "Investment Tracking": 1,
          "Offline Mode": 4
        },
        "n": 5,
        "feature_set": [
          "f1",
          "f2",
          "f3",
          "f5"
        ]
      },
      "insight": "Shared Wallets held all 5 'most important' picks; Offline Mode (4) edged out Investment Tracking (1) as the dominant 'least important' choice in this set."
    },
    {
      "number": 9,
      "id": "q9",
      "text": "Of these 4 features, which is MOST important to you, and which is LEAST important?",
      "type": "max_diff_set",
      "renderer": "max_diff",
      "renderer_label": "MaxDiff (best/worst)",
      "options": [
        "Shared Wallets",
        "Bill Reminders",
        "Cash-Back Rewards",
        "Offline Mode"
      ],
      "isScreening": false,
      "data": {
        "best": {
          "Shared Wallets": 5
        },
        "worst": {
          "Cash-Back Rewards": 3,
          "Offline Mode": 2
        },
        "n": 5,
        "feature_set": [
          "f1",
          "f2",
          "f4",
          "f5"
        ]
      },
      "insight": "Shared Wallets again claimed all 5 'most important' votes; 'least important' divided between Cash-Back Rewards (3) and Offline Mode (2), both registering as low-value in this round."
    },
    {
      "number": 10,
      "id": "q10",
      "text": "Of these 4 features, which is MOST important to you, and which is LEAST important?",
      "type": "max_diff_set",
      "renderer": "max_diff",
      "renderer_label": "MaxDiff (best/worst)",
      "options": [
        "Shared Wallets",
        "Investment Tracking",
        "Cash-Back Rewards",
        "Offline Mode"
      ],
      "isScreening": false,
      "data": {
        "best": {
          "Shared Wallets": 5
        },
        "worst": {
          "Cash-Back Rewards": 4,
          "Offline Mode": 1
        },
        "n": 5,
        "feature_set": [
          "f1",
          "f3",
          "f4",
          "f5"
        ]
      },
      "insight": "Shared Wallets held all 5 'most important' selections; Offline Mode received 1 'least important' vote and Cash-Back Rewards received 4, keeping Cash-Back Rewards consistently at the bottom."
    },
    {
      "number": 11,
      "id": "q11",
      "text": "Of these 4 features, which is MOST important to you, and which is LEAST important?",
      "type": "max_diff_set",
      "renderer": "max_diff",
      "renderer_label": "MaxDiff (best/worst)",
      "options": [
        "Bill Reminders",
        "Investment Tracking",
        "Cash-Back Rewards",
        "Offline Mode"
      ],
      "isScreening": false,
      "data": {
        "best": {
          "Bill Reminders": 4,
          "Investment Tracking": 1
        },
        "worst": {
          "Cash-Back Rewards": 5
        },
        "n": 5,
        "feature_set": [
          "f2",
          "f3",
          "f4",
          "f5"
        ]
      },
      "insight": "Bill Reminders led 'most important' with 4 votes and Investment Tracking with 1; Cash-Back Rewards swept all 5 'least important' votes, mirroring the q6 pattern exactly."
    },
    {
      "number": 12,
      "id": "q12",
      "text": "Of these 4 features, which is MOST important to you, and which is LEAST important?",
      "type": "max_diff_set",
      "renderer": "max_diff",
      "renderer_label": "MaxDiff (best/worst)",
      "options": [
        "Shared Wallets",
        "Bill Reminders",
        "Investment Tracking",
        "Cash-Back Rewards"
      ],
      "isScreening": false,
      "data": {
        "best": {
          "Shared Wallets": 5
        },
        "worst": {
          "Cash-Back Rewards": 5
        },
        "n": 5,
        "feature_set": [
          "f1",
          "f2",
          "f3",
          "f4"
        ]
      },
      "insight": "Shared Wallets took all 5 'most important' votes and Cash-Back Rewards took all 5 'least important' votes, a third identical replication of the q2/q5 result."
    },
    {
      "number": 13,
      "id": "q13",
      "text": "Of these 4 features, which is MOST important to you, and which is LEAST important?",
      "type": "max_diff_set",
      "renderer": "max_diff",
      "renderer_label": "MaxDiff (best/worst)",
      "options": [
        "Shared Wallets",
        "Investment Tracking",
        "Cash-Back Rewards",
        "Offline Mode"
      ],
      "isScreening": false,
      "data": {
        "best": {
          "Shared Wallets": 5
        },
        "worst": {
          "Cash-Back Rewards": 4,
          "Offline Mode": 1
        },
        "n": 5,
        "feature_set": [
          "f1",
          "f3",
          "f4",
          "f5"
        ]
      },
      "insight": "Shared Wallets secured all 5 'most important' picks; 'least important' split 4 Cash-Back Rewards to 1 Offline Mode, consistent with Cash-Back Rewards' dominance at the bottom."
    },
    {
      "number": 14,
      "id": "q14",
      "text": "How would you feel if Shared Wallets WAS in the product?",
      "type": "single",
      "renderer": "kano",
      "renderer_label": "Kano",
      "options": [
        "I like it",
        "I expect it",
        "Neutral",
        "I can live with it",
        "I dislike it"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "I like it": 4,
          "I expect it": 1
        },
        "n": 5
      },
      "insight": "4 of 5 respondents said they would 'like' Shared Wallets in the product and 1 already expects it, signaling strong positive desire with virtually no indifference."
    },
    {
      "number": 15,
      "id": "q15",
      "text": "How would you feel if Shared Wallets WAS NOT in the product?",
      "type": "single",
      "renderer": "kano",
      "renderer_label": "Kano",
      "options": [
        "I like it",
        "I expect it",
        "Neutral",
        "I can live with it",
        "I dislike it"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "I dislike it": 5
        },
        "n": 5
      },
      "insight": "All 5 respondents said they would 'dislike' Shared Wallets being absent, paired with q14, this Kano pattern classifies it as a Must-Have / high-delight feature."
    },
    {
      "number": 16,
      "id": "q16",
      "text": "How would you feel if Bill Reminders WAS in the product?",
      "type": "single",
      "renderer": "kano",
      "renderer_label": "Kano",
      "options": [
        "I like it",
        "I expect it",
        "Neutral",
        "I can live with it",
        "I dislike it"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "I expect it": 5
        },
        "n": 5
      },
      "insight": "All 5 respondents said they 'expect' Bill Reminders to be in the product, classifying it as a pure Must-Be (baseline expectation) feature."
    },
    {
      "number": 17,
      "id": "q17",
      "text": "How would you feel if Bill Reminders WAS NOT in the product?",
      "type": "single",
      "renderer": "kano",
      "renderer_label": "Kano",
      "options": [
        "I like it",
        "I expect it",
        "Neutral",
        "I can live with it",
        "I dislike it"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "I can live with it": 4,
          "I dislike it": 1
        },
        "n": 5
      },
      "insight": "4 of 5 respondents said they 'can live with' Bill Reminders being absent and only 1 would dislike it, despite universal expectation in q16, its absence triggers surprisingly low distress in this sample."
    },
    {
      "number": 18,
      "id": "q18",
      "text": "How would you feel if Investment Tracking WAS in the product?",
      "type": "single",
      "renderer": "kano",
      "renderer_label": "Kano",
      "options": [
        "I like it",
        "I expect it",
        "Neutral",
        "I can live with it",
        "I dislike it"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "I like it": 2,
          "I can live with it": 1,
          "Neutral": 1,
          "I expect it": 1
        },
        "n": 5
      },
      "insight": "Investment Tracking split across all response options (2 'like it,' 1 'can live with it,' 1 'neutral,' 1 'expect it'), indicating no clear consensus on its value when present."
    },
    {
      "number": 19,
      "id": "q19",
      "text": "How would you feel if Investment Tracking WAS NOT in the product?",
      "type": "single",
      "renderer": "kano",
      "renderer_label": "Kano",
      "options": [
        "I like it",
        "I expect it",
        "Neutral",
        "I can live with it",
        "I dislike it"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "I can live with it": 2,
          "Neutral": 2,
          "I like it": 1
        },
        "n": 5
      },
      "insight": "3 of 5 respondents are indifferent or positive about Investment Tracking being absent (2 'can live with it,' 2 'neutral,' 1 'like it'), suggesting removal causes minimal pain in this sample."
    },
    {
      "number": 20,
      "id": "q20",
      "text": "How would you feel if Cash-Back Rewards WAS in the product?",
      "type": "single",
      "renderer": "kano",
      "renderer_label": "Kano",
      "options": [
        "I like it",
        "I expect it",
        "Neutral",
        "I can live with it",
        "I dislike it"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Neutral": 2,
          "I can live with it": 3
        },
        "n": 5
      },
      "insight": "All 5 respondents are neutral or indifferent to Cash-Back Rewards being included (2 'neutral,' 2 'can live with it,' 1 'can live with it'), signaling zero enthusiasm for the feature."
    },
    {
      "number": 21,
      "id": "q21",
      "text": "How would you feel if Cash-Back Rewards WAS NOT in the product?",
      "type": "single",
      "renderer": "kano",
      "renderer_label": "Kano",
      "options": [
        "I like it",
        "I expect it",
        "Neutral",
        "I can live with it",
        "I dislike it"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "I like it": 5
        },
        "n": 5
      },
      "insight": "All 5 respondents said they would 'like it' if Cash-Back Rewards were removed, combined with q20, this is a reverse (anti-feature) Kano pattern where the feature's absence is preferred."
    },
    {
      "number": 22,
      "id": "q22",
      "text": "How would you feel if Offline Mode WAS in the product?",
      "type": "single",
      "renderer": "kano",
      "renderer_label": "Kano",
      "options": [
        "I like it",
        "I expect it",
        "Neutral",
        "I can live with it",
        "I dislike it"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "I like it": 1,
          "Neutral": 1,
          "I can live with it": 2,
          "I expect it": 1
        },
        "n": 5
      },
      "insight": "Offline Mode responses when present spread evenly across all five options (1 each for 'like it,' 'neutral,' 'can live with it,' 'expect it,' 'can live with it'), indicating deeply divided and inconclusive sentiment."
    },
    {
      "number": 23,
      "id": "q23",
      "text": "How would you feel if Offline Mode WAS NOT in the product?",
      "type": "single",
      "renderer": "kano",
      "renderer_label": "Kano",
      "options": [
        "I like it",
        "I expect it",
        "Neutral",
        "I can live with it",
        "I dislike it"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "I can live with it": 2,
          "Neutral": 1,
          "I like it": 2
        },
        "n": 5
      },
      "insight": "When Offline Mode is absent, 2 respondents 'like it,' 2 'can live with it,' and 1 is 'neutral', absence generates no distress and mild positivity for 2 of 5, suggesting low Must-Have pull."
    }
  ],
  "data_quality_notes": [],
  "methodology_disclaimer": "Results are generated by AI synthetic respondents calibrated to the audience spec. They are directional signal, not a substitute for fielding with real customers, especially at small sample sizes. Combine with real-customer data before making absolute claims."
};

export const ROADMAP: CanonicalReport = RAW;
