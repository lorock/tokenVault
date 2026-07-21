<template>
  <div class="home">
    <van-nav-bar :border="false">
      <template #title>
        <span class="brand-title">TOTP 验证器</span>
      </template>
      <template #right>
        <button class="nav-btn" title="切换主题" @click="onTheme">
          <van-icon name="bulb-o" />
        </button>
        <button class="nav-btn" title="导出备份" @click="exportBackup">
          <van-icon name="upgrade" />
        </button>
        <button class="nav-btn" title="导入备份" @click="importBackup">
          <van-icon name="down" />
        </button>
      </template>
    </van-nav-bar>

    <div v-if="storageOk ? !riskDismissed : true" class="risk-banner">
      <van-icon name="warning-o" class="risk-icon" />
      <span class="risk-text">{{ storageOk ? '数据仅保存在此设备本地，清理微信/浏览器缓存会丢失，建议定期导出备份。' : '当前环境无法保存数据（隐私模式/存储被禁用），请先「去导出」备份到别处。' }}</span>
      <button class="risk-action" @click="exportBackup">去导出</button>
      <button v-if="storageOk" class="risk-close" title="不再提示" @click="dismissRisk">×</button>
    </div>

    <div v-if="sites.length === 0" class="empty">
      <div class="empty-icon">
        <van-icon name="shield-o" />
      </div>
      <div class="empty-title">还没有站点</div>
      <div class="empty-desc">添加你的第一个两步验证站点，支持二维码图片扫描与 otpauth URI 粘贴。</div>
      <van-button round type="primary" class="empty-btn" @click="addSite">
        <van-icon name="plus" /> 添加站点
      </van-button>
    </div>

    <SiteList
      v-else
      :sites="sites"
      :now="now"
      @edit="editSite"
      @share="shareSite"
      @delete="deleteSite"
    />

    <button class="fab-add" title="添加站点" @click="addSite">+</button>

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
import { loadSites, saveSites, uid, isStorageAvailable } from '../lib/storage'
import { useTheme } from '../composables/useTheme'

const themeApi = useTheme()
const resolved = themeApi.resolved

const sites = ref(loadSites())
const now = ref(Date.now())
const formVisible = ref(false)
const editingSite = ref(null)
const shareVisible = ref(false)
const shareSiteData = ref(null)
const importInput = ref(null)

const storageOk = isStorageAvailable()
const riskDismissed = ref(localStorage.getItem('totp_risk_dismissed') === '1')
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
  saveSites(sites.value)
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
  showToast('已保存')
}

async function deleteSite(id) {
  if (!id) return
  try {
    await showConfirmDialog({ title: '删除站点', message: '确定删除该站点？' })
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

function onTheme() {
  themeApi.cycle()
  showToast('主题：' + themeApi.label())
}

function exportBackup() {
  if (sites.value.length === 0) return showToast('没有站点可导出')
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
      color: s.color
    }))
  }
  const json = JSON.stringify(backup, null, 2)
  const isWeChat = /micromessenger/i.test(navigator.userAgent)
  if (isWeChat) {
    openCopyFallback(
      json,
      '微信内不支持直接下载文件。请长按下方 JSON 文本复制，保存到「文件传输助手」或微信笔记中备份。'
    )
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
    showToast(`已导出 ${sites.value.length} 个站点`)
  } catch {
    openCopyFallback(json, '当前环境不支持文件下载，请长按下方 JSON 文本复制保存。')
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
    const existingKeys = new Set(
      sites.value.map((s) => `${s.issuer}||${s.account}||${s.secret}`)
    )
    const normalized = data.sites
      .filter((s) => s && s.secret)
      .map((s) => ({
        id: uid(),
        issuer: s.issuer || '',
        account: s.account || '',
        secret: String(s.secret).trim().toUpperCase(),
        algo: s.algo || 'SHA-1',
        digits: s.digits || 6,
        period: s.period || 30,
        color: s.color || '#4f8cff'
      }))
    const unique = normalized.filter(
      (s) => !existingKeys.has(`${s.issuer}||${s.account}||${s.secret}`)
    )
    if (unique.length === 0) {
      return showToast('所有站点已存在，无需导入')
    }
    sites.value.push(...unique)
    persist()
    showToast(`成功导入 ${unique.length} 个站点`)
  } catch (err) {
    showToast('导入失败: ' + err.message)
  }
  e.target.value = ''
}

import { openCopyFallback } from '../lib/clipboard'
</script>

<style scoped>
.home {
  flex: 1 0 auto;
}
.risk-banner {
  margin-top: 50px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-2);
  background: var(--accent-soft);
  border-bottom: 1px solid var(--card-border);
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
  padding: 110px 28px 80px;
  color: var(--text-2);
}
.empty-icon {
  width: 84px;
  height: 84px;
  margin: 0 auto 18px;
  border-radius: 26px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff;
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 38px rgba(47, 123, 255, 0.3);
}
.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 10px;
}
.empty-desc {
  font-size: 14px;
  line-height: 1.6;
  max-width: 320px;
  margin: 0 auto 24px;
}
.empty-btn {
  height: 42px;
  padding: 0 26px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(47, 123, 255, 0.35);
}
</style>
