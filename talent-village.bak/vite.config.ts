import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@bree-ai/core': path.resolve(__dirname, '../../packages/bree-ai-core/src'),
    },
  },
  server: {
    port: 5174,
  },
});
