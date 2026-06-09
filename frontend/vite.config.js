import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify('development'),
    'process.env.REACT_APP_API_URL': JSON.stringify('http://localhost:5000'),
    global: 'globalThis',
  },
  server: {
    port: 3000,
    open: true,
  },
});
