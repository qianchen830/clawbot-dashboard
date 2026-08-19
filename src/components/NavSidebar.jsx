import { useState, useEffect } from 'react'
import { Home, BookOpen, BarChart2, RefreshCw, Wrench, Rocket, Server, GitBranch, Zap, Folder } from 'lucide-react'
import './NavSidebar.css'

const API_BASE = ''
const NAV_ITEMS = [
  { id: 'home', label: '首页', icon: Home, view: 'home' },
  { id: 'fleet', label: '实例集群', icon: Server, view: 'fleet' },
  { id: 'token', label: 'Token用量', icon: Zap, view: 'token' },
  { id: 'skills', label: '技能库', icon: Wrench, view: 'skills' },
  { id: 'knowledge', label: '知识中心', icon: BookOpen, view: 'knowledge' },
  { id: 'projects', label: '项目中心', icon: Folder, view: 'projects' },
  { id: 'git', label: 'Git管理', icon: GitBranch, view: 'git' },
  { id: 'data', label: '数据中心', icon: BarChart2, view: 'data' },
]
const DEFAULT_STATS = [
  { label: '学习阶段', value: '89' },
  { label: '累计时长', value: '278h' },
]
const TASKS = [
  { label: 'AI', value: '11:00' },
  { label: '心理', value: '12:00' },
  { label: '会计', value: '14:00' },
  { label: 'FDE', value: '19:00' },
  { label: '历史', value: '17:00' },
]

export default function NavSidebar({ currentView, onNavigate }) {
  const [services, setServices] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const onlineCount = services.filter(s => s.online === true).length
  const serviceTotal = services.length
  const stats = [
    { label: '运行服务', value: `${onlineCount}/${serviceTotal || '--'}` },
    ...DEFAULT_STATS,
  ]

  const loadServices = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/services`)
      if (resp.ok) {
        const data = await resp.json()
        setServices(data)
      }
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    loadServices()
    const interval = setInterval(loadServices, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside className="sidebar">
      <div className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <a
              key={item.id}
              className={`sidebar-nav-item ${currentView === item.view ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); onNavigate?.(item.view) }}
              href="#"
            >
              <span className="nav-icon"><Icon size={18} /></span>
              <span>{item.label}</span>
            </a>
          )
        })}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">数据统计</div>
        {stats.map(s => (
          <div key={s.label} className="sidebar-stat">
            <span className="sidebar-stat-label">{s.label}</span>
            <span className="sidebar-stat-value">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">
          服务状态
          <button className="mini-refresh" onClick={loadServices} title="刷新服务状态">
            <RefreshCw size={12} className={refreshing ? 'spinning' : ''} />
          </button>
        </div>
        {services.map(s => (
          <div key={s.name} className="sidebar-service">
            <span className={`s-dot ${s.online === true ? 'ok' : s.online === false ? 'err' : 'loading'}`}></span>
            <span className="service-name">{s.name}</span>
            {s.online === true && <span className="service-latency">✅</span>}
            {s.online === false && <span className="service-latency">❌</span>}
            {s.online === undefined && <span className="service-latency">...</span>}
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">定时任务</div>
        {TASKS.map(t => (
          <div key={t.label} className="sidebar-stat">
            <span className="sidebar-stat-label">{t.label}</span>
            <span className="sidebar-stat-value">{t.value}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
