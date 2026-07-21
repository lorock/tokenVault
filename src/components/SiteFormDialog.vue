<template>
  <van-popup
    :show="visible"
    position="bottom"
    round
    :style="{ maxHeight: '94%' }"
    @update:show="(v) => (visible = v)"
  >
    <div class="form-wrap">
      <div class="form-handle"></div>
      <div class="form-head">
        <div class="form-title">{{ editing ? t('form.editTitle') : t('form.addTitle') }}</div>
        <div class="form-sub">{{ editing ? t('form.editSub') : t('form.addSub') }}</div>
      </div>

      <!-- 账户信息 -->
      <div class="section-card">
        <div class="section-title">
          <span class="icon"><van-icon name="user-o" /></span>
          {{ t('form.accountInfo') }}
        </div>
        <van-cell-group inset :border="false">
          <van-field v-model="issuer" :label="t('form.issuer')" :placeholder="t('form.issuerPh')" />
          <van-field v-model="account" :label="t('form.account')" :placeholder="t('form.accountPh')" />
          <van-field
            v-model="secret"
            :label="t('form.secret')"
            :placeholder="t('form.secretPh')"
            :error-message="secretError"
          >
            <template #button>
              <van-button size="small" plain type="primary" @click="genSecret">
                <van-icon name="replay" /> {{ t('form.random') }}
              </van-button>
            </template>
          </van-field>
        </van-cell-group>
      </div>

      <!-- 安全选项 -->
      <div class="section-card">
        <div class="section-title">
          <span class="icon"><van-icon name="shield-o" /></span>
          {{ t('form.security') }}
        </div>
        <div class="opt-row">
          <label>{{ t('form.type') }}</label>
          <van-radio-group v-model="type" direction="horizontal">
            <van-radio name="totp">{{ t('form.typeTotp') }}</van-radio>
            <van-radio name="hotp">{{ t('form.typeHotp') }}</van-radio>
          </van-radio-group>
        </div>
        <div v-if="type === 'hotp'" class="opt-row">
          <label>{{ t('form.counter') }}</label>
          <van-stepper v-model="counter" min="0" :integer="true" />
        </div>
        <div class="opt-row">
          <label>{{ t('form.algo') }}</label>
          <van-radio-group v-model="algo" direction="horizontal">
            <van-radio name="SHA-1">SHA-1</van-radio>
            <van-radio name="SHA-256">SHA-256</van-radio>
            <van-radio name="SHA-512">SHA-512</van-radio>
          </van-radio-group>
        </div>
        <div class="opt-row">
          <label>{{ t('form.digits') }}</label>
          <van-radio-group v-model="digits" direction="horizontal">
            <van-radio name="6">{{ t('form.digits6') }}</van-radio>
            <van-radio name="8">{{ t('form.digits8') }}</van-radio>
          </van-radio-group>
        </div>
        <div class="opt-row">
          <label>{{ t('form.period') }}</label>
          <van-radio-group v-model="period" direction="horizontal">
            <van-radio name="30">{{ t('form.period30') }}</van-radio>
            <van-radio name="60">{{ t('form.period60') }}</van-radio>
          </van-radio-group>
        </div>
        <div class="opt-row color-row">
          <label>{{ t('form.color') }}</label>
          <div class="color-grid">
            <button
              v-for="c in COLORS"
              :key="c"
              type="button"
              class="color-dot"
              :class="{ sel: c === color }"
              :style="{ background: c }"
              :title="c"
              @click="color = c"
            ></button>
          </div>
        </div>
      </div>

      <!-- 快速录入 -->
      <div class="section-card">
        <div class="section-title">
          <span class="icon"><van-icon name="records" /></span>
          {{ t('form.quick') }}
        </div>
        <button class="action-card" type="button" @click="pickFile">
          <span class="ico"><van-icon name="scan" /></span>
          <span class="meta">
            {{ t('form.uploadQr') }}
            <span class="sub">{{ t('form.uploadQrSub') }}</span>
          </span>
          <van-icon name="arrow" class="arrow" />
        </button>
        <button class="action-card secondary" type="button" @click="showPaste = !showPaste">
          <span class="ico"><van-icon name="link-o" /></span>
          <span class="meta">
            {{ t('form.pasteUri') }}
            <span class="sub">{{ t('form.pasteUriSub') }}</span>
          </span>
          <van-icon name="arrow-down" class="arrow" :class="{ open: showPaste }" />
        </button>

        <div v-if="showPaste" class="paste-box">
          <van-field
            v-model="pasteUri"
            type="textarea"
            rows="2"
            :placeholder="t('form.pastePh')"
          />
          <van-button size="small" type="primary" round @click="parsePaste">{{ t('form.parseUri') }}</van-button>
        </div>
      </div>

      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFile" />

      <div class="form-actions">
        <van-button v-if="editing" block type="danger" plain round @click="onDelete">
          <van-icon name="delete-o" /> {{ t('form.deleteBtn') }}
        </van-button>
        <van-button block class="glow-btn" type="primary" round @click="onSave">
          <van-icon name="success" /> {{ t('form.saveBtn') }}
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { showToast } from 'vant'
import { base32Decode, base32Encode, parseOtpAuthUri } from '../lib/totp'
import { decodeQrFromFile } from '../lib/scan'
import { useI18n } from '../composables/useI18n'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editing: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'save', 'delete'])
const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const COLORS = [
  '#24292e', '#4285f4', '#00a4ef', '#ff9900', '#ff6a00', '#00a4ff',
  '#0061ff', '#4a154b', '#1da1f2', '#e4405f', '#000000', '#003087',
  '#f38020', '#10b981', '#8b5cf6'
]

const issuer = ref('')
const account = ref('')
const secret = ref('')
const secretError = ref('')
const algo = ref('SHA-1')
const digits = ref('6')
const period = ref('30')
const color = ref(COLORS[0])
const type = ref('totp')
const counter = ref(0)
const showPaste = ref(false)
const pasteUri = ref('')
const fileInput = ref(null)

function open() {
  if (props.editing) {
    issuer.value = props.editing.issuer || ''
    account.value = props.editing.account || ''
    secret.value = props.editing.secret || ''
    algo.value = props.editing.algo || 'SHA-1'
    digits.value = String(props.editing.digits || 6)
    period.value = String(props.editing.period || 30)
    color.value = props.editing.color || COLORS[0]
    type.value = props.editing.type === 'hotp' ? 'hotp' : 'totp'
    counter.value = props.editing.counter || 0
  } else {
    issuer.value = ''
    account.value = ''
    secret.value = ''
    algo.value = 'SHA-1'
    digits.value = '6'
    period.value = '30'
    color.value = COLORS[0]
    type.value = 'totp'
    counter.value = 0
  }
  showPaste.value = false
  pasteUri.value = ''
  secretError.value = ''
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) open()
  }
)

function genSecret() {
  const buf = crypto.getRandomValues(new Uint8Array(20))
  secret.value = base32Encode(buf)
  secretError.value = ''
}

function pickFile() {
  fileInput.value && fileInput.value.click()
}

async function onFile(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  try {
    const data = await decodeQrFromFile(file)
    if (!data) return showToast(t('form.noQr'))
    fillFromParsed(parseOtpAuthUri(data))
    showToast(t('form.recognized'))
  } catch (err) {
    showToast(t('form.recogFailed', { msg: err.message }))
  }
  e.target.value = ''
}

function parsePaste() {
  const uri = pasteUri.value.trim()
  if (!uri) return showToast(t('form.enterUri'))
  try {
    fillFromParsed(parseOtpAuthUri(uri))
    showPaste.value = false
  } catch (e) {
    showToast(e.message)
  }
}

function fillFromParsed(p) {
  issuer.value = p.issuer
  account.value = p.account
  secret.value = p.secret
  algo.value = p.algo
  digits.value = String(p.digits)
  period.value = String(p.period)
  type.value = p.type === 'hotp' ? 'hotp' : 'totp'
  counter.value = p.counter || 0
  secretError.value = ''
}

function onSave() {
  secret.value = secret.value.trim().toUpperCase().replace(/\s/g, '')
  if (!issuer.value.trim()) return showToast(t('form.enterIssuer'))
  if (!secret.value) return showToast(t('form.enterSecret'))
  try {
    base32Decode(secret.value)
  } catch {
    secretError.value = t('form.invalidSecret')
    return
  }
  emit('save', {
    id: props.editing ? props.editing.id : null,
    issuer: issuer.value.trim(),
    account: account.value.trim(),
    secret: secret.value,
    algo: algo.value,
    digits: parseInt(digits.value, 10),
    period: parseInt(period.value, 10),
    type: type.value,
    counter: type.value === 'hotp' ? parseInt(counter.value, 10) || 0 : 0,
    color: color.value
  })
  visible.value = false
}

function onDelete() {
  if (props.editing) emit('delete', props.editing.id)
  visible.value = false
}
</script>

<style scoped>
.form-wrap {
  padding: 8px 14px calc(24px + env(safe-area-inset-bottom));
  max-height: 94vh;
  overflow-y: auto;
}
.form-handle {
  width: 44px;
  height: 5px;
  border-radius: 999px;
  background: var(--card-border);
  margin: 0 auto 14px;
}
.form-head {
  text-align: center;
  margin-bottom: 16px;
}
.form-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}
.form-sub {
  font-size: 13px;
  color: var(--text-2);
  margin-top: 4px;
}

:deep(.van-cell) {
  background: transparent !important;
  padding: 12px 0;
}
:deep(.van-cell::after) {
  border-color: var(--input-border) !important;
}
:deep(.van-field__label) {
  color: var(--text-2);
  font-size: 14px;
}
:deep(.van-field__control) {
  color: var(--text);
  font-size: 15px;
}

.opt-row {
  margin-bottom: 14px;
}
.opt-row:last-child {
  margin-bottom: 0;
}
.opt-row label {
  display: block;
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 8px;
}
:deep(.van-radio) {
  margin-right: 14px;
  font-size: 14px;
}
:deep(.van-radio__label) {
  color: var(--text);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  max-width: 280px;
}
.color-dot {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  justify-self: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.color-dot:hover {
  transform: scale(1.08);
}
.color-dot.sel {
  border-color: var(--text);
  box-shadow: 0 0 0 3px var(--bg) inset, 0 0 0 1px var(--text);
}

.action-card .arrow {
  color: var(--text-2);
  transition: transform 0.25s ease, color 0.2s ease;
}
.action-card:hover .arrow {
  color: var(--accent);
}
.action-card .arrow.open {
  transform: rotate(180deg);
}

.paste-box {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.paste-box :deep(.van-field) {
  background: var(--card-bg) !important;
  border-radius: 10px;
  padding: 10px 12px;
}

.form-actions {
  padding: 0 2px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}
</style>
