export const COLORS = [
  '#24292e', '#4285f4', '#00a4ef', '#ff9900', '#ff6a00', '#00a4ff',
  '#0061ff', '#4a154b', '#1da1f2', '#e4405f', '#000000', '#003087',
  '#f38020', '#10b981', '#8b5cf6'
]

// 归一化单条站点：补全缺失字段（type / counter 默认值），并清洗密钥。
// 既用于读取本地存储，也用于导入备份，保证数据结构一致。
export function normalizeSite(s) {
  return {
    id: s.id || uid(),
    issuer: s.issuer || '',
    account: s.account || '',
    secret: String(s.secret || '').trim().toUpperCase(),
    algo: s.algo || 'SHA-1',
    // 仅允许标准位数 6 / 8；导入备份若含非标准位数（如 4、10）统一钳制为 6，
    // 避免生成与主流验证器 / 服务端不兼容的验证码。
    digits: [6, 8].includes(Number(s.digits)) ? Number(s.digits) : 6,
    period: Number.isFinite(s.period) && s.period > 0 ? s.period : 30,
    type: s.type === 'hotp' ? 'hotp' : 'totp',
    counter: Number.isFinite(s.counter) ? s.counter : 0,
    color: s.color || COLORS[0],
    // 创建时间戳：用于「最近添加」排序。旧备份/历史数据无此字段时回退 0（视为最旧），
    // 保证导入的老数据不会因缺字段而报错或排在异常位置。
    createdAt: Number.isFinite(s.createdAt) ? s.createdAt : 0
  }
}

export function uid() {
  return 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// 检测 localStorage 是否可用（隐私模式 / 存储被禁用时会抛错）
export function isStorageAvailable() {
  try {
    const probe = '__totp_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

// 计算导入结果，供「合并 / 覆盖」决策使用。
// - full：入文件的完整归一化列表（覆盖全部时作为保险库新内容）
// - unique：文件中不存在于现有列表的站点（合并时追加）
// 注意：full 用于「覆盖全部」，必须返回文件完整内容而非仅 unique，
// 否则覆盖会变成「只保留文件里的新站点」，与「清空现有数据」的文案语义冲突。
export function resolveImport(existing, incoming) {
  const keyOf = (s) => JSON.stringify([s.issuer, s.account, s.secret])
  const existingKeys = new Set(existing.map(keyOf))
  const full = incoming
  const unique = incoming.filter((s) => !existingKeys.has(keyOf(s)))
  return { full, unique }
}
