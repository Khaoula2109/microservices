import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['kowihan.local'],
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'lucide-react'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
});
