import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const here = fileURLToPath(new URL('.', import.meta.url));
const external = [
  ...builtinModules,
  ...builtinModules.map(name => `node:${name}`),
  'jiti',
  'vite',
  'ws',
];

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      include: ['src'],
      rollupTypes: true,
      tsconfigPath: new URL('./tsconfig.json', import.meta.url).pathname,
    }),
  ],
  build: {
    target: 'node18',
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: {
        index: `${here}src/index.ts`,
        cli: `${here}src/cli.ts`,
        serve: `${here}src/serve.ts`,
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external,
      output: {
        banner: chunk => (chunk.name === 'cli' ? '#!/usr/bin/env node' : ''),
      },
    },
  },
});
