/**
 * 金蝶交付系统服务器 v4.0 - 智能生成版
 * 支持文档关联链：客户信息 → 调研报告 → 业务蓝图 → UAT测试 → 上线汇报
 */

import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8765;
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const SCRIPTS_DIR = __dirname;
const MEMORY_DIR = path.join(__dirname, '..', 'memory');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// MIME类型
const MIME_TYPES = {
    '.html': 'text/html;charset=utf-8',
    '.css': 'text/css;charset=utf-8',
    '.js': 'application/javascript;charset=utf-8',
    '.json': 'application/json;charset=utf-8',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

// 服务器
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        // API路由
        if (pathname === '/api/generate') {
            await handleGenerate(req, res, parsedUrl.query);
        } else if (pathname === '/api/download') {
            await handleDownload(req, res, parsedUrl.query);
        } else if (pathname === '/api/files') {
            await handleFiles(req, res);
        } else if (pathname === '/api/customer/save') {
            await handleCustomerSave(req, res);
        } else if (pathname === '/api/customer/load') {
            await handleCustomerLoad(req, res, parsedUrl.query);
        } else if (pathname === '/api/memory/list') {
            await handleMemoryList(req, res);
        } else {
            // 静态文件
            await handleStatic(req, res, pathname);
        }
    } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json;charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: error.message }));
    }
});

// 生成文档
async function handleGenerate(req, res, query) {
    const { type, companyName, customerCode, industry, companySize, employees, revenue, modules } = query;

    if (!type || !companyName) {
        res.writeHead(400, { 'Content-Type': 'application/json;charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: '缺少必要参数' }));
        return;
    }

    console.log(`生成文档: ${type} - ${companyName}`);

    // 构建Python命令
    const pythonScript = path.join(SCRIPTS_DIR, 'kingdee-smart-generator-v4.py');
    const args = [
        '--type', type,
        '--companyName', companyName,
        '--customerCode', customerCode || 'CUSTOMER',
        '--industry', industry || '制造业',
        '--companySize', companySize || '中型企业',
        '--employees', employees || '',
        '--revenue', revenue || '',
        '--modules', modules || 'finance,supply'
    ];

    const command = `python3 "${pythonScript}" ${args.map(arg => `"${arg}"`).join(' ')}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('执行错误:', error);
            res.writeHead(500, { 'Content-Type': 'application/json;charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: error.message }));
            return;
        }

        try {
            const result = JSON.parse(stdout);
            res.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });
            res.end(JSON.stringify(result));
        } catch (e) {
            console.error('解析错误:', e);
            res.writeHead(500, { 'Content-Type': 'application/json;charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: '解析生成结果失败' }));
        }
    });
}

// 下载文件
async function handleDownload(req, res, query) {
    const { filename } = query;

    if (!filename) {
        res.writeHead(400, { 'Content-Type': 'application/json;charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: '缺少文件名' }));
        return;
    }

    const filepath = path.join(OUTPUT_DIR, filename);

    if (!fs.existsSync(filepath)) {
        res.writeHead(404, { 'Content-Type': 'application/json;charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: '文件不存在' }));
        return;
    }

    const ext = path.extname(filename);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
}

// 文件列表
async function handleFiles(req, res) {
    const files = fs.readdirSync(OUTPUT_DIR)
        .filter(f => f.endsWith('.docx') || f.endsWith('.pptx') || f.endsWith('.xlsx'))
        .map(f => {
            const stat = fs.statSync(path.join(OUTPUT_DIR, f));
            return {
                name: f,
                size: stat.size,
                time: stat.mtime
            };
        })
        .sort((a, b) => b.time - a.time);

    res.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });
    res.end(JSON.stringify({ success: true, files }));
}

// 保存客户信息
async function handleCustomerSave(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const customer = JSON.parse(body);
            const customerFile = path.join(MEMORY_DIR, `customer-${customer.customerCode || 'default'}.json`);
            fs.writeFileSync(customerFile, JSON.stringify(customer, null, 2), 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });
            res.end(JSON.stringify({ success: true }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json;charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

// 加载客户信息
async function handleCustomerLoad(req, res, query) {
    const { customerCode } = query;
    const customerFile = path.join(MEMORY_DIR, `customer-${customerCode || 'default'}.json`);

    if (fs.existsSync(customerFile)) {
        const customer = JSON.parse(fs.readFileSync(customerFile, 'utf8'));
        res.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });
        res.end(JSON.stringify({ success: true, customer }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json;charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: '客户信息不存在' }));
    }
}

// 记忆文件列表
async function handleMemoryList(req, res) {
    const files = fs.readdirSync(MEMORY_DIR)
        .filter(f => f.startsWith('kingdee-') && f.endsWith('.md'))
        .map(f => {
            const stat = fs.statSync(path.join(MEMORY_DIR, f));
            return {
                name: f,
                size: stat.size,
                time: stat.mtime
            };
        })
        .sort((a, b) => b.time - a.time);

    res.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });
    res.end(JSON.stringify({ success: true, files }));
}

// 静态文件
async function handleStatic(req, res, pathname) {
    let filepath = pathname === '/' 
        ? path.join(__dirname, 'kingdee-delivery-v8.html')
        : path.join(__dirname, pathname);

    const ext = path.extname(filepath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    if (!fs.existsSync(filepath)) {
        res.writeHead(404, { 'Content-Type': 'text/html;charset=utf-8' });
        res.end('<h1>404 Not Found</h1>');
        return;
    }

    res.setHeader('Content-Type', mimeType);
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
}

// 启动服务器
server.listen(PORT, () => {
    console.log(`金蝶交付系统服务器 v4.0 已启动`);
    console.log(`访问地址: http://localhost:${PORT}`);
    console.log(`输出目录: ${OUTPUT_DIR}`);
    console.log(`脚本目录: ${SCRIPTS_DIR}`);
    console.log(`记忆目录: ${MEMORY_DIR}`);
});
