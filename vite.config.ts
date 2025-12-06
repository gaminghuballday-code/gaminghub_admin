import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Variables and mixins are imported in each component's SCSS file
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@store': path.resolve(__dirname, './src/store'),
    }
  },
  server: {
    port: 5173, // Changed from 3000 to avoid conflict with backend on port 3000
    proxy: (() => {
      // For development, use localhost:3000 (backend), for production use env variable
      const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:3000';
      const isLocalhost = apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1');
      
      // Only set up proxy for localhost, otherwise use direct API calls
      if (isLocalhost) {
        return {
          '/api': {
            target: apiBaseUrl,
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path,
          },
          '/graphql': {
            target: apiBaseUrl,
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path,
          },
        };
      }
      return undefined;
    })(),
  },
  build: {
    outDir: 'dist',
  },
  }
})
