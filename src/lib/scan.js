// 从图片文件解码二维码。封装成熟的 `jsQR`，不依赖摄像头，
// 微信内走「相册选图」、PC 走「文件选择」均可正常工作。
import jsQR from 'jsqr'

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

// 控制最大边，降低大图解码开销
function fitSize(w, h, max = 1024) {
  if (w <= max && h <= max) return { w, h }
  const scale = max / Math.max(w, h)
  return { w: Math.round(w * scale), h: Math.round(h * scale) }
}

export async function decodeQrFromFile(file) {
  const dataUrl = await readFileAsDataURL(file)
  const img = await loadImage(dataUrl)
  const { w, h } = fitSize(img.naturalWidth || img.width, img.naturalHeight || img.height)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  const imageData = ctx.getImageData(0, 0, w, h)
  const result = jsQR(imageData.data, w, h)
  return result ? result.data : null
}
