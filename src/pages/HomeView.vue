<template>
  <div class="home">
    <van-nav-bar :border="false">
      <template #title>
        <span class="brand-title">{{ t('brand') }}</span>
      </template>
      <template #right>
        <button class="nav-btn" :title="t('nav.lang')" @click="toggleLang">
          <span class="lang-pill">{{ locale === 'zh' ? 'EN' : '中' }}</span>
        </button>
        <button class="nav-btn icon-btn" :title="t('nav.switchTheme')" @click="onTheme">
          <van-icon name="bulb-o" />
        </button>
        <button class="nav-btn icon-btn" :title="t('nav.export')" @click="exportBackup">
          <van-icon name="upgrade" />
        </button>
        <button class="nav-btn icon-btn" :title="t('nav.import')" @click="importBackup">
          <van-icon name="down" />
        </button>
      </template>
    </van-nav-bar>

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

    <button class="fab-add" :title="t('nav.addSite')" @click="addSite">+</button>

    <SiteFormDialog v-model="formVisible" :editing="editingSite" @save="saveSite" @delete="deleteSite" />
    <ShareQrDialog v-model="shareVisible" :site="shareSiteData" />
    <CopyFallbackOverlay />

    <input ref="importInput" type="file" accept="application/json,.json" hidden @change="handleImportFile" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import SiteList from '../components/SiteList.vue'
import SiteFormDialog from '../components/SiteFormDialog.vue'
import ShareQrDialog from '../components/ShareQrDialog.vue'
import CopyFallbackOverlay from '../components/CopyFallbackOverlay.vue'
import { openCopyFallback } from '../lib/clipboard'
import { loadSites, saveSites, uid, isStorageAvailable, normalizeSite } from '../lib/storage'
import { useTheme } from '../composables/useTheme'
import { useI18n } from '../composables/useI18n'

const themeApi = useTheme()
const resolved = themeApi.resolved
const { locale, t, setLocale } = useI18n()

function toggleLang() {
  setLocale(locale.value === 'zh' ? 'en' : 'zh')
}

const sites = ref(loadSites())
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

function persist() {
  const ok = saveSites(sites.value)
  if (!ok) {
    showToast(t('toast.saveFailed'))
  }
}

function addSite() {
  editingSite.value = null
  formVisible.value = true
}

function editSite(site) {
  editingSite.value = site
  formVisible.value = true
}

function saveSite(payload) {
  if (payload.id) {
    const idx = sites.value.findIndex((s) => s.id === payload.id)
    if (idx >= 0) sites.value[idx] = { ...sites.value[idx], ...payload }
  } else {
    sites.value.push({ ...payload, id: uid(), createdAt: Date.now() })
  }
  persist()
  showToast(t('toast.saved'))
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

async function handleImportFile(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!data.sites || !Array.isArray(data.sites)) {
      throw new Error('无效的备份文件：缺少 sites 字段')
    }
    // 去重键 = [issuer, account, secret] 的序列化；含密钥可避免「同名不同密钥」被误判重复。
    // 用 JSON.stringify 而非 || 拼接，防止 issuer/account 含分隔符时产生碰撞误判。
    const keyOf = (s) => JSON.stringify([s.issuer, s.account, s.secret])
    const existingKeys = new Set(sites.value.map(keyOf))
    const normalized = data.sites
      .filter((s) => s && s.secret)
      .map((s) => normalizeSite(s))
    const unique = normalized.filter((s) => !existingKeys.has(keyOf(s)))
    if (unique.length === 0) {
      return showToast(t('toast.importAllExist'))
    }
    sites.value.push(...unique)
    persist()
    showToast(t('toast.imported', { n: unique.length }))
  } catch (err) {
    showToast(t('toast.importFailed', { msg: err.message }))
  }
  e.target.value = ''
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
</style>
