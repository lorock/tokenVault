import { createApp } from 'vue'
import Vant from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'
import './styles/main.css'
import { useTheme } from './composables/useTheme'

const app = createApp(App)
app.use(Vant)

// 初始化主题（light / dark / system），写入 <html data-theme>
useTheme().init()

app.mount('#app')
