import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: { allow: ['..'] }, // the client reuses the server's parser for offline use
    proxy: { '/api': 'http://localhost:4000' },
  },
});
