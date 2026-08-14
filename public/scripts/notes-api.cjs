#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8766;
const MEMORY_DIR = path.join(__dirname, '..', 'memory');

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    if (url.pathname === '/health' || url.pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', port: PORT }));
    } else if (url.pathname === '/api/notes') {
        // 返回笔记列表
        try {
            const files = fs.readdirSync(MEMORY_DIR)
                .filter(f => f.endsWith('-learning.md') || f.endsWith('learning.md'))
                .map(f => {
                    const title = f
                        .replace(/-learning\.md$/i, '')
                        .replace(/^2026-\d{2}-\d{2}-/, '')
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, c => c.toUpperCase());
                    
                    let category = 'other';
                    const lower = f.toLowerCase();
                    if (lower.includes('kingdee') || lower.includes('erp') || lower.includes('金蝶') || 
                        lower.includes('蓝图') || lower.includes('交付') || lower.includes('实施') ||
                        lower.includes('fssc') || lower.includes('供应链') || lower.includes('财务')) {
                        category = 'kingdee';
                    } else if (lower.includes('video') || lower.includes('短视频') || lower.includes('抖音') ||
                               lower.includes('script') || lower.includes('kling') || lower.includes('ai-video')) {
                        category = 'ai-video';
                    } else if (lower.includes('business') || lower.includes('商业') || lower.includes('变现') ||
                               lower.includes('团队') || lower.includes('ip') || lower.includes('monetization')) {
                        category = 'business';
                    } else if (lower.includes('ai') || lower.includes('agent') || lower.includes('mlops') ||
                               lower.includes('multimodal') || lower.includes('llm') || lower.includes('rag')) {
                        category = 'ai-tech';
                    }
                    
                    const dateMatch = f.match(/2026-\d{2}-\d{2}/);
                    const date = dateMatch ? dateMatch[0] : '2026-03';
                    
                    return { title, file: f, category, date };
                });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ notes: files, total: files.length }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
    } else if (url.pathname === '/api/note') {
        // 返回单个笔记内容
        const file = url.searchParams.get('file');
        if (!file) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing file parameter' }));
            return;
        }
        
        try {
            const filePath = path.join(MEMORY_DIR, file);
            if (!fs.existsSync(filePath)) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'File not found' }));
                return;
            }
            
            const content = fs.readFileSync(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/markdown' });
            res.end(content);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
    } else if (url.pathname === '/api/stats') {
        // 返回统计数据
        try {
            const files = fs.readdirSync(MEMORY_DIR)
                .filter(f => f.endsWith('-learning.md') || f.endsWith('learning.md'));
            
            const categories = { kingdee: 0, 'ai-video': 0, 'ai-tech': 0, business: 0, 'data-engineering': 0, devops: 0, openclaw: 0, security: 0, other: 0 };
            
            files.forEach(f => {
                const lower = f.toLowerCase();
                let cat = 'other';
                if (lower.includes('kingdee') || lower.includes('erp') || lower.includes('金蝶') || 
                    lower.includes('蓝图') || lower.includes('交付') || lower.includes('实施') ||
                    lower.includes('fssc') || lower.includes('供应链') || lower.includes('财务')) cat = 'kingdee';
                else if (lower.includes('video') || lower.includes('短视频') || lower.includes('抖音') ||
                         lower.includes('script') || lower.includes('kling') || lower.includes('ai-video')) cat = 'ai-video';
                else if (lower.includes('business') || lower.includes('商业') || lower.includes('变现') ||
                         lower.includes('团队') || lower.includes('ip') || lower.includes('monetization')) cat = 'business';
                else if (lower.includes('ai') || lower.includes('agent') || lower.includes('mlops') ||
                         lower.includes('multimodal') || lower.includes('llm') || lower.includes('rag')) cat = 'ai-tech';
                categories[cat] = (categories[cat] || 0) + 1;
            });
            
            const hoursMatch = files.map(f => {
                const m = f.match(/(\d+)h/);
                return m ? parseInt(m[1]) : 0;
            }).reduce((a, b) => a + b, 0);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ notes: { categories, total: files.length }, hours: hoursMatch || files.length * 1 }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
    } else if (url.pathname === '/api/services') {
        // 返回服务状态
        const services = [
            { name: 'Gateway', port: 18789, url: 'http://localhost:18789/health' },
            { name: '金蝶前端', port: 5173, url: 'http://localhost:5173/' },
            { name: 'Dashboard', port: 3000, url: 'http://localhost:3000/' },
            { name: 'Notes API', port: 8766, url: 'http://localhost:8766/health' }
        ];
        
        const check = (url) => new Promise(resolve => {
            http.get(url, r => resolve(r.statusCode === 200 ? 'running' : 'stopped')).on('error', () => resolve('stopped'));
        });
        
        Promise.all(services.map(s => check(s.url).then(status => ({ ...s, status }))))
            .then(results => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ services: results }));
            });
    } else if (url.pathname === '/api/skills') {
        // 返回已安装技能列表
        const skillDirs = [
            '/home/openclaw/.npm-global/lib/node_modules/openclaw/skills',
            '/home/openclaw/.openclaw/workspace/skills'
        ];
        
        let skills = [];
        skillDirs.forEach(dir => {
            try {
                const entries = fs.readdirSync(dir);
                entries.forEach(name => {
                    const mdPath = path.join(dir, name, 'SKILL.md');
                    if (fs.existsSync(mdPath)) {
                        let desc = '';
                        try {
                            const content = fs.readFileSync(mdPath, 'utf8');
                            const m = content.match(/description[:：]\s*(.+)/i);
                            desc = m ? m[1].substring(0, 60).trim() : name;
                        } catch {}
                        
                        const iconMap = {
                            'ai-video': '🎬', 'video': '🎬', 'short-video': '🎬',
                            'content': '✍️', 'writing': '✍️', 'chinese': '✍️',
                            'browser': '🌐', 'agent': '🤖', 'automation': '⚡',
                            'bilibili': '📺', 'douyin': '📱', 'data': '📊',
                            'calendar': '📅', 'email': '📧', 'weather': '🌤',
                            'image': '🖼️', 'translate': '🌍', 'git': '📦',
                            'kingdee': '📘', 'erp': '📘',
                        };
                        let icon = '🔧';
                        for (const [k, v] of Object.entries(iconMap)) {
                            if (name.includes(k)) { icon = v; break; }
                        }
                        
                        skills.push({ name, desc, icon, source: dir.includes('workspace') ? 'workspace' : 'global' });
                    }
                });
            } catch {}
        });
        
        skills.sort((a, b) => a.name.localeCompare(b.name));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ skills, total: skills.length }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`📚 Notes API running at http://localhost:${PORT}`);
    console.log(`   GET /api/notes - List all notes`);
    console.log(`   GET /api/note?file=xxx.md - Get note content`);
});