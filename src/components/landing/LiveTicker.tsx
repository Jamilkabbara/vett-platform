export const LiveTicker = () => {
  const tickerItems = [
    { color: 'bg-neon-lime', text: 'JUST VETTED IN NY: AI Wearable' },
    { color: 'bg-primary', text: 'JUST VETTED IN UAE: Vegan Soda' },
    { color: 'bg-indigo-400', text: 'JUST VETTED IN UK: SaaS for Dentists' },
    { color: 'bg-violet-400', text: 'JUST VETTED IN BERLIN: AI Legal Tool' },
    { color: 'bg-blue-400', text: 'JUST VETTED IN TOKYO: Fintech App' },
    { color: 'bg-green-400', text: 'JUST VETTED IN AUSTIN: Vegan Energy Drink' },
    { color: 'bg-cyan-400', text: 'JUST VETTED IN TORONTO: EdTech Platform' },
    { color: 'bg-purple-400', text: 'JUST VETTED IN DUBAI: Luxury Real Estate AI' },
  ];

  return (
    <div className="relative w-full overflow-hidden bg-white/5 border-y border-white/5 py-4 mb-12 backdrop-blur-sm">
      <div className="flex whitespace-nowrap animate-marquee gap-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-12">
            {tickerItems.map((item, idx) => (
              <span
                key={idx}
                className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3"
              >
                <span className={`w-2 h-2 ${item.color} rounded-full animate-pulse`}></span>
                {item.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
