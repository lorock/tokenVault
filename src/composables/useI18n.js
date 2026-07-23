// 轻量级 i18n：中文(zh) / 英文(en)，默认中文，持久化到 localStorage。
// 不依赖第三方库，契合本工具离线优先、零上报的设计。
import { ref } from 'vue'

const LOCALE_KEY = 'totp_locale'

let initialLocale = 'zh'
try {
  initialLocale = localStorage.getItem(LOCALE_KEY) || 'zh'
} catch {
  // 隐私模式 / 存储被禁用：回退中文，不阻断应用启动
}
const locale = ref(initialLocale)

const messages = {
  zh: {
    brand: '令牌盒',
    common: {
      copy: '复制',
      delete: '删除',
      edit: '编辑',
      share: '分享',
      save: '保存',
      cancel: '取消',
      close: '关闭'
    },
    nav: {
      switchTheme: '切换主题',
      export: '导出备份',
      import: '导入备份',
      addSite: '添加站点',
      lang: '语言',
      home: '首页',
      lock: '锁定',
      settings: '设置'
    },
    theme: {
      light: '浅色',
      dark: '深色',
      system: '跟随系统',
      toast: '主题：{label}'
    },
    home: {
      riskLocal: '数据仅保存在此设备本地，清理微信/浏览器缓存会丢失，建议定期导出备份。',
      riskDisabled: '当前环境无法保存数据（隐私模式/存储被禁用），请先「去导出」备份到别处。',
      riskExport: '去导出',
      riskDismiss: '不再提示',
      emptyTitle: '还没有站点',
      emptyDesc: '添加你的第一个两步验证站点，支持二维码图片扫描与 otpauth URI 粘贴。',
      addSite: '添加站点',
      search: '搜索',
      searchPh: '搜索站点名称或账户',
      sort: '排序',
      sortName: '按名称',
      sortRecent: '最近添加',
      sortType: '按类型',
      noResult: '没有匹配的站点',
      noResultDesc: '换个关键词，或清除搜索条件',
      clearSearch: '清除搜索'
    },
    import: {
      title: '发现 {n} 个新站点',
      desc: '选择导入方式：合并将追加到现有列表，覆盖将清空现有数据。',
      merge: '合并导入（{n} 个）',
      replace: '覆盖全部',
      replaceConfirmTitle: '覆盖全部站点？',
      replaceConfirmMsg: '将用导入文件中的 {incoming} 个站点替换当前 {existing} 个站点。现有数据将被永久清空且无法撤销，建议先导出备份。'
    },
    toast: {
      saved: '已保存',
      noSiteExport: '没有站点可导出',
      exported: '已导出 {n} 个站点',
      importAllExist: '所有站点已存在，无需导入',
      imported: '成功导入 {n} 个站点',
      importFailed: '导入失败: {msg}',
      saveFailed: '保存失败：当前环境无法写入本地存储，数据可能不会保留',
      cryptoUnavailable: '当前环境不支持加密运算，请使用 HTTPS 打开'
    },
    confirm: {
      deleteTitle: '删除站点',
      deleteMsg: '确定删除该站点？',
      lockEditingTitle: '锁定并放弃编辑？',
      lockEditingMsg: '当前有未保存的内容，锁定后将丢失。确定锁定吗？'
    },
    lock: {
      setupTitle: '设置主密码',
      setupSub: '主密码用于加密本机存储的验证码密钥，忘记将无法恢复，请牢记。',
      unlockTitle: '解锁令牌盒',
      unlockSub: '输入主密码以查看你的验证码',
      password: '主密码',
      passwordPh: '请输入主密码',
      confirm: '确认密码',
      confirmPh: '再次输入主密码',
      create: '创建并加密',
      unlock: '解锁',
      useBio: '使用指纹 / 面容',
      forgot: '忘记密码？',
      enableBio: '启用生物识别（指纹/面容）快速解锁',
      migrateHint: '检测到旧版明文数据，将在加密后自动迁移',
      resetTitle: '重置并清除全部数据',
      resetMsg: '此操作会清空本设备上的所有站点（含已加密数据），且无法撤销。建议先导出备份。',
      resetConfirm: '清空并重置',
      errBadPassword: '主密码错误',
      errCrypto: '当前环境不支持加密运算，请使用 HTTPS 打开',
      errSetup: '创建失败，请重试',
      errUnlock: '解锁失败，请重试'
    },
    settings: {
      title: '安全设置',
      bioTitle: '生物识别解锁',
      bioUnsupported: '当前设备 / 浏览器不支持生物识别',
      bioEnabled: '已启用指纹 / 面容快速解锁',
      bioEnable: '启用生物识别',
      bioDisable: '移除生物识别',
      bioEnrolling: '请在系统弹窗中验证…',
      bioEnrollFailed: '生物识别登记失败',
      bioRemoved: '生物识别已移除',
      pwTitle: '修改主密码',
      pwCurrent: '当前密码',
      pwNew: '新密码',
      pwConfirm: '确认新密码',
      pwSave: '保存',
      pwMismatch: '两次输入的新密码不一致',
      pwTooShort: '新密码至少 4 位',
      pwWrong: '当前密码错误',
      pwChanged: '主密码已更新',
      resetTitle: '重置 / 清空保险库',
      resetHint: '将永久删除所有站点与本地加密数据，且无法恢复。操作前建议先「导出备份」。',
      resetBtn: '重置 / 清空保险库',
      resetConfirmTitle: '确认清空保险库？',
      resetConfirmMsg: '所有站点与本地加密数据将被永久删除，且无法恢复。',
      resetConfirm: '清空',
      resetCancel: '取消',
      resetDone: '保险库已清空',
      resetExport: '导出备份',
      resetPwHint: '请输入主密码以确认清空操作：',
      resetPwPh: '主密码',
      resetPwWrong: '主密码错误'
    },
    wechat: {
      downloadHint: '微信内不支持直接下载文件。请长按下方 JSON 文本复制，保存到「文件传输助手」或微信笔记中备份。',
      fallbackHint: '当前环境不支持文件下载，请长按下方 JSON 文本复制保存。',
      copyFallbackDefault: '若自动复制失败，请长按上方文字手动复制',
      manualCopy: '请长按文字手动复制'
    },
    site: {
      unnamed: '未命名站点',
      typeTotp: 'TOTP',
      typeHotp: 'HOTP',
      secondsLeft: '{n}s 后刷新',
      copiedCode: '已复制验证码',
      copyHint: '点击复制验证码',
      counter: '计数器 C{n}',
      next: '下一码',
      confirmDeleteMsg: '确定删除「{name}」？'
    },
    form: {
      editTitle: '编辑站点',
      addTitle: '添加站点',
      editSub: '修改账户信息后保存',
      addSub: '添加新的两步验证站点',
      accountInfo: '账户信息',
      issuer: '站点名称',
      issuerPh: '如 GitHub / 阿里云',
      account: '账户名',
      accountPh: '如 user@example.com',
      secret: '密钥',
      secretPh: 'Base32 密钥',
      random: '随机',
      security: '安全选项',
      type: '类型',
      typeTotp: '时间型 (TOTP)',
      typeHotp: '计数器型 (HOTP)',
      counter: '初始计数器',
      algo: '哈希算法',
      digits: '验证码位数',
      period: '刷新步长',
      color: '图标颜色',
      quick: '快速录入',
      uploadQr: '上传二维码图片',
      uploadQrSub: '支持相册截图 / 电脑本地图片',
      pasteUri: '粘贴 otpauth URI',
      pasteUriSub: '含 otpauth://totp/... 或 otpauth://hotp/... 的完整链接',
      pastePh: '粘贴 otpauth://totp/... 或 otpauth://hotp/... 开头的完整 URI',
      parseUri: '解析 URI',
      deleteBtn: '删除站点',
      saveBtn: '保存',
      noQr: '未识别到二维码，请调整图片',
      recognized: '已识别，请确认后保存',
      recogFailed: '识别失败: {msg}',
      enterUri: '请输入 URI',
      enterIssuer: '请输入站点名称',
      enterSecret: '请输入密钥或扫描二维码',
      invalidSecret: '密钥格式无效（需 Base32）',
      digits6: '6 位',
      digits8: '8 位',
      period30: '30 秒',
      period60: '60 秒'
    },
    share: {
      title: '扫码绑定到其他设备',
      copyUri: '复制 otpauth URI',
      hint: '用另一台设备的验证器 App 扫描上方二维码即可完成绑定',
      qrFailed: '二维码生成失败',
      uriCopied: '已复制 URI'
    },
    cf: {
      copy: '复制',
      copied: '已复制'
    },
    footer: {
      privacy: '隐私政策',
      disclaimer: '免责声明',
      copyright: '© 2026 令牌盒 · 保留所有权利',
      note: '本工具为开源前端应用，所有数据仅存储于您的本地设备',
      langLabel: '语言'
    },
    legal: {
      privacyTitle: '隐私政策',
      disclaimerTitle: '免责声明',
      updated: '最后更新：2026-07-21'
    },
    app: {
      errorTitle: '出错了',
      errorDesc: '应用运行时发生异常，可刷新页面重试。',
      retry: '刷新重试'
    }
  },
  en: {
    brand: 'TokenVault',
    common: {
      copy: 'Copy',
      delete: 'Delete',
      edit: 'Edit',
      share: 'Share',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close'
    },
    nav: {
      switchTheme: 'Switch theme',
      export: 'Export backup',
      import: 'Import backup',
      addSite: 'Add site',
      lang: 'Language',
      home: 'Home',
      lock: 'Lock',
      settings: 'Settings'
    },
    theme: {
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      toast: 'Theme: {label}'
    },
    home: {
      riskLocal: 'Data is stored only on this device. Clearing WeChat/browser cache will erase it — export a backup regularly.',
      riskDisabled: 'This environment cannot save data (private mode/storage disabled). Please export a backup elsewhere first.',
      riskExport: 'Export',
      riskDismiss: "Don't show again",
      emptyTitle: 'No sites yet',
      emptyDesc: 'Add your first two-factor site. Supports QR image scanning and otpauth URI paste.',
      addSite: 'Add Site',
      search: 'Search',
      searchPh: 'Search site name or account',
      sort: 'Sort',
      sortName: 'Name',
      sortRecent: 'Recently added',
      sortType: 'Type',
      noResult: 'No matching sites',
      noResultDesc: 'Try a different keyword, or clear the search',
      clearSearch: 'Clear'
    },
    import: {
      title: '{n} new site(s) found',
      desc: 'Choose how to import: merge appends to your current list; replace erases existing data.',
      merge: 'Merge import ({n})',
      replace: 'Replace all',
      replaceConfirmTitle: 'Replace all sites?',
      replaceConfirmMsg: 'This will replace your current {existing} site(s) with the {incoming} site(s) from the file. Existing data will be permanently erased and cannot be undone — export a backup first.'
    },
    toast: {
      saved: 'Saved',
      noSiteExport: 'No sites to export',
      exported: 'Exported {n} site(s)',
      importAllExist: 'All sites already exist — nothing to import',
      imported: 'Successfully imported {n} site(s)',
      importFailed: 'Import failed: {msg}',
      saveFailed: 'Save failed: this environment cannot write to local storage — data may not persist',
      cryptoUnavailable: 'Cryptographic operations are not available in this environment. Please use HTTPS.'
    },
    confirm: {
      deleteTitle: 'Delete Site',
      deleteMsg: 'Are you sure you want to delete this site?',
      lockEditingTitle: 'Lock and discard edits?',
      lockEditingMsg: 'You have unsaved changes. Locking will discard them. Lock anyway?'
    },
    lock: {
      setupTitle: 'Set master password',
      setupSub: 'The master password encrypts the 2FA secrets stored on this device. If lost, data cannot be recovered — remember it.',
      unlockTitle: 'Unlock TokenVault',
      unlockSub: 'Enter your master password to view codes',
      password: 'Master password',
      passwordPh: 'Enter master password',
      confirm: 'Confirm',
      confirmPh: 'Re-enter master password',
      create: 'Create & encrypt',
      unlock: 'Unlock',
      useBio: 'Use fingerprint / face',
      forgot: 'Forgot password?',
      enableBio: 'Enable biometric (fingerprint / face) quick unlock',
      migrateHint: 'Legacy plaintext data detected — it will be encrypted and migrated automatically',
      resetTitle: 'Reset and erase all data',
      resetMsg: 'This erases all sites on this device (including encrypted data) and cannot be undone. Export a backup first.',
      resetConfirm: 'Erase & reset',
      errBadPassword: 'Wrong master password',
      errCrypto: 'Cryptographic operations are unavailable here. Please use HTTPS.',
      errSetup: 'Setup failed, please retry',
      errUnlock: 'Unlock failed, please retry'
    },
    settings: {
      title: 'Security Settings',
      bioTitle: 'Biometric Unlock',
      bioUnsupported: "This device or browser doesn't support biometrics",
      bioEnabled: 'Biometric (fingerprint / face) unlock is enabled',
      bioEnable: 'Enable biometrics',
      bioDisable: 'Remove biometrics',
      bioEnrolling: 'Please verify in the system prompt…',
      bioEnrollFailed: 'Biometric enrollment failed',
      bioRemoved: 'Biometrics removed',
      pwTitle: 'Change Master Password',
      pwCurrent: 'Current password',
      pwNew: 'New password',
      pwConfirm: 'Confirm new password',
      pwSave: 'Save',
      pwMismatch: 'New passwords do not match',
      pwTooShort: 'New password must be at least 4 characters',
      pwWrong: 'Current password is incorrect',
      pwChanged: 'Master password updated',
      resetTitle: 'Reset / Clear Vault',
      resetHint: 'This permanently deletes all sites and locally encrypted data — unrecoverable. Export a backup first if needed.',
      resetBtn: 'Reset / Clear Vault',
      resetConfirmTitle: 'Clear the vault?',
      resetConfirmMsg: 'All sites and local encrypted data will be permanently deleted and cannot be recovered.',
      resetConfirm: 'Clear',
      resetCancel: 'Cancel',
      resetDone: 'Vault cleared',
      resetExport: 'Export backup',
      resetPwHint: 'Enter your master password to confirm clearing:',
      resetPwPh: 'Master password',
      resetPwWrong: 'Incorrect master password'
    },
    wechat: {
      downloadHint: 'Direct file download is not supported in WeChat. Long-press the JSON text below to copy, then save it to "File Transfer" or WeChat Notes as a backup.',
      fallbackHint: 'File download is not supported in the current environment. Long-press the JSON text below to copy and save.',
      copyFallbackDefault: 'If auto-copy fails, long-press the text above to copy manually.',
      manualCopy: 'Please long-press the text to copy manually'
    },
    site: {
      unnamed: 'Unnamed site',
      typeTotp: 'TOTP',
      typeHotp: 'HOTP',
      secondsLeft: 'Refreshes in {n}s',
      copiedCode: 'Code copied',
      copyHint: 'Tap to copy code',
      counter: 'Counter C{n}',
      next: 'Next code',
      confirmDeleteMsg: 'Delete "{name}"?'
    },
    form: {
      editTitle: 'Edit Site',
      addTitle: 'Add Site',
      editSub: 'Modify the account info and save',
      addSub: 'Add a new two-factor authentication site',
      accountInfo: 'Account Info',
      issuer: 'Site Name',
      issuerPh: 'e.g. GitHub / Alibaba Cloud',
      account: 'Account',
      accountPh: 'e.g. user@example.com',
      secret: 'Secret',
      secretPh: 'Base32 secret',
      random: 'Random',
      security: 'Security Options',
      type: 'Type',
      typeTotp: 'Time-based (TOTP)',
      typeHotp: 'Counter-based (HOTP)',
      counter: 'Initial counter',
      algo: 'Hash algorithm',
      digits: 'Code digits',
      period: 'Refresh interval',
      color: 'Icon color',
      quick: 'Quick Import',
      uploadQr: 'Upload QR image',
      uploadQrSub: 'Album screenshot / local image',
      pasteUri: 'Paste otpauth URI',
      pasteUriSub: 'Full link starting with otpauth://totp/... or otpauth://hotp/...',
      pastePh: 'Paste the full URI starting with otpauth://totp/... or otpauth://hotp/...',
      parseUri: 'Parse URI',
      deleteBtn: 'Delete Site',
      saveBtn: 'Save',
      noQr: 'No QR code detected, please adjust the image',
      recognized: 'Recognized — please confirm and save',
      recogFailed: 'Recognition failed: {msg}',
      enterUri: 'Please enter a URI',
      enterIssuer: 'Please enter a site name',
      enterSecret: 'Please enter a secret or scan a QR code',
      invalidSecret: 'Invalid secret format (Base32 required)',
      digits6: '6 digits',
      digits8: '8 digits',
      period30: '30s',
      period60: '60s'
    },
    share: {
      title: 'Scan to bind on another device',
      copyUri: 'Copy otpauth URI',
      hint: 'Scan the QR code above with an authenticator app on another device to bind.',
      qrFailed: 'QR generation failed',
      uriCopied: 'URI copied'
    },
    cf: {
      copy: 'Copy',
      copied: 'Copied'
    },
    footer: {
      privacy: 'Privacy Policy',
      disclaimer: 'Disclaimer',
      copyright: '© 2026 TokenVault · All Rights Reserved',
      note: 'This tool is an open-source front-end app. All data is stored only on your local device.',
      langLabel: 'Language'
    },
    legal: {
      privacyTitle: 'Privacy Policy',
      disclaimerTitle: 'Disclaimer',
      updated: 'Last updated: 2026-07-21'
    },
    app: {
      errorTitle: 'Something went wrong',
      errorDesc: 'An unexpected error occurred. You can reload the page to try again.',
      retry: 'Reload'
    }
  }
}

function resolve(dict, key) {
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), dict)
}

function t(key, params) {
  let str = resolve(messages[locale.value], key)
  if (str === undefined) str = resolve(messages.zh, key)
  if (str === undefined) return key
  if (params) {
    str = String(str).replace(/\{(\w+)\}/g, (m, p) =>
      params[p] !== undefined ? params[p] : m
    )
  }
  return str
}

function setLocale(l) {
  if (!messages[l]) l = 'zh'
  locale.value = l
  try {
    localStorage.setItem(LOCALE_KEY, l)
  } catch {}
  document.documentElement.setAttribute('lang', l === 'zh' ? 'zh-CN' : 'en')
}

function init() {
  document.documentElement.setAttribute('lang', locale.value === 'zh' ? 'zh-CN' : 'en')
}

export function useI18n() {
  return { locale, t, setLocale, init }
}
