/**
 * DEV-ONLY preview fixtures for /results-v2.
 *
 * WHY THESE EXIST
 * ---------------
 * /results-v2 reads the real canonical report from
 * `GET /api/results/:missionId/report`, exactly like the live page. That
 * endpoint is behind the backend's `authenticate` middleware and needs a
 * Supabase session, which a local checkout with no `.env` does not have.
 *
 * So these fixtures let the page be rendered and screenshotted locally.
 * They are NOT invented: every question, distribution, insight, theme,
 * recommendation, synthesis and analysis block below was read out of the
 * production `missions` table (rows 3fc15087, 5a07eaf8, 34c57e35) and
 * reshaped into the canonical-report envelope that `buildReport` produces
 * on the server. Bulk that the page does not read (raw verbatims, persona
 * rows, segment options) is dropped.
 *
 * This module is behind `import.meta.env.DEV` and is loaded with a dynamic
 * `import()`, so it lands in its own chunk that production never requests.
 *
 * Reached at /results-v2/<missionId>?fixture=1 in a dev server.
 */
import type { CanonicalReport, CanonicalSurveyQuestion } from '../../results/report/useCanonicalReport';

type Slim = {
  id: string;
  title: string;
  brief: string;
  methodology: string;
  methodology_label: string;
  n: number;
  completed_at: string;
  synthesis: string;
  recommendations: string[];
  key_findings: Array<{ label: string; value: string }>;
  analysis: Record<string, unknown>;
  questions: Array<{
    id: string;
    text: string;
    type: 'single' | 'multi' | 'rating' | 'text';
    screener?: boolean;
    insight?: string;
    dist?: Record<string, number>;
    n?: number;
    themes?: Array<{ label: string; count: number; pct: number; sentiment: string; quotes: string[] }>;
    themeN?: number;
  }>;
};

const RENDERER: Record<string, [string, string]> = {
  single: ['single_choice', 'Single choice'],
  multi: ['multi_select', 'Multi select'],
  rating: ['scale', 'Rating scale'],
  text: ['open_text_verbatims', 'Open text'],
};

function toReport(s: Slim): CanonicalReport {
  const survey: CanonicalSurveyQuestion[] = s.questions.map((q, i) => {
    const screener = q.screener === true;
    const [renderer, label] = RENDERER[q.type];
    const data: Record<string, unknown> = { n: q.n ?? s.n, n_respondents: q.n ?? s.n };
    if (q.dist) data.distribution = q.dist;
    if (q.type === 'rating' && q.dist) {
      const keys = Object.keys(q.dist).map(Number).filter(Number.isFinite);
      data.scale_min = Math.min(...keys);
      data.scale_max = Math.max(...keys);
    }
    if (q.themes) {
      data.themes = q.themes;
      data.n = q.themeN ?? q.themes.length;
    }
    return {
      number: i + 1,
      id: q.id,
      text: q.text,
      type: q.type,
      renderer: screener ? 'screener' : renderer,
      renderer_label: screener ? 'Screener' : label,
      options: q.dist ? Object.keys(q.dist) : [],
      isScreening: screener,
      insight: q.insight ?? null,
      data,
    };
  });

  const screener = s.questions.find((q) => q.screener);
  return {
    schema_version: 1,
    header: {
      title: s.title,
      brief: s.brief,
      methodology: s.methodology,
      methodology_label: s.methodology_label,
      sample: {
        n: s.n,
        qualified: s.n,
        delivered: s.n,
        posture: s.n >= 30 ? 'indicative' : 'directional',
        completed_at: s.completed_at,
        mission_id: s.id,
      },
    },
    headline: null,
    centerpiece: { methodology: s.methodology, data: s.analysis },
    key_findings: s.key_findings,
    recommendations: s.recommendations,
    exec_summary: s.synthesis,
    finding: null,
    synthesis: s.synthesis,
    screening: screener
      ? {
          question_id: screener.id,
          question: screener.text,
          qualified: s.n,
          distribution: screener.dist ?? {},
        }
      : null,
    personas: [],
    survey,
    data_quality_notes: [],
    methodology_disclaimer:
      'Respondents are AI-simulated personas built to match the screener specification. Read ranking and consensus as the strongest signal; treat point magnitudes as indicative.',
  };
}

/* ── 3fc15087 · market_entry · n = 80 ────────────────────────────────── */

const MARKET_ENTRY: Slim = {
  id: '3fc15087-1432-468e-bc97-3b2776cccb88',
  title: '[UN-GATE TEST] market_entry — Premium Plant-Based Ready-Meals',
  brief:
    'Validate demand for a premium chilled plant-based ready-meal line as we consider entering Saudi Arabia and Egypt. We currently sell only in the UAE and want to know appeal, purchase intent, willingness to pay, and the local barriers + competitors in each new market.',
  methodology: 'market_entry',
  methodology_label: 'Market Entry',
  n: 80,
  completed_at: '2026-08-25T12:34:39.562+00:00',
  synthesis:
    "Saudi Arabia is the clear market to enter first, scoring a demand index of 62/100 and purchase intent of 82.5%, well ahead of Egypt's 51/100 demand index and 67.5% intent. The top barrier in both markets is distrust of plant-based ingredients or unfamiliar food technology (70% in SA, 87.5% in EG), and 82.5% of SA respondents also flagged halal certification uncertainty as a concern. Pricing headroom exists in SA at SAR 29-38 per meal, with international brands via Carrefour, Lulu Hypermarket, and Noon already occupying 75% mindshare as the competitive benchmark. Addressing halal credentialing and ingredient trust before launch will be decisive for converting high intent into actual sales.",
  key_findings: [
    { label: 'SA Demand Index', value: '62' },
    { label: 'SA Purchase Intent', value: '82.5%' },
    { label: 'Top Adoption Barrier (SA): Halal Certification Uncertainty', value: '82.5%' },
  ],
  recommendations: [
    'Lead all SA marketing and packaging with prominent, third-party halal certification, targeting the 82.5% of SA respondents who cited halal compliance uncertainty as a barrier before any other concern is addressed.',
    'Build an ingredient-transparency campaign specifically countering distrust of plant-based technology, which 70% of SA respondents and 87.5% of EG respondents flagged, to protect conversion rates in the primary market and lay groundwork if Egypt is revisited.',
    'Prioritise distribution through Carrefour, Lulu Hypermarket, and Noon, where 75% of SA respondents already source competing products, and price within the SAR 29-38 willingness-to-pay range to stay competitive against established international brands.',
  ],
  analysis: {
    n: 80,
    methodology: 'market_entry',
    recommended_market: 'SA',
    best_demand_index: 62,
    top_barrier: 'Lack of trust in plant-based ingredients or unfamiliar food technology',
    markets: [
      {
        n: 40,
        market: 'SA',
        signal: 'go',
        wtp: 'SAR 29–38',
        appeal_mean: 4.88,
        demand_index: 62,
        purchase_intent_pct: 82.5,
        directional: false,
        barriers: [
          { pct: 82.5, label: 'Uncertainty about halal certification or religious compliance' },
          { pct: 70, label: 'Lack of trust in plant-based ingredients or unfamiliar food technology' },
          { pct: 67.5, label: 'Low awareness of the brand — I have never heard of it before' },
          { pct: 55, label: 'Limited availability in local supermarkets or online delivery platforms' },
          { pct: 47.5, label: 'Concerns about nutritional adequacy compared to meat-based meals' },
          { pct: 35, label: 'Cultural preference for home-cooked or traditionally prepared meals' },
        ],
      },
      {
        n: 40,
        market: 'EG',
        signal: 'caution',
        wtp: 'EGP 151–200 per meal (premium)',
        appeal_mean: 4.23,
        demand_index: 51,
        purchase_intent_pct: 67.5,
        directional: false,
        barriers: [
          { pct: 87.5, label: 'Lack of trust in plant-based ingredients or unfamiliar food technology' },
          { pct: 62.5, label: 'Uncertainty about halal certification or religious compliance' },
          { pct: 60, label: 'Low awareness of the brand — I have never heard of it before' },
          { pct: 60, label: 'Concerns about nutritional adequacy compared to meat-based meals' },
          { pct: 50, label: 'Price is too high relative to local income levels' },
          { pct: 47.5, label: 'Limited availability in local supermarkets or online delivery platforms' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'q1',
      screener: true,
      type: 'single',
      text: 'In the past 3 months, have you purchased any chilled or refrigerated ready-meals, meal kits, or prepared foods from a supermarket or online grocery in Saudi Arabia or Egypt?',
      insight:
        'Half the sample (40 out of 80 respondents) already buys chilled or refrigerated ready-meals, confirming a proven purchase habit in the target category before any new product is introduced.',
      dist: {
        'Yes, I have purchased chilled ready-meals or meal kits': 40,
        'No, I have not purchased these products': 40,
      },
    },
    {
      id: 'q2',
      type: 'rating',
      text: 'How appealing do you find the idea of Premium Plant-Based Ready-Meals — restaurant-quality, plant-based meals that are chilled and ready to heat in 15 minutes — available in your local market?',
      insight:
        'Average appeal sits at 5.26 out of 10, and the distribution is skewed: 38 respondents scored the concept 6 or above, while 39 scored it 4 or below, meaning the concept polarises opinion more than it broadly excites.',
      dist: { '1': 1, '2': 9, '3': 9, '4': 20, '5': 1 },
    },
    {
      id: 'q3',
      type: 'single',
      text: 'If Premium Plant-Based Ready-Meals were available in Saudi Arabia and Egypt at premium supermarkets and online grocery platforms, how likely would you be to buy them?',
      insight:
        '57% say they probably would buy, and a further 3% say they definitely would buy, giving a combined positive intent of 60%, while only 19 respondents (roughly 24%) lean toward not buying.',
      dist: {
        'Probably would buy': 57,
        'Probably would NOT buy': 16,
        'Definitely would buy': 3,
        'Definitely would NOT buy': 3,
        'Might or might not': 1,
      },
    },
    {
      id: 'q4',
      type: 'single',
      text: 'What is the maximum price you would be willing to pay per serving of a Premium Plant-Based Ready-Meal? (Select the highest price you would consider acceptable — answer in your local currency.)',
      insight:
        '35% of respondents accept the premium price band (SAR 29-38 / EGP 151-200), making it the single most chosen tier, and stacking the super-premium band (10%) on top means 45% of buyers are willing to pay SAR 29 or more per serving.',
      dist: {
        'SAR 29–38 / EGP 151–200 per meal (premium)': 34,
        'SAR 21–28 / EGP 111–150 per meal (mid-range)': 22,
        'SAR 39–50 / EGP 201–270 per meal (super-premium)': 10,
        'SAR 15–20 / EGP 80–110 per meal (budget tier)': 8,
        'I would not pay for this product at any price': 4,
        'EGP 151–200 per meal (premium)': 1,
        'EGP 111–150 per meal (mid-range)': 1,
      },
    },
    {
      id: 'q5',
      type: 'multi',
      text: 'What factors would make you hesitate before buying Premium Plant-Based Ready-Meals in Saudi Arabia or Egypt? Select all that apply.',
      insight:
        'Distrust of plant-based ingredients or unfamiliar food technology is the top barrier, cited by 63 respondents, followed closely by uncertainty about halal certification (59) and low brand awareness (51), signalling that trust and compliance credentials must be established before price or availability concerns are addressed.',
      dist: {
        'Lack of trust in plant-based ingredients or unfamiliar food technology': 63,
        'Uncertainty about halal certification or religious compliance': 58,
        'Low awareness of the brand — I have never heard of it before': 51,
        'Concerns about nutritional adequacy compared to meat-based meals': 43,
        'Limited availability in local supermarkets or online delivery platforms': 41,
        'Price is too high relative to local income levels': 32,
        'Cultural preference for home-cooked or traditionally prepared meals': 30,
        'Strong existing local competition offering similar or cheaper options': 22,
        'Shorter shelf life of chilled products compared to frozen alternatives': 5,
        'Halal certification or religious compliance': 1,
        'Brand awareness — I have never heard of it before': 1,
        "Concerns about Egypt's food system and transparency": 1,
      },
    },
    {
      id: 'q6',
      type: 'multi',
      text: 'Which of the following chilled ready-meal, plant-based food, or premium prepared-food brands do you currently use or buy in Saudi Arabia or Egypt? Select all that apply.',
      insight:
        'International brands bought via Carrefour, Lulu, or Noon lead with 50 mentions, and local delivery apps (HungerStation, Talabat, Otlob) follow at 44, showing that the most-used purchase channels are already online or large-format retail, which aligns with the proposed distribution strategy.',
      dist: {
        'International brands via Carrefour / Lulu Hypermarket / Noon': 50,
        'Local restaurant meal-delivery services (e.g. HungerStation, Talabat, Otlob)': 44,
        'Puck / Arla chilled food products (Saudi Arabia/Egypt)': 33,
        'None of the above — I do not currently buy these types of products': 25,
        'Plant Club (Saudi Arabia)': 5,
        'Domty prepared foods (Egypt)': 2,
        'Sunbulah Group ready meals (Saudi Arabia)': 2,
        'Kiri / Almarai chilled meal ranges (Saudi Arabia)': 2,
        'Almarai chilled meal ranges (Saudi Arabia)': 1,
        'Juhayna Food Industries chilled products (Egypt)': 1,
      },
    },
    {
      id: 'q7',
      type: 'text',
      text: 'In your own words, what changes or adaptations would Premium Plant-Based Ready-Meals need to make — in terms of flavours, ingredients, halal standards, packaging, portion sizes, or anything else — to feel like the right fit for Saudi Arabia or Egypt?',
      insight:
        'Thirty open-text verbatims were collected asking respondents what flavour, ingredient, halal, packaging, or portion-size changes the product would need to feel right for Saudi Arabia or Egypt.',
      themeN: 30,
      themes: [
        {
          label: 'Halal Certification & Trust',
          count: 27,
          pct: 90,
          sentiment: 'neutral',
          quotes: [
            'The meals must have clear halal certification from a recognized body, not just assumed. The portions and flavour profiles need to feel hearty and satisfying enough for my children, not like token vegetable sides.',
          ],
        },
        {
          label: 'Local & Authentic Flavours',
          count: 26,
          pct: 87,
          sentiment: 'neutral',
          quotes: [
            'The meals need to have local, recognizable flavours like Mediterranean and Middle Eastern options that feel authentic to Egypt, not just generic international plant-based food.',
          ],
        },
        {
          label: 'Portion Size & Satiety',
          count: 22,
          pct: 73,
          sentiment: 'negative',
          quotes: [
            "Make portions big enough that a man feels satisfied, not like he ate a side dish. And honestly, prove to me it has real nutrition and isn't just marketing.",
          ],
        },
        {
          label: 'Nutritional Transparency & Labelling',
          count: 16,
          pct: 53,
          sentiment: 'neutral',
          quotes: [
            "The meals need detailed macro breakdowns on the label and packaging, not just calories. I'd want to see complete amino acid profiles and bioavailability data for plant proteins since that's what concerns me most.",
          ],
        },
        {
          label: 'Pricing & Affordability',
          count: 11,
          pct: 37,
          sentiment: 'negative',
          quotes: [
            "The price has to come down closer to EGP 120-140 or customers won't see it as real value, and portion sizes should feel substantial, like a proper meal.",
          ],
        },
        {
          label: 'Distrust of Ready-Meals Generally',
          count: 3,
          pct: 10,
          sentiment: 'negative',
          quotes: [
            'Ready-meals are not real food. I cook fresh every day for myself and my daughters because that is how you feed a family properly and know what you are eating. Your product is too artificial and too expensive for someone like me on a pension.',
          ],
        },
      ],
    },
  ],
};

/* ── 5a07eaf8 · audience_profiling · n = 60 ──────────────────────────── */

const AUDIENCE: Slim = {
  id: '5a07eaf8-a713-4411-aa5b-ae41b628f0ff',
  title: "[UN-GATE TEST] audience_profiling — Men's Grooming Subscription UAE",
  brief:
    'Profile and segment the audience for a mid-market men’s grooming subscription in the UAE so we can sharpen targeting and messaging. We want the distinct attitudinal + behavioural segments, their sizes, and what defines each.',
  methodology: 'audience_profiling',
  methodology_label: 'Audience Profiling',
  n: 60,
  completed_at: '2026-08-31T11:42:57.694+00:00',
  synthesis:
    "Status-seekers and early adopters make up 71.7% of the UAE men's grooming subscription audience, making them the clear priority target. This segment scores 4.21 on status orientation and 3.7 on novelty-seeking, spends AED 150-499 per month (34.8837% in each bracket), and purchases at least once a month 93.0233% of the time. YouTube reaches 100% of this segment and Instagram reaches 90.6977%, giving subscription brands a concentrated digital channel to convert high-frequency, premium-minded buyers.",
  key_findings: [
    { label: 'Primary segment size (Status-seekers, early adopters)', value: '71.7% (n=43)' },
    { label: 'Convenience of home delivery as a purchase driver (primary segment)', value: '74.4186%' },
    { label: 'Understated pragmatists citing affordable pricing as top factor', value: '94.1176%' },
  ],
  recommendations: [
    "Lead subscription acquisition campaigns on YouTube and Instagram, where the primary segment reaches 100% and 90.6977% respectively, using messaging that combines product quality (81.3953% priority) with convenience of auto-replenishment (74.4186% priority) to match the segment's top two stated needs.",
    'Price the hero subscription tier at AED 150-499 per month. Within the primary segment, 34.8837% already spend AED 150-299 and another 34.8837% spend AED 300-499, so a tiered structure anchored in this range aligns with existing spend behaviour rather than requiring a behaviour change.',
    'Develop a separate value-positioned entry tier or one-off bundle for the Understated pragmatists (28.3%, n=17), where 94.1176% rank affordable pricing as their top factor and 58.8235% purchase only every 4-6 months. A low-commitment, price-led offer could increase their purchase frequency without cannibalising premium positioning with the primary segment.',
  ],
  analysis: {
    n: 60,
    posture: 'segmented',
    methodology: 'audience_profiling',
    key_dimension: 'status',
    segment_count: 2,
    primary_segment_id: 'seg_1',
    dimensions: [
      { key: 'price_sensitivity', label: 'Price sensitivity' },
      { key: 'novelty_seeking', label: 'Novelty-seeking' },
      { key: 'brand_loyalty', label: 'Brand loyalty' },
      { key: 'convenience', label: 'Convenience orientation' },
      { key: 'status', label: 'Status orientation' },
      { key: 'sustainability', label: 'Sustainability' },
    ],
    segments: [
      {
        id: 'seg_1',
        n: 43,
        name: 'Status-seekers · early adopters',
        size_pct: 71.7,
        is_primary: true,
        coords: { x: 0.71, y: 0.61, x_dim: 'status', y_dim: 'novelty_seeking' },
        signature: [
          { label: 'Status orientation', dimension: 'status', mean: 4.21, delta: 0.71 },
          { label: 'Novelty-seeking', dimension: 'novelty_seeking', mean: 3.7, delta: 0.62 },
          { label: 'Price sensitivity', dimension: 'price_sensitivity', mean: 2.44, delta: -0.49 },
        ],
      },
      {
        id: 'seg_2',
        n: 17,
        name: 'Understated · pragmatists',
        size_pct: 28.3,
        is_primary: false,
        coords: { x: -1.79, y: -1.55, x_dim: 'status', y_dim: 'novelty_seeking' },
        signature: [
          { label: 'Status orientation', dimension: 'status', mean: 1.71, delta: -1.79 },
          { label: 'Novelty-seeking', dimension: 'novelty_seeking', mean: 1.53, delta: -1.55 },
          { label: 'Price sensitivity', dimension: 'price_sensitivity', mean: 4.18, delta: 1.25 },
        ],
      },
    ],
    aggregate: {
      attitudes: {
        status: { n: 60, mean: 3.5, label: 'Status orientation' },
        convenience: { n: 60, mean: 3.8, label: 'Convenience orientation' },
        brand_loyalty: { n: 60, mean: 3.83, label: 'Brand loyalty' },
        sustainability: { n: 60, mean: 2.58, label: 'Sustainability' },
        novelty_seeking: { n: 60, mean: 3.08, label: 'Novelty-seeking' },
        price_sensitivity: { n: 60, mean: 2.93, label: 'Price sensitivity' },
      },
    },
  },
  questions: [
    {
      id: 'q1',
      screener: true,
      type: 'single',
      text: "Do you currently purchase or use any men's grooming products (such as skincare, haircare, shaving, or beard products) in the UAE?",
      insight:
        'Nearly all respondents are active grooming buyers: 51 out of 60 purchase regularly, with a further 9 buying occasionally, meaning the entire sample is a live market.',
      dist: { "Yes, I regularly buy and use men's grooming products": 51, 'Yes, but only occasionally': 9 },
    },
    {
      id: 'q2',
      type: 'rating',
      text: "When buying men's grooming products, I always look for the best price or the most affordable deal available.",
      insight:
        'Price sensitivity is weak. The average score is 2.93 out of 5, and 27 respondents scored this statement a 2, showing that most men in this sample do not lead with price when buying grooming products.',
      dist: { '1': 3, '2': 27, '3': 12, '4': 7, '5': 11 },
    },
    {
      id: 'q3',
      type: 'rating',
      text: "I enjoy trying new men's grooming products and brands before most people around me do.",
      insight:
        'This audience leans toward early adoption. The average of 3.08 out of 5 is pulled up by 27 respondents scoring 4 or 5, meaning nearly half are open to trying new brands before their peers.',
      dist: { '1': 12, '2': 8, '3': 13, '4': 17, '5': 10 },
    },
    {
      id: 'q4',
      type: 'rating',
      text: "Once I find a men's grooming brand I trust, I stick with it and rarely switch.",
      insight:
        'Brand loyalty is the strongest attitudinal signal in the survey. The average is 3.83 out of 5, with 44 respondents scoring 4 or 5 and zero scoring 1, confirming that once trust is established, most men stay put.',
      dist: { '1': 0, '2': 12, '3': 4, '4': 26, '5': 18 },
    },
    {
      id: 'q5',
      type: 'rating',
      text: 'Having my grooming products delivered conveniently to my door matters more to me than getting the lowest price.',
      insight:
        'Delivery convenience outweighs price for the majority. The average is 3.80 out of 5, and 44 respondents scored 4 or 5, with nobody scoring 1, pointing to strong appetite for subscription or auto-replenishment models.',
      dist: { '1': 0, '2': 8, '3': 8, '4': 32, '5': 12 },
    },
    {
      id: 'q6',
      type: 'rating',
      text: 'The grooming brands I use reflect my personal image and say something meaningful about who I am.',
      insight:
        'Grooming brands carry real identity weight for this group. The average is 3.50 out of 5, and 35 respondents scored 4 or 5, suggesting that brand image and self-expression are meaningful purchase drivers.',
      dist: { '1': 6, '2': 13, '3': 6, '4': 15, '5': 20 },
    },
    {
      id: 'q7',
      type: 'rating',
      text: "I prefer men's grooming brands that are ethical, cruelty-free, or environmentally sustainable.",
      insight:
        'Sustainability is a low priority. The average is only 2.58 out of 5, and all 60 respondents scored between 2 and 3, with nobody reaching 4 or 5, meaning ethical or eco credentials are unlikely to drive purchase decisions in this sample.',
      dist: { '1': 0, '2': 29, '3': 27, '4': 4, '5': 0 },
    },
    {
      id: 'q8',
      type: 'single',
      text: "How often do you purchase men's grooming products (in-store or online)?",
      insight:
        'Monthly purchasing is the clear norm: 40 out of 60 respondents buy about once a month, making this a high-frequency, recurring-spend category well suited to a subscription proposition.',
      dist: {
        'About once a month': 40,
        'Every 4–6 months': 12,
        'More than once a month': 7,
        'Every 2–3 months': 1,
      },
    },
    {
      id: 'q9',
      type: 'single',
      text: "Approximately how much do you typically spend on men's grooming products per month (in AED)?",
      insight:
        'Spending is spread across a wide range, but the AED 150-299 band leads with 20 respondents, followed by AED 50-149 (16) and AED 300-499 (15), placing the typical monthly outlay somewhere in the AED 150-499 corridor.',
      dist: {
        'AED 150–299': 18,
        'AED 50–149': 16,
        'AED 300–499': 15,
        'AED 500 or more': 6,
        'Less than AED 50': 3,
        'AED 150-299': 2,
      },
    },
    {
      id: 'q10',
      type: 'multi',
      text: "Which of the following men's grooming brands do you currently use or have used in the past 6 months? (Select all that apply)",
      insight:
        "Nivea Men is the most used brand (43 respondents), followed by Dove Men+Care (36), Gillette (31), and Kiehl's Men's range (26), confirming that mass-market and accessible premium names dominate current usage.",
      dist: {
        'Nivea Men': 43,
        'Dove Men+Care': 36,
        Gillette: 31,
        "Kiehl's (Men's range)": 26,
        "L'Oréal Men Expert": 22,
        'American Crew': 21,
        'A local or regional brand': 21,
        'Jack Black': 16,
        'Baxter of California': 11,
        'Bulldog Skincare': 9,
        "Rituals (Men's range)": 5,
        'None of the above': 2,
      },
    },
    {
      id: 'q11',
      type: 'multi',
      text: 'Which of the following platforms or channels do you use regularly for entertainment, news, or social content? (Select all that apply)',
      insight:
        'YouTube is the dominant platform (58 respondents), followed by Instagram (41) and online news portals (40), while linear TV and niche platforms each reach fewer than 20, pointing clearly to where this audience spends its media time.',
      dist: {
        YouTube: 58,
        Instagram: 41,
        'Online news portals (e.g., Gulf News, Khaleej Times)': 40,
        Facebook: 20,
        TikTok: 19,
        'Dubai TV / Abu Dhabi TV (linear)': 10,
        Snapchat: 8,
        'X (Twitter)': 8,
        'MBC TV (linear)': 7,
        Netflix: 5,
        'Shahid (MBC Group)': 4,
      },
    },
    {
      id: 'q12',
      type: 'multi',
      text: "When choosing men's grooming products or a subscription service, which of the following factors matter most to you? (Select up to 3)",
      insight:
        'Product quality and proven results is the top selection factor by a wide margin (49 respondents), followed by convenience of home delivery and auto-replenishment (38) and trusted brand name (26), confirming that performance and ease beat price and sustainability.',
      dist: {
        'Product quality and proven results': 49,
        'Convenience of home delivery and auto-replenishment': 38,
        'Trusted or well-known brand name': 26,
        'Affordable pricing and good value for money': 22,
        'Ability to discover and try new or exclusive products': 21,
        'Personalised recommendations tailored to my skin or hair type': 17,
        'Natural, organic, or sustainable ingredients': 5,
      },
    },
  ],
};

/* ── 34c57e35 · pricing · n = 5 ──────────────────────────────────────── */

const PRICING: Slim = {
  id: '34c57e35-ffc3-49e0-b802-4b9c5a95e01d',
  title: 'P47 — fitness subscription pricing',
  brief:
    'Find the optimal monthly price for a premium fitness-class subscription in the UAE, using Van Westendorp and Gabor-Granger price sensitivity.',
  methodology: 'pricing',
  methodology_label: 'Pricing Research',
  n: 5,
  completed_at: '2026-06-13T19:37:47.133+00:00',
  synthesis:
    'The Van Westendorp optimal price point for this fitness subscription lands at $95, establishing the floor of an acceptable pricing range that extends to $235 — a $140 span of defensible positioning. The Gabor-Granger model, which optimizes for revenue rather than perception, points lower at $79, where 100% of the directional sample (n=5) indicated willingness to purchase, versus just 40% at $119 and zero demand at $169 and above. The mean WTP ceiling of $296 suggests headroom for premium or tiered offerings, though the wide confidence interval ($153–$439) reflects the small sample. As a directional signal, these findings recommend anchoring launch pricing at $95 to align with perceived value while testing a premium tier in the $180–$235 range, with a larger confirmatory study before committing to final price architecture.',
  key_findings: [
    { label: 'Optimal price (Van Westendorp OPP)', value: '95' },
    { label: 'Acceptable price range', value: '95–235' },
    { label: 'Point of marginal cheapness (PMC)', value: '95' },
  ],
  recommendations: [
    'Act on the headline finding (Optimal price (Van Westendorp OPP): 95) and review the full survey below for the supporting detail behind it.',
    'Weigh Acceptable price range (95–235) in the decision — it is among the strongest signals in this study.',
    'Weigh Point of marginal cheapness (PMC) (95) in the decision — it is among the strongest signals in this study.',
    'Weigh Point of marginal expensiveness (PME) (235) in the decision — it is among the strongest signals in this study.',
    'Weigh Indifference price point (IPP) (180) in the decision — it is among the strongest signals in this study.',
  ],
  analysis: {
    n: 5,
    currency: 'USD',
    methodology: 'pricing',
    acceptable_range: { low: 95, high: 235 },
    wtp_ceiling: { n: 5, mean: 296, ci_low: 152.8261, ci_high: 439.1739, stddev: 163.3401 },
    van_westendorp: { n: 5, points: { ipp: 180, opp: 95, pmc: 95, pme: 235 } },
    gabor_granger: {
      optimal_price: 79,
      ladder: [
        { n: 5, price: 49, demand_pct: 100, revenue_index: 49 },
        { n: 5, price: 79, demand_pct: 100, revenue_index: 79 },
        { n: 5, price: 119, demand_pct: 40, revenue_index: 47.6 },
        { n: 5, price: 169, demand_pct: 0, revenue_index: 0 },
        { n: 5, price: 229, demand_pct: 0, revenue_index: 0 },
      ],
    },
  },
  questions: [
    {
      id: 'q1',
      screener: true,
      type: 'single',
      text: 'Have you purchased or seriously considered purchasing a fitness-class subscription (e.g., gym membership, boutique studio pass, or multi-class package) in the past 12 months?',
      insight:
        'All 5 respondents have purchase intent — 4 already bought a fitness-class subscription in the past 12 months and 1 seriously considered it, signaling a fully purchase-engaged directional sample.',
      dist: { 'Yes, I have purchased one': 4, 'Yes, I have seriously considered but not purchased': 1 },
    },
    {
      id: 'q2',
      type: 'multi',
      text: 'Which of the following best describes how you currently manage your fitness-class needs? (Select all that apply)',
      insight:
        'Respondents actively use multiple purchase channels: 4 of 5 use multi-class bundles or studio memberships AND 4 of 5 also pay for boutique drop-in classes, suggesting overlap and willingness to spend across formats.',
      dist: {
        'Multi-class bundle or studio membership': 4,
        'Boutique studio drop-in classes (pay per class)': 4,
        'I do not currently pay for fitness classes': 1,
      },
    },
    {
      id: 'q7',
      type: 'single',
      text: 'At $49 per month, would you purchase a Premium Fitness Subscription?',
      insight:
        'At $49/month, purchase intent is near-universal — 4 of 5 respondents say they definitely would buy and 1 probably would buy, indicating strong demand at this price point.',
      dist: { 'Definitely would buy': 4, 'Probably would buy': 1 },
    },
    {
      id: 'q8',
      type: 'single',
      text: 'At $79 per month, would you purchase a Premium Fitness Subscription?',
      insight:
        'At $79/month, intent remains high but shifts slightly — 3 of 5 say probably would buy and 2 say definitely would buy, with no negative responses in this directional sample.',
      dist: { 'Probably would buy': 3, 'Definitely would buy': 2 },
    },
    {
      id: 'q9',
      type: 'single',
      text: 'At $119 per month, would you purchase a Premium Fitness Subscription?',
      insight:
        'At $119/month, conviction softens noticeably — 3 of 5 respondents drop to "might buy" while 2 say probably would buy, suggesting $119 sits at the edge of comfortable willingness to pay.',
      dist: { 'Might buy': 3, 'Probably would buy': 2 },
    },
    {
      id: 'q10',
      type: 'single',
      text: 'At $169 per month, would you purchase a Premium Fitness Subscription?',
      insight:
        'At $169/month, hesitation dominates — 3 of 5 respondents still say "might buy" but 2 say probably would NOT buy, marking this as a likely price resistance zone.',
      dist: { 'Might buy': 3, 'Probably would NOT buy': 2 },
    },
    {
      id: 'q11',
      type: 'single',
      text: 'At $229 per month, would you purchase a Premium Fitness Subscription?',
      insight:
        'At $229/month, intent collapses — all 5 respondents express negative intent (3 probably would NOT buy, 2 definitely would NOT buy), making this price a clear ceiling in this sample.',
      dist: { 'Probably would NOT buy': 3, 'Definitely would NOT buy': 2 },
    },
    {
      id: 'q13',
      type: 'rating',
      text: 'If your current fitness solution increased its price by 20%, how likely would you be to switch to a Premium Fitness Subscription?',
      insight:
        'Switching likelihood after a 20% price increase in their current solution averages 3.4 out of 5 across all 5 respondents, with 3 rating it a neutral 3 and 2 rating it a 4, suggesting moderate but not urgent openness to switching.',
      dist: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
    },
  ],
};

const BASE: Record<string, CanonicalReport> = {
  [MARKET_ENTRY.id]: toReport(MARKET_ENTRY),
  [AUDIENCE.id]: toReport(AUDIENCE),
  [PRICING.id]: toReport(PRICING),
};

/**
 * Synthetic id that exercises the statistical gate's hard-suppression branch
 * (`gate.suppress_headline`). No production row in this sample set carries a
 * suppressing gate, so this variant of the pricing mission is the only way to
 * screenshot that path. Reached at /results-v2/gated?fixture=1.
 */
const GATED: CanonicalReport = {
  ...BASE[PRICING.id],
  centerpiece: {
    methodology: 'pricing',
    data: PRICING.analysis,
    gate: {
      posture: 'directional',
      note: 'Small base. Read ranking and consensus as signal, not the point estimate.',
      suppress_headline: true,
      threshold: 30,
      n: 5,
      reason: 'below_threshold',
    },
  },
};

export const FIXTURES: Record<string, CanonicalReport> = { ...BASE, gated: GATED };

export const FIXTURE_IDS = Object.keys(FIXTURES);
