// 导入「合并 / 覆盖」决策逻辑测试（node:test）。
// 校验 resolveImport 的语义：full 必须返回文件完整内容（覆盖全部），
// unique 仅含文件中不存在于现有列表的站点（合并追加），二者不可混淆。

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSite, resolveImport } from '../src/lib/storage.js'

// 构造已归一化站点（id 稳定，便于断言）
const mk = (issuer, account, secret) => normalizeSite({ issuer, account, secret })

test('resolveImport：full 为文件完整内容，unique 仅含新增', () => {
  const existing = [mk('A', 'a', 'SEC1'), mk('X', 'x', 'SECX')]
  const incoming = [mk('A', 'a', 'SEC1'), mk('B', 'b', 'SEC2'), mk('C', 'c', 'SEC3')]
  const { full, unique } = resolveImport(existing, incoming)
  // full 必须等于文件全部三条（覆盖全部时保险库 = 文件内容）
  assert.equal(full.length, 3)
  assert.deepEqual(full.map((s) => s.issuer), ['A', 'B', 'C'])
  // unique 仅 B、C（A 已存在）
  assert.equal(unique.length, 2)
  assert.deepEqual(unique.map((s) => s.issuer), ['B', 'C'])
})

test('resolveImport：覆盖全部应产生文件内容而非仅 unique', () => {
  // 回归：早期实现用 unique 当覆盖内容，导致丢失文件中已存在的 A
  const existing = [mk('A', 'a', 'SEC1'), mk('X', 'x', 'SECX')]
  const incoming = [mk('A', 'a', 'SEC1'), mk('B', 'b', 'SEC2'), mk('C', 'c', 'SEC3')]
  const { full } = resolveImport(existing, incoming)
  // 覆盖结果应包含 A、B、C（含文件中已存在的 A）
  assert.deepEqual(full.map((s) => s.issuer).sort(), ['A', 'B', 'C'])
})

test('resolveImport：全部已存在时 unique 为空', () => {
  const existing = [mk('A', 'a', 'SEC1')]
  const incoming = [mk('A', 'a', 'SEC1')]
  const { full, unique } = resolveImport(existing, incoming)
  assert.equal(full.length, 1)
  assert.equal(unique.length, 0)
})

test('resolveImport：现有为空时 full 与 unique 相等', () => {
  const existing = []
  const incoming = [mk('A', 'a', 'SEC1'), mk('B', 'b', 'SEC2')]
  const { full, unique } = resolveImport(existing, incoming)
  assert.equal(full.length, 2)
  assert.equal(unique.length, 2)
})
