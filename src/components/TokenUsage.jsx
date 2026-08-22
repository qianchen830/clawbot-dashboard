import { useState, useEffect } from 'react'
import { BarChart3, Zap, Calendar, TrendingUp, RefreshCw, Clock } from 'lucide-react'
import './TokenUsage.css'

function toast(msg) {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.style.transform = 'translateX(-50%) translateY(0)'
  setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(100px)' }, 3000)
}

function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

function ModelCard({ provider }) {
  const usage = provider.usage ?? {}

  return (
    <div className="tu-model-card" style={{ '--accent': provider.color }}>
      <div className="tu-model-header">
        <div className="tu-model-title">
          <span className="tu-model-icon">{provider.icon}</span>
          <div>
            <div className="tu-model-name">{provider.label}</div>
            <div className="tu-model-id">{provider.source === 'cc-switch' ? 'CC-Switch' : 'Session Logs'}{provider.billingPeriod ? ` · 账期 ${provider.billingPeriod.start} ~ ${provider.billingPeriod.end}` : ''}</div>
          </div>
        </div>
      </div>

      <div className="tu-call-section">
        <div className="tu-call-label-row">
          <span>调用次数</span>
        </div>
        <div className="tu-call-number">
          {(usage.calls ?? 0).toLocaleString()}
        </div>
      </div>

      <div className="tu-token-grid">
        <div className="tu-token-item">
          <div className="tu-token-val">{usage?.inputTokensFmt || '0'}</div>
          <div className="tu-token-lbl">输入 Token</div>
        </div>
        <div className="tu-token-item">
          <div className="tu-token-val">{usage?.outputTokensFmt || '0'}</div>
          <div className="tu-token-lbl">输出 Token</div>
        </div>
        <div className="tu-token-item total">
          <div className="tu-token-val">{usage?.totalTokensFmt || '0'}</div>
          <div className="tu-token-lbl">合计 Token</div>
        </div>
      </div>
    </div>
  )
}

function DailyTrend({ providers, rangeLabel, periodStart, periodEnd, perProviderBilling }) {
  const dayMap = {}
  providers.forEach(p => {
    if (p.usage?.byDay) {
      Object.entries(p.usage.byDay).forEach(([day, d]) => {
        if (!dayMap[day]) dayMap[day] = { calls: 0, tokens: 0 }
        dayMap[day].calls += d.calls || 0
        dayMap[day].tokens += (d.input || 0) + (d.output || 0)
      })
    }
  })

  const startDate = periodStart ? new Date(periodStart) : null
  const endDate   = periodEnd   ? new Date(periodEnd)   : null
  let days = Object.entries(dayMap)
    .filter(([day]) => {
      if (!startDate || !endDate) return true
      const d = new Date(day)
      return d >= startDate && d <= endDate
    })
    .sort(([a], [b]) => a.localeCompare(b))

  const isAllTime = rangeLabel === '全部时间'

  // 按时间跨度自动选择聚合粒度
  // < 60 天 → 日 / 60~180 天 → 周 / > 180 天 → 月
  const totalDays = days.length
  let aggLevel = 'day'
  if (totalDays > 180) aggLevel = 'month'
  else if (totalDays > 60) aggLevel = 'week'

  const aggDays = (() => {
    if (aggLevel === 'month') {
      const map = {}
      days.forEach(([date, d]) => {
        const monthKey = date.slice(0, 7) // YYYY-MM
        if (!map[monthKey]) map[monthKey] = { calls: 0, tokens: 0 }
        map[monthKey].calls += d.calls
        map[monthKey].tokens += d.tokens
      })
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    }
    if (aggLevel === 'week') {
      const map = {}
      days.forEach(([date, d]) => {
        const dt = new Date(date)
        const monday = new Date(dt)
        monday.setDate(dt.getDate() - dt.getDay() + 1)
        const weekKey = monday.toISOString().slice(0, 10)
        if (!map[weekKey]) map[weekKey] = { calls: 0, tokens: 0 }
        map[weekKey].calls += d.calls
        map[weekKey].tokens += d.tokens
      })
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    }
    return days
  })()

  const displayDays = aggDays
  const aggLabel = aggLevel === 'month' ? '按月' : aggLevel === 'week' ? '按周' : '按日'
  const sliceHint = displayDays.length > 14
    ? `（${displayDays.length}${aggLevel === 'month' ? '月' : aggLevel === 'week' ? '周' : '天'}，${aggLabel}）`
    : `（${displayDays.length}${aggLevel === 'month' ? '月' : aggLevel === 'week' ? '周' : '天'}）`

  if (displayDays.length === 0) return null
  const maxTokens = Math.max(...displayDays.map(([, d]) => d.tokens), 1)

  // 全部时间使用特殊样式
  const isLongRange = totalDays > 180
  const containerWidth = 800
  const barWidth = Math.max(4, Math.floor(containerWidth / displayDays.length) - 2)
  const showLabels = barWidth >= 20
  const showCallsLabel = barWidth >= 32

  // 月份标签格式化
  const fmtLabel = (date) => {
    if (aggLevel === 'month') {
      const [y, m] = date.split('-')
      return `${parseInt(m)}月`
    }
    if (aggLevel === 'week') {
      return date.slice(5).replace('-', '/')
    }
    return date.slice(5).replace('-', '/')
  }

  return (
    <div className={`tu-trend-card${isLongRange ? ' tu-trend-card--wide' : ''}`}>
      <div className="tu-trend-header">
        <TrendingUp size={18} />
        <h3>{rangeLabel || '全部时间'} 调用趋势 {sliceHint}</h3>
      </div>
      <div className="tu-trend-chart">
        {displayDays.map(([date, d]) => {
          const heightPct = Math.max(4, Math.round((d.tokens / maxTokens) * 100))
          return (
            <div key={date} className={`tu-trend-col${isLongRange ? ' tu-trend-col--wide' : ''}`}>
              <div className="tu-trend-bar-wrap">
                <div className="tu-trend-bar" style={{ height: `${heightPct}%` }}
                  title={`${date}\n调用: ${d.calls} 次\nToken: ${fmtNum(d.tokens)}`} />
                {showLabels && (
                  <div className="tu-trend-bar-label" style={{ bottom: `${heightPct + 1}%` }}>
                    {fmtNum(d.tokens)}
                  </div>
                )}
              </div>
              <div className="tu-trend-date">{fmtLabel(date)}</div>
              {showCallsLabel && (
                <div className="tu-trend-calls">{d.calls >= 1000 ? fmtNum(d.calls) : d.calls}</div>
              )}
            </div>
          )
        })}
      </div>
      <div className="tu-trend-legend">
        <span className="tu-legend-dot calls" />调用次数（柱顶数字）
        <span className="tu-legend-dot tokens" />Token消耗量（柱高）
      </div>
    </div>
  )
}

export default function TokenUsage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('per-provider')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const ranges = [
    { key: 'per-provider', label: '当前账期' },
    { key: 'week', label: '近7天' },
    { key: 'month', label: '近30天' },
    { key: 'all', label: '全部时间' },
    { key: 'custom', label: '自定义' },
  ]

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (timeRange === 'custom' && customStart && customEnd) {
      params.set('start', customStart)
      params.set('end', customEnd)
    } else if (timeRange !== 'all') {
      params.set('range', timeRange)
    }
    const qs = params.toString()
    return '/api/token/quota' + (qs ? '?' + qs : '')
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildUrl())
      if (!res.ok) throw new Error('API request failed')
      const d = await res.json()
      setData(d)
    } catch (e) {
      setError(e.message)
      toast('加载用量数据失败: ' + e.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [timeRange, customStart, customEnd])

  const handleRangeChange = (key) => {
    setTimeRange(key)
    if (key === 'week' || key === 'month' || key === 'all' || key === 'per-provider') {
      setCustomStart('')
      setCustomEnd('')
    }
  }

  if (loading && !data) {
    return (
      <div className="token-usage">
        <div className="tu-loading"><RefreshCw size={28} className="tu-spin" /> 加载中...</div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="token-usage">
        <div className="tu-error">
          <p>加载失败: {error}</p>
          <button onClick={load}>重试</button>
        </div>
      </div>
    )
  }

  const { providers, summary, rangeLabel } = data

  return (
    <div className="token-usage">
      <div className="tu-header">
        <div>
          <h1>⚡ Token 用量</h1>
          <p className="tu-subtitle">各模型调用次数与 Token 消耗统计</p>
        </div>
        <button className="tu-refresh" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'tu-spin' : ''} /> 刷新
        </button>
      </div>

      {/* 时间筛选 */}
      <div className="tu-filter-bar">
        <Clock size={14} className="tu-filter-icon" />
        <div className="tu-range-pills">
          {ranges.map(r => (
            <button
              key={r.key}
              className={`tu-range-pill ${timeRange === r.key ? 'active' : ''}`}
              onClick={() => handleRangeChange(r.key)}
            >{r.label}</button>
          ))}
        </div>
        {timeRange === 'custom' && (
          <div className="tu-custom-range">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="tu-date-input" />
            <span>~</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="tu-date-input" />
          </div>
        )}
        {rangeLabel && timeRange !== 'custom' && (
          <span className="tu-range-label">{data?.perProviderBilling ? '各模型按开通日计 · ' : ''}{rangeLabel}</span>
        )}
        {rangeLabel && timeRange === 'custom' && (
          <span className="tu-range-label">{customStart} ~ {customEnd}</span>
        )}
      </div>

      <div className="tu-summary-grid">
        <div className="tu-sum-card cyan">
          <BarChart3 size={22} />
          <div>
            <div className="tu-sum-val">{(summary?.totalCalls || 0).toLocaleString()}</div>
            <div className="tu-sum-lbl">{rangeLabel} 调用次数</div>
          </div>
        </div>
        <div className="tu-sum-card purple">
          <Zap size={22} />
          <div>
            <div className="tu-sum-val">{summary?.totalTokensFmt || '0'}</div>
            <div className="tu-sum-lbl">{rangeLabel} 总 Token</div>
          </div>
        </div>
        <div className="tu-sum-card orange">
          <Calendar size={22} />
          <div>
            <div className="tu-sum-val">{summary?.activeModels || 0}</div>
            <div className="tu-sum-lbl">活跃模型数</div>
          </div>
        </div>
      </div>

      <div className="tu-section-title">📊 模型用量明细</div>
      <div className="tu-models-grid">
        {providers?.map(p => <ModelCard key={p.key} provider={p} />)}
      </div>

      <DailyTrend providers={providers} rangeLabel={data?.rangeLabel} periodStart={data?.periodStart} periodEnd={data?.periodEnd} perProviderBilling={data?.perProviderBilling} />

      <div className="tu-footer">
        数据来源: CC-Switch 历史日志 + Session Logs · 更新于 {data?.updatedAt ? new Date(data.updatedAt).toLocaleString('zh-CN') : '--'}
      </div>
    </div>
  )
}
