/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── VETT design tokens (prototype :root) ──────────────
        // Backgrounds
        bg:  '#0B0C15',
        bg2: '#111827',
        bg3: '#1a2233',
        bg4: '#0d1117',

        // Borders
        b1: '#1f2937',
        b2: '#374151',

        // Lime (primary accent)
        lime: {
          DEFAULT: '#BEF264',
          10: 'rgba(190,242,100,.10)',
          20: 'rgba(190,242,100,.20)',
          30: 'rgba(190,242,100,.30)',
        },

        // Text scale
        t1: '#e5e7eb',
        t2: '#9ca3af',
        t3: '#6b7280',
        t4: '#374151',
        t5: '#1f2937',

        // Semantic accents
        grn: '#4ade80',
        red: '#f87171',
        org: '#fb923c',
        pur: '#a78bfa',
        blu: '#60a5fa',

        // Indigo (accent stroke / focus)
        indigo: {
          DEFAULT: '#6366F1',
        },

        // "VETT IT" purple gradient stops (btn-vi)
        'purple-from': '#6d28d9',
        'purple-to':   '#4f46e5',

        // ── Legacy aliases (kept so existing pages keep compiling) ──
        // Both now resolve to the authoritative prototype lime.
        primary:         '#BEF264',
        'primary-hover': '#A3E635',
        'neon-lime':     '#BEF264',
        'background-dark': '#0B0C15',
        'glass-border':  'rgba(255, 255, 255, 0.08)',
        'glass-bg':      'rgba(255, 255, 255, 0.03)',
      },

      fontFamily: {
        // Display = Inter (headlines), Body = Manrope (prose / UI)
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body:    ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans:    ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      fontWeight: {
        // Explicit weights used by the prototype (Tailwind already has these;
        // repeated here for clarity / discoverability).
        normal:   '400',
        medium:   '500',
        semibold: '600',
        bold:     '700',
        extrabold:'800',
        black:    '900',
      },

      letterSpacing: {
        // Inter display tokens from the prototype.
        'tight-2':  '-0.02em',   // logo-text, dash-title, modal-h, etc.
        'display':  '-1.2px',    // sec-h2, setup-h1, hero-h1
        'display-l':'-2px',      // stat-n, mc-h1, scope-num
      },

      borderRadius: {
        // Named to match the prototype's recurring radii. Tailwind's
        // default scale (sm=2, DEFAULT=4, md=6, lg=8, xl=12, 2xl=16, 3xl=24)
        // doesn't align; we override the numeric keys explicitly.
        'none': '0',
        'xs':   '4px',
        'sm':   '6px',
        'md':   '8px',
        'lg':   '10px',
        'xl':   '12px',
        '2xl':  '14px',
        '3xl':  '16px',
        '4xl':  '20px',
        'pill': '9999px',
        'full': '9999px',
      },

      boxShadow: {
        // Lime glow behind the logo icon (prototype: .logo-icon).
        'lime-glow': '0 0 32px rgba(190,242,100,.4), 0 0 16px rgba(190,242,100,.3)',
        'lime-soft': '0 0 16px rgba(190,242,100,.3)',
        // Toast (prototype: .toast).
        'toast':     '0 8px 32px rgba(0,0,0,.5)',
        // Floating panels / modals / chatbot (prototype: .setup-chat-panel).
        'float':     '0 20px 60px rgba(0,0,0,.6)',
        // Purple CTA glow (for hero/chat sends).
        'purple-glow': '0 8px 24px rgba(109,40,217,.35)',
      },

      minHeight: {
        // Apple HIG touch target — referenced by Button on mobile.
        'tap': '44px',
      },

      animation: {
        blob:    'float 20s infinite alternate',
        scan:    'scan 3s ease-in-out infinite',
        marquee: 'marquee 25s linear infinite',
        ticker:  'ticker 30s linear infinite',
        pulse:   'pulse 1.4s ease-in-out infinite',
      },

      keyframes: {
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },

      backgroundSize: {
        'size-200': '200% 200%',
      },
      backgroundPosition: {
        'pos-0':   '0% 0%',
        'pos-100': '100% 100%',
      },

      backgroundImage: {
        // "VETT IT" gradient — exact prototype values.
        'gradient-vett': 'linear-gradient(135deg, #6d28d9, #4f46e5)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
