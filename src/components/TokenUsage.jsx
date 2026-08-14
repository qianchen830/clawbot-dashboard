import { useState, useEffect } from 'react'
import { Crown, ArrowRight, Zap, BarChart3, Calendar, TrendingUp, Shield, RefreshCw } from 'lucide-react'
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
  const getStatus = () => {
    if (percent >= 90) return 'critical'
    if (percent >= 70) return 'warning'
    return 'healthy'
  }
  const status = getStatus()
  return (
    <div className={`tu-quota-bar ${status}`}>
      <div className="tu-quota-fill" style={{ width: `${percent}%`, background: color || 'var(--bar-color, #00e5ff)' }} />
    </div>
  )
}

function ModelCard({ provider }) {
  const p = provider.usage
  const daysLeft = p.period ? Math.max(0, Math.ceil((new Date(p.period.end) - new Date()) / 86400000)) : 0
  const roleBadge = {
    primary: { label: '主模型', cls: 'primary', icon: <Crown size={12} /> },
    fallback: { label: '备用', cls: 'fallback', icon: <Shield size={12} /> },
    standby: { label: '待机', cls: 'standby', icon: <Zap size={12} /> },
  }
  const badge = roleBadge[provider.balancerRole] || roleBadge.standby

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
        <span className={`tu-role-badge ${badge.cls}`}>{badge.icon} {badge.label}</span>
      </div>

      {/* 账期 */}
      <div className="tu-billing-row">
        <Calendar size={13} />
        <span>账期: {p.period?.start} ~ {p.period?.end}</span>
        <span className="tu-days-left">{daysLeft}天后到期</span>
      </div>

      {/* 调用次数配额 */}
      <div className="tu-quota-section">
        <div className="tu-quota-label-row">
          <span>调用次数</span>
          <span className="tu-quota-numbers">
            <strong>{p.calls?.toLocaleString()}</strong>
            <span className="tu-quota-sep">/</span>
            <span className="tu-quota-total">{provider.monthlyQuotaCalls.toLocaleString()}</span>
          </span>
        </div>
        <QuotaBar percent={p.callsPercent} color={provider.color} />
        <div className="tu-quota-footer">
          <span className={p.callsPercent >= 80 ? 'tu-remain-low' : ''}>
            剩余 {(provider.monthlyQuotaCalls - p.calls).toLocaleString()} 次
          </span>
          <span className="tu-quota-pct">{p.callsPercent}%</span>
        </div>
      </div>

      {/* Token 用量 */}
      <div className="tu-token-grid">
        <div className="tu-token-item">
          <div className="tu-token-val">{p.inputTokensFmt}</div>
          <div className="tu-token-lbl">输入 Token</div>
        </div>
        <div className="tu-token-item">
          <div className="tu-token-val">{p.outputTokensFmt}</div>
          <div className="tu-token-lbl">输出 Token</div>
        </div>
        <div className="tu-token-item total">
          <div className="tu-token-val">{p.totalTokensFmt}</div>
          <div className="tu-token-lbl">合计 Token</div>
        </div>
      </div>
    </div>
  )
}

function BalancerFlow({ balancer, providers }) {
  if (!balancer || !balancer.chain || balancer.chain.length === 0) return null

  const chainWithInfo = balancer.chain.map((c, i) => {
    const prov = providers.find(p => p.providerId === c.provider)
    return {
      ...c,
      label: prov?.label || c.label || c.fullId,
      color: prov?.color || '#888',
      icon: prov?.icon || '⚙️',
      role: c.role,
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
        {chainWithInfo.map((node, i) => (
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
            {i < chainWithInfo.length - 1 && (
              <div className="tu-flow-arrow">
                <ArrowRight size={20} />
                <span className="tu-flow-cond">失败/限流时</span>
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
          <span>降级链: {balancer.chain.map(c => c.label).join(' → ')}</span>
        </div>
      </div>
    </div>
  )
}

function DailyTrend({ providers }) {
  // 汇总所有 provider 的每日数据
  const dayMap = {}
  providers.forEach(p => {
    if (p.usage?.byDay) {
      Object.entries(p.usage.byDay).forEach(([day, d]) => {
        if (!dayMap[day]) dayMap[day] = { calls: 0, tokens: 0 }
        dayMap[day].calls += d.calls
        dayMap[day].tokens += (d.input + d.output)
      })
    }
  })
  const days = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).slice(-14)
  if (days.length === 0) return null
  const maxTokens = Math.max(...days.map(([, d]) => d.tokens), 1)

  return (
    <div className="tu-trend-card">
      <div className="tu-trend-header">
        <TrendingUp size={18} />
        <h3>近14天调用趋势</h3>
      </div>
      <div className="tu-trend-chart">
        {days.map(([date, d]) => (
          <div key={date} className="tu-trend-col">
            <div className="tu-trend-bar-wrap">
              <div className="tu-trend-bar" style={{ height: `${Math.max(4, Math.round((d.tokens / maxTokens) * 100))}%` }}
                title={`${date}: ${d.calls}次 / ${fmtNum(d.tokens)} tokens`} />
            </div>
            <div className="tu-trend-date">{date.slice(5).replace('-', '/')}</div>
            <div className="tu-trend-val">{d.calls}次</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TokenUsage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/token/quota')
      if (!res.ok) throw new Error('API 请求失败')
      const d = await res.json()
      setData(d)
    } catch (e) {
      setError(e.message)
      toast('加载配额数据失败: ' + e.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

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
          <p>❌ {error}</p>
          <button onClick={load}>重试</button>
        </div>
      </div>
    )
  }

  const { providers, balancer, summary } = data

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

      {/* 汇总卡片 */}
      <div className="tu-summary-grid">
        <div className="tu-sum-card cyan">
          <BarChart3 size={22} />
          <div>
            <div className="tu-sum-val">{summary?.totalCalls.toLocaleString()}</div>
            <div className="tu-sum-lbl">当前账期总调用次数</div>
          </div>
        </div>
        <div className="tu-sum-card purple">
          <Zap size={22} />
          <div>
            <div className="tu-sum-val">{summary?.totalTokensFmt}</div>
            <div className="tu-sum-lbl">当前账期总 Token</div>
          </div>
        </div>
        <div className="tu-sum-card green">
          <Shield size={22} />
          <div>
            <div className="tu-sum-val">{providers?.filter(p => p.balancerRole === 'primary').length}/{providers?.length}</div>
            <div className="tu-sum-lbl">主模型 / 总模型</div>
          </div>
        </div>
        <div className="tu-sum-card orange">
          <Calendar size={22} />
          <div>
            <div className="tu-sum-val">{summary?.activeModels}</div>
            <div className="tu-sum-lbl">活跃模型数</div>
          </div>
        </div>
      </div>

      {/* 模型均衡器 */}
      <BalancerFlow balancer={balancer} providers={providers} />

      {/* 模型配额卡片 */}
      <div className="tu-section-title">📊 模型配额与用量</div>
      <div className="tu-models-grid">
        {providers?.map(p => <ModelCard key={p.key} provider={p} />)}
      </div>

      {/* 趋势图 */}
      <DailyTrend providers={providers} />

      <div className="tu-footer">
        数据来源: CC-Switch 代理日志 · 更新于 {new Date(data?.updatedAt).toLocaleString('zh-CN')}
      </div>
    </div>
  )
}
