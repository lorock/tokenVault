// 主题：light / dark / system（跟随系统），持久化到 localStorage
// resolved 为实际生效的 light|dark，供 Vant ConfigProvider 使用
import { ref } from 'vue'

const THEME_KEY = 'totp_theme'
const ORDER = ['light', 'dark', 'system']

const theme = ref(localStorage.getItem(THEME_KEY) || 'system')
const resolved = ref('light')

function systemPrefersDark() {
  return (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

function apply() {
  const dark =
    theme.value === 'dark' ||
    (theme.value === 'system' && systemPrefersDark())
  resolved.value = dark ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', resolved.value)
}

function setTheme(t) {
  theme.value = t
  localStorage.setItem(THEME_KEY, t)
  apply()
}

function init() {
  apply()
  if (!window.matchMedia) return
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (theme.value === 'system') apply()
  }
  if (mq.addEventListener) mq.addEventListener('change', onChange)
  else if (mq.addListener) mq.addListener(onChange)
}

function cycle() {
  setTheme(ORDER[(ORDER.indexOf(theme.value) + 1) % ORDER.length])
}

function label() {
  return { light: '浅色', dark: '深色', system: '跟随系统' }[theme.value]
}

export function useTheme() {
  return { theme, resolved, setTheme, init, cycle, label }
}
