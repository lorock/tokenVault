import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// 相对 base：构建产物可部署到任意静态托管 / 域名子路径（微信菜单常见场景），无需 CDN。
export default defineConfig({
  plugins: [vue()],
  base: './',
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
