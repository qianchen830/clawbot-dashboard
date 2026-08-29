// 服务配置 - 统一数据源
// 所有服务定义在这里，NavSidebar/DataCenter/KnowledgeCenter 共用

// 系统服务配置（全部 20 项）
export const SERVICES_CONFIG = [
  // ── 系统基础服务 ──
  { name: 'OpenClaw Gateway',  port: 18789, icon: '🌐', description: 'systemd openclaw-gateway.service' },
  { name: 'ClawBot API',        port: 3001,  icon: '🔧', description: 'API Server' },
  { name: 'ClawBot 前端',       port: 5174,  icon: '🖥️', description: 'Vite Preview' },
  // ── 金蝶交付系统 ──
  { name: '金蝶前端',            port: 5173,  icon: '🏢', description: 'systemd kingdee-web.service' },
  { name: '金蝶后端API',         port: 8766,  icon: '⚙️', description: 'systemd kingdee-api.service' },
  { name: '金蝶WS通知',          port: 8767,  icon: '📡', description: 'systemd kingdee-ws-notify.service' },
  { name: '金蝶任务队列',        port: 8768,  icon: '📋', description: '金蝶任务处理' },
  // ── Hermes 组件 ──
  { name: 'Hermes Bus',         port: 18766, icon: '🤝', description: 'Hermes消息总线' },
  { name: 'Hermes Studio',      port: 8648,  icon: '🎨', description: 'EKKO WebUI' },
  { name: 'Hermes Bridge',      port: 3002,  icon: '🌉', description: 'OpenClaw-Hermes Bridge' },
  // ── 代理/Embedding ──
  { name: 'Volcano Embedding',  port: 3011,  icon: '🔌', description: 'Embedding API 代理' },
  // ── 外部系统 ──
  { name: '售前管理',            port: 3210,  icon: '📊', description: 'Express + SQLite（前后端共用3210）' },
  { name: 'CapCut Mate',        port: 30001, icon: '✂️', description: 'WSL Python 服务' },
  // ── Docker 实例集群 ──
  { name: '短视频助手',           port: 18809, icon: '🎬', description: 'Host shortvideo' },
  { name: '金蝶交付助手',         port: 18829, icon: '🏢', description: 'Host kingdee' },
  { name: '3D打印助手',          port: 18849, icon: '🖨️', description: 'Host print3d' },
  { name: 'AI游戏助手',           port: 18869, icon: '🎮', description: 'Host ai-game' },
  { name: '网页开发助手',         port: 18889, icon: '💻', description: 'Host webdev' },
  { name: '审查员实例',           port: 18909, icon: '🔍', description: 'Host moderation' },
]

// 检查单个服务状态（带重试，更稳定）
export function checkServiceStatus(port, checkHost) {
  const url = `http://${checkHost}:${port}/`
  
  return fetch(url, { 
    method: 'HEAD',
    signal: AbortSignal.timeout(3000)
  })
  .then(() => true)
  .catch(() => false)
}

// 从服务器获取服务状态（通过api-server做服务器端检查，绕过浏览器跨域和localhost限制）
export async function checkAllServices() {
  try {
    const resp = await fetch(`${API_BASE}/api/service-status`)
    if (!resp.ok) throw new Error('API失败')
    return await resp.json()
  } catch (e) {
    // API失败时返回离线状态
    return SERVICES_CONFIG.map(svc => ({ ...svc, online: false }))
  }
}

// 学习主题配置
export const LEARNING_TOPICS = [
  { key: 'ai', label: 'AI人工智能', icon: '🤖', schedule: '11:00', color: '#00e5ff' },
  { key: 'psychology', label: '心理学', icon: '🧠', schedule: '12:00', color: '#ff4081' },
  { key: 'accounting', label: '会计', icon: '📚', schedule: '14:00', color: '#ff9100' },
  { key: 'fde', label: 'FDE前线部署', icon: '🚀', schedule: '19:00', color: '#00e676' },
  { key: 'history', label: '中国历史', icon: '📜', schedule: '17:00', color: '#7c4dff' },
]

// Cron任务配置（从 gateway 实时同步，保持与 openclaw cron list 一致）
export const CRON_JOBS = [
  { name: '🏭 金蝶任务队列处理器', schedule: '每1小时', jobId: '72a4812e-064a-4699-9476-5ff68eacec7e' },
  { name: '🔧 服务守护', schedule: '每1小时', jobId: '3423464c-de31-4c49-92a3-291b52c9e24d' },
  { name: '🤖 AI人工智能', schedule: '11:00', jobId: 'a03b64db-a205-448e-800b-308e95483840', topic: 'ai' },
  { name: '🧠 心理学', schedule: '12:00', jobId: '1183a5ee-cfac-4371-90a4-511539d010a9', topic: 'psychology' },
  { name: '📚 会计', schedule: '14:00', jobId: '75bfacf3-8fb1-49e7-898d-c7a990cfe2a0', topic: 'accounting' },
  { name: '📜 中国历史', schedule: '17:00', jobId: 'c80db379-6976-4482-9bc4-2d74b8832bf8', topic: 'history' },
  { name: '🚀 FDE前线部署', schedule: '19:00', jobId: '07d935e3-f595-4e9b-a0d9-754f24ab8dff', topic: 'fde' },
  { name: '🌙 每日进化报告', schedule: '22:00', jobId: '46a756cd-aced-4c2b-8caf-1fc506ee1b42' },

  { name: '🧹 Subagent每周清理', schedule: '每周日03:00', jobId: '0584d42e-a1a3-45a5-befd-790f3645fb3d' },

]

// API地址
export const API_BASE = ''

// 获取学习推送状态
export async function fetchLearningStatus() {
  try {
    const resp = await fetch(`${API_BASE}/api/learning/status`)
    if (!resp.ok) throw new Error('API失败')
    return await resp.json()
  } catch (e) {
    return {}
  }
}

// 触发学习推送
export async function triggerLearning(topic) {
  const jobId = CRON_JOBS.find(c => c.topic === topic)?.jobId
  if (!jobId) throw new Error('未知主题')
  
  const resp = await fetch(`${API_BASE}/api/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  })
  return await resp.json()
}

// 获取学习记录历史
export async function fetchLearningHistory(limit = 1000) {
  try {
    const resp = await fetch(`${API_BASE}/api/learning/recent?limit=${limit}`)
    if (!resp.ok) throw new Error('API失败')
    return await resp.json()
  } catch (e) {
    return []
  }
}

// 按分类获取学习记录
export async function fetchLearningByCategory(category, limit = 1000) {
  try {
    const resp = await fetch(`${API_BASE}/api/learning/category/${category}?limit=${limit}`)
    if (!resp.ok) throw new Error('API失败')
    return await resp.json()
  } catch (e) {
    return []
  }
}

// 获取学习记录详情
export async function fetchLearningDetail(id) {
  try {
    const resp = await fetch(`${API_BASE}/api/learning/detail/${id}`)
    if (!resp.ok) throw new Error('API失败')
    return await resp.json()
  } catch (e) {
    return null
  }
}

// 获取定时任务列表
export async function fetchCronJobs() {
  try {
    const resp = await fetch(`${API_BASE}/api/cron-jobs`)
    if (!resp.ok) throw new Error('API失败')
    return await resp.json()
  } catch (e) {
    return []
  }
}

// 搜索学习记录
export async function searchLearning(keyword, limit = 20) {
  try {
    const resp = await fetch(`${API_BASE}/api/learning/search/${encodeURIComponent(keyword)}?limit=${limit}`)
    if (!resp.ok) throw new Error('API失败')
    return await resp.json()
  } catch (e) {
    return []
  }
}
