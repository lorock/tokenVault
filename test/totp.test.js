// TOTP/HOTP 算法与 URI 解析测试：
//  - RFC 4226 规范 HOTP(SHA-1) 向量（硬编码权威值）
//  - HOTP(SHA-256/512) 与 TOTP 多算法：以 Node crypto 独立实现交叉验证
//  - otpauth URI parse <-> build 往返
//  - normalizeSite 字段钳制
// 运行：node --test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { base32Encode, base32Decode, hotp, totp, parseOtpAuthUri, buildOtpAuthUri } from '../src/lib/totp.js'
import { normalizeSite } from '../src/lib/storage.js'

// ---- 独立参考实现（HOTP），用于交叉验证，避免与待测库逻辑耦合 ----
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function b32ascii(ascii) {
  // 将 ascii 密钥转为 base32，供库调用
  return base32Encode(Uint8Array.from(Buffer.from(ascii, 'ascii')))
}
function hotpRef(secretAscii, algo, counter, digits = 6) {
  const key = Buffer.from(secretAscii, 'ascii')
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter >>> 0, 4)
  const mac = createHmac(algo, key).update(buf).digest()
  const offset = mac[mac.length - 1] & 0x0f
  const code =
    ((mac[offset] & 0x7f) << 24) |
    ((mac[offset + 1] & 0xff) << 16) |
    ((mac[offset + 2] & 0xff) << 8) |
    (mac[offset + 3] & 0xff)
  return (code % 10 ** digits).toString().padStart(digits, '0')
}

// RFC 4226 附录密钥（Base32）
const SHA1_SECRET = b32ascii('12345678901234567890')
const SHA256_SECRET = b32ascii('12345678901234567890123456789012')
const SHA512_SECRET = b32ascii('1234567890123456789012345678901234567890123456789012345678901234')

test('base32 编解码往返一致', () => {
  const bytes = new Uint8Array([0, 1, 2, 3, 250, 255, 128, 64])
  const enc = base32Encode(bytes)
  const dec = base32Decode(enc)
  assert.deepEqual(Array.from(dec), Array.from(bytes))
})

test('base32Encode 符合 RFC 4226 规范值', () => {
  // "12345678901234567890" 的 Base32 表示（RFC 4226 附录密钥）
  const enc = base32Encode(Uint8Array.from(Buffer.from('12345678901234567890', 'ascii')))
  assert.equal(enc, 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')
})

test('base32Decode 拒绝非法字符', () => {
  assert.throws(() => base32Decode('18!!'), /Base32|非/)
  assert.throws(() => base32Decode(''), /空/)
})

test('HOTP SHA-1 符合 RFC 4226 规范向量（前 5 位权威值）并与独立实现完全一致', async () => {
  // 广为引用的 RFC 4226 前 5 个权威向量（C=0..4）
  const canonical = ['755224', '287082', '359152', '969429', '338314']
  for (let c = 0; c < 5; c++) {
    const { code } = await hotp(SHA1_SECRET, { algorithm: 'SHA-1', digits: 6, counter: c })
    assert.equal(code, canonical[c], `RFC 向量 counter=${c}`)
  }
  // C=0..9 全部与 Node crypto 独立参考实现交叉验证（HOTP 算法与截断逻辑）
  for (let c = 0; c < 10; c++) {
    const ascii = Buffer.from(base32Decode(SHA1_SECRET)).toString('ascii')
    const ref = hotpRef(ascii, 'SHA-1', c, 6)
    const { code } = await hotp(SHA1_SECRET, { algorithm: 'SHA-1', digits: 6, counter: c })
    assert.equal(code, ref, `交叉验证 counter=${c}`)
  }
})

test('HOTP SHA-256 / SHA-512 与 Node crypto 参考实现一致', async () => {
  const cases = [
    { secret: SHA256_SECRET, algo: 'SHA-256' },
    { secret: SHA512_SECRET, algo: 'SHA-512' }
  ]
  for (const { secret, algo } of cases) {
    for (let c = 0; c < 10; c++) {
      const ascii = Buffer.from(base32Decode(secret)).toString('ascii')
      const ref = hotpRef(ascii, algo, c, 6)
      const { code } = await hotp(secret, { algorithm: algo, digits: 6, counter: c })
      assert.equal(code, ref, `${algo} counter=${c}`)
    }
  }
})

test('HOTP 位数钳制：非 6/8 回退 6；8 位正常', async () => {
  const { code: d6 } = await hotp(SHA1_SECRET, { algorithm: 'SHA-1', digits: 4, counter: 0 })
  assert.equal(d6.length, 6)
  const { code: d8 } = await hotp(SHA1_SECRET, { algorithm: 'SHA-1', digits: 8, counter: 0 })
  assert.equal(d8, '84755224') // RFC 4226 8 位值（755224 前补 84）
})

test('TOTP 多算法在固定时间戳下与参考实现一致', async () => {
  const cases = [
    { secret: SHA1_SECRET, algo: 'SHA-1' },
    { secret: SHA256_SECRET, algo: 'SHA-256' },
    { secret: SHA512_SECRET, algo: 'SHA-512' }
  ]
  const ts = 1111111109000 // 任意固定时间戳
  for (const { secret, algo } of cases) {
    const { code, remaining, counter } = await totp(secret, { algorithm: algo, period: 30, timestamp: ts })
    const c = Math.floor(ts / 1000 / 30)
    const ascii = Buffer.from(base32Decode(secret)).toString('ascii')
    assert.equal(code, hotpRef(ascii, algo, c, 6))
    assert.equal(counter, c)
    assert.equal(remaining, 30 - (Math.floor(ts / 1000) % 30))
  }
})

test('parseOtpAuthUri 解析标准 URI 字段', () => {
  const uri =
    'otpauth://totp/ACME:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME&algorithm=SHA256&digits=8&period=60'
  const s = parseOtpAuthUri(uri)
  assert.equal(s.type, 'totp')
  assert.equal(s.issuer, 'ACME')
  assert.equal(s.account, 'alice@example.com')
  assert.equal(s.secret, 'JBSWY3DPEHPK3PXP')
  assert.equal(s.algo, 'SHA-256') // 无连字符写法归一为带连字符
  assert.equal(s.digits, 8)
  assert.equal(s.period, 60)
})

test('parseOtpAuthUri HOTP 带 counter', () => {
  const uri = 'otpauth://hotp/Issuer:bob?secret=JBSWY3DPEHPK3PXP&counter=5'
  const s = parseOtpAuthUri(uri)
  assert.equal(s.type, 'hotp')
  assert.equal(s.counter, 5)
  assert.equal(s.issuer, 'Issuer')
  assert.equal(s.account, 'bob')
})

test('parseOtpAuthUri 拒绝非法类型/URI', () => {
  assert.throws(() => parseOtpAuthUri('https://example.com'), /otpauth/)
  assert.throws(() => parseOtpAuthUri('otpauth://steam/foo?secret=x'), /TOTP|HOTP/)
})

test('buildOtpAuthUri 后再 parse 往返一致', () => {
  const s = {
    type: 'totp',
    issuer: 'ACME',
    account: 'alice',
    secret: 'JBSWY3DPEHPK3PXP',
    algo: 'SHA-256',
    digits: 8,
    period: 45
  }
  const uri = buildOtpAuthUri(s)
  const back = parseOtpAuthUri(uri)
  // 导出算法采用无连字符写法（SHA256），解析后应归一回 SHA-256
  assert.equal(back.issuer, 'ACME')
  assert.equal(back.account, 'alice')
  assert.equal(back.secret, 'JBSWY3DPEHPK3PXP')
  assert.equal(back.algo, 'SHA-256')
  assert.equal(back.digits, 8)
  assert.equal(back.period, 45)
  assert.match(uri, /algorithm=SHA256/)
})

test('normalizeSite 字段钳制与默认值', () => {
  const a = normalizeSite({})
  assert.equal(a.digits, 6)
  assert.equal(a.period, 30)
  assert.equal(a.type, 'totp')
  assert.equal(a.algo, 'SHA-1')
  assert.equal(a.counter, 0)
  assert.equal(a.createdAt, 0)
  assert.ok(a.id && a.id.length > 0)

  const b = normalizeSite({ digits: 4, period: 0, type: 'hotp', secret: ' abc ', createdAt: 'x' })
  assert.equal(b.digits, 6) // 非标准位数回退 6
  assert.equal(b.period, 30) // 非法 period 回退 30
  assert.equal(b.type, 'hotp')
  assert.equal(b.secret, 'ABC') // 去除空白并大写
  assert.equal(b.createdAt, 0) // 非有限值回退 0

  const c = normalizeSite({ digits: 8, period: 60, createdAt: 123 })
  assert.equal(c.digits, 8)
  assert.equal(c.period, 60)
  assert.equal(c.createdAt, 123)
})
