import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/xp-research/**'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    exclude: [
      '**/.dev/**',
      '**/node_modules/**',
      'e2e/**',
      'test/**/*.spec.ts',
      'test/**/*.spec.js',
      'test/**/*.e2e.{ts,tsx}',
    ],
  },
});
