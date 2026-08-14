import './AIToolBox.css'
import { Brain, Clapperboard, Sparkles } from 'lucide-react'

const tools = [
  { icon: Brain, name: 'DeepSeek', desc: 'AI对话与剧本创作', href: 'https://chat.deepseek.com/' },
  { icon: Clapperboard, name: '可灵AI', desc: 'AI视频生成', href: 'https://klingai.kuaishou.com/' },
  { icon: Sparkles, name: 'Seedance', desc: '免费AI视频生成', href: 'https://www.seedance.ai/' },
]

export default function AIToolBox() {
  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">AI工具箱</span>
      </div>
      <div className="tool-row">
        {tools.map(tool => {
          const Icon = tool.icon
          return (
            <a key={tool.name} href={tool.href} target="_blank" rel="noopener noreferrer" className="tool-card">
              <div className="icon"><Icon size={20} /></div>
              <div>
                <div className="name">{tool.name}</div>
                <div className="desc">{tool.desc}</div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
