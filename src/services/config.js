// 服务配置 - 统一数据源
// 所有服务定义在这里，NavSidebar/DataCenter/KnowledgeCenter 共用

export const SERVICES_CONFIG = [
  { 
    name: 'OpenClaw Gateway', 
    port: 18789, 
    icon: '🌐', 
    checkHost: 'localhost',  // 只监听了localhost，只能从localhost检查
    description: '主控台'
  },
  { 
    name: 'ClawBot Vite', 
    port: 5174, 
    icon: '⚛️', 
    checkHost: 'localhost',
    description: '管理界面'
  },
  { 
    name: '金蝶前端', 
    port: 5173, 
    icon: '🎨', 
    checkHost: 'localhost',
    description: 'Vite+React'
  },
  { 
    name: '金蝶后端', 
    port: 8765, 
    icon: '🖥️', 
    checkHost: 'localhost',
    description: 'Express API'
  },
  { 
    name: '知识中心API', 
    port: 3001, 
    icon: '🔧', 
    checkHost: 'localhost',
    description: '状态查询API'
  },
  {
    name: 'Hermes Bus',
    port: 18766,
    icon: '🤝',
    checkHost: 'localhost',
    description: 'Hermes消息总线'
  },
  {
    name: 'Hermes Studio',
    port: 8648,
    icon: '🧭',
    checkHost: 'localhost',
    description: 'Hermes可视化界面'
  },
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
    const resp = await fetch(`${API_BASE}/api/status`)
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
