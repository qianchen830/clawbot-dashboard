import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0',
  },
  preview: {
    port: 5174,
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com', '.cloudflareide.com', 'local.dev'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/presale': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
})
