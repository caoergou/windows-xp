import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // `.cur` cursor files are JS-imported by the theme's chrome sheet
  // (src/themes/xp/chromeCss.ts, #213 B1) — not a Vite built-in asset type.
  assetsInclude: ['**/*.cur'],
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
      'e2e-visual/**',
      'cn-net-research/**',
      'test/**/*.spec.ts',
      'test/**/*.spec.js',
      'test/**/*.e2e.{ts,tsx}',
    ],
  },
});
