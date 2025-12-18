import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy API requests to the backend server
          '/auth': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
          '/api': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
          '/users': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
          '/admin': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
