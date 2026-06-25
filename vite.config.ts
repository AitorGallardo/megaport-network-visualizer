import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Megaport's frontend stack: Vue 3 + Vite + TypeScript + Tailwind + TanStack.
// Base path is root everywhere (local dev, Vercel) except the GitHub Pages
// build, which serves from the repo subpath and sets DEPLOY_TARGET=gh-pages.
export default defineConfig({
  base: process.env.DEPLOY_TARGET === 'gh-pages' ? '/megaport-network-visualizer/' : '/',
  plugins: [vue()],
  server: { port: 5173, open: true },
})
