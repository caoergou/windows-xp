import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { xpCssScopePlugin } from './vite.xp-css-scope';

// Multi-page app (#160/#161): the site is now four real HTML entries instead of
// query-string routing on a single bundle.
//   /            → landing page ("Three Desktops, One Engine")
//   /demo/zh/    → Chinese-context live XP desktop
//   /demo/en/    → English-context live XP desktop
//   /gallery/    → component gallery (was /?gallery)
export default defineConfig({
  plugins: [react()],
  base: '/windows-xp/',
  css: {
    postcss: {
      plugins: [xpCssScopePlugin()],
    },
  },
  build: {
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'index.html'),
        demoZh: resolve(__dirname, 'demo/zh/index.html'),
        demoEn: resolve(__dirname, 'demo/en/index.html'),
        gallery: resolve(__dirname, 'gallery/index.html'),
      },
    },
  },
  server: {
    port: 5173,
    watch: {
      ignored: ['**/xp-research/**', '**/cn-net-research/**'],
    },
  },
});
