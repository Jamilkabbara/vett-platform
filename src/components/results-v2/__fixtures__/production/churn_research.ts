/**
 * GENERATED FROM PRODUCTION - do not hand-edit.
 *
 * churn_research - P47 StreamVerse churn. Proves the churn() adapter, which is also the adapter for the bare 'churn' key.
 *
 * Produced by running the backend's real `buildCanonicalReport(mission,
 * mission.analysis, mission_responses)` (vettit-backend
 * src/services/report/buildReport.js) against production mission
 * d7538796-5d50-41ef-9b58-0d8644a5fe0a (n = 5 distinct personas,
 * completed 2026-06-13T19:37:28.829+00:00) and serialising the result. Nothing here is
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
    "title": "P47, StreamVerse churn",
    "brief": "Understand why subscribers cancel the StreamVerse video-streaming service and what would win them back.",
    "methodology": "churn_research",
    "methodology_label": "Churn Study",
    "sample": {
      "n": 5,
      "qualified": 5,
      "delivered": 5,
      "posture": "directional",
      "completed_at": "2026-06-13T19:37:28.829+00:00",
      "mission_id": "d7538796-5d50-41ef-9b58-0d8644a5fe0a"
    }
  },
  "headline": {
    "metric": "Churn driver: Price",
    "value": "100%",
    "all": [
      {
        "label": "Churn driver: Price",
        "value": "100%"
      },
      {
        "label": "Churn driver: Product fit",
        "value": "100%"
      },
      {
        "label": "Churn driver: Competition",
        "value": "60%"
      },
      {
        "label": "Churn driver: Life change",
        "value": "20%"
      },
      {
        "label": "Winnable (would return)",
        "value": "0%"
      }
    ]
  },
  "centerpiece": {
    "methodology": "churn",
    "data": {
      "n": 5,
      "tenure": {
        "n": 5,
        "distribution": {
          "1-3 years": 1,
          "1-3 months": 1,
          "3-12 months": 3
        }
      },
      "drivers": {
        "n": 5,
        "ranked": [
          {
            "count": 5,
            "reason": "Price",
            "pct_of_respondents": 100
          },
          {
            "count": 5,
            "reason": "Product fit",
            "pct_of_respondents": 100
          },
          {
            "count": 3,
            "reason": "Competition",
            "pct_of_respondents": 60
          },
          {
            "count": 1,
            "reason": "Life change",
            "pct_of_respondents": 20
          }
        ],
        "selections": 14
      },
      "winback": {
        "n": 5,
        "distribution": {
          "Maybe": 5
        },
        "winnable_pct": 0
      },
      "switching": {
        "n": 5,
        "distribution": {
          "No, I didn't really switch. I mostly use YouTube and the free ad-supported channels when I have time. My wife still watches regular broadcast TV. We're just not paying for streaming right now.": 1,
          "Not exactly switched. I already had Netflix and YouTube Premium, so I just watch free content on those platforms when I have time on weekends. No real replacement for StreamVerse because I wasn't using it heavily anyway.": 1,
          "Yes, I switched to two services now. One has better sports coverage including Arabic channels, and the other has more recent films and shows. It costs about the same as StreamVerse was alone, but at least I'm watching both of them.": 1,
          "I didn't really switch. We already had Netflix with my brother, YouTube, and we use beIN Connect for sports when there's something specific on. My family's viewing mainly stays with what we were already using before I signed up for StreamVerse.": 1,
          "Yes, I moved to free ad-supported platforms like YouTube and sometimes we just go to the cinema for movies. The cinema is an experience the family enjoys together, and the free platforms have enough variety for casual viewing without the subscription cost.": 1
        }
      },
      "ces_at_exit": {
        "n": 5,
        "mean": 6,
        "ci_low": 6,
        "stddev": 0,
        "ci_high": 6
      },
      "computed_at": "2026-06-17T08:12:07.677Z",
      "methodology": "churn",
      "warning_signs": {
        "n": 5,
        "distribution": {
          "When I realized I was watching the same shows in rotation and scrolling past content for ten minutes without finding anything new. That's when I started thinking about whether I really needed this service at all.": 1,
          "When I checked my bank statement and saw the charge, then realized I'd only watched maybe one episode that month. That's when it hit me that we weren't actually using it, and the money could go somewhere the family actually needed it.": 1,
          "After the first month or two, I realized I was scrolling past most of the Arabic films because they were from years ago. I'd think about watching something, but nothing felt new, so I'd just pick YouTube instead. That's when I knew I was wasting money.": 1,
          "Within the first month, I noticed the Arabic drama selection was quite limited compared to Netflix, and the sports content didn't match what beIN already offers. That's when I started thinking it might not be worth the extra monthly cost for my family.": 1,
          "Within the first month or two, I realized the content just was not for us. I kept scrolling through the library hoping to find something my wife and kids would want to watch, but nothing really clicked. That is when I knew the subscription was not going to work long term.": 1
        }
      },
      "analysis_version": 1,
      "reason_verbatims": [
        "I was paying for three streaming services and honestly using only one actively. StreamVerse had the same type of content I was already watching on Netflix, and with my schedule at the store, I wasn't finding new shows worth watching. The money adds up each month, so I had to cut something, and it made sense to drop the one I used least.",
        "My wife pointed out we weren't watching it enough to justify paying for another subscription every month. Between Netflix that we share with my brother, YouTube, and the sports channels we already have, StreamVerse just didn't offer anything unique enough to make the cost worthwhile. The Arabic dramas and sports content weren't comprehensive enough to pull us away from what we already use.",
        "I was paying for something the family barely used. The kids wanted their games and school stuff, my wife preferred watching the regular TV while cooking dinner, and I only had time to watch maybe twice a week when I was too tired after work. The money made more sense going to my daughter's tuition than sitting unused. It was simple math.",
        "I was paying too much for content I barely watched. The Arabic cinema catalog was old and didn't change much, and when my renewal came up at the same price, I looked at what else was available. The other services had better sports coverage and family packages, so I cancelled. No point keeping a subscription I use maybe once a week on weekends when I can get more value elsewhere.",
        "I was paying every month for something my family and I barely used. The shows and movies on StreamVerse were not what we wanted to watch, and between work travel and family time, I just wasn't getting value from it. It made more sense to watch movies at the cinema with the kids or use free platforms when we had time."
      ],
      "winback_triggers": {
        "n": 5,
        "ranked": [
          {
            "count": 5,
            "reason": "Price discount or promo",
            "pct_of_respondents": 100
          },
          {
            "count": 4,
            "reason": "New product offering",
            "pct_of_respondents": 80
          },
          {
            "count": 3,
            "reason": "New feature or improvement",
            "pct_of_respondents": 60
          },
          {
            "count": 1,
            "reason": "Change in my situation",
            "pct_of_respondents": 20
          }
        ],
        "selections": 13
      },
      "satisfaction_at_churn": [
        {
          "n": 5,
          "text": "Overall, how satisfied were you with StreamVerse at the time you cancelled?",
          "stats": null,
          "question_id": "q4",
          "distribution": {
            "Neutral": 2,
            "Dissatisfied": 3
          }
        },
        {
          "n": 5,
          "text": "At the time you cancelled, how likely were you to recommend StreamVerse to a friend or colleague? (0 = Not at all likely, 10 = Extremely likely)",
          "stats": {
            "n": 5,
            "mean": 3.4,
            "ci_low": 2.9199,
            "stddev": 0.5477,
            "ci_high": 3.8801
          },
          "question_id": "q5",
          "distribution": {
            "3": 3,
            "4": 2
          }
        }
      ]
    }
  },
  "key_findings": [
    {
      "label": "Churn driver: Price",
      "trend": "neutral",
      "value": "100%"
    },
    {
      "label": "Churn driver: Product fit",
      "trend": "neutral",
      "value": "100%"
    },
    {
      "label": "Churn driver: Competition",
      "trend": "neutral",
      "value": "60%"
    }
  ],
  "recommendations": [
    "Act on the headline finding (Churn driver: Price: 100%) and review the full survey below for the supporting detail behind it.",
    "Weigh Churn driver: Product fit (100%) in the decision, it is among the strongest signals in this study.",
    "Weigh Churn driver: Competition (60%) in the decision, it is among the strongest signals in this study.",
    "Weigh Churn driver: Life change (20%) in the decision, it is among the strongest signals in this study.",
    "Weigh Winnable (would return) (0%) in the decision, it is among the strongest signals in this study."
  ],
  "finding": "In this directional sample of 5 churned StreamVerse subscribers, price and product fit were each cited by 100% of respondents as churn drivers, making them a tied top-line crisis, not a single churner left for price or content reasons alone, but for both simultaneously.",
  "synthesis": "In this directional sample of 5 churned StreamVerse subscribers, price and product fit were each cited by 100% of respondents as churn drivers, making them a tied top-line crisis, not a single churner left for price or content reasons alone, but for both simultaneously. Supporting this, satisfaction at cancellation skewed negative (3 dissatisfied, 2 neutral) and mean likelihood to recommend was just 3.4 out of 10, while 0% of the 5 respondents are considered winnable under current conditions. However, all 5 indicated a price discount or promotion would be a winback trigger, and 80% cited a new product offering, suggesting StreamVerse should prioritize a lower-cost tier paired with targeted Arabic-language and sports content investment to address the compounding price-plus-fit failure before reactivation outreach. Note: with n=5, these findings are directional only and should not be treated as statistically conclusive.",
  "personas": [],
  "screening": {
    "question_id": "q1",
    "question": "Have you cancelled your StreamVerse subscription in the recent period?",
    "qualified": 5,
    "distribution": {
      "Yes": 5
    }
  },
  "exec_summary": "In this directional sample of 5 churned StreamVerse subscribers, price and product fit were each cited by 100% of respondents as churn drivers, making them a tied top-line crisis, not a single churner left for price or content reasons alone, but for both simultaneously. Supporting this, satisfaction at cancellation skewed negative (3 dissatisfied, 2 neutral) and mean likelihood to recommend was just 3.4 out of 10, while 0% of the 5 respondents are considered winnable under current conditions. However, all 5 indicated a price discount or promotion would be a winback trigger, and 80% cited a new product offering, suggesting StreamVerse should prioritize a lower-cost tier paired with targeted Arabic-language and sports content investment to address the compounding price-plus-fit failure before reactivation outreach. Note: with n=5, these findings are directional only and should not be treated as statistically conclusive.",
  "survey": [
    {
      "number": 1,
      "id": "q1",
      "text": "Have you cancelled your StreamVerse subscription in the recent period?",
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
      "insight": "All 5 respondents confirmed they recently cancelled their StreamVerse subscription, making this a clean churn sample with no screener drop-off."
    },
    {
      "number": 2,
      "id": "q2",
      "text": "What was the reason you stopped using StreamVerse? Select all that apply.",
      "type": "multi",
      "renderer": "multi_select",
      "renderer_label": "multi-select",
      "options": [
        "Price",
        "Product fit",
        "Customer service",
        "Competition",
        "Life change",
        "Quality",
        "Features",
        "Trust",
        "Other"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Price": 5,
          "Product fit": 5,
          "Competition": 3,
          "Life change": 1
        },
        "n_respondents": 5,
        "n": 5
      },
      "insight": "Price and product fit were cited by all 5 respondents as reasons for cancelling, while competition was a factor for 3 of 5, signaling that cost and relevance, not just rivalry, are the dominant churn drivers."
    },
    {
      "number": 3,
      "id": "q3",
      "text": "Tell us more about the main reason you cancelled StreamVerse in your own words.",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "I was paying for three streaming services and honestly using only one actively. StreamVerse had the same type of content I was already watching on Netflix, and with my schedule at the store, I wasn't finding new shows worth watching. The money adds up each month, so I had to cut something, and it made sense to drop the one I used least.",
          "My wife pointed out we weren't watching it enough to justify paying for another subscription every month. Between Netflix that we share with my brother, YouTube, and the sports channels we already have, StreamVerse just didn't offer anything unique enough to make the cost worthwhile. The Arabic dramas and sports content weren't comprehensive enough to pull us away from what we already use.",
          "I was paying for something the family barely used. The kids wanted their games and school stuff, my wife preferred watching the regular TV while cooking dinner, and I only had time to watch maybe twice a week when I was too tired after work. The money made more sense going to my daughter's tuition than sitting unused. It was simple math."
        ],
        "n": 5
      },
      "insight": "All 5 respondents provided open-text explanations of their cancellation; reviewing these verbatims will surface the specific language and contexts behind the top-line reasons."
    },
    {
      "number": 4,
      "id": "q4",
      "text": "Overall, how satisfied were you with StreamVerse at the time you cancelled?",
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
          "Neutral": 2,
          "Dissatisfied": 3
        },
        "n": 5
      },
      "insight": "At the time of cancellation, 3 of 5 respondents were Dissatisfied and 2 were Neutral, none reported positive satisfaction, indicating StreamVerse had already lost these customers emotionally before they formally cancelled."
    },
    {
      "number": 5,
      "id": "q5",
      "text": "At the time you cancelled, how likely were you to recommend StreamVerse to a friend or colleague? (0 = Not at all likely, 10 = Extremely likely)",
      "type": "rating",
      "renderer": "scale_1_5_star",
      "renderer_label": "1-5 rating",
      "options": [],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 5,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 3,
          "4": 2,
          "5": 0
        },
        "average": 3.4,
        "n": 5,
        "ci_low": 2.92,
        "ci_high": 3.88,
        "stddev": 0.55
      },
      "insight": "Respondents scored likelihood to recommend at an average of 3.4 out of 5, with all 5 scores clustering at 3 or 4, suggesting tepid, below-midpoint advocacy rather than active detraction at the moment of cancellation."
    },
    {
      "number": 6,
      "id": "q6",
      "text": "Would you reconsider using StreamVerse in the future?",
      "type": "single",
      "renderer": "single_select",
      "renderer_label": "single choice",
      "options": [
        "Yes",
        "Maybe",
        "No"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Maybe": 5
        },
        "n": 5
      },
      "insight": "All 5 respondents answered 'Maybe' when asked about returning to StreamVerse, indicating the door is not closed but no one is leaning strongly toward win-back."
    },
    {
      "number": 7,
      "id": "q7",
      "text": "What would bring you back to StreamVerse? Select all that apply.",
      "type": "multi",
      "renderer": "multi_select",
      "renderer_label": "multi-select",
      "options": [
        "Price discount or promo",
        "New feature or improvement",
        "Better service",
        "Personal outreach",
        "New product offering",
        "Change in my situation",
        "Other"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Price discount or promo": 5,
          "New product offering": 4,
          "New feature or improvement": 3,
          "Change in my situation": 1
        },
        "n_respondents": 5,
        "n": 5
      },
      "insight": "A price discount or promo was selected by all 5 respondents as a potential win-back driver, followed by a new product offering (4 of 5) and a new feature or improvement (3 of 5), pointing to pricing as the single clearest lever to re-engage this group."
    },
    {
      "number": 8,
      "id": "q8",
      "text": "Did you switch to a competitor after cancelling StreamVerse? If so, which one?",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "Not exactly switched. I already had Netflix and YouTube Premium, so I just watch free content on those platforms when I have time on weekends. No real replacement for StreamVerse because I wasn't using it heavily anyway.",
          "I didn't really switch. We already had Netflix with my brother, YouTube, and we use beIN Connect for sports when there's something specific on. My family's viewing mainly stays with what we were already using before I signed up for StreamVerse.",
          "No, I didn't really switch. I mostly use YouTube and the free ad-supported channels when I have time. My wife still watches regular broadcast TV. We're just not paying for streaming right now."
        ],
        "n": 5
      },
      "insight": "All 5 respondents left open-text responses about competitor switching; reviewing these verbatims will identify which specific platforms are capturing churned StreamVerse users."
    },
    {
      "number": 9,
      "id": "q9",
      "text": "How easy or difficult was it to cancel your StreamVerse subscription? (1 = Very difficult, 7 = Very easy)",
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
      "insight": "Every respondent rated cancellation ease at a 6 out of 7, yielding a perfect average of 6.0, the offboarding process created zero friction, which may have removed a last barrier to leaving."
    },
    {
      "number": 10,
      "id": "q10",
      "text": "Looking back, what was the first sign that you would leave StreamVerse?",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "When I realized I was watching the same shows in rotation and scrolling past content for ten minutes without finding anything new. That's when I started thinking about whether I really needed this service at all.",
          "Within the first month, I noticed the Arabic drama selection was quite limited compared to Netflix, and the sports content didn't match what beIN already offers. That's when I started thinking it might not be worth the extra monthly cost for my family.",
          "When I checked my bank statement and saw the charge, then realized I'd only watched maybe one episode that month. That's when it hit me that we weren't actually using it, and the money could go somewhere the family actually needed it."
        ],
        "n": 5
      },
      "insight": "All 5 respondents described early warning signs of their eventual cancellation in open text; these verbatims are the primary source for identifying leading indicators of churn risk."
    },
    {
      "number": 11,
      "id": "q11",
      "text": "How long were you a StreamVerse subscriber before you cancelled?",
      "type": "single",
      "renderer": "single_select",
      "renderer_label": "single choice",
      "options": [
        "Less than 1 month",
        "1-3 months",
        "3-12 months",
        "1-3 years",
        "More than 3 years"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "1-3 years": 1,
          "1-3 months": 1,
          "3-12 months": 3
        },
        "n": 5
      },
      "insight": "3 of 5 respondents had been subscribers for 3-12 months before cancelling, with 1 leaving after just 1-3 months and 1 after 1-3 years, suggesting the 3-to-12-month window is the most common churn zone in this sample."
    }
  ],
  "data_quality_notes": [],
  "methodology_disclaimer": "Results are generated by AI synthetic respondents calibrated to the audience spec. They are directional signal, not a substitute for fielding with real customers, especially at small sample sizes. Combine with real-customer data before making absolute claims."
};

export const CHURN_RESEARCH: CanonicalReport = RAW;
