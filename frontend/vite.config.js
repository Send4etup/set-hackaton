import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/tasks': 'http://localhost:8000',
      '/schedule': 'http://localhost:8000',
    }
  }
})
