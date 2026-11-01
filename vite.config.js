import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No dev proxy: the client calls the API at VITE_API_URL (see .env.example).
export default defineConfig({
  plugins: [react()],
  resolve: {
    // import PageHeader from '@/components/PageHeader'  instead of  '../../components/PageHeader'
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, strictPort: true },
  // MUI makes the bundle about 800 KB (260 KB gzipped). That is fine for this staff app,
  // so the default 500 KB warning is raised instead of splitting the code.
  build: { chunkSizeWarningLimit: 1000 },
});
