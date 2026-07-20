// 本地存储：站点数据持久化到 localStorage
const KEY = 'totp_sites_v1'

export function loadSites() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function saveSites(sites) {
  localStorage.setItem(KEY, JSON.stringify(sites))
}

export function uid() {
  return 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// 检测 localStorage 是否可用（隐私模式 / 存储被禁用时会抛错）
export function isStorageAvailable() {
  try {
    const probe = '__totp_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}
