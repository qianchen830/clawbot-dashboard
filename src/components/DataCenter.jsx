import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { CRON_JOBS, API_BASE, SERVICES_CONFIG, checkAllServices, fetchCronJobs } from '../services/config'
import './DataCenter.css'

// 直接用 API 返回数据渲染（server 端检测，无 CORS 问题）
function ServiceRow({ svc }) {
  return (
    <div className="dc-svc-row">
      <span className={`dc-svc-dot ${svc.online ? 'online' : 'offline'}`} />
      <span className="dc-svc-icon">{svc.icon || '🔧'}</span>
      <span className="dc-svc-name">{svc.name}</span>
      <span className="dc-svc-port">:{svc.port}</span>
      <span className="dc-svc-desc">{svc.description}</span>
      <span className={`dc-svc-status ${svc.online ? 'ok' : 'fail'}`}>
        {svc.online ? '在线' : '离线'}
      </span>
    </div>
  )
}

function ServiceStatusBadge({ online }) {
  if (online === true) return <span className="dc-service-status online">● 运行中</span>
  if (online === false) return <span className="dc-service-status offline">● 离线</span>
  return <span className="dc-service-status">● 检查中</span>
}

function SystemTab({ services, loading, lastUpdate, onRefresh }) {
  const onlineCount = services.filter(s => s.online === true).length
  const serviceTotal = services.length

  return (
    <div>
      {/* 系统总览 */}
      <div className="dc-section">
        <div className="dc-section-title">📈 系统总览</div>
        <div className="dc-stats-grid">
          <div className="dc-stat-card green">
            <div className="dc-stat-icon">✅</div>
            <div className="dc-stat-value">{onlineCount}/{serviceTotal || '--'}</div>
            <div className="dc-stat-label">运行服务</div>
          </div>
          <div className="dc-stat-card">
            <div className="dc-stat-icon">⏰</div>
            <div className="dc-stat-value">{CRON_JOBS.length}</div>
            <div className="dc-stat-label">定时任务</div>
          </div>
          <div className="dc-stat-card">
            <div className="dc-stat-icon">📚</div>
            <div className="dc-stat-value">89</div>
            <div className="dc-stat-label">学习阶段</div>
          </div>
          <div className="dc-stat-card">
            <div className="dc-stat-icon">⏱️</div>
            <div className="dc-stat-value">278h</div>
            <div className="dc-stat-label">学习时长</div>
          </div>
          <div className="dc-stat-card">
            <div className="dc-stat-icon">🔧</div>
            <div className="dc-stat-value">99+</div>
            <div className="dc-stat-label">Skills</div>
          </div>
        </div>
      </div>

      {/* 服务状态表格 */}
      <div className="dc-section">
        <div className="dc-section-title">🔧 系统服务监控</div>
        <div className="dc-svc-table">
          <div className="dc-svc-header">
            <span></span>
            <span>名称</span>
            <span>端口</span>
            <span>说明</span>
            <span>状态</span>
          </div>
          {SERVICES_CONFIG.map(cfg => {
            const apiSvc = services.find(s => s.port === cfg.port)
            const merged = { ...cfg, online: apiSvc ? apiSvc.online : false }
            return (
              <ServiceRow key={cfg.port} svc={merged} />
            )
          })}
        </div>
      </div>

      {/* 定时任务 */}
      <CronJobSection />

      {/* 系统信息 */}
      <div className="dc-section">
        <div className="dc-section-title">💻 系统信息</div>
        <div className="dc-system-info">
          <div className="dc-info-row">
            <span className="dc-info-key">OpenClaw 版本</span>
            <span className="dc-info-val">2026.7.1-2</span>
          </div>
          <div className="dc-info-row">
            <span className="dc-info-key">Gateway 端口</span>
            <span className="dc-info-val">18789 (localhost only)</span>
          </div>
          <div className="dc-info-row">
            <span className="dc-info-key">服务守护</span>
            <span className="dc-info-val">每1小时</span>
          </div>
          <div className="dc-info-row">
            <span className="dc-info-key">Subagent清理</span>
            <span className="dc-info-val">每周日 03:00</span>
          </div>
          <div className="dc-info-row">
            <span className="dc-info-key">知识中心API</span>
            <span className="dc-info-val">{API_BASE}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CronJobSection() {
  const [cronJobs, setCronJobs] = useState([])
  const [selectedCron, setSelectedCron] = useState(null)

  const handleExpand = async () => {
    if (cronJobs.length === 0) {
      const jobs = await fetchCronJobs()
      setCronJobs(jobs)
    }
    setSelectedCron({ name: '定时任务' })
  }

  return (
    <div className="dc-section">
      <div className="dc-section-title clickable" onClick={handleExpand}>⏰ 定时任务 ▸</div>
      <div className="dc-cron-grid">
        {CRON_JOBS.map(c => (
          <div key={c.jobId} className="dc-cron-card">
            <div className="dc-cron-header">
              <div>
                <div className="dc-cron-name">{c.name}</div>
                <div className="dc-cron-schedule">⏰ {c.schedule}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCron ? (
        <div className="detail-modal-overlay" onClick={() => setSelectedCron(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div className="detail-modal-title"><h2>⏰ 定时任务列表</h2></div>
              <button className="detail-modal-close" onClick={() => setSelectedCron(null)}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}>
                ✕
              </button>
            </div>
            <div className="detail-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '16px 24px' }}>
              {cronJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>加载中...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cronJobs.map(j => {
                    const isOk = j.status === 'ok'
                    const isError = j.status === 'error'
                    return (
                      <div key={j.id} style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10,
                        padding: '14px 16px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', flex: 1 }}>{j.name}</div>
                          <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 4,
                            background: isOk ? 'rgba(0,230,118,0.15)' : isError ? 'rgba(255,64,129,0.15)' : 'rgba(255,145,0,0.15)',
                            color: isOk ? '#00e676' : isError ? '#ff4081' : '#ff9100',
                          }}>
                            {isOk ? '● 运行中' : isError ? '● 错误' : '● 待机'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12, color: '#888' }}>
                          <div>📅 {j.schedule}</div>
                          <div>⏭️ 下次: {j.next}</div>
                          <div>⏱️ 上次: {j.last || '-'}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// Token Stats Panel
function TokenStatsPanel({ stats, loading, range, onRangeChange }) {
  const ranges = [
    { key: 'month', label: '当月' },
    { key: 'week', label: '近7天' },
    { key: 'day', label: '今日' },
  ]

  const maxDayTokens = stats ? Math.max(...stats.byDay.map(d => d.tokens), 1) : 1

  return (
    <div className="dc-token-panel">
      <div className="dc-token-range-bar">
        {ranges.map(r => (
          <button key={r.key}
            className={`dc-range-btn ${range === r.key ? 'active' : ''}`}
            onClick={() => onRangeChange(r.key)}>
            {r.label}
          </button>
        ))}
        {stats ? (
          <span className="dc-token-period">
            {stats.startDate} ~ {new Date().toISOString().slice(0, 10)}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="dc-loading">加载中...</div>
      ) : stats ? (
        <>
          <div className="dc-token-summary">
            <div className="dc-token-card" style={{ '--tc': '#00e5ff' }}>
              <div className="dc-token-card-val">{stats.totalTokensFmt}</div>
              <div className="dc-token-card-lbl">累计消耗</div>
            </div>
            {stats.currentSession ? (
              <div className="dc-token-card" style={{ '--tc': '#10b981' }}>
                <div className="dc-token-card-val">{fmtK(stats.currentSession.tokens)}</div>
                <div className="dc-token-card-lbl">当前会话</div>
                <div className="dc-token-card-sub">{stats.currentSession.model.split('/').pop()}</div>
              </div>
            ) : null}
            <div className="dc-token-card" style={{ '--tc': '#a78bfa' }}>
              <div className="dc-token-card-val">{stats.sessions.length}</div>
              <div className="dc-token-card-lbl">会话数</div>
            </div>
          </div>

          {stats.byModel.length > 0 ? (
            <div className="dc-token-section">
              <div className="dc-token-section-title">按模型</div>
              <div className="dc-token-model-list">
                {stats.byModel.filter(m => m.tokens > 0).map(m => (
                  <div key={m.model} className="dc-token-model-row">
                    <div className="dc-token-model-name">{m.model}</div>
                    <div className="dc-token-model-bar-wrap">
                      <div className="dc-token-model-bar"
                        style={{ width: `${Math.round((m.tokens / stats.totalTokens) * 100)}%` }} />
                    </div>
                    <div className="dc-token-model-pct">
                      {Math.round((m.tokens / stats.totalTokens) * 100)}%
                    </div>
                    <div className="dc-token-model-tokens">{m.tokensFmt}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {stats.byDay.length > 0 ? (
            <div className="dc-token-section">
              <div className="dc-token-section-title">每日趋势</div>
              <div className="dc-token-chart">
                {stats.byDay.map(day => (
                  <div key={day.date} className="dc-token-bar-col">
                    <div className="dc-token-bar-wrap-outer">
                      <div className="dc-token-bar-fill"
                        style={{ height: `${Math.round((day.tokens / maxDayTokens) * 100)}%` }}
                        title={`${day.date}: ${day.tokensFmt}`} />
                    </div>
                    <div className="dc-token-bar-date">{day.date.slice(5).replace('-', '/')}</div>
                    <div className="dc-token-bar-val">{day.tokensFmt}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {stats.sessions.length > 0 ? (
            <div className="dc-token-section">
              <div className="dc-token-section-title">会话明细</div>
              <div className="dc-token-session-table">
                <div className="dc-token-session-head">
                  <span>会话</span>
                  <span>模型</span>
                  <span>Token</span>
                  <span>上下文</span>
                  <span>压缩</span>
                  <span>最后活动</span>
                </div>
                {stats.sessions.map(s => (
                  <div key={s.key} className="dc-token-session-row">
                    <span className="dc-token-session-key" title={s.key}>{s.key}</span>
                    <span className="dc-token-session-model">{s.model.split('/').pop()}</span>
                    <span className="dc-token-session-tokens">{s.tokensFmt}</span>
                    <span className="dc-token-session-ctx">{s.contextTokensFmt}</span>
                    <span className="dc-token-session-comp">{s.compactionCount}</span>
                    <span className="dc-token-session-ago">{s.lastActivityAgo}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="dc-loading">加载失败</div>
      )}
    </div>
  )
}

function fmtK(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

// Main DataCenter
export default function DataCenter() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setServices([])
    try {
      const result = await checkAllServices()
      setServices(result)
      setLastUpdate(new Date())
    } catch (e) {
      console.error('加载数据失败:', e)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  return (
    <div className="data-center">
      <div className="dc-header">
        <h1>📊 数据中心</h1>
        <div className="dc-actions">
          <span className="dc-last-update">
            {lastUpdate ? `更新: ${lastUpdate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : '--'}
          </span>
          <button className={`dc-refresh-btn ${loading ? 'loading' : ''}`}
            onClick={() => { loadData() }} disabled={loading}>
            🔄 {loading ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      <SystemTab services={services} loading={loading} lastUpdate={lastUpdate} onRefresh={loadData} />
    </div>
  )
}
