import { useState, useEffect, useCallback } from 'react'
import './LearningStudio.css'

const INSTANCE_META = {
  print3d:    { name: '3D打印助手', emoji: '🖨️', domain: '3D打印' },
  kingdee:    { name: '金蝶业务', emoji: '🏭', domain: 'ERP' },
  kddev:      { name: '金蝶开发', emoji: '⚙️', domain: 'C#/插件' },
  shortvideo: { name: '短视频', emoji: '🎬', domain: '内容创作' },
  aigame:     { name: 'AI游戏', emoji: '🎮', domain: '游戏' },
  webdev:     { name: 'Web开发', emoji: '🌐', domain: '前端' },
  imagework:  { name: '图像工坊', emoji: '🎨', domain: '图像' },
  moderation: { name: '内容审查', emoji: '🛡️', domain: '审查' },
  trainer:    { name: '训练员', emoji: '🏋️', domain: '训练' },
  main:       { name: '主控台', emoji: '🧠', domain: '系统架构/调度' },
  caijing:    { name: '财经助手', emoji: '💹', domain: '财经' },
  backup:     { name: '财经助手', emoji: '💹', domain: '财经' },
}

const ACTION_LABEL = {
  'active-learning': '📚 主动学习',
  'daily-review':    '🔍 每日复盘',
  'web-fetch':       '🌐 内容抓取',
}

const OUTCOME_STYLE = {
  positive: 'o-positive',
  negative: 'o-negative',
  neutral: 'o-neutral',
}

function fmtLocal(utcStr) {
  if (!utcStr) return ''
  try {
    const d = new Date(utcStr.replace(' ', 'T') + 'Z')
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' })
  } catch { return utcStr }
}

function fmtFull(utcStr) {
  if (!utcStr) return ''
  try {
    const d = new Date(utcStr.replace(' ', 'T') + 'Z')
    return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  } catch { return utcStr }
}

function DetailModal({ lesson, onClose }) {
  const meta = INSTANCE_META[lesson.instance] || {}
  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div className="ls-modal" onClick={e => e.stopPropagation()}>
        <div className="ls-modal-head">
          <span className="ls-modal-inst">{meta.emoji} {meta.name || lesson.instance}</span>
          <button className="ls-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ls-modal-meta">
          <span className={`ls-outcome ${OUTCOME_STYLE[lesson.outcome] || 'o-neutral'}`}>{lesson.outcome}</span>
          <span className="ls-modal-action">{ACTION_LABEL[lesson.action] || lesson.action}</span>
          <span className="ls-modal-domain">{meta.domain}</span>
          <span className="ls-modal-time">{fmtFull(lesson.created_at)}</span>
        </div>

        {lesson.context && (
          <div className="ls-modal-section">
            <div className="ls-modal-label">📍 学习来源</div>
            <div className="ls-modal-context">{lesson.context}</div>
          </div>
        )}

        <div className="ls-modal-section">
          <div className="ls-modal-label">💡 核心知识点</div>
          <div className="ls-modal-insight">{lesson.insight}</div>
        </div>

        <div className="ls-modal-section">
          <div className="ls-modal-label">🏷️ 标签</div>
          <div className="ls-modal-tags">
            {lesson.tags && lesson.tags.split(',').map(t => (
              <span key={t.trim()} className="ls-tag">#{t.trim()}</span>
            ))}
          </div>
        </div>

        <div className="ls-modal-section ls-modal-raw">
          <div className="ls-modal-label">📊 原始数据</div>
          <pre className="ls-modal-pre">{JSON.stringify({
            instance: lesson.instance,
            domain: lesson.domain,
            action: lesson.action,
            outcome: lesson.outcome,
            tags: lesson.tags,
            created_at: lesson.created_at,
          }, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}

function LessonCard({ lesson, onDetail }) {
  const meta = INSTANCE_META[lesson.instance] || {}
  const PREVIEW_LINES = 3

  return (
    <div className={`ls-card ${lesson.instance ? 'inst-' + lesson.instance : ''}`}>
      <div className="ls-card-head">
        <span className="ls-card-inst">{meta.emoji} {meta.name || lesson.instance}</span>
        <div className="ls-card-badges">
          <span className="ls-badge-action">{ACTION_LABEL[lesson.action] || lesson.action}</span>
          <span className={`ls-outcome ${OUTCOME_STYLE[lesson.outcome] || 'o-neutral'}`}>{lesson.outcome}</span>
        </div>
        <span className="ls-card-time">{fmtLocal(lesson.created_at)}</span>
      </div>

      <div className="ls-card-domain">{meta.domain}</div>

      <div className="ls-card-insight">{lesson.insight}</div>

      <div className="ls-card-foot">
        {lesson.tags && lesson.tags.split(',').map(t => (
          <span key={t.trim()} className="ls-tag">#{t.trim()}</span>
        ))}
        <button className="ls-detail-btn" onClick={() => onDetail(lesson)}>
          查看详情 →
        </button>
      </div>
    </div>
  )
}

export default function LearningStudio() {
  const [overview, setOverview] = useState(null)
  const [lessons, setLessons] = useState([])
  const [date, setDate] = useState(() => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10))
  const [instance, setInstance] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState('')
  const [detailLesson, setDetailLesson] = useState(null)

  const loadOverview = useCallback(async () => {
    try {
      const r = await fetch('/api/selflearning/overview')
      setOverview(await r.json())
    } catch { setOverview({ ok: true, instances: [], dates: [], today: '' }) }
  }, [])

  const loadLessons = useCallback(async (d, inst) => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ date: d })
      if (inst) q.set('instance', inst)
      const r = await fetch('/api/selflearning/lessons?' + q)
      const j = await r.json()
      setLessons(j.lessons || [])
    } catch { setLessons([]) }
    setLoading(false)
  }, [])

  useEffect(() => { loadOverview() }, [loadOverview])
  useEffect(() => { loadLessons(date, instance) }, [date, instance, loadLessons])

  const syncHermes = async () => {
    setSyncing(true)
    try {
      const r = await fetch(`/api/selflearning/sync-hermes?date=${date}`, { method: 'POST' })
      const j = await r.json()
      setToast(j.ok ? `✅ 已同步 ${j.count} 条到 Hermes` : `⚠️ ${j.error}`)
    } catch { setToast('❌ 同步失败') }
    setSyncing(false)
    setTimeout(() => setToast(''), 4000)
  }

  const today = overview?.today || date
  const insts = overview?.instances || []
  const isToday = date === today

  return (
    <div className="ls-page">
      {detailLesson && <DetailModal lesson={detailLesson} onClose={() => setDetailLesson(null)} />}

      <div className="ls-header">
        <div>
          <h2>🧬 自主学习</h2>
          <p className="ls-sub">实例每日复盘 → 共享记忆库 → Hermes 经验沉淀</p>
        </div>
        <div className="ls-toolbar">
          <label className="ls-date-label">
            📅
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            {isToday && <span className="ls-today-badge">今天</span>}
          </label>
          <select value={instance} onChange={e => setInstance(e.target.value)} className="ls-inst-select">
            <option value="">全部实例</option>
            {insts.map(i => (
              <option key={i.instance} value={i.instance}>
                {INSTANCE_META[i.instance]?.name || i.instance}
              </option>
            ))}
          </select>
          <button className="ls-sync-btn" onClick={syncHermes} disabled={syncing}>
            {syncing ? '同步中…' : '🔄 同步到 Hermes'}
          </button>
        </div>
      </div>

      {toast && <div className="ls-toast">{toast}</div>}

      <div className="ls-body">
        <aside className="ls-sidebar">
          <div className="ls-side-title">实例 ({insts.length})</div>
          {insts.length === 0 && (
            <div className="ls-empty-side">
              暂无实例学习记录<br />
              <small>等待各实例每日复盘 cron 产出</small>
            </div>
          )}
          {insts.map(i => (
            <div
              key={i.instance}
              className={`ls-inst-card ${instance === i.instance ? 'active' : ''}`}
              onClick={() => setInstance(instance === i.instance ? '' : i.instance)}
            >
              <span className="ls-inst-emoji">{INSTANCE_META[i.instance]?.emoji || '🤖'}</span>
              <div className="ls-inst-info">
                <div className="ls-inst-name">{INSTANCE_META[i.instance]?.name || i.instance}</div>
                <div className="ls-inst-meta">共 {i.total} 条 · {fmtLocal(i.last_at)}</div>
              </div>
              {i.today_count > 0
                ? <span className="ls-badge done">今日✓</span>
                : <span className="ls-badge pending">未学</span>}
            </div>
          ))}
        </aside>

        <main className="ls-main">
          <div className="ls-summary-bar">
            <span>{date} · {lessons.length} 条记录 · 共 {insts.length} 个实例</span>
            <span>数据源：~/.shared-memory/lessons.db</span>
          </div>

          {loading && <div className="ls-loading">加载中…</div>}

          {!loading && lessons.length === 0 && (
            <div className="ls-empty">
              <div className="ls-empty-icon">🫧</div>
              <div>这一天还没有学习记录</div>
              <small>各实例每天 22:30 自动复盘；14:00 主动学习</small>
            </div>
          )}

          {!loading && lessons.map(l => (
            <LessonCard key={l.id} lesson={l} onDetail={setDetailLesson} />
          ))}
        </main>
      </div>
    </div>
  )
}
