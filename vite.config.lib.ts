import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import libAssetsPlugin from '@laynezh/vite-plugin-lib-assets';
import { xpCssScopePlugin } from './vite.xp-css-scope';
import path from 'path';

const peerDeps = [
  'react',
  'react-dom',
  'i18next',
  'react-draggable',
  'react-i18next',
  'react-resizable',
  'styled-components',
  'xp.css',
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
      external: [...peerDeps, 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          i18next: 'i18next',
          'react-draggable': 'Draggable',
          'react-i18next': 'ReactI18next',
          'react-resizable': 'ReactResizable',
          'styled-components': 'styled',
          'xp.css': 'XPCss',
        },
      },
    },
  },
});
