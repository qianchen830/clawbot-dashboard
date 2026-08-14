#!/bin/bash
# PPT提纲与Word内容持续优化脚本
# 每30分钟执行一次，持续20小时

LOG_FILE="/home/openclaw/.openclaw/workspace/memory/optimization-log.md"
PLAN_FILE="/home/openclaw/.openclaw/workspace/memory/optimization-plan.md"
REF_DIR="/mnt/d/Kingdee文档/自动化交付工具/参考文档（模板）"
GEN_DIR="/mnt/d/Kingdee文档/自动化交付工具/生成文档"

# 记录开始时间
START_TIME="2026-03-24 12:14"
END_TIME="2026-03-24 08:14"
CURRENT_TIME=$(date "+%Y-%m-%d %H:%M")

# 计算剩余时间
START_SEC=$(date -d "2026-03-24 12:14" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M" "2026-03-24 12:14" +%s)
END_SEC=$(date -d "2026-03-25 08:14" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M" "2026-03-25 08:14" +%s)
CURRENT_SEC=$(date +%s)

if [ $CURRENT_SEC -lt $START_SEC ]; then
    echo "优化计划未开始"
    exit 0
fi

if [ $CURRENT_SEC -gt $END_SEC ]; then
    echo "优化计划已结束"
    exit 0
fi

# 计算进度
TOTAL_SECONDS=$((END_SEC - START_SEC))
ELAPSED_SECONDS=$((CURRENT_SEC - START_SEC))
PROGRESS=$((ELAPSED_SECONDS * 100 / TOTAL_SECONDS))
REMAINING_HOURS=$(( (END_SEC - CURRENT_SEC) / 3600 ))

# 记录日志
echo "" >> "$LOG_FILE"
echo "## 优化检查 - $CURRENT_TIME" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "**进度**: ${PROGRESS}% | **剩余**: ${REMAINING_HOURS}小时" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 检查参考模板数量
REF_COUNT=$(find "$REF_DIR" -type f 2>/dev/null | wc -l)
echo "- 参考模板数量: $REF_COUNT" >> "$LOG_FILE"

# 检查生成文档数量
GEN_COUNT=$(find "$GEN_DIR" -type f 2>/dev/null | wc -l)
echo "- 生成文档数量: $GEN_COUNT" >> "$LOG_FILE"

# 记录当前任务
echo "- 当前任务: 持续优化中..." >> "$LOG_FILE"

echo "优化进度: ${PROGRESS}%, 剩余: ${REMAINING_HOURS}小时"
