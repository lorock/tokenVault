<template>
  <van-popup
    :show="visible"
    round
    closeable
    :style="{ width: '84%', maxWidth: '360px' }"
    @update:show="(v) => (visible = v)"
  >
    <div class="share-wrap">
      <div class="share-title">扫码绑定到其他设备</div>
      <img v-if="qrUrl" :src="qrUrl" class="share-img" alt="otpauth QR" />
      <div class="share-issuer">{{ site && (site.issuer || site.account) }}</div>
      <van-button block type="primary" plain @click="copyUri">复制 otpauth URI</van-button>
      <div class="share-hint">用另一台设备的验证器 App 扫描上方二维码即可完成绑定</div>
    </div>
  </van-popup>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { showToast } from 'vant'
import { buildOtpAuthUri } from '../lib/totp'
import { generateQrDataUrl } from '../lib/qr'
import { copyText } from '../lib/clipboard'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  site: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const qrUrl = ref('')

watch(visible, async (v) => {
  if (v && props.site) {
    try {
      const uri = buildOtpAuthUri(props.site)
      qrUrl.value = await generateQrDataUrl(uri)
    } catch {
      qrUrl.value = ''
      showToast('二维码生成失败')
    }
  }
})

async function copyUri() {
  if (!props.site) return
  const ok = await copyText(buildOtpAuthUri(props.site))
  if (ok) showToast('已复制 URI')
}
</script>

<style scoped>
.share-wrap {
  padding: 24px 18px 18px;
  text-align: center;
}
.share-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
}
.share-img {
  width: 220px;
  height: 220px;
  max-width: 100%;
  background: #fff;
  border-radius: 12px;
}
.share-issuer {
  font-size: 14px;
  color: var(--text-2);
  margin: 10px 0 14px;
  word-break: break-all;
}
.share-hint {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 12px;
  line-height: 1.5;
}
</style>
