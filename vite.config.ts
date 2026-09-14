import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // The server bundle has no use for public/ assets.
    copyPublicDir: !isSsrBuild,
    // The prerender's server bundle (vite build --ssr src/entry-prerender.tsx)
    // runs in Node at build time and is never shipped. It leaves node_modules
    // external, which manualChunks cannot split, so the vendor chunking below
    // applies to the browser build only - where it is unchanged.
    rollupOptions: isSsrBuild ? {} : {
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
}));
