<template>
  <div class="site-card">
    <div class="sc-head">
      <div class="sc-avatar" :style="{ background: site.color || '#4f8cff' }">
        {{ initial }}
      </div>
      <div class="sc-meta">
        <div class="sc-issuer">{{ site.issuer || t('site.unnamed') }}</div>
        <div class="sc-account">{{ site.account }}</div>
      </div>
      <van-button size="mini" plain @click="$emit('edit', site)">{{ t('common.edit') }}</van-button>
    </div>

    <div class="sc-code mono grad-text" @click="copyCode">
      {{ code || '······' }}
    </div>

    <div class="sc-progress">
      <div class="sc-bar" :class="barState" :style="{ width: progress + '%' }"></div>
    </div>

    <div class="sc-actions">
      <span class="sc-remaining" :class="barState">{{ t('site.secondsLeft', { n: remaining }) }}</span>
      <div class="sc-btns">
        <van-button size="mini" plain @click="copyCode">{{ t('common.copy') }}</van-button>
        <van-button size="mini" plain @click="$emit('share', site)">{{ t('common.share') }}</van-button>
        <van-button size="mini" plain type="danger" @click="onDelete">{{ t('common.delete') }}</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { totp } from '../lib/totp'
import { copyText } from '../lib/clipboard'
import { useI18n } from '../composables/useI18n'

const props = defineProps({
  site: { type: Object, required: true },
  now: { type: Number, required: true }
})
const emit = defineEmits(['edit', 'share', 'delete'])
const { t } = useI18n()

const code = ref('')
const period = computed(() => props.site.period || 30)
const counter = computed(() => Math.floor(props.now / 1000 / period.value))
const remaining = computed(() => period.value - (Math.floor(props.now / 1000) % period.value))
const progress = computed(() => (remaining.value / period.value) * 100)
const barState = computed(() => {
  const r = remaining.value / period.value
  if (r <= 0.16) return 'danger'
  if (r <= 0.34) return 'warn'
  return 'normal'
})
const initial = computed(() => (props.site.issuer || props.site.account || '?').trim().charAt(0).toUpperCase())

async function computeCode() {
  try {
    const r = await totp(props.site.secret, {
      algorithm: props.site.algo,
      digits: props.site.digits,
      period: props.site.period
    })
    code.value = r.code
  } catch {
    code.value = 'ERROR'
  }
}

// 周期边界（counter）变化需重算；编辑密钥/算法/位数/周期时也要即时重算，
// 否则改了密钥但周期没变会显示陈旧的验证码
watch(
  [counter, () => props.site.secret, () => props.site.algo, () => props.site.digits, () => props.site.period],
  computeCode,
  { immediate: true }
)

async function copyCode() {
  const ok = await copyText(code.value)
  if (ok) showToast(t('site.copiedCode'))
}

async function onDelete() {
  try {
    await showConfirmDialog({
      title: t('confirm.deleteTitle'),
      message: t('site.confirmDeleteMsg', { name: props.site.issuer || props.site.account })
    })
    emit('delete', props.site.id)
  } catch {
    // 取消
  }
}
</script>

<style scoped>
.site-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 18px;
  margin: 14px 12px;
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(14px) saturate(160%);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.25s ease;
}
.site-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}
.sc-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.sc-avatar {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18),
    0 4px 10px rgba(0, 0, 0, 0.12);
}
.sc-meta {
  flex: 1;
  min-width: 0;
}
.sc-issuer {
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sc-account {
  font-size: 12px;
  color: var(--text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.sc-code {
  font-size: 40px;
  font-weight: 700;
  margin: 16px 0 12px;
  letter-spacing: 0.18em;
  padding-left: 0.18em;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s ease;
}
.sc-code:active {
  opacity: 0.6;
}
.sc-progress {
  height: 5px;
  border-radius: 999px;
  background: var(--card-border);
  overflow: hidden;
}
.sc-bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  transition: width 0.4s linear, background 0.3s ease;
}
.sc-bar.warn {
  background: linear-gradient(90deg, #fbbf24, var(--warning));
}
.sc-bar.danger {
  background: linear-gradient(90deg, #f87171, var(--danger));
}
.sc-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}
.sc-remaining {
  font-size: 12px;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
.sc-remaining.warn {
  color: var(--warning);
}
.sc-remaining.danger {
  color: var(--danger);
  font-weight: 600;
}
.sc-btns {
  display: flex;
  gap: 8px;
}
</style>
