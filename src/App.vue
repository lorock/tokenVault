<template>
  <van-config-provider :theme="resolved">
    <div class="app-root">
      <router-view />
      <AppFooter />
    </div>
  </van-config-provider>
</template>

<script setup>
import { useTheme } from './composables/useTheme'
import AppFooter from './components/AppFooter.vue'

const resolved = useTheme().resolved
</script>

<style scoped>
.app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
