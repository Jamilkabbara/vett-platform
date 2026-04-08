import { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/apiClient';
import toast from 'react-hot-toast';

interface AuthModalProps {
  onClose: () => void;
  isOpen?: boolean;
}

export const AuthModal = ({ onClose, isOpen = true }: AuthModalProps) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePrototypeBypass = () => {
    onClose();
    navigate('/mission-control');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Register user profile + send welcome email via backend
        if (signUpData.user) {
          api.post('/api/auth/register', {
            userId: signUpData.user.id,
            email: signUpData.user.email,
          }).catch(() => {}); // non-blocking
        }
        toast.success('Account created successfully!');
        onClose();
        navigate('/missions');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Welcome back!');
        onClose();
        navigate('/missions');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage === 'Invalid login credentials'
        ? 'Invalid credentials. Please try again.'
        : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/mission-control`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-6">
      <div className="glass-panel bg-[#0B0C15] border border-white/10 rounded-3xl p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-white mb-2">Welcome to VETT.</h2>
          <p className="text-white/50 text-sm">Democratizing market intelligence.</p>
        </div>

        <div className="bg-white/5 p-1 rounded-2xl flex mb-8 border border-white/5">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === 'signin'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === 'signup'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full h-14 bg-white hover:bg-gray-100 text-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] font-bold disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            disabled
            className="w-full h-14 bg-black border border-white/20 hover:bg-white/5 text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] font-bold opacity-50 cursor-not-allowed"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.96 0-2.04-.6-3.23-.6-1.2 0-2.4.61-3.26.61-1.44 0-3.64-2.84-3.64-6.32 0-3.32 2.15-5.07 4.19-5.07 1.08 0 2.01.73 2.76.73.72 0 1.83-.81 3.06-.81 1.34 0 2.5.58 3.16 1.54-2.67 1.57-2.24 5.17.42 6.31-.63 1.63-1.63 3.55-3.46 3.55zm-3.8-15.68c-.06-1.55 1.23-2.92 2.65-3.05.15 1.68-1.23 3.09-2.65 3.05z" />
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="mt-8">
          {!showEmailInput ? (
            <button
              onClick={() => setShowEmailInput(true)}
              className="w-full text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
            >
              Or Continue with Email
            </button>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:ring-1 focus:ring-primary focus:border-primary"
                autoFocus
                required
              />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:ring-1 focus:ring-primary focus:border-primary"
                required
                minLength={6}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary py-4 rounded-2xl font-black text-white text-sm uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          <button
            onClick={handlePrototypeBypass}
            className="w-full text-[10px] font-bold text-white/20 hover:text-primary transition-colors"
          >
            [DEV] Continue as Guest / Prototype Mode
          </button>
        </div>
      </div>
    </div>
  );
};
