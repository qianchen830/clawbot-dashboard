const express = require('express')
const cors = require('cors')
const { spawn, execSync, spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

function execCmd(cmd) {
  return new Promise((resolve, reject) => {
    const proc = spawn('/bin/bash', ['-c', cmd], { timeout: 30000 })
    let stdout = '', stderr = ''
    proc.stdout.on('data', d => stdout += d)
    proc.stderr.on('data', d => stderr += d)
    proc.on('close', code => resolve({ code, stdout, stderr }))
    proc.on('error', reject)
  })
}

app.post('/api/exec', async (req, res) => {
  try {
    const { cmd } = req.body
    if (!cmd) return res.status(400).json({ error: '缺少cmd参数' })
    const allowed = cmd.match(/^python3.*feishu-dedup\.py/)
    if (!allowed) return res.status(403).json({ error: '不允许的命令' })
    const result = await execCmd(cmd)
    res.json({ code: result.code, stdout: result.stdout, stderr: result.stderr })
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

app.get('/api/service-status', async (req, res) => {
  try {
    const services = [
      { name: 'OpenClaw Gateway', port: 18789, checkHost: 'localhost' },
      { name: 'ClawBot Vite', port: 5174, checkHost: 'localhost' },
      { name: '金蝶前端', port: 5173, checkHost: 'localhost' },
      { name: '金蝶后端', port: 8766, checkHost: 'localhost' },
      { name: '金蝶任务队列', port: 8768, checkHost: 'localhost' },
      { name: '知识中心API', port: 3001, checkHost: 'localhost' },
      { name: 'Hermes Bridge', port: 3002, checkHost: 'localhost' },
      { name: 'Volcano Embedding', port: 3011, checkHost: 'localhost' },
      { name: 'EKKO WebUI', port: 5175, checkHost: 'localhost' },
      { name: 'CapCut Mate', port: 30001, checkHost: 'localhost' },
      { name: 'Docker-shortvideo', port: 18809, checkHost: 'localhost' },
      { name: 'Docker-kingdee', port: 18829, checkHost: 'localhost' },
      { name: 'Docker-print3d', port: 18849, checkHost: 'localhost' },
      { name: 'Docker-ai-game', port: 18869, checkHost: 'localhost' },
      { name: 'Hermes Studio', port: 8648, checkHost: 'localhost' },
      { name: 'Hermes Bus', port: 18766, checkHost: 'localhost' },
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

const CATEGORIES = {
  '自研技能': ['self-built-placeholder'],
  '金蝶ERP': ['kingdee', 'kd-', '金蝶', 'erp', '苍穹', '星瀚'],
  '短视频': ['video', '抖音', '快手', 'bili', 'bilibili', '视频', '字幕'],
  '内容创作': ['content', 'writing', '创作', '文案', 'seo', '小红书', 'social'],
  'AI模型': ['image', 'tts', 'voice', 'speech', 'translate', '翻译', 'gemini'],
  '效率工具': ['excel', 'docx', 'word', 'ppt', 'chart', 'pdf', '文档', '表格'],
  '浏览器': ['browser', 'browser-use', 'automation', 'agent-browser'],
  '代码': ['git', 'code', 'audit', 'ci/cd', 'cicd'],
  '知识管理': ['knowledge', 'memory', 'note'],
  '自动化': ['automation', 'workflow', '自动化'],
}

// 自研技能白名单：ClawBot从零开发 或 基于第三方技能深度改造的，都加到这里
// 规则：自研 + 改过别人的技能 = 自研（陈总确认 2026-06-09）
const SELF_BUILT = new Set([
  'kingdee-delivery', 'gap-analysis-table', '差异分析表生成', 'interface-list-generator',
  'Kingdee-meeting-minutes-v2.0.0', 'REQUIREMENTS-transform-v2.0.0',
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
}

function selfBuiltDescription(name) {
  const norm = normalizeSkillName(name)
  // 优先用原始key（如 weekly-report-excel-v1.0.0），再用规范化key（如 weekly-report-excel）
  return SELF_BUILT_DESCRIPTIONS[name] || SELF_BUILT_DESCRIPTIONS[norm] || ''
}

function detectCategory(name, desc) {
  if (SELF_BUILT.has(name)) return '自研技能'
  const text = (name + ' ' + desc).toLowerCase()
  for (const [cat, kws] of Object.entries(CATEGORIES)) {
    if (kws.some(k => text.includes(k.toLowerCase()))) return cat
  }
  return '其他'
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

app.get('/api/skills', async (req, res) => {
  try {
    const SKILL_DIR = '/home/openclaw/.openclaw/workspace/skills'
    const ZIP_DIR = '/mnt/f/技能'

    const installed = []
    const installedKeys = new Set()
    try {
      const dirs = execSync(`ls "${SKILL_DIR}"`).toString().trim().split('\n').filter(Boolean)
      for (const name of dirs) {
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
          installed.push({
            name,
            description: desc,
            version: ver,
            author,
            category: detectCategory(name, desc),
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

// ── Fleet 实例集群 API ────────────────────────────────────────────────────
const FLEET_INSTANCES_DIR = '/home/openclaw/docker-openclaw/instances'

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
      model_info: extractModelInfo(mainCfg),
    }
  } catch {}
  if (!fs.existsSync(FLEET_INSTANCES_DIR)) return masterEntry ? [masterEntry] : []
  const instances = [masterEntry].filter(Boolean)
  for (const id of fs.readdirSync(FLEET_INSTANCES_DIR)) {
    const metaPath = `${FLEET_INSTANCES_DIR}/${id}/instance.json`
    if (!fs.existsSync(metaPath)) continue
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
      let feishu_app_id = '', feishu_app_secret = '', feishu_connected = false, gateway_token = ''
      let model_info = null
      const instCfgPath = `${FLEET_INSTANCES_DIR}/${id}/.openclaw/openclaw.json`
      if (fs.existsSync(instCfgPath)) {
        try {
          const instCfg = JSON.parse(fs.readFileSync(instCfgPath, 'utf8'))
          feishu_app_id = instCfg.channels?.feishu?.appId || ''
          feishu_app_secret = instCfg.channels?.feishu?.appSecret || ''
          feishu_connected = instCfg.channels?.feishu?.enabled || false
          gateway_token = instCfg.gateway?.auth?.token || instCfg.gateway?.remote?.token || ''
          model_info = extractModelInfo(instCfg)
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
      })
    } catch {}
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

app.post('/api/fleet/instances/:id/restart', (req, res) => {
  const { id } = req.params
  if (id === 'master') return res.status(400).json({ error: '主控不支持此操作，请通过系统服务管理' })
  const { execSync } = require('child_process')
  try {
    execSync('cd /home/openclaw/docker-openclaw && sudo docker compose restart ' + id, { stdio: 'pipe' })
    res.json({ ok: true, message: `实例 ${id} 重启指令已发送` })
  } catch (e) { res.status(500).json({ error: `重启失败: ${e.message}` }) }
})

app.post('/api/fleet/instances/:id/stop', (req, res) => {
  const { id } = req.params
  if (id === 'master') return res.status(400).json({ error: '主控不支持此操作' })
  const { execSync } = require('child_process')
  try {
    execSync('cd /home/openclaw/docker-openclaw && sudo docker compose stop ' + id, { stdio: 'pipe' })
    res.json({ ok: true, message: `实例 ${id} 已停止` })
  } catch (e) { res.status(500).json({ error: `停止失败: ${e.message}` }) }
})

app.post('/api/fleet/instances/:id/start', (req, res) => {
  const { id } = req.params
  if (id === 'master') return res.status(400).json({ error: '主控不支持此操作' })
  const { execSync } = require('child_process')
  try {
    execSync('cd /home/openclaw/docker-openclaw && sudo docker compose start ' + id, { stdio: 'pipe' })
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

// ====== Git Management API ======
const GIT_REPOS = [
  { name: 'ClawBot Workspace', path: '/home/openclaw/.openclaw/workspace', github: 'clawbot-workspace' },
  { name: '收租提醒APP', path: '/home/openclaw/workspace/projects/rent-reminder-app', github: 'rent-reminder-app' },
  { name: 'ClawBot Dashboard', path: '/home/openclaw/.openclaw/workspace/clawbot-dashboard', github: 'clawbot-dashboard' },
  { name: '金蝶交付系统', path: '/mnt/d/kingdee-web', github: 'kingdee-web' },
  { name: 'Agent Bridge', path: '/home/openclaw/.openclaw/workspace/agent-bridge/bridge' },
  { name: 'Fleet Controller', path: '/home/openclaw/.openclaw/workspace/plugins/fleet-controller' },
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

app.get('/api/git/log', (req, res) => {
  const repoPath = req.query.path
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

app.get('/api/git/status', (req, res) => {
  const repoPath = req.query.path
  if (!repoPath) return res.status(400).json({ error: 'missing path' })
  const r = gitExec('status --porcelain', repoPath)
  if (!r.ok) return res.json({ changes: [] })
  const changes = r.out.split('\n').filter(Boolean).map(line => ({
    status: line.slice(0, 2).trim() || '?',
    file: line.slice(3),
  }))
  res.json({ changes })
})

app.post('/api/git/rollback', (req, res) => {
  const { path: repoPath, hash } = req.body
  if (!repoPath || !hash) return res.status(400).json({ error: 'missing path or hash' })
  const r = gitExec(`reset --hard ${hash}`, repoPath)
  if (!r.ok) return res.status(500).json({ error: r.error })
  res.json({ ok: true, output: r.out })
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

// ── Token Stats ──────────────────────────────────────────────
function readSessionsJson(agentsPath) {
  const storePath = path.join(agentsPath, 'sessions', 'sessions.json')
  if (!fs.existsSync(storePath)) return {}
  try { return JSON.parse(fs.readFileSync(storePath, 'utf8')) } catch { return {} }
}

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

// MiniMax Coding Plan 实时配额查询（兼容 Node.js 26）
async function fetchMinimaxQuota() {
  try {
    const cfg = JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/openclaw.json', 'utf8'))
    const minimax = cfg?.models?.providers?.minimax
    if (!minimax?.apiKey) return null
    const url = `${minimax.baseUrl}/token_plan/remains`
    
    // 手动实现 timeout（AbortSignal.timeout 在 Node 26 中不可用）
    const controller = { aborted: false }
    const timer = setTimeout(() => { controller.aborted = true }, 8000)
    
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${minimax.apiKey}` },
    })
    clearTimeout(timer)
    if (!res.ok || controller.aborted) return null
    
    const data = await res.json()
    const models = data?.model_remains || []
    const general = models.find(m => m.model_name === 'general') || {}
    const video = models.find(m => m.model_name === 'video') || {}
    return {
      general: {
        intervalPercent: general.current_interval_remaining_percent ?? 0,
        weeklyPercent: general.current_weekly_remaining_percent ?? 0,
        remainsTime: general.remains_time ?? 0,
      },
      video: {
        intervalPercent: video.current_interval_remaining_percent ?? 0,
        weeklyPercent: video.current_weekly_remaining_percent ?? 0,
        remainsTime: video.remains_time ?? 0,
      },
    }
  } catch {
    return null
  }
}

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

async function countCallsFromTrajectory(sessions, periodStart, periodEnd) {
  const byModel = {}
  const byDay   = {}
  let totalCalls = 0

  for (const [key, session] of Object.entries(sessions)) {
    const sf = session.sessionFile
    if (!sf || !fs.existsSync(sf)) continue

    try {
      const lines = fs.readFileSync(sf, 'utf8').trim().split('\n')
      for (const line of lines) {
        let d
        try { d = JSON.parse(line) } catch { continue }
        if (d.type !== 'message') continue
        const msg = d.message || {}
        if (msg.role !== 'assistant') continue
        const ts = parseTs(d.timestamp)
        if (!ts || ts < periodStart || ts > periodEnd) continue

        totalCalls++
        const model = msg.model || msg.provider || 'unknown'
        byModel[model] = (byModel[model] || 0) + 1

        const day = ts.toISOString().slice(0, 10)
        byDay[day] = byDay[day] || { calls: 0 }
        byDay[day].calls++
      }
    } catch {}
  }

  return { totalCalls, byModel, byDay }
}

// GET /api/token/stats — 轻量版：只依赖 cc-stats，不做慢 IO
app.get('/api/token/stats', async (req, res) => {
  const fmtNum = (n) => { if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return String(n) }
  const fmtDate = (d) => d.toISOString().slice(0, 10)

  const now = new Date()
  const range = req.query.range || 'billing'
  const billingPeriod = getBillingPeriod(now)
  const rangePeriod = getRangePeriod(now, range, null)

  const result = {
    range,
    billingPeriod,
    periodStart: fmtDate(rangePeriod.start),
    periodEnd:   fmtDate(rangePeriod.end),
    totalTokens: 0,
    totalTokensFmt: '0',
    totalCalls: 0,
    currentSession: null,
    byModel: [],
    byDay: [],
    sessions: [],
    minimaxQuota: null,
    ccSwitch: null,
  }

  // MiniMax 实时配额（5 秒超时保护）
  try {
    const quota = await Promise.race([
      fetchMinimaxQuota(),
      new Promise(r => setTimeout(() => r(null), 5000))
    ])
    result.minimaxQuota = quota
  } catch {}

  // 从 CC-Switch 数据库读取多实例真实用量（异步，不阻塞）
  try {
    const startTs = Math.floor(rangePeriod.start.getTime() / 1000)
    const endTs   = Math.floor(rangePeriod.end.getTime() / 1000)
    const ccRaw = execSync(
      `python3 /home/openclaw/.openclaw/workspace/scripts/cc_stats_reader.py ${startTs} ${endTs}`,
      { timeout: 8000 }
    )
    const cc = JSON.parse(ccRaw.toString())
    if (cc && cc.total_calls > 0) {
      result.totalCalls = cc.total_calls
      result.totalTokens = cc.total_input_tokens + cc.total_output_tokens
      result.totalTokensFmt = fmtNum(result.totalTokens)
      result.byModel = Object.entries(cc.by_model || {}).map(([model, d]) => ({
        model,
        tokens: d.input_tokens + d.output_tokens,
        tokensFmt: fmtNum(d.input_tokens + d.output_tokens),
        calls: d.calls,
        input_tokens: d.input_tokens,
        output_tokens: d.output_tokens,
      }))
      result.byDay = Object.entries(cc.by_day || {}).map(([date, d]) => ({
        date,
        tokens: d.input_tokens + d.output_tokens,
        tokensFmt: fmtNum(d.input_tokens + d.output_tokens),
        calls: d.calls,
      }))
      result.ccSwitch = {
        total_calls: cc.total_calls,
        total_input_tokens: cc.total_input_tokens,
        total_output_tokens: cc.total_output_tokens,
        total_input_tokens_fmt: fmtNum(cc.total_input_tokens),
        total_output_tokens_fmt: fmtNum(cc.total_output_tokens),
        source: 'cc-switch-db',
        multi_instance: true,
      }
    }
  } catch(e) {
    // CC-Switch 数据不可用，优雅降级
    result.ccSwitch = null
  }

  res.json(result)
})

// GET /api/cc-stats — 从 CC-Switch 数据库读取多实例汇总用量（支持多实例）
// Query: start=YYYY-MM-DD, end=YYYY-MM-DD
app.get('/api/cc-stats', async (req, res) => {
  try {
    const { start, end } = req.query
    const now = new Date()
    const startDate = start || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const endDate = end || now.toISOString().slice(0, 10)

    // 转换日期为 Unix timestamp
    const startTs = Math.floor(new Date(startDate + 'T00:00:00Z').getTime() / 1000)
    const endTs = Math.floor(new Date(endDate + 'T23:59:59Z').getTime() / 1000)

    const { execSync } = require('child_process')
    const env = { ...process.env, START_TS: String(startTs), END_TS: String(endTs) }
    const raw = execSync('python3 /home/openclaw/.openclaw/workspace/scripts/cc_stats_reader.py', { env, timeout: 10000 })
    const cc = JSON.parse(raw.toString())

    // 格式化
    const fmt = (n) => { if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return String(n) }

    res.json({
      period: { start: startDate, end: endDate },
      total_calls: cc.total_calls,
      total_input_tokens: cc.total_input_tokens,
      total_output_tokens: cc.total_output_tokens,
      total_input_tokens_fmt: fmt(cc.total_input_tokens),
      total_output_tokens_fmt: fmt(cc.total_output_tokens),
      by_model: Object.entries(cc.by_model).map(([model, d]) => ({
        model,
        calls: d.calls,
        input_tokens: d.input_tokens,
        output_tokens: d.output_tokens,
        input_tokens_fmt: fmt(d.input_tokens),
        output_tokens_fmt: fmt(d.output_tokens),
      })),
      by_day: Object.entries(cc.by_day).map(([date, d]) => ({
        date,
        calls: d.calls,
        input_tokens: d.input_tokens,
        output_tokens: d.output_tokens,
      })),
      source: 'cc-switch-db',
      multi_instance: true,
    })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`CapCut Mate 代理已注册 → ${CAPCUT_TARGET}`)
  console.log(`Fleet API 已注册: GET/PUT /api/fleet/*`)
  console.log(`CC-Switch 多实例统计已注册: GET /api/cc-stats`)
})
