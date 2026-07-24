// 令牌盒 Service Worker：应用外壳离线缓存（缓存优先），让验证器在无网络/飞行模式下仍可用。
// CACHE 名由构建期注入（见 vite.config.js 的 injectSWCacheVersion），形如
// totp-cache-v{version}-{timestamp}，每次部署自动作废旧缓存，避免用户卡在旧版本。
const CACHE = '__SW_CACHE_VERSION__'
const SHELL = new URL('index.html', self.location.href).href

self.addEventListener('install', (e) => {
  // 注意：此处不调用 skipWaiting()。新版本装好后进入 waiting 状态，等待主线程
  // （用户点击「更新」）发来 SKIP_WAITING 消息后再接管，避免静默刷新打断正在看的验证码。
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg']))
      .catch(() => {})
  )
})

// 主线程在用户确认更新后发送 SKIP_WAITING，新 SW 随即激活并接管页面
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // 导航请求：网络优先，成功则缓存 index.html；失败回退已缓存外壳
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const cp = r.clone()
          caches.open(CACHE).then((c) => c.put(SHELL, cp))
          return r
        })
        .catch(() => caches.match(SHELL))
    )
    return
  }

  // 同源静态资源：缓存优先，缺失则网络拉取并写入缓存
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req)
        .then((r) => {
          if (r && r.status === 200 && r.type === 'basic') {
            const cp = r.clone()
            caches.open(CACHE).then((c) => c.put(req, cp))
          }
          return r
        })
        .catch(() => cached)
    })
  )
})
