// 生成分享二维码（用于其他设备扫描绑定）。封装成熟的 `qrcode` 库。
import QRCode from 'qrcode'

export function generateQrDataUrl(text, opts = {}) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: opts.dark || '#000000',
      light: opts.light || '#ffffff'
    }
  })
}
