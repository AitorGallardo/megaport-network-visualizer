import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Megaport's frontend stack: Vue 3 + Vite + TypeScript + Tailwind + TanStack.
export default defineConfig({
  plugins: [vue()],
  server: { port: 5173, open: true },
})
