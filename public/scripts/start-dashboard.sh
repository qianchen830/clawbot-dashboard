#!/bin/bash
# 工作台服务启动脚本
# 同时启动Dashboard和同步服务

echo "🚀 启动 ClawBot 工作台服务..."

# 1. 启动Dashboard HTTP服务 (端口3000)
if ! netstat -tlnp 2>/dev/null | grep -q ":3000 " && ! ss -tlnp 2>/dev/null | grep -q ":3000 "; then
    echo "📡 启动 Dashboard 服务 (端口 3000)..."
    cd /home/openclaw/.openclaw/workspace
    nohup python3 -m http.server 3000 --bind 0.0.0.0 > /tmp/dashboard-server.log 2>&1 &
    sleep 2
    echo "   ✅ Dashboard 已启动: http://localhost:3000/dashboard.html"
else
    echo "   ✅ Dashboard 已在运行"
fi

# 2. 执行一次数据同步
echo "📊 同步工作台数据..."
/home/openclaw/.openclaw/workspace/scripts/sync-dashboard.sh

# 3. 显示服务状态
echo ""
echo "📋 服务状态:"
echo "├── Dashboard: http://localhost:3000/dashboard.html"
echo "├── 金蝶交付系统: http://localhost:5173/"
echo "└── 前端React: http://localhost:5173/"
echo ""
echo "💡 数据同步命令: /home/openclaw/.openclaw/workspace/scripts/sync-dashboard.sh"
