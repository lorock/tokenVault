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
        <button class="nav-btn" :title="t('nav.switchTheme')" @click="onTheme">
          <van-icon name="bulb-o" />
        </button>
        <button class="nav-btn" :title="t('nav.export')" @click="exportBackup">
          <van-icon name="upgrade" />
        </button>
        <button class="nav-btn" :title="t('nav.import')" @click="importBackup">
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

    <SiteList
      v-else
      :sites="sites"
      :now="now"
      @edit="editSite"
      @share="shareSite"
      @delete="deleteSite"
      @advance="advanceCounter"
    />

    <button class="fab-add" :title="t('nav.addSite')" @click="addSite">+</button>

    <SiteFormDialog v-model="formVisible" :editing="editingSite" @save="saveSite" @delete="deleteSite" />
    <ShareQrDialog v-model="shareVisible" :site="shareSiteData" />
    <CopyFallbackOverlay />

    <input ref="importInput" type="file" accept="application/json,.json" hidden @change="handleImportFile" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import SiteList from '../components/SiteList.vue'
import SiteFormDialog from '../components/SiteFormDialog.vue'
import ShareQrDialog from '../components/ShareQrDialog.vue'
import CopyFallbackOverlay from '../components/CopyFallbackOverlay.vue'
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
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 500)
})
onUnmounted(() => clearInterval(timer))

function persist() {
  try {
    saveSites(sites.value)
  } catch {
    // 隐私模式 / 配额耗尽 / 存储被禁用：保存失败不应让主流程崩溃
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
    sites.value.push({ id: uid(), ...payload })
  }
  persist()
  showToast(t('toast.saved'))
}

async function deleteSite(id) {
  if (!id) return
  try {
    await showConfirmDialog({ title: t('confirm.deleteTitle'), message: t('confirm.deleteMsg') })
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
        color: s.color
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

import { openCopyFallback } from '../lib/clipboard'
</script>

<style scoped>
.home {
  flex: 1 0 auto;
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
  font-size: 12px;
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
  font-size: 12px;
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
  font-size: 19px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 10px;
}
.empty-desc {
  font-size: 14px;
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
</style>
