import { useState, useEffect, useMemo, useRef } from 'react'
import NeuralSphere from './NeuralSphere'
import './CockpitHome.css'

// 3D 球体上的模块数（与 NeuralSphere 的 NODES 一致）
const NODES_COUNT = 12

// ── 学习主题元数据（与后端 /api/learning/status 的 key 对应） ──
const TOPIC_META = {
  ai: { label: 'AI人工智能', color: '#00e5ff' },
  psychology: { label: '心理学', color: '#ff4081' },
  accounting: { label: '会计', color: '#ff9100' },
  fde: { label: 'FDE前线', color: '#00e676' },
  history: { label: '中国历史', color: '#7c4dff' },
  tcm: { label: '中医养生', color: '#26c6da' },
}

// ── 工具 ──
async function getJSON(url, fallback) {
  try {
    const resp = await fetch(url)
    if (!resp.ok) return fallback
    return await resp.json()
  } catch {
    return fallback
  }
}

const dkey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// ── 数字滚动动画 ──
function useCountUp(target, duration = 1400) {
  const [val, setVal] = useState(0)
  const rafRef = useRef()
  useEffect(() => {
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(target * eased)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])
  return val
}

function KpiCard({ title, value, unit, sub, color, decimals = 0 }) {
  const shown = useCountUp(value)
  return (
    <div className="cp-kpi glass-card" style={{ '--kpi-color': color }}>
      <div className="cp-kpi-title">{title}</div>
      <div className="cp-kpi-value">
        {shown.toFixed(decimals)}
        <span className="cp-kpi-unit">{unit}</span>
      </div>
      <div className="cp-kpi-sub">{sub}</div>
      <div className="cp-kpi-scanline" />
    </div>
  )
}

// ── 服务健康面板 ──
function ServicePanel({ services }) {
  const online = services.filter((s) => s.online).length
  return (
    <div className="cp-panel glass-card">
      <div className="cp-panel-title">
        <span className="cp-title-bar" />服务健康
        <span className={`cp-pill ${online === services.length && services.length > 0 ? 'ok' : 'warn'}`}>
          {services.length ? `${online}/${services.length}` : '...'}
        </span>
      </div>
      {services.length === 0 ? (
        <div className="cp-loading">探测中…</div>
      ) : (
        <div className="cp-svc-list">
          {services.map((s) => (
            <div key={s.name} className="cp-svc-row">
              <span className={`cp-dot ${s.online ? 'on' : 'off'}`} />
              <span className="cp-svc-name" title={s.description || s.name}>{s.name}</span>
              <span className="cp-svc-latency">{s.online ? `${s.latency ?? '--'}ms` : '离线'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 今日推送面板 ──
function TodayPushPanel({ status }) {
  const entries = Object.entries(status)
  return (
    <div className="cp-panel glass-card">
      <div className="cp-panel-title"><span className="cp-title-bar" />今日学习推送</div>
      {entries.length === 0 ? (
        <div className="cp-loading">加载中…</div>
      ) : (
        <div className="cp-push-list">
          {entries.map(([key, v]) => {
            const meta = TOPIC_META[key] || { label: key, color: '#00d4ff' }
            return (
              <div key={key} className="cp-push-row">
                <span className="cp-dot" style={{ background: v.sent ? meta.color : 'rgba(255,255,255,0.15)', boxShadow: v.sent ? `0 0 8px ${meta.color}` : 'none' }} />
                <span className="cp-push-name">{meta.label}</span>
                <span className={`cp-push-state ${v.sent ? 'done' : 'pending'}`}>{v.sent ? '已推送' : '待推送'}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 最近学习面板 ──
function RecentPanel({ records, onNavigate }) {
  return (
    <div className="cp-panel glass-card">
      <div className="cp-panel-title">
        <span className="cp-title-bar" />最近学习
        <span className="cp-more" onClick={() => onNavigate('selflearning')}>更多 ›</span>
      </div>
      {records.length === 0 ? (
        <div className="cp-loading">加载中…</div>
      ) : (
        records.slice(0, 5).map((r) => (
          <div key={r.id} className="cp-recent-row" onClick={() => onNavigate('selflearning')}>
            <span className="cp-recent-topic">{(r.topic || '').slice(0, 16)}</span>
            <span className="cp-recent-meta">
              <em className="cp-cat">{r.category}</em>
              {(r.sent_time || '').slice(5, 10)}
            </span>
          </div>
        ))
      )}
    </div>
  )
}

// ── 趋势图（纯 SVG，无依赖） ──
function smoothPath(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

function TrendChart({ series }) {
  const W = 640
  const H = 130
  const PL = 10
  const PR = 10
  const PT = 16
  const PB = 20
  const max = Math.max(30, ...series.map((s) => s.minutes))
  const pts = series.map((s, i) => [
    PL + (i / Math.max(1, series.length - 1)) * (W - PL - PR),
    PT + (1 - s.minutes / max) * (H - PT - PB),
  ])
  const line = smoothPath(pts)
  const area = line ? `${line} L ${pts[pts.length - 1][0]},${H - PB} L ${pts[0][0]},${H - PB} Z` : ''
  let peakIdx = 0
  series.forEach((s, i) => { if (s.minutes > series[peakIdx].minutes) peakIdx = i })
  const hasData = series.some((s) => s.minutes > 0)
  const xLabels = [0, Math.floor(series.length / 2), series.length - 1].map((i) => ({
    x: pts[i][0],
    text: (series[i].date || '').slice(5),
  }))
  return (
    <svg className="cp-trend" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="cpLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#7c4dff" />
        </linearGradient>
        <linearGradient id="cpArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={PL} x2={W - PR} y1={PT + f * (H - PT - PB)} y2={PT + f * (H - PT - PB)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" />
      ))}
      <text x={PL} y={PT - 4} className="cp-axis-text">{Math.round(max)}m</text>
      {hasData && <path d={area} fill="url(#cpArea)" />}
      {hasData && <path d={line} fill="none" stroke="url(#cpLine)" strokeWidth="2" strokeLinecap="round" />}
      {hasData && (
        <g>
          <circle cx={pts[peakIdx][0]} cy={pts[peakIdx][1]} r="4.5" fill="#7c4dff" opacity="0.25" />
          <circle cx={pts[peakIdx][0]} cy={pts[peakIdx][1]} r="2.5" fill="#b388ff" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill="#00d4ff" />
        </g>
      )}
      {xLabels.map((l, i) => (
        <text key={i} x={l.x} y={H - 6} textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'} className="cp-axis-text">{l.text}</text>
      ))}
      {!hasData && (
        <text x={W / 2} y={H / 2} textAnchor="middle" className="cp-axis-text cp-trend-empty">暂无学习记录</text>
      )}
    </svg>
  )
}

// ── 主组件 ──
export default function CockpitHome({ onNavigate }) {
  const [services, setServices] = useState([])
  const [learning, setLearning] = useState([])
  const [pushStatus, setPushStatus] = useState({})
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const load = () => getJSON('/api/service-status', []).then(setServices)
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const load = () => getJSON('/api/learning/recent?limit=500', []).then(setLearning)
    load()
    const t = setInterval(load, 300000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const load = () => getJSON('/api/learning/status', {}).then(setPushStatus)
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const stats = useMemo(() => {
    const totalMin = learning.reduce((s, r) => s + (r.duration || 0), 0)
    const byDay = {}
    learning.forEach((r) => {
      const k = (r.sent_time || '').slice(0, 10)
      if (k) byDay[k] = (byDay[k] || 0) + (r.duration || 0)
    })
    const cats = new Set(learning.map((r) => r.category).filter(Boolean))
    const today = new Date()
    const series = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
      const k = dkey(d)
      series.push({ date: k, minutes: byDay[k] || 0 })
    }
    const activeDays = series.filter((s) => s.minutes > 0).length
    let peak = series[0]
    series.forEach((s) => { if (s.minutes > peak.minutes) peak = s })
    const startOffset = (byDay[dkey(today)] || 0) > 0 ? 0 : 1
    let streak = 0
    for (let i = startOffset; ; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
      if ((byDay[dkey(d)] || 0) > 0) streak++
      else break
    }
    return {
      count: learning.length,
      hours: totalMin / 60,
      cats: cats.size,
      streak,
      series,
      activeDays,
      peak,
      avgMin: Math.round(series.reduce((s, x) => s + x.minutes, 0) / 30),
    }
  }, [learning])

  const onlineCount = services.filter((s) => s.online).length

  return (
    <div className="cockpit">
      <header className="cp-header glass-card">
        <div className="cp-header-left">
          <div className="cp-header-title">
            <span className="cp-title-glow" />ClawBot · 神经中枢驾驶舱
          </div>
          <div className="cp-header-sub">AI成长型助手 · OpenClaw Framework v3.0</div>
        </div>
        <div className="cp-header-right">
          <span className="cp-ext-link" onClick={() => window.open('http://localhost:5173/', '_blank')}>金蝶交付 ↗</span>
          <span className="cp-ext-link" onClick={() => window.open('http://localhost:18789/', '_blank')}>控制台 ↗</span>
          <span className={`cp-pill ${onlineCount === services.length && services.length > 0 ? 'ok' : 'warn'}`}>
            <span className={`cp-dot ${onlineCount > 0 ? 'on' : 'off'}`} />
            {services.length ? `服务 ${onlineCount}/${services.length}` : '服务探测中'}
          </span>
          <div className="cp-clock">
            <div className="cp-clock-time">{now.toLocaleTimeString('zh-CN', { hour12: false })}</div>
            <div className="cp-clock-date">{now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</div>
          </div>
        </div>
      </header>

      <div className="cp-main">
        <aside className="cp-left">
          <KpiCard title="学习记录" value={stats.count} unit="条" sub="推送笔记总量" color="#00d4ff" />
          <KpiCard title="累计时长" value={stats.hours} unit="h" sub="全部学习时长" color="#7c4dff" decimals={1} />
          <KpiCard title="覆盖领域" value={stats.cats} unit="个" sub="学习分类方向" color="#00e676" />
          <KpiCard title="连续活跃" value={stats.streak} unit="天" sub="学习打卡连续天数" color="#ff9100" />
        </aside>

        <section className="cp-center glass-card">
          <div className="cp-hud cp-hud-tl">
            <span className="cp-hud-tag">NEURAL CORE</span>
            <span className="cp-hud-text">{NODES_COUNT} 模块在线</span>
          </div>
          <div className="cp-hud cp-hud-br">
            <span className="cp-hud-text">拖拽旋转 · 滚轮缩放 · 点击节点进入模块</span>
          </div>
          <div className="cp-scanline" />
          <NeuralSphere onNavigate={onNavigate} />
        </section>

        <aside className="cp-right">
          <ServicePanel services={services} />
          <TodayPushPanel status={pushStatus} />
          <RecentPanel records={learning} onNavigate={onNavigate} />
        </aside>
      </div>

      <footer className="cp-bottom glass-card">
        <div className="cp-bottom-chart">
          <div className="cp-panel-title"><span className="cp-title-bar" />近 30 天学习时长趋势</div>
          <TrendChart series={stats.series} />
        </div>
        <div className="cp-bottom-stats">
          <div className="cp-bstat"><i>日均</i><b>{stats.avgMin}<u>m</u></b></div>
          <div className="cp-bstat"><i>活跃天</i><b>{stats.activeDays}<u>/30</u></b></div>
          <div className="cp-bstat"><i>峰值日</i><b>{stats.peak.minutes > 0 ? stats.peak.minutes : '--'}{stats.peak.minutes > 0 && <u>m</u>}</b><i className="cp-bstat-date">{stats.peak.minutes > 0 ? (stats.peak.date || '').slice(5) : ''}</i></div>
        </div>
      </footer>
    </div>
  )
}
