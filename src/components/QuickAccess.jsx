import './QuickAccess.css'
import { BarChart2, BookOpen, TrendingUp, Settings } from 'lucide-react'

const items = [
  { icon: BarChart2, label: '金蝶自动化交付', href: 'http://localhost:5173/', external: true },
  { icon: BookOpen, label: '知识中心', view: 'knowledge' },
  { icon: TrendingUp, label: '数据中心', view: 'data' },
  { icon: Settings, label: '控制台', href: 'http://localhost:18789/', external: true },
]

export default function QuickAccess({ onNavigate }) {
  const handleClick = (item) => {
    if (item.external) {
      window.open(item.href, '_blank')
    } else if (item.view) {
      onNavigate?.(item.view)
    }
  }

  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">快速访问</span>
      </div>
      <div className="quick-access">
        {items.map(item => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="qa-item"
              onClick={() => handleClick(item)}
              style={{ cursor: 'pointer' }}
            >
              <div className="qa-icon"><Icon size={24} /></div>
              <div className="qa-label">{item.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
