<template>
  <footer class="app-footer">
    <nav class="footer-links">
      <router-link to="/privacy" class="footer-link">隐私政策</router-link>
      <span class="footer-sep">·</span>
      <router-link to="/disclaimer" class="footer-link">免责声明</router-link>
    </nav>
    <div class="footer-copyright">© 2026 TOTP 验证器 · 保留所有权利</div>
    <div class="footer-note">本工具为开源前端应用，所有数据仅存储于您的本地设备</div>
  </footer>
</template>

<script setup>
// 纯展示组件，无额外逻辑
</script>

<style scoped>
.app-footer {
  flex-shrink: 0;
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
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
