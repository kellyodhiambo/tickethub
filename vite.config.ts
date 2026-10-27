import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  envPrefix: 'VITE_PUBLIC_',
  plugins: [react()],
  resolve: {
    alias: {
      '@/mocks': fileURLToPath(new URL('./src/mock', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __BASE_PATH__: JSON.stringify('/'),
  },
})
