import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import libAssetsPlugin from '@laynezh/vite-plugin-lib-assets';
import { xpCssScopePlugin } from './vite.xp-css-scope';
import path from 'path';

// Kept out of the bundle: true peers (host-shared) plus regular dependencies,
// which npm installs for the consumer and their bundler resolves/dedupes.
// xp.css is intentionally NOT external - its CSS is compiled (and scoped)
// into dist/style.css so consumers don't need to install it.
const externals = [
  'react',
  'react-dom',
  'styled-components',
  'i18next',
  'react-draggable',
  'react-i18next',
  'react-resizable',
];

export default defineConfig({
  plugins: [
    react(),
    // Vite lib mode inlines every asset as base64 into the JS chunks
    // (assetsInlineLimit is ignored), which bloated the package to 17MB.
    // This plugin extracts referenced assets into dist/assets/ as real files.
    libAssetsPlugin({
      limit: 1024 * 4, // inline only tiny assets (<4KB)
      outputPath: 'assets',
    }),
    dts({
      insertTypesEntry: true,
      rollupTypes: false,
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
      // The marketing site / demo / gallery entries are not part of the library
      // surface — don't emit their .d.ts into the package (#210 zero-leakage).
      exclude: ['src/site/**', 'src/demo/**', 'src/gallery/**', 'e2e/**', 'test/**'],
    }),
  ],
  publicDir: false,
  css: {
    postcss: {
      plugins: [xpCssScopePlugin()],
    },
  },
  build: {
    assetsInlineLimit: 0,
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/lib/index.tsx'),
        components: path.resolve(__dirname, 'src/lib/components.tsx'),
        apps: path.resolve(__dirname, 'src/lib/apps.tsx'),
        hooks: path.resolve(__dirname, 'src/lib/hooks.tsx'),
        theme: path.resolve(__dirname, 'src/lib/theme.tsx'),
        registry: path.resolve(__dirname, 'src/lib/registry.tsx'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    rollupOptions: {
      external: [...externals, 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          i18next: 'i18next',
          'react-draggable': 'Draggable',
          'react-i18next': 'ReactI18next',
          'react-resizable': 'ReactResizable',
          'styled-components': 'styled',
        },
      },
    },
  },
});
