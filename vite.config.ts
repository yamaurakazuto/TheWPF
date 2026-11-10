import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base を相対パスにしておくと、GitHub Pages の /<repo>/ 配下でも
// ルート直下でも同じビルド成果物がそのまま動く（ルーティングは hash モード）。
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
})
