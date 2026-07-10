import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { xpCssScopePlugin } from './vite.xp-css-scope';

export default defineConfig({
  plugins: [react()],
  base: '/windows-xp/',
  css: {
    postcss: {
      plugins: [xpCssScopePlugin()],
    },
  },
  server: {
    port: 5173,
    watch: {
      ignored: ['**/xp-research/**', '**/cn-net-research/**'],
    },
  },
});
