import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Send, Clock, Tag, X, Search, ChevronRight, ChevronLeft } from 'lucide-react'
import { LEARNING_TOPICS, fetchLearningStatus, triggerLearning, fetchLearningHistory, fetchLearningByCategory, fetchLearningDetail } from '../services/config'
import './KnowledgeCenter.css'

const EXCLUDED_CATEGORIES = ['成长']

function dedupCronCategories(records) {
  const seen = new Set()
  return records
    .filter(r => !EXCLUDED_CATEGORIES.includes(r.category))
    .reverse()
    .filter(r => {
      const key = r.topic || ''
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .reverse()
}

function DetailDrawer({ record, detail, loading, onClose }) {
  if (!record) return null
  const catColor = {
    'AI技术': '#00e5ff', '心理学': '#ff4081', '会计': '#ff9100',
    '历史': '#a78bfa', 'FDE': '#00e676', '中医': '#ff6d00'
  }[record.category] || '#888'

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <h2 className="drawer-title">{record.topic}</h2>
            <span className="drawer-cat" style={{ color: catColor, borderColor: catColor + '40', background: catColor + '15' }}>{record.category}</span>
          </div>
          <button className="drawer-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="drawer-meta">
          <span><Clock size={13} /> {record.sent_time}</span>
          <span>{record.difficulty}</span>
          <span>{record.duration}分钟</span>
          {record.keywords && <span><Tag size={13} /> {record.keywords}</span>}
        </div>
        <div className="drawer-body">
          {loading ? (
            <div className="drawer-loading">加载中...</div>
          ) : detail?.content ? (
            <pre className="drawer-content">{detail.content}</pre>
          ) : (
            <div className="drawer-empty">暂无详细内容</div>
          )}
          {detail?.quiz && detail.quiz.length > 0 && (
            <div className="drawer-section">
              <h3>💡 思考题</h3>
              <ol>
                {detail.quiz.map((q, i) => {
                  const text = typeof q === 'string' ? q : (q?.q || q?.question || q?.text || JSON.stringify(q))
                  return <li key={i}>{String(text)}</li>
                })}
              </ol>
            </div>
          )}
          {detail?.practice && (
            <div className="drawer-section">
              <h3>🛠️ 实践任务</h3>
              <p>{detail.practice}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function KnowledgeCenter() {
  const [topicStatus, setTopicStatus] = useState({})
  const [sending, setSending] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('push')
  const [historyList, setHistoryList] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyCategory, setHistoryCategory] = useState('all')
  const [historySearch, setHistorySearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [recordDetail, setRecordDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadAllStatus = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchLearningStatus()
      const status = {}
      LEARNING_TOPICS.forEach(t => { status[t.key] = data[t.key]?.sent === true })
      setTopicStatus(status)
    } catch {}
    setLoading(false)
  }, [])

  const loadHistory = useCallback(async (category = 'all') => {
    setHistoryLoading(true)
    setPage(1)
    try {
      const data = category === 'all'
        ? await fetchLearningHistory(1000)
        : await fetchLearningByCategory(category, 1000)
      setHistoryList(dedupCronCategories(data || []))
    } catch { setHistoryList([]) }
    setHistoryLoading(false)
  }, [])

  useEffect(() => { loadAllStatus() }, [loadAllStatus])
  useEffect(() => { loadHistory() }, [loadHistory])

  const handleRecordClick = useCallback(async (record) => {
    setSelectedRecord(record)
    setDetailLoading(true)
    setRecordDetail(null)
    try {
      const detail = await fetchLearningDetail(record.id)
      setRecordDetail(detail)
    } catch { setRecordDetail(null) }
    setDetailLoading(false)
  }, [])

  const handleManualSend = useCallback(async (topicKey, topicLabel) => {
    if (!confirm(`确认立即发送【${topicLabel}】？`)) return
    if (sending[topicKey]) return
    setSending(prev => ({ ...prev, [topicKey]: true }))
    try {
      const result = await triggerLearning(topicKey)
      if (result.ok) {
        alert(`✅ ${topicLabel} 发送请求已提交，请到飞书查看`)
      } else {
        throw new Error(result.error || '请求失败')
      }
    } catch (e) { alert(`❌ 发送失败: ${e.message}`) }
    setSending(prev => ({ ...prev, [topicKey]: false }))
  }, [sending])

  const sentCount = Object.values(topicStatus).filter(Boolean).length

  const filteredHistory = historySearch.trim()
    ? historyList.filter(r =>
        (r.topic || '').toLowerCase().includes(historySearch.toLowerCase()) ||
        (r.category || '').toLowerCase().includes(historySearch.toLowerCase()) ||
        (r.keywords || '').toLowerCase().includes(historySearch.toLowerCase())
      )
    : historyList

  const PAGE_SIZE = 20
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedHistory = filteredHistory.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const categoryCount = historyList.reduce((acc, r) => {
    const cat = r.category || '其他'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  const catColors = {
    'AI技术': '#00e5ff', '心理学': '#ff4081', '会计': '#ff9100',
    '历史': '#a78bfa', 'FDE': '#00e676', '中医': '#ff6d00'
  }

  const now = new Date()
  const isPast = (schedule) => {
    const [h, m] = schedule.split(':').map(Number)
    const t = new Date(); t.setHours(h, m, 0, 0)
    return t <= now
  }
  const waitTime = (schedule) => {
    const [h, m] = schedule.split(':').map(Number)
    const next = new Date(); next.setHours(h, m, 0, 0)
    if (next <= now) next.setDate(next.getDate() + 1)
    const diff = next - now
    const h2 = Math.floor(diff / 3600000)
    const m2 = Math.floor((diff % 3600000) / 60000)
    return h2 > 0 ? `${h2}小时${m2}分后` : `${m2}分钟后`
  }

  return (
    <div className="knowledge-center">
      {/* Header */}
      <div className="kc-header">
        <div className="kc-header-left">
          <span className="kc-title">📚 知识中心</span>
          <div className="kc-pills">
            <span className="kc-pill">{historyList.length} 篇</span>
            <span className="kc-pill">{sentCount}/{LEARNING_TOPICS.length} 已推送</span>
          </div>
        </div>
        <button className="fc-btn" onClick={() => { loadAllStatus(); loadHistory(historyCategory) }} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {/* Tabs */}
      <div className="kc-tabs">
        <button className={`kc-tab ${activeTab === 'push' ? 'active' : ''}`} onClick={() => setActiveTab('push')}>📤 推送管理</button>
        <button className={`kc-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>📜 学习历史</button>
        <button className={`kc-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>📊 统计</button>
      </div>

      {/* Push */}
      {activeTab === 'push' && (
        <div className="push-row-list">
            {LEARNING_TOPICS.map(t => {
              const isSent = topicStatus[t.key] === true
              const isPending = topicStatus[t.key] === false || (topicStatus[t.key] === undefined && isPast(t.schedule))
              const isUnknown = topicStatus[t.key] === undefined && !isPast(t.schedule)
              const rowColor = isSent ? '#f59e0b' : isPending ? '#60a5fa' : '#00e5ff'
              return (
                <div key={t.key} className="push-row" style={{ '--row-color': rowColor }}>
                  <div className="pr-left">
                    <div className="pr-icon">{t.icon}</div>
                    <div className="pr-info">
                      <div className="pr-label">{t.label}</div>
                      <div className="pr-schedule"><Clock size={10} /> {t.schedule}</div>
                    </div>
                  </div>
                  <div className={`pr-dot ${isSent ? 'sent' : isPending ? 'pending' : ''}`} />
                  <div className="pr-right">
                    {isSent && <span className="badge badge-sent">✅ 已推送</span>}
                    {isPending && <span className="badge badge-pending">⏳ {waitTime(t.schedule)}</span>}
                    {isUnknown && <span className="badge badge-pending">检测中...</span>}
                    {isPending && (
                      <button className="send-btn pending-btn" onClick={() => handleManualSend(t.key, t.label)} disabled={sending[t.key]}>
                        {sending[t.key] ? <><RefreshCw size={12} className="spin" /> 发送中</> : <><Send size={12} /> 补发</>}
                      </button>
                    )}
                    {isSent && <span className="send-btn sent-btn">✅ 已推送</span>}
                  </div>
                </div>
              )
            })}
          </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div className="kc-section">
          <div className="kc-filter-bar">
            <div className="kc-search-box">
              <Search size={14} />
              <input type="text" placeholder="搜索标题、关键词..." value={historySearch}
                onChange={e => { setHistorySearch(e.target.value); setPage(1) }} />
              {historySearch && <button className="kc-search-clear" onClick={() => setHistorySearch('')}><X size={12} /></button>}
            </div>
            <div className="kc-filter-pills">
              {['all','AI技术','心理学','会计','历史','FDE','中医'].map(cat => (
                <button key={cat}
                  className={`kc-filter-pill ${historyCategory === cat ? 'active' : ''}`}
                  onClick={() => { setHistoryCategory(cat); loadHistory(cat) }}>
                  {cat === 'all' ? '全部' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="kc-result-info">
            共 {filteredHistory.length} 条，第 {safePage}/{totalPages} 页
          </div>

          <div className="history-grid">
            {historyLoading ? (
              <div className="history-loading">加载中...</div>
            ) : paginatedHistory.length === 0 ? (
              <div className="history-empty">{historySearch ? '没有找到匹配的学习记录' : '暂无学习记录'}</div>
            ) : (
              paginatedHistory.map(record => {
                const hcColor = catColors[record.category] || '#00e5ff'
                return (
                <div key={record.id} className="history-card" style={{ '--hc-color': hcColor }} onClick={() => handleRecordClick(record)}>
                  <div className="hc-header">
                    <span className="hc-cat-badge">{record.category}</span>
                    <span className="hc-diff">{record.difficulty}</span>
                  </div>
                  <div className="hc-body">
                    <div className="hc-title">{record.topic}</div>
                    <div className="hc-meta">
                      <span><Clock size={11} /> {record.sent_time}</span>
                      <span>{record.duration}分钟</span>
                    </div>
                    {record.keywords && (
                      <div className="hc-keywords">
                        {record.keywords.split(/[,，]/).filter(Boolean).slice(0, 3).map((kw, i) => (
                          <span key={i} className="hc-kw">{kw.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                )
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="kc-pagination">
              <button className="page-btn" onClick={() => setPage(1)} disabled={safePage === 1}>«</button>
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={14} /></button>
              <span className="page-info">{safePage} / {totalPages}</span>
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><ChevronRight size={14} /></button>
              <button className="page-btn" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>»</button>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {activeTab === 'stats' && (
        <div>
          <div className="kc-stats-grid">
            <div className="kc-stat-card" style={{ '--stat-color': '#00e5ff' }}>
              <div className="kc-stat-value">{historyList.length}</div>
              <div className="kc-stat-label">累计篇数</div>
            </div>
            <div className="kc-stat-card" style={{ '--stat-color': '#7c6aef' }}>
              <div className="kc-stat-value">{LEARNING_TOPICS.length}</div>
              <div className="kc-stat-label">学习主题</div>
            </div>
            <div className="kc-stat-card" style={{ '--stat-color': '#6b7280' }}>
              <div className="kc-stat-value">{sentCount}</div>
              <div className="kc-stat-label">今日已推送</div>
            </div>
          </div>

          <div className="kc-section">
            <div className="kc-section-title">各分类累计篇数</div>
            <div className="cat-bars">
              {Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                const max = Math.max(...Object.values(categoryCount), 1)
                const pct = Math.round((count / max) * 100)
                return (
                  <div key={cat} className="cat-bar-row">
                    <span className="cat-bar-label">{cat}</span>
                    <div className="cat-bar-track">
                      <div className="cat-bar-fill" style={{ width: `${pct}%`, background: catColors[cat] || '#555' }} />
                    </div>
                    <span className="cat-bar-count">{count}篇</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <DetailDrawer
        record={selectedRecord}
        detail={recordDetail}
        loading={detailLoading}
        onClose={() => { setSelectedRecord(null); setRecordDetail(null) }}
      />
    </div>
  )
}
