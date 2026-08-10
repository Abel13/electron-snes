import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    emptyOutDir: false,
    outDir: 'dist/renderer',
    rollupOptions: { input: resolve(import.meta.dirname, 'renderer/index.html') },
  },
  plugins: [react()],
});
