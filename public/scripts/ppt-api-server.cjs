/**
 * 金蝶交付文档生成API服务
 * 端口: 8766
 * 支持: PPT生成、Word文档生成、调研问卷生成
 */

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 8766;
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const PPT_SCRIPT = path.join(__dirname, 'generate-presales-ppt.py');
const SURVEY_SCRIPT = path.join(__dirname, 'kingdee-survey-questionnaire-generator.py');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // ========== 调研问卷生成 API ==========
    if (req.method === 'POST' && req.url === '/api/generate-survey') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('收到调研问卷生成请求:', JSON.stringify(data).substring(0, 200));
                
                // 保存数据到临时文件
                const tempDataPath = path.join(OUTPUT_DIR, 'survey_temp_data.json');
                fs.writeFileSync(tempDataPath, JSON.stringify(data, null, 2));
                
                // 执行Python脚本
                const cmd = `python3 "${SURVEY_SCRIPT}" '${JSON.stringify(data).replace(/'/g, "'\\''")}'`;
                
                exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('调研问卷生成错误:', error, stderr);
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({ success: false, error: error.message }));
                        return;
                    }
                    
                    try {
                        const result = JSON.parse(stdout.trim());
                        console.log('调研问卷生成成功, 文件数:', result.count);
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify(result));
                    } catch (e) {
                        console.error('解析Python输出错误:', e, stdout);
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({ success: false, error: '解析结果失败' }));
                    }
                });
            } catch (e) {
                console.error('解析错误:', e);
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }
    
    // ========== PPT生成 API ==========
    if (req.method === 'POST' && req.url === '/api/generate-ppt') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const customerCode = data.customerCode || data.companyName?.substring(0, 4) || 'XXX';
                const filename = `${customerCode}_售前解决方案.pptx`;
                const outputPath = path.join(OUTPUT_DIR, filename);
                
                // 保存数据到临时文件
                const tempDataPath = path.join(OUTPUT_DIR, 'temp_data.json');
                fs.writeFileSync(tempDataPath, JSON.stringify(data, null, 2));
                
                // 执行Python脚本
                const cmd = `python3 "${PPT_SCRIPT}" '${JSON.stringify(data).replace(/'/g, "'\\''")}'`;
                
                exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('PPT生成错误:', error, stderr);
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({ success: false, error: error.message }));
                        return;
                    }
                    
                    console.log('PPT生成成功:', filename);
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({
                        success: true,
                        filename: filename,
                        downloadUrl: `/download/${filename}`
                    }));
                });
            } catch (e) {
                console.error('解析错误:', e);
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }
    
    // ========== 下载文件 ==========
    if (req.method === 'GET' && req.url.startsWith('/download/')) {
        const filename = decodeURIComponent(req.url.replace('/download/', ''));
        const filePath = path.join(OUTPUT_DIR, filename);
        
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            const ext = path.extname(filename).toLowerCase();
            let contentType = 'application/octet-stream';
            if (ext === '.pptx') contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (ext === '.zip') contentType = 'application/zip';
            
            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': stat.size,
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
            });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('File not found');
        }
        return;
    }
    
    // ========== 列出已生成的文件 ==========
    if (req.method === 'GET' && req.url === '/api/list-files') {
        fs.readdir(OUTPUT_DIR, (err, files) => {
            if (err) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ success: false, error: err.message }));
                return;
            }
            const docFiles = files.filter(f => f.endsWith('.pptx') || f.endsWith('.docx')).map(f => ({
                filename: f,
                downloadUrl: `/download/${f}`,
                created: fs.statSync(path.join(OUTPUT_DIR, f)).mtime
            }));
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ success: true, files: docFiles }));
        });
        return;
    }

    // ========== 删除文件 ==========
    if (req.method === 'GET' && req.url.startsWith('/api/delete?filename=')) {
        const filename = decodeURIComponent(req.url.replace('/api/delete?filename=', ''));
        const filePath = path.join(OUTPUT_DIR, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ success: true, message: '删除成功' }));
        } else {
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ success: false, error: '文件不存在' }));
        }
        return;
    }
    
    // 健康检查
    if (req.method === 'GET' && (req.url === '/health' || req.url === '/api/health')) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ status: 'ok', port: PORT }));
        return;
    }
    
    // 默认
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`金蝶交付文档生成服务已启动: http://localhost:${PORT}`);
    console.log(`API端点:`);
    console.log(`  POST /api/generate-survey - 生成调研问卷(根据子模块)`);
    console.log(`  POST /api/generate-ppt - 生成PPT`);
    console.log(`  GET  /download/:filename - 下载文件`);
    console.log(`  GET  /api/list-files - 列出已生成的文件`);
    console.log(`  GET  /api/health - 健康检查`);
});
