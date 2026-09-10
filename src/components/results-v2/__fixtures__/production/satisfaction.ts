/**
 * GENERATED FROM PRODUCTION - do not hand-edit.
 *
 * satisfaction - P47 SwiftEats CSAT. Proves the NPS/CSAT/CES adapter (centerpiece.ts satisfaction()).
 *
 * Produced by running the backend's real `buildCanonicalReport(mission,
 * mission.analysis, mission_responses)` (vettit-backend
 * src/services/report/buildReport.js) against production mission
 * 30e1de33-18ee-4fd3-b091-4544b764539c (n = 5 distinct personas,
 * completed 2026-06-13T19:37:25.363+00:00) and serialising the result. Nothing here is
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
    "title": "P47, SwiftEats CSAT",
    "brief": "Measure satisfaction (NPS, CSAT, CES) with the SwiftEats food-delivery app among customers who ordered in the last 30 days.",
    "methodology": "satisfaction",
    "methodology_label": "Customer Satisfaction",
    "sample": {
      "n": 5,
      "qualified": 5,
      "delivered": 5,
      "posture": "directional",
      "completed_at": "2026-06-13T19:37:25.363+00:00",
      "mission_id": "30e1de33-18ee-4fd3-b091-4544b764539c"
    }
  },
  "headline": {
    "metric": "NPS",
    "value": "-20",
    "all": [
      {
        "label": "NPS",
        "value": "-20"
      },
      {
        "label": "CSAT (top-2-box)",
        "value": "80%"
      },
      {
        "label": "CES (top-2-box)",
        "value": "66.7%"
      },
      {
        "label": "Retention / likelihood-to-return (mean of 5)",
        "value": "4"
      },
      {
        "label": "Top issue: App crashed or froze during ordering",
        "value": "60%"
      },
      {
        "label": "NPS base (n)",
        "value": "5"
      }
    ]
  },
  "centerpiece": {
    "methodology": "satisfaction",
    "data": {
      "n": 5,
      "ces": {
        "n": 3,
        "top2_pct": 66.6667,
        "distribution": {
          "4": 1,
          "6": 2
        }
      },
      "nps": {
        "n": 5,
        "score": -20,
        "segments": {
          "passives": {
            "pct": 80,
            "count": 4
          },
          "promoters": {
            "pct": 0,
            "count": 0
          },
          "detractors": {
            "pct": 20,
            "count": 1
          }
        }
      },
      "csat": {
        "n": 5,
        "top2_pct": 80,
        "distribution": {
          "Satisfied": 4,
          "Dissatisfied": 1
        }
      },
      "issues": {
        "n": 5,
        "ranked": [
          {
            "count": 3,
            "option": "App crashed or froze during ordering",
            "pct_of_respondents": 60
          },
          {
            "count": 3,
            "option": "Food was incorrect or missing items",
            "pct_of_respondents": 60
          },
          {
            "count": 1,
            "option": "Difficulty tracking my order in real time",
            "pct_of_respondents": 20
          },
          {
            "count": 1,
            "option": "Order arrived late",
            "pct_of_respondents": 20
          },
          {
            "count": 1,
            "option": "Restaurants go offline unexpectedly mid-order",
            "pct_of_respondents": 20
          }
        ],
        "selections": 9
      },
      "drivers": [
        {
          "n": 5,
          "kind": "nps_driver",
          "verbatims": [
            "SwiftEats saves me time during hectic work days, and my last order came on time with everything correct. But the app does crash sometimes during lunch rush, which is frustrating when I'm ordering between meetings.",
            "Most of the time it works fast and the food comes when promised. But the app sometimes freezes when I'm ordering during lunch, and I've had a couple of missing items that annoyed me. It's reliable enough for my routine but not perfect.",
            "The app is convenient for my work lunch, but the last three orders were delayed 10 to 15 minutes past the promised time. That's frustrating when I only have a 30-minute break. I also had a missing item recently which required a refund request, and I'm not sure the app feels as reliable as I need it to be.",
            "The app saves me time on nights when work runs late and my family needs to eat quickly. The delivery tracking is honest, so I know when food will arrive. That's worth a lot when I'm stressed and juggling work with family time.",
            "The delivery speed is solid and prices are fair, which is what I need as a busy working father. But the app can be confusing sometimes and I got an incomplete order once, which shook my confidence a bit."
          ],
          "question_id": "q3"
        },
        {
          "n": 5,
          "kind": "csat_driver",
          "verbatims": [
            "Fix the app crashes during peak hours. I also wish there were better filters for dietary preferences and healthy options, since I'm trying to make better meal choices for my family.",
            "Fix the app crashes during lunch hours. I work long shifts and often place orders at peak times, so when the app freezes it wastes my time. Also, be clearer about which promotions actually apply to my orders because I get confused sometimes.",
            "Fix the delivery timing. I order at 12:30 because I have exactly 30 minutes, and when food arrives 10 to 15 minutes late, my break is almost over. Also, double-check orders before they leave the restaurant so items don't go missing. The app tracking is okay, but the promises need to be kept.",
            "Stop letting restaurants go offline while I'm in the middle of ordering. It's annoying when the app doesn't warn me earlier that a place is about to close for orders. And sometimes I'd like to see faster delivery options without paying surge prices.",
            "Fix the app so it's easier to navigate without getting lost, and make sure orders are checked before they leave the restaurant. Late deliveries frustrate me when I'm hungry after a long day, so keep the speed up."
          ],
          "question_id": "q5"
        },
        {
          "n": 5,
          "kind": "ces_driver",
          "verbatims": [
            "The app interface is straightforward and I can quickly find the restaurants I like (Arabic and Asian fusion). What makes it harder is when the app lags or freezes during busy lunch times, and I can't easily filter for healthier meals.",
            "Normally it's straightforward because I order from the same restaurants every time, so I just find them and tap through. But when the app gets slow during lunch rush, it takes longer and feels clunky. The tracking could also be better so I know exactly when the driver is coming.",
            "The app interface is straightforward and my favorites are saved, so I can place an order in about 30 seconds. No problem there. But once I order, tracking and knowing whether my food will arrive on time is where it gets confusing. The estimated delivery time keeps changing, and there's no real-time visibility.",
            "The interface is straightforward. I can tap in my favorites, choose a restaurant, and pay in seconds. What slows me down is when restaurants are listed as open but then I find out they're actually closed once I'm mid-order.",
            "The app loads fine and the menu is clear, but finding what I want and checking out takes more clicks than it should. The tracking part is okay but could show more detail about where my delivery is."
          ],
          "question_id": "q7"
        }
      ],
      "retention": {
        "n": 5,
        "stats": {
          "n": 5,
          "mean": 4,
          "ci_low": 4,
          "stddev": 0,
          "ci_high": 4
        },
        "distribution": {
          "4": 5
        }
      },
      "attributes": null,
      "computed_at": "2026-06-17T08:12:06.247Z",
      "methodology": "satisfaction",
      "analysis_version": 1
    }
  },
  "key_findings": [
    {
      "label": "NPS",
      "trend": "neutral",
      "value": "-20"
    },
    {
      "label": "CSAT (top-2-box)",
      "trend": "neutral",
      "value": "80%"
    },
    {
      "label": "CES (top-2-box)",
      "trend": "neutral",
      "value": "66.7%"
    }
  ],
  "recommendations": [
    "Act on the headline finding (NPS: -20) and review the full survey below for the supporting detail behind it.",
    "Weigh CSAT (top-2-box) (80%) in the decision, it is among the strongest signals in this study.",
    "Weigh CES (top-2-box) (66.7%) in the decision, it is among the strongest signals in this study.",
    "Weigh Retention / likelihood-to-return (mean of 5) (4) in the decision, it is among the strongest signals in this study.",
    "Weigh Top issue: App crashed or froze during ordering (60%) in the decision, it is among the strongest signals in this study."
  ],
  "finding": "SwiftEats is retaining passive users but generating zero promoters, producing an NPS of -20 in this directional sample (n=5), a significant loyalty deficit that signals the service is not yet turning satisfied customers into advocates.",
  "synthesis": "SwiftEats is retaining passive users but generating zero promoters, producing an NPS of -20 in this directional sample (n=5), a significant loyalty deficit that signals the service is not yet turning satisfied customers into advocates. Despite an 80% CSAT top-2-box score, app crashes or freezes and incorrect/missing items were each flagged by 60% of respondents, pointing to a small set of operational failures that are suppressing word-of-mouth growth. Notably, all 5 respondents rated their likelihood to return at exactly 4 out of 5, suggesting habitual use is holding retention steady even as underlying frustrations accumulate. Given the directional nature of this sample, the immediate priority should be a focused fix on peak-hour app stability and pre-dispatch order accuracy checks, resolving these two issues addresses the top pain points for the majority of respondents and represents the highest-leverage path to converting passives into promoters.",
  "personas": [
    {
      "name": "Pragmatic Decision-Makers",
      "role": "Operations Manager",
      "share": "60%",
      "n": 3,
      "description": "Prioritise reliability and value for money; pragmatic decision-makers; ages 34-42."
    },
    {
      "name": "Habitual Decision-Makers",
      "role": "Sales Manager",
      "share": "40%",
      "n": 2,
      "description": "Prioritise reliability and value for money; habitual decision-makers; ages 42-42."
    }
  ],
  "screening": {
    "question_id": "q1",
    "question": "Have you placed an order using the SwiftEats app in the past 30 days?",
    "qualified": 5,
    "distribution": {
      "Yes": 5
    }
  },
  "exec_summary": "SwiftEats is retaining passive users but generating zero promoters, producing an NPS of -20 in this directional sample (n=5), a significant loyalty deficit that signals the service is not yet turning satisfied customers into advocates. Despite an 80% CSAT top-2-box score, app crashes or freezes and incorrect/missing items were each flagged by 60% of respondents, pointing to a small set of operational failures that are suppressing word-of-mouth growth. Notably, all 5 respondents rated their likelihood to return at exactly 4 out of 5, suggesting habitual use is holding retention steady even as underlying frustrations accumulate. Given the directional nature of this sample, the immediate priority should be a focused fix on peak-hour app stability and pre-dispatch order accuracy checks, resolving these two issues addresses the top pain points for the majority of respondents and represents the highest-leverage path to converting passives into promoters.",
  "survey": [
    {
      "number": 1,
      "id": "q1",
      "text": "Have you placed an order using the SwiftEats app in the past 30 days?",
      "type": "single",
      "renderer": "screener",
      "renderer_label": "screener",
      "options": [
        "Yes",
        "No"
      ],
      "isScreening": true,
      "data": {
        "distribution": {
          "Yes": 5
        },
        "n": 5
      },
      "insight": "All 5 respondents placed a SwiftEats order in the past 30 days, confirming this is an active-user sample."
    },
    {
      "number": 2,
      "id": "q2",
      "text": "How likely are you to recommend SwiftEats to a friend or colleague?",
      "type": "rating",
      "renderer": "scale_0_10",
      "renderer_label": "0-10 scale",
      "options": [],
      "isScreening": false,
      "data": {
        "scale_min": 0,
        "scale_max": 10,
        "distribution": {
          "0": 0,
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 0,
          "5": 0,
          "6": 1,
          "7": 3,
          "8": 1,
          "9": 0,
          "10": 0
        },
        "average": 7,
        "n": 5,
        "ci_low": 6.38,
        "ci_high": 7.62,
        "stddev": 0.71
      },
      "insight": "Recommendation intent is moderate, averaging 7 out of 10 across 5 respondents, with 3 of 5 scoring exactly 7 and no one scoring above 8."
    },
    {
      "number": 3,
      "id": "q3",
      "text": "What's the main reason for your score?",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "SwiftEats saves me time during hectic work days, and my last order came on time with everything correct. But the app does crash sometimes during lunch rush, which is frustrating when I'm ordering between meetings.",
          "Most of the time it works fast and the food comes when promised. But the app sometimes freezes when I'm ordering during lunch, and I've had a couple of missing items that annoyed me. It's reliable enough for my routine but not perfect.",
          "The app is convenient for my work lunch, but the last three orders were delayed 10 to 15 minutes past the promised time. That's frustrating when I only have a 30-minute break. I also had a missing item recently which required a refund request, and I'm not sure the app feels as reliable as I need it to be."
        ],
        "n": 5
      },
      "insight": "All 5 respondents provided a reason for their recommendation score; see verbatims for qualitative detail."
    },
    {
      "number": 4,
      "id": "q4",
      "text": "How satisfied are you with SwiftEats's recent order experience?",
      "type": "single",
      "renderer": "single_select",
      "renderer_label": "single choice",
      "options": [
        "Very dissatisfied",
        "Dissatisfied",
        "Neutral",
        "Satisfied",
        "Very satisfied"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Satisfied": 4,
          "Dissatisfied": 1
        },
        "n": 5
      },
      "insight": "4 out of 5 respondents said they were satisfied with their recent order experience, while 1 reported dissatisfaction."
    },
    {
      "number": 5,
      "id": "q5",
      "text": "What could SwiftEats do to improve your recent order experience?",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "Fix the app crashes during peak hours. I also wish there were better filters for dietary preferences and healthy options, since I'm trying to make better meal choices for my family.",
          "Fix the app crashes during lunch hours. I work long shifts and often place orders at peak times, so when the app freezes it wastes my time. Also, be clearer about which promotions actually apply to my orders because I get confused sometimes.",
          "Fix the delivery timing. I order at 12:30 because I have exactly 30 minutes, and when food arrives 10 to 15 minutes late, my break is almost over. Also, double-check orders before they leave the restaurant so items don't go missing. The app tracking is okay, but the promises need to be kept."
        ],
        "n": 5
      },
      "insight": "All 5 respondents offered improvement suggestions; see verbatims for qualitative detail."
    },
    {
      "number": 6,
      "id": "q6",
      "text": "How easy was it to complete your SwiftEats order?",
      "type": "rating",
      "renderer": "scale_1_7",
      "renderer_label": "1-7 scale",
      "options": [
        "1 - Very difficult",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7 - Very easy"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 7,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 1,
          "5": 0,
          "6": 2,
          "7": 2
        },
        "average": 6,
        "n": 5,
        "ci_low": 4.93,
        "ci_high": 7.07,
        "stddev": 1.22
      },
      "insight": "Order completion felt easy, averaging 6 out of 7, with 4 of 5 respondents scoring 6 or 7 and only 1 scoring as low as 4."
    },
    {
      "number": 7,
      "id": "q7",
      "text": "What made it easy or hard to complete your SwiftEats order?",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "The app interface is straightforward and I can quickly find the restaurants I like (Arabic and Asian fusion). What makes it harder is when the app lags or freezes during busy lunch times, and I can't easily filter for healthier meals.",
          "Normally it's straightforward because I order from the same restaurants every time, so I just find them and tap through. But when the app gets slow during lunch rush, it takes longer and feels clunky. The tracking could also be better so I know exactly when the driver is coming.",
          "The app interface is straightforward and my favorites are saved, so I can place an order in about 30 seconds. No problem there. But once I order, tracking and knowing whether my food will arrive on time is where it gets confusing. The estimated delivery time keeps changing, and there's no real-time visibility."
        ],
        "n": 5
      },
      "insight": "All 5 respondents described what made their order easy or hard; see verbatims for qualitative detail."
    },
    {
      "number": 8,
      "id": "q8",
      "text": "Please rate SwiftEats on each of the following attributes on a scale of 1 (Poor) to 5 (Excellent).",
      "type": "rating",
      "renderer": "attribute_battery",
      "renderer_label": "attribute battery",
      "options": [
        "Quality",
        "Value",
        "Reliability",
        "Customer service",
        "Ease of use"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "[object Object]": 25
        },
        "n_respondents": 5,
        "n": 5,
        "shape": "endorsement"
      },
      "insight": "Attribute-level ratings were collected across 5 respondents; individual attribute breakdowns are needed to interpret the 25 total responses recorded."
    },
    {
      "number": 9,
      "id": "q9",
      "text": "How likely are you to continue using SwiftEats in the next 12 months?",
      "type": "rating",
      "renderer": "scale_1_5_star",
      "renderer_label": "1-5 rating",
      "options": [
        "1 - Very unlikely",
        "2",
        "3",
        "4",
        "5 - Very likely"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 5,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 5,
          "5": 0
        },
        "average": 4,
        "n": 5,
        "ci_low": 4,
        "ci_high": 4,
        "stddev": 0
      },
      "insight": "Retention intent is consistently strong but not peak, all 5 respondents gave exactly 4 out of 5 stars, with no one scoring 5."
    },
    {
      "number": 10,
      "id": "q10",
      "text": "Which of these issues have you experienced with SwiftEats in the past 30 days? Select all that apply.",
      "type": "multi",
      "renderer": "multi_select",
      "renderer_label": "multi-select",
      "options": [
        "Order arrived late",
        "Food was incorrect or missing items",
        "Food arrived cold or poor quality",
        "App crashed or froze during ordering",
        "Difficulty tracking my order in real time",
        "Couldn't reach SwiftEats customer support",
        "Unexpected charges or incorrect billing"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "App crashed or froze during ordering": 3,
          "Food was incorrect or missing items": 3,
          "Order arrived late": 1,
          "Restaurants go offline unexpectedly mid-order": 1,
          "Difficulty tracking my order in real time": 1
        },
        "n_respondents": 5,
        "n": 5
      },
      "insight": "App crashes or freezes and incorrect or missing items were the most common issues, each reported by 3 of 5 respondents, while late delivery, restaurants going offline, and tracking difficulty were each flagged by 1 respondent."
    }
  ],
  "data_quality_notes": [
    {
      "question_number": 10,
      "question_id": "q10",
      "note": "1 answer value(s) not in the saved option list (Restaurants go offline unexpectedly mid-order)."
    }
  ],
  "methodology_disclaimer": "Results are generated by AI synthetic respondents calibrated to the audience spec. They are directional signal, not a substitute for fielding with real customers, especially at small sample sizes. Combine with real-customer data before making absolute claims."
};

export const SATISFACTION: CanonicalReport = RAW;
