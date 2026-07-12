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
    // First-paint budget (#210): keep image/audio bytes OUT of the JS chunks.
    // With the 4 KB default, ~270 KB of small icon PNGs were base64-inlined into
    // the AppProviders chunk and shipped on first paint even though most icons
    // aren't shown until an app opens. As URLs they load lazily, per <img> render.
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'index.html'),
        demoZh: resolve(__dirname, 'demo/zh/index.html'),
        demoEn: resolve(__dirname, 'demo/en/index.html'),
        gallery: resolve(__dirname, 'gallery/index.html'),
      },
      output: {
        // Split third-party libs and the i18n locale JSON out of the app chunk so
        // no single chunk blows the budget and vendor caches separately. Kept as a
        // single `vendor` chunk (not per-lib): fine-grained react/styled splitting
        // reorders chunk init and breaks `React` availability at load.
        manualChunks(id) {
          if (id.includes('/src/i18n/locales/')) return 'i18n-locales';
          if (id.includes('node_modules')) return 'vendor';
        },
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
