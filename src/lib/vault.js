// 本地加密保险库：所有站点（含 Base32 密钥）以信封加密存储于 localStorage。
//
// 设计（生产级，离线优先、零上报）：
//  - 随机生成数据密钥 DEK（AES-256-GCM），用于加密站点数据。
//  - DEK 再用「用户主密码派生密钥(PBKDF2)」或「生物识别派生密钥(WebAuthn PRF)」包装后存储。
//  - 解锁时：派生 KEK → 解包 DEK → 用 DEK 解密站点。主密码与生物识别是两条独立解锁路径。
//  - 明文密钥永不以任何形式落盘；解锁后 DEK 仅驻留内存，锁屏即清除。

const VAULT_KEY = 'totp_vault_v1'
const LEGACY_KEY = 'totp_sites_v1'
const PBKDF2_ITER = 250000
const VERIFIER = 'totp-vault-ok'

const enc = new TextEncoder()
const dec = new TextDecoder()

function bufToB64(buf) {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}
function b64ToBuf(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

function getCrypto() {
  const subtle = globalThis.crypto && globalThis.crypto.subtle
  if (!subtle) throw new Error('crypto_unavailable')
  return subtle
}

async function aeadEncrypt(key, dataBytes) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const ct = await getCrypto().encrypt({ name: 'AES-GCM', iv }, key, dataBytes)
  return { iv: bufToB64(iv), ct: bufToB64(ct) }
}

async function aeadDecrypt(key, ivB64, ctB64) {
  const iv = new Uint8Array(b64ToBuf(ivB64))
  const ct = b64ToBuf(ctB64)
  const pt = await getCrypto().decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new Uint8Array(pt)
}

async function importAesKey(rawBytes) {
  return getCrypto().importKey('raw', rawBytes, { name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt'
  ])
}

async function deriveKekFromPassword(password, saltBytes) {
  const base = await getCrypto().importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return getCrypto().deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITER, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// ---- 生物识别（WebAuthn PRF）----
export function supportsBiometric() {
  return (
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function' &&
    typeof PublicKeyCredential.getClientExtensionCapabilities === 'function' &&
    !!(PublicKeyCredential.getClientExtensionCapabilities() || {}).prf
  )
}

function b64urlToBytes(s) {
  return new Uint8Array(b64ToBuf(s.replace(/-/g, '+').replace(/_/g, '/')))
}
function bytesToB64url(bytes) {
  return bufToB64(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

let bioChallenge = null
function freshChallenge() {
  return globalThis.crypto.getRandomValues(new Uint8Array(32))
}

async function deriveKekFromPrf(credIdB64url, prfSaltBytes) {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: freshChallenge(),
      allowCredentials: [{ type: 'public-key', id: b64urlToBytes(credIdB64url) }],
      userVerification: 'required',
      extensions: { prf: { eval: { first: prfSaltBytes } } }
    }
  })
  const prf = assertion.getClientExtensionResults().prf
  if (!prf || !prf.results || !prf.results.first) throw new Error('prf_unavailable')
  return importAesKey(new Uint8Array(prf.results.first))
}

// ---- 保险库持久化 ----
function readVault() {
  try {
    const raw = localStorage.getItem(VAULT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function writeVault(obj) {
  localStorage.setItem(VAULT_KEY, JSON.stringify(obj))
}
export function clearVault() {
  try {
    localStorage.removeItem(VAULT_KEY)
  } catch {}
}
export function isVaultSet() {
  return !!readVault()
}
export { readLegacySites }

// 读取并清除旧版明文站点（首次升级时迁移，避免数据丢失）
function readLegacySites() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    localStorage.removeItem(LEGACY_KEY)
    return arr
  } catch {
    return []
  }
}

// 仅探测旧版明文站点是否存在（不清除），供设置主密码前提示迁移
export function peekLegacy() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function packSites(dek, sites) {
  return aeadEncrypt(dek, enc.encode(JSON.stringify(sites)))
}

async function sealDek(dek, kek) {
  const raw = await getCrypto().exportKey('raw', dek)
  return aeadEncrypt(kek, new Uint8Array(raw))
}

async function openDek(wrapped, kek) {
  const raw = await aeadDecrypt(kek, wrapped.iv, wrapped.ct)
  return importAesKey(raw)
}

// 创建主密码并初始化保险库（会迁移旧明文站点）
export async function setupVault(password) {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const kek = await deriveKekFromPassword(password, salt)
  const dek = await getCrypto().generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt'
  ])
  const legacy = readLegacySites()
  const sites = Array.isArray(legacy) ? legacy : []
  const body = await packSites(dek, sites)
  const verifier = await aeadEncrypt(dek, enc.encode(VERIFIER))
  const dekPw = await sealDek(dek, kek)
  const vault = {
    v: 1,
    kdf: { salt: bufToB64(salt), iter: PBKDF2_ITER, hash: 'SHA-256' },
    cipher: body,
    verifier,
    dekPw
  }
  writeVault(vault)
  return dek
}

// 用主密码解锁，返回 DEK
export async function unlockWithPassword(password) {
  const vault = readVault()
  if (!vault) throw new Error('no_vault')
  const salt = new Uint8Array(b64ToBuf(vault.kdf.salt))
  const kek = await deriveKekFromPassword(password, salt)
  // 密码错误时 AES-GCM 解包 DEK 会因认证失败而抛错，统一归一为 bad_password
  let dek
  try {
    dek = await openDek(vault.dekPw, kek)
  } catch {
    throw new Error('bad_password')
  }
  await verifyDek(dek, vault.verifier)
  return dek
}

// 用生物识别解锁，返回 DEK
export async function unlockWithBiometric() {
  const vault = readVault()
  if (!vault || !vault.dekBio) throw new Error('no_bio')
  const kek = await deriveKekFromPrf(vault.bio.credId, new Uint8Array(b64ToBuf(vault.bio.prfSalt)))
  const dek = await openDek(vault.dekBio, kek)
  await verifyDek(dek, vault.verifier)
  return dek
}

async function verifyDek(dek, verifierWrap) {
  let pt
  try {
    pt = await aeadDecrypt(dek, verifierWrap.iv, verifierWrap.ct)
  } catch {
    throw new Error('bad_password')
  }
  if (dec.decode(pt) !== VERIFIER) throw new Error('bad_password')
}

// 解密站点列表
export async function decryptSites(dek) {
  const vault = readVault()
  if (!vault) return []
  const pt = await aeadDecrypt(dek, vault.cipher.iv, vault.cipher.ct)
  try {
    const arr = JSON.parse(dec.decode(pt))
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

// 加密并持久化站点列表（需已解锁拿到 dek）
export async function encryptSites(dek, sites) {
  const vault = readVault()
  if (!vault) throw new Error('no_vault')
  vault.cipher = await packSites(dek, sites)
  writeVault(vault)
}

// 修改主密码：重新包装 DEK（DEK 不变，站点密文不变）
export async function changePassword(oldPw, newPw) {
  const vault = readVault()
  if (!vault) throw new Error('no_vault')
  const salt = new Uint8Array(b64ToBuf(vault.kdf.salt))
  const oldKek = await deriveKekFromPassword(oldPw, salt)
  let dek
  try {
    dek = await openDek(vault.dekPw, oldKek)
  } catch {
    throw new Error('bad_password')
  }
  await verifyDek(dek, vault.verifier)
  const newSalt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const newKek = await deriveKekFromPassword(newPw, newSalt)
  vault.kdf = { salt: bufToB64(newSalt), iter: PBKDF2_ITER, hash: 'SHA-256' }
  vault.dekPw = await sealDek(dek, newKek)
  writeVault(vault)
  return dek
}

export function isBiometricEnrolled() {
  const vault = readVault()
  return !!(vault && vault.bio && vault.dekBio)
}

// 登记生物识别：创建平台凭证并用 PRF 派生密钥包装 DEK（需已解锁的 dek）
export async function enrollBiometricWithDek(dek) {
  const vault = readVault()
  if (!vault) throw new Error('no_vault')
  if (!supportsBiometric()) throw new Error('bio_unsupported')
  const prfSalt = globalThis.crypto.getRandomValues(new Uint8Array(32))
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: freshChallenge(),
      rp: { name: '令牌盒' },
      user: {
        id: globalThis.crypto.getRandomValues(new Uint8Array(16)),
        name: 'totp-user',
        displayName: '令牌盒用户'
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        userVerification: 'required'
      },
      extensions: { prf: {} }
    }
  })
  const kek = await deriveKekFromPrf(bytesToB64url(new Uint8Array(cred.rawId)), prfSalt)
  vault.bio = { credId: bytesToB64url(new Uint8Array(cred.rawId)), prfSalt: bufToB64(prfSalt) }
  vault.dekBio = await sealDek(dek, kek)
  writeVault(vault)
}

export async function removeBiometric() {
  const vault = readVault()
  if (!vault) return
  delete vault.bio
  delete vault.dekBio
  writeVault(vault)
}
