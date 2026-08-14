#!/bin/bash
# 后台同步守护进程
# 每60秒更新一次工作台数据

SCRIPT="/home/openclaw/.openclaw/workspace/scripts/sync-dashboard.sh"
LOG_FILE="/tmp/dashboard-sync.log"
PID_FILE="/tmp/dashboard-sync.pid"

# 检查是否已经在运行
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "同步服务已在运行 (PID: $OLD_PID)"
        exit 0
    fi
fi

# 写入PID
echo $$ > "$PID_FILE"

echo "📊 工作台同步服务启动"
echo "├── 更新间隔: 60秒"
echo "├── 日志文件: $LOG_FILE"
echo "└── PID: $$"

# 主循环
while true; do
    echo "$(date '+%Y-%m-%d %H:%M:%S') 执行同步..." >> "$LOG_FILE"
    "$SCRIPT" >> "$LOG_FILE" 2>&1
    sleep 60
done
