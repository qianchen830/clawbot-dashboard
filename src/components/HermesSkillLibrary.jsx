import { useState, useEffect } from 'react'
import { Search, BookOpen, RefreshCw, ChevronRight, Sparkles } from 'lucide-react'
import './HermesSkillLibrary.css'

// kingdee 后端 API（走 vite preview proxy，/api → 8766）
const API_BASE = '';

const SOURCE_CONFIG = {
  'Hermes': { color: '#a78bfa', label: 'Hermes', icon: '🧠' },
}

function HermesTag({ source }) {
  const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG['Hermes']
  return (
    <span className="hsl-source-tag" style={{ '--hsl-src-color': cfg.color }}>
      <span className="hsl-source-dot"></span>
      {cfg.label}
    </span>
  )
}

function extractTags(description, tags) {
  if (tags && tags.length > 0) return tags
  if (!description) return []
  // 从 description 截取前60字作为摘要 tag
  const words = (description || '').trim().split(/[\s,\/]+/).slice(0, 4)
  return words
}

export default function HermesSkillLibrary() {
  const [data, setData] = useState({ installed: [], total: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)

  const loadSkills = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API_BASE}/api/hermes/skills`)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const result = await resp.json()
      setData({
        installed: result.installed || [],
        total: result.total || 0,
      })
    } catch (e) {
      setError(e.message)
      setData({ installed: [], total: 0 })
    }
    setLoading(false)
  }

  useEffect(() => { loadSkills() }, [])

  const q = search.trim().toLowerCase()

  const filtered = data.installed.filter(skill => {
    if (!q) return true
    const fields = [
      skill.name,
      skill.description,
      skill.trigger,
      (skill.tags || []).join(' '),
      skill.category,
    ].filter(Boolean).map(v => String(v).toLowerCase())
    return fields.some(v => v.includes(q))
  })

  return (
    <div className="hsl-container">
      {/* Header */}
      <div className="hsl-header">
        <div className="hsl-title-row">
          <h2>🧠 Hermes 技能</h2>
          <button className="hsl-reload" onClick={loadSkills} title="刷新">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="hsl-stats">
          <div className="hsl-stat">
            <span className="hsl-stat-num">{data.total}</span>
            <span className="hsl-stat-label">自学技能</span>
          </div>
          <div className="hsl-stat-sep"></div>
          <div className="hsl-stat">
            <span className="hsl-stat-num" style={{ color: '#a78bfa' }}>
              {data.installed.filter(s => s.tags && s.tags.length > 0).length}
            </span>
            <span className="hsl-stat-label">有标签</span>
          </div>
          <div className="hsl-stat-sep"></div>
          <div className="hsl-stat">
            <span className="hsl-stat-num" style={{ color: '#34d399' }}>
              {data.installed.filter(s => s.trigger).length}
            </span>
            <span className="hsl-stat-label">有触发词</span>
          </div>
        </div>
        <p className="hsl-subtitle">
          Hermes 自我进化的实践模式库 — 从失败教训、思维模式到操作惯例，持续积累中
        </p>
      </div>

      {/* Search */}
      <div className="hsl-search">
        <Search size={16} className="hsl-search-icon" />
        <input
          type="text"
          placeholder="搜索技能名称、描述或标签..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="hsl-search-clear" onClick={() => setSearch('')}>×</button>
        )}
      </div>

      {/* Results info */}
      <div className="hsl-results-info">
        {loading ? '加载中...' : `共 ${filtered.length} 个技能`}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="hsl-loading">
          <div className="hsl-spinner"></div>
          <span>加载 Hermes 技能数据中...</span>
        </div>
      ) : error ? (
        <div className="hsl-error">
          <div className="hsl-empty-icon">⚠️</div>
          <div className="hsl-empty-text">加载失败：{error}</div>
          <button className="hsl-retry-btn" onClick={loadSkills}>重试</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="hsl-empty">
          <div className="hsl-empty-icon">🔍</div>
          <div className="hsl-empty-text">没有找到匹配的技能</div>
          <button className="hsl-reset-btn" onClick={() => setSearch('')}>重置搜索</button>
        </div>
      ) : (
        <div className="hsl-grid">
          {filtered.map((skill) => (
            <div
              key={skill.name}
              className={`hsl-card ${selected?.name === skill.name ? 'selected' : ''}`}
              onClick={() => setSelected(skill)}
            >
              <div className="hsl-card-glow"></div>
              <div className="hsl-card-body">
                <div className="hsl-card-top">
                  <div className="hsl-card-name">{skill.name}</div>
                  <HermesTag source="Hermes" />
                </div>
                <div className="hsl-card-desc">{skill.description}</div>
                {skill.trigger && (
                  <div className="hsl-card-trigger">
                    <Sparkles size={11} />
                    <span>{skill.trigger}</span>
                  </div>
                )}
                <div className="hsl-card-footer">
                  {(skill.tags || []).slice(0, 4).map(t => (
                    <span key={t} className="hsl-card-tag">{t}</span>
                  ))}
                  <ChevronRight size={14} className="hsl-card-arrow" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="hsl-modal-overlay" onClick={() => setSelected(null)}>
          <div className="hsl-modal" onClick={e => e.stopPropagation()}>
            <div className="hsl-modal-header">
              <div className="hsl-modal-title-area">
                <h3>{selected.name}</h3>
                <HermesTag source="Hermes" />
              </div>
              <button className="hsl-modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="hsl-modal-body">
              {selected.trigger && (
                <div className="hsl-modal-row">
                  <span className="hsl-modal-label">触发词</span>
                  <span className="hsl-modal-value hsl-trigger-value">{selected.trigger}</span>
                </div>
              )}
              {(selected.tags || []).length > 0 && (
                <div className="hsl-modal-row">
                  <span className="hsl-modal-label">标签</span>
                  <div className="hsl-modal-tags">
                    {(selected.tags || []).map(t => (
                      <span key={t} className="hsl-modal-tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {selected.version && (
                <div className="hsl-modal-row">
                  <span className="hsl-modal-label">版本</span>
                  <span className="hsl-modal-value">{selected.version}</span>
                </div>
              )}
              <div className="hsl-modal-desc-section">
                <div className="hsl-modal-label">功能说明</div>
                <p>{selected.description}</p>
              </div>
              {selected.path && (
                <div className="hsl-modal-path">
                  <BookOpen size={12} />
                  <span>{selected.path}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
