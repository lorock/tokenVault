<template>
  <div class="lock-screen">
    <div class="lock-card">
      <div class="lock-logo" aria-hidden="true">
        <svg viewBox="0 0 512 512" width="34" height="34" fill="currentColor">
          <path d="M256 96c44 0 80 36 80 80v40h16c18 0 32 14 32 32v128c0 18-14 32-32 32H160c-18 0-32-14-32-32V248c0-18 14-32 32-32h16v-40c0-44 36-80 80-80zm0 40c-22 0-40 18-40 40v40h80v-40c0-22-18-40-40-40z"/>
          <circle cx="256" cy="296" r="22"/>
          <rect x="248" y="300" width="16" height="44" rx="8"/>
        </svg>
      </div>

      <template v-if="!vault.isVaultSet()">
        <h1 class="lock-title">{{ t('lock.setupTitle') }}</h1>
        <p class="lock-sub">{{ t('lock.setupSub') }}</p>
        <div v-if="vault.hasLegacy.value" class="lock-migrate">
          <svg class="lock-migrate-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M6.99 11 3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/>
          </svg>
          {{ t('lock.migrateHint') }}
        </div>
        <van-field
          v-model="pw"
          type="password"
          :label="t('lock.password')"
          :placeholder="t('lock.passwordPh')"
          autocomplete="new-password"
          class="lock-field"
        />
        <van-field
          v-model="pw2"
          type="password"
          :label="t('lock.confirm')"
          :placeholder="t('lock.confirmPh')"
          autocomplete="new-password"
          class="lock-field"
        />
        <label v-if="vault.bioAvailable.value" class="lock-bio">
          <input type="checkbox" v-model="enableBio" />
          <span>{{ t('lock.enableBio') }}</span>
        </label>
        <van-button
          block
          type="primary"
          round
          class="lock-btn"
          :loading="vault.busy.value"
          @click="doSetup"
        >
          {{ t('lock.create') }}
        </van-button>
      </template>

      <template v-else>
        <h1 class="lock-title">{{ t('lock.unlockTitle') }}</h1>
        <p class="lock-sub">{{ t('lock.unlockSub') }}</p>
        <van-field
          v-model="pw"
          type="password"
          :label="t('lock.password')"
          :placeholder="t('lock.passwordPh')"
          autocomplete="current-password"
          class="lock-field"
          @keyup.enter="doUnlock"
        />
        <van-button
          block
          type="primary"
          round
          class="lock-btn"
          :loading="vault.busy.value"
          @click="doUnlock"
        >
          {{ t('lock.unlock') }}
        </van-button>
        <van-button
          v-if="vault.bioEnrolled.value"
          block
          plain
          round
          class="lock-btn bio"
          :loading="vault.busy.value"
          @click="doUnlockBio"
        >
          <svg class="lock-bio-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M5.5 4h-2v4.18C3.84 8.6 4 9.04 4 9.5c0 5.25 4.03 9.55 9.17 9.97v2.02C7.55 21.05 2 16.02 2 9.5c0-.66.08-1.3.23-1.91L.5 5.5v5H3v-6.5zm13.5 0h-2v4.18c.16.42.24.86.24 1.32 0 4.42-3.03 8.13-7.12 9.21l-.64 1.94C13.46 19.92 18 15.58 18 9.5c0-.66-.08-1.3-.23-1.91L20 5.5v5h2.5v-6.5h-3.5zM12 6c-3.31 0-6 2.69-6 6 0 1.66.67 3.16 1.76 4.24l1.41-1.41C8.45 13.9 8 12.52 8 11c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.52-.45 2.9-1.17 3.83l1.41 1.41C17.33 15.16 18 13.66 18 11c0-3.31-2.69-6-6-6zm0 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
          {{ t('lock.useBio') }}
        </van-button>
        <button class="lock-forgot" type="button" @click="showReset = true">
          {{ t('lock.forgot') }}
        </button>
      </template>

      <p v-if="errText" class="lock-err">{{ errText }}</p>
    </div>

    <van-dialog
      v-model:show="showReset"
      :title="t('lock.resetTitle')"
      :message="t('lock.resetMsg')"
      :confirm-button-text="t('lock.resetConfirm')"
      :cancel-button-text="t('common.cancel')"
      show-cancel-button
      @confirm="doReset"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVault } from '../composables/useVault'
import { useI18n } from '../composables/useI18n'

const vault = useVault()
const { t } = useI18n()

const pw = ref('')
const pw2 = ref('')
const enableBio = ref(false)
const showReset = ref(false)

const errText = computed(() => {
  const m = vault.error.value
  if (!m) return ''
  return {
    bad_password: t('lock.errBadPassword'),
    crypto_unavailable: t('lock.errCrypto'),
    setup_failed: t('lock.errSetup'),
    unlock_failed: t('lock.errUnlock')
  }[m] || ''
})

async function doSetup() {
  if (pw.value.length < 4) return (vault.error.value = 'setup_failed')
  if (pw.value !== pw2.value) {
    vault.error.value = 'setup_failed'
    return
  }
  try {
    await vault.setup(pw.value)
    pw.value = ''
    pw2.value = ''
  } catch {
    // 错误文案由 errText 映射
  }
}

async function doUnlock() {
  if (!pw.value) return
  try {
    await vault.unlock(pw.value)
    pw.value = ''
  } catch {
    // 错误文案由 errText 映射
  }
}

async function doUnlockBio() {
  try {
    await vault.unlockBio()
  } catch {
    // 生物识别失败回退手动密码
  }
}

function doReset() {
  vault.reset()
  pw.value = ''
  pw2.value = ''
}
</script>

<style scoped>
.lock-screen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg);
}
.lock-card {
  width: 100%;
  max-width: 360px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 28px 22px 24px;
  box-shadow: var(--shadow);
  animation: cardIn 0.4s var(--ease) both;
}
.lock-logo {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff;
  font-size: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 30px rgba(47, 107, 255, 0.32);
}
.lock-title {
  font-size: var(--f-subtitle);
  font-weight: 700;
  color: var(--text);
  text-align: center;
  margin: 0 0 6px;
}
.lock-sub {
  font-size: var(--f-hint);
  color: var(--text-2);
  text-align: center;
  line-height: 1.6;
  margin: 0 0 18px;
}
.lock-migrate {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--f-hint);
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: var(--radius-xs);
  padding: 8px 10px;
  margin-bottom: 14px;
}
.lock-field {
  background: var(--input-bg);
  border-radius: var(--radius-sm);
  margin-bottom: 10px;
}
.lock-bio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--f-hint);
  color: var(--text-2);
  margin: 2px 4px 16px;
  cursor: pointer;
}
.lock-bio input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}
.lock-btn {
  height: 44px;
  font-weight: 600;
  margin-top: 6px;
}
.lock-btn.bio {
  margin-top: 10px;
  color: var(--accent);
  border-color: var(--accent);
}
.lock-bio-icon {
  margin-right: 4px;
  flex-shrink: 0;
}
.lock-forgot {
  display: block;
  width: 100%;
  margin-top: 14px;
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: var(--f-hint);
  cursor: pointer;
}
.lock-err {
  margin: 12px 0 0;
  font-size: var(--f-hint);
  color: var(--danger);
  text-align: center;
  line-height: 1.5;
}
</style>
