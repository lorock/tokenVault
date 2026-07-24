import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// 部署 base（资源 / Service Worker / PWA scope 的路径前缀）：
// - 默认 '/'：根目录部署（主部署目标 Cloudflare Pages + 自定义域名，如 tokenvalut.xubaojin.com）
// - 可用 VITE_BASE_URL 手动覆盖：子路径部署时 VITE_BASE_URL=/tokenVault/ npm run build
// 不再依赖 actions/configure-pages 注入的 BASE_PATH（该机制仅 GitHub Pages 使用）；
// Cloudflare Pages 直接从仓库构建，由本默认值 / VITE_BASE_URL 决定 base。
const BASE_URL = process.env.VITE_BASE_URL || '/'

export default defineConfig({
  plugins: [vue()],
  base: BASE_URL,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2018',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      // 多入口：主应用 + 生物识别自检页，自检页独立打包为可直接静态托管。
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        biotest: fileURLToPath(new URL('./biometric-test.html', import.meta.url))
      }
    }
  }
})
