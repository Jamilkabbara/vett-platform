import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Paperclip, X } from 'lucide-react';

interface ContextPageProps {
  idea: string;
  setIdea: (value: string) => void;
}

export const ContextPage = ({ idea, setIdea }: ContextPageProps) => {
  const navigate = useNavigate();
  const [ghostText, setGhostText] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const phrases = ['Will people pay $50?', 'Do they prefer Blue or Red?', 'Is the market saturated?'];
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

      setGhostText(currentPhrase.substring(0, j));
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
    <div className="min-h-[100dvh] bg-background-dark font-display text-white px-4 sm:px-6 py-6 pb-32">
      <header className="flex items-center justify-between mb-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/50 hover:text-white font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-primary font-black text-xs uppercase tracking-widest">Step 1/2</span>
      </header>

      <div className="max-w-xl mx-auto space-y-8">
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-2">Context Engine</h2>
          <p className="text-white/50">Calibrate the AI with your mission parameters.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">
              Business Idea
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="w-full glass-panel rounded-2xl p-6 bg-transparent text-white text-xl font-bold min-h-[140px] focus:ring-1 focus:ring-primary border-transparent focus:border-primary placeholder:text-white/20"
              placeholder="Describe what you are building..."
            ></textarea>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">
              What to find out?
            </label>
            <input
              className="w-full glass-panel rounded-xl p-6 bg-transparent text-white font-medium focus:ring-1 focus:ring-primary border-transparent placeholder:text-white/30"
              placeholder={ghostText}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">
              Visual Assets (Optional)
            </label>
            <p className="text-[10px] text-white/40 mb-3 font-medium">
              Upload up to 4 images for A/B testing (logos, ads, designs). Max 2MB each.
            </p>

            {uploadedImages.length > 0 && (
              <div className="mb-4 flex gap-2 flex-wrap">
                {uploadedImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-xl border-2 border-white/20"
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
              <div className="mb-4 text-red-400 text-sm font-bold">{imageError}</div>
            )}

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
              type="button"
              className="w-full glass-panel rounded-xl p-4 bg-transparent hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-white/60 hover:text-white border-dashed"
            >
              <Paperclip className="w-5 h-5" />
              <span className="text-sm font-bold">Upload Images for A/B Testing</span>
            </button>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 block">
              Founder DNA
            </label>
            <p className="text-[10px] text-white/40 mb-3 font-medium">
              This helps us tailor the AI experience and does not affect your survey results.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
                <span className="text-sm font-bold">[ Industry ]</span>
                <span className="text-white/50 text-sm">▼</span>
              </div>
              <div className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
                <span className="text-sm font-bold">[ Job Role ]</span>
                <span className="text-white/50 text-sm">▼</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/mission-control')}
          className="w-full bg-primary hover:bg-primary-hover py-5 rounded-2xl font-black text-white tracking-widest text-sm uppercase shadow-xl shadow-primary/20 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-8"
        >
          <span>Initialize Mission</span>
          <Zap className="w-5 h-5" fill="currentColor" />
        </button>
      </div>
    </div>
  );
};
