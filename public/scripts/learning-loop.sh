#!/bin/bash
# 学习引擎后台守护进程 - 每小时自动运行
# 替代 cron，适用于 WSL 环境

LEARNING_SCRIPT="/home/openclaw/.openclaw/workspace/scripts/framework/auto-learning-v4.py"
SCHEDULER="/home/openclaw/.openclaw/workspace/scripts/framework/special-topics-scheduler.py"
LOG="/home/openclaw/.openclaw/workspace/memory/learning-log.txt"
PID_FILE="/tmp/learning-loop.pid"

# 如果已运行则退出
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "学习引擎已在运行 (PID: $OLD_PID)"
        exit 1
    fi
fi

echo $$ > "$PID_FILE"
echo "学习引擎守护进程启动 (PID: $$)"

while true; do
    CURRENT_HOUR=$(date +%H)
    CURRENT_MINUTE=$(date +%M)

    # 每小时整点：专题定时检查（11/12/14/15/16点）
    if [ "$CURRENT_MINUTE" = "00" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查专题推送..." >> "$LOG"
        python3 "$SCHEDULER" --check >> "$LOG" 2>&1
    fi

    # 每30分钟：高强度学习引擎
    if [ "$CURRENT_MINUTE" = "00" ] || [ "$CURRENT_MINUTE" = "30" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 高强度学习触发..." >> "$LOG"
        python3 "$LEARNING_SCRIPT" >> "$LOG" 2>&1
    fi

    sleep 60
done
