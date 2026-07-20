<template>
  <van-popup
    :show="copyFallbackState.visible"
    round
    :style="{ width: '88%', maxWidth: '440px' }"
    @update:show="(v) => (copyFallbackState.visible = v)"
  >
    <div class="cf-wrap">
      <div class="cf-hint">{{ copyFallbackState.hint }}</div>
      <textarea
        ref="ta"
        class="cf-text"
        readonly
        :value="copyFallbackState.text"
      ></textarea>
      <div class="cf-actions">
        <van-button block type="primary" @click="doCopy">复制</van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { showToast } from 'vant'
import { copyFallbackState } from '../lib/clipboard'

const ta = ref(null)

watch(
  () => copyFallbackState.visible,
  async (v) => {
    if (v) {
      await nextTick()
      if (ta.value) {
        ta.value.focus()
        ta.value.select()
      }
    }
  }
)

function doCopy() {
  const text = copyFallbackState.text
  const tmp = document.createElement('textarea')
  tmp.value = text
  tmp.setAttribute('readonly', '')
  tmp.style.position = 'fixed'
  tmp.style.left = '-9999px'
  document.body.appendChild(tmp)
  tmp.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(tmp)
  showToast(ok ? '已复制' : '请长按文字手动复制')
}
</script>

<style scoped>
.cf-wrap {
  padding: 18px;
}
.cf-hint {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 10px;
  line-height: 1.5;
}
.cf-text {
  width: 100%;
  height: 180px;
  resize: none;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text);
  box-sizing: border-box;
}
.cf-actions {
  margin-top: 12px;
}
</style>
