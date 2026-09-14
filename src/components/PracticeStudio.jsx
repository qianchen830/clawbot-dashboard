import { useState, useEffect, useCallback } from 'react'
import './LearningStudio.css'

const INSTANCE_META = {
  print3d:    { name: '3D打印助手', emoji: '🖨️', domain: '3D打印' },
  kingdee:    { name: '金蝶业务', emoji: '🏭', domain: 'ERP' },
  kddev:      { name: '金蝶开发', emoji: '⚙️', domain: 'C#' },
  shortvideo: { name: '短视频', emoji: '🎬', domain: '内容创作' },
  aigame:     { name: 'AI游戏', emoji: '🎮', domain: '游戏' },
  webdev:     { name: 'Web开发', emoji: '🌐', domain: '前端' },
  imagework:  { name: '图像工坊', emoji: '🎨', domain: '图像' },
  moderation: { name: '内容审查', emoji: '🛡️', domain: '审查' },
  trainer:    { name: '训练员', emoji: '🏋️', domain: '训练' },
  main:       { name: '主控台', emoji: '🧠', domain: '架构' },
  caijing:    { name: '财经助手', emoji: '💹', domain: '财经' },
}

const STATUS_STYLE = { done: 's-done', pending: 's-pending', expired: 's-expired' }
const STATUS_LABEL = { done: '✅ 完成', pending: '⏳ 待执行', expired: '⏸️ 已过期' }
const STATUS_LABEL_SHORT = { done: '完成', pending: '待执行', expired: '已过期' }

function fmtDate(utcStr) {
  if (!utcStr) return ''
  try {
    const d = new Date(utcStr.replace(' ', 'T') + 'Z')
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai' })
  } catch { return '' }
}

function fmtFull(utcStr) {
  if (!utcStr) return ''
  try {
    const d = new Date(utcStr.replace(' ', 'T') + 'Z')
    return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  } catch { return utcStr }
}

function FilePreview({ filePath }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadContent = useCallback(async () => {
    if (!filePath) return
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/practice/file?file=${encodeURIComponent(filePath)}`)
      const j = await r.json()
      if (j.ok) setContent(j.content)
      else setError(j.error || '读取失败')
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [filePath])

  useEffect(() => { loadContent() }, [loadContent])

  if (!filePath) return null
  const fileName = filePath.split('/').pop()

  return (
    <div className="pt-detail-section pt-detail-section--file">
      <div className="pt-section-label">📄 报告内容</div>
      <div className="pt-file-header">
        <span className="pt-file-icon">📄</span>
        <div className="pt-file-meta">
          <div className="pt-file-filename">{fileName}</div>
          <div className="pt-file-fullpath">{filePath}</div>
        </div>
        <button className="pt-reload-btn" onClick={loadContent} title="刷新">🔄</button>
      </div>

      {loading && <div className="pt-file-loading">读取中…</div>}
      {error && <div className="pt-file-error">❌ {error}</div>}
      {content !== null && (
        <pre className="pt-file-content">{content}</pre>
      )}
    </div>
  )
}

function ReviewSection({ taskId }) {
  const [reviews, setReviews] = useState(null)
  useEffect(() => {
    let alive = true
    fetch(`/api/selflearning/task-reviews?task_id=${encodeURIComponent(taskId)}`)
      .then(r => r.json())
      .then(j => { if (alive) setReviews(j.reviews || []) })
      .catch(() => { if (alive) setReviews([]) })
    return () => { alive = false }
  }, [taskId])
  if (reviews === null || reviews.length === 0) return null
  return (
    <div className="pt-detail-section">
      <div className="pt-section-label">🛡️ 审查员复盘（{reviews.length}条）</div>
      {reviews.map((r, i) => (
        <div key={i} className="pt-section-body" style={{ marginBottom: 8 }}>
          <div>{r.success ? '✅' : '❌'} {r.summary}</div>
          {r.root_cause && <div style={{ color: '#d93025', fontSize: 12, marginTop: 2 }}>根因：{r.root_cause}</div>}
          {r.lessons && <div style={{ color: '#5f6368', fontSize: 12, marginTop: 2 }}>经验：{r.lessons}</div>}
          {r.routing_suggestion && <div style={{ color: '#1a73e8', fontSize: 12, marginTop: 2 }}>调度建议：{r.routing_suggestion}</div>}
        </div>
      ))}
    </div>
  )
}

function TaskDetail({ task, onClose }) {
  const meta = INSTANCE_META[task.instance] || {}

  return (
    <div className="pt-detail-overlay" onClick={onClose}>
      <div className="pt-detail" onClick={e => e.stopPropagation()}>

        {/* 头部 */}
        <div className="pt-detail-head">
          <div className="pt-detail-title">
            <span className="pt-detail-emoji">{meta.emoji}</span>
            <div>
              <div className="pt-detail-inst">{meta.name || task.instance}</div>
              <div className="pt-detail-domain">{meta.domain} · #{task.task_type}</div>
            </div>
          </div>
          <button className="pt-detail-close" onClick={onClose}>✕</button>
        </div>

        {/* 状态时间线 */}
        <div className="pt-detail-meta">
          <span className={`pt-status-badge ${STATUS_STYLE[task.status]}`}>
            {STATUS_LABEL[task.status] || task.status}
          </span>
          <span className="pt-meta-item">📅 生成：{fmtFull(task.created_at)}</span>
          {task.executed_at && <span className="pt-meta-item">🏃 执行：{fmtFull(task.executed_at)}</span>}
          {task.score != null && <span className="pt-meta-item">🛡️ 审查：{task.score}/5</span>}
        </div>

        {/* 任务描述 */}
        <div className="pt-detail-section">
          <div className="pt-section-label">📋 任务描述</div>
          <div className="pt-section-body">{task.task_desc}</div>
        </div>

        {/* 报告文件预览 */}
        {task.output_file && (
          <FilePreview filePath={task.output_file} />
        )}

        {/* 执行摘要 */}
        {task.result && (
          <div className="pt-detail-section">
            <div className="pt-section-label">📝 执行摘要</div>
            <div className="pt-section-body pt-result">{task.result}</div>
          </div>
        )}

        {/* 审查员复盘 */}
        <ReviewSection taskId={String(task.id)} />

        {/* 任务信息 */}
        <div className="pt-detail-section">
          <div className="pt-section-label">🏷️ 任务信息</div>
          <div className="pt-info-grid">
            <div className="pt-info-row"><span>实例</span><span>{meta.name || task.instance}</span></div>
            <div className="pt-info-row"><span>领域</span><span>{meta.domain}</span></div>
            <div className="pt-info-row"><span>类型</span><span>{task.task_type}</span></div>
            <div className="pt-info-row"><span>状态</span><span>{STATUS_LABEL[task.status]}</span></div>
            <div className="pt-info-row"><span>生成时间</span><span>{fmtFull(task.created_at)}</span></div>
            {task.executed_at && <div className="pt-info-row"><span>执行时间</span><span>{fmtFull(task.executed_at)}</span></div>}
            <div className="pt-info-row"><span>任务ID</span><span style={{fontFamily:'monospace',fontSize:11}}>{task.id}</span></div>
          </div>
        </div>

        {(!task.output_file && !task.result) && (
          <div className="pt-detail-section">
            <div className="pt-empty-output">⏳ 任务待执行，报告将在 10:15 练习执行器运行后生成</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PracticeStudio() {
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInstance, setSelectedInstance] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [detailTask, setDetailTask] = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/practice/tasks')
      const j = await r.json()
      setAllTasks(j.tasks || [])
    } catch { setAllTasks([]) }
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const filtered = allTasks.filter(t => {
    if (selectedInstance && t.instance !== selectedInstance) return false
    if (statusFilter && t.status !== statusFilter) return false
    if (dateFilter) {
      const taskDate = (t.created_at || '').slice(0, 10)
      if (taskDate !== dateFilter) return false
    }
    return true
  })

  const allDates = [...new Set(allTasks.map(t => (t.created_at || '').slice(0, 10)).filter(d => d))].sort().reverse()

  const instanceStats = {}
  allTasks.forEach(t => {
    if (!instanceStats[t.instance]) {
      instanceStats[t.instance] = { done: 0, pending: 0, expired: 0, total: 0 }
    }
    instanceStats[t.instance][t.status]++
    instanceStats[t.instance].total++
  })

  const selectedTask = detailTask ? (allTasks.find(t => t.id === detailTask) || null) : null

  return (
    <div className="pt-page">
      {/* 左侧边栏 */}
      <aside className="pt-sidebar">
        <div className="pt-sidebar-head">
          <span className="pt-sidebar-title">实例</span>
          <span className="pt-sidebar-count">{Object.keys(instanceStats).length}</span>
        </div>

        <div
          className={`pt-inst-item ${selectedInstance === '' ? 'active' : ''}`}
          onClick={() => setSelectedInstance('')}
        >
          <span className="pt-inst-emoji">🌐</span>
          <div className="pt-inst-info">
            <div className="pt-inst-name">全部实例</div>
            <div className="pt-inst-meta">
              {Object.values(instanceStats).reduce((s, v) => s + v.total, 0)} 个任务
            </div>
          </div>
        </div>

        {Object.entries(instanceStats)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([inst, stats]) => {
            const meta = INSTANCE_META[inst] || {}
            return (
              <div
                key={inst}
                className={`pt-inst-item ${selectedInstance === inst ? 'active' : ''}`}
                onClick={() => setSelectedInstance(selectedInstance === inst ? '' : inst)}
              >
                <span className="pt-inst-emoji">{meta.emoji || '🤖'}</span>
                <div className="pt-inst-info">
                  <div className="pt-inst-name">{meta.name || inst}</div>
                  <div className="pt-inst-meta">
                    <span className="pt-stat-done">✅{stats.done}</span>
                    {' '}
                    <span className="pt-stat-pending">⏳{stats.pending}</span>
                    {' '}
                    <span className="pt-stat-expired">⏸️{stats.expired}</span>
                  </div>
                </div>
              </div>
            )
          })}

        <div className="pt-sidebar-footer">
          <div className="pt-schedule">
            <div className="pt-sched-title">⏰ 调度时间</div>
            <div>05:00 Hermes深度复盘</div>
            <div>10:15 执行练习</div>
            <div>11:00 审查员审查</div>
            <div>13-15:40 隔天学习</div>
            <div>22:40+ 错峰复盘</div>
          </div>
        </div>
      </aside>

      {/* 右侧主区 */}
      <main className="pt-main">
        {/* 过滤器 */}
        <div className="pt-filters">
          <div className="pt-filter-group">
            <label className="pt-filter-label">日期</label>
            <select className="pt-filter-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
              <option value="">全部日期</option>
              {allDates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="pt-filter-group">
            <label className="pt-filter-label">状态</label>
            <select className="pt-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">全部状态</option>
              <option value="pending">⏳ 待执行</option>
              <option value="done">✅ 已完成</option>
              <option value="expired">⏸️ 已过期</option>
            </select>
          </div>

          <div className="pt-filter-summary">
            共 <strong>{filtered.length}</strong> 个任务
            {selectedInstance && ` · ${INSTANCE_META[selectedInstance]?.name || selectedInstance}`}
            {statusFilter && ` · ${STATUS_LABEL_SHORT[statusFilter]}`}
          </div>

          <button className="pt-refresh-btn" onClick={() => loadAll()}>🔄</button>
        </div>

        {/* 任务列表 */}
        {loading ? (
          <div className="pt-loading">加载中…</div>
        ) : filtered.length === 0 ? (
          <div className="pt-empty">
            <div className="pt-empty-icon">🎯</div>
            <div>没有符合条件的任务</div>
            <small>试试切换筛选条件，或等待 09:00 生成新任务</small>
          </div>
        ) : (
          <div className="pt-task-list">
            {filtered.map(t => {
              const meta = INSTANCE_META[t.instance] || {}
              const outputName = t.output_file ? t.output_file.split('/').pop() : null
              return (
                <div
                  key={t.id}
                  className={`pt-task-card inst-${t.instance}`}
                  onClick={() => setDetailTask(t.id)}
                >
                  <div className="pt-task-top">
                    <div className="pt-task-inst">
                      <span>{meta.emoji || '🤖'}</span>
                      <span className="pt-task-inst-name">{meta.name || t.instance}</span>
                      <span className="pt-task-date">{fmtDate(t.created_at)}</span>
                    </div>
                    <span className={`pt-status-badge-sm ${STATUS_STYLE[t.status]}`}>
                      {STATUS_LABEL_SHORT[t.status]}
                    </span>
                  </div>

                  <div className="pt-task-type">#{t.task_type} · {meta.domain}</div>
                  <div className="pt-task-desc">{t.task_desc}</div>

                  {outputName && (
                    <div className="pt-task-output">📁 {outputName}</div>
                  )}

                  <div className="pt-task-footer">
                    <span className="pt-task-id">#{t.id}</span>
                    {t.score != null && (
                      <span style={{ fontSize: 11, color: t.score >= 3 ? '#188038' : '#d93025' }}>🛡️ {t.score}/5</span>
                    )}
                    <span className="pt-task-view">查看详情 →</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* 详情弹窗 */}
      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={() => setDetailTask(null)} />
      )}
    </div>
  )
}
