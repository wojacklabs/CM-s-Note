import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api/nitter/username/rss → https://nitter.net/username/rss
      '/api/nitter': {
        target: 'https://nitter.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nitter/, ''),
      },
    },
  },
}) 