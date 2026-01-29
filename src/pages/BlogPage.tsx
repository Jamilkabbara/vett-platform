import { OverlayPage } from '../components/layout/OverlayPage';
import { Calendar, Clock } from 'lucide-react';

export const BlogPage = () => {
  const articles = [
    {
      title: 'How Gen Z actually feels about AI wearables',
      date: 'Jan 15, 2026',
      readTime: '6 min read',
      excerpt: 'We surveyed 500 Gen Z consumers about AI wearables. The results might surprise you.',
    },
    {
      title: 'Why 90% of SaaS startups fail (Data Study)',
      date: 'Jan 10, 2026',
      readTime: '8 min read',
      excerpt: 'An in-depth analysis of 1,000+ SaaS failures and the patterns that emerged.',
    },
    {
      title: 'The death of the focus group',
      date: 'Jan 5, 2026',
      readTime: '5 min read',
      excerpt: 'Traditional market research is dead. Here\'s what\'s replacing it.',
    },
  ];

  return (
    <OverlayPage>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
          Insights & Research
        </h1>
        <p className="text-white/60 text-xl mb-16">
          Data-driven insights from real humans, not gut feelings.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <div
              key={index}
              className="glass-panel p-8 rounded-3xl hover:border-primary/50 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center gap-4 text-white/40 text-xs font-bold uppercase tracking-wider mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {article.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {article.readTime}
                </div>
              </div>

              <h2 className="text-2xl font-black text-white mb-4 group-hover:text-primary transition-colors">
                {article.title}
              </h2>

              <p className="text-white/60 leading-relaxed">
                {article.excerpt}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-white/40 text-sm">More articles coming soon...</p>
        </div>
      </div>
    </OverlayPage>
  );
};
