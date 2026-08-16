import { useState, useEffect } from 'react'
import { Crown, ArrowRight, Zap, BarChart3, Calendar, TrendingUp, Shield, RefreshCw, Clock } from 'lucide-react'
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

function QuotaBar({ percent, color }) {
  const status = percent >= 90 ? 'critical' : percent >= 70 ? 'warning' : 'healthy'
  return (
    <div className={`tu-quota-bar ${status}`}>
      <div className="tu-quota-fill" style={{ width: `${percent}%`, background: color || '#00e5ff' }} />
    </div>
  )
}

function ModelCard({ provider }) {
  const usage = provider.usage || {}
  const period = usage.period || provider.period
  const daysLeft = period?.end ? Math.max(0, Math.ceil((new Date(period.end) - new Date()) / 86400000)) : 0
  const roleBadge = {
    primary: { label: '主模型', cls: 'primary', icon: Crown },
    fallback: { label: '备用', cls: 'fallback', icon: Shield },
    standby: { label: '待机', cls: 'standby', icon: Zap },
  }
  const badge = roleBadge[provider.balancerRole] || roleBadge.standby
  const BadgeIcon = badge.icon

  return (
    <div className="tu-model-card" style={{ '--accent': provider.color }}>
      <div className="tu-model-header">
        <div className="tu-model-title">
          <span className="tu-model-icon">{provider.icon}</span>
          <div>
            <div className="tu-model-name">{provider.label}</div>
            <div className="tu-model-id">{provider.providerId}/{provider.modelName}</div>
          </div>
        </div>
        <span className={`tu-role-badge ${badge.cls}`}>
          <BadgeIcon size={12} /> {badge.label}
        </span>
      </div>

      {period && (
        <div className="tu-billing-row">
          <Calendar size={13} />
          <span>{period.start} ~ {period.end}</span>
          <span className="tu-days-left">{daysLeft}天到期</span>
        </div>
      )}

      <div className="tu-quota-section">
        <div className="tu-quota-label-row">
          <span>调用次数</span>
          <span className="tu-quota-numbers">
            <strong>{(usage.calls || 0).toLocaleString()}</strong>
            <span className="tu-quota-sep">/</span>
            <span className="tu-quota-total">{provider.monthlyQuotaCalls.toLocaleString()}</span>
          </span>
        </div>
        <QuotaBar percent={usage.callsPercent || 0} color={provider.color} />
        <div className="tu-quota-footer">
          <span className={(usage.callsPercent || 0) >= 80 ? 'tu-remain-low' : ''}>
            剩余 {Math.max(0, provider.monthlyQuotaCalls - (usage.calls || 0)).toLocaleString()} 次
          </span>
          <span className="tu-quota-pct">{usage.callsPercent || 0}%</span>
        </div>
      </div>

      <div className="tu-token-grid">
        <div className="tu-token-item">
          <div className="tu-token-val">{usage.inputTokensFmt || '0'}</div>
          <div className="tu-token-lbl">输入 Token</div>
        </div>
        <div className="tu-token-item">
          <div className="tu-token-val">{usage.outputTokensFmt || '0'}</div>
          <div className="tu-token-lbl">输出 Token</div>
        </div>
        <div className="tu-token-item total">
          <div className="tu-token-val">{usage.totalTokensFmt || '0'}</div>
          <div className="tu-token-lbl">合计 Token</div>
        </div>
      </div>
    </div>
  )
}

function BalancerFlow({ balancer, providers }) {
  if (!balancer || !balancer.chain || balancer.chain.length === 0) return null

  const chainNodes = balancer.chain.map((c, i) => {
    const prov = providers.find(p => p.providerId === c.provider)
    return {
      ...c,
      label: prov?.label || c.label || c.fullId,
      color: prov?.color || '#888',
      icon: prov?.icon || '⚙️',
      index: i,
    }
  })

  return (
    <div className="tu-balancer-card">
      <div className="tu-balancer-header">
        <div className="tu-balancer-title">
          <Zap size={18} className="tu-balancer-icon" />
          <h2>模型均衡器</h2>
        </div>
        <div className="tu-balancer-strategy">
          <span className="tu-strategy-badge">顺序降级</span>
          <span className="tu-strategy-desc">主模型失败 → 自动切换备用模型</span>
        </div>
      </div>

      <div className="tu-flow-chain">
        {chainNodes.map((node, i) => (
          <div key={node.fullId} className="tu-flow-node-wrap">
            <div className={`tu-flow-node ${node.role}`} style={{ '--node-color': node.color }}>
              <span className="tu-flow-icon">{node.icon}</span>
              <div className="tu-flow-info">
                <div className="tu-flow-name">{node.label}</div>
                <div className="tu-flow-id">{node.fullId}</div>
              </div>
              {node.role === 'primary' && <Crown size={14} className="tu-flow-crown" />}
              <span className={`tu-flow-tag ${node.role}`}>
                {node.role === 'primary' ? 'PRIMARY' : `FALLBACK ${node.index}`}
              </span>
            </div>
            {i < chainNodes.length - 1 && (
              <div className="tu-flow-arrow">
                <ArrowRight size={20} />
                <span className="tu-flow-cond">失败/限流</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="tu-balancer-rules">
        <div className="tu-rule-item">
          <span className="tu-rule-dot" />
          <span>主模型 API 报错（429/403/401/5xx）自动降级</span>
        </div>
        <div className="tu-rule-item">
          <span className="tu-rule-dot" />
          <span>每个模型 maxRetries=3，超时 120 秒</span>
        </div>
        <div className="tu-rule-item">
          <span className="tu-rule-dot" />
          <span>降级链: {chainNodes.map(n => n.label).join(' → ')}</span>
        </div>
      </div>
    </div>
  )
}

function DailyTrend({ providers, rangeLabel, periodStart, periodEnd }) {
  // 合并所有 provider 的每日数据
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

  // 根据实际时间范围过滤
  const startDate = periodStart ? new Date(periodStart) : null
  const endDate   = periodEnd   ? new Date(periodEnd)   : null
  let days = Object.entries(dayMap)
    .filter(([day]) => {
      if (!startDate || !endDate) return true
      const d = new Date(day)
      return d >= startDate && d <= endDate
    })
    .sort(([a], [b]) => a.localeCompare(b))

  // 时间范围 > 14 天只显示最后 14 天，并标注
  const sliceHint = days.length > 14 ? `（近14天 / 共${days.length}天）` : `（${days.length}天）`
  const displayDays = days.length > 14 ? days.slice(-14) : days

  if (displayDays.length === 0) return null
  const maxTokens = Math.max(...displayDays.map(([, d]) => d.tokens), 1)

  return (
    <div className="tu-trend-card">
      <div className="tu-trend-header">
        <TrendingUp size={18} />
        <h3>{rangeLabel || '当前账期'} 调用趋势 {sliceHint}</h3>
      </div>
      <div className="tu-trend-chart">
        {displayDays.map(([date, d]) => (
          <div key={date} className="tu-trend-col">
            <div className="tu-trend-bar-wrap">
              <div className="tu-trend-bar" style={{ height: `${Math.max(4, Math.round((d.tokens / maxTokens) * 100))}%` }}
                title={`${date}\n调用: ${d.calls} 次\nToken: ${fmtNum(d.tokens)}`} />
            </div>
            <div className="tu-trend-date">{date.slice(5).replace('-', '/')}</div>
            <div className="tu-trend-val">{fmtNum(d.tokens)}</div>
          </div>
        ))}
      </div>
      <div className="tu-trend-legend">
        <span className="tu-legend-dot calls" />调用次数（悬浮查看）
        <span className="tu-legend-dot tokens" />Token消耗量（柱高）
      </div>
    </div>
  )
}

export default function TokenUsage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('billing') // billing | week | month | all | custom
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const ranges = [
    { key: 'billing', label: '当前账期' },
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
    } else if (timeRange !== 'billing') {
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
      toast('加载配额数据失败: ' + e.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [timeRange, customStart, customEnd])

  const handleRangeChange = (key) => {
    setTimeRange(key)
    if (key === 'billing' || key === 'week' || key === 'month' || key === 'all') {
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

  const { providers, balancer, summary, rangeLabel } = data

  return (
    <div className="token-usage">
      <div className="tu-header">
        <div>
          <h1>⚡ Token 用量 & 配额</h1>
          <p className="tu-subtitle">模型账期、调用次数、Token消耗与均衡器状态</p>
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
          <span className="tu-range-label">{rangeLabel}</span>
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
        <div className="tu-sum-card green">
          <Shield size={22} />
          <div>
            <div className="tu-sum-val">{providers?.filter(p => p.balancerRole === 'primary').length || 0}/{providers?.length || 0}</div>
            <div className="tu-sum-lbl">主模型 / 总模型</div>
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

      <BalancerFlow balancer={balancer} providers={providers} />

      <div className="tu-section-title">📊 模型配额与用量</div>
      <div className="tu-models-grid">
        {providers?.map(p => <ModelCard key={p.key} provider={p} />)}
      </div>

      <DailyTrend providers={providers} rangeLabel={data?.rangeLabel} periodStart={data?.periodStart} periodEnd={data?.periodEnd} />

      <div className="tu-footer">
        数据来源: CC-Switch 代理日志 · 更新于 {data?.updatedAt ? new Date(data.updatedAt).toLocaleString('zh-CN') : '--'}
      </div>
    </div>
  )
}
