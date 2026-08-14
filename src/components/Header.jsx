import './Header.css'
import { Bot, Settings } from 'lucide-react'

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo"><Bot size={28} color="#00d4ff" /></div>
        <span className="header-title">ClawBot</span>
      </div>
      <div className="header-right">
        <div className="status-badge">
          <span className="status-dot"></span>
          <span>在线</span>
        </div>
        <button className="header-btn" onClick={() => window.open('http://localhost:18789/', '_blank')}>
          <Settings size={14} />
          控制台
        </button>
      </div>
    </header>
  )
}
