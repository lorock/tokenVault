<template>
  <van-config-provider :theme="resolved">
    <div class="app-root">
      <LockScreen v-if="vault.locked.value" />
      <template v-else>
        <router-view />
        <AppFooter />
      </template>
      <div v-if="fatal" class="fatal">
        <div class="fatal-card">
          <van-icon name="warning-o" class="fatal-ico" />
          <p class="fatal-title">{{ t('app.errorTitle') }}</p>
          <p class="fatal-desc">{{ t('app.errorDesc') }}</p>
          <van-button round type="primary" class="fatal-btn" @click="reload">
            {{ t('app.retry') }}
          </van-button>
        </div>
      </div>
    </div>
  </van-config-provider>
</template>

<script setup>
import { ref, onErrorCaptured, onMounted, onUnmounted } from 'vue'
import { useTheme } from './composables/useTheme'
import { useVault } from './composables/useVault'
import { useI18n } from './composables/useI18n'
import AppFooter from './components/AppFooter.vue'
import LockScreen from './components/LockScreen.vue'

const themeApi = useTheme()
const vault = useVault()
const { t } = useI18n()
const resolved = themeApi.resolved

const fatal = ref(false)
onErrorCaptured(() => {
  fatal.value = true
  return false
})

function reload() {
  location.reload()
}

// 自动锁：标签页隐藏即清除内存中的 DEK 与站点，返回时需重新解锁
function onVisibility() {
  if (document.hidden && vault.unlocked.value) {
    vault.lock()
  }
}
onMounted(() => {
  vault.init()
  document.addEventListener('visibilitychange', onVisibility)
})
onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<style scoped>
.app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.fatal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg);
}
.fatal-card {
  max-width: 320px;
  text-align: center;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 28px 22px;
  box-shadow: var(--shadow);
}
.fatal-ico {
  font-size: 40px;
  color: var(--danger);
}
.fatal-title {
  font-size: var(--f-subtitle);
  font-weight: 700;
  color: var(--text);
  margin: 14px 0 8px;
}
.fatal-desc {
  font-size: var(--f-hint);
  color: var(--text-2);
  line-height: 1.6;
  margin: 0 0 18px;
}
.fatal-btn {
  height: 42px;
  padding: 0 26px;
  font-weight: 600;
}
</style>
