#!/bin/bash
# ClawBot 服务启动脚本

echo "=========================================="
echo "    ClawBot 服务启动中..."
echo "=========================================="

# 停止旧服务
pkill -f "http-server.*3000" 2>/dev/null
pkill -f "vite.*5173" 2>/dev/null
pkill -f "kingdee-server" 2>/dev/null
sleep 2

# 启动3000端口 (ClawBot工作台)
echo "启动 3000 端口 (ClawBot 工作台)..."
cd /home/openclaw/.openclaw/workspace/scripts
node -e "
const http = require('http');
const fs = require('fs');
const path = require('path');
const server = http.createServer((req, res) => {
  let filePath = '.' + req.url.split('?')[0];
  if (filePath === './') filePath = './index.html';
  const ext = path.extname(filePath);
  const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, {'Content-Type': types[ext] || 'text/plain', 'Access-Control-Allow-Origin': '*'});
    res.end(data);
  });
});
server.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));
" > /tmp/server-3000.log 2>&1 &
sleep 1

# 启动5173端口 (金蝶交付系统 React版)
echo "启动 5173 端口 (金蝶交付系统)..."
cd /mnt/d/kingdee-web
nohup npx vite --host 0.0.0.0 --port 5173 > /tmp/vite-5173.log 2>&1 &
sleep 2

# 启动8765端口 (金蝶API)
echo "启动 8765 端口 (金蝶交付 API)..."
cd /home/openclaw/.openclaw/workspace/scripts
nohup node kingdee-server-v5.cjs > /tmp/kingdee-server.log 2>&1 &
sleep 1

# 启动8766端口 (笔记API)
echo "启动 8766 端口 (笔记 API)..."
cd /home/openclaw/.openclaw/workspace/scripts
nohup node notes-api.cjs > /tmp/notes-api.log 2>&1 &
sleep 1

echo ""
echo "=========================================="
echo "    服务启动完成！"
echo "=========================================="
echo ""
echo "🌐 访问地址:"
echo "  • ClawBot 工作台:    http://localhost:3000/"
echo "  • 金蝶交付系统:      http://localhost:5173/"
echo "  • OpenClaw 控制面板: http://localhost:18789/"
echo ""
echo "=========================================="
