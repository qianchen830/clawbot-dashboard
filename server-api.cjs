const express = require('express')
const cors = require('cors')
const { spawn, execSync, spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

// 静态serve图文图片（article_images/ 对外暴露为 /images/）
const ARTICLE_IMG_DIR = '/home/openclaw/.openclaw/workspace/clawbot-dashboard/article_images'
app.get('/images/:filename', (req, res) => {
  const fpath = path.join(ARTICLE_IMG_DIR, req.params.filename)
  if (!fpath.startsWith(ARTICLE_IMG_DIR)) return res.status(403).send('Forbidden')
  if (!fs.existsSync(fpath)) return res.status(404).send('Not Found')
  res.setHeader('Content-Type', 'image/jpeg')
  fs.createReadStream(fpath).pipe(res)
})

// 前端 dist 静态文件（必须注册在所有 API 路由之前）
app.use(express.static(path.join(__dirname, 'dist')))

function execCmd(cmd) {
  return new Promise((resolve, reject) => {
    const trimmed = cmd.trim()
    // 后台命令（以 & 结尾）：detach + ignore stdio，避免管道挂起导致接口不返回
    if (trimmed.endsWith('&')) {
      const proc = spawn('/bin/bash', ['-c', trimmed], {
        detached: true,
        stdio: 'ignore',
      })
      proc.unref()
      // 给 bash 一点时间 fork 子进程，然后返回
      setTimeout(() => resolve({ code: 0, stdout: '', stderr: '' }), 300)
      return
    }
    const proc = spawn('/bin/bash', ['-c', trimmed], { timeout: 30000 })
    let stdout = '', stderr = ''
    proc.stdout.on('data', d => stdout += d)
    proc.stderr.on('data', d => stderr += d)
    proc.on('close', code => resolve({ code, stdout, stderr }))
    proc.on('error', reject)
  })
}

// 允许通过 /api/exec 执行的命令模式（项目启停 + tunnel + 查询）
// 这是本地管理台，仅监听 localhost，不对外暴露，所以采用宽松但有边界的白名单
const EXEC_ALLOWED_PATTERNS = [
  /python3.*feishu-dedup\.py/,                          // 飞书去重
  /^systemctl --user (start|stop|restart|status|is-active)\s+[\w.@-]+/,  // systemd 用户服务
  /^fuser( -k)?\s+\d+\/tcp(\s+2>\/dev\/null)?$/,                   // fuser 按端口杀进程
  /^pkill -f '[\w./\- ]+'/,                             // pkill（必须引号包裹模式）
  /^pkill -f [\w./\-]+$/,                               // pkill 简单模式
  /nohup/,                                               // nohup 后台启动
  /cloudflared_bin tunnel/,                              // cloudflare tunnel
  /^ps aux/,                                             // 进程查询
]

// 禁止：shell 注入、删除、网络下载执行等
const EXEC_BLOCKED = [/(rm|curl|wget|sudo|chmod|chown|mkfs|dd|reboot|shutdown)/, /[;`]|\$\(/, /&&\s*rm/]

function isCmdAllowed(cmd) {
  const trimmed = cmd.trim()
  if (EXEC_BLOCKED.some(re => re.test(trimmed))) return false
  return EXEC_ALLOWED_PATTERNS.some(re => re.test(trimmed))
}

app.post('/api/exec', async (req, res) => {
  try {
    const { cmd } = req.body
    if (!cmd) return res.status(400).json({ error: '缺少cmd参数' })
    if (!isCmdAllowed(cmd)) {
      console.warn('[exec] blocked command:', cmd)
      return res.status(403).json({ error: '命令不在白名单内', cmd: cmd.slice(0, 120) })
    }
    const result = await execCmd(cmd)
    res.json({ code: result.code, stdout: result.stdout, stderr: result.stderr })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Cloudflare Tunnel URL 读取（从日志文件） ───────────────────────
const CF_LOG_MAP = {
  3210: 'cf-presale',
  5174: 'cf-clawbot',
  5173: 'cf-kingdee',
  3003: 'cf-rent',
}

app.get('/api/tunnel/:port', (req, res) => {
  const port = parseInt(req.params.port)
  const name = CF_LOG_MAP[port]
  if (!name) return res.status(404).json({ error: `端口 ${port} 未登记 tunnel 日志` })
  try {
    const logPath = path.join(process.env.HOME || '/home/openclaw', '.openclaw', `${name}.log`)
    if (!fs.existsSync(logPath)) return res.json({ url: null, port, log: 'log文件不存在' })
    const content = fs.readFileSync(logPath, 'utf8')
    const matches = content.match(/https:\/\/[^\s]+\.trycloudflare\.com\/?/g)
    const url = matches ? [...new Set(matches)].pop() : null
    res.json({ url: url ? url.replace(/\/$/, '') : null, port, name })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/tunnel/start', (req, res) => {
  const { port } = req.body
  if (!port) return res.status(400).json({ error: '缺少port参数' })
  const name = CF_LOG_MAP[port]
  const logFile = path.join(process.env.HOME || '/home/openclaw', '.openclaw', `${name || 'cf-' + port}.log`)
  try {
    const { execSync } = require('child_process')
    execSync(`setsid ~/.openclaw/cloudflared_bin tunnel --url http://localhost:${port} > ${logFile} 2>&1 < /dev/null &`, { encoding: 'utf8' })
    res.json({ ok: true, port, log: logFile })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 停止指定端口的 Cloudflare Tunnel（安全方式，不用 pkill -f 避免自杀）
app.post('/api/tunnel/stop', (req, res) => {
  const { port } = req.body
  if (!port) return res.status(400).json({ error: '缺少port参数' })
  try {
    const { execSync } = require('child_process')
    // 找到该端口对应的 cloudflared PID 并 kill（不使用 pkill -f）
    const result = execSync(
      `ps aux | grep 'cloudflared_bin tunnel' | grep -v grep | grep 'localhost:${port}' | awk '{print $2}'`,
      { encoding: 'utf8', timeout: 5000 }
    ).trim()
    if (!result) return res.json({ ok: true, port, killed: 0, msg: '未找到运行中的 tunnel' })
    const pids = result.split('\n').filter(Boolean)
    pids.forEach(pid => { try { process.kill(parseInt(pid), 'SIGTERM') } catch {} })
    res.json({ ok: true, port, killed: pids.length, pids })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/trigger-learning', async (req, res) => {
  try {
    const { topic, topicName } = req.body
    if (!topic) return res.status(400).json({ success: false, error: '缺少topic' })
    const logFile = `/tmp/clawbot-learning-${topic}-${Date.now()}.log`
    const hourMap = { psychology: 12, accounting: 14, tcm: 15, history: 17 }
    let cmd
    if (topic === 'ai') {
      cmd = `cd /home/openclaw/.openclaw/workspace/scripts/framework && nohup python3 auto-learning-v4.py --topic ${topic} > ${logFile} 2>&1 &`
    } else if (topic === 'fde') {
      cmd = `nohup openclaw cron run 07d935e3-f595-4e9b-a0d9-754f24ab8dff > ${logFile} 2>&1 &`
    } else if (hourMap[topic]) {
      cmd = `cd /home/openclaw/.openclaw/workspace/scripts/framework && nohup python3 special-topics-scheduler.py --force ${hourMap[topic]} > ${logFile} 2>&1 &`
    } else {
      cmd = `cd /home/openclaw/.openclaw/workspace/scripts/framework && nohup python3 auto-learning-v4.py --topic ${topic} > ${logFile} 2>&1 &`
    }
    execSync(cmd)
    res.json({ success: true, ok: true, topic, topicName, logFile })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// 服务状态查询（前端用 /api/services，兼容旧名）
app.get('/api/services', (req, res) => { res.redirect(307, '/api/service-status') })

// 简单状态检查
app.get('/api/status', (req, res) => res.json({ ok: true, ts: Date.now() }))

// 兼容旧学习触发接口：前端按 jobId 调用，这里映射到具体主题并后台执行学习脚本
app.post('/api/trigger', async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const jobId = body?.jobId || ''
    const topicMap = {
      'a03b64db-a205-448e-800b-308e95483840': { topic: 'ai', cmd: 'auto' },
      '1183a5ee-cfac-4371-90a4-511539d010a9': { topic: 'psychology', cmd: 'special', hour: 12 },
      '75bfacf3-8fb1-49e7-898d-c7a990cfe2a0': { topic: 'accounting', cmd: 'special', hour: 14 },
      'dc7aee64-8863-4402-ae85-730dc2f385fe': { topic: 'tcm', cmd: 'special', hour: 15 },
      'c80db379-6976-4482-9bc4-2d74b8832bf8': { topic: 'history', cmd: 'special', hour: 17 },
      '07d935e3-f595-4e9b-a0d9-754f24ab8dff': { topic: 'fde', cmd: 'cron', hour: 19 },
    }
    const mapped = body?.topic ? { topic: body.topic, cmd: body.topic === 'ai' ? 'auto' : 'special' } : topicMap[jobId]
    if (!mapped) return res.json({ ok: false, error: '未知或不可触发的学习主题', jobId })

    const topic = mapped.topic
    const logFile = `/tmp/clawbot-learning-${topic}-${Date.now()}.log`
    let cmd
    if (mapped.cmd === 'auto') {
      cmd = `cd /home/openclaw/.openclaw/workspace/scripts/framework && nohup python3 auto-learning-v4.py --topic ${topic} > ${logFile} 2>&1 &`
    } else if (mapped.cmd === 'cron') {
      // FDE等由 OpenClaw cron agentTurn 驱动的主题，直接强制运行对应 cron 任务
      cmd = `nohup openclaw cron run ${jobId} > ${logFile} 2>&1 &`
    } else {
      const hourMap = { psychology: 12, accounting: 14, tcm: 15, history: 17 }
      const hour = mapped.hour || hourMap[topic]
      cmd = `cd /home/openclaw/.openclaw/workspace/scripts/framework && nohup python3 special-topics-scheduler.py --force ${hour} > ${logFile} 2>&1 &`
    }
    execSync(cmd)
    res.json({ ok: true, success: true, message: '学习推送已触发，后台执行中', topic, jobId, logFile })
  } catch (e) {
    res.json({ ok: false, error: e.message })
  }
})

// cron 任务列表（兼容旧前端，临时返回空）
app.get('/api/cron-jobs', (req, res) => {
  res.json([
    { name: '🔧 服务守护', schedule: '每1小时', jobId: 'service-guardian' },
    { name: '📚 AI学习推送', schedule: '22:00', jobId: 'learning-daily' },
  ])
})

// 单个端口的在线检测（供项目中心使用）
app.get('/api/port-check/:port', async (req, res) => {
  const port = parseInt(req.params.port)
  if (!port || port < 1 || port > 65535) return res.status(400).json({ online: false, error: 'bad port' })
  const start = Date.now()
  try {
    const resp = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(2500) })
    const online = resp.ok === true || (resp.status >= 200 && resp.status < 500)
    res.json({ online, latency: Date.now() - start, status: resp.status })
  } catch {
    res.json({ online: false, latency: null })
  }
})

// 按端口杀进程（供项目中心停止服务，避免 pkill -f 自杀问题）
// 入参: { ports: [3210, 3211] }
app.post('/api/service/kill', (req, res) => {
  const ports = Array.isArray(req.body?.ports) ? req.body.ports : (req.body?.port ? [req.body.port] : [])
  const validPorts = ports.filter(p => Number.isInteger(p) && p > 0 && p < 65536)
  if (validPorts.length === 0) return res.status(400).json({ error: '缺少有效端口' })
  const killed = []
  for (const port of validPorts) {
    try {
      const out = execSync(`fuser ${port}/tcp 2>/dev/null || true`, { encoding: 'utf8', timeout: 5000 }).trim()
      if (out) {
        const pids = out.split(/\s+/).filter(Boolean)
        pids.forEach(pid => { try { process.kill(parseInt(pid), 'SIGTERM') } catch {} })
        killed.push({ port, pids })
      }
    } catch {}
  }
  res.json({ ok: true, killed })
})

app.get('/api/service-status', async (req, res) => {
  try {
    const services = [
      // === 核心基础设施（项目级服务在“项目中心”查看） ===
      { name: 'OpenClaw Gateway', port: 18789, checkHost: 'localhost' },
      { name: '知识中心API', port: 3001, checkHost: 'localhost' },
      { name: 'ClawBot 前端', port: 5174, checkHost: 'localhost' },
      { name: '金蝶前端', port: 5173, checkHost: 'localhost' },
      { name: '金蝶后端API', port: 8766, checkHost: 'localhost' },
      { name: '金蝶WS通知', port: 8767, checkHost: 'localhost' },
      { name: '售前管理', port: 3210, checkHost: 'localhost' },
      { name: '金蝶任务队列', port: 8768, checkHost: 'localhost' },
      // === OpenClaw 实例集群 ===
      { name: 'Docker-shortvideo', port: 18809, checkHost: 'localhost' },
      { name: 'Docker-kingdee', port: 18829, checkHost: 'localhost' },
      { name: 'Docker-print3d', port: 18849, checkHost: 'localhost' },
      { name: 'Docker-ai-game', port: 18869, checkHost: 'localhost' },
      { name: 'Docker-webdev', port: 18889, checkHost: 'localhost' },
      { name: '审查员实例', port: 18909, checkHost: 'localhost' },
      // === 工具/中间件服务 ===
      { name: 'Hermes Bridge', port: 3002, checkHost: 'localhost' },
      { name: 'Volcano Embedding', port: 3011, checkHost: 'localhost' },
      { name: 'Hermes Studio', port: 8648, checkHost: 'localhost' },
      { name: 'Hermes Bus', port: 18766, checkHost: 'localhost' },
      { name: 'CapCut Mate', port: 30001, checkHost: 'localhost' },
    ]
    const results = await Promise.all(services.map(async (s) => {
      try {
        const url = `http://${s.checkHost}:${s.port}/`
        const start = Date.now()
        const resp = await fetch(url, { signal: AbortSignal.timeout(2500) })
        const online = resp.ok === true || (resp.status >= 200 && resp.status < 500)
        return { ...s, online, latency: Date.now() - start }
      } catch {
        return { ...s, online: false, latency: null }
      }
    }))
    res.json(results)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── 技能多标签分类引擎（2026-08-28 重构）──────────────────────────
// 结构：实例专用分类（对应各实例，可多命中）+ 自研技能标签 + 功能性标签（最多补2个）
// ── 实例专用分类（严格对应各实例专职能力，匹配技能名避免误伤）───────────
// 规则：只匹配技能名，不匹配描述；ASCII 短关键词按词边界匹配（erp/ams/stl 不误伤）
const INSTANCE_CATEGORIES = [
  { cat: '金蝶交付', kws: ['kingdee', 'kd', '金蝶', '云星空', '星空', '星瀚', '凭证', 'sow', 'quotation', '报价', 'meeting-minutes', '会议纪要', 'gap-analysis', '差异分析', 'interface-list', 'requirements-transform', '需求转换', 'bid-outline', '标书', 'master-plan', 'desensitization', '脱敏', 'erp-integration', 'erp-szpm', 'erpclaw', 'kdclub', 'quality-manager', 'qmr'] },
  { cat: '金蝶开发', kws: ['cosmic', '苍穹', '插件', 'plugin', '二次开发', 'script-api', 'customdev', 'ks语言'] },
  { cat: '短视频', kws: ['douyin', '抖音', 'tiktok', 'bilibili', 'bili', '快手', 'kuaishou', 'capcut', '剪映', 'shortvideo', '口播', 'clips', 'jx-video', 'martin-video', 'toby-video', 'baby-growth-video'] },
  { cat: '3D打印', kws: ['bambu', '拓竹', 'print3d', 'filament', 'ams', 'slicer', 'slice', 'cadquery', 'hitem3d', 'kiln', 'x2d', '3mf'] },
  { cat: 'AI游戏', kws: ['game', '游戏', 'unity', 'unreal', 'npc', '关卡', 'nuwa', 'remotion', 'sag'] },
  { cat: '网页开发', kws: ['react', 'vue', 'frontend', '前端', 'nextjs', 'nuxt', 'tailwind', 'fullstack', 'webdev', 'web-dev', '网页', 'ui-ux'] },
  { cat: '主控台', kws: ['orchestrator', 'task-tracker', 'session-resume', 'session-continuity', 'session-handoff', 'auto-updater', 'find-skills', 'dispatch', 'agent-memory', 'heartbeat', 'multi-agent', 'openclaw-super', 'self-improving', 'skill-gateway'] },
  { cat: '审查', kws: ['audit', '审核', 'review', 'moderation', '审查', 'security-auditor'] },
  { cat: '训练员', kws: ['training', '训练', 'evaluat', 'skill-vetter', 'lesson'] },
]
// ── 功能标签分类（跨实例通用能力）──────────────────────────────────────
const FUNCTIONAL_CATEGORIES = [
  { cat: '公众号', kws: ['wechat', '公众号', 'humanizer', 'wenyan', 'baoyu', 'blog-pipeline', 'multi-post', 'baoyu-post', 'wechat-article', 'xhs-image'] },
  { cat: '图文制作', kws: ['image-generator', 'image-generation', '海报', 'poster', '配图', '图片', 'imagen', 'upscale', 'flux', 'stable-diffusion', 'midjourney', '封面', 'cover', '排版', '图生', 'image'] },
  { cat: '内容创作', kws: ['content', 'writing', '创作', '文案', 'seo', '小红书', 'social', 'blog', '写作', 'copywriting', 'xiaohongshu', 'douyin-skill', 'short-video-script', 'digital-hunter', 'marketing-advisor', 'mixpost'] },
  { cat: '效率工具', kws: ['excel', 'docx', 'word', 'ppt', 'pdf', 'chart', '文档', '表格', 'calendar', 'xlsx', 'document', 'report', '报表', 'wps', 'office', 'c-disk', 'data-validation', 'data-visualization', 'dev-project', 'email-reader', 'meeting-to-action', 'project-tracker', 'risk-assessment', 'windows-system', 'kai-html'] },
  { cat: '浏览器', kws: ['browser', 'selenium', 'playwright', 'puppeteer', 'browser-automation', 'ego-browser', 'use-my-browser', 'browser-use', 'browser-act', 'openclaw-agent'] },
  { cat: '代码', kws: ['git', 'cicd', 'debug', 'sql', '编程', 'developer', 'code-audit', 'git-'] },
  { cat: '知识管理', kws: ['knowledge', 'memory', 'note', '知识', '笔记', 'ai-intelligent-knowledge', 'chinese'] },
  { cat: '自动化', kws: ['automation', 'workflow', '自动化', 'rpa', 'scheduler', 'cron', 'agentic', 'api-integration', 'runninghub'] },
  { cat: 'AI模型', kws: ['tts', 'voice', 'speech', 'translate', '翻译', 'gemini', 'openai', 'llm', 'gpt', 'claude', 'deepseek', 'minimax', 'zhipu', 'fireworks', 'ponytail', 'vectcut'] },
  { cat: '联网搜索', kws: ['tavily', 'web-search', 'web-content', 'free-web', 'tiktok-crawl', 'web-search-free', 'web-content-fetcher', 'deep-search-mpro'] },
  { cat: '财经', kws: ['finance', 'financial', '财经', 'stock', '股票', '行情', '财报', '投资', 'investment', '宏观', 'regulatory-news'] },
  { cat: '海外社交', kws: ['twitter', 'youtube', 'reddit', 'discord', 'telegram', 'x-hots', 'godfery', 'oo-', 'taizi', 'reddit-communities', 'reddit-scraper', 'reddit-readonly', 'oo-discord', 'taizi-discord', 'telegram-api', 'telegram-messaging', 'baoyu-youtube-transcript', 'youtube-transcript-skill'] },
]

function matchKw(text, kw) {
  const k = String(kw).toLowerCase()
  if (/[^\x00-\x7f]/.test(k)) return text.includes(k)
  const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|[^a-z0-9])${esc}(?:[^a-z0-9]|$)`).test(text)
}

// 多标签：实例分类(可多个) + 自研技能 + 功能标签(≤2)；主分类取第一个
function detectCategories(name, desc) {
  const norm = normalizeSkillName(name)
  const nameLc = String(name).toLowerCase()
  const cats = []
  for (const { cat, kws } of INSTANCE_CATEGORIES) {
    if (kws.some(k => matchKw(nameLc, k))) cats.push(cat)
  }
  if (SELF_BUILT.has(name) || SELF_BUILT.has(norm)) cats.push('自研技能')
  const fullText = `${name} ${desc || ''}`.toLowerCase()
  const funcCats = []
  for (const { cat, kws } of FUNCTIONAL_CATEGORIES) {
    if (funcCats.length >= 2) break
    if (kws.some(k => matchKw(fullText, k))) funcCats.push(cat)
  }
  const all = [...new Set([...cats, ...funcCats])]
  if (!all.length) all.push('其他')
  return { category: all[0], categories: all }
}

// 自研技能白名单：ClawBot从零开发 或 基于第三方技能深度改造的，都加到这里
// 规则：自研 + 改过别人的技能 = 自研（陈总确认 2026-06-09）
const SELF_BUILT = new Set([
  'kingdee-delivery', 'gap-analysis-table', '差异分析表生成', 'interface-list-generator',
  'Kingdee-meeting-minutes-v2.0.0', 'REQUIREMENTS-transform-v2.0.0',
  'kingdee-req-spec-generator', 'kingdee-req-spec-generator-v3.2.0',
  'bid-outline-generator-v2.0.0', 'cosmic-customdev-design-doc-v1.0.0',
  'simple-text-weekly-report',
  'weekly-report-excel',
  'weekly-report-excel-v1.0.0',
  'kingdee-sow-desensitization',
  'kingdee-quotation-all-in-one-v2.0.0',
  'html-flowchart-generator',
  'video-publisher',  // 基于第三方改造
  'kingdee-master-plan',
  'kingdee-master-plan-v1.0.0',
  // 3D打印技能包
  'print3d-workflow',
  'bambu-studio-ai',
  'hitem3d',
  'find-stl',
  'openclaw-3d-printing-skill',
  'kiln',
  'cad-agent',
])

// 自研技能在 ClawBot 技能库中的增强说明：用于弹窗展示完整功能边界，避免只显示一句短描述。
const SELF_BUILT_DESCRIPTIONS = {
  'kingdee-delivery': '金蝶云星空交付全流程文档自动化技能。覆盖售前PPT、调研报告、蓝图设计、需求规格说明书、验收文档、单双周滚动周报、接口清单、蓝图评审报告等交付物生成，适用于金蝶项目从售前到实施验收的文档生产与交付管理。',
  'gap-analysis-table': '业务需求及产品匹配差异分析表生成技能。基于金蝶官方模板输出Excel，自动整理业务需求一览表和开发需求概要，识别标准功能、部分匹配、需定制开发，并按插件开发、接口需求、报表开发分类，支持报价和需求评审中的开发范围确认。',
  'interface-list-generator': '开发接口清单生成技能。基于金蝶官方接口清单模板输出Excel，支持主接口清单和接口详情页签，适合ERP、WMS、MES、PLM、OA、银企等系统对接场景，保留模板格式并便于客户确认接口范围。',
  'kingdee-meeting-minutes': '金蝶会议纪要生成技能。可根据录音转写、聊天记录或会议要点生成结构化Word纪要，包含会议背景、讨论事项、决议、行动项、责任人与截止时间，适合项目例会、需求评审会、蓝图评审会和客户沟通会。',
  'requirements-transform-v2.0.0': '需求规格说明书结构化转换技能。将Word/Txt/MD/HTML格式的金蝶云星瀚需求规格说明书转换为AI-Ready Markdown，保留模块、功能点、业务规则、接口、字段、约束和验收口径，便于二开分析、差异分析和开发设计文档生成。',
  'bid-outline-generator': '投标技术标大纲生成技能。解析招标文件、磋商文件或RFP，提取评分项、响应要求、项目背景和交付边界，生成技术标Word大纲和依据说明文档，强调评分导向、原文引用和响应完整性，不生成商务标报价。',
  'cosmic-customdev-design-doc': '金蝶云苍穹二次开发设计文档生成技能。分析插件代码、表单操作、服务接口、数据库表和业务逻辑，生成完整开发设计文档，覆盖操作入口、核心流程、类与方法、数据结构、异常处理和Mermaid图。',
  'simple-text-weekly-report': '简化文字周报生成技能。按项目整体目标、本月关键任务、本周总结、下周计划、需协助事项、目标追踪六段式输出周报，缺失信息会先追问，适合快速日报/周报汇报。',
  'weekly-report-excel': '单双周滚动周报Excel生成技能（通用版）。基于金蝶交付周报模板生成Excel，保持字体、样式、表头和格式一致，支持滚动生成下一期周报，适合项目经理持续跟踪项目计划、风险、问题和进展。',
  'weekly-report-excel-v1.0.0': '单周/双周滚动周报Excel生成技能（v1.0.0）。基于金蝶交付周报模板，自动检测单周/双周模板结构，自动识别表头行和数据行位置，正确处理合并单元格；滚动时将上周的下周计划自动标记为本周完成，再写入新下周计划；字体/样式与模板保持一致，人天/状态列自动留空。触发词：生成周报/滚动周报/双周周报/单周周报/周报Excel。',
  'kingdee-sow-desensitization': '伙伴外包申请SOW脱敏技能。保留原Word文档版式和结构，自动识别并替换客户名称、项目名称、联系人等敏感信息为占位符，适配金蝶外包申请、伙伴协作和材料复用场景。',
  'kingdee-quotation-all-in-one-v2.0.0': '金蝶报价方案全栈技能包v2.4.0。自动调度差异分析表、工作量评估、报价评审，全流程闭环输出带金蝶封面Word报价方案；支持QOrder/QOrderWork/WorkBuddy产品线售前场景，七维评审自动生成HTML报告。（v2.4.0已移除流程图生成环节）',
  'html-flowchart-generator': '系统集成通用PNG流程图生成技能。用于业务流程图、系统集成图、接口流向图和业务数据流向图，适配ERP、WMS、MES、PLM、OA、银企、国资委、数据中台和第三方平台等集成场景；默认只输出PNG，明确要求时才输出SVG/HTML/源文件。支持金蝶官方风格和现代科技风，采用真实中文字体渲染，强调中文清晰、线条可读、逻辑优先、客户材料可直接使用；严格不生成报价单、不生成报价明细、不做人天估算、不做商务报价。',
  'kingdee-master-plan': '金蝶项目总体计划生成技能。根据项目模块范围和关键里程碑（启动、调研、蓝图确认、开发、上线、验收），自动推理每个任务节点的起止时间，生成符合金蝶V10.0交付规范的总体计划Excel，支持增删节点，适合项目经理制定项目时间表。',
  'video-publisher': '短视频多平台发布与数据统计技能。支持抖音、快手、B站、小红书、视频号、YouTube等平台的发布管理和数据汇总，适合短视频账号运营、内容分发、播放/点赞/评论数据追踪与复盘。',
  // ── 3D打印技能包 ──────────────────────────────────────────────
  'print3d-workflow': '拓竹 X2D 3D打印完整自动化流水线。整合模型搜索/AI生成/参数化建模→网格修复→切片→人工审核→打印监控→飞书通知。全程人工审核闸门，不自动执行任何有风险操作。支持 find-stl 搜索 Printables、bambu-studio-ai 文生3D/图生3D/多色彩、openclaw-3d-printing-skill 参数化 CAD、实时 MQTT 打印机监控（暂停/恢复/调速/摄像头快照）。',
  'bambu-studio-ai': 'Bambu Lab 全系打印机控制技能（支持 A1/X1C/P1S/X2D 等9款机型）。功能：模型搜索(MakerWorld/Thingiverse/Thangs)、AI文生3D(Meshy/Tripo)、STL分析修复、CLI切片、多色彩 AMS 处理、实时打印监控+摄像头快照、打印机控制(暂停/恢复/调速/灯光)。本地 MQTT 模式直连拓竹 X2D（端口 6000），无需云端。',
  'hitem3d': '图转3D技能。将产品照片、人物图片、概念图转换为可打印 STL/GLB/USDZ 模型。支持单图/多视角/批量处理，智能识别纹理和几何结构，适合产品原型、角色手办、AR 展示场景。需配置 HITEM3D_AK/HITEM3D_SK。',
  'find-stl': '模型搜索下载技能。从 Printables 搜索并下载免费 STL/3MF 模型，自动记录作者/许可证/文件哈希，输出本地文件夹+manifest.json，适合快速获取成熟设计方案。',
  'openclaw-3d-printing-skill': 'CadQuery 参数化3D建模技能。设计支架、外壳、适配器、夹具等有精确尺寸要求的功能零件，输出 STL/3MF，保证壁厚/公差/拔模角度正确，支持预览渲染和打印可行性验证，适合工业零件批量定制。',
  'kiln': '3D打印多品牌控制 MCP 服务器（901个工具+239条命令）。支持 Bambu Lab/OctoPrint/Moonraker(Klipper)/Creality/Prusa Link/Elegoo Saturn。通过 MCP 协议统一管控多台打印机、搜索模型市场、文生3D、切片、队列管理、摄像头监控和故障检测。',
  'cad-agent': '参数化 CAD 建模 Agent。基于 Build123d/CadQuery 生成可打印 STL，校验公差/壁厚/支撑，支持支架/外壳/孔位等精确尺寸零件，输出模型+预览图+打印参数建议。',
}

function selfBuiltDescription(name) {
  const norm = normalizeSkillName(name)
  // 优先用原始key（如 weekly-report-excel-v1.0.0），再用规范化key（如 weekly-report-excel）
  return SELF_BUILT_DESCRIPTIONS[name] || SELF_BUILT_DESCRIPTIONS[norm] || ''
}

function detectCategory(name, desc) {
  return detectCategories(name, desc).category
}

function classifySource(name, author) {
  if (author === 'ClawBot') return '自研'
  if (SELF_BUILT.has(name)) return '自研'
  if (author && author.length > 0 && author !== 'ClawBot' && !author.includes('ClawBot')) {
    // 第三方作者
    if (author.includes('金蝶') || author.includes('Kingdee')) return '官方/厂商'
    return '第三方'
  }
  if (name.startsWith('kingdee-') || name.startsWith('kd-')) return '官方/厂商'
  if (name.startsWith('excel-') || name.startsWith('ppt-') || name.startsWith('upscale-') ||
      name.startsWith('weekly-') || name.startsWith('regulatory-') || name.startsWith('requirement-') ||
      name.includes('mindmap') || name.includes('project-track') || name.includes('risk-assess') ||
      name.includes('training-') || name.includes('yunzhijia')) return '官方/厂商'
  return '其他'
}

function normalizeSkillName(name) {
  return String(name || '')
    .replace(/\.zip$/i, '')
    .replace(/[-_]?v?\d+(?:\.\d+){1,3}$/i, '')
    .toLowerCase()
}

app.get('/api/hermes/skills', async (req, res) => {
  // Returns only Hermes native skills (OpenClaw core skills)
  const result = await new Promise((resolve, reject) => {
    const { execSync } = require('child_process')
    const SKILL_DIR = '/home/openclaw/.openclaw/workspace/skills'
    // Hermes native skill directory names (not Slug)
    const NATIVE_SKILLS = new Set([
      'agent-memory',
      'agent-orchestrator',
      'git',
      'document-summary',
      'html-flowchart-generator',
      'life-decision-guide',
      'cangjie-programming-language-tutorial',
    ])
    const installed = []
    try {
      for (const name of NATIVE_SKILLS) {
        const skillFile = `${SKILL_DIR}/${name}/SKILL.md`
        try {
          let content = execSync(`cat "${skillFile}" 2>/dev/null`).toString()
          content = content.replace(/\r\n/g, '\n').replace(/[｜\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
          let desc = ''
          const yamlEnd = content.indexOf('\n---', 4)
          const frontMatter = yamlEnd > 0 ? content.slice(0, yamlEnd) : content
          const descBlockMatch = frontMatter.match(/^description:\s*(>[-+]?|\|[-+]?)\s*\n([\s\S]*?)(?=\n[a-zA-Z_][\w-]*:\s|$(?![\s\S]))/m)
          const descSingleMatch = !descBlockMatch && frontMatter.match(/^description:\s*(.+)$/m)
          if (descBlockMatch) {
            const indicator = descBlockMatch[1]
            const block = descBlockMatch[2]
            const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
            desc = lines.join(indicator.startsWith('|') ? '\n' : ' ')
          } else if (descSingleMatch) {
            desc = descSingleMatch[1].trim().replace(/^["']|["']$/g, '').trim()
          }
          let name2 = name, version = '', author = '', category = 'general', emoji = '📦'
          const nameMatch = frontMatter.match(/^name:\s*(.+)$/m)
          if (nameMatch) name2 = nameMatch[1].trim()
          const verMatch = frontMatter.match(/^version:\s*v?(.+)$/mi)
          if (verMatch) version = verMatch[1].trim()
          const authMatch = frontMatter.match(/^author:\s*(.+)$/m)
          if (authMatch) author = authMatch[1].trim()
          const catMatch = frontMatter.match(/^category:\s*(.+)$/m)
          if (catMatch) category = catMatch[1].trim()
          const emojiMatch = frontMatter.match(/^emoji:\s*(.+)$/m)
          if (emojiMatch) emoji = emojiMatch[1].trim()
          const triggerMatch = frontMatter.match(/^trigger[_:]?\s*(.+)$/mi)
          const trigger = triggerMatch ? triggerMatch[1].trim() : ''
          const words = (desc || '').split(/[\s,\/]+/).slice(0, 4)
          installed.push({ name: name2, description: desc, version, author, category, emoji, trigger, tags: words, source: 'Hermes', isZip: false, path: `${SKILL_DIR}/${name}` })
        } catch {}
      }
    } catch {}
    resolve({ installed, total: installed.length })
  })
  res.json(result)
})

app.get('/api/skills', async (req, res) => {
  try {
    const SKILL_DIR = '/home/openclaw/.openclaw/workspace/skills'
    const ZIP_DIR = '/mnt/f/技能'

    const installed = []
    const installedKeys = new Set()
    try {
      const dirs = execSync(`ls "${SKILL_DIR}"`).toString().trim().split('\n').filter(Boolean)
      // 展开 @scope 子目录（如 @0731coderlee-sudo/wechat-publisher）为完整路径
      const expanded = []
      for (const name of dirs) {
        if (name.startsWith('@')) {
          try {
            const subs = execSync(`ls "${SKILL_DIR}/${name}"`).toString().trim().split('\n').filter(Boolean)
            for (const sub of subs) expanded.push(`${name}/${sub}`)
          } catch {}
        } else {
          expanded.push(name)
        }
      }
      for (const name of expanded) {
        const skillFile = `${SKILL_DIR}/${name}/SKILL.md`
        try {
          let content = execSync(`cat "${skillFile}" 2>/dev/null`).toString()
          content = content.replace(/\r\n/g, '\n').replace(/[｜\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
          // 支持三种 description 格式：
          // 1) description: 单行文本
          // 2) description: > / | 多行折叠
          // 3) description:\n  缩进多行
          let desc = ''
          const yamlEnd = content.indexOf('\n---', 4)
          const frontMatter = yamlEnd > 0 ? content.slice(0, yamlEnd) : content
          const descBlockMatch = frontMatter.match(/^description:\s*(>[-+]?|\|[-+]?)\s*\n([\s\S]*?)(?=\n[a-zA-Z_][\w-]*:\s|$(?![\s\S]))/m)
          const descSingleMatch = !descBlockMatch && frontMatter.match(/^description:\s*(.+)$/m)
          if (descBlockMatch) {
            // 多行折叠 (> 或 |)
            const indicator = descBlockMatch[1]
            const block = descBlockMatch[2]
            const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
            desc = lines.join(indicator.startsWith('|') ? '\n' : ' ')
          } else if (descSingleMatch) {
            // 去掉外层引号
            desc = descSingleMatch[1].trim().replace(/^["']|["']$/g, '').trim()
          }
          // 如果 YAML 里没有 description 或太短，从正文提取补充
          const extractFromBody = () => {
            const body = yamlEnd > 0 ? content.slice(yamlEnd + 4) : content
            const lines = body.split('\n')
            const paragraphs = []
            let current = []
            for (const line of lines) {
              const t = line.trim()
              if (!t) {
                if (current.length) { paragraphs.push(current.join(' ')); current = [] }
                continue
              }
              // 跳过代码块、引用、表格、文件名标题
              if (t.startsWith('```') || t.startsWith('|') || t.match(/^# SKILL\.md/i)) continue
              // 标题作为段落分隔点
              if (t.startsWith('#')) {
                if (current.length) { paragraphs.push(current.join(' ')); current = [] }
                continue
              }
              // 列表项 → 去掉 marker
              if (t.match(/^[-*]\s/)) {
                current.push(t.replace(/^[-*]\s+/, '').replace(/\*\*/g, ''))
              } else if (t.startsWith('>')) {
                continue
              } else {
                current.push(t.replace(/\*\*/g, ''))
              }
            }
            if (current.length) paragraphs.push(current.join(' '))
            return paragraphs.filter(p => p.length > 5)
          }

          if (!desc || desc.length < 40) {
            const paras = extractFromBody()
            const supplement = paras.slice(0, 3).join(' · ')
            if (desc && desc.length < 40 && supplement) {
              desc = desc + ' · ' + supplement
            } else if (supplement) {
              desc = supplement
            }
          }
          // 技能库弹窗需要展示更完整的功能说明，保留更长描述；卡片端由前端负责折叠。
          const enhancedDesc = selfBuiltDescription(name)
          if (enhancedDesc && (!desc || desc.length < enhancedDesc.length)) desc = enhancedDesc
          desc = (desc || '暂无描述').slice(0, 2400)
          const vm = content.match(/^version:\s*(.+)/m)
          const am = content.match(/^author:\s*(.+)/m)
          const om = content.match(/^origin:\s*(.+)/m)
          const ver = vm ? vm[1].trim() : ''
          const author = am ? am[1].trim() : (om ? om[1].trim() : '')
          const source = classifySource(name, author)
          installedKeys.add(normalizeSkillName(name))
          const catg = detectCategories(name, desc)
          installed.push({
            name,
            description: desc,
            version: ver,
            author,
            category: catg.category,
            categories: catg.categories,
            source,
            isZip: false,
            path: `${SKILL_DIR}/${name}`,
          })
        } catch {}
      }
    } catch {}

    // 同基础名只保留最新版（版本号最高的），旧版本从列表移除
    const byBase = new Map()  // baseName → [{entry, verTuple}]
    for (const entry of installed) {
      const base = normalizeSkillName(entry.name)
      const vStr = entry.version || entry.name.match(/[-_]?v?(\d+(?:\.\d+){1,3})$/i)?.[1] || '0.0.0'
      const verTuple = vStr.split('.').map(Number)
      if (!byBase.has(base)) byBase.set(base, [])
      byBase.get(base).push({ entry, verTuple })
    }
    const latest = []
    for (const [base, items] of byBase) {
      if (items.length <= 1) { latest.push(items[0].entry); continue }
      // 比较版本号，保留最高版；无版本号则保留不含版本后缀的目录名
      items.sort((a, b) => {
        for (let i = 0; i < Math.max(a.verTuple.length, b.verTuple.length); i++) {
          const va = a.verTuple[i] || 0, vb = b.verTuple[i] || 0
          if (va !== vb) return vb - va
        }
        // 版本相同，优先保留无版本后缀的目录（即正式目录）
        const aHasVer = /[-_]?v?\d+(?:\.\d+){1,3}$/i.test(a.entry.name)
        const bHasVer = /[-_]?v?\d+(?:\.\d+){1,3}$/i.test(b.entry.name)
        if (aHasVer && !bHasVer) return 1
        if (!aHasVer && bHasVer) return -1
        return 0
      })
      latest.push(items[0].entry)
    }

    const zips = []
    try {
      const files = execSync(`ls "${ZIP_DIR}" 2>/dev/null`).toString().trim().split('\n').filter(f => f.endsWith('.zip'))
      for (const f of files) {
        const name = f.replace('.zip', '')
        if (installedKeys.has(normalizeSkillName(name))) continue
        zips.push({
          name,
          description: '（未解压，查看完整说明需安装）',
          version: '',
          author: 'F:\\技能',
          category: '未分类',
          source: 'F:技能',
          isZip: true,
        })
      }
    } catch {}

    res.json({ installed: latest, zips, total: latest.length + zips.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ====== 学习历史API (从 scripts/api-server.cjs 合并过来) ======
const LEARNING_DB_SCRIPT = '/home/openclaw/.openclaw/workspace/scripts/framework/feishu-learning-db.py'

function runLearningDb(argsStr) {
  const tmpFile = path.join(os.tmpdir(), `lq_${Date.now()}_${Math.random().toString(36).slice(2)}.json`)
  try {
    execSync(`python3 ${LEARNING_DB_SCRIPT} ${argsStr} > ${tmpFile} 2>/dev/null`, {
      encoding: 'utf8',
      timeout: 15000,
      maxBuffer: 64 * 1024,
    })
    if (fs.existsSync(tmpFile)) {
      const data = fs.readFileSync(tmpFile, 'utf8')
      fs.unlinkSync(tmpFile)
      return JSON.parse(data)
    }
    return []
  } catch (e) {
    console.error('[learning-db]', e.message)
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile) } catch {}
    return []
  }
}

// 今日推送状态（返回 { ai: true, psychology: false, ... }）
app.get('/api/learning/status', (req, res) => {
  const todayTopics = runLearningDb('query_today')
  const sentSet = new Set(todayTopics)
  const result = {}
  const TOPIC_KEYS = ['ai', 'psychology', 'accounting', 'fde', 'history', 'tcm']
  TOPIC_KEYS.forEach(k => { result[k] = { sent: sentSet.has(k) } })
  res.json(result)
})

app.get('/api/learning/recent', (req, res) => {
  const limit = parseInt(req.query.limit) || 20
  res.json(runLearningDb(`query_recent ${limit}`))
})

app.get('/api/learning/category/:cat', (req, res) => {
  res.json(runLearningDb(`query_by_category "${req.params.cat}"`))
})

app.get('/api/learning/detail/:id', (req, res) => {
  res.json(runLearningDb(`get_record_detail ${parseInt(req.params.id) || 0}`))
})

app.get('/api/learning/search/:kw', (req, res) => {
  res.json(runLearningDb(`search "${req.params.kw}"`))
})

// ==================== 自主学习模块（实例每日复盘 → 共享记忆库 → Hermes） ====================
// 数据源：~/.shared-memory/lessons.db（各实例 cron 写入，此处只读）
const LESSONS_DB = require('path').join(require('os').homedir(), '.shared-memory/lessons.db')

function getLessonsDb() {
  const Database = require('better-sqlite3')
  return new Database(LESSONS_DB, { readonly: true, fileMustExist: true })
}

// 本地日期(Asia/Shanghai) → UTC 查询边界
function localDateToUtcRange(dateStr) {
  const start = new Date(dateStr + 'T00:00:00+08:00')
  const end = new Date(dateStr + 'T00:00:00+08:00')
  end.setDate(end.getDate() + 1)
  return [start.toISOString().slice(0, 19).replace('T', ' '), end.toISOString().slice(0, 19).replace('T', ' ')]
}

function todayLocal() {
  const now = new Date(Date.now() + 8 * 3600 * 1000)
  return now.toISOString().slice(0, 10)
}

// 实例概览：每个实例的今日状态/总数/最后学习时间
app.get('/api/selflearning/overview', (req, res) => {
  let db
  try { db = getLessonsDb() } catch (e) { return res.json({ ok: true, instances: [], dates: [] }) }
  const [ts, te] = localDateToUtcRange(todayLocal())
  const rows = db.prepare(`
    SELECT instance,
      COUNT(*) as total,
      MAX(created_at) as last_at,
      SUM(CASE WHEN created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) as today_count
    FROM lessons GROUP BY instance ORDER BY instance`).all(ts, te)
  const dates = db.prepare(`
    SELECT DISTINCT substr(datetime(created_at, '+8 hours'), 1, 10) as d
    FROM lessons ORDER BY d DESC LIMIT 60`).all().map(r => r.d)
  db.close()
  res.json({ ok: true, instances: rows, today: todayLocal(), dates })
})

// 学习记录列表：date（默认今天）+ instance（可选）
app.get('/api/selflearning/lessons', (req, res) => {
  const date = (req.query.date || todayLocal()).slice(0, 10)
  const instance = req.query.instance || ''
  let db
  try { db = getLessonsDb() } catch (e) { return res.json({ ok: true, date, lessons: [], error: 'db-not-found' }) }
  const [ts, te] = localDateToUtcRange(date)
  let rows
  if (instance) {
    rows = db.prepare(`SELECT * FROM lessons WHERE created_at >= ? AND created_at < ? AND instance = ? ORDER BY created_at DESC`).all(ts, te, instance)
  } else {
    rows = db.prepare(`SELECT * FROM lessons WHERE created_at >= ? AND created_at < ? ORDER BY created_at DESC`).all(ts, te)
  }
  db.close()
  res.json({ ok: true, date, lessons: rows })
})

// 任务级复盘记录：date（默认今天）+ task_id（可选精确查）
app.get('/api/selflearning/task-reviews', (req, res) => {
  const date = (req.query.date || todayLocal()).slice(0, 10)
  const taskId = req.query.task_id || ''
  let db
  try { db = getLessonsDb() } catch (e) { return res.json({ ok: true, date, reviews: [], error: 'db-not-found' }) }
  let rows
  if (taskId) {
    rows = db.prepare(`SELECT * FROM task_review WHERE task_id = ? ORDER BY created_at DESC`).all(taskId)
  } else {
    const [ts, te] = localDateToUtcRange(date)
    rows = db.prepare(`SELECT * FROM task_review WHERE created_at >= ? AND created_at < ? ORDER BY created_at DESC`).all(ts, te)
  }
  db.close()
  res.json({ ok: true, date, reviews: rows })
})

// Hermes 联动：把指定日期的 lessons 汇总写入 Hermes 记忆目录
app.post('/api/selflearning/sync-hermes', (req, res) => {
  const date = (req.query.date || req.body?.date || todayLocal()).slice(0, 10)
  let db
  try { db = getLessonsDb() } catch (e) { return res.status(500).json({ ok: false, error: 'lessons.db 不存在' }) }
  const [ts, te] = localDateToUtcRange(date)
  const rows = db.prepare(`SELECT * FROM lessons WHERE created_at >= ? AND created_at < ? ORDER BY instance, created_at`).all(ts, te)
  db.close()
  if (!rows.length) return res.json({ ok: false, error: `${date} 无学习记录，未同步` })
  const dir = require('path').join(os.homedir(), '.hermes/memories/openclaw')
  const fs = require('fs')
  fs.mkdirSync(dir, { recursive: true })
  const file = require('path').join(dir, `daily-lessons-${date}.md`)
  let md = `# 实例自主学习汇总 ${date}\n\n> 由 ClawBot 自主学习模块自动生成，来源：lessons.db\n\n`
  const byInst = {}
  rows.forEach(r => { (byInst[r.instance] = byInst[r.instance] || []).push(r) })
  Object.keys(byInst).sort().forEach(inst => {
    md += `## ${inst}\n\n`
    byInst[inst].forEach(r => {
      md += `- **[${r.outcome}]** ${r.insight}\n`
      if (r.tags) md += `  - 标签：${r.tags}\n`
    })
    md += '\n'
  })
  md += `---\n共 ${rows.length} 条 | 涉及实例：${Object.keys(byInst).join(', ')} | 同步时间：${new Date().toISOString()}\n`
  fs.writeFileSync(file, md, 'utf8')
  res.json({ ok: true, file, count: rows.length, instances: Object.keys(byInst) })
})

// ==================== 任务练习模块 ====================
const PRACTICE_DB = require('path').join(require('os').homedir(), '.shared-memory', 'practice.db')

function getPracticeDb() {
  const Database = require('better-sqlite3')
  return new Database(PRACTICE_DB, { readonly: true, fileMustExist: true })
}

app.get('/api/practice/tasks', (req, res) => {
  const instance = req.query.instance || ''
  const status = req.query.status || ''
  let db
  try { db = getPracticeDb() } catch (e) { return res.json({ ok: true, tasks: [], instances: [] })}
  let rows, instances
  if (instance) {
    if (status) {
      rows = db.prepare('SELECT * FROM practice_tasks WHERE instance=? AND status=? ORDER BY created_at DESC').all(instance, status)
    } else {
      rows = db.prepare('SELECT * FROM practice_tasks WHERE instance=? ORDER BY created_at DESC').all(instance)
    }
    instances = [instance]
  } else {
    if (status) {
      rows = db.prepare('SELECT * FROM practice_tasks WHERE status=? ORDER BY created_at DESC').all(status)
    } else {
      rows = db.prepare('SELECT * FROM practice_tasks ORDER BY created_at DESC LIMIT 200').all()
    }
    instances = [...new Set(rows.map(r => r.instance))].sort()
  }
  db.close()
  res.json({ ok: true, tasks: rows, instances })
})

app.get('/api/practice/overview', (req, res) => {
  let db
  try { db = getPracticeDb() } catch (e) { return res.json({ ok: true, stats: [] }) }
  const rows = db.prepare(`
    SELECT instance,
      COUNT(*) as total,
      SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status='expired' THEN 1 ELSE 0 END) as expired,
      MAX(executed_at) as last_at
    FROM practice_tasks GROUP BY instance ORDER BY instance
  `).all()
  db.close()
  res.json({ ok: true, stats: rows })
})

app.post('/api/practice/generate', (req, res) => {
  const { execSync } = require('child_process')
  try {
    const out = execSync('python3 /tmp/setup_practice_system.py 2>&1', { encoding: 'utf8', timeout: 30000 })
    res.json({ ok: true, output: out })
  } catch (e) {
    res.json({ ok: false, error: e.message })
  }
})

// 读取练习报告文件内容
app.get('/api/practice/file', (req, res) => {
  const { file } = req.query
  if (!file) { res.json({ ok: false, error: 'missing file param' }); return }
  try {
    const fs = require('fs')
    const path = require('path')
    const safePath = path.resolve(file)
    // 验证路径在允许范围内
    const allowedDirs = [
      require('path').resolve(process.env.HOME + '/.openclaw/instances'),
      require('path').resolve(process.env.HOME + '/.openclaw/workspace'),
    ]
    const inAllowed = allowedDirs.some(d => safePath.startsWith(d))
    if (!inAllowed) { res.json({ ok: false, error: 'path not allowed' }); return }
    if (!fs.existsSync(safePath)) { res.json({ ok: false, error: 'file not found' }); return }
    const stat = fs.statSync(safePath)
    if (stat.size > 512000) { res.json({ ok: false, error: 'file too large (>500KB)' }); return }
    const content = fs.readFileSync(safePath, 'utf8')
    res.json({ ok: true, content, size: stat.size, mtime: stat.mtime })
  } catch (e) {
    res.json({ ok: false, error: e.message })
  }
})

// 清理过期练习文件（保留已完成任务的 output_file，只删除过期任务的临时文件）
app.post('/api/practice/cleanup', (req, res) => {
  const { execSync } = require('child_process')
  try {
    const out = execSync('python3 /tmp/cleanup_practice.py 2>&1', { encoding: 'utf8', timeout: 30000 })
    const parts = out.trim().split('|')
    const deleted = parseInt(parts[0]) || 0
    const freed = parseInt(parts[1]) || 0
    res.json({ ok: true, deleted, freed: Math.round(freed / 1024) })
  } catch (e) {
    res.json({ ok: false, error: e.message })
  }
})

// 手动触发服务守护脚本
app.post('/api/run-watchdog', (req, res) => {
  try {
    const out = execSync('bash /home/openclaw/.openclaw/workspace/scripts/service-guardian.sh 2>&1', { encoding: 'utf8', timeout: 60000 })
    // 提取状态摘要行
    const statusLine = out.split('\n').reverse().find(l => l.includes('状态:')) || out.trim().split('\n').pop() || ''
    res.json({ ok: true, status: statusLine, log: out.slice(-1000) })
  } catch (e) {
    res.json({ ok: false, error: e.message })
  }
})

// ============================================================
// CapCut Mate 代理：将 WSL 侧请求转发到 Windows 侧服务
// Windows CapCut Mate 运行在 localhost:30000，WSL 通过本代理访问
// ============================================================
const http = require('http')

// 获取 Windows 宿主机 IP（docker.internal 或 netsh 方式）
function getWindowsHost() {
  // 方式1：读取 WSL 默认路由（Gateway IP = Windows Host）
  try {
    const out = require('child_process').execSync(
      "ip route show default | awk '{print $3}'",
      { encoding: 'utf8', timeout: 3000 }
    ).trim()
    if (out) return out
  } catch {}
  // 方式2：powershell 网卡
  try {
    const out = require('child_process').execSync(
      'powershell -Command "(Get-NetIPAddress -InterfaceAlias vEthernet\\* -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike \"172.*\"}).IPAddress" 2>nul || echo ""',
      { encoding: 'utf8', timeout: 3000 }
    ).trim().split('\n')[0]
    if (out && out.length > 6) return out
  } catch {}
  // 方式3：直接用 WSL gateway IP（默认 172.19.x.1）
  return '172.19.16.1'
}

const CAPCUT_WINDOWS_HOST = process.env.CAPCUT_WINDOWS_HOST || getWindowsHost()
const CAPCUT_TARGET = `http://${CAPCUT_WINDOWS_HOST}:30001`

// CapCut Mate API 代理（WSL → Windows）
app.use('/capcut-mate', async (req, res) => {
  const url = CAPCUT_TARGET + req.originalUrl.replace('/capcut-mate', '')
  try {
    const body = req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    const headers = {}
    for (const [k, v] of Object.entries(req.headers)) {
      if (['content-length', 'content-type'].includes(k)) headers[k] = v
    }
    const result = await fetch(url, {
      method: req.method,
      headers,
      body,
      signal: AbortSignal.timeout(60000),
    })
    const text = await result.text()
    res.setHeader('Content-Type', 'application/json')
    res.status(result.status).send(text)
  } catch (e) {
    res.status(502).json({ error: `CapCut Mate 代理失败: ${e.message}`, windows_host: CAPCUT_WINDOWS_HOST })
  }
})

// ── 售前管理系统（新版）反向代理 ──────────────────────────────────────
app.use('/presale/api', (req, res) => {
  const options = {
    hostname: 'localhost',
    port: 3010,
    path: '/api' + req.url,
    method: req.method,
    headers: { ...req.headers, host: 'localhost:3001' },
  }
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res, { end: true })
  })
  proxyReq.on('error', (e) => res.status(502).json({ error: e.message }))
  if (req.method !== 'GET') req.pipe(proxyReq, { end: true }); else proxyReq.end()
})

app.use('/presale', (req, res) => {
  const options = {
    hostname: 'localhost',
    port: 8082,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: 'localhost:8082' },
  }
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res, { end: true })
  })
  proxyReq.on('error', (e) => res.status(502).json({ error: e.message }))
  if (req.method !== 'GET') req.pipe(proxyReq, { end: true }); else proxyReq.end()
})

// ── Fleet 实例集群 API ────────────────────────────────────────────────────
const FLEET_INSTANCES_DIRS = [
  '/home/openclaw/.openclaw/instances',
  '/home/openclaw/docker-openclaw/instances',
]

// 实时从飞书 API 获取应用名称
async function fetchFeishuAppName(appId, appSecret) {
  if (!appId || !appSecret || appId === '__FEISHU_APP_ID__') return null
  try {
    const { spawn } = require('child_process')
    const result = await new Promise((resolve) => {
      const py = spawn('python3', ['-c', `
import urllib.request,json,sys
req=urllib.request.Request('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
  data=json.dumps({'app_id':'${appId}','app_secret':'${appSecret}'}).encode(),
  headers={'Content-Type':'application/json'},method='POST')
with urllib.request.urlopen(req,timeout=8) as r:
  token=json.loads(r.read()).get('tenant_access_token','')
req2=urllib.request.Request('https://open.feishu.cn/open-apis/application/v6/applications/${appId}?lang=zh_cn',
  headers={'Authorization':'Bearer '+token})
with urllib.request.urlopen(req2,timeout=8) as r2:
  print(json.loads(r2.read()).get('data',{}).get('app',{}).get('app_name',''))
`], { timeout: 15000 })
      let out = ''
      py.stdout.on('data', d => out += d)
      py.on('close', code => resolve(code === 0 ? out.trim() : ''))
      py.on('error', () => resolve(''))
    })
    return result || null
  } catch { return null }
}

function extractModelInfo(cfg) {
  const modelCfg = cfg?.agents?.defaults?.model
  if (!modelCfg) return null
  const providerLabels = {
    minimax: 'MiniMax M2.7',
    'volcano-plan': '火山方舟 Agent Plan',
    volcano: '火山方舟 Code Plan',
  }
  const parseId = (id) => {
    const parts = id.split('/')
    return { provider: parts[0], model: parts.slice(1).join('/') || parts[0] }
  }
  const primary = modelCfg.primary || ''
  const fallbacks = modelCfg.fallbacks || []
  const pp = parseId(primary)
  return {
    primary,
    primaryLabel: providerLabels[pp.provider] || primary,
    fallbacks,
    chain: [primary, ...fallbacks],
    chainLabels: [primary, ...fallbacks].map(f => {
      const p = parseId(f)
      return providerLabels[p.provider] || f
    }),
  }
}

function loadFleetInstances() {
  const fs = require('fs')
  let masterEntry = null
  try {
    const mainCfg = JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/openclaw.json', 'utf8'))
    const gw = mainCfg.gateway || {}
    const feishu = mainCfg.channels?.feishu || {}
    const fleet = mainCfg.fleet || {}
    masterEntry = {
      id: 'master',
      name: 'ClawBot 主控',
      direction: 'AI成长型助手 · 统一调度中心',
      port: gw.port || 18789,
      gateway_token: gw.auth?.token || '',
      container: null,
      feishu_app_id: feishu.appId || '',
      feishu_app_name: null,  // 实时从飞书 API 获取
      feishu_app_secret: feishu.appSecret || '',
      feishu_connected: !!feishu.enabled,
      created_at: 0,
      is_master: true,
      runtime: 'wsl',
      isLocked: !!fleet.locked,
      lockedAt: fleet.lockedAt || null,
      model_info: extractModelInfo(mainCfg),
    }
  } catch {}
  const instances = [masterEntry].filter(Boolean)
  for (const FLEET_INSTANCES_DIR of FLEET_INSTANCES_DIRS) {
    if (!fs.existsSync(FLEET_INSTANCES_DIR)) continue
    for (const id of fs.readdirSync(FLEET_INSTANCES_DIR)) {
      // 跳过已存在的实例（避免多目录重复）
      if (instances.find(i => i.id === id)) continue
      const metaPath = `${FLEET_INSTANCES_DIR}/${id}/instance.json`
      if (!fs.existsSync(metaPath)) continue
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
        let feishu_app_id = '', feishu_app_secret = '', feishu_connected = false, gateway_token = ''
        let model_info = null
        const instCfgPath1 = `${FLEET_INSTANCES_DIR}/${id}/.openclaw/openclaw.json`
        const instCfgPath2 = `${FLEET_INSTANCES_DIR}/${id}/openclaw.json`
        const instCfgPath = fs.existsSync(instCfgPath1) ? instCfgPath1 : instCfgPath2
        let isLocked = false, lockedAt = null
        if (fs.existsSync(instCfgPath)) {
          try {
            const instCfg = JSON.parse(fs.readFileSync(instCfgPath, 'utf8'))
            feishu_app_id = instCfg.channels?.feishu?.appId || ''
            feishu_app_secret = instCfg.channels?.feishu?.appSecret || ''
            feishu_connected = instCfg.channels?.feishu?.enabled || false
            gateway_token = instCfg.gateway?.auth?.token || instCfg.gateway?.remote?.token || ''
            model_info = extractModelInfo(instCfg)
            const fleet = instCfg.fleet || {}
            isLocked = !!fleet.locked
            lockedAt = fleet.lockedAt || null
          } catch {}
        }
        instances.push({
          id,
          ...meta,
          gateway_token,
          model_info,
          feishu_app_id,
          feishu_app_name: null,  // 实时从飞书 API 获取
          feishu_app_secret,
          feishu_connected,
          isLocked,
          lockedAt,
        })
      } catch {}
    }
  }
  return instances
}

function saveFleetInstance(id, data) {
  if (id === 'master') return  // 主控不允许从 API 写
  fs.chmod(metaPath, 0o600)
  const identityPath = `${FLEET_INSTANCES_DIR}/${id}/.openclaw/workspace/IDENTITY.md`
  if (fs.existsSync(identityPath)) {
    const lines = fs.readFileSync(identityPath, 'utf8').split('\n')
    const newLines = lines.map(line => {
      if (line.startsWith('- **Name:')) return `- **Name:** ${data.name || id}`
      if (line.startsWith('- **Primary Direction:')) return `- **Primary Direction:** ${data.direction || ''}`
      return line
    })
    fs.writeFileSync(identityPath, newLines.join('\n'))
  }
}

app.get('/api/fleet/instances', async (req, res) => {
  const instances = loadFleetInstances()
  const results = await Promise.all(instances.map(async inst => {
    // 实时获取飞书应用名称
    if (inst.feishu_app_id && inst.feishu_app_secret) {
      inst.feishu_app_name = await fetchFeishuAppName(inst.feishu_app_id, inst.feishu_app_secret)
    }
    try {
      const resp = await fetch(`http://127.0.0.1:${inst.port}/healthz`, { signal: AbortSignal.timeout(4000) })
      const health = await resp.json()
      return { ...inst, status: health.ok ? 'online' : 'unhealthy', health }
    } catch {
      return { ...inst, status: 'offline', health: null }
    }
  }))
  res.json({ instances: results, total: results.length })
})

app.put('/api/fleet/instances/:id', (req, res) => {
  const { id } = req.params
  const instances = loadFleetInstances()
  const inst = instances.find(i => i.id === id)
  if (!inst) return res.status(404).json({ error: `实例 ${id} 不存在` })
  const { name, direction } = req.body || {}
  if (name) inst.name = name
  if (direction) inst.direction = direction
  saveFleetInstance(id, inst)
  res.json({ ok: true, ...inst })
})

function getNativeServiceName(id) {
  try {
    const metaPath = `${FLEET_INSTANCES_DIR}/${id}/instance.json`
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
      if (meta.runtime === 'native-wsl' && meta.service) return meta.service
    }
  } catch {}
  return null
}

app.post('/api/fleet/instances/:id/restart', (req, res) => {
  const { id } = req.params
  if (id === 'master') return res.status(400).json({ error: '主控不支持此操作，请通过系统服务管理' })
  const { execSync } = require('child_process')
  const nativeSvc = getNativeServiceName(id)
  try {
    if (nativeSvc) {
      execSync(`systemctl --user restart ${nativeSvc}`, { stdio: 'pipe' })
    } else {
      execSync('cd /home/openclaw/docker-openclaw && sudo docker compose restart ' + id, { stdio: 'pipe' })
    }
    res.json({ ok: true, message: `实例 ${id} 重启指令已发送` })
  } catch (e) { res.status(500).json({ error: `重启失败: ${e.message}` }) }
})

app.post('/api/fleet/instances/:id/stop', (req, res) => {
  const { id } = req.params
  if (id === 'master') return res.status(400).json({ error: '主控不支持此操作' })
  const { execSync } = require('child_process')
  const nativeSvc = getNativeServiceName(id)
  try {
    if (nativeSvc) {
      execSync(`systemctl --user stop ${nativeSvc}`, { stdio: 'pipe' })
    } else {
      execSync('cd /home/openclaw/docker-openclaw && sudo docker compose stop ' + id, { stdio: 'pipe' })
    }
    res.json({ ok: true, message: `实例 ${id} 已停止` })
  } catch (e) { res.status(500).json({ error: `停止失败: ${e.message}` }) }
})

app.post('/api/fleet/instances/:id/start', (req, res) => {
  const { id } = req.params
  if (id === 'master') return res.status(400).json({ error: '主控不支持此操作' })
  const { execSync } = require('child_process')
  const nativeSvc = getNativeServiceName(id)
  try {
    if (nativeSvc) {
      execSync(`systemctl --user start ${nativeSvc}`, { stdio: 'pipe' })
    } else {
      execSync('cd /home/openclaw/docker-openclaw && sudo docker compose start ' + id, { stdio: 'pipe' })
    }
    res.json({ ok: true, message: `实例 ${id} 已启动` })
  } catch (e) { res.status(500).json({ error: `启动失败: ${e.message}` }) }
})

app.get('/api/fleet/instances/:id/health', async (req, res) => {
  const { id } = req.params
  const instances = loadFleetInstances()
  const inst = instances.find(i => i.id === id)
  if (!inst) return res.status(404).json({ error: `实例 ${id} 不存在` })
  try {
    const [health, ready] = await Promise.all([
      fetch(`http://127.0.0.1:${inst.port}/healthz`, { signal: AbortSignal.timeout(4000) }).then(r => r.json()).catch(() => null),
      fetch(`http://127.0.0.1:${inst.port}/readyz`, { signal: AbortSignal.timeout(4000) }).then(r => r.json()).catch(() => null),
    ])
    res.json({ id, port: inst.port, health, ready })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ====== Fleet Lock API (per-instance) ======
const FLEET_INSTANCES_DIRS_FOR_LOCK = [
  '/home/openclaw/.openclaw/instances',
  '/home/openclaw/docker-openclaw/instances',
]

function resolveOpenclawJson(instanceId, baseDir) {
  const p1 = `${baseDir}/${instanceId}/.openclaw/openclaw.json`
  const p2 = `${baseDir}/${instanceId}/openclaw.json`
  if (fs2.existsSync(p1)) return p1
  if (fs2.existsSync(p2)) return p2
  return null
}

function getInstanceLockState(instanceId) {
  for (const dir of FLEET_INSTANCES_DIRS_FOR_LOCK) {
    const cfgPath = resolveOpenclawJson(instanceId, dir)
    if (!cfgPath) continue
    try {
      const cfg = JSON.parse(fs2.readFileSync(cfgPath, 'utf-8'))
      const fleet = cfg.fleet || {}
      return {
        isLocked: !!fleet.locked,
        lockedAt: fleet.lockedAt || null,
        lockedBy: fleet.lockedBy || null,
      }
    } catch { continue }
  }
  return { isLocked: false, error: 'instance_not_found' }
}

function setInstanceLock(instanceId, locked) {
  for (const dir of FLEET_INSTANCES_DIRS_FOR_LOCK) {
    const cfgPath = resolveOpenclawJson(instanceId, dir)
    if (!cfgPath) continue
    try {
      const cfg = JSON.parse(fs2.readFileSync(cfgPath, 'utf-8'))
      cfg.fleet = cfg.fleet || {}
      if (locked) {
        cfg.fleet.locked = true
        cfg.fleet.lockedAt = new Date().toISOString()
        cfg.fleet.lockedBy = 'dashboard'
      } else {
        delete cfg.fleet.locked
        delete cfg.fleet.lockedAt
        delete cfg.fleet.lockedBy
      }
      fs2.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf-8')
      return getInstanceLockState(instanceId)
    } catch { continue }
  }
  return { isLocked: false, error: 'instance_not_found' }
}

// GET /api/fleet/lock-status?instance=shortvideo
app.get('/api/fleet/lock-status', (req, res) => {
  const { instance } = req.query
  if (!instance) return res.json({ error: 'instance param required' }, 400)
  res.json(getInstanceLockState(instance))
})

// POST /api/fleet/lock  body: { instance }
app.post('/api/fleet/lock', (req, res) => {
  const { instance } = req.body || {}
  if (!instance) return res.status(400).json({ error: 'instance param required' })
  const state = getInstanceLockState(instance)
  if (state.error) return res.status(404).json({ error: state.error })
  if (state.isLocked) return res.json({ success: false, message: 'Already locked.', lockedAt: state.lockedAt })
  const result = setInstanceLock(instance, true)
  res.json({ success: true, message: `Instance '${instance}' locked.`, ...result })
})

// POST /api/fleet/unlock  body: { instance }
app.post('/api/fleet/unlock', (req, res) => {
  const { instance } = req.body || {}
  if (!instance) return res.status(400).json({ error: 'instance param required' })
  const state = getInstanceLockState(instance)
  if (state.error) return res.status(404).json({ error: state.error })
  if (!state.isLocked) return res.json({ success: false, message: 'Already unlocked.' })
  const result = setInstanceLock(instance, false)
  res.json({ success: true, message: `Instance '${instance}' unlocked.`, ...result })
})

// GET /api/fleet/instances  ←  already returns fleet lock info (enhanced below)


// ====== Git Management API ======
const GIT_REPOS = [
  { name: 'ClawBot Workspace', path: '/home/openclaw/.openclaw/workspace', github: 'clawbot-workspace' },
  { name: '收租提醒APP', path: '/home/openclaw/workspace/projects/rent-reminder-app', github: 'rent-reminder-app' },
  { name: 'ClawBot Dashboard', path: '/home/openclaw/.openclaw/workspace/clawbot-dashboard', github: 'clawbot-dashboard' },
  { name: '金蝶交付系统', path: '/mnt/d/kingdee-web', github: 'kingdee-web' },
  { name: 'Agent Bridge', path: '/home/openclaw/.openclaw/workspace/agent-bridge/bridge', github: 'agent-bridge' },
  { name: 'Fleet Controller', path: '/home/openclaw/.openclaw/workspace/plugins/fleet-controller', github: 'fleet-controller' },
  { name: '售前管理系统（新版）', path: '/home/openclaw/.openclaw/workspace/webdev-projects/presale-new/SHouQ', github: 'presale-webdev' },
  { name: '售前管理网站（旧版）', path: '/home/openclaw/.openclaw/workspace/webdev-projects/presale', github: 'presale-webdev' },
]

function gitExec(args, cwd) {
  try {
    const out = execSync(`git ${args}`, { cwd, encoding: 'utf8', timeout: 10000, maxBuffer: 2 * 1024 * 1024 })
    return { ok: true, out: out.trim() }
  } catch (e) {
    return { ok: false, error: e.stderr?.toString()?.trim() || e.message }
  }
}

app.get('/api/git/repos', (req, res) => {
  const result = GIT_REPOS.map(r => {
    const log = gitExec('log --oneline -1', r.path)
    const status = gitExec('status --porcelain', r.path)
    const branch = gitExec('rev-parse --abbrev-ref HEAD', r.path)
    const count = gitExec('rev-list --count HEAD', r.path)
    return {
      ...r,
      branch: branch.ok ? branch.out : '?',
      dirty: status.ok ? status.out.length > 0 : false,
      commit_count: count.ok ? parseInt(count.out) || 0 : 0,
      last_commit: log.ok ? log.out : '',
    }
  })
  res.json(result)
})

app.post('/api/git/log', (req, res) => {
  const repoPath = req.body.path || req.query.path
  if (!repoPath) return res.status(400).json({ error: 'missing path' })
  // Fetch up to 200 commits with full date
  const r = gitExec(
    `log --pretty=format:'%H|%h|%s|%ai|%an' -200`,
    repoPath
  )
  if (!r.ok) return res.json({ commits: [] })
  const commits = r.out.split('\n').filter(Boolean).map(line => {
    const parts = line.split('|')
    const hash = parts[0]
    const short_hash = parts[1]
    const author = parts[parts.length - 1] || ''
    const dateRaw = parts[parts.length - 2] || ''
    const message = parts.slice(2, -2).join('|') // handle | in message
    // Parse: 2026-08-13 01:37:00 +0800 → 8月13日 01:37
    const m = dateRaw.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/)
    let date = dateRaw
    if (m) {
      const [, , month, day, hour, min] = m
      date = `${parseInt(month)}月${parseInt(day)}日 ${hour}:${min}`
    }
    return { hash, short_hash, message, date, author, dateRaw }
  })
  res.json({ commits })
})

app.post('/api/git/status', (req, res) => {
  const repoPath = req.body.path || req.query.path
  if (!repoPath) return res.status(400).json({ error: 'missing path' })
  const r = gitExec('status --porcelain', repoPath)
  if (!r.ok) return res.json({ changes: [] })
  const changes = r.out.split('\n').filter(Boolean).map(line => ({
    status: line.slice(0, 2).trim() || '?',
    file: line.slice(3),
  }))
  res.json({ changes })
})

app.post('/api/git/reset', (req, res) => {
  const { path: repoPath, hash } = req.body
  if (!repoPath || !hash) return res.status(400).json({ error: 'missing path or hash' })
  const r = gitExec(`reset --hard ${hash}`, repoPath)
  if (!r.ok) return res.status(500).json({ error: r.error })
  res.json({ success: true, output: r.out })
})

app.post('/api/git/rollback', (req, res) => {
  const { path: repoPath, hash } = req.body
  if (!repoPath || !hash) return res.status(400).json({ error: 'missing path or hash' })
  const r = gitExec(`reset --hard ${hash}`, repoPath)
  if (!r.ok) return res.status(500).json({ error: r.error })
  res.json({ success: true, output: r.out })
})

app.post('/api/git/commit', (req, res) => {
  const { path: repoPath, message } = req.body
  if (!repoPath || !message) return res.status(400).json({ error: 'missing path or message' })
  const add = gitExec('add -A', repoPath)
  if (!add.ok) return res.status(500).json({ error: add.error })
  const commit = gitExec(`commit -m "${message.replace(/"/g, '\\"')}"`, repoPath)
  if (!commit.ok && !commit.error?.includes('nothing to commit')) {
    return res.status(500).json({ error: commit.error })
  }
  res.json({ ok: true, output: commit.out || 'nothing to commit' })
})


// Token 统计（含 MiniMax 实时配额）
// ═══════════════════════════════════════════════════════════
//  账期计算（每月16日→次月15日）
// ═══════════════════════════════════════════════════════════
const CYCLE_START_DAY = 16
const CYCLE_END_DAY   = 15

function getBillingPeriod(ts) {
  const d = ts instanceof Date ? ts : new Date(ts)
  const day = d.getDate()
  let start, end
  if (day >= CYCLE_START_DAY) {
    // 周期：当月16日 → 次月15日
    start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), CYCLE_START_DAY))
    end   = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, CYCLE_END_DAY))
  } else {
    // 周期：上月16日 → 当月15日
    start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, CYCLE_START_DAY))
    end   = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), CYCLE_END_DAY))
  }
  return {
    start: start.toISOString().slice(0, 10),
    end:   end.toISOString().slice(0, 10),
    days:  Math.ceil((end - start) / 86400000)
  }
}


function inBillingPeriod(ts, periodStart, periodEnd) {
  const d = ts instanceof Date ? ts : new Date(ts)
  const s = new Date(periodStart)
  const e = new Date(periodEnd)
  e.setHours(23, 59, 59, 999)
  return d >= s && d <= e
}

// ═══════════════════════════════════════════════════════════
// 从 trajectory.jsonl 读取真实 API 调用次数
// 口径：type=message && role=assistant
// ═══════════════════════════════════════════════════════════
function parseTs(tsStr) {
  if (!tsStr) return null
  try {
    return new Date(tsStr.replace('Z', '+00:00'))
  } catch { return null }
}

function getRangePeriod(now, range, customPeriod) {
  // 统一用 UTC 方便对比
  const toUTC = (d) => new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  const nowUTC = toUTC(now)

  if (customPeriod) {
    return {
      start: new Date(customPeriod.start + 'T00:00:00Z'),
      end:   new Date(customPeriod.end   + 'T23:59:59.999Z'),
    }
  }

  if (range === 'day' || range === 'daily') {
    const s = toUTC(now); const e = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
    return { start: s, end: e }
  }
  if (range === 'week') {
    const s = new Date(nowUTC); s.setUTCDate(s.getUTCDate() - 7)
    const e = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
    return { start: s, end: e }
  }
  if (range === 'month') {
    const s = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const e = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
    return { start: s, end: e }
  }
  // range === 'billing'（默认）每月16日→次月15日
  const bp = getBillingPeriod(now)
  const s = new Date(bp.start + 'T00:00:00Z')
  const e = new Date(bp.end   + 'T23:59:59.999Z')
  return { start: s, end: e }
}



// ── 项目部署记录 ────────────────────────────────────────────────
const DEPLOY_LOG = path.join(process.env.HOME || '/home/openclaw', '.openclaw', 'deployments.json')

function readDeployLog() {
  try {
    if (fs.existsSync(DEPLOY_LOG)) {
      return JSON.parse(fs.readFileSync(DEPLOY_LOG, 'utf8'))
    }
  } catch {}
  return {}
}

function writeDeployLog(data) {
  try {
    fs.writeFileSync(DEPLOY_LOG, JSON.stringify(data, null, 2), 'utf8')
  } catch {}
}

// GET /api/deployments — 获取所有部署记录
app.get('/api/deployments', (req, res) => {
  const { projectId } = req.query
  const log = readDeployLog()
  let records = Object.entries(log).flatMap(([pid, entries]) =>
    (entries || []).map(e => ({ projectId: pid, ...e }))
  )
  if (projectId) records = records.filter(r => r.projectId === projectId)
  records.sort((a, b) => (b.deployedAt || 0) - (a.deployedAt || 0))
  res.json({ records, total: records.length })
})

// POST /api/deployments/record — 记录一次部署
// body: { projectId, branch, gitRemote, productionUrl, deployedBy, note }
app.post('/api/deployments/record', (req, res) => {
  const { projectId, branch, gitRemote, productionUrl, deployedBy, note } = req.body || {}
  if (!projectId) return res.status(400).json({ error: '缺少 projectId' })
  const log = readDeployLog()
  if (!log[projectId]) log[projectId] = []
  const entry = {
    deployedAt: Date.now(),
    branch: branch || null,
    gitRemote: gitRemote || null,
    productionUrl: productionUrl || null,
    deployedBy: deployedBy || 'unknown',
    note: note || null,
  }
  log[projectId].push(entry)
  writeDeployLog(log)
  res.json({ ok: true, entry })
})

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
//  本地向量知识库检索 API
// ═══════════════════════════════════════════════════════════
//  本地向量知识库检索 API（查 knowledge.db / knowledge_chunks）
// ═══════════════════════════════════════════════════════════
const KNOWLEDGE_DB = require('path').join(require('os').homedir(), '.shared-memory/knowledge.db')
const MEMORY_DIR   = require('path').join(require('os').homedir(), '.shared-memory/memory')

function getKnowledgeDb() {
  const BetterSqlite3 = require('better-sqlite3')
  return new BetterSqlite3(KNOWLEDGE_DB)
}

// ── GET /api/vector/search ─────────────────────────────────────
// 全文搜索 knowledge_chunks（title / content / domain / instance 全匹配）
// 空关键词时返回最近记录，支持首页自动加载
app.get('/api/vector/search', (req, res) => {
  const { q, instance, domain, outcome, kind, limit = 30, offset = 0, date_from, date_to } = req.query
  try {
    const db = getKnowledgeDb()
    let sql = 'SELECT chunk_id, source, source_id, instance, domain, task_type, kind, title, content, conditions, outcome, model_id, created_at FROM knowledge_chunks WHERE 1=1'
    const args = []
    if (q && q.trim()) {
      const like = `%${q.trim()}%`
      sql += ' AND (title LIKE ? OR content LIKE ? OR domain LIKE ? OR instance LIKE ? OR conditions LIKE ?)'
      args.push(like, like, like, like, like)
    }
    if (instance) { sql += ' AND instance = ?'; args.push(instance) }
    if (domain)   { sql += ' AND domain = ?';   args.push(domain) }
    if (outcome)  { sql += ' AND outcome = ?';  args.push(outcome) }
    if (kind)     { sql += ' AND kind = ?';     args.push(kind) }
    // 日期过滤（date_from / date_to，格式 YYYY-MM-DD，等效于 created_at >= 'YYYY-MM-DD 00:00:00' AND created_at < 'YYYY-MM-DD+1 00:00:00'）
    if (date_from) {
      sql += ' AND created_at >= ?'
      args.push(date_from + ' 00:00:00')
    }
    if (date_to) {
      // 结束日次日 00:00:00 之前（等价于当天 23:59:59 包含）
      const [y, m, d] = date_to.split('-').map(Number)
      const nextDay = new Date(y, m - 1, d + 1)
      sql += ' AND created_at < ?'
      args.push(nextDay.toISOString().slice(0, 19).replace('T', ' '))
    }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    args.push(parseInt(limit)||30, parseInt(offset)||0)
    const rows = db.prepare(sql).all(...args)
    // 总数查询（去掉 ORDER BY 和 LIMIT/OFFSET，带同样的过滤条件）
    const baseSql = sql.replace(/\s+ORDER BY.*$/, '').replace(/\s+LIMIT\s+\?\s+OFFSET\s+\?$/, '')
    const countSql = baseSql.replace(
      'SELECT chunk_id, source, source_id, instance, domain, task_type, kind, title, content, conditions, outcome, model_id, created_at',
      'SELECT COUNT(*)'
    )
    const countArgs = args.slice(0, -2)
    const totalRow = db.prepare(countSql).get(...countArgs)
    const total = totalRow['COUNT(*)']
    db.close()
    res.json({ ok: true, q: q || '', total, limit: parseInt(limit), offset: parseInt(offset), results: rows })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── GET /api/vector/lessons ────────────────────────────────────
app.get('/api/vector/lessons', (req, res) => {
  const { instance, domain, kind, outcome, limit = 50, offset = 0 } = req.query
  try {
    const db = getKnowledgeDb()
    let sql = 'SELECT chunk_id, source, source_id, instance, domain, task_type, kind, title, content, outcome, created_at FROM knowledge_chunks WHERE 1=1'
    const args = []
    if (instance) { sql += ' AND instance = ?'; args.push(instance) }
    if (domain)   { sql += ' AND domain = ?';   args.push(domain) }
    if (kind)     { sql += ' AND kind = ?';     args.push(kind) }
    if (outcome)  { sql += ' AND outcome = ?';  args.push(outcome) }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    args.push(parseInt(limit)||50, parseInt(offset)||0)
    const rows = db.prepare(sql).all(...args)
    db.close()
    res.json({ ok: true, results: rows, limit: parseInt(limit), offset: parseInt(offset) })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── GET /api/vector/stats ─────────────────────────────────────
app.get('/api/vector/stats', (req, res) => {
  try {
    const db = getKnowledgeDb()
    const total = db.prepare('SELECT COUNT(*) FROM knowledge_chunks').get()['COUNT(*)']
    const byOutcome  = db.prepare('SELECT outcome, COUNT(*) as cnt FROM knowledge_chunks WHERE outcome IS NOT NULL GROUP BY outcome ORDER BY cnt DESC').all()
    const byInstance = db.prepare(`SELECT instance, COUNT(*) as cnt FROM knowledge_chunks WHERE instance IS NOT NULL AND instance != '' GROUP BY instance ORDER BY cnt DESC`).all()
    const byDomain   = db.prepare(`SELECT domain,  COUNT(*) as cnt FROM knowledge_chunks WHERE domain  IS NOT NULL AND domain  != '' GROUP BY domain  ORDER BY cnt DESC`).all()
    const byKind     = db.prepare(`SELECT kind,     COUNT(*) as cnt FROM knowledge_chunks WHERE kind     IS NOT NULL AND kind     != '' GROUP BY kind     ORDER BY cnt DESC`).all()
    const bySource   = db.prepare('SELECT source,   COUNT(*) as cnt FROM knowledge_chunks WHERE source   IS NOT NULL GROUP BY source   ORDER BY cnt DESC').all()
    const recent = db.prepare('SELECT created_at FROM knowledge_chunks ORDER BY created_at DESC LIMIT 1').get()
    db.close()
    res.json({ ok: true, total, byOutcome, byInstance, byDomain, byKind, bySource, lastUpdated: recent?.created_at || null })
  } catch (e) {
    console.error('[vector stats ERROR]', e.message, '| sql:', e.sql)
    res.status(500).json({ ok: false, error: e.message + ' | sql:' + (e.sql||'none') })
  }
})

// ── GET /api/vector/instances ────────────────────────────────
app.get('/api/vector/instances', (req, res) => {
  try {
    const db = getKnowledgeDb()
    const rows = db.prepare(`SELECT DISTINCT instance FROM knowledge_chunks WHERE instance IS NOT NULL AND instance != '' ORDER BY instance`).all().map(r => r.instance)
    db.close()
    res.json({ ok: true, instances: rows })
  } catch (e) {
    console.error('[vector instances ERROR]', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── GET /api/vector/domains ─────────────────────────────────
app.get('/api/vector/domains', (req, res) => {
  try {
    const db = getKnowledgeDb()
    const rows = db.prepare(`SELECT DISTINCT domain FROM knowledge_chunks WHERE domain IS NOT NULL AND domain != '' ORDER BY domain`).all().map(r => r.domain)
    db.close()
    res.json({ ok: true, domains: rows })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── GET /api/vector/recent ──────────────────────────────────
app.get('/api/vector/recent', (req, res) => {
  const { limit = 20 } = req.query
  try {
    const db = getKnowledgeDb()
    const rows = db.prepare(
      'SELECT chunk_id, source, instance, domain, kind, title, content, outcome, created_at FROM knowledge_chunks ORDER BY created_at DESC LIMIT ?'
    ).all(parseInt(limit)||20)
    db.close()
    res.json({ ok: true, results: rows })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── GET /api/vector/domain/:domain ─────────────────────────
app.get('/api/vector/domain/:domain', (req, res) => {
  const { limit=50, offset=0 } = req.query
  try {
    const db = getKnowledgeDb()
    const rows = db.prepare(
      'SELECT chunk_id, source, instance, domain, task_type, kind, title, content, outcome, created_at FROM knowledge_chunks WHERE domain=? ORDER BY created_at DESC LIMIT ? OFFSET?'
    ).all(req.params.domain, parseInt(limit)||50, parseInt(offset)||0)
    db.close()
    res.json({ ok: true, domain: req.params.domain, results: rows })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── GET /api/vector/health ─────────────────────────────────
app.get('/api/vector/health', (req, res) => {
  try {
    const db = getKnowledgeDb()
    const cnt = db.prepare('SELECT COUNT(*) FROM knowledge_chunks').get()['COUNT(*)']
    db.close()
    res.json({ ok: true, db_exists: true, chunks_count: cnt })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── GET /api/vector/health ─────────────────────────────────
app.get('/api/vector/health', (req, res) => {
  try {
    const db = getLessonsDb()
    const cnt = db.prepare('SELECT COUNT(*) FROM lessons').get()['COUNT(*)']
    db.close()
    res.json({ ok: true, db_exists: true, lessons_count: cnt })
  } catch (e) {
    res.json({ ok: true, db_exists: false, error: e.message })
  }
})

// ── 图文制作 articles 表 ────────────────────────────────────────
const CONTENT_DB_PATH = path.join(__dirname, 'projects.db')

function getArticlesDb() {
  const BetterSqlite3 = require('better-sqlite3')
  const db = new BetterSqlite3(CONTENT_DB_PATH)
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      platform TEXT DEFAULT 'wechat',
      status TEXT DEFAULT 'draft',
      author TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      summary TEXT DEFAULT '',
      content_path TEXT DEFAULT '',
      publish_time TEXT,
      remark TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  return db
}

// GET /api/content/articles
app.get('/api/content/articles', (req, res) => {
  try {
    const db = getArticlesDb()
    const { platform, status, search } = req.query
    let sql = 'SELECT * FROM articles WHERE 1=1'
    const params = []
    if (platform && platform !== 'all') { sql += ' AND platform = ?'; params.push(platform) }
    if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status) }
    if (search) { sql += ' AND (title LIKE ? OR tags LIKE ? OR summary LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`) }
    sql += ' ORDER BY updated_at DESC'
    const rows = db.prepare(sql).all(...params)
    db.close()
    // 列表返回时也渲染图片预览（用于卡片里的图）
    for (const row of rows) {
      if (row.content) {
        row.content = row.content.replace(
          /!\[([^\]]*)\]\((article_images\/[^)]+)\)/g,
          (_, alt, path) => `<img src="/images/${path.replace('article_images/','')}" alt="${alt}" style="max-width:100%;border-radius:6px;margin:12px 0;"/>`
        ).replace(
          /!\[([^\]]*)\]\((\/images\/[^)]+)\)/g,
          (_, alt, path) => `<img src="${path}" alt="${alt}" style="max-width:100%;border-radius:6px;margin:12px 0;"/>`
        )
      }
    }
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/content/articles/:id
app.get('/api/content/articles/:id', (req, res) => {
  try {
    const db = getArticlesDb()
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
    db.close()
    console.log('content type:', typeof row.content, 'len:', (row.content||'').length)
    if (!row) return res.status(404).json({ error: '文章不存在' })
    // 把 markdown 图片语法渲染为 <img> 标签，供预览使用
    if (row.content) {
      row.content = row.content.replace(
        /!\[([^\]]*)\]\((article_images\/[^)]+)\)/g,
        (_, alt, path) => `<img src="/images/${path.replace('article_images/','')}" alt="${alt}" style="max-width:100%;border-radius:6px;margin:12px 0;"/>`
      ).replace(
        /!\[([^\]]*)\]\((\/images\/[^)]+)\)/g,
        (_, alt, path) => `<img src="${path}" alt="${alt}" style="max-width:100%;border-radius:6px;margin:12px 0;"/>`
      )
    }
    res.json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/content/articles
app.post('/api/content/articles', (req, res) => {
  try {
    const { title, platform, status, author, tags, summary, content, content_path, publish_time, remark, style, cover_url } = req.body
    if (!title) return res.status(400).json({ error: '标题不能为空' })
    const db = getArticlesDb()
    const result = db.prepare(`
      INSERT INTO articles (title, platform, status, author, tags, summary, content, content_path, publish_time, remark, style, cover_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, platform||'wechat', status||'draft', author||'', tags||'', summary||'', content||'', content_path||'', publish_time||null, remark||'', style||null, cover_url||null)
    db.close()
    res.json({ id: result.lastInsertRowid, message: '创建成功' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/content/articles/:id
app.put('/api/content/articles/:id', (req, res) => {
  try {
    const { id } = req.params
    const { title, platform, status, author, tags, summary, content, content_path, publish_time, remark, style, cover_url } = req.body
    const db = getArticlesDb()
    db.prepare(`
      UPDATE articles SET
        title=?, platform=?, status=?, author=?, tags=?, summary=?,
        content=?, content_path=?, publish_time=?, remark=?, style=?, cover_url=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(title, platform, status, author, tags, summary, content, content_path, publish_time, remark, style||null, cover_url||null, id)
    db.close()
    res.json({ message: '更新成功' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/content/articles/:id
app.delete('/api/content/articles/:id', (req, res) => {
  try {
    const db = getArticlesDb()
    db.prepare('DELETE FROM articles WHERE id=?').run(req.params.id)
    db.close()
    res.json({ message: '删除成功' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const PORT = (() => {
  const idx = process.argv.indexOf('--port')
  if (idx >= 0 && process.argv[idx + 1]) return parseInt(process.argv[idx + 1])
  return 3001
})()

app.listen(PORT, () => {
  console.log(`CapCut Mate 代理已注册 → ${CAPCUT_TARGET}`)
  console.log(`Fleet API 已注册: GET/PUT /api/fleet/*`)
  console.log(`ClawHub 生态 API 已注册: GET/POST /api/clawhub/*`)
})
