// 轻量级 i18n：中文(zh) / 英文(en)，默认中文，持久化到 localStorage。
// 不依赖第三方库，契合本工具离线优先、零上报的设计。
import { ref } from 'vue'

const LOCALE_KEY = 'totp_locale'

const locale = ref(localStorage.getItem(LOCALE_KEY) || 'zh')

const messages = {
  zh: {
    brand: 'TOTP 验证器',
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
      home: '首页'
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
      addSite: '添加站点'
    },
    toast: {
      saved: '已保存',
      noSiteExport: '没有站点可导出',
      exported: '已导出 {n} 个站点',
      importAllExist: '所有站点已存在，无需导入',
      imported: '成功导入 {n} 个站点',
      importFailed: '导入失败: {msg}'
    },
    confirm: {
      deleteTitle: '删除站点',
      deleteMsg: '确定删除该站点？'
    },
    wechat: {
      downloadHint: '微信内不支持直接下载文件。请长按下方 JSON 文本复制，保存到「文件传输助手」或微信笔记中备份。',
      fallbackHint: '当前环境不支持文件下载，请长按下方 JSON 文本复制保存。',
      copyFallbackDefault: '若自动复制失败，请长按上方文字手动复制',
      manualCopy: '请长按文字手动复制'
    },
    site: {
      unnamed: '未命名站点',
      secondsLeft: '{n}s 后刷新',
      copiedCode: '已复制验证码',
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
      algo: '哈希算法',
      digits: '验证码位数',
      period: '刷新步长',
      color: '图标颜色',
      quick: '快速录入',
      uploadQr: '上传二维码图片',
      uploadQrSub: '支持相册截图 / 电脑本地图片',
      pasteUri: '粘贴 otpauth URI',
      pasteUriSub: '含 otpauth://totp/... 的完整链接',
      pastePh: '粘贴 otpauth://totp/... 开头的完整 URI',
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
      copyright: '© 2026 TOTP 验证器 · 保留所有权利',
      note: '本工具为开源前端应用，所有数据仅存储于您的本地设备',
      langLabel: '语言'
    },
    legal: {
      privacyTitle: '隐私政策',
      disclaimerTitle: '免责声明',
      updated: '最后更新：2026-07-21'
    }
  },
  en: {
    brand: 'TOTP Authenticator',
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
      home: 'Home'
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
      addSite: 'Add Site'
    },
    toast: {
      saved: 'Saved',
      noSiteExport: 'No sites to export',
      exported: 'Exported {n} site(s)',
      importAllExist: 'All sites already exist — nothing to import',
      imported: 'Successfully imported {n} site(s)',
      importFailed: 'Import failed: {msg}'
    },
    confirm: {
      deleteTitle: 'Delete Site',
      deleteMsg: 'Are you sure you want to delete this site?'
    },
    wechat: {
      downloadHint: 'Direct file download is not supported in WeChat. Long-press the JSON text below to copy, then save it to "File Transfer" or WeChat Notes as a backup.',
      fallbackHint: 'File download is not supported in the current environment. Long-press the JSON text below to copy and save.',
      copyFallbackDefault: 'If auto-copy fails, long-press the text above to copy manually.',
      manualCopy: 'Please long-press the text to copy manually'
    },
    site: {
      unnamed: 'Unnamed site',
      secondsLeft: 'Refreshes in {n}s',
      copiedCode: 'Code copied',
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
      algo: 'Hash algorithm',
      digits: 'Code digits',
      period: 'Refresh interval',
      color: 'Icon color',
      quick: 'Quick Import',
      uploadQr: 'Upload QR image',
      uploadQrSub: 'Album screenshot / local image',
      pasteUri: 'Paste otpauth URI',
      pasteUriSub: 'Full link starting with otpauth://totp/...',
      pastePh: 'Paste the full URI starting with otpauth://totp/...',
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
      copyright: '© 2026 TOTP Authenticator · All Rights Reserved',
      note: 'This tool is an open-source front-end app. All data is stored only on your local device.',
      langLabel: 'Language'
    },
    legal: {
      privacyTitle: 'Privacy Policy',
      disclaimerTitle: 'Disclaimer',
      updated: 'Last updated: 2026-07-21'
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
