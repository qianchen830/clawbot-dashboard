#!/bin/bash
# 工作台数据同步脚本（分类版）
# 更新时间和路径
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
WORKSPACE="$HOME/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
SKILLS_DIR="$WORKSPACE/skills"
API_DIR="$WORKSPACE/api"
STATS_FILE="$API_DIR/stats.json"

# 创建api目录
mkdir -p "$API_DIR"

# 统计交付学习笔记（企业软件交付相关）
DELIVERY_KEYWORDS="kingdee|erp|项目|蓝图|开发|集成|交付|财务|供应链|制造|人力|售前|调研|验收|上线|启动|business-blueprint|project|kingdee|implementation"
DELIVERY_NOTES=$(find "$MEMORY_DIR" -name "*.md" -type f 2>/dev/null | xargs -I {} basename {} | grep -iE "$DELIVERY_KEYWORDS" | wc -l)

# 统计AI学习笔记（AI短视频相关）
AI_KEYWORDS="ai|video|视频|脚本|script|运营|operation|内容|content|抖音|douyin|b站|bilibili|小红书|短视频|image|绘画|painting|创作|generation|social-media|automation"
AI_NOTES=$(find "$MEMORY_DIR" -name "*.md" -type f 2>/dev/null | xargs -I {} basename {} | grep -iE "$AI_KEYWORDS" | wc -l)

# 总笔记数
TOTAL_NOTES=$(find "$MEMORY_DIR" -name "*.md" -type f 2>/dev/null | wc -l)

# 今日新增分类统计
TODAY=$(date '+%Y-%m-%d')
TODAY_DELIVERY=$(find "$MEMORY_DIR" -name "${TODAY}*.md" -type f 2>/dev/null | xargs -I {} basename {} | grep -iE "$DELIVERY_KEYWORDS" | wc -l)
TODAY_AI=$(find "$MEMORY_DIR" -name "${TODAY}*.md" -type f 2>/dev/null | xargs -I {} basename {} | grep -iE "$AI_KEYWORDS" | wc -l)
TODAY_TOTAL=$((TODAY_DELIVERY + TODAY_AI))

# 统计Skills数量
SKILLS_COUNT=$(find "$SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)

# 获取学习状态
HEARTBEAT_FILE="$WORKSPACE/HEARTBEAT.md"
if [ -f "$HEARTBEAT_FILE" ]; then
    # 检查10小时学习计划完成情况
    if grep -q "全部完成\|完成.*10/10" "$HEARTBEAT_FILE" 2>/dev/null; then
        LEARNING_STATUS="10小时学习计划完成 ✅"
        ENTERPRISE_DONE=5
        AI_DONE=5
    elif grep -q "企业软件交付.*完成\|第一阶段.*完成" "$HEARTBEAT_FILE" 2>/dev/null; then
        ENTERPRISE_DONE=5
        # 检查AI短视频进度
        AI_DONE=$(grep -o "AI短视频.*[0-9]/5" "$HEARTBEAT_FILE" 2>/dev/null | grep -o "[0-9]" | head -1)
        [ -z "$AI_DONE" ] && AI_DONE=0
        LEARNING_STATUS="AI短视频: $AI_DONE/5"
    else
        LEARNING_STATUS="持续学习中"
        ENTERPRISE_DONE=0
        AI_DONE=0
    fi
else
    LEARNING_STATUS="待启动"
    ENTERPRISE_DONE=0
    AI_DONE=0
fi

# 检查服务状态
check_service() {
    local port=$1
    if netstat -tlnp 2>/dev/null | grep -q ":$port " || ss -tlnp 2>/dev/null | grep -q ":$port "; then
        echo "running"
    else
        echo "stopped"
    fi
}

BACKEND_STATUS=$(check_service 5173)
FRONTEND_STATUS=$(check_service 5173)
DASHBOARD_STATUS=$(check_service 3000)

# 生成JSON文件
cat > "$STATS_FILE" << EOF
{
  "updated": "$TIMESTAMP",
  "total": {
    "notes": $TOTAL_NOTES,
    "skills": $SKILLS_COUNT
  },
  "delivery": {
    "notes": $DELIVERY_NOTES,
    "todayNew": $TODAY_DELIVERY,
    "completed": $ENTERPRISE_DONE,
    "total": 5,
    "label": "企业软件交付"
  },
  "ai": {
    "notes": $AI_NOTES,
    "todayNew": $TODAY_AI,
    "completed": $AI_DONE,
    "total": 5,
    "label": "AI短视频创作"
  },
  "learningStatus": "$LEARNING_STATUS",
  "services": {
    "backend": {"port": 5173, "status": "$BACKEND_STATUS"},
    "frontend": {"port": 5173, "status": "$FRONTEND_STATUS"},
    "dashboard": {"port": 3000, "status": "$DASHBOARD_STATUS"}
  }
}
EOF

# 更新dashboard.html
DASHBOARD_FILE="$WORKSPACE/dashboard.html"
if [ -f "$DASHBOARD_FILE" ]; then
    # 更新交付学习笔记
    sed -i "s|<div class=\"stat-item\" onclick=\"openModal('deliveryModal')\"><div class=\"icon\">📘</div><div class=\"value\">[0-9]*</div>|<div class=\"stat-item\" onclick=\"openModal('deliveryModal')\"><div class=\"icon\">📘</div><div class=\"value\">$DELIVERY_NOTES</div>|g" "$DASHBOARD_FILE"
    
    # 更新AI学习笔记  
    sed -i "s|<div class=\"stat-item\" onclick=\"openModal('aiModal')\"><div class=\"icon\">🎬</div><div class=\"value\">[0-9]*</div>|<div class=\"stat-item\" onclick=\"openModal('aiModal')\"><div class=\"icon\">🎬</div><div class=\"value\">$AI_NOTES</div>|g" "$DASHBOARD_FILE"
fi

# 输出结果
echo "📊 工作台数据已更新"
echo "├── 交付学习笔记: $DELIVERY_NOTES 个 (今日+$TODAY_DELIVERY)"
echo "├── AI学习笔记: $AI_NOTES 个 (今日+$TODAY_AI)"
echo "├── Skills: $SKILLS_COUNT 个"
echo "├── 学习状态: $LEARNING_STATUS"
echo "└── 更新时间: $TIMESTAMP"
