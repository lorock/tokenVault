// 令牌盒 Service Worker：应用外壳离线缓存（缓存优先），让验证器在无网络/飞行模式下仍可用。
const CACHE = 'totp-cache-v1'
const SHELL = new URL('index.html', self.location.href).href

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg']))
      .then(() => self.skipWaiting())
      .catch(() => {})
  )
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
