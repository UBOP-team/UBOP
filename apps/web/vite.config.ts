import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, '../..')
  const env = loadEnv(mode, rootDir, '')
  const apiUrl = env.VITE_API_URL || 'http://127.0.0.1:8000'

  return {
    envDir: rootDir,
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
