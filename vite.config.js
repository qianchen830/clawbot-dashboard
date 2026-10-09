import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      '/images': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5174,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      // /api/hermes/* → Node server-api.cjs (8766)，放最前（精确优先于前缀）
      '/api/hermes': {
        target: 'http://127.0.0.1:8766',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      // /api/vector/* → recall-server (18799)
      '/api/vector': {
        target: 'http://127.0.0.1:18799',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      // 其余 /api/* → 技能库服务 (3001)
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
      '/images': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
})
