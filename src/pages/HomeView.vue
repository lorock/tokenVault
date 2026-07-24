<template>
  <div class="home">
    <van-nav-bar :border="false">
      <template #left>
        <button
          class="nav-btn icon-btn menu-btn"
          :title="t('nav.menu')"
          :aria-label="t('nav.menu')"
          :aria-expanded="drawer"
          @click="drawer = true"
        >
          <svg class="menu-ico" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
        <span class="brand-title">{{ t('brand') }}</span>
      </template>
    </van-nav-bar>

    <!-- 侧边抽屉：将原本头部 6 个操作按钮收纳进可滚动面板，窄屏不再截断 -->
    <van-popup
      v-model:show="drawer"
      position="left"
      class="side-drawer"
      :style="{ width: '78%', maxWidth: '320px' }"
      :aria-label="t('nav.menu')"
    >
      <div class="drawer-head">
        <span class="brand-title">{{ t('brand') }}</span>
      </div>
      <nav class="drawer-menu" aria-label="menu">
        <button type="button" class="drawer-item" @click="onMenu('add')">
          <van-icon name="plus" />{{ t('nav.addSite') }}
        </button>
        <button type="button" class="drawer-item" @click="onMenu('import')">
          <van-icon name="down" />{{ t('nav.import') }}
        </button>
        <button type="button" class="drawer-item" @click="onMenu('export')">
          <van-icon name="upgrade" />{{ t('nav.export') }}
        </button>
        <button type="button" class="drawer-item" @click="onMenu('settings')">
          <van-icon name="setting-o" />{{ t('nav.settings') }}
        </button>
        <button type="button" class="drawer-item" @click="onMenu('theme')">
          <van-icon name="bulb-o" />{{ t('nav.switchTheme') }}
        </button>
        <button type="button" class="drawer-item" @click="onMenu('lang')">
          <span class="drawer-lang-pill">{{ locale === 'zh' ? 'EN' : '中' }}</span>{{ t('nav.lang') }}
        </button>
        <button type="button" class="drawer-item drawer-item-danger" @click="onMenu('lock')">
          <van-icon name="lock" />{{ t('nav.lock') }}
        </button>
      </nav>
      <div class="drawer-sep"></div>
      <nav class="drawer-menu" aria-label="legal">
        <router-link class="drawer-item" to="/privacy" @click="drawer = false">{{ t('footer.privacy') }}</router-link>
        <router-link class="drawer-item" to="/disclaimer" @click="drawer = false">{{ t('footer.disclaimer') }}</router-link>
      </nav>
    </van-popup>

    <div v-if="storageOk ? !riskDismissed : true" class="risk-banner">
      <van-icon name="warning-o" class="risk-icon" />
      <span class="risk-text">{{ storageOk ? t('home.riskLocal') : t('home.riskDisabled') }}</span>
      <button class="risk-action" @click="exportBackup">{{ t('home.riskExport') }}</button>
      <button v-if="storageOk" class="risk-close" :title="t('home.riskDismiss')" @click="dismissRisk">×</button>
    </div>

    <div v-if="sites.length === 0" class="empty">
      <div class="empty-icon">
        <van-icon name="shield-o" />
      </div>
      <div class="empty-title">{{ t('home.emptyTitle') }}</div>
      <div class="empty-desc">{{ t('home.emptyDesc') }}</div>
      <van-button round type="primary" class="empty-btn" @click="addSite">
        <van-icon name="plus" /> {{ t('home.addSite') }}
      </van-button>
    </div>

    <template v-else>
      <div class="toolbar">
        <div class="search-box">
          <van-icon name="search" class="search-icon" />
          <input
            v-model="searchQuery"
            class="search-input"
            type="text"
            inputmode="search"
            :placeholder="t('home.searchPh')"
            :aria-label="t('home.search')"
          />
          <button
            v-if="searchQuery"
            class="search-clear"
            type="button"
            :title="t('home.clearSearch')"
            @click="searchQuery = ''"
          >
            <van-icon name="cross" />
          </button>
        </div>

        <div class="sort-wrap">
          <button
            class="sort-btn"
            type="button"
            :title="t('home.sort')"
            :aria-expanded="sortMenuOpen"
            @click="sortMenuOpen = !sortMenuOpen"
          >
            <van-icon name="sort" />
            <span class="sort-label">{{ sortLabel }}</span>
            <van-icon :name="sortMenuOpen ? 'arrow-up' : 'arrow-down'" class="sort-caret" />
          </button>

          <transition name="pop">
            <div v-if="sortMenuOpen" class="sort-menu" role="menu">
              <button
                v-for="opt in sortOptions"
                :key="opt"
                class="sort-item"
                type="button"
                :class="{ active: sortBy === opt }"
                role="menuitem"
                @click="selectSort(opt)"
              >
                <span>{{ sortText(opt) }}</span>
                <van-icon v-if="sortBy === opt" name="success" />
              </button>
            </div>
          </transition>
        </div>
      </div>

      <div v-if="visibleSites.length === 0" class="no-result">
        <div class="no-result-icon"><van-icon name="search" /></div>
        <div class="no-result-title">{{ t('home.noResult') }}</div>
        <div class="no-result-desc">{{ t('home.noResultDesc') }}</div>
        <van-button round plain class="no-result-btn" @click="searchQuery = ''">
          {{ t('home.clearSearch') }}
        </van-button>
      </div>

      <SiteList
        v-else
        :sites="visibleSites"
        :now="now"
        @edit="editSite"
        @share="shareSite"
        @delete="deleteSite"
        @advance="advanceCounter"
      />
    </template>

    <div v-if="sortMenuOpen" class="sort-mask" @click="sortMenuOpen = false"></div>

    <button class="fab-add" :title="t('nav.addSite')" :aria-label="t('nav.addSite')" @click="addSite">+</button>

    <SiteFormDialog v-model="formVisible" :editing="editingSite" @save="saveSite" @delete="deleteSite" />
    <ShareQrDialog v-model="shareVisible" :site="shareSiteData" />
    <CopyFallbackOverlay />

    <van-popup v-model:show="importPopup" position="bottom" round :style="{ padding: '18px 16px calc(18px + env(safe-area-inset-bottom))' }">
      <div class="import-pop">
        <div class="import-pop-title">{{ t('import.title', { n: importCount }) }}</div>
        <div class="import-pop-desc">{{ t('import.desc') }}</div>
        <van-button block type="primary" class="import-pop-btn" @click="mergeImport">
          {{ t('import.merge', { n: importCount }) }}
        </van-button>
        <van-button block type="danger" plain class="import-pop-btn" @click="replaceImport">
          {{ t('import.replace') }}
        </van-button>
        <van-button block plain class="import-pop-btn ghost" @click="importPending = null">
          {{ t('common.cancel') }}
        </van-button>
      </div>
    </van-popup>

    <van-popup v-model:show="settingsPopup" position="bottom" round :style="{ padding: '18px 16px calc(18px + env(safe-area-inset-bottom))' }">
      <div class="set-pop">
        <div class="set-title">{{ t('settings.title') }}</div>

        <div class="set-section">
          <div class="set-section-title">{{ t('settings.bioTitle') }}</div>
          <template v-if="!vault.bioAvailable.value">
            <div class="set-hint">{{ t('settings.bioUnsupported') }}</div>
          </template>
          <template v-else-if="!vault.bioEnrolled.value">
            <button class="set-btn primary" :disabled="settingsBusy" @click="enableBio">
              {{ t('settings.bioEnable') }}
            </button>
          </template>
          <template v-else>
            <div class="set-row-between">
              <span class="set-ok">{{ t('settings.bioEnabled') }}</span>
              <button class="set-btn danger" :disabled="settingsBusy" @click="disableBio">
                {{ t('settings.bioDisable') }}
              </button>
            </div>
          </template>
        </div>

        <div class="set-section">
          <div class="set-section-title">{{ t('settings.pwTitle') }}</div>
          <input
            v-model="pwOld"
            class="set-input"
            type="password"
            autocomplete="current-password"
            :placeholder="t('settings.pwCurrent')"
            :aria-label="t('settings.pwCurrent')"
            @keyup.enter="savePassword"
          />
          <input
            v-model="pwNew"
            class="set-input"
            type="password"
            autocomplete="new-password"
            :placeholder="t('settings.pwNew')"
            :aria-label="t('settings.pwNew')"
            @keyup.enter="savePassword"
          />
          <input
            v-model="pwNew2"
            class="set-input"
            type="password"
            autocomplete="new-password"
            :placeholder="t('settings.pwConfirm')"
            :aria-label="t('settings.pwConfirm')"
            @keyup.enter="savePassword"
          />
          <div v-if="settingsError" class="set-error">{{ settingsError }}</div>
          <button class="set-btn primary" :disabled="settingsBusy" @click="savePassword">
            {{ t('settings.pwSave') }}
          </button>
        </div>

        <div class="set-section set-section-danger">
          <div class="set-section-title">{{ t('settings.resetTitle') }}</div>
          <div class="set-hint">{{ t('settings.resetHint') }}</div>
          <div class="set-row-between">
            <button class="set-btn ghost" :disabled="settingsBusy" @click="exportBackup">
              {{ t('settings.resetExport') }}
            </button>
            <button class="set-btn danger" :disabled="settingsBusy" @click="startReset">
              {{ t('settings.resetBtn') }}
            </button>
          </div>

          <template v-if="resetStep === 'confirm'">
            <div class="set-divider"></div>
            <div class="set-hint warn">{{ t('settings.resetPwHint') }}</div>
            <input
              ref="resetPwEl"
              v-model="resetPw"
              class="set-input"
              :class="{ pulse: resetPulse }"
              type="password"
              autocomplete="current-password"
              :placeholder="t('settings.resetPwPh')"
              :aria-label="t('settings.resetPwPh')"
              :aria-invalid="!!resetError"
              @keyup.enter="confirmReset"
              @animationend="resetPulse = false"
            />
            <div v-if="resetError" class="set-error">{{ resetError }}</div>
            <div class="set-row-between">
              <button class="set-btn ghost" :disabled="settingsBusy" @click="cancelReset">
                {{ t('settings.resetCancel') }}
              </button>
              <button class="set-btn danger" :disabled="settingsBusy || !resetPw" @click="confirmReset">
                {{ t('settings.resetConfirm') }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </van-popup>

    <input ref="importInput" type="file" accept="application/json,.json" hidden @change="handleImportFile" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed, watch, nextTick, defineAsyncComponent } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import SiteList from '../components/SiteList.vue'
import CopyFallbackOverlay from '../components/CopyFallbackOverlay.vue'
import { openCopyFallback } from '../lib/clipboard'
import { uid, isStorageAvailable, normalizeSite, resolveImport } from '../lib/storage'
import { useVault } from '../composables/useVault'
import { useTheme } from '../composables/useTheme'
import { useI18n } from '../composables/useI18n'

// 表单与分享弹窗含较重依赖（jsQR/qrcode），按需懒加载以减小首屏体积
const SiteFormDialog = defineAsyncComponent(() => import('../components/SiteFormDialog.vue'))
const ShareQrDialog = defineAsyncComponent(() => import('../components/ShareQrDialog.vue'))

const themeApi = useTheme()
const resolved = themeApi.resolved
const vault = useVault()
const { locale, t, setLocale } = useI18n()

function toggleLang() {
  setLocale(locale.value === 'zh' ? 'en' : 'zh')
}

const sites = vault.sites
const now = ref(Date.now())

// 搜索 + 排序状态
const searchQuery = ref('')
const sortBy = ref('name') // 'name' | 'recent' | 'type'
const sortMenuOpen = ref(false)
const sortOptions = ['name', 'recent', 'type']
function sortText(opt) {
  return {
    name: t('home.sortName'),
    recent: t('home.sortRecent'),
    type: t('home.sortType')
  }[opt]
}
function selectSort(opt) {
  sortBy.value = opt
  sortMenuOpen.value = false
}

// 过滤（按名称/账户实时搜索）→ 排序，纯前端计算，数百条无压力
const sortLabel = computed(() => sortText(sortBy.value))
const visibleSites = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  let list = sites.value
  if (q) {
    list = list.filter(
      (s) =>
        (s.issuer || '').toLowerCase().includes(q) ||
        (s.account || '').toLowerCase().includes(q)
    )
  }
  const arr = list.slice()
  const loc = locale.value === 'zh' ? 'zh-CN' : 'en'
  if (sortBy.value === 'name') {
    arr.sort(
      (a, b) =>
        (a.issuer || '').localeCompare(b.issuer || '', loc) ||
        (a.account || '').localeCompare(b.account || '', loc)
    )
  } else if (sortBy.value === 'recent') {
    arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  } else if (sortBy.value === 'type') {
    const rank = (tp) => (tp === 'hotp' ? 1 : 0)
    arr.sort(
      (a, b) => rank(a.type) - rank(b.type) || (a.issuer || '').localeCompare(b.issuer || '', loc)
    )
  }
  return arr
})
const formVisible = ref(false)
const editingSite = ref(null)
const shareVisible = ref(false)
const shareSiteData = ref(null)
const importInput = ref(null)
const drawer = ref(false)

const storageOk = isStorageAvailable()
let dismissed = false
try {
  dismissed = localStorage.getItem('totp_risk_dismissed') === '1'
} catch {
  // 存储不可用时视为未关闭提示
}
const riskDismissed = ref(dismissed)
function dismissRisk() {
  riskDismissed.value = true
  try { localStorage.setItem('totp_risk_dismissed', '1') } catch {}
}

let timer = null
function onVisibilityChange() {
  if (!document.hidden) {
    now.value = Date.now()
  }
}
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 500)
  document.addEventListener('visibilitychange', onVisibilityChange)
})
onUnmounted(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

async function persist() {
  const ok = await vault.setSites(sites.value)
  if (ok === false) {
    showToast(t('toast.saveFailed'))
    return false
  }
  return true
}

function addSite() {
  editingSite.value = null
  formVisible.value = true
}

function editSite(site) {
  editingSite.value = site
  formVisible.value = true
}

async function saveSite(payload) {
  if (payload.id) {
    const idx = sites.value.findIndex((s) => s.id === payload.id)
    if (idx >= 0) sites.value[idx] = { ...sites.value[idx], ...payload }
  } else {
    sites.value.push({ ...payload, id: uid(), createdAt: Date.now() })
  }
  const ok = await persist()
  // 仅在真正落盘成功时才提示「已保存」，避免保存失败时仍显示成功误导用户
  if (ok) showToast(t('toast.saved'))
}

async function deleteSite(id) {
  if (!id) return
  const s = sites.value.find((x) => x.id === id)
  const name = s ? s.issuer || s.account : ''
  try {
    await showConfirmDialog({
      title: t('confirm.deleteTitle'),
      message: name ? t('site.confirmDeleteMsg', { name }) : t('confirm.deleteMsg')
    })
  } catch {
    return
  }
  sites.value = sites.value.filter((s) => s.id !== id)
  persist()
}

function shareSite(site) {
  shareSiteData.value = site
  shareVisible.value = true
}

// HOTP：使用一次验证码后推进计数器，保证下次生成不同口令
function advanceCounter(id) {
  const s = sites.value.find((x) => x.id === id)
  if (!s) return
  s.counter = (s.counter || 0) + 1
  persist()
}

function onTheme() {
  themeApi.cycle()
  showToast(t('theme.toast', { label: t('theme.' + themeApi.label()) }))
}

// 手动锁：用户主动点🔒。若正处于编辑中（添加/编辑表单、导入、设置打开），
// 先确认——避免静默丢弃未保存数据（自动锁走的是「推迟」策略，手动锁走「确认」策略）。
async function lockApp() {
  if (vault.editing.value) {
    try {
      await showConfirmDialog({
        title: t('confirm.lockEditingTitle'),
        message: t('confirm.lockEditingMsg')
      })
    } catch {
      return // 用户取消：留在编辑态，不锁
    }
  }
  vault.lock()
}

// 侧边抽屉菜单：把原本头部的操作收纳进抽屉，点击任一项先收起抽屉再执行对应动作
function onMenu(action) {
  drawer.value = false
  if (action === 'add') addSite()
  else if (action === 'import') importBackup()
  else if (action === 'export') exportBackup()
  else if (action === 'settings') openSettings()
  else if (action === 'theme') onTheme()
  else if (action === 'lang') toggleLang()
  else if (action === 'lock') lockApp()
}

function exportBackup() {
  if (sites.value.length === 0) return showToast(t('toast.noSiteExport'))
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      siteCount: sites.value.length,
      sites: sites.value.map((s) => ({
        issuer: s.issuer,
        account: s.account,
        secret: s.secret,
        algo: s.algo,
        digits: s.digits,
        period: s.period,
        type: s.type,
        counter: s.counter,
        color: s.color,
        createdAt: s.createdAt
      }))
    }
  const json = JSON.stringify(backup, null, 2)
  const isWeChat = /micromessenger/i.test(navigator.userAgent)
  if (isWeChat) {
    openCopyFallback(json, t('wechat.downloadHint'))
    return
  }
  try {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    a.download = `totp-backup-${ts}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast(t('toast.exported', { n: sites.value.length }))
  } catch {
    openCopyFallback(json, t('wechat.fallbackHint'))
  }
}

function importBackup() {
  importInput.value && importInput.value.click()
}

// 导入合并/覆盖：暂存待导入站点，弹出选择
// importPending = 文件中的「新增」站点（用于合并追加与计数）；
// importFull = 文件全部归一化站点（用于「覆盖全部」时还原成文件完整内容）
const importPending = ref(null)
const importFull = ref(null)

async function handleImportFile(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!data.sites || !Array.isArray(data.sites)) {
      throw new Error('无效的备份文件：缺少 sites 字段')
    }
    const normalized = data.sites
      .filter((s) => s && s.secret)
      .map((s) => normalizeSite(s))
    const { full, unique } = resolveImport(sites.value, normalized)
    if (unique.length === 0) {
      return showToast(t('toast.importAllExist'))
    }
    importFull.value = full
    // 已有站点时，询问合并还是覆盖，避免误清数据
    if (sites.value.length > 0) {
      importPending.value = unique
    } else {
      await applyImport(full)
    }
  } catch (err) {
    showToast(t('toast.importFailed', { msg: err.message }))
  }
  e.target.value = ''
}

async function applyImport(list, replace = false) {
  if (replace) {
    sites.value = list
  } else {
    sites.value.push(...list)
  }
  importPending.value = null
  importFull.value = null
  await persist()
  showToast(t('toast.imported', { n: list.length }))
}

function mergeImport() {
  if (!importPending.value) return
  applyImport(importPending.value, false)
}
async function replaceImport() {
  if (!importFull.value) return
  // 覆盖全部属于破坏性操作（清空现有数据），在「合并/覆盖」选择之外再做一次强提示，
  // 避免用户误触导致数据不可逆丢失。确认后才用文件完整内容替换当前保险库。
  try {
    await showConfirmDialog({
      title: t('import.replaceConfirmTitle'),
      message: t('import.replaceConfirmMsg', {
        existing: sites.value.length,
        incoming: importFull.value.length
      }),
      confirmButtonText: t('import.replace'),
      cancelButtonText: t('common.cancel'),
      confirmButtonColor: '#e53e3e'
    })
    applyImport(importFull.value, true)
  } catch {
    // 用户取消：保留底部弹窗，等待重新选择合并或取消
  }
}

const importCount = computed(() => (importPending.value ? importPending.value.length : 0))
const importPopup = computed({
  get: () => !!importPending.value,
  set: (v) => {
    if (!v) importPending.value = null
  }
})

// 安全设置面板：修改主密码 + 管理生物识别（需已解锁，DEK 已在内存）
const settingsPopup = ref(false)

// 任意「进行中编辑」弹窗打开时，告知 vault 推迟自动锁，
// 避免选图/切后台触发自动锁把尚未保存的在填数据清掉（见 useVault.editing / App.onVisibility）。
watch(
  () => formVisible.value || settingsPopup.value || importPopup.value,
  (open) => vault.setEditing(open),
  { immediate: true }
)
const settingsBusy = ref(false)
const settingsError = ref('')
const pwOld = ref('')
const pwNew = ref('')
const pwNew2 = ref('')
const resetStep = ref('idle')
const resetPw = ref('')
const resetError = ref('')
const resetPwEl = ref(null)
const resetPulse = ref(false)

function triggerPulse() {
  resetPulse.value = false
  nextTick(() => {
    resetPulse.value = true
    if (resetPwEl.value) resetPwEl.value.focus()
  })
}

function openSettings() {
  settingsError.value = ''
  pwOld.value = ''
  pwNew.value = ''
  pwNew2.value = ''
  resetStep.value = 'idle'
  resetPw.value = ''
  resetError.value = ''
  settingsPopup.value = true
}

async function savePassword() {
  settingsError.value = ''
  if (pwNew.value.length < 4) {
    settingsError.value = t('settings.pwTooShort')
    return
  }
  if (pwNew.value !== pwNew2.value) {
    settingsError.value = t('settings.pwMismatch')
    return
  }
  settingsBusy.value = true
  try {
    await vault.changePw(pwOld.value, pwNew.value)
    pwOld.value = ''
    pwNew.value = ''
    pwNew2.value = ''
    settingsPopup.value = false
    showToast(t('settings.pwChanged'))
  } catch {
    settingsError.value = t('settings.pwWrong')
  } finally {
    settingsBusy.value = false
  }
}

async function enableBio() {
  settingsError.value = ''
  settingsBusy.value = true
  try {
    await vault.enrollBio()
    showToast(t('settings.bioEnabled'))
  } catch {
    settingsError.value = t('settings.bioEnrollFailed')
  } finally {
    settingsBusy.value = false
  }
}

async function disableBio() {
  settingsBusy.value = true
  try {
    await vault.removeBio()
    showToast(t('settings.bioRemoved'))
  } finally {
    settingsBusy.value = false
  }
}

async function confirmReset() {
  resetError.value = ''
  if (!resetPw.value) return
  settingsBusy.value = true
  try {
    const ok = await vault.verifyPassword(resetPw.value)
    if (!ok) {
      resetError.value = t('settings.resetPwWrong')
      triggerPulse()
      return
    }
    vault.reset()
    resetStep.value = 'idle'
    resetPw.value = ''
    settingsPopup.value = false
    showToast(t('settings.resetDone'))
    // reset() 已调用 lock()，App.vue 会自动回到锁屏（显示设置主密码）
  } finally {
    settingsBusy.value = false
  }
}

function startReset() {
  resetError.value = ''
  resetPw.value = ''
  resetPulse.value = false
  resetStep.value = 'confirm'
}

function cancelReset() {
  resetStep.value = 'idle'
  resetPw.value = ''
  resetError.value = ''
}

</script>

<style scoped>
.home {
  flex: 1 0 auto;
}
.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: transform 0.18s ease, background-color 0.18s ease;
}
.nav-btn.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  padding: 0;
}
.nav-btn.icon-btn .van-icon {
  font-size: 20px;
  color: var(--text);
}
.nav-btn:hover {
  background: var(--accent-soft);
}
.nav-btn:active {
  transform: scale(0.9);
}
.lang-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 22px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 999px;
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.nav-btn:active .lang-pill {
  transform: scale(0.92);
}
.risk-banner {
  margin: 50px 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-size: var(--f-hint);
  line-height: 1.5;
  color: var(--text-2);
  background: var(--accent-soft);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
}
.risk-icon {
  color: var(--accent);
  flex-shrink: 0;
}
.risk-text {
  flex: 1;
  min-width: 0;
}
.risk-action {
  flex-shrink: 0;
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: var(--f-hint);
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.risk-action:active {
  transform: scale(0.94);
}
.risk-close {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: 18px;
  line-height: 1;
  padding: 0 2px;
  cursor: pointer;
}
.empty {
  text-align: center;
  padding: 96px 28px 72px;
  color: var(--text-2);
  animation: cardIn 0.5s var(--ease) both;
}
.empty-icon {
  width: 92px;
  height: 92px;
  margin: 0 auto 20px;
  border-radius: 30px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff;
  font-size: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 40px rgba(47, 107, 255, 0.32);
}
.empty-title {
  font-size: var(--f-title);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 10px;
}
.empty-desc {
  font-size: var(--f-body);
  line-height: 1.7;
  max-width: 300px;
  margin: 0 auto 26px;
}
.empty-btn {
  height: 44px;
  padding: 0 28px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(47, 107, 255, 0.35);
  transition: transform 0.2s var(--ease);
}
.empty-btn:active {
  transform: scale(0.97);
}
.toolbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 2px;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--card-border);
  transition: background-color 0.35s ease, border-color 0.35s ease;
}
.search-box {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 10px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 999px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.search-box:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.search-icon {
  color: var(--text-2);
  font-size: 16px;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: var(--f-body);
  font-family: var(--font-cn);
  line-height: 1.4;
}
.search-input::placeholder {
  color: var(--text-2);
  opacity: 0.85;
}
.search-clear {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: var(--card-border);
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
  transition: transform 0.18s ease;
}
.search-clear:active {
  transform: scale(0.9);
}
.sort-wrap {
  position: relative;
  flex-shrink: 0;
}
.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--input-border);
  border-radius: 999px;
  background: var(--input-bg);
  color: var(--text);
  font-size: var(--f-label);
  font-weight: 600;
  font-family: var(--font-cn);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.18s ease;
}
.sort-btn .van-icon {
  font-size: 15px;
  color: var(--text-2);
}
.sort-btn:hover {
  background: var(--accent-soft);
  border-color: var(--accent);
}
.sort-btn:active {
  transform: scale(0.96);
}
.sort-caret {
  font-size: 12px !important;
}
.sort-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 25;
  min-width: 148px;
  padding: 6px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.sort-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text);
  font-size: var(--f-label);
  font-family: var(--font-cn);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.18s ease;
}
.sort-item:hover {
  background: var(--accent-soft);
}
.sort-item.active {
  color: var(--accent);
  font-weight: 600;
}
.sort-item .van-icon {
  color: var(--accent);
  font-size: 15px;
}
.sort-mask {
  position: fixed;
  inset: 0;
  z-index: 15;
}
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s var(--ease);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
.no-result {
  text-align: center;
  padding: 80px 28px 60px;
  color: var(--text-2);
  animation: cardIn 0.4s var(--ease) both;
}
.no-result-icon {
  width: 76px;
  height: 76px;
  margin: 0 auto 18px;
  border-radius: 24px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.no-result-title {
  font-size: var(--f-subtitle);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}
.no-result-desc {
  font-size: var(--f-body);
  line-height: 1.7;
  max-width: 280px;
  margin: 0 auto 22px;
}
.no-result-btn {
  height: 40px;
  padding: 0 24px;
  font-weight: 600;
}

/* 导入合并 / 覆盖 选择弹窗（底部弹出，键盘可达） */
.import-pop {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.import-pop-title {
  font-size: var(--f-title);
  font-weight: 700;
  color: var(--text);
  line-height: 1.4;
}
.import-pop-desc {
  font-size: var(--f-body);
  color: var(--text-2);
  line-height: 1.6;
  margin-bottom: 4px;
}
.import-pop-btn {
  height: 44px;
  font-weight: 600;
  flex-shrink: 0;
}
.import-pop-btn.ghost {
  color: var(--text-2);
  border-color: var(--input-border);
}

/* 安全设置面板（底部弹出） */
.set-pop {
  display: flex;
  flex-direction: column;
}
.set-title {
  font-size: var(--f-title);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
}
.set-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 0;
  border-top: 1px solid var(--card-border);
}
.set-section-danger {
  margin: 0 -16px;
  padding: 16px;
  border-top: 1px solid var(--card-border);
  background: var(--danger-soft, rgba(229, 62, 62, 0.06));
}
.set-section-danger .set-section-title {
  color: var(--danger, #e53e3e);
}
.set-section-title {
  font-size: var(--f-label);
  font-weight: 700;
  color: var(--text-2);
  letter-spacing: 0.02em;
}
.set-input {
  height: 42px;
  padding: 0 14px;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  color: var(--text);
  font-size: var(--f-body);
  font-family: var(--font-cn);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.set-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.set-input.pulse {
  border-color: var(--danger, #e53e3e);
  animation: set-pulse 0.5s ease-out;
}
@keyframes set-pulse {
  0% {
    border-color: var(--danger, #e53e3e);
    box-shadow: 0 0 0 0 var(--danger-glow, rgba(239, 68, 68, 0.3));
  }
  70% {
    box-shadow: 0 0 0 5px transparent;
  }
  100% {
    border-color: var(--danger, #e53e3e);
    box-shadow: 0 0 0 0 transparent;
  }
}
@media (prefers-reduced-motion: reduce) {
  .set-input.pulse {
    animation: none;
  }
}
.set-hint {
  font-size: var(--f-hint);
  color: var(--text-2);
  line-height: 1.6;
}
.set-hint.warn {
  color: var(--danger, #e53e3e);
  font-weight: 600;
  margin-top: 2px;
}
.set-divider {
  height: 1px;
  background: var(--card-border);
  margin: 4px 0 2px;
}
.set-row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.set-ok {
  font-size: var(--f-body);
  color: var(--accent);
  font-weight: 600;
}
.set-error {
  font-size: var(--f-hint);
  color: var(--danger, #e53e3e);
  line-height: 1.5;
}
.set-btn {
  height: 44px;
  border-radius: var(--radius-sm);
  font-size: var(--f-body);
  font-weight: 600;
  font-family: var(--font-cn);
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.set-btn:active {
  transform: scale(0.98);
}
.set-btn:disabled {
  opacity: 0.55;
  cursor: default;
}
.set-btn.primary {
  background: var(--accent);
  color: #fff;
}
.set-btn.danger {
  background: transparent;
  color: var(--danger, #e53e3e);
  border-color: var(--danger, #e53e3e);
}
.set-btn.ghost {
  background: transparent;
  color: var(--text-2);
  border-color: var(--input-border);
}
</style>

<!-- 侧边抽屉样式需在全局作用域生效：van-popup 内容被 teleport 到 body，
     作用域样式可能无法命中弹层根节点，故用非 scoped 样式保证浅/深色主题下都正确 -->
<style>
/* 侧边抽屉（替代头部操作按钮，窄屏不再截断） */
.menu-btn {
  margin-right: 4px;
}
.menu-ico {
  display: block;
}
.side-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--card-bg);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.drawer-head {
  display: flex;
  align-items: center;
  padding: calc(18px + env(safe-area-inset-top, 0px)) 18px 14px;
  border-bottom: 1px solid var(--card-border);
}
.drawer-menu {
  display: flex;
  flex-direction: column;
  padding: 8px;
}
.drawer-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 13px 14px;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: var(--f-body);
  font-weight: 500;
  font-family: var(--font-cn);
  text-align: left;
  text-decoration: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.18s ease;
}
.drawer-item .van-icon {
  font-size: 20px;
  color: var(--accent);
  flex-shrink: 0;
}
.drawer-item:hover,
.drawer-item:active {
  background: var(--accent-soft);
}
.drawer-item-danger,
.drawer-item-danger .van-icon {
  color: var(--danger, #e53e3e);
}
.drawer-sep {
  height: 1px;
  background: var(--card-border);
  margin: 6px 14px;
}
.drawer-lang-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 22px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 999px;
}
</style>
