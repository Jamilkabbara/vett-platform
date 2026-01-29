import { OverlayPage } from '../components/layout/OverlayPage';
import { useState } from 'react';
import { CustomSelect } from '../components/shared/CustomSelect';

export const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Sales',
    message: '',
  });

  const subjectOptions = ['Sales', 'Support', 'Press'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <OverlayPage>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
          Let's Talk Truth.
        </h1>
        <p className="text-white/60 text-xl mb-12">
          Have a question? Want to partner? Let's connect.
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="glass-panel p-8 rounded-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-bold mb-2 uppercase tracking-wider">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-bold mb-2 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-bold mb-2 uppercase tracking-wider">
                  Subject
                </label>
                <CustomSelect
                  options={subjectOptions}
                  value={formData.subject}
                  onChange={(value) => setFormData({ ...formData, subject: value })}
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-bold mb-2 uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest bg-[#DFFF00] hover:bg-[#E5FF40] text-black shadow-lg shadow-[#DFFF00]/30 hover:shadow-[#DFFF00]/40 transition-all duration-300 hover:scale-105"
              >
                Send Message
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="glass-panel p-8 rounded-3xl">
              <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">
                Headquarters
              </h3>
              <p className="text-white/60 text-lg">Dubai, UAE</p>
            </div>

            <div className="glass-panel p-8 rounded-3xl">
              <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">
                Email
              </h3>
              <a
                href="mailto:hello@vettit.ai"
                className="text-primary text-lg hover:underline"
              >
                hello@vettit.ai
              </a>
            </div>

            <div className="glass-panel p-8 rounded-3xl">
              <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">
                Response Time
              </h3>
              <p className="text-white/60 text-lg">Usually within 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </OverlayPage>
  );
};
