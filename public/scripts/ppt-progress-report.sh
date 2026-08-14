#!/bin/bash
# PPT优化进度汇报脚本 - 每30分钟执行

WORKSPACE="/home/openclaw/.openclaw/workspace"
LOG="$WORKSPACE/ppt-optimization.log"
PROGRESS="$WORKSPACE/ppt-optimization-progress.json"
MEMORY="$WORKSPACE/MEMORY.md"

# 记录时间
NOW=$(date '+%Y-%m-%d %H:%M:%S')

# 读取进度
if [ -f "$PROGRESS" ]; then
    COMPLETED=$(grep -o '"completed_tasks": \[[^]]*\]' "$PROGRESS" 2>/dev/null || echo '[]')
    CURRENT=$(grep -o '"current_task": [0-9]*' "$PROGRESS" 2>/dev/null | grep -o '[0-9]*' || echo '0')
    REPORTS=$(grep -c '"task_id"' "$PROGRESS" 2>/dev/null || echo '0')
else
    COMPLETED='[]'
    CURRENT=0
    REPORTS=0
fi

# 计算进度
TOTAL=8
COMPLETED_COUNT=$(echo "$COMPLETED" | grep -o '[0-9]' | wc -l)
PERCENT=$((COMPLETED_COUNT * 100 / TOTAL))

# 输出汇报
echo "========================================" | tee -a "$LOG"
echo "PPT优化进度汇报 - $NOW" | tee -a "$LOG"
echo "========================================" | tee -a "$LOG"
echo "完成任务: $COMPLETED_COUNT / $TOTAL ($PERCENT%)" | tee -a "$LOG"
echo "当前任务: $CURRENT" | tee -a "$LOG"
echo "汇报次数: $REPORTS" | tee -a "$LOG"
echo "" | tee -a "$LOG"

# 更新MEMORY.md
cat >> "$MEMORY" << MEMEOF

## PPT优化进度 - $NOW

- 完成任务: $COMPLETED_COUNT / $TOTAL ($PERCENT%)
- 当前任务: $CURRENT
- 汇报次数: $REPORTS

MEMEOF

echo "汇报已记录到 $LOG 和 $MEMORY" | tee -a "$LOG"
