// 测试辅助：在 Node 环境注入浏览器全局（Web Crypto / localStorage），
// 使前端加密与存储模块可在 node:test 中直接运行，无需打包。

import { webcrypto } from 'node:crypto'

export function ensureCryptoGlobal() {
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    globalThis.crypto = webcrypto
  }
}

// 内存版 localStorage 垫片，行为对齐浏览器实现
export function installLocalStorageShim() {
  const store = new Map()
  const localStorage = {
    getItem(k) {
      return store.has(k) ? store.get(k) : null
    },
    setItem(k, v) {
      store.set(k, String(v))
    },
    removeItem(k) {
      store.delete(k)
    },
    clear() {
      store.clear()
    },
    key(i) {
      return Array.from(store.keys())[i] ?? null
    },
    get length() {
      return store.size
    }
  }
  globalThis.localStorage = localStorage
  return localStorage
}

export function clearVaultStorage() {
  try {
    localStorage.removeItem('totp_vault_v1')
    localStorage.removeItem('totp_sites_v1')
  } catch {}
}
