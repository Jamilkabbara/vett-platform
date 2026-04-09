import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Command, ArrowRight, Paperclip, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroProps {
  idea: string;
  setIdea: (value: string) => void;
  onAuthModalOpen: () => void;
}

export const Hero = ({ idea, setIdea, onAuthModalOpen }: HeroProps) => {
  const navigate = useNavigate();
  const [displayText, setDisplayText] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const phrases = [
      'What are you building?',
      'e.g. A Luxury Cat Hotel',
      'e.g. A SaaS for Dentists',
      'e.g. A Vegan Soda Brand',
    ];
    let i = 0,
      j = 0,
      currentPhrase = '',
      isDeleting = false;
    let timeout: NodeJS.Timeout;

    const loop = () => {
      if (i >= phrases.length) i = 0;
      currentPhrase = phrases[i];

      if (isDeleting) {
        j--;
        if (j < 0) {
          isDeleting = false;
          i++;
          j = 0;
        }
      } else {
        j++;
        if (j > currentPhrase.length) {
          isDeleting = true;
          timeout = setTimeout(loop, 1500);
          return;
        }
      }

      setDisplayText(currentPhrase.substring(0, j));
      timeout = setTimeout(loop, isDeleting ? 40 : 80);
    };

    loop();
    return () => clearTimeout(timeout);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageError('');

    if (uploadedImages.length + files.length > 4) {
      setImageError('Maximum 4 images allowed');
      return;
    }

    const validFiles = files.filter((file) => {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setImageError('Only JPG and PNG files allowed');
        return false;
      }
      if (file.size > 2 * 1024 * 1024) {
        setImageError('Each image must be under 2MB');
        return false;
      }
      return true;
    });

    setUploadedImages((prev) => [...prev, ...validFiles].slice(0, 4));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImageError('');
  };

  return (
    <main className="relative z-10 px-6 pt-20 md:pt-28 pb-10 text-center max-w-4xl mx-auto bg-grid">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-8"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        Live Intelligence Engine Active
      </motion.div>

      <h2 className="text-4xl md:text-7xl font-black leading-tight md:leading-[0.9] tracking-tighter text-white mb-8">
        Don't bet your life savings on a{' '}
        <span className="text-primary relative">
          gut feeling.
          <svg
            className="absolute -bottom-2 left-0 w-full hidden md:block"
            viewBox="0 0 358 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 9 C118.5 2.5 239.5 2.5 355 9"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </h2>

      <p className="text-white/60 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed mb-12">
        AI drafts the strategy. <span className="text-white">Real humans</span> give the answers.{' '}
        <span className="text-white font-bold">Results in 24 Hours, not 4 Weeks.</span>
      </p>

      <div className="relative max-w-3xl mx-auto">
        <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>

        {uploadedImages.length > 0 && (
          <div className="mb-4 flex gap-2 justify-center flex-wrap">
            {uploadedImages.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-xl border-2 border-white/20"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {imageError && (
          <div className="mb-4 text-red-400 text-sm font-bold text-center">{imageError}</div>
        )}

        <div className="relative glass-panel p-1.5 rounded-[2.5rem] shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] border-primary/50 group transition-all duration-500 bg-background-dark/90">
          <div className="flex items-center">
            <div className="flex-1 relative">
              <div className="absolute left-7 items-center gap-2 hidden md:flex z-20">
                <Terminal className="text-primary w-6 h-6" />
              </div>

              <div className="relative">
                {!idea && (
                  <div className="absolute left-4 md:left-20 right-40 sm:right-44 md:right-52 lg:right-56 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-lg md:text-xl lg:text-2xl font-bold flex items-center z-0 truncate">
                    {displayText}
                    <span className="typing-cursor"></span>
                  </div>
                )}
                <input
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-transparent py-6 md:py-8 pl-4 md:pl-20 pr-40 sm:pr-44 md:pr-52 lg:pr-56 text-lg md:text-xl lg:text-2xl font-bold relative z-10"
                  type="text"
                />
              </div>
            </div>
            <div className="absolute right-4 flex items-center gap-2 md:gap-3 z-20">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 md:p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all group/upload relative"
                title="Upload assets for A/B testing (Logos, Ads, Designs)"
              >
                <Paperclip className="w-4 md:w-5 h-4 md:h-5 text-white/60 group-hover/upload:text-white transition-colors" />
                <span className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/upload:opacity-100 transition-opacity pointer-events-none hidden md:block">
                  Upload assets for A/B testing
                  <br />
                  (Max 4 images, 2MB each)
                </span>
              </button>
              <button
                onClick={() => {
                  if (!idea.trim()) return;
                  console.log('Redirecting to Mission Setup...', idea);
                  navigate('/setup', { state: { prefill: idea } });
                }}
                disabled={!idea.trim()}
                className={`px-4 md:px-8 py-3 md:py-4 rounded-full font-black text-xs md:text-sm uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
                  idea.trim()
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-2 border-white/20 shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] scale-100 hover:scale-105'
                    : 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300/50 border-2 border-white/10 cursor-not-allowed animate-pulse'
                }`}
              >
                VETT IT
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-white/30 text-[10px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>{' '}
            1,200+ Vetted Ideas
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>{' '}
            24hr Avg Response
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-10 max-w-6xl mx-auto px-6"
      >
        <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-8">
          POWERING DECISIONS FOR BUILDERS AT:
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16">
          <div className="text-gray-300 font-black text-2xl grayscale opacity-60 hover:opacity-80 transition-opacity">
            Google
          </div>
          <div className="text-gray-300 font-black text-2xl grayscale opacity-60 hover:opacity-80 transition-opacity">
            Uber
          </div>
          <div className="text-gray-300 font-black text-2xl grayscale opacity-60 hover:opacity-80 transition-opacity">
            Stripe
          </div>
          <div className="text-gray-300 font-black text-2xl grayscale opacity-60 hover:opacity-80 transition-opacity">
            Airbnb
          </div>
        </div>
      </motion.div>
    </main>
  );
};
