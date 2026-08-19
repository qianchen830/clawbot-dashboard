import { useState, useEffect, useCallback } from 'react'
import {
  Folder, Globe, Server, GitBranch, GitCommit, RefreshCw,
  ExternalLink, Copy, RotateCcw, CheckCircle, XCircle, Loader, Settings, X,
  Play, Square, Zap
} from 'lucide-react'
import './ProjectHub.css'

// ── 项目注册表 ──────────────────────────────────────────────────
// autoStart: 是否开机自启；startCmd/stopCmd: 通过 /api/exec 执行
const PROJECTS = [
  {
    id: 'clawbot',
    name: 'ClawBot 管理台',
    description: 'OpenClaw AI 助手管理平台，含项目管理、知识中心、Git 管理、Fleet 集群监控',
    port: 5174,
    localUrl: 'http://localhost:5174',
    gitPath: '/home/openclaw/.openclaw/workspace/clawbot-dashboard',
    branch: 'master',
    tunnelPort: 5174,
    tunnelUrl: 'https://cheaper-reader-utilities-hub.trycloudflare.com',
    autoStart: true,
    startCmd: 'cd /home/openclaw/.openclaw/workspace/clawbot-dashboard && nohup npx vite preview --port 5174 --host 0.0.0.0 > /tmp/vite-5174.log 2>&1 &',
    stopPorts: [5174],
  },
  {
    id: 'kingdee',
    name: '金蝶交付系统',
    description: '金蝶二次开发项目的任务管理、周报生成、工时统计系统',
    port: 5173,
    localUrl: 'http://localhost:5173',
    gitPath: '/mnt/d/kingdee-web',
    branch: 'master',
    tunnelPort: 5173,
    tunnelUrl: 'https://kelkoo-accessed-patent-vessel.trycloudflare.com',
    autoStart: true,
    startCmd: 'systemctl --user start kingdee-web.service',
    stopCmd: 'systemctl --user stop kingdee-web.service',
  },
  {
    id: 'rent-reminder',
    name: '收租提醒 APP',
    description: '租房/售房提醒的移动端应用（Vite + React + Capacitor）',
    port: 3003,
    localUrl: 'http://localhost:3003',
    gitPath: '/home/openclaw/.openclaw/workspace/rent-reminder-app',
    branch: 'master',
    tunnelPort: 3003,
    tunnelUrl: '',
    autoStart: false,
    startCmd: 'cd /home/openclaw/.openclaw/workspace/rent-reminder-app && nohup npx vite preview --port 3003 --host 0.0.0.0 > /tmp/rent-reminder.log 2>&1 &',
    stopPorts: [3003],
  },
  {
    id: 'presale',
    name: '售前管理网站',
    description: '售前阶段的项目信息管理、客户跟踪、方案报价（前后端共用3210）',
    port: 3210,
    localUrl: 'http://localhost:3210',
    gitPath: '/home/openclaw/.openclaw/workspace/webdev-projects/presale',
    branch: 'master',
    tunnelPort: 3210,
    tunnelUrl: 'https://probably-proportion-path-patterns.trycloudflare.com',
    autoStart: false,
    startCmd: 'cd /home/openclaw/.openclaw/workspace/webdev-projects/presale && nohup node server.js > /tmp/presale.log 2>&1 &',
    stopPorts: [3210],
  },
]

// ── 工具函数 ─────────────────────────────────────────────────────
function toast(msg) {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.style.transform = 'translateX(-50%) translateY(0)'
  setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(100px)' }, 3000)
}

function getColor(name) {
  const colors = ['#00e5ff', '#ff4d6a', '#00e676', '#f59e0b', '#a78bfa', '#fb923c']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return colors[Math.abs(h) % colors.length]
}

// ── 组件 ─────────────────────────────────────────────────────────
export default function ProjectHub() {
  const [selected, setSelected] = useState(PROJECTS[0].id)
  const [search, setSearch] = useState('')
  const [commits, setCommits] = useState([])
  const [commitLoading, setCommitLoading] = useState(false)
  const [tunnelStatus, setTunnelStatus] = useState({})
  const [tunnelUrls, setTunnelUrls] = useState(() => {
    try { return JSON.parse(localStorage.getItem('proj-tunnelUrls') || '{}') } catch { return {} }
  })
  // Tunnel URLs 持久化到 localStorage
  useEffect(() => {
    localStorage.setItem('proj-tunnelUrls', JSON.stringify(tunnelUrls))
  }, [tunnelUrls])

  const [checkingAll, setCheckingAll] = useState(false)
  // 服务状态：{ projectId: 'online'|'offline'|'checking'|'starting'|'stopping' }
  const [svcStatus, setSvcStatus] = useState({})
  // 自动启动配置（从 localStorage 读取）
  const [autoStartMap, setAutoStartMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem('proj-autoStart') || '{}') } catch { return {} }
  })
  const [startingAll, setStartingAll] = useState(false)

  // 设置 Tunnel 弹窗状态
  const [setTunnelModal, setSetTunnelModal] = useState(null) // projectId | null
  const [setTunnelPort, setSetTunnelPort] = useState('')
  const [setTunnelLoading, setSetTunnelLoading] = useState(false)

  const project = PROJECTS.find(p => p.id === selected)
  const filtered = PROJECTS.filter(p =>
    p.name.includes(search) || p.description.includes(search) || p.id.includes(search)
  )

  // ── 服务状态检测（走服务器端 API，避免浏览器 CORS/localhost 限制） ──
  const checkSvc = useCallback(async (proj) => {
    setSvcStatus(prev => ({ ...prev, [proj.id]: 'checking' }))
    try {
      const res = await fetch(`/api/port-check/${proj.port}`, { signal: AbortSignal.timeout(4000) })
      const data = await res.json()
      setSvcStatus(prev => ({ ...prev, [proj.id]: data.online ? 'online' : 'offline' }))
    } catch {
      setSvcStatus(prev => ({ ...prev, [proj.id]: 'offline' }))
    }
  }, [])

  // 首次加载：检测所有服务状态
  useEffect(() => {
    PROJECTS.forEach(p => checkSvc(p))
    const interval = setInterval(() => PROJECTS.forEach(p => checkSvc(p)), 30000)
    return () => clearInterval(interval)
  }, [checkSvc])

  // ── 启动/停止服务 ──────────────────────────────────────────────
  const handleSvc = useCallback(async (proj, action) => {
    if (action === 'stop') {
      // 优先使用 stopPorts（安全，不自杀）
      if (proj.stopPorts?.length) {
        setSvcStatus(prev => ({ ...prev, [proj.id]: 'stopping' }))
        try {
          const res = await fetch('/api/service/kill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ports: proj.stopPorts }),
          })
          const data = await res.json()
          if (data.error) { toast(data.error); checkSvc(proj); return }
          toast(`服务停止中...（已终止 ${data.killed?.length || 0} 个端口）`)
          setTimeout(() => checkSvc(proj), 2000)
        } catch (e) { toast(`操作失败: ${e.message}`); checkSvc(proj) }
        return
      }
      if (!proj.stopCmd) { toast('该项目未配置停止命令'); return }
    } else {
      if (!proj.startCmd) { toast('该项目未配置启动命令'); return }
    }
    const cmd = action === 'start' ? proj.startCmd : proj.stopCmd
    setSvcStatus(prev => ({ ...prev, [proj.id]: action === 'start' ? 'starting' : 'stopping' }))
    try {
      const res = await fetch('/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd }),
      })
      const data = await res.json()
      if (data.error) { toast(data.error); checkSvc(proj); return }
      toast(`服务 ${action === 'start' ? '启动' : '停止'} 中...`)
      setTimeout(() => checkSvc(proj), 2500)
    } catch (e) { toast(`操作失败: ${e.message}`); checkSvc(proj) }
  }, [checkSvc])

  // ── 切换自动启动 ──────────────────────────────────────────────
  const toggleAutoStart = useCallback((projId) => {
    setAutoStartMap(prev => {
      const next = { ...prev, [projId]: !prev[projId] }
      localStorage.setItem('proj-autoStart', JSON.stringify(next))
      return next
    })
  }, [])

  // ── 一键启动所有离线服务 ───────────────────────────────────────
  const startAllOffline = useCallback(async () => {
    setStartingAll(true)
    const offline = PROJECTS.filter(p => svcStatus[p.id] === 'offline' && p.startCmd)
    for (const p of offline) {
      await new Promise(res => setTimeout(res, 500))
      handleSvc(p, 'start')
    }
    setStartingAll(false)
  }, [svcStatus, handleSvc])

  // ── Git: 加载提交历史 ──────────────────────────────────────────
  const loadCommits = useCallback(async (gitPath, branch) => {
    if (!gitPath) return
    setCommitLoading(true)
    try {
      const res = await fetch('/api/git/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: gitPath, branch }),
      })
      const data = await res.json()
      if (data.commits) setCommits(data.commits)
      else setCommits([])
    } catch { setCommits([]) }
    setCommitLoading(false)
  }, [])

  useEffect(() => {
    if (project) loadCommits(project.gitPath, project.branch)
  }, [project, loadCommits])

  // ── Tunnel: 检测状态 ───────────────────────────────────────────
  const checkTunnel = useCallback(async (proj) => {
    if (!proj.tunnelPort && !proj.tunnelUrl && !tunnelUrls[proj.id]) return
    setTunnelStatus(prev => ({ ...prev, [proj.id]: 'checking' }))
    const targetUrl = tunnelUrls[proj.id] || proj.tunnelUrl || `http://localhost:${proj.tunnelPort}`
    try {
      const res = await fetch(targetUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      setTunnelStatus(prev => ({ ...prev, [proj.id]: res.ok ? 'ok' : 'fail' }))
    } catch {
      setTunnelStatus(prev => ({ ...prev, [proj.id]: 'fail' }))
    }
  }, [tunnelUrls])

  // ── 刷新 tunnel URL ────────────────────────────────────────────
  const refreshTunnelUrl = useCallback(async (proj) => {
    if (!proj.tunnelPort) return
    try {
      const res = await fetch(`/api/tunnel/${proj.tunnelPort}`)
      const data = await res.json()
      if (data.url) {
        setTunnelUrls(prev => ({ ...prev, [proj.id]: data.url }))
        setTunnelStatus(prev => ({ ...prev, [proj.id]: 'ok' }))
        toast(`已刷新: ${data.url}`)
      } else {
        toast(`端口 ${proj.tunnelPort} 暂无活跃的 Cloudflare Tunnel`)
        setTunnelUrls(prev => { const n = { ...prev }; delete n[proj.id]; return n })
        setTunnelStatus(prev => { const n = { ...prev }; delete n[proj.id]; return n })
      }
    } catch { toast('刷新 tunnel URL 失败') }
  }, [])

  // ── 启动/停止 tunnel ──────────────────────────────────────────
  const toggleTunnel = useCallback(async (proj, action) => {
    try {
      if (action === 'stop') {
        const res = await fetch('/api/tunnel/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ port: proj.tunnelPort }),
        })
        const data = await res.json()
        if (data.error) { toast(data.error); return }
        toast(data.killed > 0 ? `Tunnel 已停止（${data.killed} 个进程）` : 'Tunnel 未在运行')
        setTunnelUrls(prev => { const n = { ...prev }; delete n[proj.id]; return n })
        setTunnelStatus(prev => { const n = { ...prev }; delete n[proj.id]; return n })
      } else {
        const res = await fetch('/api/tunnel/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ port: proj.tunnelPort }),
        })
        const data = await res.json()
        if (data.error) { toast(data.error); return }
        toast(`Tunnel 启动中，端口 :${proj.tunnelPort}...`)
        setTimeout(() => refreshTunnelUrl(proj), 5000)
      }
    } catch (e) { toast(`操作失败: ${e.message}`) }
  }, [refreshTunnelUrl])

  // ── 设置 Tunnel（弹窗） ───────────────────────────────────────
  const openSetTunnel = useCallback((proj) => {
    setSetTunnelPort(String(proj.tunnelPort || proj.port || ''))
    setSetTunnelModal(proj.id)
  }, [])

  const confirmSetTunnel = useCallback(async () => {
    const port = parseInt(setTunnelPort)
    if (!port || port < 1 || port > 65535) { toast('请输入有效的端口号（1-65535）'); return }
    const modalProj = PROJECTS.find(p => p.id === setTunnelModal)
    if (!modalProj) return
    setSetTunnelLoading(true)
    try {
      const res = await fetch('/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cmd: `setsid ~/.openclaw/cloudflared_bin tunnel --url http://localhost:${port} > ~/.openclaw/cf.log 2>&1 < /dev/null &`,
        }),
      })
      const data = await res.json()
      if (data.error) { toast(data.error); setSetTunnelLoading(false); return }
      toast(`Tunnel 启动中，端口 :${port}...`)
      setSetTunnelModal(null)
      setTimeout(async () => {
        try {
          const r = await fetch('/api/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cmd: `ps aux | grep "cloudflared_bin tunnel" | grep -v grep | grep "-url http://localhost:${port}" | head -1`,
            }),
          })
          const out = ((await r.json()).stdout || (await r.json()).output || '')
          const match = out.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com\//)
          if (match) {
            setTunnelUrls(prev => ({ ...prev, [modalProj.id]: match[0].replace(/\/$/, '') }))
            setTunnelStatus(prev => ({ ...prev, [modalProj.id]: 'ok' }))
            toast(`Tunnel 已就绪: ${match[0].replace(/\/$/, '')}`)
          }
        } catch { /* 忽略，refreshTunnelUrl 会兜底 */ }
      }, 4000)
    } catch (e) { toast(`启动失败: ${e.message}`) }
    setSetTunnelLoading(false)
  }, [setTunnelPort, setTunnelModal])

  // ── 一键检测所有 tunnel ───────────────────────────────────────
  const checkAllTunnels = useCallback(async () => {
    setCheckingAll(true)
    const withTunnel = PROJECTS.filter(p => p.tunnelPort || p.tunnelUrl || tunnelUrls[p.id])
    for (const p of withTunnel) {
      await checkTunnel(p)
      await new Promise(r => setTimeout(r, 300))
    }
    setCheckingAll(false)
  }, [checkTunnel, tunnelUrls])

  // ── Git 回滚 ──────────────────────────────────────────────────
  const handleRollback = useCallback(async (hash) => {
    if (!project) return
    if (!confirm(`确定要回滚到提交 ${hash.slice(0, 7)} 吗？`)) return
    try {
      const res = await fetch('/api/git/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: project.gitPath, hash }),
      })
      const data = await res.json()
      if (data.success) {
        toast(`已回滚到 ${hash.slice(0, 7)}`)
        loadCommits(project.gitPath, project.branch)
      } else {
        toast(data.error || '回滚失败')
      }
    } catch (e) { toast(`回滚失败: ${e.message}`) }
  }, [project, loadCommits])

  // ── 复制 URL ──────────────────────────────────────────────────
  const copyUrl = useCallback((url) => {
    if (!url) return
    navigator.clipboard.writeText(url).then(() => toast('已复制 URL')).catch(() => toast('复制失败'))
  }, [])

  const hasOffline = PROJECTS.some(p => svcStatus[p.id] === 'offline' && p.startCmd)
  const allOnline = PROJECTS.every(p => svcStatus[p.id] === 'online' || !p.startCmd)

  const proj = project
  const tunnelUrl = tunnelUrls[proj?.id] || proj?.tunnelUrl
  const status = tunnelStatus[proj?.id]
  const modalProj = PROJECTS.find(p => p.id === setTunnelModal)

  return (
    <div className="ph-container">
      {/* Header */}
      <div className="ph-header">
        <div className="ph-header-left">
          <h2 className="ph-title">项目中心</h2>
          <span className="ph-pill"><span className="pill-dot" />{PROJECTS.length} 个项目</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {!allOnline && (
            <button className="fc-btn sm success" onClick={startAllOffline} disabled={startingAll}>
              {startingAll ? <Loader size={12} className="spin" /> : <Play size={12} />}
              启动离线服务
            </button>
          )}
          <button className="fc-btn sm" onClick={() => PROJECTS.forEach(p => checkSvc(p))} title="刷新所有服务状态">
            <RefreshCw size={12} /> 状态
          </button>
          <button className="fc-btn primary sm" onClick={checkAllTunnels} disabled={checkingAll}>
            {checkingAll ? <Loader size={12} className="spin" /> : <Globe size={12} />}
            Tunnel
          </button>
        </div>
      </div>

      <div className="ph-split">
        {/* Left: Project List */}
        <div className="ph-sidebar">
          <div className="ph-sidebar-header">
            <span>项目列表</span>
            <span>{filtered.length}/{PROJECTS.length}</span>
          </div>
          <div className="ph-sidebar-search">
            <Folder size={13} />
            <input type="text" placeholder="搜索项目..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="project-list">
            {filtered.map(p => {
              const color = getColor(p.name)
              const st = svcStatus[p.id]
              const dotColor = st === 'online' ? '#00e676' : st === 'checking' || st === 'starting' || st === 'stopping' ? '#f59e0b' : '#ff4d6a'
              const pulse = st === 'online' ? 'pulse-green' : ''
              return (
                <div key={p.id} className={`project-item ${selected === p.id ? 'active' : ''}`} onClick={() => setSelected(p.id)}>
                  <span className="project-item-dot" style={{ background: color }} />
                  <div className="project-item-info">
                    <div className="project-item-name">{p.name}</div>
                    <div className="project-item-meta">
                      <span>:{p.port}</span>
                      <span
                        className={`ph-status-mini ${pulse}`}
                        style={{ background: dotColor, marginLeft: 6 }}
                        title={st === 'online' ? '运行中' : st === 'checking' ? '检测中' : st === 'starting' ? '启动中' : st === 'stopping' ? '停止中' : '已停止'}
                      />
                      {(p.tunnelPort || tunnelUrls[p.id]) && <span style={{ color: '#00e5ff' }}>🌐</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Info + Git */}
        <div className="ph-right">
          {/* ── Info Panel ── */}
          {proj ? (
            <div className="ph-info-panel">
              <div className="ph-info-header">
                <div className="ph-info-title">
                  <Folder size={14} color="#00e5ff" />
                  {proj.name}
                </div>
                <div className="ph-info-actions">
                  {/* 服务状态 + 启动控制 */}
                  {(proj.startCmd || proj.stopCmd) && (
                    <div style={{display:'flex',alignItems:'center',gap:6,marginRight:8}}>
                      <span style={{
                        width:8,height:8,borderRadius:'50%',
                        background: svcStatus[proj.id] === 'online' ? '#00e676'
                          : svcStatus[proj.id] === 'checking' ? '#f59e0b'
                          : svcStatus[proj.id] === 'starting' || svcStatus[proj.id] === 'stopping' ? '#f59e0b'
                          : '#ff4d6a',
                        boxShadow: svcStatus[proj.id] === 'online' ? '0 0 6px #00e676' : 'none',
                        display:'inline-block',
                        flexShrink:0,
                      }} />
                      {svcStatus[proj.id] === 'starting' || svcStatus[proj.id] === 'stopping' ? (
                        <Loader size={11} className="spin" style={{color:'#f59e0b'}} />
                      ) : null}
                      <span style={{fontSize:11,color: svcStatus[proj.id] === 'online' ? '#00e676' : '#ff4d6a'}}>
                        {svcStatus[proj.id] === 'online' ? '运行中' : '已停止'}
                      </span>
                      {svcStatus[proj.id] === 'online' ? (
                        <button className="fc-btn sm danger" style={{padding:'3px 8px',fontSize:11}}
                          onClick={() => handleSvc(proj, 'stop')} disabled={svcStatus[proj.id]==='stopping'}>
                          <Square size={10}/> 停止
                        </button>
                      ) : (
                        <button className="fc-btn sm success" style={{padding:'3px 8px',fontSize:11}}
                          onClick={() => handleSvc(proj, 'start')} disabled={svcStatus[proj.id]==='starting'}>
                          <Play size={10}/> 启动
                        </button>
                      )}
                      {/* 自动启动开关 */}
                      <button
                        title={autoStartMap[proj.id] ? '已开启自启，点此关闭' : '已关闭自启，点此开启'}
                        onClick={() => toggleAutoStart(proj.id)}
                        style={{
                          background:'none',border:'none',cursor:'pointer',padding:'2px 4px',
                          color: autoStartMap[proj.id] ? '#00e5ff' : '#444',
                          fontSize:12,borderRadius:4,transition:'all 0.15s',
                        }}
                      >
                        <Zap size={13}/>
                      </button>
                    </div>
                  )}
                  <button className="fc-btn sm" onClick={() => window.open(proj.localUrl, '_blank')}>
                    <ExternalLink size={12} /> 本地
                  </button>
                  {proj.tunnelPort ? (
                    <button className="fc-btn sm" onClick={() => refreshTunnelUrl(proj)}>
                      <RefreshCw size={12} /> Tunnel
                    </button>
                  ) : (
                    <button className="fc-btn sm primary" onClick={() => openSetTunnel(proj)}>
                      <Settings size={12} /> Tunnel
                    </button>
                  )}
                </div>
              </div>

              <div className="ph-info-body">
                <div className="ph-info-desc">{proj.description}</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="ph-info-row">
                    <span className="ph-info-label">本地端口</span>
                    <span className="ph-info-value"><Server size={11} style={{ marginRight: 4 }} />:{proj.port}</span>
                  </div>
                  <div className="ph-info-row">
                    <span className="ph-info-label">Git 路径</span>
                    <span className="ph-info-value" style={{ fontSize: 11, wordBreak: 'break-all' }}>{proj.gitPath}</span>
                  </div>
                  <div className="ph-info-row">
                    <span className="ph-info-label">Git 分支</span>
                    <span className="ph-info-value"><GitBranch size={11} style={{ marginRight: 4 }} />{proj.branch}</span>
                  </div>
                  <div className="ph-info-row">
                    <span className="ph-info-label">Tunnel 端口</span>
                    <span className="ph-info-value">
                      {proj.tunnelPort
                        ? <><Globe size={11} style={{ marginRight: 4 }} />:{proj.tunnelPort}</>
                        : tunnelUrls[proj.id]
                          ? <><Globe size={11} style={{ marginRight: 4 }} />动态端口</>
                          : <span style={{ color: '#555' }}>未配置</span>
                      }
                    </span>
                  </div>
                </div>

                {/* Tunnel URL — 有 tunnelPort 的项目 */}
                {proj.tunnelPort && (
                  <div className="ph-tunnel-url">
                    <Globe size={13} color="#00e5ff" style={{ flexShrink: 0 }} />
                    {tunnelUrl ? (
                      <>
                        <span>{tunnelUrl}</span>
                        <button className="fc-btn sm" onClick={() => copyUrl(tunnelUrl)}><Copy size={11} /></button>
                        <button className="fc-btn sm primary" onClick={() => window.open(tunnelUrl, '_blank')}><ExternalLink size={11} /></button>
                        <button className="fc-btn sm danger" onClick={() => toggleTunnel(proj, 'stop')}><X size={11} /></button>
                      </>
                    ) : (
                      <>
                        <span style={{ color: '#555', flex: 1 }}>无活跃 tunnel（可点击启动）</span>
                        <button className="fc-btn sm success" onClick={() => toggleTunnel(proj, 'start')}>▶ 启动</button>
                      </>
                    )}
                  </div>
                )}

                {/* Tunnel URL — 无 tunnelPort 但已设置过的项目 */}
                {!proj.tunnelPort && tunnelUrls[proj.id] && (
                  <div className="ph-tunnel-url">
                    <Globe size={13} color="#00e5ff" style={{ flexShrink: 0 }} />
                    <span>{tunnelUrls[proj.id]}</span>
                    <button className="fc-btn sm" onClick={() => copyUrl(tunnelUrls[proj.id])}><Copy size={11} /></button>
                    <button className="fc-btn sm primary" onClick={() => window.open(tunnelUrls[proj.id], '_blank')}><ExternalLink size={11} /></button>
                    <button className="fc-btn sm danger" onClick={() => { setTunnelUrls(prev => { const n = { ...prev }; delete n[proj.id]; return n }) }}><X size={11} /></button>
                  </div>
                )}

                {/* Tunnel 状态检测 */}
                {(proj.tunnelPort || tunnelUrls[proj.id]) && tunnelUrl && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="fc-btn sm" onClick={() => checkTunnel(proj)} disabled={status === 'checking'}>
                      {status === 'checking'
                        ? <><Loader size={11} className="spin" /> 检测中...</>
                        : status === 'ok'
                          ? <><CheckCircle size={11} color="#00e676" /> 有效</>
                          : status === 'fail'
                            ? <><XCircle size={11} color="#ff4d6a" /> 已失效</>
                            : <><Globe size={11} /> 检测状态</>
                      }
                    </button>
                    {status === 'ok' && <span className="ph-check-result ok">✅ 外网可访问</span>}
                    {status === 'fail' && <span className="ph-check-result fail">❌ 连接失败，请检查服务是否启动</span>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="ph-info-panel">
              <div className="ph-no-select"><Folder size={36} style={{ opacity: 0.3 }} /><div>请在左侧选择一个项目</div></div>
            </div>
          )}

          {/* ── Git History Panel ── */}
          <div className="ph-git-panel">
            <div className="ph-git-header">
              <div className="ph-git-title">
                <GitCommit size={13} />
                提交记录
                {proj && <span className="branch-tag">{proj.branch}</span>}
                {commits.length > 0 && <span style={{ fontSize: 11, color: '#555' }}>{commits.length} 条</span>}
              </div>
              <div className="ph-git-actions">
                {proj && (
                  <button className="fc-btn sm" onClick={() => loadCommits(proj.gitPath, proj.branch)} disabled={commitLoading}>
                    <RefreshCw size={12} className={commitLoading ? 'spin' : ''} /> 刷新
                  </button>
                )}
              </div>
            </div>

            {!proj ? (
              <div className="ph-no-select"><GitBranch size={36} style={{ opacity: 0.3 }} /><div>选择项目查看 Git 记录</div></div>
            ) : commitLoading ? (
              <div className="ph-loading"><span className="ph-spinner" />加载提交历史...</div>
            ) : commits.length === 0 ? (
              <div className="ph-empty">暂无提交记录</div>
            ) : (
              <div className="ph-commit-list">
                {commits.map((c, i) => (
                  <div key={c.hash} className={`ph-commit-item ${i === 0 ? 'current' : ''}`}>
                    <span className="ph-commit-hash">{c.hash.slice(0, 7)}</span>
                    <div className="ph-commit-info">
                      <div className="ph-commit-msg" title={c.message}>{c.message}</div>
                      <div className="ph-commit-meta"><span>{c.author}</span><span>{c.date}</span></div>
                    </div>
                    {i > 0 && (
                      <button className="fc-btn sm danger ph-rollback-btn" onClick={() => handleRollback(c.hash)} title={`回滚到 ${c.hash.slice(0, 7)}`}>
                        <RotateCcw size={11} /> 回滚
                      </button>
                    )}
                    {i === 0 && <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>当前</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 设置 Tunnel 弹窗 ── */}
      {setTunnelModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => !setTunnelLoading && setSetTunnelModal(null)}>
          <div style={{
            background: '#1e1e38', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14, padding: '28px 28px 22px', width: 420,
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Globe size={18} color="#00e5ff" />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#e8e8f0' }}>设置 Cloudflare Tunnel</span>
              </div>
              <button style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}
                onClick={() => !setTunnelLoading && setSetTunnelModal(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                项目：<span style={{ color: '#ccc' }}>{modalProj?.name}</span>
              </div>
              <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>本地服务端口</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="number"
                  value={setTunnelPort}
                  onChange={e => setSetTunnelPort(e.target.value)}
                  placeholder="例如 5174"
                  disabled={setTunnelLoading}
                  style={{
                    flex: 1, background: '#16162a', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '9px 12px', color: '#ccc', fontSize: 14, outline: 'none'
                  }}
                  onKeyDown={e => e.key === 'Enter' && !setTunnelLoading && confirmSetTunnel()}
                />
                <button
                  className="fc-btn primary"
                  onClick={confirmSetTunnel}
                  disabled={setTunnelLoading || !setTunnelPort}
                  style={{ padding: '9px 18px', fontSize: 13 }}
                >
                  {setTunnelLoading ? <><Loader size={13} className="spin" /> 启动中...</> : '▶ 启动'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
                将为 :{setTunnelPort || '?'} 启动 Cloudflare Tunnel，生成临时公网 URL
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#555', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
              💡 免费版 Tunnel 无固定域名，每次重启会生成新的 .trycloudflare.com 地址
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
