import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LayoutDashboard, RefreshCw, BarChart3, List, FileSignature,
  FolderOpen, AlertTriangle, Trophy, Package, Users, UserCheck,
  ChevronDown, ChevronLeft, ChevronRight, Search, Plus, X
} from 'lucide-react'
import './PresaleKanban.css'

const PRESALE_API = '/presale'

// ─── helpers ────────────────────────────────────────────────
function fmtWan(v) {
  if (v == null || isNaN(v)) return '—'
  return (parseFloat(v) / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
function fmtMoney(v) {
  if (v == null || isNaN(v)) return '—'
  return parseFloat(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtNum(v) {
  if (v == null || isNaN(v)) return '0'
  return String(v)
}
function esc(s) {
  if (s == null) return ''
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// Period key: year_2026 | quarter_2026_2 | month_2026_7 | week_2026_33
function getPeriodRange(key) {
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()
  const thisQuarter = Math.floor(thisMonth / 3) + 1
  if (key.startsWith('year_')) {
    const y = parseInt(key.split('_')[1])
    return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) }
  }
  if (key.startsWith('quarter_')) {
    const [, y, q] = key.split('_').map(Number)
    const startMonth = (q - 1) * 3
    return { start: new Date(y, startMonth, 1), end: new Date(y, startMonth + 3, 0) }
  }
  if (key.startsWith('month_')) {
    const [, y, m] = key.split('_').map(Number)
    return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) }
  }
  if (key.startsWith('week_')) {
    const [, y, w] = key.split('_').map(Number)
    // ISO week start
    const jan4 = new Date(y, 0, 4)
    const wed = jan4 - (jan4.getDay() + 5) % 7 * 86400000
    const weekStart = new Date(wed + (w - 1) * 7 * 86400000)
    const weekEnd = new Date(weekStart.getTime() + 6 * 86400000)
    return { start: weekStart, end: weekEnd }
  }
  return { start: new Date(0), end: new Date(9999, 11, 31) }
}

function inRange(dateStr, range) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return false
  return d >= range.start && d <= range.end
}

function getPeriodKey(state) {
  if (state.weekNum != null) return 'week_' + state.weekYear + '_' + state.weekNum
  if (state.month != null) return 'month_' + state.year + '_' + state.month
  if (state.quarter != null) return 'quarter_' + state.year + '_' + state.quarter
  return 'year_' + state.year
}

function getFilteredApps(applications, state) {
  if (!applications) return []
  const range = getPeriodRange(getPeriodKey(state))
  return applications.filter(a => inRange(a.applyDate, range))
}

function getFilteredContracts(contracts, applications, state) {
  if (!contracts) return []
  const range = getPeriodRange(getPeriodKey(state))
  const appOppNos = new Set((applications || []).map(a => a.oppNo).filter(Boolean))
  return contracts.filter(c => {
    if (appOppNos.has(c.oppNo)) return inRange(c.mainSignDate, range)
    return false
  })
}

function amtOfApp(a) {
  if (a.status === '签单') return parseFloat(a.signAmount) || 0
  if (a.status === '预计') return parseFloat(a.expectedSignAmount) || 0
  return 0
}

function amtOfContract(c) {
  return parseFloat(c.mainActualAmount) || parseFloat(c.subAmount) || parseFloat(c.presalePerformance) || 0
}

export default function PresaleKanban() {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter state (mirrors HTML: year/quater/month/week)
  const [periodType, setPeriodType] = useState('year') // year | quarter | month | week
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarter, setQuarter] = useState(null)
  const [month, setMonth] = useState(null)
  const [weekNum, setWeekNum] = useState(null)
  const [weekYear, setWeekYear] = useState(new Date().getFullYear())

  const [mainTab, setMainTab] = useState('analysis') // analysis | lists | contracts
  const [subTab, setSubTab] = useState('q12') // q12 | judge | followup | contract

  const [appSearch, setAppSearch] = useState('')
  const [contractSearch, setContractSearch] = useState('')

  const loadState = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${PRESALE_API}/api/state`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setState(data.state || {})
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadState() }, [loadState])

  // Build effective filter state
  const filterState = state ? {
    ...state,
    year, quarter, month, weekNum, weekYear: weekNum != null ? weekYear : null
  } : { year: new Date().getFullYear(), quarter: null, month: null, weekNum: null }

  if (loading) {
    return (
      <div className="sf-hdr">
        <div className="sf-hdr-l">
          <div className="sf-hdr-logo"><LayoutDashboard size={20} color="#fff" /></div>
          <span className="sf-hdr-title">售前看板</span>
        </div>
        <div className="sf-hdr-r">
          <div className="pk-loading" style={{ color: '#fff', padding: 0 }}>
            <div className="pk-spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
            加载中...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sf-hdr">
        <div className="sf-hdr-l">
          <div className="sf-hdr-logo"><LayoutDashboard size={20} color="#fff" /></div>
          <span className="sf-hdr-title">售前看板</span>
        </div>
        <div className="sf-hdr-r">
          <div style={{ color: '#ff6b6b', fontSize: 13 }}>加载失败: {error}</div>
          <button className="fc-btn" onClick={loadState} style={{ marginLeft: 12 }}>
            <RefreshCw size={13} /> 重试
          </button>
        </div>
      </div>
    )
  }

  const filteredApps = getFilteredApps(state.applications, filterState)
  const filteredContracts = getFilteredContracts(state.contracts, state.applications, filterState)

  const periodLabel = periodType === 'year' ? `${year}年` :
    periodType === 'quarter' ? `${year}年第${quarter}季` :
    periodType === 'month' ? `${year}年${(month || 0) + 1}月` :
    weekNum != null ? `${weekYear}年第${weekNum}周` : '全部'

  return (
    <div className="pk-root">
      {/* ── Header (matches reference HTML) ── */}
      <div className="sf-hdr">
        <div className="sf-hdr-l">
          <div className="sf-hdr-logo"><LayoutDashboard size={20} color="#fff" /></div>
          <span className="sf-hdr-title">售前看板</span>
          <div className="sf-hdr-period">
            <PeriodSelector
              periodType={periodType} setPeriodType={setPeriodType}
              year={year} setYear={setYear}
              quarter={quarter} setQuarter={setQuarter}
              month={month} setMonth={setMonth}
              weekNum={weekNum} setWeekNum={setWeekNum}
              weekYear={weekYear} setWeekYear={setWeekYear}
            />
            <span className="cur-label">当前: <b>{periodLabel}</b></span>
          </div>
        </div>
        <div className="sf-hdr-r">
          <div className="save-st">
            <div className="save-dot saved" />
            <span id="saveText" style={{ fontSize: 12 }}>已同步</span>
          </div>
          <button className="fc-btn" onClick={loadState} style={{ marginLeft: 8 }}>
            <RefreshCw size={13} /> 刷新
          </button>
        </div>
      </div>

      {/* ── Main Tabs ── */}
      <div className="main-tabs" id="mainTabs">
        <button className={`mtab ${mainTab === 'analysis' ? 'active' : ''}`} onClick={() => setMainTab('analysis')}>
          <BarChart3 size={16} /> 首页
        </button>
        <button className={`mtab ${mainTab === 'lists' ? 'active' : ''}`} onClick={() => setMainTab('lists')}>
          <List size={16} /> 数据
        </button>
        <button className={`mtab ${mainTab === 'contracts' ? 'active' : ''}`} onClick={() => setMainTab('contracts')}>
          <FileSignature size={16} /> 看板
        </button>
      </div>

      <div className="main-content">
        {/* ═══ 售前分析 ═══ */}
        {mainTab === 'analysis' && (
          <AnalysisPane
            state={state}
            filteredApps={filteredApps}
            filteredContracts={filteredContracts}
            periodLabel={periodLabel}
          />
        )}

        {/* ═══ 售前清单 ═══ */}
        {mainTab === 'lists' && (
          <ListsPane
            state={state}
            filteredApps={filteredApps}
            filteredContracts={filteredContracts}
            subTab={subTab} setSubTab={setSubTab}
            appSearch={appSearch} setAppSearch={setAppSearch}
          />
        )}

        {/* ═══ 合同清单 ═══ */}
        {mainTab === 'contracts' && (
          <ContractsPane
            state={state}
            filteredContracts={filteredContracts}
            contractSearch={contractSearch} setContractSearch={setContractSearch}
          />
        )}
      </div>
    </div>
  )
}

// ─── Period Selector ─────────────────────────────────────────
function PeriodSelector({ periodType, setPeriodType, year, setYear, quarter, setQuarter, month, setMonth, weekNum, setWeekNum, weekYear, setWeekYear }) {
  const [open, setOpen] = useState(null)
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => thisYear - 2 + i)

  const toggle = (type) => { setOpen(open === type ? null : type) }

  const selectYear = (y) => { setYear(y); setQuarter(null); setMonth(null); setWeekNum(null); setOpen(null) }
  const selectQuarter = (q) => { setQuarter(q); setMonth(null); setWeekNum(null); setOpen(null) }
  const clearQuarter = () => { setQuarter(null); setOpen(null) }
  const selectMonth = (m) => { setMonth(m); setQuarter(null); setWeekNum(null); setOpen(null) }
  const clearMonth = () => { setMonth(null); setOpen(null) }

  const typeLabel = periodType === 'year' ? '年' : periodType === 'quarter' ? '季' : periodType === 'month' ? '月' : '周'

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {/* Year */}
      <div className="pd-wrap" id="ddYear">
        <button className="pd-btn" onClick={() => toggle('year')}>
          <span>{year}年</span> <ChevronDown size={11} />
        </button>
        {open === 'year' && (
          <div className="pd-panel">
            <div className="pd-grid cols3">
              {years.map(y => (
                <button key={y} className={`pd-opt ${y === year && !quarter && month == null && weekNum == null ? 'cur' : ''}`}
                  onClick={() => selectYear(y)}>{y}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quarter */}
      <div className="pd-wrap" id="ddQuarter">
        <button className="pd-btn" onClick={() => toggle('quarter')}>
          <span>{quarter != null ? `Q${quarter}` : '季'}</span> <ChevronDown size={11} />
        </button>
        {open === 'quarter' && (
          <div className="pd-panel">
            <button className={`pd-opt ${quarter == null ? 'cur' : ''}`} onClick={clearQuarter} style={{ color: '#666' }}>全年</button>
            {[1, 2, 3, 4].map(q => (
              <button key={q} className={`pd-opt ${quarter === q ? 'cur' : ''}`}
                onClick={() => selectQuarter(q)}>Q{q}</button>
            ))}
          </div>
        )}
      </div>

      {/* Month */}
      <div className="pd-wrap" id="ddMonth">
        <button className="pd-btn" onClick={() => toggle('month')}>
          <span>{month != null ? `${month + 1}月` : '月'}</span> <ChevronDown size={11} />
        </button>
        {open === 'month' && (
          <div className="pd-panel">
            <button className={`pd-opt ${month == null ? 'cur' : ''}`} onClick={clearMonth} style={{ gridColumn: '1/-1', color: '#666' }}>不限月份</button>
            {Array.from({ length: 12 }, (_, i) => (
              <button key={i} className={`pd-opt ${month === i ? 'cur' : ''}`}
                onClick={() => selectMonth(i)}>{i + 1}月</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Analysis Pane ───────────────────────────────────────────
function AnalysisPane({ state, filteredApps, filteredContracts, periodLabel }) {
  const allApps = state?.applications || []
  const range = getPeriodRange(getPeriodKey({ year: new Date().getFullYear(), quarter: null, month: null, weekNum: null }))

  // cardOverview stats
  const totalApps = filteredApps.length
  const totalAmount = filteredApps.reduce((s, a) => s + amtOfApp(a), 0)
  const wonApps = filteredApps.filter(a => a.status === '签单')
  const lostApps = filteredApps.filter(a => a.status === '丢失')
  const followApps = filteredApps.filter(a => a.status === '活跃')
  const expectedApps = filteredApps.filter(a => a.status === '预计')
  const newApps = filteredApps.filter(a => {
    const y = new Date().getFullYear()
    return a.applyDate && a.applyDate.startsWith(String(y))
  })

  // stalled
  const stalledApps = filteredApps.filter(a => {
    if (a.status !== '活跃') return false
    const follows = (state.followUps || []).filter(f => f.oppNo === a.oppNo)
    if (!follows.length) return true
    const latest = follows.reduce((m, f) => {
      const d = f.followDate ? new Date(f.followDate) : null
      return d && (!m || d > m) ? d : m
    }, null)
    if (!latest) return true
    return (Date.now() - latest.getTime()) > 14 * 86400000
  })

  // Win rate
  const wr = totalApps > 0 ? (wonApps.length / totalApps * 100).toFixed(1) : '0.0'
  const signedWithDates = wonApps.filter(a => a.signDate && a.applyDate)
  const avgDays = signedWithDates.length > 0
    ? Math.round(signedWithDates.reduce((s, a) => s + Math.max(0, (new Date(a.signDate) - new Date(a.applyDate)) / 86400000), 0) / signedWithDates.length)
    : 0
  const fastCount = signedWithDates.filter(a => (new Date(a.signDate) - new Date(a.applyDate)) / 86400000 <= 30).length
  const slowCount = signedWithDates.filter(a => (new Date(a.signDate) - new Date(a.applyDate)) / 86400000 > 90).length

  // Annual target
  const annualTarget = state?.annualTarget || 0
  const actualContractAmount = filteredContracts.reduce((s, c) => s + amtOfContract(c), 0)
  const actualWan = actualContractAmount / 10000
  const targetPct = annualTarget > 0 ? Math.min((actualWan / annualTarget * 100), 100).toFixed(1) : '0.0'

  // Product analysis
  const productMap = {}
  filteredContracts.forEach(c => {
    const p = c.product || '未指定'
    if (!productMap[p]) productMap[p] = { count: 0, amount: 0 }
    productMap[p].count++
    productMap[p].amount += amtOfContract(c)
  })
  const productArr = Object.entries(productMap).sort((a, b) => b[1].amount - a[1].amount).slice(0, 5)
  const productTotalAmount = productArr.reduce((s, p) => s + p[1].amount, 0)

  // Focus items (risk + key flag)
  const riskApps = filteredApps.filter(a =>
    (state.judgments || []).some(j => j.oppNo === a.oppNo && j.isRisk === '是')
  )
  const keyFlagApps = filteredApps.filter(a => !!a.isKeyFocus || a.isKeyFocus === '是')

  // Contract analysis cards (from filteredContracts, not hardcoded)
  const totalContractAmount = filteredContracts.reduce((s, c) => s + amtOfContract(c), 0)
  const totalContractCount = filteredContracts.length
  const avgContractAmount = totalContractCount > 0 ? totalContractAmount / totalContractCount / 10000 : 0

  // caContracts for collection rate
  const caReceipt = filteredContracts.reduce((s, c) => s + (parseFloat(c.mainReceipt) || 0), 0)
  const caActualAmount = filteredContracts.reduce((s, c) => s + amtOfContract(c), 0)
  const collectionRate = caActualAmount > 0 ? (caReceipt / caActualAmount * 100).toFixed(1) : '0.0'

  // Business line analysis (bizLine1 = 业务线, bizLine4 = 合同类型)
  const bizLine1Map = { '直销': { count: 0, amount: 0 }, '分销': { count: 0, amount: 0 }, '服务': { count: 0, amount: 0 } }
  const bizLine4Map = { '新购': { count: 0, amount: 0 }, '续费': { count: 0, amount: 0 }, '调整': { count: 0, amount: 0 } }
  filteredContracts.forEach(c => {
    const biz1 = c.businessLine1 || c.bizType || '直销'
    const biz4 = c.contractType || '新购'
    if (bizLine1Map[biz1] != null) { bizLine1Map[biz1].count++; bizLine1Map[biz1].amount += amtOfContract(c) }
    if (bizLine4Map[biz4] != null) { bizLine4Map[biz4].count++; bizLine4Map[biz4].amount += amtOfContract(c) }
  })

  // Dept support / customer type
  const oldCustomerContracts = filteredContracts.filter(c => c.customerType === '老客户' || c.isOldCustomer)
  const newCustomerContracts = filteredContracts.filter(c => c.customerType === '新客户' || c.isNewCustomer)
  const oldCount = oldCustomerContracts.length
  const newCount = newCustomerContracts.length
  const oldAmount = oldCustomerContracts.reduce((s, c) => s + amtOfContract(c), 0)
  const newAmount = newCustomerContracts.reduce((s, c) => s + amtOfContract(c), 0)
  const oldPct = totalContractAmount > 0 ? (oldAmount / totalContractAmount * 100).toFixed(1) : '0.0'
  const newPct = totalContractAmount > 0 ? (newAmount / totalContractAmount * 100).toFixed(1) : '0.0'

  // Top product lines
  const topProducts = productArr.slice(0, 4)

  return (
    <div className="main-pane active">
      {/* 4 cards row */}
      <div className="cards-row" id="cardsRowAnalysis">

        {/* Card 1: 项目总览 */}
        <div className="t-card">
          <div className="t-card-hdr">
            <div className="t-card-title"><FolderOpen size={15} /> 项目总览</div>
          </div>
          <div className="t-card-body" style={{ padding: 14 }}>
            <div className="overview-top">
              <span className="ov-num">{totalApps}<b>个</b></span>
              <span className="ov-split" />
              <span className="ov-amt">金额：{fmtWan(totalAmount)}</span>
            </div>
            <div className="overview-grid">
              {[
                { label: '新增', count: newApps.length, amount: newApps.reduce((s,a)=>s+amtOfApp(a),0), color: '#0176d3', type: 'new' },
                { label: '跟进', count: followApps.length, amount: followApps.reduce((s,a)=>s+amtOfApp(a),0), color: '#896506', type: 'active' },
                { label: '签单', count: wonApps.length, amount: wonApps.reduce((s,a)=>s+amtOfApp(a),0), color: '#04844b', type: 'won' },
                { label: '预计', count: expectedApps.length, amount: expectedApps.reduce((s,a)=>s+amtOfApp(a),0), color: '#8b5cf6', type: 'expected' },
                { label: '丢单', count: lostApps.length, amount: lostApps.reduce((s,a)=>s+amtOfApp(a),0), color: '#9e9e9e', type: 'lost' },
                { label: '暂停', count: stalledApps.length, amount: stalledApps.reduce((s,a)=>s+amtOfApp(a),0), color: '#8b5cf6', type: 'stalled' },
              ].map(s => (
                <div key={s.type} className="overview-cell">
                  <div className="ovc-lbl" style={{ color: s.color }}>{s.label}</div>
                  <div className="ovc-main"><b>{s.count}</b><span>个</span></div>
                  <div className="ovc-amt">{fmtWan(s.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: 重点关注 */}
        <div className="t-card">
          <div className="t-card-hdr">
            <div className="t-card-title" style={{ color: '#ba0517' }}><AlertTriangle size={15} /> 重点关注</div>
          </div>
          <div className="t-card-body" style={{ padding: 14 }}>
            {keyFlagApps.length === 0 && riskApps.length === 0 ? (
              <div className="pk-empty">暂无重点关注项目</div>
            ) : (
              <>
                {keyFlagApps.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      ⭐ 重点标注 ({keyFlagApps.length})
                    </div>
                    {keyFlagApps.slice(0, 5).map(a => (
                      <div key={a.id} className="focus-item">
                        • {a.customer || '—'} / {a.projectName || '—'}
                      </div>
                    ))}
                  </div>
                )}
                {riskApps.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#ba0517', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      ⚠ 风险项目 ({riskApps.length})
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '2px 4px', fontSize: 10, color: '#666', fontWeight: 500, borderBottom: '1px solid #e5e5e5', width: '28%' }}>客户</th>
                          <th style={{ textAlign: 'left', padding: '2px 4px', fontSize: 10, color: '#666', fontWeight: 500, borderBottom: '1px solid #e5e5e5', width: '30%' }}>项目</th>
                          <th style={{ textAlign: 'right', padding: '2px 4px', fontSize: 10, color: '#666', fontWeight: 500, borderBottom: '1px solid #e5e5e5', width: '20%' }}>金额</th>
                          <th style={{ textAlign: 'left', padding: '2px 4px', fontSize: 10, color: '#666', fontWeight: 500, borderBottom: '1px solid #e5e5e5', width: '22%' }}>销售</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riskApps.slice(0, 5).map(a => (
                          <tr key={a.id}>
                            <td style={{ padding: '2px 4px', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.customer || '—'}</td>
                            <td style={{ padding: '2px 4px', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.projectName || '—'}</td>
                            <td style={{ padding: '2px 4px', fontSize: 11, textAlign: 'right' }}>{fmtWan(parseFloat(a.applyAmount) || 0)}</td>
                            <td style={{ padding: '2px 4px', fontSize: 11, color: '#666' }}>{a.applicant || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Card 3: 赢单率/周期 */}
        <div className="t-card">
          <div className="t-card-hdr">
            <div className="t-card-title"><Trophy size={15} /> 赢单率 / 周期</div>
          </div>
          <div className="t-card-body" style={{ padding: 14 }}>
            <div className="wr-wrap">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#04844b', lineHeight: 1 }}>{wr}%</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>赢单率</div>
              </div>
              <div className="wr-stats">
                <div>赢单 <b>{wonApps.length}</b></div>
                <div>丢单 <b>{lostApps.length}</b></div>
                <div>总数 <b>{totalApps}</b></div>
              </div>
            </div>
            <div style={{ marginTop: 6, paddingTop: 8, borderTop: '1px dashed #e5e5e5', display: 'flex', gap: 12, justifyContent: 'space-around', fontSize: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <b style={{ fontSize: 14, color: '#181818' }}>{avgDays}</b>
                <div style={{ color: '#666' }}>平均周期(天)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <b style={{ fontSize: 14, color: '#04844b' }}>{fastCount}</b>
                <div style={{ color: '#666' }}>快速≤30天</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <b style={{ fontSize: 14, color: '#ba0517' }}>{slowCount}</b>
                <div style={{ color: '#666' }}>缓慢&gt;90天</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: 产品线分析 */}
        <div className="t-card">
          <div className="t-card-hdr">
            <div className="t-card-title"><Package size={15} /> 产品线分析</div>
          </div>
          <div className="t-card-body" style={{ padding: 0 }}>
            {productArr.length === 0 ? (
              <div className="pk-empty">暂无合同数据</div>
            ) : (
              <div className="q-tbl-wrap">
                <table className="q-tbl">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>产品</th>
                      <th>合同数</th>
                      <th>金额(万)</th>
                      <th>占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productArr.map(([name, data]) => {
                      const pct = productTotalAmount > 0 ? (data.amount / productTotalAmount * 100).toFixed(1) : '0.0'
                      return (
                        <tr key={name}>
                          <td style={{ textAlign: 'left', fontSize: 11 }}>{name}</td>
                          <td style={{ fontSize: 11 }}>{data.count}</td>
                          <td style={{ fontSize: 11 }}>{fmtWan(data.amount)}</td>
                          <td style={{ fontSize: 11, color: '#0176d3' }}>{pct}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 合同分析 grid ── */}
      <div className="sec-block">
        <div className="sec-title"><FileSignature size={15} /> 合同分析</div>
        <div className="ca-grid">
          {/* Card 1: 合同总额 */}
          <div className="ca-card ca-total ca-4col">
            <div className="ds-top"><div className="ds-year">合同总额</div></div>
            <div className="ds-main">
              <div className="ds-main-col">
                <div className="ds-main-amt">{(totalContractAmount / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
                <div className="ds-main-sub">合同总额(万)</div>
              </div>
              <div className="ds-main-col">
                <div className="ds-main-amt">{totalContractCount}<span style={{ fontSize: 11 }}>份</span></div>
                <div className="ds-main-sub">合同份数</div>
              </div>
              <div className="ds-main-col">
                <div className="ds-main-amt">{avgContractAmount.toFixed(1)}</div>
                <div className="ds-main-sub">平均金额(万)</div>
              </div>
              <div className="ds-main-col">
                <div className="ds-main-amt" style={{ color: collectionRate > 50 ? '#04844b' : '#ba0517' }}>
                  {caActualAmount > 0 ? collectionRate + '%' : '—'}
                </div>
                <div className="ds-main-sub">回款率</div>
              </div>
            </div>
            <div className="ds-seg">
              <div className="ds-seg-col">
                <div className="ds-seg-row">
                  <div className="ds-seg-label">老客户</div>
                  <div className="ds-seg-val"><b>{oldCount}份</b> / {fmtWan(oldAmount)} ({oldPct}%)</div>
                </div>
                <div className="ds-seg-row">
                  <div className="ds-seg-label">新客户</div>
                  <div className="ds-seg-val"><b>{newCount}份</b> / {fmtWan(newAmount)} ({newPct}%)</div>
                </div>
              </div>
              <div className="ds-seg-col">
                {topProducts.map(([name, data]) => (
                  <div key={name} className="ds-seg-row">
                    <div className="ds-seg-label" title={name}>{name.length > 12 ? name.slice(0, 12) + '…' : name}</div>
                    <div className="ds-seg-val"><b>{data.count}份</b> / {fmtWan(data.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: 新购合同 */}
          <ContractTypeCard
            title="新购合同"
            color="#04844b"
            data={bizLine4Map['新购']}
            topProducts={topProducts}
            oldCount={oldCustomerContracts.filter(c => c.contractType === '新购').length}
            oldAmount={oldCustomerContracts.filter(c => c.contractType === '新购').reduce((s,c)=>s+amtOfContract(c),0)}
            newCount={newCustomerContracts.filter(c => c.contractType === '新购').length}
            newAmount={newCustomerContracts.filter(c => c.contractType === '新购').reduce((s,c)=>s+amtOfContract(c),0)}
          />

          {/* Card 3: 续费合同 */}
          <ContractTypeCard
            title="续费合同"
            color="#896506"
            data={bizLine4Map['续费']}
            bizLine1={bizLine1Map}
          />

          {/* Card 4: 调整合同 */}
          <ContractTypeCard
            title="调整合同"
            color="#9050e9"
            data={bizLine4Map['调整']}
            customerTypeData={[
              { name: '老客户', count: oldCount, amount: oldAmount },
              { name: '新客户', count: newCount, amount: newAmount },
            ]}
            bizLine1={bizLine1Map}
          />
        </div>
      </div>

      {/* ── 顾问分析 ── */}
      <ConsultantAnalysis state={state} filteredApps={filteredApps} />

      {/* ── 销售人员分析 ── */}
      <SalesAnalysis state={state} filteredApps={filteredApps} />
    </div>
  )
}

// ─── Contract Type Card ──────────────────────────────────────
function ContractTypeCard({ title, color, data, topProducts, bizLine1, customerTypeData, oldCount, oldAmount, newCount, newAmount }) {
  const count = data?.count || 0
  const amount = data?.amount || 0
  const avg = count > 0 ? amount / count / 10000 : 0
  return (
    <div className="ca-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="ds-top"><div className="ds-year" style={{ color }}>{title}</div></div>
      <div className="ds-main">
        <div className="ds-main-col">
          <div className="ds-main-amt" style={{ color }}>{fmtWan(amount)}</div>
          <div className="ds-main-sub">{title}总额(万)</div>
        </div>
        <div className="ds-main-col">
          <div className="ds-main-amt" style={{ color }}>{count}<span style={{ fontSize: 11 }}>份</span></div>
          <div className="ds-main-sub">{title}份数</div>
        </div>
        <div className="ds-main-col">
          <div className="ds-main-amt" style={{ color }}>{avg.toFixed(1)}</div>
          <div className="ds-main-sub">{title}均值(万)</div>
        </div>
      </div>
      <div className="ds-seg">
        <div className="ds-seg-col">
          {(customerTypeData || (topProducts ? topProducts.slice(0, 3).map(([n, d]) => ({ name: n, count: d.count, amount: d.amount })) : [])) .map(item => (
            <div key={item.name} className="ds-seg-row">
              <div className="ds-seg-label">{item.name}</div>
              <div className="ds-seg-val"><b>{item.count}份</b> / {fmtWan(item.amount)}</div>
            </div>
          ))}
        </div>
        <div className="ds-seg-col">
          {bizLine1 ? Object.entries(bizLine1).map(([name, d]) => (
            <div key={name} className="ds-seg-row">
              <div className="ds-seg-label">{name}</div>
              <div className="ds-seg-val"><b>{d.count}份</b> / {fmtWan(d.amount)}</div>
            </div>
          )) : topProducts?.map(([name, d]) => (
            <div key={name} className="ds-seg-row">
              <div className="ds-seg-label" title={name}>{name.length > 10 ? name.slice(0, 10) + '…' : name}</div>
              <div className="ds-seg-val"><b>{d.count}份</b> / {fmtWan(d.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Consultant Analysis ─────────────────────────────────────
function ConsultantAnalysis({ state, filteredApps }) {
  const allocations = state?.allocations || []
  const contracts = state?.contracts || []

  // Filter allocations by current period
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()
  const thisQuarter = Math.floor(thisMonth / 3) + 1

  const allocList = allocations.filter(a => {
    if (!a.consultant) return false
    const m = String(a.month || '').match(/^(\d{4})-(\d{1,2})/)
    if (!m) return false
    const y = parseInt(m[1]), mo = parseInt(m[2])
    return y === thisYear // simplified: current year
  })

  // Group by consultant
  const personMap = {}
  allocList.forEach(a => {
    const name = a.consultant.trim() || '未指定'
    if (!personMap[name]) personMap[name] = { name, count: 0, consPerf: 0, dept: a.department || '', opps: new Set() }
    const p = personMap[name]
    p.count++
    p.consPerf += parseFloat(a.consultantPerformance) || 0
    if (a.oppNo) p.opps.add(a.oppNo)
    if (a.department) p.dept = a.department
  })

  const managers = Object.values(personMap).sort((a, b) => b.consPerf - a.consPerf)
  const totalPerf = managers.reduce((s, m) => s + m.consPerf, 0)

  if (managers.length === 0) {
    return (
      <div className="sec-block">
        <div className="sec-title"><Users size={15} /> 顾问分析</div>
        <div className="t-card">
          <div className="pk-empty" style={{ padding: 24 }}>暂无业绩分配数据</div>
        </div>
      </div>
    )
  }

  const maxPerf = Math.max(...managers.map(m => m.consPerf), 1)
  const barColors = ['#1e40af', '#047857', '#b45309', '#6d28d9', '#be123c', '#0369a1', '#15803d', '#a21caf']

  return (
    <div className="sec-block">
      <div className="sec-title"><Users size={15} /> 顾问分析</div>
      <div className="t-card">
        <div className="cons-body">
          {/* Bar chart */}
          <div className="cons-chart-wrap">
            <div className="cons-chart">
              <div className="cons-chart-inner">
                {managers.slice(0, 8).map((m, i) => {
                  const h = Math.max(2, (m.consPerf / maxPerf) * 160)
                  const amtWan = (m.consPerf / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                  return (
                    <div key={m.name} className="cons-bar">
                      <div className="bar" style={{ height: h, background: barColors[i % barColors.length] }}>
                        <div className="bar-val">{amtWan}</div>
                      </div>
                      <div className="bar-lbl">{m.name}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: summary table */}
          <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
            <table className="q-tbl" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>顾问</th>
                  <th>部门</th>
                  <th>商机数</th>
                  <th>笔数</th>
                  <th style={{ textAlign: 'right' }}>顾问业绩(万)</th>
                  <th style={{ textAlign: 'right' }}>占比</th>
                </tr>
              </thead>
              <tbody>
                {managers.slice(0, 10).map(m => {
                  const pct = totalPerf > 0 ? (m.consPerf / totalPerf * 100).toFixed(1) : '0.0'
                  return (
                    <tr key={m.name}>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>{m.name}</td>
                      <td>{m.dept || '—'}</td>
                      <td style={{ textAlign: 'center' }}>{m.opps.size}</td>
                      <td style={{ textAlign: 'center' }}>{m.count}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{(m.consPerf / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', color: '#0176d3' }}>{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sales Analysis ──────────────────────────────────────────
function SalesAnalysis({ state, filteredApps }) {
  const apps = filteredApps || []

  // Group by applicant/sales person
  const salesMap = {}
  apps.forEach(a => {
    const name = a.applicant || a.consultant || '未指定'
    if (!salesMap[name]) salesMap[name] = { name, count: 0, amount: 0, won: 0, lost: 0 }
    const p = salesMap[name]
    p.count++
    p.amount += parseFloat(a.applyAmount) || parseFloat(a.expectedSignAmount) || 0
    if (a.status === '签单') p.won++
    if (a.status === '丢失') p.lost++
  })

  const salesList = Object.values(salesMap).sort((a, b) => b.amount - a.amount)

  if (salesList.length === 0) {
    return (
      <div className="sec-block">
        <div className="sec-title"><UserCheck size={15} /> 销售人员分析</div>
        <div className="t-card">
          <div className="pk-empty" style={{ padding: 24 }}>暂无销售数据</div>
        </div>
      </div>
    )
  }

  return (
    <div className="sec-block">
      <div className="sec-title"><UserCheck size={15} /> 销售人员分析</div>
      <div className="t-card">
        <table className="q-tbl" style={{ fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>销售人员</th>
              <th>申请数</th>
              <th>赢单</th>
              <th>丢单</th>
              <th style={{ textAlign: 'right' }}>申请金额(万)</th>
              <th style={{ textAlign: 'right' }}>赢单率</th>
            </tr>
          </thead>
          <tbody>
            {salesList.map(p => {
              const wr = p.count > 0 ? ((p.won / p.count) * 100).toFixed(1) : '0.0'
              return (
                <tr key={p.name}>
                  <td style={{ textAlign: 'left', fontWeight: 600 }}>{p.name}</td>
                  <td style={{ textAlign: 'center' }}>{p.count}</td>
                  <td style={{ textAlign: 'center', color: '#04844b' }}>{p.won}</td>
                  <td style={{ textAlign: 'center', color: '#ba0517' }}>{p.lost}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtWan(p.amount)}</td>
                  <td style={{ textAlign: 'right', color: parseFloat(wr) > 50 ? '#04844b' : '#ba0517' }}>{wr}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Lists Pane ──────────────────────────────────────────────
function ListsPane({ state, filteredApps, subTab, setSubTab, appSearch, setAppSearch }) {
  const allApps = state?.applications || []
  const searchLower = appSearch.toLowerCase()
  const displayedApps = appSearch
    ? filteredApps.filter(a =>
        (a.customer || '').toLowerCase().includes(searchLower) ||
        (a.projectName || '').toLowerCase().includes(searchLower) ||
        (a.consultant || '').toLowerCase().includes(searchLower) ||
        (a.oppNo || '').toLowerCase().includes(searchLower) ||
        (a.applicant || '').toLowerCase().includes(searchLower)
      )
    : filteredApps.slice(0, 50)

  return (
    <div className="main-pane">
      {/* 售前申请列表 */}
      <div className="t-card" style={{ marginBottom: 16 }}>
        <div className="t-card-hdr">
          <div className="t-card-title"><FileSignature size={15} /> 售前申请列表</div>
          <input
            className="fi"
            placeholder="搜索 客户/项目/人员/商机/部门/金额..."
            value={appSearch}
            onChange={e => setAppSearch(e.target.value)}
            style={{ width: 260, height: 28, fontSize: 12, marginLeft: 12 }}
          />
        </div>
        <div className="tw">
          <table className="dt">
            <thead>
              <tr>
                <th>商机号</th>
                <th>客户名称</th>
                <th>项目名称</th>
                <th>产品</th>
                <th>申请金额</th>
                <th>预计金额</th>
                <th>顾问</th>
                <th>状态</th>
                <th>申请人</th>
                <th>申请日期</th>
              </tr>
            </thead>
            <tbody>
              {displayedApps.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: '#999', padding: 16 }}>暂无数据</td></tr>
              ) : displayedApps.map(a => (
                <tr key={a.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{a.oppNo || '—'}</td>
                  <td style={{ fontSize: 12 }}>{a.customer || '—'}</td>
                  <td style={{ fontSize: 12 }}>{a.projectName || '—'}</td>
                  <td style={{ fontSize: 11 }}>{a.product || '—'}</td>
                  <td style={{ textAlign: 'right', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(parseFloat(a.applyAmount) || 0)}</td>
                  <td style={{ textAlign: 'right', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(parseFloat(a.expectedSignAmount) || 0)}</td>
                  <td style={{ fontSize: 11 }}>{a.consultant || '—'}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td style={{ fontSize: 11 }}>{a.applicant || '—'}</td>
                  <td style={{ fontSize: 11 }}>{a.applyDate ? a.applyDate.slice(0, 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredApps.length > 50 && !appSearch && (
          <div style={{ padding: '8px 14px', fontSize: 11, color: '#666', borderTop: '1px solid #e5e5e5' }}>
            显示前50条，共 {filteredApps.length} 条
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="tabs" id="subTabs">
        {[
          { key: 'q12', label: '销售十二问 / 需求清单', icon: <List size={13} /> },
          { key: 'judge', label: '顾问判断', icon: <Users size={13} /> },
          { key: 'followup', label: '项目跟进', icon: <FileSignature size={13} /> },
          { key: 'contract', label: '合同签订', icon: <FileSignature size={13} /> },
        ].map(t => (
          <button key={t.key} className={`tab ${subTab === t.key ? 'active' : ''}`} onClick={() => setSubTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {subTab === 'q12' && <SalesQuestionPane state={state} />}
      {subTab === 'judge' && <JudgePane state={state} />}
      {subTab === 'followup' && <FollowUpPane state={state} />}
      {subTab === 'contract' && <ContractPane state={state} />}
    </div>
  )
}

// ─── Sales Question Pane ─────────────────────────────────────
function SalesQuestionPane({ state }) {
  const questions = state?.salesQuestions || []
  return (
    <div className="tab-pane active">
      <div className="pk-empty">销售十二问功能开发中</div>
    </div>
  )
}

// ─── Judge Pane ──────────────────────────────────────────────
function JudgePane({ state }) {
  const judgments = state?.judgments || []
  return (
    <div className="tab-pane active">
      <table className="dt">
        <thead>
          <tr>
            <th>商机号</th>
            <th>竞争对手</th>
            <th>竞争情况</th>
            <th>风险</th>
            <th>顾问判断</th>
            <th>日期</th>
          </tr>
        </thead>
        <tbody>
          {judgments.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: 16 }}>暂无数据</td></tr>
          ) : judgments.map(j => (
            <tr key={j.id}>
              <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{j.oppNo || '—'}</td>
              <td style={{ fontSize: 12 }}>{j.competitor || '—'}</td>
              <td style={{ fontSize: 12 }}>{j.competitorSituation || '—'}</td>
              <td><RiskBadge risk={j.isRisk} /></td>
              <td style={{ fontSize: 12 }}>{j.judgment || '—'}</td>
              <td style={{ fontSize: 11 }}>{j.judgeDate ? j.judgeDate.slice(0, 10) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Follow-up Pane ─────────────────────────────────────────
function FollowUpPane({ state }) {
  const followUps = state?.followUps || []
  return (
    <div className="tab-pane active">
      <table className="dt">
        <thead>
          <tr>
            <th>商机号</th>
            <th>客户</th>
            <th>顾问</th>
            <th>跟进内容</th>
            <th>下次日期</th>
            <th>跟进日期</th>
          </tr>
        </thead>
        <tbody>
          {followUps.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: 16 }}>暂无数据</td></tr>
          ) : followUps.map(f => (
            <tr key={f.id}>
              <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{f.oppNo || '—'}</td>
              <td style={{ fontSize: 12 }}>{f.customerName || '—'}</td>
              <td style={{ fontSize: 11 }}>{f.consultant || '—'}</td>
              <td style={{ fontSize: 12 }}>{f.content || f.followContent || '—'}</td>
              <td style={{ fontSize: 11 }}>{f.nextDate ? f.nextDate.slice(0, 10) : '—'}</td>
              <td style={{ fontSize: 11 }}>{f.followDate ? f.followDate.slice(0, 10) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Contract Pane ────────────────────────────────────────────
function ContractPane({ state }) {
  const contracts = state?.contracts || []
  return (
    <div className="tab-pane active">
      <table className="dt">
        <thead>
          <tr>
            <th>主合同编号</th>
            <th>签约客户</th>
            <th>产品</th>
            <th>合同金额</th>
            <th>售前业绩</th>
            <th>签订日期</th>
          </tr>
        </thead>
        <tbody>
          {contracts.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: 16 }}>暂无数据</td></tr>
          ) : contracts.map(c => (
            <tr key={c.id}>
              <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.mainContractNo || '—'}</td>
              <td style={{ fontSize: 12 }}>{c.signCustomerName || c.signCustomer || '—'}</td>
              <td style={{ fontSize: 11 }}>{c.product || '—'}</td>
              <td style={{ textAlign: 'right', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(parseFloat(c.subAmount) || 0)}</td>
              <td style={{ textAlign: 'right', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(parseFloat(c.presalePerformance) || 0)}</td>
              <td style={{ fontSize: 11 }}>{c.mainSignDate ? c.mainSignDate.slice(0, 10) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 业绩分配列表 */}
      <div style={{ marginTop: 24 }}>
        <div className="t-card-hdr" style={{ padding: '10px 14px', borderBottom: '1px solid #e5e5e5', background: 'linear-gradient(135deg,#f0f8ff 0%,#eaf5fe 100%)' }}>
          <div className="t-card-title"><FileSignature size={15} /> 业绩分配列表</div>
        </div>
        <AllocationTable state={state} />
      </div>
    </div>
  )
}

// ─── Allocation Table ─────────────────────────────────────────
function AllocationTable({ state }) {
  const allocations = state?.allocations || []
  if (allocations.length === 0) {
    return <div className="pk-empty" style={{ padding: 16 }}>暂无业绩分配数据</div>
  }
  return (
    <table className="dt">
      <thead>
        <tr>
          <th>月份</th>
          <th>商机号</th>
          <th>签约客户</th>
          <th>部门</th>
          <th>顾问</th>
          <th style={{ textAlign: 'right' }}>合同业绩(元)</th>
          <th style={{ textAlign: 'right' }}>订阅业绩(元)</th>
          <th style={{ textAlign: 'right' }}>顾问业绩(元)</th>
        </tr>
      </thead>
      <tbody>
        {allocations.slice(0, 50).map(a => (
          <tr key={a.id}>
            <td style={{ fontSize: 11 }}>{a.month || '—'}</td>
            <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{a.oppNo || '—'}</td>
            <td style={{ fontSize: 12 }}>{a.customer || a.signCustomer || '—'}</td>
            <td style={{ fontSize: 11 }}>{a.department || '—'}</td>
            <td style={{ fontSize: 11 }}>{a.consultant || '—'}</td>
            <td style={{ textAlign: 'right', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(parseFloat(a.contractPerformance) || 0)}</td>
            <td style={{ textAlign: 'right', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(parseFloat(a.subscriptionPerformance) || 0)}</td>
            <td style={{ textAlign: 'right', fontSize: 11, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtMoney(parseFloat(a.consultantPerformance) || 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── Contracts Pane ──────────────────────────────────────────
function ContractsPane({ state, filteredContracts, contractSearch, setContractSearch }) {
  const contracts = state?.contracts || []
  const searchLower = contractSearch.toLowerCase()
  const displayed = contractSearch
    ? contracts.filter(c =>
        (c.mainContractNo || '').toLowerCase().includes(searchLower) ||
        (c.signCustomerName || c.signCustomer || '').toLowerCase().includes(searchLower) ||
        (c.product || '').toLowerCase().includes(searchLower) ||
        (c.consultant || '').toLowerCase().includes(searchLower)
      )
    : filteredContracts.slice(0, 50)

  return (
    <div className="main-pane">
      <div className="t-card">
        <div className="t-card-hdr">
          <div className="t-card-title"><FileSignature size={15} /> 合同清单</div>
          <input
            className="fi"
            placeholder="搜索 编号/客户/人员/产品..."
            value={contractSearch}
            onChange={e => setContractSearch(e.target.value)}
            style={{ width: 260, height: 28, fontSize: 12, marginLeft: 12 }}
          />
          <span style={{ fontSize: 11, color: '#666', marginLeft: 'auto' }}>
            共 {contracts.length} 份合同
          </span>
        </div>
        <div className="tw">
          <table className="dt">
            <thead>
              <tr>
                <th>主合同编号</th>
                <th>签约客户</th>
                <th>产品</th>
                <th>合同金额</th>
                <th>售前业绩</th>
                <th>回款</th>
                <th>签订日期</th>
                <th>业务线</th>
                <th>合同类型</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#999', padding: 16 }}>暂无数据</td></tr>
              ) : displayed.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.mainContractNo || '—'}</td>
                  <td style={{ fontSize: 12 }}>{c.signCustomerName || c.signCustomer || '—'}</td>
                  <td style={{ fontSize: 11 }}>{c.product || '—'}</td>
                  <td style={{ textAlign: 'right', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(parseFloat(c.subAmount) || 0)}</td>
                  <td style={{ textAlign: 'right', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(parseFloat(c.presalePerformance) || 0)}</td>
                  <td style={{ textAlign: 'right', fontSize: 11, fontVariantNumeric: 'tabular-nums', color: '#04844b' }}>{fmtMoney(parseFloat(c.mainReceipt) || 0)}</td>
                  <td style={{ fontSize: 11 }}>{c.mainSignDate ? c.mainSignDate.slice(0, 10) : '—'}</td>
                  <td style={{ fontSize: 11 }}>{c.businessLine1 || c.bizType || '—'}</td>
                  <td style={{ fontSize: 11 }}>{c.contractType || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    '签单': { bg: '#e6f4ee', color: '#04844b' },
    '活跃': { bg: '#fef3c7', color: '#896506' },
    '丢失': { bg: '#fecaca', color: '#ba0517' },
    '预计': { bg: '#ede9fe', color: '#6d28d9' },
    '暂停': { bg: '#f3f4f6', color: '#6b7280' },
  }
  const s = styles[status] || { bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {status || '未知'}
    </span>
  )
}

function RiskBadge({ risk }) {
  const isRisk = risk === '是'
  return (
    <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: isRisk ? '#fecaca' : '#e6f4ee', color: isRisk ? '#ba0517' : '#04844b' }}>
      {isRisk ? '⚠ 风险' : '✓ 正常'}
    </span>
  )
}
