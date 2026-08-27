import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Eye, Edit2, Trash2, X, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import './ContentStudio.css'

const API = ''

const STATUS_MAP = {
  draft: { label: '草稿', cls: 'cs-status-draft' },
  review: { label: '待审核', cls: 'cs-status-review' },
  published: { label: '已发布', cls: 'cs-status-published' },
  rejected: { label: '已驳回', cls: 'cs-status-rejected' },
}

const PLATFORM_MAP = {
  wechat: { label: '公众号', cls: 'cs-platform-wechat' },
  xiaohongshu: { label: '小红书', cls: 'cs-platform-xiaohongshu' },
  douyin: { label: '抖音', cls: 'cs-platform-douyin' },
  other: { label: '其他', cls: 'cs-platform-other' },
}

// ── API ─────────────────────────────────────────────────────────────────────

async function fetchArticles(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${API}/api/content/articles${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error('获取文章列表失败')
  return res.json()
}

async function createArticle(data) {
  const res = await fetch(`${API}/api/content/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('创建失败')
  return res.json()
}

async function updateArticle(id, data) {
  const res = await fetch(`${API}/api/content/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('更新失败')
  return res.json()
}

async function deleteArticle(id) {
  const res = await fetch(`${API}/api/content/articles/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('删除失败')
  return res.json()
}

// ── 工具函数 ─────────────────────────────────────────────────────────────────

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
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ── 空状态 ─────────────────────────────────────────────────────────────────

function EmptyState({ onAdd }) {
  return (
    <div className="cs-empty">
      <div className="cs-empty-icon">📝</div>
      <p style={{marginBottom: 8, fontSize: 15, fontWeight: 600, color: '#64748b'}}>还没有任何文章记录</p>
      <p style={{marginBottom: 20, fontSize: 13, color: '#475569'}}>
        点击下方按钮添加第一篇，支持公众号 / 小红书 / 抖音内容登记
      </p>
      <button className="cs-btn cs-btn-primary" onClick={onAdd}>
        <Plus size={14} /> 新建文章
      </button>
    </div>
  )
}

// ── 文章表单弹窗 ─────────────────────────────────────────────────────────────

function ArticleModal({ article, onSave, onClose }) {
  const isEdit = !!article?.id
  const [form, setForm] = useState({
    title: article?.title || '',
    platform: article?.platform || 'wechat',
    status: article?.status || 'draft',
    author: article?.author || '',
    tags: article?.tags || '',
    summary: article?.summary || '',
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
      if (isEdit) {
        await updateArticle(article.id, payload)
        toast('更新成功')
      } else {
        await createArticle(payload)
        toast('创建成功')
      }
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
              <textarea value={form.summary} onChange={e => set('summary', e.target.value)} placeholder="文章核心内容概述..." />
            </div>
            <div className="cs-form-group cs-full">
              <label>文件路径 / 链接</label>
              <input value={form.content_path} onChange={e => set('content_path', e.target.value)} placeholder="/home/.../articles/xxx.md 或 https://..." />
            </div>
            <div className="cs-form-group cs-full">
              <label>备注</label>
              <textarea value={form.remark} onChange={e => set('remark', e.target.value)} placeholder="人工复核说明、修改记录等..." />
            </div>
          </div>
        </div>
        <div className="cs-modal-footer">
          <button className="cs-btn cs-btn-secondary" onClick={onClose}>取消</button>
          <button className="cs-btn cs-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : isEdit ? '保存修改' : '创建'}
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
  const [modal, setModal] = useState(null) // null | 'add' | article object
  const [detailId, setDetailId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

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
      a.title?.includes(search) ||
      a.tags?.includes(search) ||
      a.summary?.includes(search)
    const matchPlatform = filterPlatform === 'all' || a.platform === filterPlatform
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchPlatform && matchStatus
  })

  const stats = {
    total: articles.length,
    draft: articles.filter(a => a.status === 'draft').length,
    review: articles.filter(a => a.status === 'review').length,
    published: articles.filter(a => a.status === 'published').length,
  }

  const handleDelete = async (id) => {
    if (!confirm('确认删除这篇文章？')) return
    setDeletingId(id)
    try {
      await deleteArticle(id)
      toast('已删除')
      load()
    } catch (e) {
      toast(e.message)
    } finally {
      setDeletingId(null)
    }
  }

  const selectedArticle = detailId ? articles.find(a => a.id === detailId) : null

  return (
    <div className="content-studio">
      {/* 头部 */}
      <div className="cs-header">
        <h2>📝 图文制作</h2>
        <button className="cs-btn cs-btn-primary" onClick={() => setModal('add')}>
          <Plus size={14} /> 新建文章
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="cs-stats">
        <div className="cs-stat-card">
          <div className="cs-stat-value">{stats.total}</div>
          <div className="cs-stat-label">全部文章</div>
        </div>
        <div className="cs-stat-card">
          <div className="cs-stat-value" style={{color:'#9ca3af'}}>{stats.draft}</div>
          <div className="cs-stat-label">草稿</div>
        </div>
        <div className="cs-stat-card">
          <div className="cs-stat-value" style={{color:'#fbbf24'}}>{stats.review}</div>
          <div className="cs-stat-label">待审核</div>
        </div>
        <div className="cs-stat-card">
          <div className="cs-stat-value" style={{color:'#22c55e'}}>{stats.published}</div>
          <div className="cs-stat-label">已发布</div>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className="cs-toolbar">
        <input
          type="text"
          placeholder="搜索标题 / 标签 / 摘要..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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

      {/* 文章列表 */}
      {loading ? (
        <div className="cs-empty"><div className="cs-empty-icon">⏳</div>加载中...</div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => setModal('add')} />
      ) : (
        <div className="cs-article-list">
          {filtered.map(a => {
            const pm = PLATFORM_MAP[a.platform] || PLATFORM_MAP.other
            const sm = STATUS_MAP[a.status] || STATUS_MAP.draft
            return (
              <div key={a.id} className="cs-article-row" data-status={a.status || 'draft'}>
                <div className="cs-row-indicator"/>
                <span className={`cs-article-platform ${pm.cls}`}>{pm.label}</span>
                <div className="cs-article-body">
                  <div className="cs-article-title">{a.title}</div>
                  <div className="cs-article-meta">
                    <span>👤 {a.author || '未知'}</span>
                    <span>📅 {fmtDate(a.publish_time || a.created_at)}</span>
                    <span className={`cs-status-badge ${sm.cls}`}>{sm.label}</span>
                  </div>
                  {a.tags && (
                    <div className="cs-article-tags">
                      {a.tags.split(',').filter(Boolean).map((t, i) => (
                        <span key={i} className="cs-tag">{t.trim()}</span>
                      ))}
                    </div>
                  )}
                  {a.summary && (
                    <div className="cs-summary">{a.summary}</div>
                  )}
                </div>
                <div className="cs-article-actions">
                  <button className="cs-btn cs-btn-secondary" style={{padding: '5px 8px'}} title="查看" onClick={() => setDetailId(detailId === a.id ? null : a.id)}>
                    <Eye size={13}/>
                  </button>
                  <button className="cs-btn cs-btn-secondary" style={{padding: '5px 8px'}} title="编辑" onClick={() => setModal(a)}>
                    <Edit2 size={13}/>
                  </button>
                  <button className="cs-btn cs-btn-danger" style={{padding: '5px 8px'}} title="删除" disabled={deletingId === a.id} onClick={() => handleDelete(a.id)}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 详情展开 */}
      {selectedArticle && (
        <div className="cs-article-detail">
          <div style={{display:'flex', justifyContent:'space-between', marginBottom: 10}}>
            <strong style={{color:'#e8eaed'}}>{selectedArticle.title}</strong>
            <button className="cs-btn cs-btn-secondary" style={{padding:'3px 7px'}} onClick={() => setDetailId(null)}><X size={12}/></button>
          </div>
          {selectedArticle.summary && <p><strong>摘要：</strong>{selectedArticle.summary}</p>}
          {selectedArticle.content_path && <p><strong>路径：</strong><code style={{fontSize:11,color:'#9ca3af'}}>{selectedArticle.content_path}</code></p>}
          {selectedArticle.remark && <p><strong>备注：</strong>{selectedArticle.remark}</p>}
          <p style={{fontSize: 11, color: '#4b5563', marginTop: 8}}>
            创建于 {fmtDate(selectedArticle.created_at)} · 更新于 {fmtDate(selectedArticle.updated_at)}
          </p>
        </div>
      )}

      {/* 新建 / 编辑弹窗 */}
      {modal && <ArticleModal article={modal === 'add' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
    </div>
  )
}
