# 变更日志

本项目所有重要变更均记录于此。格式参照 [Keep a Changelog](https://keepachangelog.com/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [2.8.1] - 2026-07-24

### 修复 / 改进（子路径部署）
- **改造支持子目录部署（https://www.abao.men/tokenVault/）**：`vite.config.js` 的 `base` 由相对 `./` 改为显式子路径 `/tokenVault/`。相对 base 在「无尾斜杠」访问（如 `/tokenVault`）时会把资源解析到上一级目录导致 404；显式 base 让资源、Service Worker、PWA scope 始终落在 `/tokenVault/` 下，更稳。
- **`base` 可经环境变量覆盖**：`VITE_BASE_URL=/other/ npm run build` 可部署到任意其它子路径或根目录（`VITE_BASE_URL=/`），无需改代码。
- **`public/_headers` 的 Service Worker 规则路径同步改为 `/tokenVault/sw.js`**，使 `Cache-Control: no-cache` 与 `Service-Worker-Allowed` 在当前子路径部署下正确命中。
- **`preview` 脚本对齐子路径**：`vite preview --host --base /tokenVault/`，本地预览与线上一致。
- 验证：本地以 `/tokenVault/` 子路径托管 dist，index、assets、`sw.js`、`manifest.webmanifest`、`icon.svg`、`biometric-test.html` 均返回 200，SW 注册为 `/tokenVault/sw.js`。

### GitHub Pages 工作流（根目录/子目录自适应）
- **`.github/workflows/ci.yml` 重写为「构建 + 部署到 GitHub Pages」**：原仅有 `build + test`，现增加 `upload-pages-artifact` + `deploy-pages` 部署阶段，并声明 `permissions: pages: write / id-token: write` 与 `concurrency` 防并发覆盖。
- **自适应 base 由 `actions/configure-pages@v6` 产出 `base_path` 输出、并在 Build 步骤手动注入 `BASE_PATH`**：项目仓库（如 `tokenVault`）→ `/tokenVault/`（子目录部署），用户/组织站点仓库（`<user>.github.io`）→ `/`（根目录部署）。**不再使用 `static_site_generator: vite`**——该选项会在运行时改写 workflow 文件来注入 `BASE_PATH`，在 Node 24 runner 上触发 `configure-pages@v5` 的已知崩溃（`TypeError: error must be an instance of Error`）；改为显式注入 `env: BASE_PATH: ${{ steps.pages.outputs.base_path }}` 更透明也更稳。`vite.config.js` 的 `base` 改为 `process.env.BASE_PATH || process.env.VITE_BASE_URL || '/tokenVault/'`，本地验证两种 `BASE_PATH` 均正确（子目录 `/tokenVault/assets/...` + `register("/tokenVault/sw.js")`；根目录 `/assets/...` + `register("/sw.js")`）。
- **`deploy` 仅在 `push` 到 `main` 时执行**，`pull_request` 只跑构建/测试校验，避免 PR 误部署。
- 说明：GitHub Pages 不识别 `_headers` 文件、也无法下发 `Service-Worker-Allowed` 头；但 SW 在子路径下默认作用域正好覆盖该子目录，故无需该头（`_headers` 仅对 Netlify/Cloudflare 生效，已加注说明保留）。

### 改进（UI）
- **顶栏品牌名「令牌盒」移到左侧**：原居中 `#title` 插槽在窄屏会与右侧按钮（语言/主题/导出/导入/设置/锁定）重叠遮挡。现改为 `#left` 插槽，品牌名与右侧操作分属左右独立弹性区，避免遮挡（`.brand-title` 渐变样式不变）。

### 修复（扫码/编辑数据丢失）
- **根因**：扫码添加站点时，二维码仅被「识别」填入表单、尚未落盘；而选图/切后台会让页面 `document.hidden`，触发 `App.vue` 自动锁（`vault.lock()` 清空内存 `sites` 并卸载表单），导致未保存的在填站点随表单一起丢失，解锁后「什么信息都没有了」。
- **修复**：`useVault` 新增 `editing` 标志；添加/编辑站点表单、导入选择、设置面板任一打开时置 `editing=true`，`App.vue` 自动锁加 `!vault.editing.value` 守卫——编辑中不自动锁，保住在填数据，返回后可继续保存。
- **附带修正**：`saveSite` 改为仅在 `persist()` 真正落盘成功时才提示「已保存」（原实现无论保存成功与否都弹「已保存」，会在保存失败时误导用户）。

## [2.8.0] - 2026-07-22

### 新增
- **「覆盖全部」二次强提示**：导入弹窗选择「覆盖全部」后，不再直接清空，改为先弹 `showConfirmDialog` 强提示（含「现有 N 个 / 导入 M 个、将永久清空且不可撤销、建议先导出备份」），确认后才用文件完整内容替换保险库；合并导入保持非破坏性不变。新增 `import.replaceConfirmTitle / import.replaceConfirmMsg` 中英文文案，确认按钮标红。
- **生物识别真机联调自检页** `biometric-test.html`：独立诊断页，直接调用应用内核 `vault.js` 的真实函数，在真机（HTTPS/localhost 安全上下文）一键跑通「环境探测 → 主密码解锁取 DEK → `enrollBiometricWithDek` 登记（触发系统指纹/面容）→ `unlockWithBiometric` 解锁 → `decryptSites` 验证」全链路，含 PASS/FAIL 日志区。对真实保险库非破坏式（登记仅追加生物绑定、解锁仅读取）。
- **加密信封自动化测试** `test/vault-envelope.test.js`：在 Node 22 WebCrypto + `localStorage` polyfill 下验证生物识别解锁依赖的同一套信封逻辑（`setup → unlock → 加解密站点`、`错误密码拒绝`、`改密后旧密码失效`、`未设保险库解锁报错`），共 4 项；全量测试 28/28 通过。

### 改进
- **自检页打包进 `dist`**：`vite.config.js` 增加多入口 `biotest`，`biometric-test.html` 随 `npm run build` 一并产出到 `dist/`，`vault.js` 被代码分割为共享 chunk，资源路径为相对（`./assets/...`），可直接静态托管于任意域名/子路径。

### 说明
- WebAuthn PRF 本身依赖平台认证器（`navigator.credentials`），无法在沙箱中模拟，故真机 PRF 链路交由上述自检页在真实设备联调；离线测试覆盖 PRF 派生出 KEK 之后的通用信封行为。
- 代码审计确认生物识别登记/解锁链路无逻辑缺陷：`supportsBiometric` 探测、`enrollBiometricWithDek`（PRF salt 与解锁时一致、登记失败不写半截绑定）、`deriveKekFromPrf`（`prf.eval.first` 用同一 salt 保证确定性）、`unlockWithBiometric`（拆封 + verifier 校验）均正确且健壮。

## [2.7.9] - 2026-07-22

### 修复

- 修复「导入 — 覆盖全部」逻辑冲突：原实现用「新增站点(unique)」当作覆盖内容，导致覆盖后丢失文件中已存在的站点，与「覆盖将清空现有数据」文案语义不符。现提取 `resolveImport()` 纯函数，`full` 返回文件完整内容供覆盖，`unique` 仅用于合并追加；新增 4 项导入回归测试。
- `vault.reset()` 后补充 `refreshBioFlags()`，避免生物识别已登记标记残留（设置新密码时会重新刷新，无可见异常，属健壮性修正）。

## [2.7.8] - 2026-07-22

### 调整

- 重置密码校验失败反馈由「位置抖动」改为更克制的「红色边框脉冲」（向外扩散的 ring 光晕，0.5s ease-out，无位移）
- 新增 `--danger-glow` 主题变量（明/暗）支撑脉冲光晕；`prefers-reduced-motion` 下仅保留静态红框
- 相关 class / ref 由 `shake` 重命名为 `pulse`（`resetPulse` / `triggerPulse`）

## [2.7.7] - 2026-07-22

### 优化
- **重置密码校验失败反馈**：`verifyPassword` 失败时输入框抖动（set-shake 关键帧）+ 自动聚焦，并标记 `aria-invalid`；遵循 `prefers-reduced-motion` 时不抖动。
- 重新进入确认步骤或重新输入时清除抖动与错误态。

## [2.7.6] - 2026-07-22

### 优化
- **重置保险库增强为强约束**：点击「重置 / 清空保险库」后，先在设置面板内展开主密码输入框，调用 `vault.verifyPassword()` 校验通过才允许清空；密码错误提示「主密码错误」，杜绝误触与未授权清空。
- **清空前「导出备份」快捷入口**：危险操作区新增「导出备份」按钮，清空前可一键备份，避免数据丢失。
- 新增 `settings.resetExport / resetPwHint / resetPwPh / resetPwWrong` 中英文文案，及 `.set-btn.ghost` / `.set-divider` / `.set-hint.warn` 样式。

## [2.7.5] - 2026-07-22

### 新增
- **重置 / 清空保险库**：安全设置面板新增危险操作区，带警告提示与二次确认弹窗；确认后调用 `vault.reset()` 清除全部站点与本地加密数据并自动回到锁屏。
- 新增 `settings.reset*` 中英文文案与 `--danger-soft` 主题变量（明暗双色）。

## [2.7.4] - 2026-07-22

### 新增
- **安全设置面板**：导航栏新增「设置」入口，底部弹窗提供
  - 修改主密码（需验证当前密码，错误时提示「当前密码错误」）
  - 生物识别管理：启用 / 移除指纹·面容快速解锁（设备不支持时显示提示）
- 新增中英文 i18n 文案（`settings.*`、`nav.settings`）

### 说明
- 改密码复用同一数据密钥（DEK），已登记的生物识别解锁在改密后依然有效

## [2.7.3] - 2026-07-22

### 修复

- **设置主密码时勾选生物识别未生效**：`LockScreen.vue` 的「启用生物识别」勾选框此前在 `doSetup` 中从未调用 `vault.enrollBio()`，导致勾选后不会真正登记平台生物识别。现已在设置成功后（DEK 驻留内存时）调用登记，失败不影响密码设置。

## [2.7.2] - 2026-07-22

### 修复

- **站点卡片长文本溢出**：`SiteCard.vue` 中站点名称（issuer）因 `display:flex` 导致 `text-overflow:ellipsis` 失效，超长时撑开布局。现拆出 `.sc-issuer-name` 单独省略号截断，类型标签（TOTP/HOTP）始终保留不折行；账户名补充 `title` 悬停提示完整文本。

## [2.7.1] - 2026-07-22

### 修复

- **锁屏图标显示异常**：`LockScreen.vue` 顶部品牌图标原使用 Vant 字体图标 `<van-icon name="shield-o" />`，在部分浏览器因 CSP `font-src 'self'` 拦截 Vant 内联 data URI 字体而显示为空白蓝色块。改为内联 SVG 盾牌图标，不依赖字体；迁移提示与生物识别按钮的图标也同步改为内联 SVG。
- **CSP 放行 data URI 字体**：`index.html` 与 `public/_headers` 的 CSP 从 `font-src 'self'` 放宽为 `font-src 'self' data:`，确保 Vant 其余字体图标在支持 data URI 的场景正常渲染。

## [2.7.0] - 2026-07-21

### 新增（生产就绪 · 安全与健壮性）

- **本地加密保险库（P0）**：所有站点以 AES-256-GCM 信封加密存储。随机数据密钥 `DEK` 加密站点，主密码经 `PBKDF2`（25 万次迭代）派生密钥包装 `DEK` 后落盘；明文密钥永不离盘，解锁后仅驻留内存，锁屏即清除。新增 `LockScreen` 门禁（设置 / 解锁主密码，可选生物识别）。
- **可选生物识别解锁（WebAuthn PRF）**：平台认证器（指纹 / 面容）派生密钥独立解锁，与主密码并列双路径，不依赖系统钥匙串。
- **离线可用（P0）**：新增 Service Worker（`public/sw.js`）缓存应用外壳，无网络仍可查看站点；补 `manifest.webmanifest` 支持「添加到主屏幕」独立运行（PWA）。
- **安全上下文守卫（P0）**：非 HTTPS / localhost 时 `main.js` 展示提示页而非崩溃，避免 Web Crypto 不可用导致白屏。
- **安全响应头（P0）**：`index.html` 增加 CSP / `Referrer-Policy` / `X-Content-Type-Options` meta；`public/_headers` 为 Netlify / Cloudflare Pages 预设 CSP、`X-Frame-Options: DENY`、`frame-ancestors 'none'`、HSTS、`Permissions-Policy`。
- **全局错误边界（P1）**：`App.vue` 接入 `onErrorCaptured` 与 `app.config.errorHandler`，异常时展示兜底 UI，避免整页崩溃。
- **导入合并 / 覆盖（P1）**：导入备份弹窗提供「合并 / 覆盖」选择，修复原 `replace` 标记未生效的缺陷，避免误清已有数据。
- **可访问性（P1）**：全局 `:focus-visible` 键盘焦点轮廓；尊重 `prefers-reduced-motion`；按钮补 `aria-label`；移除 `user-scalable=no` 缩放限制。
- **性能（P1）**：Vant 改为按需引入（`src/plugins/vant.js`），表单 / 分享弹窗 `defineAsyncComponent` 懒加载，减小首屏体积。
- **自动化测试（P0）**：新增 `test/`（`node --test`）覆盖 RFC 4226 HOTP(SHA-1) 权威向量、SHA-256/512 与 Node crypto 交叉验证、TOTP 多算法、otpauth URI 往返、字段归一化、加密保险库加解密 / 改密 / 错误密码失败。
- **CI / 许可证 / 文档（P2）**：GitHub Actions 自动跑测试 + 构建；新增 MIT `LICENSE`；README 增补安全架构、部署安全头与 PWA 说明。

## [2.6.1] - 2026-07-21

### 修复与优化（手动修复复核）

- **修复删除确认弹窗重复**：原先 `SiteCard` 与 `HomeView.deleteSite` 各自弹一次确认框，点击删除会连续弹出两个对话框。现将确认收敛到 `HomeView` 一处统一处理，并带上站点名称（「确定删除「{name}」？」），提示更明确。
- **抽离共享调色板**：将品牌色数组 `COLORS` 抽到 `storage.js` 导出，`SiteFormDialog` 改为 import，消除重复定义、保证默认色一致。
- **`period` 校验一致**：`SiteCard` 的 `period` 计算属性与 `storage.normalizeSite` 对齐，统一采用 `>0` 且有限时取原值、否则回退 30，避免异常值导致验证码错位。
- **新建站点身份更稳健**：`saveSite` 中 `id`/`createdAt` 置于展开之后，保证新建站点一定拿到新 `uid` 与新鲜时间戳。
- **表单删除守卫**：`SiteFormDialog.onDelete` 增加 `!editing` 早返回，避免非编辑态误触发删除。

## [2.6.0] - 2026-07-21

### 修复与优化（卡片一致性 + 健壮性）

- **统一 TOTP / HOTP 卡片标签与等高布局**：站点名称旁始终显示 `TOTP` / `HOTP` 类型标签（此前仅 HOTP 显示）；卡片底部重构为固定 28px 的等高状态行（TOTP 为剩余时间 + 进度条，HOTP 为计数器 + 下一码按钮），两列网格下高度一致、不再参差。
- **导出补全创建时间**：备份 JSON 现写入 `createdAt`，修复导入后「最近添加」排序失效的问题。
- **切回前台立即刷新**：监听 `visibilitychange`，从后台返回时立即重置验证码时间基准，避免显示陈旧码。
- **分享二维码关闭即清空**：关闭分享弹窗时清空已生成的二维码 URL，避免下次打开残留。
- **算法与存储健壮性**：`totp()` 对 `period` 做 `>0` 且有限的防御性校验；`saveSites` 加 try/catch 返回布尔；`genSecret` 的 `crypto` 调用失败（隐私模式 / 非 HTTPS）时给出明确提示而非静默崩溃。

## [2.5.0] - 2026-07-21

### 新增（搜索 / 排序 / 响应式）

- **搜索**：导航栏下方常驻吸顶搜索框，按站点名称 / 账户实时过滤（不区分大小写）。
- **排序**：支持按名称、最近添加、类型三种排序；数据模型补充 `createdAt` 字段（兼容旧备份）。
- **响应式排版**：引入 `clamp()` 流体字号，文字随页面宽度平滑缩放；宽屏（≥768px）容器拓宽至 960px、站点卡片转两列网格；窄屏收紧间距防溢出；导航图标 / 文字颜色绑定主题变量，明暗模式均清晰。
- **算法归一化修复**：修复 `parseOtpAuthUri` 解析算法名时漏识别无连字符写法（`SHA256` / `SHA512`）的问题，避免导入 SHA-256/512 站点被静默降级为 SHA-1 生成错误验证码（已用独立实现交叉验证 30/30 通过）。

## [2.4.0] - 2026-07-21

### 优化（视觉升级 · 贴合中国大陆用户习惯）

- **中文优先排版**：全局字体栈补全 `PingFang SC / 微软雅黑 / 思源黑体 / Noto Sans CJK`，正文 15px、行高 1.6、字距微调，中文不再“发虚”。
- **可信赖蓝主色**：主色收敛为更干净、贴近 Ant Design 蓝的 `#2f6bff`（深色 `#5b9bff`），并新增按压态 `--accent-press`，移动端浏览器主题色同步对齐。
- **实白卡片 + 浅灰底**：卡片由厚重毛玻璃改为偏实心白（`rgba(255,255,255,.94)`）+ 浅灰背景 + 柔和分层阴影，更接近微信/支付宝的清爽观感。
- **验证码分组显示**：6 位 → `123 456`、8 位 → `1234 5678`（中间细分隔），贴合银行/企业验证器的可读习惯；新增「点击复制验证码」提示。
- **克制动效**：卡片列表错峰淡入上浮（`cardIn`，按索引 55ms 递增），统一缓动 `cubic-bezier(0.16,1,0.3,1)`；全面尊重系统「减少动态效果」设置（`prefers-reduced-motion`）。
- **细节打磨**：FAB 光晕/按压更精致，空状态图标放大并加入场动画，风险提示条改为圆角卡片，页脚间距收敛；统一圆角令牌（`--radius` 16 / `--radius-sm` 12 / `--radius-xs` 10）。

## [2.3.1] - 2026-07-21

### 修复（数据健壮性）

- **位数强制钳制为 6/8**：此前从导入备份或粘贴 `otpauth` URI 传入的非标准位数（如 4、10）会被原样采用，生成的验证码与 Google Authenticator / Authy 及服务端不兼容、登录静默失败。`storage.normalizeSite`、`parseOtpAuthUri` 与 `hotp()` 现统一将 `digits` 钳制为 6 或 8（其余值回退 6）。表单单选仅提供 6/8，不受影响。
- **导入去重键加固**：去重键由 `issuer||account||secret` 改为 `JSON.stringify([issuer, account, secret])`。密钥本身仍在键中（同名不同密钥不会被误并），改用 JSON 序列化可避免 `issuer`/`account` 包含分隔符 `||` 时产生碰撞误判。

## [2.3.0] - 2026-07-21

### 新增（HOTP 与品牌）

- **支持 HOTP（RFC 4226）**：新增 `hotp()`，`totp()` 现复用 HOTP 内核；录入表单可切换「时间型 (TOTP) / 计数器型 (HOTP)」，HOTP 显示计数器并支持「下一码」推进；扫码/粘贴 `otpauth://hotp/...` 正常解析（含 `counter`）。数据模型新增 `type` / `counter` 字段，`storage.normalizeSite` 统一归一化。
- **分享/导出包含类型与计数器**：分享二维码与备份 JSON 现写入 `type`、`counter`，跨设备恢复后 HOTP 计数器不丢失。
- **品牌重命名**：应用名由「TOTP 验证器」改为「令牌盒」（英文 TokenVault），同步更新导航栏、页脚版权、浏览器标题、路由元信息、README 等所有位置。

## [2.2.2] - 2026-07-21

### 修复（逻辑错误与健壮性）

- **存储禁用不再崩溃**：`useI18n` / `useTheme` / `HomeView` 顶部对 `localStorage` 的未保护读取在隐私模式或存储被完全禁用时会抛错导致整页白屏；已统一加 try/catch 回退。主题切换的写入亦加保护。
- **保存失败不再中断主流程**：`persist()` 的 `saveSites` 包 try/catch，存储不可用时提示「保存失败：无法写入本地存储」而非抛出未捕获异常（此前会导致保存后无 toast、且编辑弹窗不关闭）。
- **编辑站点后验证码即时刷新**：`SiteCard` 仅监听周期边界重算 TOTP，导致改密钥/算法但周期不变时显示陈旧码；现同时监听 `secret/algo/digits/period`，编辑后立刻重算。
- **HOTP 兜底**：扫码或粘贴 `otpauth://hotp/...` 时明确提示「暂仅支持 TOTP」，避免被当成 TOTP 算出错误码。

## [2.2.1] - 2026-07-21

### 优化（合规页导航）

- 隐私政策 / 免责声明页新增**面包屑导航**（`首页 / 当前页`），「首页」可一键直达，解决反复打开后历史栈累积、需多次点击才能返回的问题。
- 新增可复用组件 `src/components/Breadcrumb.vue`（玻璃态、主题自适应、双语）；返回箭头也改为直达首页。
- `useI18n` 增加 `nav.home`（首页）双语键。

## [2.2.0] - 2026-07-21

### 新增（国际化 / 双语）

- 新增 **中文 / 英文双语** 支持，默认 **中文**；用户可在导航栏「中 / EN」按钮与页脚语言链接间自由切换，选择持久化到 `localStorage`。
- 轻量级自研 i18n（`src/composables/useI18n.js`），**不引入第三方库**，契合离线优先、零上报的设计；支持 `{n}` 占位插值，缺失文案自动回退中文。
- 全量文案双语化：导航栏、风险提示、空状态、站点卡片、录入表单、分享二维码、复制兜底、页脚与版权声明。
- **隐私政策**与**免责声明**页面改为结构化双语内容（`src/lib/legal.js`），随语言切换整体渲染。

## [2.1.0] - 2026-07-21

### 新增（合规页面）

- 引入 `vue-router`（hash 模式），将应用拆分为独立路由页面，便于后期扩展。
- **隐私政策**（`/#/privacy`）与**免责声明**（`/#/disclaimer`）独立页面：含返回导航与中文合规文案（数据本地化、安全责任、与第三方无关等）。
- **全局页脚**：每个页面底部展示「隐私政策」「免责声明」路由链接与版权声明（`© 2026 令牌盒 · 保留所有权利`），三主题自适应。
- 结构调整：`App.vue` 收敛为外壳（主题容器 + `router-view` + 页脚），首页逻辑迁移至 `src/pages/HomeView.vue`，导航栏玻璃样式下沉到全局 `main.css`。

## [2.0.0] - 2026-07-21

### 工程化重写（从单体 HTML 迁移到 Vue 3 工程）

> 此前为单个 `index.html`（原生 JS，约 1000+ 行）的单体实现，已重命名为 `index.legacy.html` 移出版本控制。本次使用 **Vue 3 + Vite + Vant** 全面重写，实现 HTML/CSS/JS 三分离与组件化，便于长期维护与扩展。

### 新增

- **核心算法**：TOTP 计算遵循 RFC 6238，支持 SHA-1 / SHA-256 / SHA-512、6 位 / 8 位、自定义刷新步长；经 RFC 6238 标准测试向量（5+ 时间点）验证通过。
- **二维码生成**：采用成熟库 `qrcode`，生成含 Reed-Solomon 纠错的「分享二维码」，可被真实 App 扫描。
- **二维码解码**：采用成熟库 `jsQR`，支持**上传图片**扫码录入（替换原不可用的手写解码器）。
- **录入方式**：上传二维码图片扫码 + 粘贴 `otpauth://` URI。
- **复制 / 导出兜底**：微信内置浏览器剪贴板 / 下载受限时，弹出可长按复制的浮层，无需微信 JS-SDK。
- **导入 / 导出备份**：以 JSON 格式备份与恢复全部站点。
- **主题系统**：浅色 / 深色 / 跟随系统三态切换，基于 Vant `ConfigProvider` 暗黑主题，全局组件自动适配；状态持久化。
- **防误清理提示**：顶部常驻提示条引导定期导出备份，关闭状态随缓存清理自动重现。
- **视觉优化**：
  - 导航栏通栏毛玻璃背景（三主题自适应）。
  - 验证码强调色渐变文字、倒计时进度条按剩余时间变黄 / 变红。
  - 表单弹窗分区卡片化、空状态插画化、顶栏图标化（Vant 图标）。
- **组件化结构**：`src/components`、`src/composables`、`src/lib`、`src/styles` 分层组织。

### 修复

- 修复原单体版「分享二维码」无法被扫描（缺 Reed-Solomon 纠错）。
- 修复原单体版二维码解码基本失效（假设固定掩码、无纠错、定位符检测粗糙）。
- 修复原单体版 XSS 漏洞（`innerHTML` 拼接未转义解析结果，改为 `textContent` / `.value`）。
- 修复原单体版时钟 / 刷新常驻 60fps 的性能浪费（合并为单一定时器，仅时间窗口切换时重算）。
- 修正顶栏图标空白问题（`@vant/icons` 未安装且图标名写错，补齐依赖并改用有效图标 `bulb-o` / `upgrade` / `down`）。

### 变更

- 二维码生成 / 解码由手写的不可靠实现改为成熟库 `qrcode` / `jsQR`（npm 引入、构建时打包，离线可用）。
- 扫码录入统一为「上传图片」，移除 `getUserMedia` 摄像头路径（微信内核不兼容），一套逻辑兼容微信与 PC。

## [1.0.0] - 历史版本（单体实现，未纳入本仓库）

> 以下为重写前单体 `index.html` 的能力概要，仅供追溯。该文件已移出版本控制。

- 原生 JS 实现的 TOTP 多站点验证器，含手写二维码生成 / 解码、XSS 隐患与 60fps 时钟等问题（见 2.0.0 修复项）。
- 核心 TOTP 计算逻辑经验证正确，已在 2.0.0 中保留并强化。

---

[2.0.0]: #200---2026-07-21
