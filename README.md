# TOTP 验证器

多站点 TOTP（基于时间的一次性密码）验证器，面向**微信公众号菜单 H5** 场景。纯前端实现，无需后端，可部署到任意 HTTPS 静态托管。

> 核心算法遵循 **RFC 6238**，支持 SHA-1 / SHA-256 / SHA-512、6 位 / 8 位验证码、自定义刷新步长。

---

## ✨ 功能特性

- **多站点管理**：增 / 改 / 删，自定义颜色标签与名称。
- **实时验证码**：倒计时进度条，临近刷新自动由黄变红提醒；后台切回前台自动重算。
- **录入方式**：
  - 📷 **上传二维码图片** 扫码（微信相册 / PC 文件选择通用，基于 `jsQR`）。
  - 📋 **粘贴 `otpauth://` URI** 直接添加。
- **分享二维码**：为任意站点生成可扫描的 `otpauth` 二维码（`qrcode` 库，可长按保存）。
- **复制 / 导出兜底**：微信内置浏览器剪贴板受限时，弹出可长按复制的浮层；导出备份在微信内给出 JSON 文本、PC 走文件下载。
- **导入 / 导出备份**：以 JSON 格式备份全部站点（含算法、位数、步长、颜色），便于迁移与恢复。
- **主题**：浅色 / 深色 / 跟随系统，三套平滑切换（基于 Vant 暗黑主题）。
- **防误清理提示**：`localStorage` 在清理缓存后会丢失数据，顶部常驻提示条引导定期导出；关闭状态随缓存清理自动重现。

## 🧰 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | Vue 3（`<script setup>` + SFC） |
| 构建 | Vite 5 |
| UI 组件 | Vant 4 + @vant/icons |
| 二维码生成 | `qrcode` |
| 二维码解码 | `jsQR` |
| 加密计算 | Web Crypto（`crypto.subtle`，HMAC） |

> 设计原则：**优先使用成熟开源组件，不重复造轮子**；二维码生成 / 解码均通过 npm 引入并在构建时打包，**运行时不依赖外部 CDN，可离线工作**。

## 📁 目录结构

```
.
├── index.html              # Vite 入口（挂载 #app）
├── vite.config.js          # 构建配置（base:'./' 适配子路径部署）
├── package.json            # 依赖与脚本
├── package-lock.json       # 锁定依赖版本（建议提交）
└── src/
    ├── main.js             # 应用挂载、注册 Vant、初始化主题
    ├── App.vue             # 导航栏 / 列表 / 弹窗编排 + 定时刷新 + 导入导出
    ├── components/
    │   ├── SiteList.vue          # 列表容器
    │   ├── SiteCard.vue          # 单站点：验证码 + 倒计时进度 + 复制 / 分享 / 删除
    │   ├── SiteFormDialog.vue    # 增改表单（上传图扫码 + 粘贴 URI）
    │   ├── ShareQrDialog.vue     # 生成分享二维码
    │   └── CopyFallbackOverlay.vue # 微信复制 / 导出兜底浮层
    ├── composables/
    │   └── useTheme.js           # 主题状态（light / dark / system，持久化）
    ├── lib/
    │   ├── totp.js               # Base32 + HMAC-TOTP + otpauth 解析 / 构建
    │   ├── storage.js            # localStorage 持久化 + 可用性检测
    │   ├── qr.js                 # 封装 qrcode
    │   ├── scan.js               # 封装 jsQR（文件解码，不依赖摄像头）
    │   └── clipboard.js          # 复制 + 微信兜底逻辑
    └── styles/
        └── main.css              # 主题 CSS 变量 + 基础样式
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

构建产物为纯静态文件，可部署到任意 HTTPS 静态托管（Nginx、OSS、CloudBase、GitHub Pages 等）：

```bash
npm run build   # 生成 dist/
# 将 dist/ 整体上传到静态托管根目录即可
```

- `vite.config.js` 已设 `base: './'`，可部署在子路径下。
- **必须 HTTPS**：Web Crypto（`crypto.subtle`）仅在安全上下文可用。

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

- 站点密钥**仅保存在当前设备的 `localStorage`**，不上传任何服务器。
- 微信清理缓存、手动清除浏览器数据、隐私模式会导致数据丢失。
- 建议**定期使用「导出备份」** 生成 JSON，保存到文件传输助手 / 微信笔记 / 本地文件。
- 导入备份时仅读取本地选择的 JSON 文件。

## 🎨 主题

主题状态存于 `localStorage`（`totp_theme`），取值 `light` / `dark` / `system`。`system` 会跟随系统 `prefers-color-scheme` 自动切换。暗色模式由 Vant `ConfigProvider` 暗黑主题驱动，全局组件自动适配。

## 📝 开发约定

- 组件按「页面 / 弹窗 / 列表卡片」分层，核心逻辑下沉到 `src/lib`，UI 与状态分离。
- 新增 UI 优先使用 Vant 组件与 `@vant/icons` 图标；自定义样式统一走 `src/styles/main.css` 的 CSS 变量。
- 涉及浏览器能力（剪贴板、下载等）时，需考虑微信内置浏览器的兼容性并保留兜底。

## 📄 许可证

本项目仅供学习与自用。
