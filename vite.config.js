import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// GitHub Pages 自适应 base（根目录 / 子目录自动适配）：
// 1) 优先读取 actions/configure-pages 注入的 BASE_PATH：
//      - 项目仓库    -> /<repo>/  （如 tokenVault 仓库 => /tokenVault/，子目录部署）
//      - 用户/组织仓库(<user>.github.io) -> /  （根目录部署）
// 2) 其次可用 VITE_BASE_URL 手动覆盖（例如本地根部署：VITE_BASE_URL=/ npm run build）
// 3) 默认 /tokenVault/ 与线上 www.abao.men/tokenVault/ 对齐，亦方便本地验证
const BASE_URL = process.env.BASE_PATH || process.env.VITE_BASE_URL || '/tokenVault/'

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
