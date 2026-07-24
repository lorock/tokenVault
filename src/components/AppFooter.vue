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
      <span class="footer-sep">·</span>
      <a
        class="footer-link footer-github"
        :href="REPO_URL"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="t('footer.github')"
      >
        <svg class="gh-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      </a>
    </nav>
    <div class="footer-official">
      <span class="fo-label">{{ t('footer.officialLabel') }}：</span>
      <a class="fo-link" :href="'https://' + DOMAIN" target="_blank" rel="noopener noreferrer">{{ DOMAIN }}</a>
    </div>
    <div class="footer-copyright">{{ t('footer.copyright') }}</div>
    <div class="footer-version">v{{ version }}</div>
    <div class="footer-note">{{ t('footer.note') }}</div>
  </footer>
</template>

<script setup>
import { useI18n } from '../composables/useI18n'

const { locale, t, setLocale } = useI18n()

// 当前应用版本号（构建期由 vite.config.js 注入 import.meta.env.VITE_APP_VERSION）
const version = import.meta.env.VITE_APP_VERSION || 'dev'

// 项目开源仓库地址（页脚 GitHub 图标跳转）
const REPO_URL = 'https://github.com/lorock/tokenVault'

// 官方站点域名（页脚展示，供用户核对正版域名、谨防仿冒；tokenvault.xubaojin.com 为国际跳转域名）
const DOMAIN = 'tokenvault.sre.wang'

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
  font-size: var(--f-label);
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
.footer-github {
  display: inline-flex;
  align-items: center;
}
.gh-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
}
.footer-sep {
  color: var(--text-2);
  font-size: 12px;
}
.footer-copyright {
  font-size: var(--f-hint);
  color: var(--text-2);
  line-height: 1.6;
}
.footer-version {
  margin-top: 2px;
  font-size: var(--f-micro);
  color: var(--text-2);
  opacity: 0.7;
  letter-spacing: 0.3px;
}
.footer-official {
  margin-bottom: 6px;
  font-size: var(--f-hint);
  color: var(--text-2);
  line-height: 1.6;
}
.fo-link {
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.18s ease;
}
.fo-link:active {
  opacity: 0.6;
}
.footer-note {
  margin-top: 2px;
  font-size: var(--f-micro);
  color: var(--text-2);
  opacity: 0.8;
  line-height: 1.6;
}
</style>
