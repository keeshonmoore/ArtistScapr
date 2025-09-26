import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import path from 'path';

   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
     server: {
       proxy: {
         '/api/webhook-scrape': {
           target: 'https://n8n.servvvone.com',
           changeOrigin: true,
           rewrite: (path) => path.replace(/^\/api\/webhook-scrape/, '/webhook'),
         },
         '/api/webhook-find': {
           target: 'https://n8n.srv1023790.hstgr.cloud',
           changeOrigin: true,
           rewrite: (path) => path.replace(/^\/api\/webhook-find/, '/webhook-test'),
         },
       },
     },
   });