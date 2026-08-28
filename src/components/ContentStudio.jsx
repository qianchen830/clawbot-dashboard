import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Search, Edit2, Trash2, X, FileText, BookOpen,
  Clock, Tag, User, Link as LinkIcon, Send, ChevronLeft,
  CheckCircle, AlertCircle, Globe, FileText as FileIcon
} from 'lucide-react'
import './ContentStudio.css'

const API = ''

const STATUS = {
  draft:     { label: '草稿',     color: '#64748b', bg: '#64748b20' },
  review:    { label: '待审核',   color: '#f59e0b', bg: '#f59e0b20' },
  published: { label: '已发布',   color: '#10b981', bg: '#10b98120' },
  rejected:  { label: '已驳回',   color: '#ef4444', bg: '#ef444420' },
}

const PLATFORM = {
  wechat:      { label: '公众号',   color: '#34d399', bg: '#34d39920' },
  xiaohongshu: { label: '小红书',   color: '#fb7185', bg: '#fb718520' },
  douyin:      { label: '抖音',     color: '#5eead4', bg: '#5eead420' },
  other:       { label: '其他',     color: '#a5b4fc', bg: '#a5b4fc20' },
}

const STATUS_TABS = [
  { key: 'all',       label: '全部' },
  { key: 'draft',     label: '草稿' },
  { key: 'review',    label: '待审核' },
  { key: 'published', label: '已发布' },
]

// ── API ─────────────────────────────────────────────────────────────────────

async function req(path, opts = {}) {
  const r = await fetch(`${API}${path}`, { headers: { 'content-type': 'application/json' }, ...opts })
  if (!r.ok) throw new Error(`请求失败: ${r.status}`)
  return r.json()
}

const fetchArticles = () => req('/api/content/articles')
const createArticle = d => req('/api/content/articles', { method: 'POST', body: JSON.stringify(d) })
const updateArticle = (id, d) => req(`/api/content/articles/${id}`, { method: 'PUT', body: JSON.stringify(d) })
const deleteArticle = id => req(`/api/content/articles/${id}`, { method: 'DELETE' })

function toast(msg) {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.style.transform = 'translateX(-50%) translateY(0)'
  setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(100px)' }, 3000)
}

function fmt(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function wordCount(text) {
  if (!text) return 0
  // 统计中文字符数（不含 frontmatter ---...--- 区段）
  const lines = text.split('\n')
  let body = ''
  let inFm = false
  for (const line of lines) {
    if (line.trim() === '---') { inFm = !inFm; continue }
    if (!inFm) body += line
  }
  // 中文字符 + 英文单词混排时，英文单词按空格折算
  const chinese = (body.match(/[\u4e00-\u9fff]/g) || []).length
  const english = (body.match(/[a-zA-Z]+/g) || []).join(' ')
  const englishWords = english.trim() ? english.trim().split(/\s+/).length : 0
  return chinese + englishWords
}

// ── 左侧：状态 Tab + 列表 ───────────────────────────────────────────────────

function LeftPanel({ articles, loading, search, setSearch, tab, setTab, selected, onSelect, onNew }) {
  const filtered = articles.filter(a => {
    const hit = !search ||
      a.title?.includes(search) || a.tags?.includes(search) || a.summary?.includes(search)
    const ok = tab === 'all' || a.status === tab
    return hit && ok
  })

  const counts = {
    draft:    articles.filter(a => a.status === 'draft').length,
    review:   articles.filter(a => a.status === 'review').length,
    published:articles.filter(a => a.status === 'published').length,
  }

  return (
    <div className="cs-left">
      <div className="cs-left-header">
        <span className="cs-left-title">📝 图文制作</span>
        <button className="cs-btn-primary-sm" onClick={onNew}>+ 新建</button>
      </div>

      <div className="cs-tabs">
        {STATUS_TABS.map(t => {
          const n = t.key === 'all' ? articles.length : (counts[t.key] || 0)
          return (
            <button key={t.key} className={`cs-tab ${tab === t.key ? 'cs-tab-on' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
              {n > 0 && <span className="cs-tab-n">{n}</span>}
            </button>
          )
        })}
      </div>

      <div className="cs-search">
        <Search size={12} className="cs-search-ico" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索标题、标签..." className="cs-search-in" />
      </div>

      <div className="cs-list">
        {loading ? (
          <div className="cs-list-tip">⏳ 加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="cs-list-tip">暂无文章</div>
        ) : filtered.map(a => (
          <ListItem key={a.id} article={a} active={selected?.id === a.id} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function ListItem({ article, active, onSelect }) {
  const st = STATUS[article.status] || STATUS.draft
  const pl = PLATFORM[article.platform] || PLATFORM.other
  return (
    <div className={`cs-item ${active ? 'cs-item-on' : ''}`} onClick={() => onSelect(article)}>
      <div className="cs-item-head">
        <span className="cs-badge" style={{ color: pl.color, background: pl.bg }}>{pl.label}</span>
        <span className="cs-dot" style={{ background: st.color, boxShadow: `0 0 6px ${st.color}90` }} />
        <span className="cs-item-st" style={{ color: st.color }}>{st.label}</span>
      </div>
      <div className="cs-item-title">{article.title || '无标题'}</div>
      <div className="cs-item-foot">
        {article.author && <span className="cs-item-ai"><User size={9}/>{article.author}</span>}
        <span className="cs-item-ai"><Clock size={9}/>{fmt(article.publish_time || article.created_at)}</span>
        {article.content && <span className="cs-item-ai"><FileIcon size={9}/>{wordCount(article.content)}字</span>}
      </div>
      {article.tags && (
        <div className="cs-item-tags">
          {article.tags.split(',').filter(Boolean).slice(0,3).map((t,i) => <span key={i} className="cs-mini-tag">{t.trim()}</span>)}
        </div>
      )}
    </div>
  )
}

// ── 右侧：阅读模式 ──────────────────────────────────────────────────────────

function ReadView({ article, onEdit, onNew }) {
  const st = STATUS[article.status] || STATUS.draft
  const pl = PLATFORM[article.platform] || PLATFORM.other
  const wc = wordCount(article.content)

  return (
    <div className="cs-read">
      {/* 顶部操作栏 */}
      <div className="cs-read-bar">
        <div className="cs-read-bar-l">
          <span className="cs-badge" style={{ color: pl.color, background: pl.bg }}>{pl.label}</span>
          <span className="cs-st-badge" style={{ color: st.color, background: st.bg }}>{st.label}</span>
        </div>
        <div className="cs-read-bar-r">
          <button className="cs-btn-ghost-sm" onClick={onNew}>+ 新建</button>
          <button className="cs-btn-edit" onClick={onEdit}>
            <Edit2 size={12}/> 编辑
          </button>
        </div>
      </div>

      {/* 文章容器 */}
      <div className="cs-article">
        <h1 className="cs-article-title">{article.title || '无标题'}</h1>

        <div className="cs-article-meta">
          {article.author && <span><User size={11}/>{article.author}</span>}
          <span><Clock size={11}/>{fmt(article.publish_time || article.created_at)}</span>
          {wc > 0 && <span><FileIcon size={11}/>{wc} 字</span>}
          {article.updated_at && <span>更新于 {fmt(article.updated_at)}</span>}
        </div>

        {article.tags && (
          <div className="cs-article-tag-row">
            <Tag size={10} style={{color:'#3d4f63'}}/>
            {article.tags.split(',').filter(Boolean).map((t,i) => <span key={i} className="cs-tagger">{t.trim()}</span>)}
          </div>
        )}

        {article.summary && (
          <div className="cs-article-sum">
            <div className="cs-article-sum-lbl">摘要</div>
            <p>{article.summary}</p>
          </div>
        )}

        <div className="cs-article-body-lbl">正文</div>
        <div className="cs-article-body">
          {article.content ? (
            <div className="cs-article-text" dangerouslySetInnerHTML={{ __html: article.content }} />
          ) : article.content_path ? (
            <div className="cs-article-link">
              <Link as_={LinkIcon} size={13}/>
              <code>{article.content_path}</code>
            </div>
          ) : (
            <div className="cs-article-empty">暂无正文内容</div>
          )}
        </div>

        {article.remark && (
          <div className="cs-article-note">
            <div className="cs-note-lbl">📋 备注</div>
            <p>{article.remark}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// We need to alias Link since it's also a named export
const Link = LinkIcon

// ── 右侧：编辑模式 ──────────────────────────────────────────────────────────

function EditView({ article, isNew, onSave, onCancel }) {
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
  const wc = wordCount(form.content)

  const save = async () => {
    if (!form.title.trim()) { toast('标题不能为空'); titleRef.current?.focus(); return }
    setSaving(true)
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean).join(',') }
      if (isNew) { await createArticle(payload); toast('创建成功') }
      else       { await updateArticle(article.id, payload); toast('保存成功') }
      onSave()
    } catch (e) { toast(e.message) }
    finally      { setSaving(false) }
  }

  const del = async () => {
    if (!confirm('删除这篇文章？')) return
    setDeleting(true)
    try {
      await deleteArticle(article.id)
      toast('已删除')
      onSave() // back to list
    } catch (e) { toast(e.message); setDeleting(false) }
  }

  return (
    <div className="cs-edit">
      {/* 顶部操作栏 */}
      <div className="cs-edit-bar">
        <button className="cs-btn-ghost-sm" onClick={onCancel}>
          <ChevronLeft size={13}/> 返回
        </button>
        <div className="cs-edit-bar-r">
          {!isNew && (
            <button className="cs-btn-del-sm" disabled={deleting} onClick={del}>
              <Trash2 size={12}/> {deleting ? '删除中...' : '删除'}
            </button>
          )}
          <button className="cs-btn-pub" disabled={saving} onClick={save}>
            <Send size={12}/> {saving ? '保存中...' : isNew ? '创建' : '保存'}
          </button>
        </div>
      </div>

      {/* 编辑区 */}
      <div className="cs-edit-body">
        {/* 平台 & 状态选择 */}
        <div className="cs-edit-chips">
          <div className="cs-chip-row">
            <span className="cs-chip-hdr">平台</span>
            {Object.entries(PLATFORM).map(([k,v]) => (
              <button key={k} className={`cs-chip ${form.platform===k?'cs-chip-on':''}`}
                style={form.platform===k?{color:v.color,borderColor:v.color+'60',background:v.bg}:{}}
                onClick={()=>set('platform',k)}>{v.label}</button>
            ))}
          </div>
          <div className="cs-chip-row">
            <span className="cs-chip-hdr">状态</span>
            {Object.entries(STATUS).map(([k,v]) => (
              <button key={k} className={`cs-chip ${form.status===k?'cs-chip-on':''}`}
                style={form.status===k?{color:v.color,borderColor:v.color+'60',background:v.bg}:{}}
                onClick={()=>set('status',k)}>{v.label}</button>
            ))}
          </div>
        </div>

        {/* 标题 */}
        <input
          ref={titleRef}
          className="cs-edit-title"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="文章标题..."
        />

        {/* 元信息一行 */}
        <div className="cs-edit-meta">
          <div className="cs-meta-in">
            <User size={11} className="cs-meta-ico"/>
            <input value={form.author} onChange={e => set('author', e.target.value)}
              placeholder="作者" className="cs-meta-line"/>
          </div>
          <div className="cs-meta-in">
            <Clock size={11} className="cs-meta-ico"/>
            <input type="datetime-local" value={form.publish_time}
              onChange={e => set('publish_time', e.target.value)} className="cs-meta-line"/>
          </div>
          <div className="cs-meta-in cs-meta-in-lg">
            <Tag size={11} className="cs-meta-ico"/>
            <input value={form.tags} onChange={e => set('tags', e.target.value)}
              placeholder="标签（逗号分隔）" className="cs-meta-line"/>
          </div>
        </div>

        {/* 摘要 */}
        <div className="cs-edit-section">
          <div className="cs-s-lbl">内容摘要</div>
          <textarea className="cs-ta cs-ta-sum" value={form.summary}
            onChange={e => set('summary', e.target.value)} placeholder="文章核心内容概述..." rows={3}/>
        </div>

        {/* 正文 */}
        <div className="cs-edit-section">
          <div className="cs-s-lbl">正文内容 {wc > 0 && <span className="cs-wc">{wc} 字</span>}</div>
          <textarea className="cs-ta cs-ta-body" value={form.content}
            onChange={e => set('content', e.target.value)} placeholder="开始写正文..." rows={20}/>
        </div>

        {/* 文件路径 */}
        <div className="cs-edit-section">
          <div className="cs-s-lbl"><LinkIcon size={10}/> 文件路径 / 链接</div>
          <input className="cs-path-in" value={form.content_path}
            onChange={e => set('content_path', e.target.value)}
            placeholder="/path/to/article.md 或 https://..."/>
        </div>

        {/* 备注 */}
        <div className="cs-edit-section">
          <div className="cs-s-lbl">备注</div>
          <textarea className="cs-ta cs-ta-note" value={form.remark}
            onChange={e => set('remark', e.target.value)} placeholder="人工复核说明..." rows={2}/>
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
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('empty') // 'empty' | 'read' | 'edit' | 'new'

  const load = useCallback(async () => {
    setLoading(true)
    try { setArticles(await fetchArticles()) }
    catch { setArticles([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const select = (a) => { setSelected(a); setMode('read') }
  const newArticle = () => { setSelected(null); setMode('new') }
  const toRead = () => setMode('read')
  const toEdit = () => setMode('edit')
  const onSave = () => { setMode('read'); load() }
  const onCancel = () => { if (selected) setMode('read'); else setMode('empty') }

  return (
    <div className="content-studio">
      <LeftPanel
        articles={articles} loading={loading}
        search={search} setSearch={setSearch}
        tab={tab} setTab={setTab}
        selected={selected} onSelect={select} onNew={newArticle}
      />
      <div className="cs-right">
        {mode === 'empty' && (
          <div className="cs-blank">
            <FileText size={52} strokeWidth={0.8}/>
            <p>选择一篇文章</p>
          </div>
        )}
        {(mode === 'read' || mode === 'edit') && selected && mode === 'read' && (
          <ReadView article={selected} onEdit={toEdit} onNew={newArticle}/>
        )}
        {(mode === 'edit' || mode === 'new') && (
          <EditView
            article={mode === 'edit' ? selected : null}
            isNew={mode === 'new'}
            onSave={onSave} onCancel={onCancel}
          />
        )}
      </div>
    </div>
  )
}
