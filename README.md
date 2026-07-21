# 令牌盒

多站点 TOTP（基于时间的一次性密码）验证器，面向**微信公众号菜单 H5** 场景。纯前端实现，无需后端，可部署到任意 HTTPS 静态托管。

> 核心算法遵循 **RFC 6238**，支持 SHA-1 / SHA-256 / SHA-512、6 位 / 8 位验证码、自定义刷新步长。

---

## ✨ 功能特性

- **多站点管理**：增 / 改 / 删，自定义颜色标签与名称。
- **实时验证码**：倒计时进度条，临近刷新自动由黄变红提醒；后台切回前台自动重算，避免显示陈旧码。
- **TOTP 与 HOTP 双协议**：同时支持时间型（RFC 6238）与计数器型（RFC 4226）；HOTP 站点显示计数器并支持「下一码」推进；卡片统一标注 `TOTP` / `HOTP` 类型标签。
- **搜索与排序**：按站点名称 / 账户实时搜索；支持按名称、最近添加、类型三种排序，站点再多也随手可查。
- **录入方式**：
  - 📷 **上传二维码图片** 扫码（微信相册 / PC 文件选择通用，基于 `jsQR`）。
  - 📋 **粘贴 `otpauth://` URI** 直接添加（自动识别 TOTP / HOTP 与算法）。
- **分享二维码**：为任意站点生成可扫描的 `otpauth` 二维码（`qrcode` 库，可长按保存）。
- **复制 / 导出兜底**：微信内置浏览器剪贴板受限时，弹出可长按复制的浮层；导出备份在微信内给出 JSON 文本、PC 走文件下载。
- **导入 / 导出备份**：以 JSON 格式备份全部站点（含算法、位数、步长、颜色、类型、计数器、创建时间），便于迁移与恢复。
- **响应式布局**：字号随页面宽度流体缩放；宽屏（≥768px）自动切换为两列网格、移动端单列紧凑，明暗主题均清晰。
- **主题**：浅色 / 深色 / 跟随系统，三套平滑切换（基于 Vant 暗黑主题）。
- **双语**：中文 / 英文，默认中文，导航栏与页脚可一键切换并记忆（自研轻量 i18n，无第三方依赖）。
- **防误清理提示**：`localStorage` 在清理缓存后会丢失数据，顶部常驻提示条引导定期导出；关闭状态随缓存清理自动重现。

## 🧰 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | Vue 3（`<script setup>` + SFC） |
| 构建 | Vite 5 |
| UI 组件 | Vant 4 + @vant/icons |
| 二维码生成 | `qrcode` |
| 二维码解码 | `jsQR` |
| 加密计算 | Web Crypto（`crypto.subtle`，HMAC-TOTP + AES-GCM 保险库加密） |

> 设计原则：**优先使用成熟开源组件，不重复造轮子**；二维码生成 / 解码均通过 npm 引入并在构建时打包，**运行时不依赖外部 CDN，可离线工作**。

## 📁 目录结构

```
.
├── index.html              # Vite 入口（挂载 #app）+ CSP / 安全响应头 meta
├── vite.config.js          # 构建配置（base:'./' 适配子路径部署）
├── package.json            # 依赖与脚本（含 test / build）
├── package-lock.json       # 锁定依赖版本（建议提交）
├── public/
│   ├── sw.js               # Service Worker：应用外壳缓存优先，离线可用
│   ├── manifest.webmanifest# PWA 清单（可安装、standalone）
│   ├── _headers            # 部署层安全响应头（Netlify / Cloudflare Pages 适用）
│   └── icon.svg / icon-maskable.svg
├── test/                   # node:test 自动化测试（算法 / URI / 加密保险库）
│   ├── helpers.js
│   ├── totp.test.js
│   └── vault.test.js
└── src/
    ├── main.js             # 安全上下文守卫 + 应用挂载 + 注册 Vant + 注册 SW
    ├── App.vue             # 应用外壳（锁屏门禁 + 全局错误边界 + router-view + 页脚）
    ├── pages/
    │   └── HomeView.vue    # 首页：列表编排 + 搜索 / 排序 + 定时刷新 + 导入导出
    ├── components/
    │   ├── LockScreen.vue        # 主密码设置 / 解锁（可选生物识别）门禁
    │   ├── SiteList.vue          # 列表容器
    │   ├── SiteCard.vue          # 单站点：验证码 + 倒计时进度 + 复制 / 分享 / 删除
    │   ├── SiteFormDialog.vue    # 增改表单（上传图扫码 + 粘贴 URI）
    │   ├── ShareQrDialog.vue     # 生成分享二维码
    │   └── CopyFallbackOverlay.vue # 微信复制 / 导出兜底浮层
    ├── composables/
    │   ├── useTheme.js           # 主题状态（light / dark / system，持久化）
    │   ├── useI18n.js            # 轻量双语（zh / en，含锁屏 / 导入等文案）
    │   └── useVault.js           # 加密保险库单例（解锁态 / 站点 / 生物识别）
    ├── lib/
    │   ├── totp.js               # Base32 + HMAC-TOTP/HOTP + otpauth 解析 / 构建
    │   ├── vault.js              # 本地加密保险库（AES-GCM 信封加密 + 主密码 / 生物识别）
    │   ├── storage.js            # 字段归一化 + 可用性检测（密钥已移入 vault）
    │   ├── qr.js                 # 封装 qrcode
    │   ├── scan.js               # 封装 jsQR（文件解码，不依赖摄像头）
    │   └── clipboard.js          # 复制 + 微信兜底逻辑
    └── styles/
        └── main.css              # 主题 CSS 变量 + 基础样式 + 焦点轮廓
```

> 旧版单体 `index.html`（原生 JS）已重命名为 `index.legacy.html` 并移出版本控制，仅作历史参考，新工程不再引用。

## 🚀 快速开始

环境要求：**Node.js 18+**（构建用）。

```bash
# 安装依赖
npm install

# 本地开发（热更新，默认 http://localhost:5173）
npm run dev

# 生产构建（输出到 dist/）
npm run build

# 预览构建产物（http://localhost:4173）
npm run preview
```

## 📦 部署

构建产物为纯静态文件，可部署到任意 HTTPS 静态托管（Nginx、OSS、CloudBase、GitHub Pages、Netlify、Cloudflare Pages 等）：

```bash
npm install
npm test         # 运行算法 / 加密保险库自动化测试（node --test）
npm run build    # 生成 dist/
# 将 dist/ 整体上传到静态托管根目录即可
```

- `vite.config.js` 已设 `base: './'`，可部署在子路径下。
- **必须 HTTPS**：Web Crypto（`crypto.subtle`）仅在安全上下文可用；应用内置安全上下文守卫，非 HTTPS 会展示提示页而非崩溃。
- **安全响应头**：仓库 `public/_headers` 已为 Netlify / Cloudflare Pages 预设 `Content-Security-Policy`、`X-Frame-Options: DENY`、`frame-ancestors 'none'`、`Strict-Transport-Security`、`Referrer-Policy: no-referrer`、`X-Content-Type-Options: nosniff`、`Permissions-Policy`。Nginx 等请自行在配置中补齐等价头。
- **PWA / 离线**：`public/sw.js` 缓存应用外壳（导航网络优先、回退缓存；静态资源缓存优先），无网络时仍可查看已存站点；`manifest.webmanifest` 支持「添加到主屏幕」独立运行。
- **自动化测试与 CI**：`.github/workflows/ci.yml` 在每次推送 / PR 执行 `node --test` + `npm run build`，保证算法正确性与可构建性。

## 💬 微信公众号菜单场景

将页面部署到 **HTTPS + 已备案域名** 后，把链接配置到公众号菜单即可，**无需微信 JS-SDK / 后端签名**。

| 功能 | 微信内置浏览器表现 |
|---|---|
| 查看 / 刷新验证码 | ✅ 正常（`crypto.subtle` 在 HTTPS 下可用） |
| 上传图片扫码录入 | ✅ 正常（调起相册选图，`jsQR` 解码） |
| 生成分享二维码 | ✅ 正常（canvas，可长按保存） |
| 复制验证码 / 导出备份 | ⚠️ 走兜底浮层（长按复制），不依赖 `wx.*` |
| 调摄像头实时扫码 | ❌ **未使用**（微信内核不支持 `getUserMedia`，已统一改为上传图扫码） |

## 🔐 数据安全

- 站点密钥**仅保存在当前设备的 `localStorage`**，不上传任何服务器（本地优先、隐私敏感）。
- **加密保险库（v2.7.0+）**：首次使用需设置主密码，所有站点以 **AES-256-GCM 信封加密**存储：
  - 随机生成数据密钥 `DEK` 加密站点数据；`DEK` 由主密码派生的密钥（`PBKDF2`，25 万次迭代）包装后落盘。
  - **明文密钥永不以任何形式写入存储**；解锁后 `DEK` 仅驻留内存，锁屏 / 切后台即清除。
  - 可选**生物识别解锁**（WebAuthn PRF，平台认证器如指纹 / 面容）：与主密码是两条独立解锁路径，无需依赖系统钥匙串。
  - 支持**修改主密码**（重包装 `DEK`，站点密文不变）与**忘记密码重置**（销毁保险库，需重新录入 / 导入）。
- 微信清理缓存、手动清除浏览器数据、隐私模式会导致数据丢失；加密仅在本地，服务端无副本可恢复。
- 建议**定期使用「导出备份」** 生成 JSON，保存到文件传输助手 / 微信笔记 / 本地文件（备份为明文，请妥善保管）。
- 导入备份时仅读取本地选择的 JSON 文件；导入弹窗提供**合并 / 覆盖**选择，避免误清已有数据。

## 🔒 安全架构（生产就绪）

| 维度 | 实现 |
|---|---|
| 静态加密 + 应用锁 | AES-256-GCM 信封加密 + 主密码（PBKDF2 25w）+ 可选生物识别（WebAuthn PRF） |
| 离线可用 | Service Worker 缓存应用外壳 + PWA manifest，无网仍可查看站点 |
| 安全上下文 | `main.js` 守卫：非 HTTPS/localhost 展示提示页，避免 Web Crypto 不可用导致崩溃 |
| 安全响应头 | `_headers` 预设 CSP / HSTS / X-Frame-Options / Referrer-Policy 等 |
| 全局错误边界 | `App.vue` Vue `onErrorCaptured` + `app.config.errorHandler` + 兜底 UI |
| 可访问性 | `:focus-visible` 键盘焦点轮廓、尊重 `prefers-reduced-motion`、按钮 `aria-label`、移除缩放限制 |
| 自动化测试 | `node --test` 覆盖 RFC 4226 向量、SHA-1/256/512、URI 往返、加密保险库 |
| CI | GitHub Actions：推送 / PR 自动跑测试 + 构建 |
| 性能 | Vant 按需引入、表单 / 分享弹窗 `defineAsyncComponent` 懒加载 |

> 说明：本项目**本地优先、隐私敏感**，未集成远程监控 / 埋点（如 Sentry）。如需可观测性，建议在遵循隐私合规前提下自行接入。

## 🎨 主题

主题状态存于 `localStorage`（`totp_theme`），取值 `light` / `dark` / `system`。`system` 会跟随系统 `prefers-color-scheme` 自动切换。暗色模式由 Vant `ConfigProvider` 暗黑主题驱动，全局组件自动适配。

## ⚖️ 合规页面

为合规需要，应用内置两个独立页面（基于 `vue-router`，hash 模式，静态托管免服务端重写）：

- **隐私政策** `/#/privacy`：说明数据仅存本地、不上传、风险提示与备份建议。
- **免责声明** `/#/disclaimer`：说明服务「现状」提供、安全责任自负、与第三方无关等。

入口位于**全局页脚**：每个页面底部均展示「隐私政策」「免责声明」链接与版权声明（`© 2026 令牌盒 · 保留所有权利`）。

## 📝 开发约定

- 组件按「页面 / 弹窗 / 列表卡片」分层，核心逻辑下沉到 `src/lib`，UI 与状态分离。
- 新增 UI 优先使用 Vant 组件与 `@vant/icons` 图标；自定义样式统一走 `src/styles/main.css` 的 CSS 变量。
- 涉及浏览器能力（剪贴板、下载等）时，需考虑微信内置浏览器的兼容性并保留兜底。

## 📄 许可证

本项目以 **MIT 许可证** 开源，详见 [LICENSE](./LICENSE)。
