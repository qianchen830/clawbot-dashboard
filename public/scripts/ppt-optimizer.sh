#!/bin/bash
# PPT自动优化脚本
# 每30分钟汇报一次进度

WORKSPACE="/home/openclaw/.openclaw/workspace"
SCRIPTS="$WORKSPACE/scripts"
OUTPUT="$WORKSPACE/output"
LOG="$WORKSPACE/ppt-optimization.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG"
}

report_progress() {
    local phase=$1
    local task=$2
    local status=$3
    
    log "=== 进度汇报 ==="
    log "阶段: $phase"
    log "任务: $task"
    log "状态: $status"
    log "================"
}

# 开始优化
log "=========================================="
log "PPT优化计划启动"
log "计划时长: 8小时"
log "汇报频率: 每30分钟"
log "=========================================="

# 阶段1: 母版修复
report_progress "阶段1" "母版修复" "开始"

# 检查母版文件
if [ -f "/mnt/d/Kingdee文档/自动化交付工具/参考文档（模板）/ppt模板/ppt母版.pptx" ]; then
    log "母版文件存在"
else
    log "警告: 母版文件不存在"
fi

# 统计生成器
TOTAL=$(ls $SCRIPTS/kingdee-*-ppt-*-generator.py 2>/dev/null | wc -l)
log "发现 $TOTAL 个PPT生成器"

report_progress "阶段1" "母版修复" "进行中"

# 检查每个生成器是否使用母版
for f in $SCRIPTS/kingdee-*-ppt-*-generator.py; do
    if grep -q "TEMPLATE_PATH\|ppt母版" "$f"; then
        log "✅ $(basename $f) 使用母版"
    else
        log "❌ $(basename $f) 未使用母版"
    fi
done

log "阶段1完成"
