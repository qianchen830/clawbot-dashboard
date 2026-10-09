import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, RefreshCw, Brain, Clock, Tag, Filter, BookOpen, Database, Hash, TrendingUp, Layers, X, Zap, BarChart2, ChevronRight } from 'lucide-react'
import './VectorSearch.css'

const API = ''

// 彩虹渐变色抽卡
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #0fd850 0%, #f9f047 100%)',
  'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
]

function getGradient(domain) {
  let hash = 0
  for (let i = 0; i < domain.length; i++) hash = domain.charCodeAt(i) + ((hash << 5) - hash)
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

function getDomainIcon(domain) {
  if (!domain) return '📦'
  if (domain.includes('kingdee') || domain.includes('金蝶')) return '🏢'
  if (domain.includes('hermes')) return '🔮'
  if (domain.includes('web') || domain.includes('dev')) return '💻'
  if (domain.includes('game') || domain.includes('ai-game')) return '🎮'
  if (domain.includes('image') || domain.includes('content')) return '🖼️'
  if (domain.includes('3d') || domain.includes('print')) return '🖨️'
  if (domain.includes('shortvideo') || domain.includes('video')) return '📱'
  if (domain.includes('train') || domain.includes('learning')) return '🎓'
  if (domain.includes('finance') || domain.includes('投资')) return '💰'
  if (domain.includes('moderation') || domain.includes('审查')) return '🛡️'
  return '🧩'
}

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="vq-stat-card" style={{ '--accent': color }}>
      <div className="vq-stat-icon">{icon}</div>
      <div className="vq-stat-body">
        <div className="vq-stat-value">{value ?? '--'}</div>
        <div className="vq-stat-label">{label}</div>
      </div>
    </div>
  )
}

function DomainBar({ domain, count, max, onClick }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="vq-domain-bar-row" onClick={() => onClick(domain)}>
      <div className="vq-domain-left">
        <span className="vq-domain-icon">{getDomainIcon(domain)}</span>
        <span className="vq-domain-name">{domain}</span>
      </div>
      <div className="vq-domain-right">
        <div className="vq-domain-track">
          <div className="vq-domain-fill" style={{ width: `${pct}%`, background: getGradient(domain) }} />
        </div>
        <span className="vq-domain-cnt">{count}</span>
      </div>
    </div>
  )
}

function LessonCard({ lesson, index }) {
  const [expanded, setExpanded] = useState(false)
  const bg = getGradient(lesson.domain || 'default')
  return (
    <div
      className={`vq-card ${expanded ? 'vq-card-expanded' : ''}`}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="vq-card-glow" style={{ background: bg }} />
      <div className="vq-card-inner">
        <div className="vq-card-top">
          <div className="vq-card-badges">
            <span className="vq-badge" style={{ background: bg }}>
              {getDomainIcon(lesson.domain)} {lesson.domain || 'unknown'}
            </span>
            <span className="vq-badge vq-badge-instance">{lesson.instance}</span>
            <span className="vq-badge vq-badge-source">{lesson.source}</span>
            <span className={`vq-badge vq-badge-outcome vq-outcome-${lesson.outcome}`}>
              {lesson.outcome === 'positive' ? '✅' : lesson.outcome === 'negative' ? '❌' : lesson.outcome === 'mixed' ? '🔶' : '⚪'}
            </span>
          </div>
          <span className="vq-card-time"><Clock size={10} /> {timeAgo(lesson.created_at)}</span>
        </div>

        <div className="vq-card-title">{lesson.title}</div>

        {expanded && (
          <div className="vq-card-detail">
            <div className="vq-detail-section">
              <div className="vq-detail-title">📄 正文内容</div>
              <div className="vq-detail-content vq-detail-long">{lesson.content}</div>
            </div>
            <div className="vq-detail-section">
              <div className="vq-detail-title">🔖 场景条件</div>
              <div className="vq-detail-content">{lesson.conditions}</div>
            </div>
            {false && (
              <div className="vq-detail-tags">
                <Hash size={11} />
                {lesson.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                  <span key={t} className="vq-tag-chip">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="vq-card-action">
          <span className="vq-action-label">{lesson.task_type}</span>
          <ChevronRight size={14} className={`vq-chevron ${expanded ? 'up' : ''}`} />
        </div>
      </div>
    </div>
  )
}

export default function VectorSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [instances, setInstances] = useState([])
  const [domains, setDomains] = useState([])
  const [instance, setInstance] = useState('')
  const [domain, setDomain] = useState('')
  const [outcome, setOutcome] = useState('')
  const [datePreset, setDatePreset] = useState('all') // all | today | 7d | 30d
  const [limit, setLimit] = useState(30)
  const [viewMode, setViewMode] = useState('cards') // cards | list
  const [selectedTag, setSelectedTag] = useState('')
  const inputRef = useRef(null)

  const loadStats = useCallback(async () => {
    try {
      const resp = await fetch(`${API}/api/vector/stats`)
      const data = await resp.json()
      setStats(data)
    } catch {}
  }, [])

  const loadFilters = useCallback(async () => {
    try {
      const [i, d] = await Promise.all([
        fetch(`${API}/api/vector/instances`).then(r => r.json()),
        fetch(`${API}/api/vector/domains`).then(r => r.json()),
      ])
      setInstances(i.instances || [])
      setDomains(d.domains || [])
    } catch {}
  }, [])

  // 各筛选器变化时立即触发搜索（filter变化时用auto=true保证空关键词也能搜）
  useEffect(() => { doSearch(query, { auto: true }) }, [instance])
  useEffect(() => { doSearch(query, { auto: true }) }, [domain])
  useEffect(() => { doSearch(query, { auto: true }) }, [outcome])
  useEffect(() => { doSearch(query, { auto: true }) }, [limit])
  useEffect(() => { doSearch(query, { auto: true }) }, [datePreset])

  useEffect(() => {
    loadStats()
    loadFilters()
    // 页面加载时自动展示最近记录（不显示空状态）
    doSearch('', { auto: true })
  }, [loadStats, loadFilters])

  const doSearch = useCallback(async (kw, overrides = {}) => {
    const q = (kw || query).trim()
    // auto=true 时（页面初始加载）允许空关键词，返回最近记录
    if (!q && !overrides.auto) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ q, limit: String(limit) })
      if (instance || overrides.instance) params.set('instance', overrides.instance || instance)
      if (domain || overrides.domain) params.set('domain', overrides.domain || domain)
      if (outcome || overrides.outcome) params.set('outcome', overrides.outcome || outcome)
      if (datePreset !== 'all') {
        const now = new Date()
        const tz = new Date(now.getTime() + 8 * 3600000)
        const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        if (datePreset === 'today') {
          params.set('date_from', fmt(tz))
          params.set('date_to', fmt(tz))
        } else if (datePreset === '7d') {
          const d7 = new Date(tz); d7.setDate(d7.getDate() - 6)
          params.set('date_from', fmt(d7))
          params.set('date_to', fmt(tz))
        } else if (datePreset === '30d') {
          const d30 = new Date(tz); d30.setDate(d30.getDate() - 29)
          params.set('date_from', fmt(d30))
          params.set('date_to', fmt(tz))
        }
      }
      const resp = await fetch(`${API}/api/vector/search?${params.toString()}`)
      const data = await resp.json()
      setResults(data.results || [])
      setTotal(data.total || 0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [query, instance, domain, outcome, limit, datePreset])

  const handleSearch = (e) => {
    if (e && e.key !== 'Enter') return
    doSearch(query)
  }

  const handleTagClick = (tag) => {
    setSelectedTag(tag)
    setQuery(tag)
    doSearch(tag)
  }

  const handleDomainClick = (d) => {
    setDomain(d)
    setQuery(d)
    doSearch(d, { domain: d })
  }

  const handleInstanceClick = (inst) => {
    setInstance(inst)
    doSearch(inst, { instance: inst })
  }

  const clearFilters = () => {
    setInstance(''); setDomain(''); setOutcome(''); setDatePreset('all'); setSelectedTag('')
  }

  const maxDomainCnt = stats?.byDomain?.[0]?.cnt || 1
  const positiveCnt = stats?.byOutcome?.find(o => o.outcome === 'positive')?.cnt || 0
  const negativeCnt = stats?.byOutcome?.find(o => o.outcome === 'negative')?.cnt || 0

  return (
    <div className="vq-page">
      {/* Hero Section */}
      <div className="vq-hero">
        <div className="vq-hero-bg" />
        <div className="vq-hero-content">
          <div className="vq-title-row">
            <div className="vq-title-group">
              <h1 className="vq-title">🧠 向量知识库</h1>
              <p className="vq-subtitle">跨实例语义检索 · 389条经验沉淀 · 实时洞察挖掘</p>
            </div>
            <button className="vq-refresh-btn" onClick={() => { loadStats(); loadFilters() }} title="刷新数据">
              <RefreshCw size={16} />
            </button>
          </div>

          {/* 搜索框 */}
          <div className="vq-search-section">
            <div className="vq-search-box">
              <Search size={20} className="vq-search-icon" />
              <input
                ref={inputRef}
                type="text"
                className="vq-search-input"
                placeholder="输入关键词，回车检索教训、洞察、上下文...（支持实例名、领域、标签）"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
              {query && (
                <button className="vq-clear-btn" onClick={() => { setQuery(''); inputRef.current?.focus() }}>
                  <X size={16} />
                </button>
              )}
              <button className="vq-search-submit" onClick={() => doSearch(query)} disabled={loading}>
                {loading ? <RefreshCw size={16} className="spin" /> : '🔍 检索'}
              </button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="vq-stats-row">
            <StatCard label="总记录数" value={stats?.total} icon="📚" color="#4facfe" />
            <StatCard label="成功经验" value={positiveCnt} icon="✅" color="#43e97b" />
            <StatCard label="失败教训" value={negativeCnt} icon="❌" color="#f5576c" />
            <StatCard label="知识类型" value={stats?.byKind?.length} icon="📂" color="#a18cd1" />
            <StatCard label="实例来源" value={stats?.byInstance?.length} icon="🖥️" color="#fbc2eb" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="vq-filters-bar">
        <div className="vq-filter-group">
          <label><Layers size={12} /> 实例</label>
          <select value={instance} onChange={e => setInstance(e.target.value)}>
            <option value="">全部实例</option>
            {instances.map(s => <option key={s.instance} value={s.instance}>{s.instance} ({s.cnt})</option>)}
          </select>
        </div>
        <div className="vq-filter-group">
          <label><BookOpen size={12} /> 领域</label>
          <select value={domain} onChange={e => setDomain(e.target.value)}>
            <option value="">全部领域</option>
            {domains.map(s => <option key={s.domain} value={s.domain}>{s.domain} ({s.cnt})</option>)}
          </select>
        </div>
        <div className="vq-filter-group">
          <label><TrendingUp size={12} /> 结果</label>
          <select value={outcome} onChange={e => setOutcome(e.target.value)}>
            <option value="">全部</option>
            <option value="positive">✅ 成功</option>
            <option value="negative">❌ 失败</option>
            <option value="neutral">⚪ 中性</option>
            <option value="mixed">🔶 混合</option>
          </select>
        </div>
        <div className="vq-filter-group">
          <label><Clock size={12} /> 日期</label>
          <div className="vq-date-presets">
            {[['all','全部'],['today','今天'],['7d','近7日'],['30d','近30日']].map(([v, label]) => (
              <button
                key={v}
                className={`vq-preset-btn ${datePreset === v ? 'active' : ''}`}
                onClick={() => setDatePreset(v)}
              >{label}</button>
            ))}
          </div>
        </div>
        <div className="vq-filter-group">
          <label><Zap size={12} /> 每页</label>
          <select value={limit} onChange={e => setLimit(parseInt(e.target.value))}>
            <option value="10">10条</option>
            <option value="30">30条</option>
            <option value="50">50条</option>
            <option value="100">100条</option>
          </select>
        </div>
        {(instance || domain || outcome || datePreset !== 'all' || selectedTag) && (
          <button className="vq-clear-filters" onClick={clearFilters}>
            <X size={13} /> 清除筛选
          </button>
        )}
        <div className="vq-filter-spacer" />
        <div className="vq-view-toggle">
          <button className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')}>卡片</button>
          <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>列表</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="vq-content">
        {/* Left: Domain distribution */}
        <div className="vq-sidebar">
          <div className="vq-panel">
            <div className="vq-panel-title"><BarChart2 size={14} /> 领域分布</div>
            <div className="vq-domain-list">
              {(stats?.byDomain || []).slice(0, 20).map(d => (
                <DomainBar
                  key={d.domain}
                  domain={d.domain}
                  count={d.cnt}
                  max={maxDomainCnt}
                  onClick={handleDomainClick}
                />
              ))}
            </div>
          </div>

          <div className="vq-panel">
            <div className="vq-panel-title"><Database size={14} /> 实例分布</div>
            <div className="vq-instance-list">
              {(stats?.byInstance || []).slice(0, 15).map(s => (
                <div
                  key={s.instance}
                  className={`vq-instance-row ${instance === s.instance ? 'active' : ''}`}
                  onClick={() => handleInstanceClick(s.instance)}
                >
                  <span className="vq-instance-dot" style={{ background: getGradient(s.instance) }} />
                  <span className="vq-instance-name">{s.instance}</span>
                  <span className="vq-instance-cnt">{s.cnt}</span>
                </div>
              ))}
            </div>
          </div>

          {stats?.topTags?.length > 0 && (
            <div className="vq-panel">
              <div className="vq-panel-title"><Tag size={14} /> 热门标签</div>
              <div className="vq-tag-cloud">
                {stats.topTags.slice(0, 25).map(t => (
                  <button
                    key={t.tag}
                    className={`vq-tag-btn ${selectedTag === t.tag ? 'active' : ''}`}
                    onClick={() => handleTagClick(t.tag)}
                  >
                    {t.tag} <span className="vq-tag-cnt">{t.cnt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="vq-results-area">
          <div className="vq-results-header">
            <span className="vq-results-count">
              {query
                ? <>🔍 关键词「<strong>{query}</strong>」找到 <strong>{total}</strong> 条结果</>
                : <>📚 共 <strong>{stats?.total || 0}</strong> 条记录，当前显示 <strong>{results.length}</strong> 条</>
              }
            </span>
            {selectedTag && (
              <span className="vq-active-filter">
                标签: {selectedTag}
                <button onClick={() => { setSelectedTag(''); setQuery('') }}><X size={12} /></button>
              </span>
            )}
          </div>

          {loading ? (
            <div className="vq-loading">
              <div className="vq-spinner-ring" />
              <span>正在检索向量知识库...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="vq-empty">
              <Brain size={64} className="vq-empty-icon" />
              <div className="vq-empty-title">
                {query ? '未找到相关记录' : '开始你的知识探索'}
              </div>
              <div className="vq-empty-hint">
                {query ? '试试其他关键词，或调整筛选条件' : '在上方输入关键词，回车开始检索'}
              </div>
              <div className="vq-empty-suggestions">
                试试: <button onClick={() => handleTagClick('kingdee')}>金蝶</button>
                <button onClick={() => handleTagClick('部署')}>部署</button>
                <button onClick={() => handleTagClick('git')}>Git</button>
                <button onClick={() => handleTagClick('database')}>数据库</button>
                <button onClick={() => handleTagClick('安全')}>安全</button>
              </div>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="vq-cards-grid">
              {results.map((r, i) => <LessonCard key={r.id} lesson={r} index={i} />)}
            </div>
          ) : (
            <div className="vq-list-view">
              {results.map((r, i) => (
                <div key={r.id} className="vq-list-row" onClick={() => {}}>
                  <div className="vq-list-left">
                    <span className="vq-list-instance">{r.instance}</span>
                    <span className="vq-list-domain">{r.domain}</span>
                    <span className={`vq-list-outcome vq-outcome-${r.outcome}`}>
                      {r.outcome === 'positive' ? '✅' : r.outcome === 'negative' ? '❌' : '⚪'}
                    </span>
                  </div>
                  <div className="vq-list-insight">{r.insight}</div>
                  <div className="vq-list-time">{timeAgo(r.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
