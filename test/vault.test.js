// 加密保险库测试（node:test）：setup / unlock / 加解密往返 / 改密 / 错误密码失败。
// 依赖 test/helpers.js 注入的 localStorage 与 Web Crypto 垫片。

import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { ensureCryptoGlobal, installLocalStorageShim, clearVaultStorage } from './helpers.js'
import {
  setupVault,
  unlockWithPassword,
  changePassword,
  encryptSites,
  decryptSites,
  isVaultSet,
  clearVault
} from '../src/lib/vault.js'

ensureCryptoGlobal()
installLocalStorageShim()

beforeEach(() => {
  clearVaultStorage()
})

const SAMPLE = [
  { issuer: 'GitHub', account: 'a@b.com', secret: 'JBSWY3DPEHPK3PXP', algo: 'SHA-1', digits: 6, period: 30, type: 'totp', counter: 0, color: '#000', createdAt: 1 },
  { issuer: 'Acme', account: 'ops', secret: 'KRSXG5CTMVRXEZLU', algo: 'SHA-256', digits: 8, period: 30, type: 'totp', counter: 0, color: '#fff', createdAt: 2 }
]

test('setupVault 初始化保险库并迁移空站点', async () => {
  const dek = await setupVault('correct horse battery staple')
  assert.ok(dek)
  assert.equal(isVaultSet(), true)
  const sites = await decryptSites(dek)
  assert.deepEqual(sites, [])
})

test('encryptSites / decryptSites 往返一致', async () => {
  const dek = await setupVault('pw')
  await encryptSites(dek, SAMPLE)
  const out = await decryptSites(dek)
  assert.deepEqual(out, SAMPLE)
})

test('unlockWithPassword 用正确密码解锁并解出相同站点', async () => {
  const dek1 = await setupVault('pw')
  await encryptSites(dek1, SAMPLE)
  const dek2 = await unlockWithPassword('pw')
  const out = await decryptSites(dek2)
  assert.deepEqual(out, SAMPLE)
})

test('unlockWithPassword 错误密码抛出 bad_password', async () => {
  await setupVault('pw')
  await assert.rejects(() => unlockWithPassword('wrong-pw'), /bad_password/)
})

test('changePassword 改密后用新密码可解锁、旧密码失败', async () => {
  await setupVault('old-pw')
  await changePassword('old-pw', 'new-pw')
  const dek = await unlockWithPassword('new-pw')
  assert.ok(dek)
  await assert.rejects(() => unlockWithPassword('old-pw'), /bad_password/)
})

test('changePassword 旧密码错误时抛出 bad_password（DEK 不变）', async () => {
  const dek = await setupVault('pw')
  await encryptSites(dek, SAMPLE)
  await assert.rejects(() => changePassword('not-pw', 'new-pw'), /bad_password/)
  // 旧密码仍应能解锁，证明未损坏
  const dek2 = await unlockWithPassword('pw')
  assert.deepEqual(await decryptSites(dek2), SAMPLE)
})

test('clearVault 后保险库不存在', async () => {
  await setupVault('pw')
  assert.equal(isVaultSet(), true)
  clearVault()
  assert.equal(isVaultSet(), false)
  await assert.rejects(() => unlockWithPassword('pw'), /no_vault/)
})
