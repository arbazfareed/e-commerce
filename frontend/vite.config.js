import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vite sets NODE_ENV itself (production for builds). Forcing 'development' here shipped
  // React's slow debug build to the live site.
  define: {
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunk: browsers keep it cached across site updates.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          vendor: ['axios', '@vercel/analytics'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
