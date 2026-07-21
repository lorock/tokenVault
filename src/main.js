import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { installVant } from './plugins/vant'
import './styles/main.css'
import { useTheme } from './composables/useTheme'
import { useI18n } from './composables/useI18n'

// 安全上下文守卫：Web Crypto（HMAC / AES-GCM）仅在 HTTPS 或 localhost 可用。
// 非安全上下文（如 http 明文部署）下加密与验证码生成均不可用，直接给出提示而非白屏。
if (!window.isSecureContext) {
  document.getElementById('app').innerHTML =
    '<div style="max-width:340px;margin:18vh auto;padding:24px;font-family:system-ui,sans-serif;' +
    'text-align:center;color:#333;background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.1)">' +
    '<div style="font-size:40px">🔒</div>' +
    '<h2 style="margin:12px 0 8px;font-size:18px">需要安全连接</h2>' +
    '<p style="font-size:14px;line-height:1.6;color:#666">本应用使用端到端加密存储验证码密钥，' +
    '必须在 HTTPS（或 localhost）环境下运行。请通过 https 地址重新打开。</p>' +
    '</div>'
} else {
  const app = createApp(App)
  app.use(installVant)
  app.use(router)

  // 全局错误处理：记录并交由 App 的 onErrorCaptured 展示兜底 UI（不接入外部上报）
  app.config.errorHandler = (err, instance, info) => {
    console.error('[TokenVault] runtime error:', err, info)
  }

  useTheme().init()
  useI18n().init()

  app.mount('#app')

  // 注册 Service Worker：让应用外壳可离线加载（飞行模式 / 无网络仍可取码）
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(import.meta.env.BASE_URL + 'sw.js')
        .catch(() => {})
    })
  }
}
