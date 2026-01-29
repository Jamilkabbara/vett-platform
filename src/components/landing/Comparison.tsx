import { CheckCircle } from 'lucide-react';

export const Comparison = () => {
  return (
    <section className="relative z-10 px-6 py-20 md:py-32 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-[2.5rem] opacity-40 hover:opacity-100 transition-opacity">
          <h4 className="text-white/40 font-black uppercase text-xs tracking-widest mb-6">
            The Old Way
          </h4>
          <div className="space-y-1">
            <p className="text-4xl font-black text-white/50 tracking-tighter">$5,000+</p>
            <p className="text-sm font-bold text-white/30">3 Weeks Delivery</p>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-[2.5rem] border-primary/50 bg-primary/10 relative overflow-hidden ring-1 ring-primary/20">
          <div className="absolute top-0 right-0 p-4">
            <CheckCircle className="text-primary w-5 h-5" />
          </div>
          <h4 className="text-primary font-black uppercase text-xs tracking-widest mb-6">
            The VETT Way
          </h4>
          <div className="space-y-1">
            <p className="text-4xl font-black text-white tracking-tighter">From $19</p>
            <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest">
              1 Day Delivery
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
