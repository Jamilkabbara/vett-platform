/**
 * GENERATED FROM PRODUCTION - do not hand-edit.
 *
 * competitor - P47 ride-hailing competitor analysis. Proves the competitor() adapter (share of preference).
 *
 * Produced by running the backend's real `buildCanonicalReport(mission,
 * mission.analysis, mission_responses)` (vettit-backend
 * src/services/report/buildReport.js) against production mission
 * ded496c4-c20f-424e-81ff-f07a396e78d6 (n = 5 distinct personas,
 * completed 2026-06-13T19:37:56.642+00:00) and serialising the result. Nothing here is
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
    "title": "P47, ride-hailing competitor analysis",
    "brief": "Benchmark our ride-hailing brand RideNow against Careem and Uber on reliability, price, and driver quality in the UAE.",
    "methodology": "competitor",
    "methodology_label": "Competitor Analysis",
    "sample": {
      "n": 5,
      "qualified": 5,
      "delivered": 5,
      "posture": "directional",
      "completed_at": "2026-06-13T19:37:56.642+00:00",
      "mission_id": "ded496c4-c20f-424e-81ff-f07a396e78d6"
    }
  },
  "headline": {
    "metric": "Focal brand",
    "value": "RideNow",
    "all": [
      {
        "label": "Focal brand",
        "value": "RideNow"
      },
      {
        "label": "Gap on \"Trustworthy brand, I feel confident using this service\" vs Careem",
        "value": "-100 pts"
      },
      {
        "label": "Gap on \"High-quality drivers, professional, courteous, and safe\" vs Careem",
        "value": "-80 pts"
      },
      {
        "label": "Gap on \"Reliable, rides arrive on time and as expected\" vs Careem",
        "value": "-80 pts"
      }
    ]
  },
  "centerpiece": {
    "methodology": "competitor",
    "data": {
      "n": 5,
      "wom": {
        "base": 5,
        "shares": {
          "No, not at all": {
            "pct": 60,
            "count": 3
          },
          "No, but I've thought about them": {
            "pct": 40,
            "count": 2
          }
        },
        "question_id": "q13"
      },
      "gaps": [
        {
          "gap": -100,
          "attribute": "Trustworthy brand, I feel confident using this service",
          "focal_mean": 0,
          "best_competitor": "Careem",
          "best_competitor_mean": 100
        },
        {
          "gap": -80,
          "attribute": "High-quality drivers, professional, courteous, and safe",
          "focal_mean": 20,
          "best_competitor": "Careem",
          "best_competitor_mean": 100
        },
        {
          "gap": -80,
          "attribute": "Reliable, rides arrive on time and as expected",
          "focal_mean": 20,
          "best_competitor": "Careem",
          "best_competitor_mean": 100
        },
        {
          "gap": -80,
          "attribute": "Wide availability, easy to find a ride whenever needed",
          "focal_mean": 20,
          "best_competitor": "Careem",
          "best_competitor_mean": 100
        },
        {
          "gap": -60,
          "attribute": "Affordable, offers competitive and fair pricing",
          "focal_mean": 0,
          "best_competitor": "Careem",
          "best_competitor_mean": 60
        },
        {
          "gap": -60,
          "attribute": "Safe, makes me feel secure during my journey",
          "focal_mean": 20,
          "best_competitor": "Uber",
          "best_competitor_mean": 80
        },
        {
          "gap": -60,
          "attribute": "Transparent pricing, clear fares with no hidden charges",
          "focal_mean": 0,
          "best_competitor": "Uber",
          "best_competitor_mean": 60
        },
        {
          "gap": -40,
          "attribute": "Easy to use, simple and intuitive app experience",
          "focal_mean": 60,
          "best_competitor": "Careem",
          "best_competitor_mean": 100
        },
        {
          "gap": 0,
          "attribute": "Good customer support, resolves issues quickly",
          "focal_mean": 0,
          "best_competitor": "Careem",
          "best_competitor_mean": 0
        },
        {
          "gap": 0,
          "attribute": "Innovative, regularly introduces useful new features",
          "focal_mean": 0,
          "best_competitor": "Careem",
          "best_competitor_mean": 0
        }
      ],
      "brands": [
        {
          "nps": {
            "base": 5,
            "score": -100,
            "passives_pct": 0,
            "promoters_pct": 0,
            "detractors_pct": 100
          },
          "label": "RideNow",
          "use_pct": {
            "pct": 0,
            "base": 5,
            "count": 0
          },
          "brand_id": "Our Brand",
          "is_focal": true,
          "attributes": {
            "Safe, makes me feel secure during my journey": 20,
            "Good customer support, resolves issues quickly": 0,
            "Reliable, rides arrive on time and as expected": 20,
            "Affordable, offers competitive and fair pricing": 0,
            "Easy to use, simple and intuitive app experience": 60,
            "Innovative, regularly introduces useful new features": 0,
            "Trustworthy brand, I feel confident using this service": 0,
            "Wide availability, easy to find a ride whenever needed": 20,
            "High-quality drivers, professional, courteous, and safe": 20,
            "Transparent pricing, clear fares with no hidden charges": 0
          },
          "awareness_pct": {
            "pct": 100,
            "base": 5,
            "count": 5
          },
          "preference_pct": {
            "pct": 0,
            "base": 5,
            "count": 0
          },
          "attributes_base": 5,
          "consideration_pct": {
            "pct": 60,
            "base": 5,
            "count": 3
          }
        },
        {
          "nps": null,
          "label": "Careem",
          "use_pct": {
            "pct": 20,
            "base": 5,
            "count": 1
          },
          "brand_id": "Careem",
          "is_focal": false,
          "attributes": {
            "Safe, makes me feel secure during my journey": 40,
            "Good customer support, resolves issues quickly": 0,
            "Reliable, rides arrive on time and as expected": 100,
            "Affordable, offers competitive and fair pricing": 60,
            "Easy to use, simple and intuitive app experience": 100,
            "Innovative, regularly introduces useful new features": 0,
            "Trustworthy brand, I feel confident using this service": 100,
            "Wide availability, easy to find a ride whenever needed": 100,
            "High-quality drivers, professional, courteous, and safe": 100,
            "Transparent pricing, clear fares with no hidden charges": 20
          },
          "awareness_pct": {
            "pct": 100,
            "base": 5,
            "count": 5
          },
          "preference_pct": {
            "pct": 20,
            "base": 5,
            "count": 1
          },
          "attributes_base": 5,
          "consideration_pct": {
            "pct": 100,
            "base": 5,
            "count": 5
          }
        },
        {
          "nps": null,
          "label": "Uber",
          "use_pct": {
            "pct": 80,
            "base": 5,
            "count": 4
          },
          "brand_id": "Uber",
          "is_focal": false,
          "attributes": {
            "Safe, makes me feel secure during my journey": 80,
            "Good customer support, resolves issues quickly": 0,
            "Reliable, rides arrive on time and as expected": 80,
            "Affordable, offers competitive and fair pricing": 40,
            "Easy to use, simple and intuitive app experience": 100,
            "Innovative, regularly introduces useful new features": 0,
            "Trustworthy brand, I feel confident using this service": 80,
            "Wide availability, easy to find a ride whenever needed": 100,
            "High-quality drivers, professional, courteous, and safe": 80,
            "Transparent pricing, clear fares with no hidden charges": 60
          },
          "awareness_pct": {
            "pct": 100,
            "base": 5,
            "count": 5
          },
          "preference_pct": {
            "pct": 80,
            "base": 5,
            "count": 4
          },
          "attributes_base": 5,
          "consideration_pct": {
            "pct": 100,
            "base": 5,
            "count": 5
          }
        }
      ],
      "switching": {
        "destinations": {
          "base": 5,
          "shares": {
            "Uber": {
              "pct": 20,
              "count": 1
            },
            "Careem": {
              "pct": 80,
              "count": 4
            }
          }
        },
        "intent_distribution": {
          "base": 5,
          "stats": {
            "n": 5,
            "mean": 2.4,
            "ci_low": 1.9199,
            "stddev": 0.5477,
            "ci_high": 2.8801
          },
          "distribution": {
            "2": 3,
            "3": 2
          }
        }
      },
      "computed_at": "2026-06-17T08:12:08.970Z",
      "focal_brand": "RideNow",
      "methodology": "competitor",
      "analysis_version": 1,
      "share_of_preference": {
        "base": 5,
        "shares": {
          "Uber": {
            "pct": 80,
            "count": 4
          },
          "Careem": {
            "pct": 20,
            "count": 1
          }
        },
        "question_id": "q5"
      }
    }
  },
  "key_findings": [
    {
      "label": "Focal brand",
      "trend": "neutral",
      "value": "RideNow"
    },
    {
      "label": "Gap on \"Trustworthy brand, I feel confident using this service\" vs Careem",
      "trend": "neutral",
      "value": "-100 pts"
    },
    {
      "label": "Gap on \"High-quality drivers, professional, courteous, and safe\" vs Careem",
      "trend": "neutral",
      "value": "-80 pts"
    }
  ],
  "recommendations": [
    "Act on the headline finding (Focal brand: RideNow) and review the full survey below for the supporting detail behind it.",
    "Weigh Gap on \"Trustworthy brand, I feel confident using this service\" vs Careem (-100 pts) in the decision, it is among the strongest signals in this study.",
    "Weigh Gap on \"High-quality drivers, professional, courteous, and safe\" vs Careem (-80 pts) in the decision, it is among the strongest signals in this study.",
    "Weigh Gap on \"Reliable, rides arrive on time and as expected\" vs Careem (-80 pts) in the decision, it is among the strongest signals in this study."
  ],
  "finding": "RideNow faces a critical trust and quality deficit versus Careem, with a -100-point gap on 'Trustworthy brand' and -80-point gaps on driver quality, reliability, and availability, while posting an NPS of -100 (100% detractors) and zero current users in this directional sample (n=5).",
  "synthesis": "RideNow faces a critical trust and quality deficit versus Careem, with a -100-point gap on 'Trustworthy brand' and -80-point gaps on driver quality, reliability, and availability, while posting an NPS of -100 (100% detractors) and zero current users in this directional sample (n=5). Compounding the urgency, 80% of switching intent flows to Careem and 80% of share of preference goes to Uber, leaving RideNow with 0% preference and 0% usage despite 100% aided awareness. Given this is a directional sample of 5 and statistical certainty cannot be assumed, the immediate priority should be a focused intervention on trust and driver quality signals, the attributes with the largest gaps, as closing even partial ground there is a prerequisite before investment in awareness or acquisition will convert.",
  "personas": [
    {
      "name": "Experience-Based Decision-Makers",
      "role": "Sales Manager",
      "share": "60%",
      "n": 3,
      "description": "Prioritise reliability and professionalism; experience-based decision-makers; ages 42-42."
    },
    {
      "name": "Results-Oriented Decision-Makers",
      "role": "Sales Director",
      "share": "40%",
      "n": 2,
      "description": "Prioritise reliability and professionalism; results-oriented decision-makers; ages 42-42."
    }
  ],
  "screening": {
    "question_id": "q1",
    "question": "How often do you use ride-hailing services (e.g., apps that connect you with a driver on demand)?",
    "qualified": 5,
    "distribution": {
      "At least once a month": 5
    }
  },
  "exec_summary": "RideNow faces a critical trust and quality deficit versus Careem, with a -100-point gap on 'Trustworthy brand' and -80-point gaps on driver quality, reliability, and availability, while posting an NPS of -100 (100% detractors) and zero current users in this directional sample (n=5). Compounding the urgency, 80% of switching intent flows to Careem and 80% of share of preference goes to Uber, leaving RideNow with 0% preference and 0% usage despite 100% aided awareness. Given this is a directional sample of 5 and statistical certainty cannot be assumed, the immediate priority should be a focused intervention on trust and driver quality signals, the attributes with the largest gaps, as closing even partial ground there is a prerequisite before investment in awareness or acquisition will convert.",
  "survey": [
    {
      "number": 1,
      "id": "q1",
      "text": "How often do you use ride-hailing services (e.g., apps that connect you with a driver on demand)?",
      "type": "single",
      "renderer": "screener",
      "renderer_label": "screener",
      "options": [
        "At least once a month",
        "Less than once a month",
        "I have never used a ride-hailing service"
      ],
      "isScreening": true,
      "data": {
        "distribution": {
          "At least once a month": 5
        },
        "n": 5
      },
      "insight": "All 5 respondents use ride-hailing at least once a month, confirming this is an active-user sample, findings reflect frequent riders, not casual ones."
    },
    {
      "number": 2,
      "id": "q2",
      "text": "When you think about ride-hailing brands available in the UAE, which ones come to mind? Please list up to 5.",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "Uber, Careem, RideNow, Uber Eats, Talabat",
          "Uber, Careem, RideNow, possibly some smaller local apps I have seen advertised but don't recall the names clearly.",
          "Uber, Careem, RideNow, perhaps Bolt if it's available here, maybe some local options I've heard colleagues mention."
        ],
        "n": 5
      },
      "insight": "5 open-text responses were collected on unaided brand recall; reviewing the verbatims will reveal which brands surface first without prompting, a strong signal of top-of-mind awareness."
    },
    {
      "number": 3,
      "id": "q3",
      "text": "Which of the following ride-hailing brands have you heard of? Select all that apply.",
      "type": "multi",
      "renderer": "multi_select",
      "renderer_label": "multi-select",
      "options": [
        "RideNow",
        "Careem",
        "Uber"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "RideNow": 5,
          "Careem": 5,
          "Uber": 5
        },
        "n_respondents": 5,
        "n": 5
      },
      "insight": "Aided awareness is equal across all three brands, all 5 respondents recognise RideNow, Careem, and Uber, meaning awareness alone is not a differentiator for RideNow."
    },
    {
      "number": 4,
      "id": "q4",
      "text": "Of the ride-hailing brands you have heard of, which would you consider using the next time you need a ride? Select all that apply.",
      "type": "multi",
      "renderer": "multi_select",
      "renderer_label": "multi-select",
      "options": [
        "RideNow",
        "Careem",
        "Uber"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "RideNow": 3,
          "Careem": 5,
          "Uber": 5
        },
        "n_respondents": 5,
        "n": 5
      },
      "insight": "Despite 100% awareness, only 3 of 5 respondents would consider RideNow for their next ride, versus all 5 for both Careem and Uber, a 40% consideration gap that signals RideNow is losing ground between awareness and intent."
    },
    {
      "number": 5,
      "id": "q5",
      "text": "Of the ride-hailing brands you would consider, if you had to choose just ONE, which would you pick?",
      "type": "single",
      "renderer": "single_select",
      "renderer_label": "single choice",
      "options": [
        "RideNow",
        "Careem",
        "Uber"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Uber": 4,
          "Careem": 1
        },
        "n": 5
      },
      "insight": "When forced to pick just one brand, 4 of 5 respondents chose Uber and 1 chose Careem, RideNow received zero first-choice selections, indicating it is not yet a primary option for this group."
    },
    {
      "number": 6,
      "id": "q6",
      "text": "Which of the following ride-hailing brands do you use most often?",
      "type": "single",
      "renderer": "single_select",
      "renderer_label": "single choice",
      "options": [
        "RideNow",
        "Careem",
        "Uber",
        "None of these"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Uber": 4,
          "Careem": 1
        },
        "n": 5
      },
      "insight": "4 of 5 respondents most often use Uber and 1 most often uses Careem, with RideNow holding zero habitual users in this sample."
    },
    {
      "number": 7,
      "id": "q7",
      "text": "How likely are you to recommend RideNow to a friend or colleague? Please rate on a scale from 0 (Not at all likely) to 10 (Extremely likely).",
      "type": "rating",
      "renderer": "scale_0_10",
      "renderer_label": "0-10 scale",
      "options": [
        "0",
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
        "scale_min": 0,
        "scale_max": 10,
        "distribution": {
          "0": 0,
          "1": 0,
          "2": 0,
          "3": 2,
          "4": 1,
          "5": 1,
          "6": 1,
          "7": 0,
          "8": 0,
          "9": 0,
          "10": 0
        },
        "average": 4.2,
        "n": 5,
        "ci_low": 3.06,
        "ci_high": 5.34,
        "stddev": 1.3
      },
      "insight": "RideNow's average recommendation likelihood is 4.2 out of 10, with 2 of 5 respondents scoring as low as 3, pointing to weak advocacy and limited word-of-mouth potential in this group."
    },
    {
      "number": 8,
      "id": "q8",
      "text": "Which of these attributes apply to RideNow? Select all that apply.",
      "type": "multi",
      "renderer": "attribute_battery",
      "renderer_label": "attribute battery",
      "options": [
        "Reliable, rides arrive on time and as expected",
        "Affordable, offers competitive and fair pricing",
        "High-quality drivers, professional, courteous, and safe",
        "Easy to use, simple and intuitive app experience",
        "Wide availability, easy to find a ride whenever needed",
        "Transparent pricing, clear fares with no hidden charges",
        "Safe, makes me feel secure during my journey",
        "Good customer support, resolves issues quickly",
        "Trustworthy brand, I feel confident using this service",
        "Innovative, regularly introduces useful new features"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Easy to use, simple and intuitive app experience": 3,
          "Reliable, rides arrive on time and as expected": 1,
          "High-quality drivers, professional, courteous, and safe": 1,
          "Wide availability, easy to find a ride whenever needed": 1,
          "Safe, makes me feel secure during my journey": 1
        },
        "n_respondents": 5,
        "n": 5,
        "shape": "endorsement"
      },
      "insight": "The strongest attribute linked to RideNow is 'Easy to use,' selected by 3 of 5 respondents; every other attribute, reliability, driver quality, availability, and safety, was each chosen by only 1 respondent, showing a very thin positive perception profile."
    },
    {
      "number": 9,
      "id": "q9",
      "text": "Which of these attributes apply to Careem? Select all that apply.",
      "type": "multi",
      "renderer": "attribute_battery",
      "renderer_label": "attribute battery",
      "options": [
        "Reliable, rides arrive on time and as expected",
        "Affordable, offers competitive and fair pricing",
        "High-quality drivers, professional, courteous, and safe",
        "Easy to use, simple and intuitive app experience",
        "Wide availability, easy to find a ride whenever needed",
        "Transparent pricing, clear fares with no hidden charges",
        "Safe, makes me feel secure during my journey",
        "Good customer support, resolves issues quickly",
        "Trustworthy brand, I feel confident using this service",
        "Innovative, regularly introduces useful new features"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Reliable, rides arrive on time and as expected": 5,
          "Affordable, offers competitive and fair pricing": 3,
          "High-quality drivers, professional, courteous, and safe": 5,
          "Easy to use, simple and intuitive app experience": 5,
          "Wide availability, easy to find a ride whenever needed": 5,
          "Trustworthy brand, I feel confident using this service": 5,
          "Safe, makes me feel secure during my journey": 2,
          "Transparent pricing, clear fares with no hidden charges": 1
        },
        "n_respondents": 5,
        "n": 5,
        "shape": "endorsement"
      },
      "insight": "Careem sweeps five attributes at full 5-of-5 selection, Reliable, High-quality drivers, Easy to use, Wide availability, and Trustworthy brand, painting it as the most comprehensively perceived brand in this sample."
    },
    {
      "number": 10,
      "id": "q10",
      "text": "Which of these attributes apply to Uber? Select all that apply.",
      "type": "multi",
      "renderer": "attribute_battery",
      "renderer_label": "attribute battery",
      "options": [
        "Reliable, rides arrive on time and as expected",
        "Affordable, offers competitive and fair pricing",
        "High-quality drivers, professional, courteous, and safe",
        "Easy to use, simple and intuitive app experience",
        "Wide availability, easy to find a ride whenever needed",
        "Transparent pricing, clear fares with no hidden charges",
        "Safe, makes me feel secure during my journey",
        "Good customer support, resolves issues quickly",
        "Trustworthy brand, I feel confident using this service",
        "Innovative, regularly introduces useful new features"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Reliable, rides arrive on time and as expected": 4,
          "Affordable, offers competitive and fair pricing": 2,
          "High-quality drivers, professional, courteous, and safe": 4,
          "Easy to use, simple and intuitive app experience": 5,
          "Wide availability, easy to find a ride whenever needed": 5,
          "Transparent pricing, clear fares with no hidden charges": 3,
          "Safe, makes me feel secure during my journey": 4,
          "Trustworthy brand, I feel confident using this service": 4
        },
        "n_respondents": 5,
        "n": 5,
        "shape": "endorsement"
      },
      "insight": "Uber is credited with 'Easy to use' and 'Wide availability' by all 5 respondents, and scores 4 of 5 on Reliability, Driver quality, Safety, and Trustworthiness, a strong, broad perception that mirrors its dominant usage share."
    },
    {
      "number": 11,
      "id": "q11",
      "text": "How likely are you to switch from your current ride-hailing brand to a different one in the next 6 months? Please rate on a scale from 1 (Not at all likely) to 5 (Extremely likely).",
      "type": "rating",
      "renderer": "scale_1_5_star",
      "renderer_label": "1-5 rating",
      "options": [
        "1",
        "2",
        "3",
        "4",
        "5"
      ],
      "isScreening": false,
      "data": {
        "scale_min": 1,
        "scale_max": 5,
        "distribution": {
          "1": 0,
          "2": 3,
          "3": 2,
          "4": 0,
          "5": 0
        },
        "average": 2.4,
        "n": 5,
        "ci_low": 1.92,
        "ci_high": 2.88,
        "stddev": 0.55
      },
      "insight": "Switching intent is low: 3 of 5 respondents scored 2 and 2 scored 3 on the 1-5 scale, producing an average of 2.4, suggesting most in this group are unlikely to change brands in the next 6 months."
    },
    {
      "number": 12,
      "id": "q12",
      "text": "If you were to switch ride-hailing brands, which brand would you most likely switch to?",
      "type": "single",
      "renderer": "single_select",
      "renderer_label": "single choice",
      "options": [
        "Careem",
        "Uber"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Careem": 4,
          "Uber": 1
        },
        "n": 5
      },
      "insight": "If respondents did switch, 4 of 5 say they would move to Careem and 1 to Uber, RideNow is not named as a switch destination by anyone in this sample."
    },
    {
      "number": 13,
      "id": "q13",
      "text": "In the past 2 weeks, have you talked about RideNow with friends, family, or colleagues?",
      "type": "single",
      "renderer": "single_select",
      "renderer_label": "single choice",
      "options": [
        "Yes - positively",
        "Yes - negatively",
        "No, but I've thought about them",
        "No, not at all"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "No, not at all": 3,
          "No, but I've thought about them": 2
        },
        "n": 5
      },
      "insight": "None of the 5 respondents have actively talked about RideNow recently: 3 said 'not at all' and 2 said they've thought about it but didn't discuss it, confirming the low advocacy suggested by the 4.2 NPS score."
    }
  ],
  "data_quality_notes": [
    {
      "question_number": 3,
      "question_id": "q3",
      "note": "1 answer value(s) not in the saved option list (RideNow)."
    },
    {
      "question_number": 4,
      "question_id": "q4",
      "note": "1 answer value(s) not in the saved option list (RideNow)."
    }
  ],
  "methodology_disclaimer": "Results are generated by AI synthetic respondents calibrated to the audience spec. They are directional signal, not a substitute for fielding with real customers, especially at small sample sizes. Combine with real-customer data before making absolute claims."
};

export const COMPETITOR: CanonicalReport = RAW;
