import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Optimize for mobile performance
    target: 'es2015',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    // Enable source maps for debugging
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // Enable HTTPS for mobile testing
    https: false,
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.tavily.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/search'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add Tavily API key
            proxyReq.setHeader('Authorization', 'Bearer YOUR_TAVILY_API_KEY');
          });
        }
      }
    }
  },
  preview: {
    host: true,
    port: 4173,
  },
});
