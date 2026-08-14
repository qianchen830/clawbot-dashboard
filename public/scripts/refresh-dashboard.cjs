#!/usr/bin/env node
// 刷新 Dashboard 静态数据的脚本
// 从 HEARTBEAT.md 和 MEMORY.md 读取最新数据，更新 dashboard.html

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/home/openclaw/.openclaw/workspace';
const DASHBOARD = path.join(WORKSPACE, 'dashboard.html');
const HEARTBEAT = path.join(WORKSPACE, 'HEARTBEAT.md');
const MEMORY = path.join(WORKSPACE, 'memory/2026-04-08.md');

function extractStat(pattern, fallback) {
    try {
        const content = fs.readFileSync(HEARTBEAT, 'utf8');
        const match = content.match(pattern);
        return match ? match[1] : fallback;
    } catch { return fallback; }
}

function extractMemoryStat(pattern, fallback) {
    try {
        const content = fs.readFileSync(MEMORY, 'utf8');
        const match = content.match(pattern);
        return match ? match[1] : fallback;
    } catch { return fallback; }
}

const stage = extractStat(/阶段[:：]\s*第?(\d+)/, '86');
const hours = extractStat(/累计学习[:：]\s*(\d+)/, '183');
const topics = extractStat(/已学主题[:：]\s*(\d+)/, '182');

// 统计笔记数量
let noteCount = '0';
try {
    const memDir = path.join(WORKSPACE, 'memory');
    const files = fs.readdirSync(memDir).filter(f => 
        f.endsWith('-learning.md') || f.endsWith('learning.md')
    );
    noteCount = String(files.length);
} catch {}

// 动态统计 skills 数量
const skillDirs = [
    '/home/openclaw/.npm-global/lib/node_modules/openclaw/skills',
    '/home/openclaw/.openclaw/workspace/skills'
];
let skillCount = 0;
skillDirs.forEach(dir => {
    try {
        const entries = fs.readdirSync(dir);
        entries.forEach(name => {
            if (fs.existsSync(path.join(dir, name, 'SKILL.md'))) skillCount++;
        });
    } catch {}
});
skillCount = String(skillCount);

console.log(`Updating dashboard: stage=${stage}, hours=${hours}, topics=${topics}, notes=${noteCount}, skills=${skillCount}`);

// 更新 dashboard.html 中的静态数据
let html = fs.readFileSync(DASHBOARD, 'utf8');

html = html.replace(
    /学习阶段[:：]?\s*\d+\s*(?:·\s*累计[:：]?\s*\d+小时)?/g,
    `学习阶段: ${stage} · 累计: ${hours}小时`
);

html = html.replace(
    /<strong>学习阶段:<\/strong>\s*\d+/g,
    `<strong>学习阶段:</strong> ${stage}`
);
html = html.replace(
    /<strong>累计学习:<\/strong>\s*\d+小时/g,
    `<strong>累计学习:</strong> ${hours}小时`
);
html = html.replace(
    /<strong>学习笔记:<\/strong>\s*[\d+]+/g,
    `<strong>学习笔记:</strong> ${noteCount}+`
);
html = html.replace(
    /<strong>已安装Skills:<\/strong>\s*[\d+]+/g,
    `<strong>已安装Skills:</strong> ${skillCount}+`
);

fs.writeFileSync(DASHBOARD, html);
console.log('Dashboard updated ✅');
