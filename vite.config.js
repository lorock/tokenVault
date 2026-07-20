import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 相对 base：构建产物可部署到任意静态托管 / 域名子路径（微信菜单常见场景），无需 CDN。
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2018',
    chunkSizeWarningLimit: 1500
  }
})
