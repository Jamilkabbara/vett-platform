import { VsPageTemplate } from '../../components/marketing/VsPageTemplate';
import { RESEARCH_TYPES_LABEL } from '../../utils/siteFacts';
import { SELF_SERVE_FROM, SELF_SERVE_RANGE } from '../../utils/priceCopy';

/**
 * VETT vs traditional research.
 *
 * REWRITTEN 2026-09-14 onto the shared template. This is a category page, not
 * one competitor, so there is no competitor site to source figures from. The
 * previous page published numbers nobody had measured or sourced:
 *   - agency studies "$5,000 - $50,000+" and "4-12 weeks per study";
 *   - "Most teams cut their agency SOW cost roughly in half";
 *   - "Cost goes from $50K to $15K", "Most teams report the second pattern as
 *     the bigger ROI";
 *   - "Several mid-market agencies in MENA, EU, and SEA are using AI-modelled
 *     research"; "we built the API roadmap partly to support it";
 *   - VETT "$9-$299 covers most early-stage needs" and an API promised as on the roadmap.
 * All of it is gone. What is left describes how the two models work, which
 * holds by definition, and states VETT's own facts from the pricing ladder and
 * the product. No agency is named, because nothing here is sourced to one.
 */
export function VsTraditionalPage() {
  return (
    <VsPageTemplate
      competitorName="Traditional Research"
      competitorTagline="A research agency or consultancy runs the study for you: it designs the method, recruits real respondents, fields the survey or interviews, analyses the results and presents them. Priced and scoped per project."
      vettTagline={`Self-serve synthetic-respondent research: you set up the mission, VETT simulates respondents and returns results in minutes. ${RESEARCH_TYPES_LABEL}, ${SELF_SERVE_RANGE} per mission.`}
      slug="/vs/traditional"
      sourceNote="This page compares VETT with a way of buying research, not with one company, so it quotes no agency prices or timelines: those vary by agency and by project, and we have no source that speaks for all of them."
      tldr={[
        'Respondents: an agency study recruits real people. VETT simulates respondents with AI.',
        'Who does the work: an agency designs, fields, analyses and presents the study. With VETT you set up the mission yourself and get a results page and exports.',
        `Price: agency work is scoped and priced per project. VETT publishes its prices: ${SELF_SERVE_RANGE} per mission.`,
        'Speed: VETT returns results in minutes, because there is no recruitment or fieldwork. An agency study includes both.',
        'Method: an agency can design a method around your question. VETT offers a fixed set of research types, most built on a named framework.',
        'Use VETT to explore and narrow a question cheaply; use an agency when the answer must come from real people and stand up to scrutiny.',
      ]}
      whereWeLose="Real respondents, custom method and a person accountable for the answer: an agency recruits real people, designs the study around your question and presents what it means. VETT simulates respondents, offers fixed research types and is self-serve."
      rows={[
        {
          dimension: 'Who answers',
          vett: 'Synthetic personas generated to your audience description',
          competitor: 'Real respondents recruited for the study',
          verdict: 'competitor',
        },
        {
          dimension: 'Who does the work',
          vett: 'You set up the mission; VETT generates the survey, runs it and writes the summary',
          competitor: 'The agency team designs, fields, analyses and presents',
          verdict: 'competitor',
        },
        {
          dimension: 'Method',
          vett: `${RESEARCH_TYPES_LABEL}, including Van Westendorp and Gabor-Granger pricing, MaxDiff and Kano, NPS, segmentation and a brand-lift study`,
          competitor: 'Designed around the question, including methods VETT does not offer, such as conjoint or in-depth interviews',
          verdict: 'competitor',
        },
        {
          dimension: 'Time to results',
          vett: 'Minutes; no recruitment or fieldwork',
          competitor: 'Includes recruitment and fieldwork, so days or weeks depending on the project',
          verdict: 'vett',
        },
        {
          dimension: 'Price',
          vett: `Published: ${SELF_SERVE_RANGE} per mission, paid at checkout`,
          competitor: 'Scoped and quoted per project',
          verdict: 'vett',
        },
        {
          dimension: 'Running it again',
          vett: `Another mission, ${SELF_SERVE_FROM}, whenever you change the question`,
          competitor: 'A new or extended project',
          verdict: 'vett',
        },
        {
          dimension: 'What you receive',
          vett: 'Results page with a written summary, segment breakdowns and confidence intervals; PDF, PowerPoint and Excel exports',
          competitor: 'A report or presentation prepared for your stakeholders',
          verdict: 'tie',
        },
      ]}
      whenToUseVett={`You are still working out what to ask, and want to test several versions of a concept, price or message before committing budget. You need a directional answer in minutes, not a project. You want to arrive at an agency with a sharper brief.`}
      whenToUseCompetitor={`The decision has to rest on real respondents: a launch, a board paper, a regulatory or legal use. You need a method designed around your question, or a hard-to-reach audience recruited properly. You want someone to interpret the results and present them to your stakeholders.`}
      faqs={[
        {
          q: 'Can VETT replace a research agency?',
          a: 'Not for work that has to rest on real respondents, a custom method or an expert interpretation. VETT is useful before that work: to explore a question, test several versions quickly and cheaply, and decide what is worth commissioning.',
        },
        {
          q: 'Is an AI summary the same as an analyst?',
          a: 'No. VETT writes an executive summary, flags contradictions between answers and breaks results down by segment, but no one at VETT interprets your results or presents them to your stakeholders. An agency analyst does both.',
        },
        {
          q: 'How much does an agency study cost compared with VETT?',
          a: `Agency studies are scoped and quoted per project, so there is no single figure to compare against, and we do not publish one. VETT's prices are published: ${SELF_SERVE_RANGE} per mission.`,
        },
        {
          q: 'Are VETT results as reliable as an agency study?',
          a: 'No. VETT results come from simulated respondents and are a directional read. VETT has not published a study comparing its results with real-respondent research. An agency study measures real people.',
        },
        {
          q: 'How do I use both?',
          a: `Run VETT first, ${SELF_SERVE_FROM} a mission, to narrow the question and rule out weak options. Then brief an agency on the questions that still matter, with real respondents answering.`,
        },
        {
          q: 'Where does VETT lose to traditional research?',
          a: 'Real respondents, a method designed for your question, and a person who interprets and presents the results. VETT simulates respondents, offers a fixed set of research types and is self-serve.',
        },
      ]}
    />
  );
}
export default VsTraditionalPage;
