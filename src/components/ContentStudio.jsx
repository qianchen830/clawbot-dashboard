import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Eye, Edit2, Trash2, X, FileText,
  BookOpen, Clock, Tag, User, Link as LinkIcon, CheckCircle, AlertCircle, Send
} from 'lucide-react'
import './ContentStudio.css'

const API = ''

const STATUS_MAP = {
  draft:     { label: '草稿',     cls: 'cs-status-draft',     color: '#64748b' },
  review:    { label: '待审核',   cls: 'cs-status-review',    color: '#f59e0b' },
  published: { label: '已发布',   cls: 'cs-status-published', color: '#10b981' },
  rejected:  { label: '已驳回',   cls: 'cs-status-rejected',  color: '#ef4444' },
}

const PLATFORM_MAP = {
  wechat:       { label: '公众号',   cls: 'cs-platform-wechat' },
  xiaohongshu:  { label: '小红书',   cls: 'cs-platform-xiaohongshu' },
  douyin:       { label: '抖音',     cls: 'cs-platform-douyin' },
  other:        { label: '其他',     cls: 'cs-platform-other' },
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

// ── 工具栏筛选行 ─────────────────────────────────────────────────────────────

function Toolbar({ search, setSearch, filterPlatform, setFilterPlatform, filterStatus, setFilterStatus }) {
  return (
    <div className="cs-toolbar">
      <div className="cs-search-wrap">
        <Search size={13} className="cs-search-icon" />
        <input
          type="text" placeholder="搜索标题、标签、摘要..." value={search}
          onChange={e => setSearch(e.target.value)} className="cs-search-input"
        />
      </div>
      <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}>
        <option value="all">全部平台</option>
        <option value="wechat">公众号</option>
        <option value="xiaohongshu">小红书</option>
        <option value="douyin">抖音</option>
        <option value="other">其他</option>
      </select>
      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
        <option value="all">全部状态</option>
        <option value="draft">草稿</option>
        <option value="review">待审核</option>
        <option value="published">已发布</option>
        <option value="rejected">已驳回</option>
      </select>
    </div>
  )
}

// ── 统计行 ───────────────────────────────────────────────────────────────────

function StatsBar({ articles }) {
  const stats = [
    { key: 'total',     label: '全部',     color: '#6366f1' },
    { key: 'draft',     label: '草稿',     color: '#64748b' },
    { key: 'review',    label: '待审核',   color: '#f59e0b' },
    { key: 'published', label: '已发布',   color: '#10b981' },
  ]
  return (
    <div className="cs-stats-row">
      {stats.map(s => {
        const val = s.key === 'total'
          ? articles.length
          : articles.filter(a => a.status === s.key).length
        return (
          <div key={s.key} className="cs-stat-pill" style={{ '--pill-color': s.color }}>
            <span className="cs-stat-pill-val">{val}</span>
            <span className="cs-stat-pill-label">{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── 文章列表项 ───────────────────────────────────────────────────────────────

function ArticleListItem({ article, selected, onSelect }) {
  const pm = PLATFORM_MAP[article.platform] || PLATFORM_MAP.other
  const sm = STATUS_MAP[article.status] || STATUS_MAP.draft

  return (
    <div
      className={`cs-list-item ${selected ? 'cs-list-item-active' : ''}`}
      onClick={() => onSelect(article)}
    >
      <div className="cs-list-item-top">
        <span className={`cs-platform-badge ${pm.cls}`}>{pm.label}</span>
        <span className={`cs-status-dot ${sm.cls}`} title={sm.label} />
      </div>
      <div className="cs-list-item-title">{article.title || '无标题'}</div>
      <div className="cs-list-item-meta">
        {article.author && <span><User size={10}/> {article.author}</span>}
        <span><Clock size={10}/> {fmtDate(article.publish_time || article.created_at)}</span>
      </div>
      {article.tags && (
        <div className="cs-list-item-tags">
          {article.tags.split(',').filter(Boolean).slice(0, 3).map((t, i) => (
            <span key={i} className="cs-tag">{t.trim()}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 正文阅读区 ───────────────────────────────────────────────────────────────

function ArticleReader({ article, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  if (!article) {
    return (
      <div className="cs-reader cs-reader-empty">
        <div className="cs-reader-empty-inner">
          <BookOpen size={44} strokeWidth={1.2} />
          <p>选择一篇文章查看内容</p>
        </div>
      </div>
    )
  }

  const pm = PLATFORM_MAP[article.platform] || PLATFORM_MAP.other
  const sm = STATUS_MAP[article.status] || STATUS_MAP.draft

  const handleDelete = async () => {
    if (!confirm('确认删除？')) return
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

  return (
    <div className="cs-reader">
      {/* 阅读区头部 */}
      <div className="cs-reader-header">
        <div className="cs-reader-meta-top">
          <span className={`cs-platform-badge ${pm.cls}`}>{pm.label}</span>
          <span className={`cs-status-badge ${sm.cls}`}>{sm.label}</span>
        </div>
        <h1 className="cs-reader-title">{article.title}</h1>
        <div className="cs-reader-info-row">
          {article.author && <span><User size={12}/> {article.author}</span>}
          <span><Clock size={12}/> {fmtDate(article.publish_time || article.created_at)}</span>
          {article.updated_at && <span>更新于 {fmtDate(article.updated_at)}</span>}
        </div>
        {article.tags && (
          <div className="cs-reader-tags">
            <Tag size={11}/>
            {article.tags.split(',').filter(Boolean).map((t, i) => (
              <span key={i} className="cs-tag">{t.trim()}</span>
            ))}
          </div>
        )}
      </div>

      {/* 摘要区 */}
      {article.summary && (
        <div className="cs-reader-summary">
          <div className="cs-reader-summary-label">内容摘要</div>
          <p>{article.summary}</p>
        </div>
      )}

      {/* 正文内容 */}
      <div className="cs-reader-body-label">
        <BookOpen size={13}/> 正文内容
      </div>
      <div className="cs-reader-body">
        {article.content ? (
          <div className="cs-reader-content-text">{article.content}</div>
        ) : article.content_path ? (
          <div className="cs-reader-content-path">
            <LinkIcon size={13}/>
            <span>内容文件：</span>
            <code>{article.content_path}</code>
          </div>
        ) : (
          <div className="cs-reader-no-content">暂无正文内容</div>
        )}
      </div>

      {/* 备注 */}
      {article.remark && (
        <div className="cs-reader-remark">
          <div className="cs-reader-remark-label">📋 备注</div>
          <p>{article.remark}</p>
        </div>
      )}

      {/* 操作栏 */}
      <div className="cs-reader-actions">
        <button className="cs-btn cs-btn-primary" onClick={() => onEdit(article)}>
          <Edit2 size={13}/> 编辑
        </button>
        <button className="cs-btn cs-btn-danger" disabled={deleting} onClick={handleDelete}>
          <Trash2 size={13}/> {deleting ? '删除中...' : '删除'}
        </button>
      </div>
    </div>
  )
}

// ── 新建/编辑弹窗 ───────────────────────────────────────────────────────────

function ArticleModal({ article, onSave, onClose }) {
  const isEdit = !!article?.id
  const [form, setForm] = useState({
    title: article?.title || '',
    platform: article?.platform || 'wechat',
    status: article?.status || 'draft',
    author: article?.author || '',
    tags: article?.tags || '',
    summary: article?.summary || '',
    content: article?.content || '',
    content_path: article?.content_path || '',
    publish_time: article?.publish_time || '',
    remark: article?.remark || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) { toast('请填写标题'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean).join(','),
      }
      if (isEdit) { await updateArticle(article.id, payload); toast('更新成功') }
      else        { await createArticle(payload);              toast('创建成功') }
      onSave()
    } catch (e) {
      toast(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cs-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cs-modal">
        <div className="cs-modal-header">
          <h3>{isEdit ? '编辑文章' : '新建文章'}</h3>
          <button className="cs-btn cs-btn-secondary" style={{padding: '4px 8px'}} onClick={onClose}><X size={14}/></button>
        </div>
        <div className="cs-modal-body">
          <div className="cs-form-grid">
            <div className="cs-form-group cs-full">
              <label>标题 *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="文章标题" />
            </div>
            <div className="cs-form-group">
              <label>平台</label>
              <select value={form.platform} onChange={e => set('platform', e.target.value)}>
                <option value="wechat">公众号</option>
                <option value="xiaohongshu">小红书</option>
                <option value="douyin">抖音</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="cs-form-group">
              <label>状态</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">草稿</option>
                <option value="review">待审核</option>
                <option value="published">已发布</option>
                <option value="rejected">已驳回</option>
              </select>
            </div>
            <div className="cs-form-group">
              <label>作者</label>
              <input value={form.author} onChange={e => set('author', e.target.value)} placeholder="作者昵称" />
            </div>
            <div className="cs-form-group">
              <label>预计/实际发布时间</label>
              <input type="datetime-local" value={form.publish_time} onChange={e => set('publish_time', e.target.value)} />
            </div>
            <div className="cs-form-group cs-full">
              <label>标签（逗号分隔）</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="AI, 职场, 工具测评" />
            </div>
            <div className="cs-form-group cs-full">
              <label>内容摘要</label>
              <textarea value={form.summary} onChange={e => set('summary', e.target.value)} placeholder="文章核心内容概述..." style={{minHeight: 72}} />
            </div>
            <div className="cs-form-group cs-full">
              <label>正文内容</label>
              <textarea value={form.content} onChange={e => set('content', e.target.value)} placeholder="粘贴文章正文内容，或上传文件后在此引用路径..." style={{minHeight: 160}} />
            </div>
            <div className="cs-form-group cs-full">
              <label>文件路径 / 链接</label>
              <input value={form.content_path} onChange={e => set('content_path', e.target.value)} placeholder="/home/.../articles/xxx.md 或 https://..." />
            </div>
            <div className="cs-form-group cs-full">
              <label>备注</label>
              <textarea value={form.remark} onChange={e => set('remark', e.target.value)} placeholder="人工复核说明、修改记录等..." style={{minHeight: 64}} />
            </div>
          </div>
        </div>
        <div className="cs-modal-footer">
          <button className="cs-btn cs-btn-secondary" onClick={onClose}>取消</button>
          <button className="cs-btn cs-btn-primary" disabled={saving} onClick={handleSave}>
            <Send size={13}/> {saving ? '保存中...' : isEdit ? '保存修改' : '创建文章'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 主组件 ─────────────────────────────────────────────────────────────────

export default function ContentStudio() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null)

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

  const filtered = articles.filter(a => {
    const matchSearch = !search ||
      a.title?.includes(search) || a.tags?.includes(search) || a.summary?.includes(search)
    const matchPlatform = filterPlatform === 'all' || a.platform === filterPlatform
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchPlatform && matchStatus
  })

  const handleSelect = (article) => {
    setSelected(prev => prev?.id === article.id ? null : article)
  }

  const handleEdit = (article) => {
    setSelected(article)
    setModal(article)
  }

  const handleModalSave = () => {
    setModal(null)
    load()
  }

  const handleDelete = () => {
    setSelected(null)
    load()
  }

  return (
    <div className="content-studio">
      {/* ── 左侧面板 ── */}
      <div className="cs-panel cs-panel-left">
        <div className="cs-panel-header">
          <h2>📝 图文制作</h2>
          <button className="cs-btn cs-btn-primary" onClick={() => setModal('add')}>
            <Plus size={13}/> 新建
          </button>
        </div>

        <Toolbar
          search={search} setSearch={setSearch}
          filterPlatform={filterPlatform} setFilterPlatform={setFilterPlatform}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        />

        <StatsBar articles={filtered} />

        <div className="cs-list">
          {loading ? (
            <div className="cs-loading">⏳ 加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="cs-empty-list">
              <FileText size={32} strokeWidth={1.2}/>
              <p>暂无文章</p>
              <button className="cs-btn cs-btn-primary" onClick={() => setModal('add')}>
                <Plus size={12}/> 新建文章
              </button>
            </div>
          ) : (
            filtered.map(a => (
              <ArticleListItem
                key={a.id}
                article={a}
                selected={selected?.id === a.id}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
      </div>

      {/* ── 右侧正文面板 ── */}
      <div className="cs-panel cs-panel-right">
        <ArticleReader
          article={selected}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {modal && (
        <ArticleModal
          article={modal === 'add' ? null : modal}
          onSave={handleModalSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
