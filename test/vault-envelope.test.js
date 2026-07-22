// 加密信封核心链路测试（node:test）。
// 生物识别解锁（unlockWithBiometric）与密码解锁共用同一套「拆封 DEK + 校验 verifier」
// 逻辑（openDek / verifyDek / sealDek / aead*）。本测试在 Node 22 WebCrypto 下验证该
// 信封链路的完整性与失败语义，作为真机 WebAuthn PRF 联调之前的离线可信底座。
//
// 注意：PRF 本身依赖 navigator.credentials（平台认证器），无法在 Node 中模拟，
// 因此本测试覆盖的是「PRF 派生出 KEK 之后」的通用信封行为，真机 PRF 链路由
// biometric-test.html 在真实设备上联调。

import { test } from 'node:test'
import assert from 'node:assert/strict'

// vault.js 通过 localStorage 持久化保险库，Node 无此全局，提供内存 polyfill。
const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear()
}

const { setupVault, unlockWithPassword, decryptSites, encryptSites, changePassword, clearVault } =
  await import('../src/lib/vault.js')

const sampleSites = (n = 2) =>
  Array.from({ length: n }, (_, i) => ({
    issuer: `Site${i}`,
    account: `user${i}@example.com`,
    secret: ['JBSWY3DPEHPK3PXP', 'KRSXG5CTMVRXEZLU', 'GEZDGNBVGY3TQOJQ'][i % 3]
  }))

test('信封链路：设置密码 → 解锁 → 加解密站点 全链路自洽', async () => {
  clearVault()
  const dek = await setupVault('master-pw-1234')
  assert.ok(dek, 'setupVault 应返回 DEK')

  // 模拟页面重新打开后仅凭主密码解锁（内存 DEK 已丢失）
  const dekAgain = await unlockWithPassword('master-pw-1234')
  assert.ok(dekAgain, '密码解锁应返回 DEK')

  await encryptSites(dekAgain, sampleSites(2))
  const sites = await decryptSites(dekAgain)
  assert.equal(sites.length, 2)
  assert.equal(sites[0].issuer, 'Site0')
  assert.equal(sites[1].secret, 'KRSXG5CTMVRXEZLU')
})

test('错误主密码被拒绝（bad_password）', async () => {
  clearVault()
  await setupVault('master-pw-1234')
  await assert.rejects(
    () => unlockWithPassword('totally-wrong'),
    (e) => /bad_password/.test(e.message)
  )
})

test('修改主密码后旧密码失效、新密码可用（DEK 不变、仅 KEK 重封）', async () => {
  clearVault()
  await setupVault('old-pw')
  const dek = await changePassword('old-pw', 'new-pw')
  assert.ok(dek, 'changePassword 应返回同一 DEK')

  await assert.rejects(() => unlockWithPassword('old-pw'), /bad_password/)
  const dekNew = await unlockWithPassword('new-pw')
  assert.ok(dekNew, '新密码应可解锁')
  await encryptSites(dekNew, sampleSites(1))
  const sites = await decryptSites(dekNew)
  assert.equal(sites.length, 1)
})

test('未设置保险库时解锁抛错（no_vault）', async () => {
  clearVault()
  await assert.rejects(() => unlockWithPassword('whatever'), /no_vault/)
})
