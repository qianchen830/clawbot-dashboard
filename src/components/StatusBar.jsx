import './StatusBar.css'
import { Rocket, BookOpen, FileText, Wrench, Zap } from 'lucide-react'

const items = [
  { icon: Rocket, label: '学习阶段:', value: '86' },
  { icon: BookOpen, label: '累计学习:', value: '183小时' },
  { icon: FileText, label: '学习笔记:', value: '427+ 篇' },
  { icon: Wrench, label: 'Skills:', value: '99+ 个' },
  { icon: Zap, label: '定时:', value: 'heartbeat · daily-evolution' },
]

export default function StatusBar() {
  return (
    <div className="status-bar">
      {items.map(item => {
        const Icon = item.icon
        return (
          <div key={item.label} className="status-item">
            <Icon size={14} color="#00d4ff" />
            <strong>{item.label}</strong> {item.value}
          </div>
        )
      })}
    </div>
  )
}
