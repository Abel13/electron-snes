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
  plugins: [
    react(),
    {
      apply: 'serve',
      name: 'pixelcore-development-csp',
      transformIndexHtml: (html) =>
        html
          .replace("style-src 'self';", "style-src 'self' 'unsafe-inline';")
          .replace(
            '<script src="../src/renderer.tsx" type="module"></script>',
            '<script src="/react-performance-compat.js"></script><script src="../src/renderer.tsx" type="module"></script>',
          ),
    },
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
});
