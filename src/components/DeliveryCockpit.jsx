import { useEffect, useState } from 'react'
import { ExternalLink, RefreshCw, Rocket, Server, ShieldCheck } from 'lucide-react'
import './DeliveryCockpit.css'

const getHost = () => window.location.hostname || 'localhost'
const KINGDEE_URL = () => `http://${getHost()}:5173/?tab=delivery`
const DELIVERY_API = () => `http://${getHost()}:8766/api/delivery/skill-status`

export default function DeliveryCockpit() {
  const [status, setStatus] = useState({ loading: true })
  const [iframeKey, setIframeKey] = useState(0)

  const loadStatus = async () => {
    setStatus(s => ({ ...s, loading: true }))
    try {
      const resp = await fetch(DELIVERY_API())
      const data = await resp.json()
      setStatus({ loading: false, ok: !!data.success, data })
    } catch (e) {
      setStatus({ loading: false, ok: false, error: e.message })
    }
  }

  useEffect(() => { loadStatus() }, [])

  const openKingdee = () => window.open(KINGDEE_URL(), '_blank', 'noopener,noreferrer')

  return (
    <div className="delivery-cockpit">
      <div className="dc-hero">
        <div>
          <div className="dc-kicker"><Rocket size={18} /> 金蝶自动化交付</div>
          <h1>交付驾驶舱</h1>
          <p>在 ClawBot 内直接使用金蝶交付系统：项目目录、交付物扫描、阶段门控、需求分类、产品功能检索、结果入库。</p>
        </div>
        <div className="dc-actions">
          <button onClick={loadStatus} className="dc-btn secondary">
            <RefreshCw size={16} className={status.loading ? 'spin' : ''} /> 刷新状态
          </button>
          <button onClick={() => setIframeKey(k => k + 1)} className="dc-btn secondary">
            <RefreshCw size={16} /> 刷新页面
          </button>
          <button onClick={openKingdee} className="dc-btn primary">
            <ExternalLink size={16} /> 新窗口打开
          </button>
        </div>
      </div>

      <div className="dc-status-grid">
        <div className="dc-status-card">
          <Server size={20} />
          <div>
            <span>金蝶后端 8766</span>
            <strong className={status.ok ? 'ok' : 'err'}>{status.loading ? '检测中...' : status.ok ? '在线' : '异常'}</strong>
          </div>
        </div>
        <div className="dc-status-card">
          <ShieldCheck size={20} />
          <div>
            <span>Skill Gateway</span>
            <strong className={status.data?.data?.gateway === 'online' ? 'ok' : 'warn'}>
              {status.data?.data?.gateway || (status.loading ? '检测中...' : '未知')}
            </strong>
          </div>
        </div>
        <div className="dc-status-card wide">
          <span>提示</span>
          <strong>如内嵌区域空白，请点击“新窗口打开”；实际交付驾驶舱在金蝶前端 5173。</strong>
        </div>
      </div>

      {!status.loading && !status.ok && (
        <div className="dc-alert">
          后端状态异常：{status.error || status.data?.error || '无法连接 /api/delivery/skill-status'}
        </div>
      )}

      <div className="dc-frame-wrap">
        <iframe
          key={iframeKey}
          className="dc-frame"
          src={KINGDEE_URL()}
          title="金蝶交付驾驶舱"
        />
      </div>
    </div>
  )
}
