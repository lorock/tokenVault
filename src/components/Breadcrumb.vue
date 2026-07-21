<template>
  <nav class="breadcrumb" aria-label="breadcrumb">
    <router-link to="/" class="crumb crumb-link">
      <van-icon name="wap-home-o" class="crumb-ico" />
      <span>{{ t('nav.home') }}</span>
    </router-link>
    <van-icon name="arrow" class="crumb-sep" />
    <span class="crumb crumb-current" aria-current="page">{{ label }}</span>
  </nav>
</template>

<script setup>
import { useI18n } from '../composables/useI18n'

const props = defineProps({
  label: { type: String, required: true }
})
const { t } = useI18n()
</script>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px 2px;
  font-size: 13px;
}
.crumb-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.crumb-link:active {
  opacity: 0.6;
  transform: scale(0.97);
}
.crumb-ico {
  font-size: 16px;
}
.crumb-sep {
  color: var(--text-2);
  font-size: 13px;
  transform: rotate(0deg);
}
.crumb-current {
  color: var(--text-2);
  max-width: 60vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
