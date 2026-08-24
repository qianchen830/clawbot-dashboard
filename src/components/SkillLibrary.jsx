import { useState, useEffect } from 'react'
import { Search, Package, BookOpen, RefreshCw, ChevronRight, Layers } from 'lucide-react'
import './SkillLibrary.css'

const API_BASE = ''

const SOURCE_CONFIG = {
  '自研':     { color: '#10b981', label: '自研',     icon: '🔧' },
  '第三方':   { color: '#8b5cf6', label: '第三方',   icon: '🌐' },
  '官方/厂商': { color: '#f59e0b', label: '官方/厂商', icon: '🏭' },
  'F:技能':   { color: '#6b7280', label: '未安装',   icon: '📦' },
  '其他':     { color: '#374151', label: '其他',     icon: '📁' },
}

const CATEGORIES = [
  '全部', '自研技能', '金蝶ERP', '短视频', '内容创作', 'AI模型',
  '效率工具', '浏览器', '代码', '知识管理', '自动化', '其他'
]
const SOURCES = ['全部', '自研', '第三方', '官方/厂商', 'F:技能']

function SourceTag({ source }) {
  const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG['其他']
  return (
    <span className="source-tag" style={{ '--src-color': cfg.color }}>
      <span className="source-dot"></span>
      {cfg.label}
    </span>
  )
}

function normalizeSkillName(name) {
  return String(name || '')
    .replace(/\.zip$/i, '')
    .replace(/[-_]?v?\d+(?:\.\d+){1,3}$/i, '')
    .replace(/[/\-]/g, ' ')
    .toLowerCase()
}

export default function SkillLibrary() {
  const [data, setData] = useState({ installed: [], zips: [], total: 0 })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')
  const [source, setSource] = useState('全部')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const loadSkills = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE}/api/skills`)
      const result = await resp.json()
      setData(result)
    } catch {
      setData({ installed: [], zips: [], total: 0 })
    }
    setLoading(false)
  }

  useEffect(() => { loadSkills() }, [])

  const q = search.trim().toLowerCase()
  const qNormalized = normalizeSkillName(q)

  const matches = (item) => {
    if (q) {
      const fields = [
        item.name,
        normalizeSkillName(item.name),
        item.description,
        item.version,
        item.author,
        item.source,
        item.category,
        item.path,
      ].filter(Boolean).map(v => String(v).toLowerCase())
      const hit = fields.some(v => v.includes(q)) || (qNormalized && fields.some(v => v.includes(qNormalized)))
      if (!hit) return false
    }
    if (category !== '全部' && item.category !== category) return false
    if (source !== '全部' && item.source !== source) return false
    return true
  }

  const installedFiltered = data.installed.filter(matches)
  const installedNames = new Set(data.installed.map(s => normalizeSkillName(s.name)))
  // 真实未安装的 ZIP（按名称+版本后缀归一化去重后）
  const realUninstalledZips = data.zips.filter(i => !installedNames.has(normalizeSkillName(i.name)))
  const zipFiltered = realUninstalledZips.filter(i => {
    if (q && !i.name.toLowerCase().includes(q)) return false
    return source === '全部' || source === 'F:技能'
  })

  const srcStats = {
    total: data.installed.length,
    self: data.installed.filter(s => s.source === '自研').length,
    third: data.installed.filter(s => s.source === '第三方').length,
    vendor: data.installed.filter(s => s.source === '官方/厂商').length,
    uninstalled: realUninstalledZips.length,
  }

  return (
    <div className="skill-library">
      {/* Header */}
      <div className="sl-header">
        <div className="sl-title-row">
          <h2>🛠️ 技能库</h2>
          <button className="sl-reload" onClick={loadSkills} title="刷新">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="sl-stats">
          <div className="sl-stat">
            <span className="sl-stat-num">{data.installed.length}</span>
            <span className="sl-stat-label">已安装</span>
          </div>
          <div className="sl-stat-sep"></div>
          <div className="sl-stat">
            <span className="sl-stat-num" style={{ color: '#10b981' }}>{srcStats.self}</span>
            <span className="sl-stat-label">自研</span>
          </div>
          <div className="sl-stat">
            <span className="sl-stat-num" style={{ color: '#8b5cf6' }}>{srcStats.third}</span>
            <span className="sl-stat-label">第三方</span>
          </div>
          <div className="sl-stat">
            <span className="sl-stat-num" style={{ color: '#f59e0b' }}>{srcStats.vendor}</span>
            <span className="sl-stat-label">厂商</span>
          </div>
          <div className="sl-stat-sep"></div>
          <div className="sl-stat">
            <span className="sl-stat-num" style={{ color: '#6b7280' }}>{srcStats.uninstalled}</span>
            <span className="sl-stat-label">待安装</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sl-search">
        <Search size={16} className="sl-search-icon" />
        <input
          type="text"
          placeholder="搜索技能名称或功能...（实时过滤）"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="sl-search-clear" onClick={() => setSearch('')}>×</button>
        )}
      </div>

      {/* Source filter */}
      <div className="sl-filter-row">
        {SOURCES.map(s => (
          <button
            key={s}
            className={`sl-filter-btn ${source === s ? 'active' : ''}`}
            style={source === s && s !== '全部' ? { '--active-color': SOURCE_CONFIG[s]?.color } : {}}
            onClick={() => setSource(s)}
          >
            {s === '全部' ? '全部' : SOURCE_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Category pills */}
      <div className="sl-cats">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`sl-cat-pill ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results info */}
      <div className="sl-results-info">
        {loading ? '加载中...' : `共 ${installedFiltered.length + zipFiltered.length} 个技能`}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="sl-loading">
          <div className="sl-spinner"></div>
          <span>加载技能数据中...</span>
        </div>
      ) : (
        <div className="sl-grid">
          {installedFiltered.length === 0 && zipFiltered.length === 0 && (
            <div className="sl-empty">
              <div className="sl-empty-icon">🔍</div>
              <div className="sl-empty-text">没有找到匹配的技能</div>
              <div className="sl-empty-sub">试试调整筛选条件或关键词</div>
              <button className="sl-reset-btn" onClick={() => { setSearch(''); setCategory('全部'); setSource('全部') }}>
                重置筛选
              </button>
            </div>
          )}
          {[...installedFiltered, ...zipFiltered].map((skill, idx) => (
            <div
              key={skill.name + idx}
              className={`sl-card ${selected?.name === skill.name ? 'selected' : ''}`}
              style={{ '--src-color': SOURCE_CONFIG[skill.source]?.color || '#374151' }}
              onClick={() => setSelected(skill)}
            >
              <div className="sl-card-source-bar"></div>
              <div className="sl-card-body">
                <div className="sl-card-top">
                  <div className="sl-card-name">{skill.name}</div>
                  <SourceTag source={skill.source} />
                </div>
                <div className="sl-card-desc">{skill.description}</div>
                <div className="sl-card-footer">
                  {skill.category && skill.category !== '其他' && (
                    <span className="sl-card-cat">{skill.category}</span>
                  )}
                  {skill.version && <span className="sl-card-ver">v{skill.version}</span>}
                  <ChevronRight size={14} className="sl-card-arrow" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="sl-modal-overlay" onClick={() => setSelected(null)}>
          <div className="sl-modal" onClick={e => e.stopPropagation()}>
            <div className="sl-modal-header">
              <div className="sl-modal-title-area">
                <h3>{selected.name}</h3>
                <SourceTag source={selected.source} />
              </div>
              <button className="sl-modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="sl-modal-body">
              {selected.category && selected.category !== '其他' && (
                <div className="sl-modal-row">
                  <span className="sl-modal-label">分类</span>
                  <span className="sl-modal-value">{selected.category}</span>
                </div>
              )}
              {selected.version && (
                <div className="sl-modal-row">
                  <span className="sl-modal-label">版本</span>
                  <span className="sl-modal-value">{selected.version}</span>
                </div>
              )}
              {selected.author && selected.author !== selected.source && (
                <div className="sl-modal-row">
                  <span className="sl-modal-label">作者</span>
                  <span className="sl-modal-value">{selected.author}</span>
                </div>
              )}
              <div className="sl-modal-desc-section">
                <div className="sl-modal-label">功能说明</div>
                <p>{selected.description}</p>
              </div>
              {selected.path && (
                <div className="sl-modal-path">
                  <BookOpen size={12} />
                  <span>{selected.path}</span>
                </div>
              )}
              {selected.isZip && (
                <div className="sl-modal-zip">
                  <Package size={14} />
                  <span>该技能未安装，请从 F:\技能 安装后使用</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
