<template>
  <footer class="app-footer">
    <nav class="footer-links">
      <router-link to="/privacy" class="footer-link">{{ t('footer.privacy') }}</router-link>
      <span class="footer-sep">·</span>
      <router-link to="/disclaimer" class="footer-link">{{ t('footer.disclaimer') }}</router-link>
      <span class="footer-sep">·</span>
      <button class="footer-link footer-lang" type="button" @click="toggleLang">
        {{ locale === 'zh' ? 'EN' : '中文' }}
      </button>
    </nav>
    <div class="footer-copyright">{{ t('footer.copyright') }}</div>
    <div class="footer-note">{{ t('footer.note') }}</div>
  </footer>
</template>

<script setup>
import { useI18n } from '../composables/useI18n'

const { locale, t, setLocale } = useI18n()

function toggleLang() {
  setLocale(locale.value === 'zh' ? 'en' : 'zh')
}
</script>

<style scoped>
.app-footer {
  flex-shrink: 0;
  padding: 20px 16px calc(18px + env(safe-area-inset-bottom));
  text-align: center;
  background: var(--card-bg);
  border-top: 1px solid var(--card-border);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
}
.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}
.footer-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  transition: opacity 0.18s ease;
}
.footer-link:active {
  opacity: 0.6;
}
.footer-lang {
  background: transparent;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
}
.footer-sep {
  color: var(--text-2);
  font-size: 12px;
}
.footer-copyright {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.6;
}
.footer-note {
  margin-top: 2px;
  font-size: 11px;
  color: var(--text-2);
  opacity: 0.8;
  line-height: 1.6;
}
</style>
