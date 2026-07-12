import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A stock consumer Vite config — nothing XP-specific. The point is to prove the
// published package works from a vanilla Vite + React app (#206).
export default defineConfig({
  plugins: [react()],
  build: {
    // Keep chunk names stable so the tree-shaking assertions can grep them.
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
      },
    },
  },
});
