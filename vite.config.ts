import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/IM101a_System/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: false
  }
});
