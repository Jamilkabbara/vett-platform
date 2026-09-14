/**
 * FAQPage structured data, generated from the same FAQ array the page shows.
 *
 * Rendered as a script element INSIDE the page rather than appended to the
 * document head from an effect. The five bespoke /vs pages used to append it
 * in a useEffect, which only runs in a browser, so the prerendered HTML - what
 * a crawler that does not run JavaScript reads - carried no FAQ schema at all.
 * Rendered here it is part of the server output. schema.org JSON-LD is valid
 * anywhere in the document, not only the head.
 *
 * Built from the visible FAQs, never from separate copy, so the structured
 * data cannot say something the page does not.
 */
export interface FaqItem { q: string; a: string }

export function faqPageSchema(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function FaqJsonLd({ faqs }: { faqs: FaqItem[] }) {
  if (!faqs.length) return null;
  // "<" is escaped so an answer containing "</script>" cannot end the element.
  const json = JSON.stringify(faqPageSchema(faqs)).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
