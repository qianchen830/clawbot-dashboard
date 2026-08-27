import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Search, Edit2, Trash2, X, FileText, BookOpen,
  Clock, Tag, User, Link as LinkIcon, CheckCircle, Eye, Send, ChevronLeft
} from 'lucide-react'
import './ContentStudio.css'

const API = ''

const STATUS_MAP = {
  draft:     { label: '草稿',   color: '#64748b' },
  review:    { label: '待审核', color: '#f59e0b' },
  published: { label: '已发布', color: '#10b981' },
  rejected:  { label: '已驳回', color: '#ef4444' },
}

const PLATFORM_MAP = {
  wechat:      { label: '公众号',   bg: 'rgba(7,193,96,0.18)',   color: '#34d399' },
  xiaohongshu: { label: '小红书',   bg: 'rgba(254,44,85,0.18)',  color: '#fb7185' },
  douyin:      { label: '抖音',     bg: 'rgba(0,242,234,0.12)',  color: '#5eead4' },
  other:       { label: '其他',     bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
}

// ── API ─────────────────────────────────────────────────────────────────────

async function fetchArticles(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${API}/api/content/articles${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error('获取失败')
  return res.json()
}

async function createArticle(data) {
  const res = await fetch(`${API}/api/content/articles`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('创建失败')
  return res.json()
}

async function updateArticle(id, data) {
  const res = await fetch(`${API}/api/content/articles/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('更新失败')
  return res.json()
}

async function deleteArticle(id) {
  const res = await fetch(`${API}/api/content/articles/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('删除失败')
  return res.json()
}

// ── Toast ───────────────────────────────────────────────────────────────────

function toast(msg) {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.style.transform = 'translateX(-50%) translateY(0)'
  setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(100px)' }, 3000)
}

function fmtDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// ── 状态 Tab 导航 ────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: 'all',      label: '全部' },
  { key: 'draft',    label: '草稿' },
  { key: 'review',   label: '待审核' },
  { key: 'published',label: '已发布' },
]

function StatusTabs({ filterStatus, onChange, counts }) {
  return (
    <div className="cs-status-tabs">
      {STATUS_TABS.map(tab => {
        const count = tab.key === 'all'
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : (counts[tab.key] || 0)
        const sm = STATUS_MAP[tab.key]
        return (
          <button
            key={tab.key}
            className={`cs-status-tab ${filterStatus === tab.key ? 'cs-status-tab-active' : ''}`}
            style={filterStatus === tab.key && sm ? { '--tab-color': sm.color } : {}}
            onClick={() => onChange(tab.key)}
          >
            {tab.key !== 'all' && sm && (
              <span className="cs-tab-dot" style={{ background: sm.color }} />
            )}
            {tab.label}
            {count > 0 && <span className="cs-tab-count">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── 搜索栏 ──────────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }) {
  return (
    <div className="cs-search-bar">
      <Search size={13} className="cs-search-icon" />
      <input
        type="text" placeholder="搜索标题 / 标签 / 摘要..."
        value={value} onChange={e => onChange(e.target.value)}
        className="cs-search-input"
      />
    </div>
  )
}

// ── 文章列表项 ───────────────────────────────────────────────────────────────

function ArticleItem({ article, selected, onSelect }) {
  const pm = PLATFORM_MAP[article.platform] || PLATFORM_MAP.other
  const sm = STATUS_MAP[article.status] || STATUS_MAP.draft
  const isActive = selected?.id === article.id

  return (
    <div
      className={`cs-article-item ${isActive ? 'cs-article-item-active' : ''}`}
      onClick={() => onSelect(article)}
      style={isActive ? { '--item-accent': sm.color } : {}}
    >
      <div className="cs-item-row1">
        <span className="cs-platform-pill" style={{ background: pm.bg, color: pm.color }}>{pm.label}</span>
        <span className="cs-status-pill" style={{ color: sm.color, background: sm.color + '18' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sm.color, display: 'inline-block', marginRight: 4, boxShadow: `0 0 5px ${sm.color}90` }} />
          {sm.label}
        </span>
      </div>
      <div className="cs-item-title">{article.title || '无标题'}</div>
      <div className="cs-item-meta">
        {article.author && <span><User size={10}/>{article.author}</span>}
        <span><Clock size={10}/>{fmtDate(article.publish_time || article.created_at)}</span>
      </div>
      {article.tags && (
        <div className="cs-item-tags">
          {article.tags.split(',').filter(Boolean).slice(0, 3).map((t, i) => (
            <span key={i} className="cs-tag">{t.trim()}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 内联编辑器 ───────────────────────────────────────────────────────────────

function ArticleEditor({ article, onSave, onCancel, onDelete, isNew }) {
  const [form, setForm] = useState({
    title:       article?.title       || '',
    platform:    article?.platform    || 'wechat',
    status:      article?.status      || 'draft',
    author:      article?.author      || '',
    tags:        article?.tags        || '',
    summary:     article?.summary     || '',
    content:     article?.content     || '',
    content_path:article?.content_path|| '',
    publish_time:article?.publish_time|| '',
    remark:      article?.remark      || '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) { toast('请填写标题'); titleRef.current?.focus(); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean).join(','),
      }
      if (isNew) { await createArticle(payload); toast('创建成功') }
      else       { await updateArticle(article.id, payload); toast('保存成功') }
      onSave()
    } catch (e) {
      toast(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确认删除这篇文章？')) return
    setDeleting(true)
    try {
      await deleteArticle(article.id)
      toast('已删除')
      onDelete()
    } catch (e) {
      toast(e.message)
    } finally {
      setDeleting(false)
    }
  }

  const pm = PLATFORM_MAP[form.platform] || PLATFORM_MAP.other

  return (
    <div className="cs-editor">
      {/* 编辑器顶部工具栏 */}
      <div className="cs-editor-topbar">
        <button className="cs-btn cs-btn-ghost" onClick={onCancel}>
          <ChevronLeft size={14}/> 返回列表
        </button>
        <div className="cs-editor-topbar-actions">
          {!isNew && (
            <button className="cs-btn cs-btn-danger-ghost" disabled={deleting} onClick={handleDelete}>
              <Trash2 size={13}/> {deleting ? '删除中...' : '删除'}
            </button>
          )}
          <button className="cs-btn cs-btn-primary" disabled={saving} onClick={handleSave}>
            <Send size={13}/> {saving ? '保存中...' : isNew ? '发布文章' : '保存修改'}
          </button>
        </div>
      </div>

      <div className="cs-editor-body">
        {/* 平台 + 状态选择行 */}
        <div className="cs-editor-chips">
          <div className="cs-chip-group">
            <span className="cs-chip-label">平台</span>
            {Object.entries(PLATFORM_MAP).map(([k, v]) => (
              <button
                key={k}
                className={`cs-chip ${form.platform === k ? 'cs-chip-active' : ''}`}
                style={form.platform === k ? { background: v.bg, color: v.color, borderColor: v.color + '50' } : {}}
                onClick={() => set('platform', k)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="cs-chip-group">
            <span className="cs-chip-label">状态</span>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <button
                key={k}
                className={`cs-chip ${form.status === k ? 'cs-chip-active' : ''}`}
                style={form.status === k ? { color: v.color, borderColor: v.color + '50', background: v.color + '15' } : {}}
                onClick={() => set('status', k)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* 标题 */}
        <input
          ref={titleRef}
          className="cs-editor-title"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="文章标题..."
        />

        {/* 元信息行 */}
        <div className="cs-editor-meta-row">
          <div className="cs-meta-field">
            <User size={12} className="cs-meta-icon"/>
            <input
              placeholder="作者"
              value={form.author}
              onChange={e => set('author', e.target.value)}
              className="cs-meta-input"
            />
          </div>
          <div className="cs-meta-field">
            <Clock size={12} className="cs-meta-icon"/>
            <input
              type="datetime-local"
              value={form.publish_time}
              onChange={e => set('publish_time', e.target.value)}
              className="cs-meta-input"
            />
          </div>
          <div className="cs-meta-field cs-meta-field-tags">
            <Tag size={12} className="cs-meta-icon"/>
            <input
              placeholder="标签（逗号分隔）"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
              className="cs-meta-input"
            />
          </div>
        </div>

        {/* 摘要 */}
        <div className="cs-editor-section">
          <div className="cs-section-label">内容摘要</div>
          <textarea
            className="cs-editor-textarea cs-editor-summary"
            value={form.summary}
            onChange={e => set('summary', e.target.value)}
            placeholder="文章核心内容概述..."
            rows={3}
          />
        </div>

        {/* 正文 */}
        <div className="cs-editor-section">
          <div className="cs-section-label">正文内容</div>
          <textarea
            className="cs-editor-textarea cs-editor-content"
            value={form.content}
            onChange={e => set('content', e.target.value)}
            placeholder="粘贴文章正文内容，支持多段落..."
            rows={18}
          />
        </div>

        {/* 文件路径 */}
        <div className="cs-editor-section">
          <div className="cs-section-label">
            <LinkIcon size={11}/> 文件路径 / 链接
          </div>
          <input
            className="cs-editor-path-input"
            value={form.content_path}
            onChange={e => set('content_path', e.target.value)}
            placeholder="/home/.../articles/xxx.md 或 https://..."
          />
        </div>

        {/* 备注 */}
        <div className="cs-editor-section">
          <div className="cs-section-label">备注</div>
          <textarea
            className="cs-editor-textarea cs-editor-remark"
            value={form.remark}
            onChange={e => set('remark', e.target.value)}
            placeholder="人工复核说明、修改记录等..."
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

// ── 空状态 ─────────────────────────────────────────────────────────────────

function EmptyState({ onNew }) {
  return (
    <div className="cs-empty-state">
      <FileText size={48} strokeWidth={1} />
      <p className="cs-empty-title">暂无文章</p>
      <p className="cs-empty-desc">点击下方按钮创建第一篇文章</p>
      <button className="cs-btn cs-btn-primary" onClick={onNew}>
        <Plus size={13}/> 新建文章
      </button>
    </div>
  )
}

// ── 主组件 ─────────────────────────────────────────────────────────────────

export default function ContentStudio() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false) // 'view' | 'edit' | 'new'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchArticles()
      setArticles(Array.isArray(data) ? data : [])
    } catch {
      setArticles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // 按状态 + 搜索过滤
  const filtered = articles.filter(a => {
    const matchSearch = !search ||
      a.title?.includes(search) || a.tags?.includes(search) || a.summary?.includes(search)
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchStatus
  })

  // 各状态计数
  const counts = {
    draft:    articles.filter(a => a.status === 'draft').length,
    review:   articles.filter(a => a.status === 'review').length,
    published:articles.filter(a => a.status === 'published').length,
  }

  const handleSelect = (article) => {
    if (selected?.id === article.id) return
    setSelected(article)
    setEditing('view')
  }

  const handleNew = () => {
    setSelected(null)
    setEditing('new')
  }

  const handleEdit = () => {
    setEditing('edit')
  }

  const handleSave = () => {
    setEditing('view')
    load()
  }

  const handleDelete = () => {
    setSelected(null)
    setEditing(null)
    load()
  }

  const handleCancel = () => {
    setEditing(null)
  }

  return (
    <div className="content-studio">
      {/* ── 左侧面板 ── */}
      <div className="cs-panel-left">
        <div className="cs-panel-header">
          <h2>📝 图文制作</h2>
          <button className="cs-btn cs-btn-primary cs-btn-sm" onClick={handleNew}>
            <Plus size={12}/> 新建
          </button>
        </div>

        <StatusTabs filterStatus={filterStatus} onChange={setFilterStatus} counts={counts} />
        <SearchBar value={search} onChange={setSearch} />

        <div className="cs-article-list">
          {loading ? (
            <div className="cs-loading">⏳ 加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="cs-list-empty">
              <p>暂无{filterStatus !== 'all' ? STATUS_MAP[filterStatus]?.label : ''}文章</p>
            </div>
          ) : (
            filtered.map(a => (
              <ArticleItem
                key={a.id}
                article={a}
                selected={selected}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
      </div>

      {/* ── 右侧面板 ── */}
      <div className="cs-panel-right">
        {editing === 'new' ? (
          <ArticleEditor
            article={null}
            isNew
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : selected ? (
          editing === 'edit' ? (
            <ArticleEditor
              article={selected}
              isNew={false}
              onSave={handleSave}
              onCancel={() => setEditing('view')}
              onDelete={handleDelete}
            />
          ) : (
            /* 阅读模式 */
            <div className="cs-reader">
              <div className="cs-reader-topbar">
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="cs-btn cs-btn-primary cs-btn-sm" onClick={handleEdit}>
                    <Edit2 size={12}/> 编辑
                  </button>
                  <button className="cs-btn cs-btn-ghost cs-btn-sm" onClick={handleNew}>
                    <Plus size={12}/> 新建
                  </button>
                </div>
              </div>

              <div className="cs-reader-body">
                {/* 平台 + 状态 */}
                <div className="cs-reader-chips">
                  {(() => {
                    const pm = PLATFORM_MAP[selected.platform] || PLATFORM_MAP.other
                    const sm = STATUS_MAP[selected.status] || STATUS_MAP.draft
                    return (
                      <>
                        <span className="cs-platform-pill" style={{ background: pm.bg, color: pm.color }}>{pm.label}</span>
                        <span className="cs-status-pill" style={{ color: sm.color, background: sm.color + '18' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sm.color, display: 'inline-block', marginRight: 4, boxShadow: `0 0 5px ${sm.color}90` }} />
                          {sm.label}
                        </span>
                      </>
                    )
                  })()}
                </div>

                {/* 标题 */}
                <h1 className="cs-reader-title">{selected.title || '无标题'}</h1>

                {/* 元信息 */}
                <div className="cs-reader-meta">
                  {selected.author && <span><User size={12}/>{selected.author}</span>}
                  <span><Clock size={12}/>{fmtDate(selected.publish_time || selected.created_at)}</span>
                  {selected.updated_at && <span>更新于 {fmtDate(selected.updated_at)}</span>}
                </div>

                {/* 标签 */}
                {selected.tags && (
                  <div className="cs-reader-tags">
                    <Tag size={11}/>
                    {selected.tags.split(',').filter(Boolean).map((t, i) => (
                      <span key={i} className="cs-tag">{t.trim()}</span>
                    ))}
                  </div>
                )}

                {/* 摘要 */}
                {selected.summary && (
                  <div className="cs-reader-section cs-reader-summary">
                    <div className="cs-section-label">内容摘要</div>
                    <p>{selected.summary}</p>
                  </div>
                )}

                {/* 正文 */}
                <div className="cs-reader-section">
                  <div className="cs-section-label">
                    <BookOpen size={12}/> 正文内容
                  </div>
                  {selected.content ? (
                    <div className="cs-reader-content">{selected.content}</div>
                  ) : selected.content_path ? (
                    <div className="cs-reader-path">
                      <LinkIcon size={12}/>
                      <code>{selected.content_path}</code>
                    </div>
                  ) : (
                    <div className="cs-reader-empty-content">暂无正文内容</div>
                  )}
                </div>

                {/* 备注 */}
                {selected.remark && (
                  <div className="cs-reader-section cs-reader-remark">
                    <div className="cs-section-label">备注</div>
                    <p>{selected.remark}</p>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <EmptyState onNew={handleNew} />
        )}
      </div>
    </div>
  )
}
