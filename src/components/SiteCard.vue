<template>
  <div class="site-card">
    <div class="sc-head">
      <div class="sc-avatar" :style="{ background: site.color || '#4f8cff' }">
        {{ initial }}
      </div>
      <div class="sc-meta">
        <div class="sc-issuer">
          {{ site.issuer || t('site.unnamed') }}
          <span class="sc-type">{{ isHotp ? t('site.typeHotp') : t('site.typeTotp') }}</span>
        </div>
        <div class="sc-account">{{ site.account }}</div>
      </div>
      <van-button size="mini" plain @click="$emit('edit', site)">{{ t('common.edit') }}</van-button>
    </div>

    <div class="sc-code mono grad-text" @click="copyCode" role="button" :aria-label="t('site.copyHint')">
      <template v-if="grouped.length === 2">
        <span class="grp">{{ grouped[0] }}</span>
        <span class="grp-sep"></span>
        <span class="grp">{{ grouped[1] }}</span>
      </template>
      <template v-else>{{ grouped[0] || '······' }}</template>
    </div>
    <div class="sc-hint" @click="copyCode">{{ t('site.copyHint') }}</div>

    <!-- 统一状态行：TOTP 剩余时间+进度条；HOTP 计数器+下一码。固定等高结构，避免两列网格高度参差 -->
    <div class="sc-status">
      <template v-if="!isHotp">
        <span class="sc-remaining" :class="barState">{{ t('site.secondsLeft', { n: remaining }) }}</span>
        <div class="sc-progress"><div class="sc-bar" :class="barState" :style="{ width: progress + '%' }"></div></div>
      </template>
      <template v-else>
        <span class="sc-counter">{{ t('site.counter', { n: counterVal }) }}</span>
        <van-button size="mini" plain class="sc-next" @click="advance">
          <van-icon name="replay" /> {{ t('site.next') }}
        </van-button>
      </template>
    </div>

    <div class="sc-actions">
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
import { showToast } from 'vant'
import { totp, hotp } from '../lib/totp'
import { copyText } from '../lib/clipboard'
import { useI18n } from '../composables/useI18n'

const props = defineProps({
  site: { type: Object, required: true },
  now: { type: Number, required: true }
})
const emit = defineEmits(['edit', 'share', 'delete', 'advance'])
const { t } = useI18n()

const code = ref('')
const isHotp = computed(() => props.site.type === 'hotp')
const counterVal = computed(() => props.site.counter || 0)
const period = computed(() => Number.isFinite(props.site.period) && props.site.period > 0 ? props.site.period : 30)
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

// 验证码分组显示：6 位 → 3+3，8 位 → 4+4（贴合银行/企业验证器的可读习惯）
const grouped = computed(() => {
  const c = code.value
  if (!c || c.length < 4) return [c || '']
  const mid = Math.ceil(c.length / 2)
  return [c.slice(0, mid), c.slice(mid)]
})

async function computeCode() {
  try {
    let r
    if (isHotp.value) {
      r = await hotp(props.site.secret, {
        algorithm: props.site.algo,
        digits: props.site.digits,
        counter: counterVal.value
      })
    } else {
      r = await totp(props.site.secret, {
        algorithm: props.site.algo,
        digits: props.site.digits,
        period: props.site.period
      })
    }
    code.value = r.code
  } catch {
    code.value = 'ERROR'
  }
}

// TOTP 需监听周期边界重算；HOTP 需监听计数器变化；
// 编辑密钥/算法/位数/周期时也要即时重算，否则会显示陈旧验证码。
watch(
  [
    counter,
    () => props.site.secret,
    () => props.site.algo,
    () => props.site.digits,
    () => props.site.period,
    () => props.site.counter
  ],
  computeCode,
  { immediate: true }
)

async function copyCode() {
  const ok = await copyText(code.value)
  if (ok) showToast(t('site.copiedCode'))
}

function advance() {
  emit('advance', props.site.id)
}

function onDelete() {
  emit('delete', props.site.id)
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
  transition: transform 0.25s var(--ease), box-shadow 0.25s ease;
  animation: cardIn 0.42s var(--ease) both;
  animation-delay: calc((var(--i, 0)) * 55ms);
}
.site-card:hover {
  transform: translateY(-2px);
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
  font-size: var(--f-avatar);
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
  font-size: var(--f-subtitle);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sc-type {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 6px;
  padding: 1px 6px;
  line-height: 1.6;
}
.sc-account {
  font-size: var(--f-label);
  color: var(--text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.sc-code {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.18em;
  font-size: var(--f-code);
  font-weight: 700;
  letter-spacing: 0.06em;
  margin: 16px 0 4px;
  cursor: pointer;
  user-select: none;
  font-variant-numeric: tabular-nums;
  transition: opacity 0.2s ease, transform 0.2s var(--ease);
}
.sc-code:active {
  opacity: 0.55;
  transform: scale(0.99);
}
.sc-code .grp-sep {
  width: 2px;
  height: 0.6em;
  border-radius: 2px;
  background: var(--accent);
  opacity: 0.3;
}
.sc-hint {
  text-align: center;
  font-size: var(--f-hint);
  color: var(--text-2);
  letter-spacing: 0.02em;
  margin-bottom: 12px;
  cursor: pointer;
}

/* 统一状态行：固定 28px 等高，左侧信息文字，右侧进度条或下一码按钮 */
.sc-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 28px;
  margin-bottom: 12px;
}
.sc-progress {
  flex: 1;
  max-width: 120px;
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
.sc-counter {
  font-size: var(--f-label);
  font-weight: 600;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}
.sc-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 28px;
}
.sc-remaining {
  font-size: var(--f-hint);
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

/* 宽屏两列网格下，卡片间距交由网格 gap 控制，移除自身外边距 */
@media (min-width: 768px) {
  .site-card {
    margin: 0;
  }
}
</style>
