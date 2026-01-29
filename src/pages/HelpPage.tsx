import { OverlayPage } from '../components/layout/OverlayPage';
import { ChevronRight } from 'lucide-react';

export const HelpPage = () => {
  const faqs = [
    {
      category: 'Pricing',
      question: 'How much does a mission cost?',
      answer: 'Mission pricing starts at $99 for 50 responses and scales based on your targeting needs.',
    },
    {
      category: 'Quality',
      question: 'How do you verify humans?',
      answer: 'Every respondent is ID-verified via government databases. We filter out bots, click-farms, and speed-runners using behavioral analysis.',
    },
    {
      category: 'Features',
      question: 'Can I upload images for testing?',
      answer: 'Yes, you can upload up to 4 images per mission for A/B testing visuals, logos, or ad creatives. Each image must be under 2MB and in JPG or PNG format.',
    },
  ];

  const guides = [
    {
      title: 'Writing better questions',
      description: 'Learn how to avoid leading questions to get unbiased truth.',
    },
    {
      title: 'Understanding Sentiment',
      description: "How to read the difference between 'Nice to have' and 'Must have'.",
    },
    {
      title: 'Targeting 101',
      description: 'When to use Gen Pop vs. B2B Founders.',
    },
  ];

  return (
    <OverlayPage>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
          Help Center
        </h1>
        <p className="text-white/60 text-xl mb-16">
          Everything you need to know about running missions.
        </p>

        <div className="mb-16">
          <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="glass-panel p-8 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black uppercase tracking-wider rounded-full">
                    {faq.category}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-3">{faq.question}</h3>
                <p className="text-white/60 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-tight">
            Guides & Tutorials
          </h2>
          <div className="space-y-4">
            {guides.map((guide, index) => (
              <div
                key={index}
                className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div>
                  <h3 className="text-white font-bold group-hover:text-primary transition-colors mb-1">
                    {guide.title}
                  </h3>
                  <p className="text-white/50 text-sm">{guide.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center glass-panel p-12 rounded-3xl">
          <h3 className="text-2xl font-black text-white mb-4">Still have questions?</h3>
          <p className="text-white/60 mb-6">Our team is here to help.</p>
          <a
            href="mailto:support@vettit.ai"
            className="inline-block px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest bg-[#DFFF00] hover:bg-[#E5FF40] text-black shadow-lg shadow-[#DFFF00]/30 hover:shadow-[#DFFF00]/40 transition-all duration-300 hover:scale-105"
          >
            Contact Support
          </a>
        </div>
      </div>
    </OverlayPage>
  );
};
