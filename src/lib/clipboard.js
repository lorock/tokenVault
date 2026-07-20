// 复制 + 微信兜底。剪贴板 API / execCommand 在微信内置浏览器常不可用，
// 此时弹出可长按选择的文本浮层，让用户手动复制。
import { reactive } from 'vue'

export const copyFallbackState = reactive({
  visible: false,
  text: '',
  hint: ''
})

export function openCopyFallback(text, hint) {
  copyFallbackState.text = text
  copyFallbackState.hint = hint || '若自动复制失败，请长按上方文字手动复制'
  copyFallbackState.visible = true
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, ta.value.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

// 返回 true 表示已成功写入剪贴板；false 表示已弹出兜底浮层
export async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 继续走兜底
    }
  }
  if (fallbackCopy(text)) return true
  openCopyFallback(text)
  return false
}
