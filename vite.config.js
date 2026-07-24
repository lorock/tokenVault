import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
// 读取 package.json 版本号，注入前端（页脚展示）与 SW 缓存名（版本化失效）
const { version: APP_VERSION } = require('./package.json')

// 部署 base（资源 / Service Worker / PWA scope 的路径前缀）：
// - 默认 '/'：根目录部署（主部署目标 Cloudflare Pages + 自定义域名 tokenvault.sre.wang）
// - 可用 VITE_BASE_URL 手动覆盖：子路径部署时 VITE_BASE_URL=/tokenVault/ npm run build
// 不再依赖 actions/configure-pages 注入的 BASE_PATH（该机制仅 GitHub Pages 使用）；
// Cloudflare Pages 直接从仓库构建，由本默认值 / VITE_BASE_URL 决定 base。
const BASE_URL = process.env.VITE_BASE_URL || '/'

// Vant 4 的图标 @font-face 内含 `//at.alicdn.com/...` 远程字体回退，被严格 CSP
// （font-src 'self' data:）拦截，且离线（SW 外壳）下必然失效。该插件在构建/开发期
// 直接把该 alicdn URL 改写成同源本地路径（public/fonts/vant-icon.woff），
// 路径按部署 base 自动拼接，子路径部署亦无需改。由此 alicdn 字符串从产物中彻底消失，
// 不再依赖 CSS 级联顺序，dev 与 prod 行为一致。
function selfHostVantIconFont() {
  const base = BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/'
  const localFont = base + 'fonts/vant-icon.woff'
  return {
    name: 'self-host-vant-icon-font',
    enforce: 'pre',
    transform(code) {
      if (code.includes('at.alicdn.com/t/c/font_2553510')) {
        return code.replace(
          /(https?:)?\/\/at\.alicdn\.com\/t\/c\/font_2553510[^\s'")]+/g,
          localFont
        )
      }
      return null
    }
  }
}

// SW 缓存版本化：构建期把 public/sw.js 中的 `__SW_CACHE_VERSION__` 占位符替换为
// `totp-cache-v{version}-{timestamp}`。由此每次部署都生成全新缓存名，旧缓存（不同名）
// 在 activate 阶段被清掉，从根本上避免「发版后用户仍看到旧版本」的离线外壳陈旧问题。
// 加时间戳确保即使同版本重新构建也会失效（例如改了代码但忘了 bump 版本号）。
// 注意：public/ 下的文件由 Vite 在 generateBundle 之后另行原样拷贝，不会出现在 bundle
// 中，故在 closeBundle 阶段直接改写已写入磁盘的 dist/sw.js。
function injectSWCacheVersion(version) {
  const cacheName = `totp-cache-v${version}-${Date.now()}`
  return {
    name: 'inject-sw-cache-version',
    apply: 'build',
    closeBundle() {
      const outDir = this?.options?.dir || 'dist'
      const swPath = path.resolve(outDir, 'sw.js')
      if (!fs.existsSync(swPath)) return
      const src = fs.readFileSync(swPath, 'utf-8')
      if (!src.includes('__SW_CACHE_VERSION__')) return
      fs.writeFileSync(
        swPath,
        src.replace(/__SW_CACHE_VERSION__/g, cacheName),
        'utf-8'
      )
    }
  }
}

export default defineConfig({
  plugins: [vue(), selfHostVantIconFont(), injectSWCacheVersion(APP_VERSION)],
  // 注入应用版本号，前端通过 import.meta.env.VITE_APP_VERSION 读取（页脚展示）
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION)
  },
  base: BASE_URL,
  server: {
    // 允许通过局域网 IP / 隧道域名访问 dev server
    host: true,
    // 修复 HMR WebSocket：非 localhost 访问时 Vite 推断不到端口（ws://localhost:undefined）。
    // clientPort 默认 5173，可用 HMR_CLIENT_PORT 环境变量覆盖（如经隧道映射到其它端口）。
    hmr: {
      protocol: 'ws',
      clientPort: process.env.HMR_CLIENT_PORT
        ? Number(process.env.HMR_CLIENT_PORT)
        : 5173
    }
  },
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
