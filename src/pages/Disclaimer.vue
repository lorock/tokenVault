<template>
  <div class="legal-page">
    <van-nav-bar :title="t('legal.disclaimerTitle')" left-arrow :border="false" @click-left="goBack" />

    <div class="legal-body">
      <p class="legal-updated">{{ t('legal.updated') }}</p>

      <section v-for="(sec, i) in content" :key="i" class="legal-section">
        <h2>{{ sec.heading }}</h2>
        <p v-for="(p, j) in sec.paragraphs" :key="j" v-html="p"></p>
        <ul v-if="sec.list">
          <li v-for="(li, k) in sec.list" :key="k">{{ li }}</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { disclaimer } from '../lib/legal'

const router = useRouter()
const { locale, t } = useI18n()
const content = computed(() => disclaimer[locale.value] || disclaimer.zh)

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<style scoped>
.legal-page {
  flex: 1 0 auto;
}
.legal-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 18px 18px 32px;
}
.legal-updated {
  margin: 4px 0 18px;
  font-size: 12px;
  color: var(--text-2);
}
.legal-section {
  margin-bottom: 22px;
}
.legal-section h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 10px;
  padding-left: 10px;
  border-left: 3px solid var(--accent);
  line-height: 1.3;
}
.legal-section p {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-2);
}
.legal-section ul {
  margin: 0 0 10px;
  padding-left: 20px;
}
.legal-section li {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-2);
  margin-bottom: 4px;
}
.legal-section strong {
  color: var(--text);
  font-weight: 600;
}
</style>
