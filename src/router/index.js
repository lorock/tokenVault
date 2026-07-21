import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../pages/HomeView.vue'
import PrivacyPolicy from '../pages/PrivacyPolicy.vue'
import Disclaimer from '../pages/Disclaimer.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: 'TOTP 验证器' } },
  { path: '/privacy', name: 'privacy', component: PrivacyPolicy, meta: { title: '隐私政策' } },
  { path: '/disclaimer', name: 'disclaimer', component: Disclaimer, meta: { title: '免责声明' } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  // hash 模式：静态托管无需服务端重写，刷新子路由不会 404，适合微信 H5 场景
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
