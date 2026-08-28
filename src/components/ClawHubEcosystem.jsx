import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Download, Shield, ChevronRight, Star, Package, Trash2, Filter, Zap } from 'lucide-react'
import './ClawHubEcosystem.css'

const API = ''

const SORT_OPTIONS = [
  { value: 'stars', label: '⭐ 星数' },
  { value: 'downloads', label: '📥 下载量' },
  { value: 'installs', label: '📦 安装量' },
  { value: 'updated_at', label: '🕐 最新更新' },
]

const CATEGORIES = ['全部', '公众号', '金蝶ERP', '短视频', '内容创作', 'AI模型', '效率工具', '浏览器', '代码', '知识管理', '自动化', '其他']
const RISK_FILTERS = ['全部', 'LOW', 'MEDIUM', 'HIGH', 'EXTREME']

const RISK_LABELS = { LOW: '🟢 低风险', MEDIUM: '🟡 中风险', HIGH: '🔴 高风险', EXTREME: '⛔ 极高风险' }
const RISK_BADGE_CLASS = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', EXTREME: 'extreme' }
const VERDICT_BADGE_CLASS = { SAFE: 'safe', CAUTION: 'caution', REJECT: 'reject' }
const VERDICT_LABELS = { SAFE: '✅ 安全', CAUTION: '⚠️ 谨慎安装', REJECT: '❌ 拒绝安装' }

function formatNum(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

function timeAgo(ts) {
  if (!ts) return '—'
  const diff = Date.now() - ts
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return `${days}天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}月前`
  return `${Math.floor(months / 12)}年前`
}

function SkillCard({ skill, onSelect, onAudit, onInstall, onDelete }) {
  const risk = skill.risk_level
  const isInstalled = skill.is_installed

  return (
    <div className="clw-card" onClick={() => onSelect(skill)}>
      <div className={`clw-card-risk-strip ${risk ? 'risk-' + risk.toLowerCase() : ''}`} />
      <div className="clw-card-body">
        <div className="clw-card-top">
          <div className="clw-card-name">{skill.display_name || skill.slug}</div>
        </div>

        <div className="clw-card-stats">
          <span className="clw-card-stat"><Star size={10} className="star" /> {formatNum(skill.stars)}</span>
          <span className="clw-card-stat"><Download size={10} className="dl" /> {formatNum(skill.downloads)}</span>
          <span className="clw-card-stat"><Package size={10} /> {formatNum(skill.installs)}</span>
        </div>

        <div className="clw-card-summary">{skill.summary || '暂无简介'}</div>

        <div className="clw-card-tags">
          {skill.topics?.slice(0, 4).map(t => (
            <span key={t} className="clw-tag">{t}</span>
          ))}
          {risk && risk !== 'LOW' && (
            <span className={`clw-tag risk-tag ${risk === 'EXTREME' ? 'extreme' : ''}`}>
              {RISK_LABELS[risk]}
            </span>
          )}
          {skill.audited === 1 && (
            <span className="clw-tag audit-tag">✅ 已审计</span>
          )}
          {isInstalled === 1 && (
            <span className="clw-tag installed-tag">📦 已安装</span>
          )}
        </div>

        <div className="clw-card-footer">
          <span className="clw-card-version">
            {skill.version ? `v${skill.version}` : ''} · {timeAgo(skill.updated_at)}
          </span>
          <div className="clw-card-actions" onClick={e => e.stopPropagation()}>
            <button className="clw-card-btn audit" title="安全审计" onClick={() => onAudit(skill)}>🔒</button>
            {isInstalled !== 1 && (
              <button className="clw-card-btn install" title="安装" onClick={() => onInstall(skill)}>⬇️</button>
            )}
            <button className="clw-card-btn" title="删除" onClick={() => onDelete(skill)}>🗑️</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkillModal({ skill, onClose, onAudit, onInstall, onSaveMeta }) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [category, setCategory] = useState(skill.category || '其他')
  const [riskLevel, setRiskLevel] = useState(skill.risk_level || '')
  const [note, setNote] = useState(skill.audit_note || '')
  const [installOutput, setInstallOutput] = useState('')
  const [installing, setInstalling] = useState(false)

  const handleAudit = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${API}/api/clawhub/audit/${skill.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: skill.owner }),
      })
      const data = await resp.json()
      setReport(data.report)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleInstall = async () => {
    setInstalling(true)
    setInstallOutput('正在安装...')
    try {
      const resp = await fetch(`${API}/api/clawhub/install/${skill.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: skill.owner }),
      })
      const data = await resp.json()
      setInstallOutput(data.output || data.error || (data.ok ? '安装成功' : '安装失败'))
    } catch (e) {
      setInstallOutput('安装失败: ' + e.message)
    }
    setInstalling(false)
  }

  const handleSaveMeta = () => {
    onSaveMeta({ category, risk_level: riskLevel || null, audit_note: note })
    onClose()
  }

  const risk = report?.riskLevel || skill.risk_level
  const verdict = report?.verdict || (risk === 'EXTREME' ? 'REJECT' : risk === 'HIGH' ? 'CAUTION' : 'SAFE')

  return (
    <div className="clw-modal-overlay" onClick={onClose}>
      <div className="clw-modal" onClick={e => e.stopPropagation()}>
        <div className="clw-modal-header">
          <div className="clw-modal-title-area">
            <h3>{skill.display_name || skill.slug}</h3>
            <div className="clw-modal-slug">{skill.owner}/{skill.slug}</div>
          </div>
          <button className="clw-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="clw-modal-body">
          {/* Stats row */}
          <div className="clw-modal-stats">
            <div className="clw-modal-stat">
              <span className="clw-modal-stat-val star">{formatNum(skill.stars)}</span>
              <span className="clw-modal-stat-label">⭐ Stars</span>
            </div>
            <div className="clw-modal-stat">
              <span className="clw-modal-stat-val dl">{formatNum(skill.downloads)}</span>
              <span className="clw-modal-stat-label">📥 Downloads</span>
            </div>
            <div className="clw-modal-stat">
              <span className="clw-modal-stat-val installs">{formatNum(skill.installs)}</span>
              <span className="clw-modal-stat-label">📦 Installs</span>
            </div>
            <div className="clw-modal-stat">
              <span className="clw-modal-stat-val">{skill.comments || 0}</span>
              <span className="clw-modal-stat-label">💬 Comments</span>
            </div>
          </div>

          {/* Summary */}
          {skill.summary && (
            <div className="clw-modal-section">
              <div className="clw-modal-section-title">简介</div>
              <p className="clw-modal-desc">{skill.summary}</p>
            </div>
          )}

          {/* Description */}
          {skill.description && skill.description !== skill.summary && (
            <div className="clw-modal-section">
              <div className="clw-modal-section-title">详细说明</div>
              <p className="clw-modal-desc">{skill.description}</p>
            </div>
          )}

          {/* Topics */}
          {skill.topics?.length > 0 && (
            <div className="clw-modal-section">
              <div className="clw-modal-section-title">话题标签</div>
              <div className="clw-modal-topics">
                {skill.topics.map(t => (
                  <span key={t} className="clw-tag">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Risk & Verdict */}
          {(risk || report) && (
            <div className="clw-modal-section">
              <div className="clw-modal-section-title">安全评估</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {risk && (
                  <span className={`clw-risk-badge ${RISK_BADGE_CLASS[risk] || 'low'}`}>
                    {RISK_LABELS[risk] || risk}
                  </span>
                )}
                <span className={`clw-verdict-badge ${VERDICT_BADGE_CLASS[verdict] || 'safe'}`}>
                  {VERDICT_LABELS[verdict] || verdict}
                </span>
                {skill.audited === 1 && <span className="clw-tag audit-tag">✅ 已审计</span>}
              </div>
            </div>
          )}

          {/* Red Flags */}
          {report?.redFlags?.length > 0 && (
            <div className="clw-modal-section">
              <div className="clw-modal-section-title">🚨 红线警告</div>
              <div className="clw-redflags">
                {report.redFlags.map((f, i) => (
                  <div key={i} className="clw-redflag-item">⚠️ {f}</div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Report */}
          {report && (
            <div className="clw-modal-section">
              <div className="clw-modal-section-title">📋 审计报告</div>
              <pre style={{ fontSize: '11px', color: '#9ca3af', background: '#111827', padding: '10px', borderRadius: '6px', overflow: 'auto', maxHeight: '200px', lineHeight: 1.5 }}>
                {JSON.stringify({
                  skill: report.skill,
                  source: report.source,
                  metrics: report.metrics,
                  riskLevel: report.riskLevel,
                  verdict: report.verdict,
                  redFlags: report.redFlags,
                  installCommand: report.installCommand || `openclaw skills install @${report.owner}/${report.skill}`,
                }, null, 2)}
              </pre>
            </div>
          )}

          {/* Changelog */}
          {skill.changelog && (
            <div className="clw-modal-section">
              <div className="clw-modal-section-title">📝 更新日志</div>
              <p className="clw-modal-desc">{skill.changelog}</p>
            </div>
          )}

          {/* Install command */}
          <div className="clw-modal-section">
            <div className="clw-modal-section-title">⬇️ 安装命令</div>
            <div className="clw-install-box">
              <div className="clw-install-cmd">
                openclaw skills install @{skill.owner || 'openclaw'}/{skill.slug}{skill.version ? ` --version ${skill.version}` : ''}
              </div>
              {installOutput && (
                <pre style={{ fontSize: '11px', color: '#a5b4fc', whiteSpace: 'pre-wrap', margin: '6px 0 0' }}>
                  {installOutput}
                </pre>
              )}
            </div>
          </div>

          {/* Meta editing */}
          <div className="clw-modal-section">
            <div className="clw-modal-section-title">🏷️ 分类与标注</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="clw-category-select" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="clw-category-select" value={riskLevel} onChange={e => setRiskLevel(e.target.value)}>
                <option value="">未评级</option>
                {RISK_FILTERS.filter(r => r !== '全部').map(r => <option key={r} value={r}>{RISK_LABELS[r]}</option>)}
              </select>
            </div>
            <textarea
              className="clw-note-input"
              placeholder="审计备注..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="clw-modal-actions">
          <button className="clw-btn primary" onClick={handleAudit} disabled={loading}>
            {loading ? '🔍 审计中...' : '🔒 安全审计'}
          </button>
          {skill.is_installed !== 1 && (
            <button className="clw-btn success" onClick={handleInstall} disabled={installing}>
              {installing ? '⬇️ 安装中...' : '⬇️ 安装到本地'}
            </button>
          )}
          <button className="clw-btn" onClick={handleSaveMeta}>💾 保存标注</button>
          <button className="clw-btn" onClick={onClose} style={{ marginLeft: 'auto' }}>关闭</button>
        </div>
      </div>
    </div>
  )
}

export default function ClawHubEcosystem() {
  const [skills, setSkills] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [selected, setSelected] = useState(null)
  const [stats, setStats] = useState({ total: 0, audited: 0, installed: 0, highRisk: 0, lastSync: null, topStars: [] })

  // Filters
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('stars')
  const [category, setCategory] = useState('全部')
  const [riskFilter, setRiskFilter] = useState('全部')
  const [showInstalled, setShowInstalled] = useState(false)

  // Sync form
  const [syncQ, setSyncQ] = useState('')
  const [syncSort, setSyncSort] = useState('stars')
  const [syncLimit, setSyncLimit] = useState(30)

  const loadSkills = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort, limit: 50 })
      if (search) params.set('q', search)
      if (category !== '全部') params.set('category', category)
      if (riskFilter !== '全部') params.set('risk', riskFilter)
      if (showInstalled) params.set('installed', 'true')
      const resp = await fetch(`${API}/api/clawhub/skills?${params.toString()}`)
      const data = await resp.json()
      setSkills(data.skills || [])
      setTotal(data.total || 0)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [search, sort, category, riskFilter, showInstalled])

  const loadStats = useCallback(async () => {
    try {
      const resp = await fetch(`${API}/api/clawhub/stats`)
      const data = await resp.json()
      setStats(data)
    } catch {}
  }, [])

  useEffect(() => { loadSkills() }, [loadSkills])
  useEffect(() => { loadStats() }, [loadStats])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const resp = await fetch(`${API}/api/clawhub/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: syncQ, sort: syncSort, limit: syncLimit }),
      })
      const data = await resp.json()
      if (data.ok) {
        await loadSkills()
        await loadStats()
      }
    } catch (e) {
      console.error(e)
    }
    setSyncing(false)
  }

  const handleAudit = (skill) => { setSelected(skill) }

  const handleInstall = async (skill) => {
    try {
      await fetch(`${API}/api/clawhub/install/${skill.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: skill.owner }),
      })
      await loadSkills()
      await loadStats()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (skill) => {
    if (!confirm(`确定从数据库删除「${skill.display_name || skill.slug}」？`)) return
    try {
      await fetch(`${API}/api/clawhub/skill/${skill.slug}`, { method: 'DELETE' })
      await loadSkills()
      await loadStats()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSaveMeta = async ({ category, risk_level, audit_note }) => {
    if (!selected) return
    try {
      await fetch(`${API}/api/clawhub/skill/${selected.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, risk_level, audit_note }),
      })
      await loadSkills()
      await loadStats()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="clw-page">
      {/* Header */}
      <div className="clw-header">
        <h2>🌟 ClawHub 生态</h2>
        <div className="clw-stats">
          <div className="clw-stat"><span className="clw-stat-num">{stats.total}</span> 收录</div>
          <div className="clw-stat"><span className="clw-stat-num" style={{ color: '#f59e0b' }}>{stats.audited}</span> 已审计</div>
          <div className="clw-stat"><span className="clw-stat-num" style={{ color: '#10b981' }}>{stats.installed}</span> 已安装</div>
          <div className="clw-stat"><span className="clw-stat-num" style={{ color: '#ef4444' }}>{stats.highRisk}</span> 高风险</div>
          {stats.lastSync && (
            <div className="clw-stat">同步于 {timeAgo(stats.lastSync)}</div>
          )}
        </div>
        <button className="clw-btn" onClick={() => { loadSkills(); loadStats() }} title="刷新">
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Sync Form */}
      <div className="clw-sync-form">
        <input
          type="text"
          placeholder="同步关键词（如：金蝶、视频、Excel）留空同步热门..."
          value={syncQ}
          onChange={e => setSyncQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSync()}
        />
        <select value={syncSort} onChange={e => setSyncSort(e.target.value)}>
          <option value="stars">⭐ 星数</option>
          <option value="downloads">📥 下载量</option>
          <option value="new">🕐 最新发布</option>
        </select>
        <select value={syncLimit} onChange={e => setSyncLimit(parseInt(e.target.value))}>
          <option value="20">20条</option>
          <option value="50">50条</option>
          <option value="100">100条</option>
        </select>
        <button className="clw-btn primary" onClick={handleSync} disabled={syncing}>
          {syncing ? '🔄 同步中...' : '🔄 同步 ClawHub'}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="clw-controls">
        <div className="clw-search-row">
          <div className="clw-search-wrap">
            <Search size={14} className="clw-search-icon" />
            <input
              type="text"
              className="clw-search-input"
              placeholder="🔍 搜索技能名称/功能/话题（语义过滤）..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="clw-btn" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="clw-filter-row">
          <span className="clw-filter-label">分类</span>
          {CATEGORIES.map(c => (
            <button key={c} className={`clw-btn btn-sm ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>

        <div className="clw-filter-row">
          <span className="clw-filter-label">风险</span>
          {RISK_FILTERS.map(r => (
            <button key={r} className={`clw-btn btn-sm ${riskFilter === r ? 'active' : ''}`} onClick={() => setRiskFilter(r)}>{r === '全部' ? '全部' : RISK_LABELS[r]}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="show-installed"
              checked={showInstalled}
              onChange={e => setShowInstalled(e.target.checked)}
              style={{ accentColor: '#6366f1' }}
            />
            <label htmlFor="show-installed" style={{ fontSize: '12px', color: '#9ca3af', cursor: 'pointer' }}>只显示已安装</label>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="clw-body">
        <div className="clw-results-bar">
          <span>共 {total} 个技能（数据库），当前显示 {skills.length} 个</span>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>
            提示：点击卡片查看详情 → 🔒审计 → ⬇️安装
          </span>
        </div>

        {loading ? (
          <div className="clw-loading">
            <div className="clw-spinner" />
            <span>加载中...</span>
          </div>
        ) : skills.length === 0 ? (
          <div className="clw-empty">
            <div className="clw-empty-icon">🌟</div>
            <div>还没有同步任何技能</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              上方填写关键词，点击「同步 ClawHub」拉取高星技能
            </div>
          </div>
        ) : (
          <div className="clw-grid">
            {skills.map(skill => (
              <SkillCard
                key={skill.slug}
                skill={skill}
                onSelect={setSelected}
                onAudit={handleAudit}
                onInstall={handleInstall}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <SkillModal
          skill={selected}
          onClose={() => { setSelected(null) }}
          onAudit={handleAudit}
          onInstall={handleInstall}
          onSaveMeta={handleSaveMeta}
        />
      )}
    </div>
  )
}
