import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
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
    dts({
      insertTypesEntry: true,
      rollupTypes: false,
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
    }),
  ],
  publicDir: false,
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
