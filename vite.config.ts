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
          // Stripe — loaded only in payment flow
          'vendor-stripe': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
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
