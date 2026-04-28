import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Heavy visualization library — only loaded on Results page
          'vendor-charts': ['recharts'],
          // Markdown renderer — Blog pages only
          'vendor-markdown': ['react-markdown'],
          // Pass 23 Bug 23.0e v2 — vendor-stripe chunk removed alongside the
          // @stripe/react-stripe-js + @stripe/stripe-js uninstall. Checkout
          // is now a redirect to Stripe-hosted pages, so no Stripe SDK
          // ships in our bundle.
          // Animation library — progressively loaded
          'vendor-motion': ['framer-motion'],
          // Supabase client — auth + DB calls, shared across many pages
          'vendor-supabase': ['@supabase/supabase-js'],
          // React core — stable, long-lived cache
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
