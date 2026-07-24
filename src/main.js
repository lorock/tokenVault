import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { installVant } from './plugins/vant'
import { showDialog } from 'vant'
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
  const { t } = useI18n()

  app.mount('#app')

  // 注册 Service Worker：让应用外壳可离线加载（飞行模式 / 无网络仍可取码）
  if ('serviceWorker' in navigator) {
    // 方案 B：发现新版本时弹窗提示，由用户主动点击「更新」。
    // 关键修复：只有「用户确认更新」后才在 controllerchange 时重载页面。
    // controllerchange 不仅在用户点更新时触发 —— SW 首次安装后 activate 阶段的
    // clients.claim()（把页面从「无控制」变为「被控制」）同样会触发它。若无条件
    // reload() 会造成「页面持续刷新」的死循环。updatePending 守卫解决此问题。
    let updatePending = false
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!updatePending || reloading) return
      reloading = true
      updatePending = false
      location.reload()
    })

    const promptUpdate = (worker) => {
      showDialog({
        title: t('update.title'),
        message: t('update.message'),
        confirmButtonText: t('update.confirm'),
        cancelButtonText: t('update.later'),
        showCancelButton: true
      })
        .then(() => {
          // 用户确认 → 标记待更新，并通知等待中的新 SW 接管；
          // 随后 controllerchange 触发一次重载加载最新外壳与资源
          updatePending = true
          worker.postMessage('SKIP_WAITING')
        })
        .catch(() => {})
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(import.meta.env.BASE_URL + 'sw.js')
        .then((reg) => {
          // 已存在等待中的新版本（如用户上次取消了更新）——直接提示
          if (reg.waiting) {
            promptUpdate(reg.waiting)
            return
          }
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing
            if (!worker) return
            worker.addEventListener('statechange', () => {
              // 新版本已安装，且当前有旧 SW 在控制页面 → 提示用户更新
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                promptUpdate(worker)
              }
            })
          })
        })
        .catch(() => {})
    })
  }
}
