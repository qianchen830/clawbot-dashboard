import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Edit2, Play, Square, RotateCcw, Server, Wifi, WifiOff,
  ExternalLink, Copy, Crown, Cpu, Activity, Zap, Lock, Unlock, Database
} from 'lucide-react'
import './FleetCluster.css'

function toast(msg) {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.style.transform = 'translateX(-50%) translateY(0)'
  setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(100px)' }, 3000)
}

function StatusBadge({ status }) {
  const cfg = {
    online:    { label: '在线',   cls: 'online',    icon: <Wifi size={11}/> },
    offline:   { label: '离线',   cls: 'offline',   icon: <WifiOff size={11}/> },
    unhealthy: { label: '异常', cls: 'unhealthy', icon: <Wifi size={11}/> },
  }
  const c = cfg[status] || cfg.unhealthy
  return <span className={`badge badge-${c.cls}`}>{c.icon}{c.label}</span>
}

function FeishuBadge({ inst }) {
  if (inst.feishu_connected && inst.feishu_app_name)
    return <span className="feishu-badge connected">✅ {inst.feishu_app_name}</span>
  if (inst.feishu_connected && inst.feishu_app_id && inst.feishu_app_id !== '__FEISHU_APP_ID__')
    return <span className="feishu-badge connected">✅ {inst.feishu_app_id.slice(0, 14)}…</span>
  if (inst.feishu_connected)
    return <span className="feishu-badge connected">✅ 已连接</span>
  return <span className="feishu-badge disconnected">❌ 未配置</span>
}

function InstanceCard({ inst, onSave, onRefresh }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(String(inst.name || inst.id || ''))
  const [direction, setDirection] = useState(String(inst.direction || ''))
  const [saving, setSaving] = useState(false)
  const [locking, setLocking] = useState(false)
  const [isLocked, setIsLocked] = useState(!!inst.isLocked)

  const handleLockToggle = useCallback(async () => {
    setLocking(true)
    try {
      const url = isLocked ? '/api/fleet/unlock' : '/api/fleet/lock'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance: inst.id }),
      })
      const data = await res.json()
      if (data.success) {
        setIsLocked(!isLocked)
        toast(isLocked ? `已解锁 ${inst.id}` : `已锁定 ${inst.id}`)
      } else {
        toast(data.message || '操作失败')
      }
    } catch { toast('锁定操作失败') }
    finally { setLocking(false) }
  }, [inst.id, isLocked])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/fleet/instances/${inst.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, direction }),
      })
      const data = await res.json()
      if (data.error) { toast(data.error); return }
      onSave(data)
      toast(`${inst.id} 已更新`)
    } catch (e) { toast(`保存失败: ${e.message}`) }
    finally { setSaving(false); setEditing(false) }
  }, [inst.id, name, direction, onSave])

  const rpc = useCallback(async (action, msg) => {
    toast(`${msg} ${inst.id}...`)
    try {
      const res = await fetch(`/api/fleet/instances/${inst.id}/${action}`, { method: 'POST' })
      const data = await res.json()
      toast(data.message || data.error || msg + '完成')
      setTimeout(onRefresh, 2000)
    } catch { toast(msg + '请求失败') }
  }, [inst.id, onRefresh])

  const isOnline = inst.status === 'online'
  const isMaster = inst.is_master
  const isWslHost = inst.container === null
  const isModeration = inst.id === 'moderation'
  const isProduction = inst.runtime === 'ssh'
  const borderColor = isModeration ? '#ff6f00' : isMaster ? '#7c4dff' : isProduction ? '#ff1744' : isWslHost && isOnline ? '#00bcd4' : isOnline ? '#00e676' : inst.status === 'offline' ? '#ff4081' : '#ff9100'

  return (
    <div className="fleet-card" style={{ '--border-color': borderColor }}>
      <div className="fc-header">
        <div className="fc-title-row">
          <div className="fc-title-left">
            {isMaster && <Crown size={13} className="fc-master-icon" />}
            <span className="fc-name">{inst.name || inst.id}</span>
            {isMaster && <span className="fc-master-tag">主控</span>}
            {isProduction && <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'10px',background:'rgba(255,23,68,0.12)',color:'#ff1744',border:'1px solid rgba(255,23,68,0.3)',marginLeft:'4px'}}>🔴 生产</span>}
            {isLocked && <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'10px',background:'#2a1a0a',color:'#ff9100',border:'1px solid #ff9100',marginLeft:'4px'}}>🔒</span>}
          </div>
          <StatusBadge status={inst.status} />
        </div>

        {!editing ? (
          <div className="fc-actions">
            <button className="fc-btn sm" title="复制 Token" onClick={() => { navigator.clipboard.writeText(inst.gateway_token || ''); toast('Token 已复制') }}>
              <Copy size={13}/> Token
            </button>
            <a className="fc-btn sm" href={`http://localhost:${inst.port}/#token=${encodeURIComponent(inst.gateway_token || '')}`} target="_blank" rel="noreferrer">
              <ExternalLink size={13}/> 控制台
            </a>
            {isWslHost && !isMaster && !isModeration && (
              <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'10px',background:'rgba(0,188,212,0.1)',color:'#00bcd4',border:'1px solid rgba(0,188,212,0.2)',marginRight:'2px'}}>🖥️ 宿主机</span>
            )}
            {isModeration && (
              <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'10px',background:'rgba(255,111,0,0.1)',color:'#ff6f00',border:'1px solid rgba(255,111,0,0.2)',marginRight:'2px'}}>🔍 审查员</span>
            )}
            <button className={`fc-btn sm ${isLocked ? 'warning' : ''}`} onClick={handleLockToggle} disabled={locking} title={isLocked ? `已锁定 ${inst.id}，点击解锁` : `锁定 ${inst.id}`}>
              {locking ? '...' : isLocked ? <Unlock size={13}/> : <Lock size={13}/>}
            </button>
            {!isMaster && !isModeration && (
              <>
                <button className="fc-btn sm" onClick={() => setEditing(true)}><Edit2 size={13}/></button>
                {isOnline ? (
                  <>
                    <button className="fc-btn sm danger" onClick={() => rpc('restart', '重启')}><RotateCcw size={13}/></button>
                    <button className="fc-btn sm danger" onClick={() => rpc('stop', '停止')}><Square size={13}/></button>
                  </>
                ) : (
                  <button className="fc-btn sm success" onClick={() => rpc('start', '启动')}><Play size={13}/></button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="fc-edit-form">
            <input className="fc-edit-input" value={name} onChange={e => setName(e.target.value)} placeholder="实例名称" />
            <input className="fc-edit-input" value={direction} onChange={e => setDirection(e.target.value)} placeholder="主要方向" />
            <div className="fc-edit-btns">
              <button className="fc-btn primary sm" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
              <button className="fc-btn sm" onClick={() => { setEditing(false); setName(String(inst.name || inst.id || '')); setDirection(String(inst.direction || '')) }}>取消</button>
            </div>
          </div>
        )}
      </div>

      {!editing && (
        <div className="fc-body">
          <div className="fc-info-grid">
            {isProduction ? (
              <>
                <div className="fc-info-item">
                  <span className="fc-info-label"><Server size={11}/> 公网IP</span>
                  <span className="fc-info-value">{inst.host || '—'}</span>
                </div>
                <div className="fc-info-item">
                  <span className="fc-info-label"><Activity size={11}/> 类型</span>
                  <span className="fc-info-value">SSH 云服务器</span>
                </div>
                <div className="fc-info-item">
                  <span className="fc-info-label"><Server size={11}/> 实例ID</span>
                  <span className="fc-info-value fc-id">{inst.instance_id || inst.id}</span>
                </div>
              </>
            ) : (
              <>
                <div className="fc-info-item">
                  <span className="fc-info-label"><Activity size={11}/> 端口</span>
                  <span className="fc-info-value">{inst.port}</span>
                </div>
                <div className="fc-info-item">
                  <span className="fc-info-label"><Cpu size={11}/> 方向</span>
                  <span className="fc-info-value">{inst.direction || '—'}</span>
                </div>
                <div className="fc-info-item">
                  <span className="fc-info-label"><Server size={11}/> 实例ID</span>
                  <span className="fc-info-value fc-id">{inst.id}</span>
                </div>
              </>
            )}
          </div>
          <div className="fc-feishu-row">
            <span className="fc-info-label">飞书</span>
            <FeishuBadge inst={inst} />
          </div>
          {inst.model_info && (
            <div className="fc-model-row">
              <span className="fc-info-label"><Zap size={11}/> 主模型</span>
              <div className="fc-model-chain">
                <span className="fc-model-primary"><Crown size={10}/> {inst.model_info.primaryLabel}</span>
                {inst.model_info.chainLabels && inst.model_info.chainLabels.length > 1 && (
                  <span className="fc-model-fallbacks">→ {inst.model_info.chainLabels.slice(1).join(' → ')}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 主组件 ──────────────────────────────────────────────────────
export default function FleetCluster() {
  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchKw, setSearchKw] = useState('')

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch('/api/fleet/instances')
      if (!res.ok) return
      const data = await res.json()
      setInstances(data.instances || [])
    } catch { toast('获取实例列表失败') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchInstances() }, [fetchInstances])

  const onlineCount = instances.filter(i => i.status === 'online').length

  const filtered = instances.filter(inst => {
    if (statusFilter === 'online' && inst.status !== 'online') return false
    if (statusFilter === 'offline' && inst.status !== 'offline') return false
    if (searchKw.trim()) {
      const kw = searchKw.toLowerCase()
      if (!(inst.name || '').toLowerCase().includes(kw) &&
          !(inst.id || '').toLowerCase().includes(kw) &&
          !(inst.direction || '').toLowerCase().includes(kw)) return false
    }
    return true
  })

  // ── 实例分组 ───────────────────────────────────────────────
  const externalInsts = instances.filter(i =>
    i.is_master || !i.container
  )
  const dockerInsts = instances.filter(i =>
    i.container != null
  )

  const extOnline = externalInsts.filter(i => i.status === 'online').length
  const dockerOnline = dockerInsts.filter(i => i.status === 'online').length

  // ── 过滤函数（单组） ────────────────────────────────────────
  const filterInsts = (list) => list.filter(inst => {
    if (statusFilter === 'online' && inst.status !== 'online') return false
    if (statusFilter === 'offline' && inst.status !== 'offline') return false
    if (searchKw.trim()) {
      const kw = searchKw.toLowerCase()
      if (!(inst.name || '').toLowerCase().includes(kw) &&
          !(inst.id || '').toLowerCase().includes(kw) &&
          !(inst.direction || '').toLowerCase().includes(kw)) return false
    }
    return true
  })

  const extFiltered = filterInsts(externalInsts)
  const dockerFiltered = filterInsts(dockerInsts)

  const renderSection = (title, icon, insts, filtered, onlineCount, allCount, tag) => (
    <div style={{ marginBottom: 28 }}>
      <div className="section-header fleet-header">
        <div className="fleet-header-left">
          <span className="section-title">{icon} {title}</span>
          <div className="fleet-pills">
            <span className="fleet-pill online"><span className="pill-dot"/>{onlineCount} 在线</span>
            <span className="fleet-pill offline"><span className="pill-dot"/>{allCount - onlineCount} 离线</span>
          </div>
        </div>
        <button className="fc-btn" onClick={fetchInstances} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''}/> 刷新
        </button>
      </div>

      {filtered.length > 0 ? (
        <div className="fleet-grid">
          {filtered.map(inst => (
            <InstanceCard key={inst.id} inst={inst}
              onSave={u => setInstances(prev => prev.map(i => i.id === u.id ? { ...i, ...u } : i))}
              onRefresh={fetchInstances} />
          ))}
        </div>
      ) : (
        <div className="fleet-empty">
          {searchKw || statusFilter !== 'all' ? '没有匹配的实例' : '暂无实例'}
        </div>
      )}
    </div>
  )

  return (
    <div className="section fleet-cluster">

      {/* ── 共享筛选栏（两区共用） ── */}
      <div className="fleet-filter-bar">
        <div className="fleet-filter-pills">
          {[
            { key: 'all',    label: `全部 (${instances.length})` },
            { key: 'online',  label: `在线 (${onlineCount})` },
            { key: 'offline', label: `离线 (${instances.length - onlineCount})` },
          ].map(f => (
            <button key={f.key} className={`fleet-filter-pill ${statusFilter === f.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.key)}>{f.label}</button>
          ))}
        </div>
        <div className="fleet-search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="搜索名称、ID、方向..."
            value={searchKw} onChange={e => setSearchKw(e.target.value)} />
          {searchKw && <button className="fleet-search-clear" onClick={() => setSearchKw('')}>✕</button>}
        </div>
      </div>

      {/* ── 外部实例（主控台、审查员、训练员、SSH 云服务器） ── */}
      {renderSection('外部实例', '🖥️', externalInsts, extFiltered, extOnline, externalInsts.length, 'external')}

      {/* ── Docker 实例集群 ── */}
      <div className="fleet-tip" style={{ marginBottom: 12 }}>
        <Server size={12}/> Docker 运行，各实例记忆/技能独立；主控通过 fleet_list/status/send 工具统一调度。
      </div>
      {renderSection('Docker 实例集群', '🐳', dockerInsts, dockerFiltered, dockerOnline, dockerInsts.length, 'docker')}
      {loading && <div className="fleet-loading">加载中...</div>}
    </div>
  )
}
