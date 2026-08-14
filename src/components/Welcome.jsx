import './Welcome.css'
import { Zap } from 'lucide-react'

export default function Welcome() {
  return (
    <div className="welcome">
      <h2>
        <Zap size={22} color="#00d4ff" style={{ marginRight: 8, verticalAlign: 'middle' }} />
        欢迎回来，老板
      </h2>
      <p>AI成长型助手 · OpenClaw Framework v3.0 · 第86阶段 · 累计192小时</p>
    </div>
  )
}
