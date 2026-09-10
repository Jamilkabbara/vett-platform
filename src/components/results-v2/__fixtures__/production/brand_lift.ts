/**
 * GENERATED FROM PRODUCTION - do not hand-edit.
 *
 * brand_lift - P47 NovaBank brand lift. Proves the brandLift() adapter (exposed vs control funnel).
 *
 * Produced by running the backend's real `buildCanonicalReport(mission,
 * mission.analysis, mission_responses)` (vettit-backend
 * src/services/report/buildReport.js) against production mission
 * 191455e8-456e-4ccf-85fd-a7811fa6a841 (n = 5 distinct personas,
 * completed 2026-06-13T19:37:38.128+00:00) and serialising the result. Nothing here is
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
    "title": "P47, NovaBank brand lift",
    "brief": "Measure brand lift from a recent digital campaign for NovaBank, a UAE neobank, across awareness, ad recall, consideration, and purchase intent.",
    "methodology": "brand_lift",
    "methodology_label": "Brand Lift Study",
    "sample": {
      "n": 5,
      "qualified": 5,
      "delivered": 5,
      "posture": "directional",
      "completed_at": "2026-06-13T19:37:38.128+00:00",
      "mission_id": "191455e8-456e-4ccf-85fd-a7811fa6a841"
    }
  },
  "headline": {
    "metric": "On a scale of 0 to 10, how likely are you to recommend NovaBank to a friend or colleague in the UAE?",
    "value": "exposed 7 vs control 4.5 (+2.5, significant at 95%)",
    "all": [
      {
        "label": "On a scale of 0 to 10, how likely are you to recommend NovaBank to a friend or colleague in the UAE?",
        "value": "exposed 7 vs control 4.5 (+2.5, significant at 95%)"
      },
      {
        "label": "Funnel stages lifted",
        "value": "1"
      },
      {
        "label": "Stages significant at 95%",
        "value": "1"
      },
      {
        "label": "Exposed cell (n)",
        "value": "3"
      },
      {
        "label": "Control cell (n)",
        "value": "2"
      }
    ]
  },
  "centerpiece": {
    "methodology": "brand_lift",
    "data": {
      "cells": {
        "control": {
          "n": 2
        },
        "exposed": {
          "n": 3
        },
        "not_applicable": {
          "n": 0
        }
      },
      "funnel": [
        {
          "text": "In your own words, which digital banks or neobanks have you seen or heard advertising for recently in the UAE?",
          "type": null,
          "reason": "unsupported_type_text",
          "control": {
            "n": 2
          },
          "exposed": {
            "n": 3
          },
          "lift_abs": null,
          "question_id": "q2",
          "funnel_stage": "unaided_ad_recall",
          "kpi_category": "ad_recall",
          "lift_rel_pct": null,
          "significance": null
        },
        {
          "text": "Which of the following digital banks or neobanks do you recall seeing or hearing an advertisement for recently? Select all that apply.",
          "type": null,
          "reason": "no_brand_anchor",
          "control": {
            "n": 2
          },
          "exposed": {
            "n": 3
          },
          "lift_abs": null,
          "question_id": "q3",
          "funnel_stage": "aided_ad_recall",
          "kpi_category": "ad_recall",
          "lift_rel_pct": null,
          "significance": null
        },
        {
          "text": "Which digital banks or neobanks are you aware of, even if you have not used them? Please type any names that come to mind.",
          "type": null,
          "reason": "unsupported_type_text",
          "control": {
            "n": 2
          },
          "exposed": {
            "n": 3
          },
          "lift_abs": null,
          "question_id": "q4",
          "funnel_stage": "unaided_brand_awareness",
          "kpi_category": "awareness",
          "lift_rel_pct": null,
          "significance": null
        },
        {
          "text": "Which of the following digital banks or neobanks are you aware of? Select all that apply.",
          "type": null,
          "reason": "no_brand_anchor",
          "control": {
            "n": 2
          },
          "exposed": {
            "n": 3
          },
          "lift_abs": null,
          "question_id": "q5",
          "funnel_stage": "aided_brand_awareness",
          "kpi_category": "awareness",
          "lift_rel_pct": null,
          "significance": null
        },
        {
          "text": "How familiar are you with NovaBank as a digital banking option in the UAE?",
          "type": "mean",
          "reason": "empty_cell",
          "control": {
            "n": 0
          },
          "exposed": {
            "n": 1,
            "mean": 3,
            "ci_low": 3,
            "stddev": 0,
            "ci_high": 3
          },
          "lift_abs": null,
          "question_id": "q6",
          "funnel_stage": "brand_familiarity",
          "kpi_category": "awareness",
          "lift_rel_pct": null,
          "significance": null
        },
        {
          "text": "Overall, how favorable is your impression of NovaBank?",
          "type": "mean",
          "reason": "empty_cell",
          "control": {
            "n": 0
          },
          "exposed": {
            "n": 1,
            "mean": 4,
            "ci_low": 4,
            "stddev": 0,
            "ci_high": 4
          },
          "lift_abs": null,
          "question_id": "q7",
          "funnel_stage": "brand_favorability",
          "kpi_category": "perception",
          "lift_rel_pct": null,
          "significance": null
        },
        {
          "text": "Which of the following messages, if any, do you associate with NovaBank? Select all that apply.",
          "type": null,
          "reason": "no_positive_definition",
          "control": {
            "n": 2
          },
          "exposed": {
            "n": 3
          },
          "lift_abs": null,
          "question_id": "q8",
          "funnel_stage": "message_association",
          "kpi_category": "perception",
          "lift_rel_pct": null,
          "significance": null
        },
        {
          "text": "How likely are you to consider NovaBank as your primary or secondary banking option in the next 3 months?",
          "type": "mean",
          "reason": "empty_cell",
          "control": {
            "n": 0
          },
          "exposed": {
            "n": 1,
            "mean": 4,
            "ci_low": 4,
            "stddev": 0,
            "ci_high": 4
          },
          "lift_abs": null,
          "question_id": "q9",
          "funnel_stage": "brand_consideration",
          "kpi_category": "consideration",
          "lift_rel_pct": null,
          "significance": null
        },
        {
          "text": "How likely are you to open an account with NovaBank in the next 3 months?",
          "type": "mean",
          "reason": "empty_cell",
          "control": {
            "n": 0
          },
          "exposed": {
            "n": 1,
            "mean": 3,
            "ci_low": 3,
            "stddev": 0,
            "ci_high": 3
          },
          "lift_abs": null,
          "question_id": "q10",
          "funnel_stage": "purchase_intent",
          "kpi_category": "intent",
          "lift_rel_pct": null,
          "significance": null
        },
        {
          "text": "On a scale of 0 to 10, how likely are you to recommend NovaBank to a friend or colleague in the UAE?",
          "type": "mean",
          "control": {
            "n": 2,
            "mean": 4.5,
            "ci_low": 3.52,
            "stddev": 0.7071,
            "ci_high": 5.48
          },
          "exposed": {
            "n": 3,
            "mean": 7,
            "ci_low": 7,
            "stddev": 0,
            "ci_high": 7
          },
          "lift_abs": 2.5,
          "question_id": "q11",
          "funnel_stage": "nps",
          "kpi_category": "advocacy",
          "lift_rel_pct": 55.5556,
          "significance": {
            "p": 0,
            "z": 5,
            "sig90": true,
            "sig95": true
          }
        },
        {
          "text": "Do you recall seeing a NovaBank advertisement on Instagram recently?",
          "type": null,
          "reason": "no_positive_definition",
          "control": {
            "n": 2
          },
          "exposed": {
            "n": 3
          },
          "lift_abs": null,
          "question_id": "q12",
          "funnel_stage": "channel_specific_recall",
          "kpi_category": "ad_recall",
          "lift_rel_pct": null,
          "significance": null
        },
        {
          "text": "Do you recall seeing a NovaBank advertisement on YouTube recently?",
          "type": null,
          "reason": "no_positive_definition",
          "control": {
            "n": 2
          },
          "exposed": {
            "n": 3
          },
          "lift_abs": null,
          "question_id": "q13",
          "funnel_stage": "channel_specific_recall",
          "kpi_category": "ad_recall",
          "lift_rel_pct": null,
          "significance": null
        },
        {
          "text": "Do you recall seeing a NovaBank advertisement on TikTok recently?",
          "type": null,
          "reason": "no_positive_definition",
          "control": {
            "n": 2
          },
          "exposed": {
            "n": 3
          },
          "lift_abs": null,
          "question_id": "q14",
          "funnel_stage": "channel_specific_recall",
          "kpi_category": "ad_recall",
          "lift_rel_pct": null,
          "significance": null
        }
      ],
      "summary": {
        "biggest_lift": {
          "lift_abs": 2.5,
          "question_id": "q11"
        },
        "stages_sig95": 1,
        "stages_lifted": 1
      },
      "computed_at": "2026-06-17T08:12:05.917Z",
      "methodology": "brand_lift",
      "analysis_version": 1
    }
  },
  "key_findings": [
    {
      "label": "On a scale of 0 to 10, how likely are you to recommend NovaBank to a friend or colleague in the UAE?",
      "trend": "neutral",
      "value": "exposed 7 vs control 4.5 (+2.5, significant at 95%)"
    },
    {
      "label": "Funnel stages lifted",
      "trend": "neutral",
      "value": "1"
    },
    {
      "label": "Stages significant at 95%",
      "trend": "neutral",
      "value": "1"
    }
  ],
  "recommendations": [
    "Act on the headline finding (On a scale of 0 to 10, how likely are you to recommend NovaBank to a friend or colleague in the UAE?: exposed 7 vs control 4.5 (+2.5, significant at 95%)) and review the full survey below for the supporting detail behind it.",
    "Weigh Funnel stages lifted (1) in the decision, it is among the strongest signals in this study.",
    "Weigh Stages significant at 95% (1) in the decision, it is among the strongest signals in this study.",
    "Weigh Exposed cell (n) (3) in the decision, it is among the strongest signals in this study.",
    "Weigh Control cell (n) (2) in the decision, it is among the strongest signals in this study."
  ],
  "finding": "NovaBank's campaign drove a +2.5-point lift in likelihood to recommend (exposed mean 7.0 vs.",
  "synthesis": "NovaBank's campaign drove a +2.5-point lift in likelihood to recommend (exposed mean 7.0 vs. control mean 4.5, significant at 95%), representing a 55.6% relative increase and the sole statistically significant signal in this study. This advocacy gain was the only measurable lift across the entire funnel, 12 other questions were unevaluable due to data limitations, meaning recommendation intent is currently the campaign's single proven output. Given the directional nature of this n=5 sample, these results cannot be generalized with certainty, but the NPS signal is strong enough to warrant scaling the study to a larger sample to validate funnel-wide impact, particularly at awareness and consideration stages where data was insufficient to produce lift estimates.",
  "personas": [
    {
      "name": "Retail Professionals",
      "role": "Marketing Manager",
      "share": "40%",
      "n": 2,
      "description": "Prioritise security and transparency; pragmatic decision-makers; ages 34-42."
    },
    {
      "name": "Real Estate Professionals",
      "role": "Business Development Manager",
      "share": "40%",
      "n": 2,
      "description": "Prioritise family stability and financial security; delegative but informed decision-makers; ages 42-42."
    }
  ],
  "screening": {
    "question_id": "q1",
    "question": "Which of the following best describes your relationship with digital banking or neobank services?",
    "qualified": 5,
    "distribution": {
      "I use traditional banking but am open to digital alternatives": 2,
      "I currently use a digital bank or neobank": 3
    }
  },
  "exec_summary": "NovaBank's campaign drove a +2.5-point lift in likelihood to recommend (exposed mean 7.0 vs. control mean 4.5, significant at 95%), representing a 55.6% relative increase and the sole statistically significant signal in this study. This advocacy gain was the only measurable lift across the entire funnel, 12 other questions were unevaluable due to data limitations, meaning recommendation intent is currently the campaign's single proven output. Given the directional nature of this n=5 sample, these results cannot be generalized with certainty, but the NPS signal is strong enough to warrant scaling the study to a larger sample to validate funnel-wide impact, particularly at awareness and consideration stages where data was insufficient to produce lift estimates.",
  "survey": [
    {
      "number": 1,
      "id": "q1",
      "text": "Which of the following best describes your relationship with digital banking or neobank services?",
      "type": "single",
      "renderer": "screener",
      "renderer_label": "screener",
      "options": [
        "I currently use a digital bank or neobank",
        "I am considering switching to a digital bank or neobank",
        "I use traditional banking but am open to digital alternatives",
        "I have no interest in digital banking"
      ],
      "isScreening": true,
      "data": {
        "distribution": {
          "I use traditional banking but am open to digital alternatives": 2,
          "I currently use a digital bank or neobank": 3
        },
        "n": 5
      },
      "insight": "3 of 5 respondents are current digital/neobank users, with the remaining 2 open to switching, suggesting this directional sample skews toward digital banking receptivity."
    },
    {
      "number": 2,
      "id": "q2",
      "text": "In your own words, which digital banks or neobanks have you seen or heard advertising for recently in the UAE?",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "I've seen NovaBank ads on Instagram and YouTube recently, and I think I've also noticed Wio Bank and Liv. by Emirates NBD around, but NovaBank stands out because of the transparency messaging about no hidden fees.",
          "I have seen a few ads, but honestly I don't remember the names clearly. Maybe something on LinkedIn a couple of weeks ago when I was looking at finance tools. There are definitely some apps popping up in the feeds, but I don't retain them unless they solve a specific problem for me.",
          "I've seen NovaBank advertised on Instagram recently. There's also been Liv. by Emirates NBD and Wio Bank showing up in my feed, but honestly, the names blend together sometimes. NovaBank's ad stuck with me because of the blue and white design and the message about instant transfers."
        ],
        "n": 5
      },
      "insight": "All 5 respondents provided open-text recall of digital bank advertising, offering qualitative signals on unaided brand salience in the UAE market."
    },
    {
      "number": 3,
      "id": "q3",
      "text": "Which of the following digital banks or neobanks do you recall seeing or hearing an advertisement for recently? Select all that apply.",
      "type": "multi",
      "renderer": "multi_select",
      "renderer_label": "multi-select",
      "options": [
        "NovaBank",
        "Wio Bank",
        "Zand Bank",
        "Liv. by Emirates NBD",
        "Mashreq Neo",
        "None of the above"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "NovaBank": 3,
          "Wio Bank": 4,
          "Liv. by Emirates NBD": 3,
          "None of the above": 1,
          "Zand Bank": 1
        },
        "n_respondents": 5,
        "n": 5
      },
      "insight": "Wio Bank led aided ad recall at 4 of 5, followed by NovaBank and Liv. by Emirates NBD tied at 3 of 5 each, though with n=5 these figures are directional only."
    },
    {
      "number": 4,
      "id": "q4",
      "text": "Which digital banks or neobanks are you aware of, even if you have not used them? Please type any names that come to mind.",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "NovaBank, Wio Bank, Liv. by Emirates NBD, and Zand Bank. I think there might be others but those are the ones that come to mind from scrolling through Instagram and YouTube.",
          "I know there are digital banks in the UAE market, but I'm not always sure of the exact names. I've heard of some through work conversations and LinkedIn, but I tend to focus on solutions that directly address my needs rather than following every new fintech launch.",
          "NovaBank, Wio Bank, Liv. by Emirates NBD, Mashreq Neo. I know these are around because I see them in ads and my younger colleagues talk about them sometimes. I haven't looked into all of them deeply, but they're on my radar."
        ],
        "n": 5
      },
      "insight": "All 5 respondents were able to name digital banks unprompted, indicating a baseline level of category awareness across this small sample."
    },
    {
      "number": 5,
      "id": "q5",
      "text": "Which of the following digital banks or neobanks are you aware of? Select all that apply.",
      "type": "multi",
      "renderer": "multi_select",
      "renderer_label": "multi-select",
      "options": [
        "NovaBank",
        "Wio Bank",
        "Zand Bank",
        "Liv. by Emirates NBD",
        "Mashreq Neo",
        "None of the above"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "NovaBank": 4,
          "Wio Bank": 4,
          "Zand Bank": 2,
          "Liv. by Emirates NBD": 4,
          "None of the above": 1,
          "Mashreq Neo": 2
        },
        "n_respondents": 5,
        "n": 5
      },
      "insight": "NovaBank, Wio Bank, and Liv. by Emirates NBD each registered awareness with 4 of 5 respondents, tying for the highest aided awareness in this directional sample."
    },
    {
      "number": 6,
      "id": "q6",
      "text": "How familiar are you with NovaBank as a digital banking option in the UAE?",
      "type": "rating",
      "renderer": "scale_1_5_star",
      "renderer_label": "1-5 rating",
      "options": [
        "1 - Not at all familiar",
        "2 - Slightly familiar",
        "3 - Moderately familiar",
        "4 - Very familiar",
        "5 - Extremely familiar"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 5,
        "distribution": {
          "1": 0,
          "2": 2,
          "3": 3,
          "4": 0,
          "5": 0
        },
        "average": 2.6,
        "n": 5,
        "ci_low": 2.12,
        "ci_high": 3.08,
        "stddev": 0.55
      },
      "insight": "NovaBank's average familiarity score of 2.6 out of 5, with all 5 respondents rating it a 2 or 3, points to low-to-moderate familiarity, suggesting the brand has not yet broken through in this sample."
    },
    {
      "number": 7,
      "id": "q7",
      "text": "Overall, how favorable is your impression of NovaBank?",
      "type": "rating",
      "renderer": "scale_1_5_star",
      "renderer_label": "1-5 rating",
      "options": [
        "1 - Very unfavorable",
        "2 - Somewhat unfavorable",
        "3 - Neutral",
        "4 - Somewhat favorable",
        "5 - Very favorable"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 5,
        "distribution": {
          "1": 0,
          "2": 0,
          "3": 2,
          "4": 3,
          "5": 0
        },
        "average": 3.6,
        "n": 5,
        "ci_low": 3.12,
        "ci_high": 4.08,
        "stddev": 0.55
      },
      "insight": "Despite low familiarity, NovaBank's average impression score of 3.6 out of 5, with 3 of 5 rating it a 4, indicates that those who do know the brand hold a moderately favorable view."
    },
    {
      "number": 8,
      "id": "q8",
      "text": "Which of the following messages, if any, do you associate with NovaBank? Select all that apply.",
      "type": "multi",
      "renderer": "multi_select",
      "renderer_label": "multi-select",
      "options": [
        "A modern, fully digital banking experience",
        "Fast and easy account opening with no paperwork",
        "Smart money management tools and insights",
        "Secure and transparent banking with no hidden fees",
        "Designed for the UAE lifestyle and community",
        "None of the above"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Secure and transparent banking with no hidden fees": 3,
          "A modern, fully digital banking experience": 1,
          "Fast and easy account opening with no paperwork": 3,
          "None of the above": 2
        },
        "n_respondents": 5,
        "n": 5
      },
      "insight": "\"Secure and transparent banking with no hidden fees\" and \"Fast and easy account opening with no paperwork\" each resonated with 3 of 5 respondents, while 2 of 5 associated NovaBank with none of the tested messages."
    },
    {
      "number": 9,
      "id": "q9",
      "text": "How likely are you to consider NovaBank as your primary or secondary banking option in the next 3 months?",
      "type": "rating",
      "renderer": "scale_1_5_star",
      "renderer_label": "1-5 rating",
      "options": [
        "1 - Very unlikely",
        "2 - Unlikely",
        "3 - Neutral",
        "4 - Likely",
        "5 - Very likely"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 5,
        "distribution": {
          "1": 0,
          "2": 2,
          "3": 2,
          "4": 1,
          "5": 0
        },
        "average": 2.8,
        "n": 5,
        "ci_low": 2.07,
        "ci_high": 3.53,
        "stddev": 0.84
      },
      "insight": "NovaBank's average consideration score of 2.8 out of 5, with 2 of 5 rating it a 2 and only 1 rating it a 4, suggests limited near-term intent to adopt the brand as a primary or secondary bank."
    },
    {
      "number": 10,
      "id": "q10",
      "text": "How likely are you to open an account with NovaBank in the next 3 months?",
      "type": "rating",
      "renderer": "scale_1_5_star",
      "renderer_label": "1-5 rating",
      "options": [
        "1 - Very unlikely",
        "2 - Unlikely",
        "3 - Neutral",
        "4 - Likely",
        "5 - Very likely"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 5,
        "distribution": {
          "1": 0,
          "2": 4,
          "3": 1,
          "4": 0,
          "5": 0
        },
        "average": 2.2,
        "n": 5,
        "ci_low": 1.81,
        "ci_high": 2.59,
        "stddev": 0.45
      },
      "insight": "Account-opening intent averaged just 2.2 out of 5, with 4 of 5 respondents scoring it a 2, indicating weak conversion likelihood from this directional sample within the next 3 months."
    },
    {
      "number": 11,
      "id": "q11",
      "text": "On a scale of 0 to 10, how likely are you to recommend NovaBank to a friend or colleague in the UAE?",
      "type": "rating",
      "renderer": "scale_0_10",
      "renderer_label": "0-10 scale",
      "options": [
        "0 - Not at all likely",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10 - Extremely likely"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 0,
        "scale_max": 10,
        "distribution": {
          "0": 0,
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 1,
          "5": 1,
          "6": 0,
          "7": 3,
          "8": 0,
          "9": 0,
          "10": 0
        },
        "average": 6,
        "n": 5,
        "ci_low": 4.76,
        "ci_high": 7.24,
        "stddev": 1.41
      },
      "insight": "An average NPS-proxy score of 6.0 out of 10, driven by 3 of 5 respondents scoring 7, places NovaBank in passive territory, with no detractors (scores 0-6 from only 2 respondents at 4 and 5) and no promoters (9-10) in this sample."
    },
    {
      "number": 12,
      "id": "q12",
      "text": "Do you recall seeing a NovaBank advertisement on Instagram recently?",
      "type": "multi",
      "renderer": "multi_select",
      "renderer_label": "multi-select",
      "options": [
        "Yes, I saw a NovaBank ad in my Instagram feed",
        "Yes, I saw a NovaBank ad in Instagram Stories",
        "Yes, I saw a NovaBank ad in Instagram Reels",
        "No, I do not recall seeing a NovaBank ad on Instagram"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Yes, I saw a NovaBank ad in my Instagram feed": 3,
          "No, I do not recall seeing a NovaBank ad on Instagram": 2
        },
        "n_respondents": 5,
        "n": 5
      },
      "insight": "3 of 5 respondents recalled seeing a NovaBank ad on Instagram, making it the strongest-performing channel for ad recall in this directional sample."
    },
    {
      "number": 13,
      "id": "q13",
      "text": "Do you recall seeing a NovaBank advertisement on YouTube recently?",
      "type": "multi",
      "renderer": "multi_select",
      "renderer_label": "multi-select",
      "options": [
        "Yes, I saw a NovaBank skippable video ad on YouTube",
        "Yes, I saw a NovaBank non-skippable video ad on YouTube",
        "Yes, I saw a NovaBank banner or display ad on YouTube",
        "No, I do not recall seeing a NovaBank ad on YouTube"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Yes, I saw a NovaBank skippable video ad on YouTube": 1,
          "No, I do not recall seeing a NovaBank ad on YouTube": 4
        },
        "n_respondents": 5,
        "n": 5
      },
      "insight": "Only 1 of 5 respondents recalled a NovaBank YouTube ad, suggesting significantly lower reach or impact on that platform compared to Instagram in this sample."
    },
    {
      "number": 14,
      "id": "q14",
      "text": "Do you recall seeing a NovaBank advertisement on TikTok recently?",
      "type": "multi",
      "renderer": "multi_select",
      "renderer_label": "multi-select",
      "options": [
        "Yes, I saw a NovaBank in-feed video ad on TikTok",
        "Yes, I saw a NovaBank TopView or splash ad on TikTok",
        "Yes, I saw a NovaBank branded hashtag or effect on TikTok",
        "No, I do not recall seeing a NovaBank ad on TikTok"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "No, I do not recall seeing a NovaBank ad on TikTok": 5
        },
        "n_respondents": 5,
        "n": 5
      },
      "insight": "0 of 5 respondents recalled any NovaBank advertising on TikTok, indicating either no TikTok activity or negligible impact from it in this directional sample."
    }
  ],
  "data_quality_notes": [],
  "methodology_disclaimer": "Results are generated by AI synthetic respondents calibrated to the audience spec. They are directional signal, not a substitute for fielding with real customers, especially at small sample sizes. Combine with real-customer data before making absolute claims."
};

export const BRAND_LIFT: CanonicalReport = RAW;
