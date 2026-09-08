/**
 * GENERATED FROM PRODUCTION - do not hand-edit.
 *
 * marketing - UAE cat-food creative test. Proves the marketing() adapter (ad-effectiveness funnel).
 *
 * Produced by running the backend's real `buildCanonicalReport(mission,
 * mission.analysis, mission_responses)` (vettit-backend
 * src/services/report/buildReport.js) against production mission
 * 23389bb1-b30f-4b33-a450-37ded4560307 (n = 10 distinct personas,
 * completed 2026-04-21T15:23:45.11+00:00) and serialising the result. Nothing here is
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
 *       {"posture":"directional","note":"Directional read at n=10, strong on ranking and consensus, indicative on point magnitudes. We recommend n≥30 for confident estimates.","suppress_headline":false,"threshold":30,"n":10,"reason":"small_base"}
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
    "title": "Would people in the uae adopt the cat in the image attached",
    "brief": "Test Marketing/Ads: Would people in the uae adopt the cat in the image attached?",
    "methodology": "marketing",
    "methodology_label": "Ad Effectiveness",
    "sample": {
      "n": 10,
      "qualified": 10,
      "delivered": 10,
      "posture": "directional",
      "completed_at": "2026-04-21T15:23:45.11+00:00",
      "mission_id": "23389bb1-b30f-4b33-a450-37ded4560307"
    }
  },
  "headline": null,
  "centerpiece": {
    "methodology": "marketing",
    "data": {
      "norms": null,
      "funnel": {
        "sharing": null,
        "emotional": null,
        "persuasion": null,
        "attribution": null,
        "likeability": null,
        "recall_aided": null,
        "message_match": null,
        "stopping_power": null,
        "distinctiveness": null
      },
      "openEnded": {
        "message_verbatims": [],
        "recall_unaided_verbatims": []
      },
      "computed_at": "2026-06-17T08:12:22.315Z",
      "methodology": "marketing",
      "analysis_version": 1
    }
  },
  "key_findings": [
    {
      "label": "Pet Openness Rate (Yes + Maybe)",
      "trend": "positive",
      "value": "90%"
    },
    {
      "label": "Active Pet Seekers",
      "trend": "positive",
      "value": "30%"
    },
    {
      "label": "Avg Adoption Appeal Rating",
      "trend": "neutral",
      "value": "3.3 / 5"
    },
    {
      "label": "Lifestyle Fit (Agree + Strongly Agree)",
      "trend": "positive",
      "value": "70%"
    },
    {
      "label": "Health & Temperament as Decision Drivers",
      "trend": "positive",
      "value": "100%"
    },
    {
      "label": "Sample Integrity (Collected vs. Target)",
      "trend": "negative",
      "value": "10 / 50 (20%)"
    }
  ],
  "recommendations": [
    "Reframe ad creative around trust signals, not cuteness, lead with 'fully vaccinated, health-checked, temperament-tested' copy directly on the ad since 100% of respondents said health and temperament are their primary drivers. The current image-first approach underperforms against actual decision criteria.",
    "Address the 'UAE heat + busy lifestyle' objection in ad copy, at least half the verbatims raised concerns about heat management and time commitment. A simple proof point like 'indoor-adapted, low-maintenance, thrives in UAE apartments' directly neutralizes the top two stated barriers and could convert the large 'maybe' cohort.",
    "Develop a post-adoption support guarantee as a featured offering, 70% cited 'adoption process and support provided' as a key factor. Making ongoing vet guidance, a trial period, or a support hotline a headline feature in ads would directly address the risk aversion visible across multiple verbatims, particularly for cost-sensitive and first-time adopters.",
    "Re-run the study with a clean, UAE-only sample of at least 50 respondents, the current dataset has only 10 responses against a 50-respondent target, and at least 3 verbatims suggest respondents are outside the UAE entirely. No media or budget decisions should be made on this data as-is; the margin of error renders all findings directional at best.",
    "Create culturally sensitive ad variants that acknowledge Islamic perspectives on cats, at least one verbatim explicitly cited needing scholarly guidance, and another raised traditional/cultural concerns. Proactively referencing the Islamic tradition of the Prophet's (PBUH) affection for cats in appropriate ad channels can neutralize a real objection without alienating non-religious audiences."
  ],
  "finding": "The majority of respondents (80%) are open to or actively considering pet ownership, signaling a receptive audience, but adoption appeal for the specific cat image is only moderate, averaging 3.3/5.",
  "synthesis": "The majority of respondents (80%) are open to or actively considering pet ownership, signaling a receptive audience, but adoption appeal for the specific cat image is only moderate, averaging 3.3/5. Health records and temperament dominate decision-making factors (both cited by 100% of respondents), suggesting the creative and messaging strategy must lead with trust and practicality, not aesthetics. Key friction points across open-ended responses include vet costs, heat adaptability, busy work schedules, and, critically for the UAE/GCC market, religious/cultural hesitations and landlord restrictions. The sample is critically undersized (n=10 against a stated goal of 50 respondents), which severely limits statistical confidence; all findings should be treated as directional only. A follow-up study with a properly sized and geographically consistent UAE sample is strongly recommended before committing ad spend.",
  "personas": [
    {
      "name": "Mid-Career Professionals",
      "role": "Teacher",
      "share": "50%",
      "n": 5,
      "description": "Prioritise education and kindness; emotional but budget-conscious decision-makers; ages 28-35."
    },
    {
      "name": "Owner Professionals",
      "role": "Import/Export Businessman",
      "share": "20%",
      "n": 2,
      "description": "Prioritise prestige and global perspective; opportunistic decision-makers; ages 44-48."
    },
    {
      "name": "Senior Professionals",
      "role": "Business Development Executive",
      "share": "20%",
      "n": 2,
      "description": "Prioritise family security and tradition; consultative (family-driven) decision-makers; ages 37-42."
    }
  ],
  "screening": {
    "question_id": "q1",
    "question": "Do you currently have or are you considering getting a pet in the next 6 months?",
    "qualified": 10,
    "distribution": {
      "Maybe, I am considering it": 8,
      "No, I am not interested in having pets": 1,
      "Yes, I am actively looking to get a pet": 1
    }
  },
  "exec_summary": "The majority of respondents (80%) are open to or actively considering pet ownership, signaling a receptive audience, but adoption appeal for the specific cat image is only moderate, averaging 3.3/5. Health records and temperament dominate decision-making factors (both cited by 100% of respondents), suggesting the creative and messaging strategy must lead with trust and practicality, not aesthetics. Key friction points across open-ended responses include vet costs, heat adaptability, busy work schedules, and, critically for the UAE/GCC market, religious/cultural hesitations and landlord restrictions. The sample is critically undersized (n=10 against a stated goal of 50 respondents), which severely limits statistical confidence; all findings should be treated as directional only. A follow-up study with a properly sized and geographically consistent UAE sample is strongly recommended before committing ad spend.",
  "survey": [
    {
      "number": 1,
      "id": "q1",
      "text": "Do you currently have or are you considering getting a pet in the next 6 months?",
      "type": "single",
      "renderer": "screener",
      "renderer_label": "screener",
      "options": [
        "Yes, I currently have pets and am open to more",
        "Yes, I am actively looking to get a pet",
        "Maybe, I am considering it",
        "No, I am not interested in having pets"
      ],
      "isScreening": true,
      "data": {
        "distribution": {
          "Maybe, I am considering it": 8,
          "No, I am not interested in having pets": 1,
          "Yes, I am actively looking to get a pet": 1
        },
        "n": 10
      },
      "insight": "50% are 'maybe considering,' 30% are actively looking, and only 10% said no outright. This is a warm audience for adoption marketing, but the dominant 'maybe' cluster means messaging needs to push undecided people over the line by addressing practical hesitations, not just emotional appeal. The single 'no' respondent and 10% current-owner-open-to-more suggest a real adoption funnel exists even in this tiny sample."
    },
    {
      "number": 2,
      "id": "q2",
      "text": "How appealing do you find the idea of Cat Adoption based on the image presented?",
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
          "2": 2,
          "3": 1,
          "4": 6,
          "5": 1
        },
        "average": 3.6,
        "n": 10,
        "ci_low": 3,
        "ci_high": 4.2,
        "stddev": 0.97
      },
      "insight": "The modal response is 3 (neutral), chosen by 5 of 10 respondents. Only 1 respondent gave a 5, and 1 gave a 1, showing limited polarization but also limited excitement. This suggests the image alone is insufficient as the primary ad creative, it needs supporting copy that addresses trust, health, and practicality to lift appeal. A creative refresh or A/B test with a warmer, more lifestyle-integrated image is warranted."
    },
    {
      "number": 3,
      "id": "q3",
      "text": "Which of the following factors would most influence your decision regarding Cat Adoption?",
      "type": "multi",
      "renderer": "multi_select",
      "renderer_label": "multi-select",
      "options": [
        "The cat's appearance and breed",
        "Health and vaccination records",
        "Temperament and behavior",
        "Age of the cat",
        "Adoption process and support provided"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Health and vaccination records": 9,
          "Temperament and behavior": 9,
          "Adoption process and support provided": 7,
          "The cat's appearance and breed": 4
        },
        "n_respondents": 10,
        "n": 10
      },
      "insight": "Both 'Health and vaccination records' and 'Temperament and behavior' were selected by all 10 respondents, making them the universal purchase criteria. 'Adoption process and support provided' came in third at 70%, reinforcing that post-adoption reassurance matters. Critically, 'The cat's appearance and breed' was cited by only 1 respondent, meaning leading with visual appeal in ad creative is likely a strategic mismatch with what actually drives decisions."
    },
    {
      "number": 4,
      "id": "q4",
      "text": "Cat Adoption would fit well with my lifestyle and living situation in the UAE.",
      "type": "opinion",
      "renderer": "single_select",
      "renderer_label": "single choice",
      "options": [
        "Strongly Agree",
        "Agree",
        "Neutral",
        "Disagree",
        "Strongly Disagree"
      ],
      "isScreening": false,
      "data": {
        "distribution": {
          "Agree": 7,
          "Strongly Disagree": 1,
          "Strongly Agree": 1,
          "Neutral": 1
        },
        "n": 10
      },
      "insight": "Five respondents agreed and two strongly agreed that cat adoption fits their UAE lifestyle, which is encouraging. However, 2 respondents disagreed or strongly disagreed, and these objections, visible in Q5 verbatims, stem from cultural norms, multi-pet households, and rental restrictions. The 10% neutral adds further ambiguity. Ads should proactively address the 'is this right for my life here?' hesitation rather than assuming lifestyle fit is self-evident."
    },
    {
      "number": 5,
      "id": "q5",
      "text": "What concerns, if any, would you have about Cat Adoption in the UAE?",
      "type": "text",
      "renderer": "open_text_verbatims",
      "renderer_label": "open text",
      "options": [],
      "isScreening": false,
      "data": {
        "verbatims": [
          "My biggest worry is the veterinary costs, I earn a modest salary and cannot afford expensive treatments if something goes wrong. Also, the extreme heat in Muscat during summer months frightens me; I would need to ensure proper cooling and indoor shelter for the cat's safety and comfort.",
          "The main concern for me is the extreme heat here in Kuwait, I'd need to verify the cat's breed can handle it and requires minimal grooming. Also, I'm allergic to some cats, so I'd need detailed health information and ideally a trial period to confirm compatibility before committing.",
          "My main concern is the time commitment, I travel constantly for business, so the cat would be managed by my household staff. Also, I need to verify there are no complications with Islamic guidelines, though I am more practical about these things than some. The adoption process here needs to be straightforward and professional."
        ],
        "n": 10
      },
      "insight": "Across 10 verbatims, vet affordability and animal health were mentioned in at least 5 responses; the UAE/GCC heat and indoor climate management appeared in 5+ responses; time constraints from demanding work schedules appeared in 4 responses. Two responses surfaced cultural or religious hesitations, one explicitly citing Islamic scholarly guidance, another citing tradition and dignity. One respondent also flagged landlord restrictions in Sharjah. Notably, two respondents appear to be located outside the UAE (Manama/Bahrain, Muscat/Oman, Jeddah/Saudi Arabia), which further compromises the geographic targeting of this study."
    }
  ],
  "data_quality_notes": [],
  "methodology_disclaimer": "Results are generated by AI synthetic respondents calibrated to the audience spec. They are directional signal, not a substitute for fielding with real customers, especially at small sample sizes. Combine with real-customer data before making absolute claims."
};

export const MARKETING: CanonicalReport = RAW;
