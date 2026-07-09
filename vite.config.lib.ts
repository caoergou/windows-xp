import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';

const peerDeps = [
  'react',
  'react-dom',
  'i18next',
  'immer',
  'lucide-react',
  'react-draggable',
  'react-i18next',
  'react-old-icons',
  'react-resizable',
  'styled-components',
  'xp.css',
];

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
    }),
  ],
  publicDir: false,
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/lib/index.tsx'),
      name: 'WindowsXP',
      fileName: (format) => `windows-xp.${format}.js`,
    },
    rollupOptions: {
      external: peerDeps,
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          i18next: 'i18n',
          'i18next-browser-languagedetector': 'i18nextBrowserLanguageDetector',
          immer: 'immer',
          'lucide-react': 'LucideReact',
          'react-draggable': 'Draggable',
          'react-i18next': 'reactI18next',
          'react-old-icons': 'ReactOldIcons',
          'react-resizable': 'ReactResizable',
          'react-selecto': 'Selecto',
          'styled-components': 'styled',
          'xp.css': 'XPCss',
        },
      },
    },
  },
});
