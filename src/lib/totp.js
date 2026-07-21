// TOTP/HOTP 核心：Base32 编解码、HMAC 计算、otpauth URI 解析/构建
// 算法遵循 RFC 4226 (HOTP) / RFC 6238 (TOTP)，Web Crypto 提供 HMAC。

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Decode(input) {
  const clean = String(input).replace(/[\s=]/g, '').toUpperCase()
  if (!clean) throw new Error('密钥为空')
  if (!/^[A-Z2-7]+$/.test(clean)) throw new Error('包含非 Base32 字符')
  let bits = ''
  for (const ch of clean) {
    const v = B32.indexOf(ch)
    if (v < 0) throw new Error('无效 Base32 字符: ' + ch)
    bits += v.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return new Uint8Array(bytes)
}

export function base32Encode(bytes) {
  let bits = ''
  for (const b of bytes) bits += b.toString(2).padStart(8, '0')
  while (bits.length % 5) bits += '0'
  let out = ''
  for (let i = 0; i < bits.length; i += 5) {
    out += B32[parseInt(bits.slice(i, i + 5), 2)]
  }
  return out
}

async function hmac(algoName, keyBytes, data) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle
  if (!subtle) {
    throw new Error('当前环境不支持 Web Crypto，请用 https 或 localhost 打开本工具')
  }
  const key = await subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: algoName },
    false,
    ['sign']
  )
  return new Uint8Array(await subtle.sign('HMAC', key, data))
}

const ALGO_MAP = {
  'SHA-1': 'SHA-1',
  'SHA-256': 'SHA-256',
  'SHA-512': 'SHA-512',
  // 兼容标准 otpauth URI 的无连字符写法（如 algorithm=SHA256）
  'SHA1': 'SHA-1',
  'SHA256': 'SHA-256',
  'SHA512': 'SHA-512'
}

// HOTP (RFC 4226)：以计数器为输入生成动态口令
export async function hotp(secretBase32, opts = {}) {
  const algo = (opts.algorithm || 'SHA-1').toUpperCase()
  const algoName = ALGO_MAP[algo] || 'SHA-1'
  // 位数钳制：仅 6 / 8 为标准；其余（含从 URI / 导入传入的非标准值）回退 6
  const digits = [6, 8].includes(Number(opts.digits)) ? Number(opts.digits) : 6
  const counter = opts.counter || 0
  const keyBytes = base32Decode(secretBase32)

  const buf = new ArrayBuffer(8)
  const view = new DataView(buf)
  view.setUint32(0, Math.floor(counter / 0x100000000))
  view.setUint32(4, counter >>> 0)
  const mac = await hmac(algoName, keyBytes, new Uint8Array(buf))

  const offset = mac[mac.length - 1] & 0x0f
  const codeInt =
    ((mac[offset] & 0x7f) << 24) |
    ((mac[offset + 1] & 0xff) << 16) |
    ((mac[offset + 2] & 0xff) << 8) |
    (mac[offset + 3] & 0xff)
  const code = (codeInt % Math.pow(10, digits)).toString().padStart(digits, '0')
  return { code, counter }
}

// TOTP (RFC 6238)：HOTP 的时间变形，计数器 = floor(时间 / 步长)
export async function totp(secretBase32, opts = {}) {
  const period = opts.period || 30
  const ts = opts.timestamp != null ? opts.timestamp : Date.now()
  const counter = Math.floor(ts / 1000 / period)
  const { code } = await hotp(secretBase32, {
    algorithm: opts.algorithm,
    digits: opts.digits,
    counter
  })
  const remaining = period - (Math.floor(ts / 1000) % period)
  return { code, remaining, counter }
}

export function parseOtpAuthUri(uri) {
  if (!uri || !uri.startsWith('otpauth://')) throw new Error('不是有效的 otpauth URI')
  const url = new URL(uri)
  const type = url.hostname
  if (type !== 'totp' && type !== 'hotp') throw new Error('仅支持 TOTP 和 HOTP 类型')

  let label = decodeURIComponent(url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname)
  let issuer = ''
  let account = ''
  if (label.includes(':')) {
    const idx = label.indexOf(':')
    issuer = label.slice(0, idx)
    account = label.slice(idx + 1)
  } else {
    account = label
  }

  const params = new URLSearchParams(url.search)
  if (params.get('issuer')) issuer = params.get('issuer')
  const secret = (params.get('secret') || '').replace(/\s/g, '')
  // 归一化为带连字符的标准名；外部 URI 的 SHA256 等无连字符写法也能正确识别，
  // 否则会落入 ALGO_MAP 默认值 SHA-1，导致导入的 SHA-256/512 站点算出错误验证码。
  const algo = ALGO_MAP[(params.get('algorithm') || 'SHA-1').toUpperCase()] || 'SHA-1'
  const rawDigits = parseInt(params.get('digits') || '6', 10)
  const digits = [6, 8].includes(rawDigits) ? rawDigits : 6
  const period = parseInt(params.get('period') || '30', 10)
  const counter = parseInt(params.get('counter') || '0', 10)

  return {
    type,
    issuer: (issuer || '').trim(),
    account: (account || '').trim(),
    secret,
    algo,
    digits,
    period: isNaN(period) ? 30 : period,
    counter: isNaN(counter) ? 0 : counter
  }
}

export function buildOtpAuthUri(s) {
  const type = s.type === 'hotp' ? 'hotp' : 'totp'
  const label = (s.issuer ? s.issuer + ':' : '') + (s.account || '')
  const u = new URL(`otpauth://${type}/` + encodeURIComponent(label))
  u.searchParams.set('secret', s.secret)
  if (s.issuer) u.searchParams.set('issuer', s.issuer)
  // 导出算法名采用无连字符标准写法（SHA256），符合主流验证器对 otpauth URI 的约定
  const algoOut = (s.algo || 'SHA-1').replace('-', '')
  if (algoOut && algoOut !== 'SHA1') u.searchParams.set('algorithm', algoOut)
  if (s.digits && s.digits !== 6) u.searchParams.set('digits', String(s.digits))
  if (type === 'hotp') {
    u.searchParams.set('counter', String(s.counter || 0))
  } else if (s.period && s.period !== 30) {
    u.searchParams.set('period', String(s.period))
  }
  return u.toString()
}
