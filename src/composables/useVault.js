// 保险库单例 store：管理解锁状态、内存中的 DEK 与已解密站点、自动锁。
// 站点数据仅在解锁后驻留内存；锁屏即清除 DEK 与站点，杜绝明文驻留。
import { ref, computed } from 'vue'
import {
  setupVault,
  unlockWithPassword,
  unlockWithBiometric,
  encryptSites,
  decryptSites,
  changePassword,
  isVaultSet,
  isBiometricEnrolled,
  supportsBiometric,
  enrollBiometricWithDek,
  removeBiometric,
  clearVault,
  peekLegacy
} from '../lib/vault'
import { normalizeSite } from '../lib/storage'

// 模块级（非响应式）保存 DEK，避免被 Vue 代理包裹影响性能/安全
let dek = null

const unlocked = ref(false)
const busy = ref(false)
const error = ref('')
const sites = ref([])
const hasLegacy = ref(false)
const pendingLegacy = ref(null)
const bioAvailable = ref(false)
const bioEnrolled = ref(false)
// 是否有「进行中的编辑」（添加/编辑站点表单、导入选择、设置面板打开）。
// 为 true 时推迟自动锁，避免在用户尚未保存时清掉内存里的在填数据导致丢失。
const editing = ref(false)

function refreshBioFlags() {
  bioAvailable.value = supportsBiometric()
  bioEnrolled.value = isBiometricEnrolled()
}

async function loadIntoSites() {
  sites.value = (await decryptSites(dek)).map(normalizeSite)
}

export function useVault() {
  const locked = computed(() => !unlocked.value)

  function init() {
    refreshBioFlags()
    // 探测旧版明文数据，供设置主密码时迁移（仅读不删，避免中途放弃丢失）
    try {
      const legacy = peekLegacy()
      if (Array.isArray(legacy) && legacy.length) {
        hasLegacy.value = true
        pendingLegacy.value = legacy
      }
    } catch {
      hasLegacy.value = false
    }
  }

  async function setup(password) {
    busy.value = true
    error.value = ''
    try {
      dek = await setupVault(password)
      const legacy = pendingLegacy.value || []
      sites.value = legacy.map(normalizeSite)
      if (sites.value.length) await encryptSites(dek, sites.value)
      pendingLegacy.value = null
      hasLegacy.value = false
      unlocked.value = true
      refreshBioFlags()
    } catch (e) {
      error.value = e && e.message === 'crypto_unavailable' ? 'crypto_unavailable' : 'setup_failed'
      throw e
    } finally {
      busy.value = false
    }
  }

  async function unlock(password) {
    busy.value = true
    error.value = ''
    try {
      dek = password ? await unlockWithPassword(password) : await unlockWithBiometric()
      await loadIntoSites()
      unlocked.value = true
      refreshBioFlags()
    } catch (e) {
      dek = null
      const m = e && e.message
      error.value =
        m === 'bad_password'
          ? 'bad_password'
          : m === 'crypto_unavailable'
            ? 'crypto_unavailable'
            : 'unlock_failed'
      throw e
    } finally {
      busy.value = false
    }
  }

  async function unlockBio() {
    return unlock(null)
  }

  function lock() {
    dek = null
    sites.value = []
    unlocked.value = false
    error.value = ''
  }

  function setEditing(v) {
    editing.value = !!v
  }

  async function setSites(next) {
    if (!dek) return false
    sites.value = next
    try {
      await encryptSites(dek, next)
      return true
    } catch {
      return false
    }
  }

  async function changePw(oldPw, newPw) {
    dek = await changePassword(oldPw, newPw)
  }

  async function enrollBio() {
    if (!dek) throw new Error('locked')
    await enrollBiometricWithDek(dek)
    refreshBioFlags()
  }

  async function removeBio() {
    await removeBiometric()
    refreshBioFlags()
  }

  async function verifyPassword(password) {
    try {
      await unlockWithPassword(password)
      return true
    } catch {
      return false
    }
  }

  function reset() {
    clearVault()
    lock()
    pendingLegacy.value = null
    hasLegacy.value = false
    refreshBioFlags()
  }

  return {
    unlocked,
    locked,
    busy,
    error,
    sites,
    hasLegacy,
    bioAvailable,
    bioEnrolled,
    editing,
    init,
    setup,
    unlock,
    unlockBio,
    lock,
    setEditing,
    setSites,
    changePw,
    enrollBio,
    removeBio,
    verifyPassword,
    reset,
    isVaultSet
  }
}
