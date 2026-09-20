import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiTarget = env.API_TARGET || 'http://localhost:8081';

  return {
    base: env.VITE_BASE_PATH || '/',
    worker: { format: 'es' },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(sourceDirectory, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      port: 5173,
      proxy: {
        '/api': apiTarget,
      },
    },
  };
});
