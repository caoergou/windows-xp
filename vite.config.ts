import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/windows-xp/',
  server: {
    port: 5173,
  },
});
