import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure absolute path resolution for Vercel
  base: '/', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, // Disables source maps in production for cleaner build
  },
  server: {
    port: 3000,
  }
});