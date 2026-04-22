import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';

interface LeadCaptureFormProps {
  /** CTA button text. */
  cta?: string;
  /** Page/source identifier stored in the lead's source jsonb. */
  page?: string;
  /** Placeholder text for the email input. */
  placeholder?: string;
  /** Layout variant. */
  variant?: 'inline' | 'stacked';
  className?: string;
}

export function LeadCaptureForm({
  cta = 'Get early access',
  page = 'unknown',
  placeholder = 'your@email.com',
  variant = 'inline',
  className = '',
}: LeadCaptureFormProps) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || state === 'loading') return;
    setState('loading');
    setErrMsg('');

    try {
      // Collect basic UTM params from URL if present
      const params = new URLSearchParams(window.location.search);
      const body = {
        email: email.trim(),
        page,
        cta,
        utm_source: params.get('utm_source') || undefined,
        utm_medium: params.get('utm_medium') || undefined,
        utm_campaign: params.get('utm_campaign') || undefined,
      };

      const res = await fetch(`${API_URL}/api/crm/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong.');
      }
      setState('done');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Could not submit. Try again.');
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className={`flex items-center gap-2 text-lime font-body text-[14px] ${className}`}>
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        <span>You&apos;re on the list. We&apos;ll be in touch.</span>
      </div>
    );
  }

  const inputCls = [
    'h-11 px-4 rounded-lg border text-[14px] font-body text-t1 placeholder:text-t4',
    'bg-bg3 border-b1 focus:outline-none focus:border-lime/60 focus:ring-2 focus:ring-lime/20',
    'transition-colors',
  ].join(' ');

  const btnCls = [
    'h-11 px-5 rounded-lg font-display font-bold text-[14px]',
    'bg-lime text-bg hover:bg-lime/90 active:scale-95',
    'flex items-center gap-2 shrink-0 transition-all',
    state === 'loading' ? 'opacity-70 pointer-events-none' : '',
  ].join(' ');

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        className,
        variant === 'inline' ? 'flex items-center gap-2' : 'flex flex-col gap-2',
      ].join(' ')}
    >
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        aria-label="Email address"
        className={[inputCls, variant === 'inline' ? 'flex-1 min-w-0' : 'w-full'].join(' ')}
      />
      <button type="submit" className={btnCls}>
        {state === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {cta}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      {state === 'error' && (
        <p className={`text-red-400 text-[12px] font-body ${variant === 'inline' ? 'w-full' : ''}`}>
          {errMsg}
        </p>
      )}
    </form>
  );
}
