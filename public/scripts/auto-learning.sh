#!/bin/bash

# 10小时不间断学习脚本
# 每30分钟执行一次，记录学习进度

LEARNING_DIR="/home/openclaw/.openclaw/workspace/memory"
PROGRESS_FILE="$LEARNING_DIR/learning-progress.json"
LOG_FILE="$LEARNING_DIR/learning-log.txt"

# 获取当前小时
CURRENT_HOUR=$(date +%H)
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')

# 读取学习进度
if [ -f "$PROGRESS_FILE" ]; then
    CURRENT_PHASE=$(cat "$PROGRESS_FILE" | grep -o '"currentHour": [0-9]*' | grep -o '[0-9]*')
else
    CURRENT_PHASE=1
fi

# 确定学习主题
case $CURRENT_PHASE in
    1) TOPIC="金蝶云星空产品架构"; PHASE="企业软件交付" ;;
    2) TOPIC="ERP项目实施方法论"; PHASE="企业软件交付" ;;
    3) TOPIC="业务蓝图设计"; PHASE="企业软件交付" ;;
    4) TOPIC="项目管理与风险控制"; PHASE="企业软件交付" ;;
    5) TOPIC="客户化开发与集成"; PHASE="企业软件交付" ;;
    6) TOPIC="AI视频生成技术原理"; PHASE="AI短视频" ;;
    7) TOPIC="短视频内容策划"; PHASE="AI短视频" ;;
    8) TOPIC="视频脚本编写技巧"; PHASE="AI短视频" ;;
    9) TOPIC="短视频运营策略"; PHASE="AI短视频" ;;
    10) TOPIC="AI工具实践应用"; PHASE="AI短视频" ;;
    *) TOPIC="学习完成"; PHASE="结束" ;;
esac

# 记录学习日志
echo "[$CURRENT_TIME] 第${CURRENT_PHASE}小时学习: $TOPIC ($PHASE)" >> "$LOG_FILE"

# 更新学习进度
NEXT_HOUR=$((CURRENT_PHASE + 1))
cat > "$PROGRESS_FILE" << EOF
{
  "startTime": "2026-03-26T00:20:00+08:00",
  "currentTime": "$CURRENT_TIME",
  "currentPhase": $CURRENT_PHASE,
  "currentHour": $CURRENT_PHASE,
  "totalHours": 10,
  "currentTopic": "$TOPIC",
  "currentPhaseName": "$PHASE"
}
EOF

echo "学习进度更新: 第${CURRENT_PHASE}小时 - $TOPIC"
