import 'dotenv/config';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  main: {
    // Inject Groq API key at build time so the built app works for all users without .env
    define: {
      'process.env.GROQ_API_KEY': JSON.stringify(process.env.GROQ_API_KEY || ''),
    },
  },
  preload: {},
  renderer: {
    root: 'src/renderer',
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, 'src/renderer/index.html'),
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/renderer/src'),
      },
    },
    base: './',
  },
});
