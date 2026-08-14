#!/usr/bin/env node
/**
 * 金蝶交付系统API服务器
 * 支持PPT和Word文档生成下载
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8765;
const OUTPUT_DIR = path.join(process.env.HOME, '.openclaw/workspace/output');
const SCRIPT_PATH = path.join(process.env.HOME, '.openclaw/workspace/scripts/kingdee-generator.py');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API: 生成文档
    if (req.method === 'POST' && req.url === '/api/generate') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { type, data } = JSON.parse(body);
                const cmd = `python3 "${SCRIPT_PATH}" ${type} '${JSON.stringify(data)}'`;
                
                exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error:', error, stderr);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                        return;
                    }
                    
                    try {
                        const result = JSON.parse(stdout);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } catch (e) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Parse error: ' + e.message }));
                    }
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // 下载文件
    if (req.method === 'GET' && req.url.startsWith('/download/')) {
        let filename = req.url.replace('/download/', '');
        filename = decodeURIComponent(filename);  // 解码URL编码的文件名
        const filepath = path.join(OUTPUT_DIR, filename);
        
        console.log('Download request:', req.url);
        console.log('Decoded filename:', filename);
        console.log('Filepath:', filepath);
        console.log('File exists:', fs.existsSync(filepath));
        
        if (fs.existsSync(filepath)) {
            const stat = fs.statSync(filepath);
            const ext = path.extname(filename);
            const contentType = ext === '.pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                              : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                              : 'application/octet-stream';
            
            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': stat.size,
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
            });
            fs.createReadStream(filepath).pipe(res);
        } else {
            console.log('File not found:', filepath);
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
        }
        return;
    }

    // 静态文件服务
    let filepath = req.url === '/' ? '/kingdee-delivery-v7.html' : req.url;
    filepath = path.join(process.env.HOME, '.openclaw/workspace/scripts', filepath);
    
    if (fs.existsSync(filepath) && fs.statSync(filepath).isFile()) {
        const ext = path.extname(filepath);
        const contentTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json'
        };
        
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        fs.createReadStream(filepath).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`金蝶交付系统服务器运行在 http://localhost:${PORT}`);
    console.log(`访问地址: http://localhost:${PORT}/kingdee-delivery-v7.html`);
});
