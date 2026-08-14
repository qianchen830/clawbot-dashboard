#!/bin/bash
# 服务健康检查与自动重启脚本

LOG_FILE="/tmp/openclaw/health-check.log"
GATEWAY_PORT=18789
KINGDEE_PORT=5173  # 金蝶交付前端 (Vite React)

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 检查Gateway服务
check_gateway() {
    if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$GATEWAY_PORT/" 2>/dev/null | grep -q "200\|404"; then
        log "✅ Gateway OK (port $GATEWAY_PORT)"
        return 0
    else
        log "🔴 Gateway DOWN (port $GATEWAY_PORT), restarting..."
        # 尝试重启 - 使用nohup后台启动
        nohup openclaw gateway start >> "$LOG_FILE" 2>&1 &
        sleep 5
        if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$GATEWAY_PORT/" 2>/dev/null | grep -q "200\|404"; then
            log "✅ Gateway restarted successfully"
            return 0
        else
            log "❌ Gateway restart failed"
            return 1
        fi
    fi
}

# 检查金蝶交付系统前端
check_kingdee() {
    if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$KINGDEE_PORT/" 2>/dev/null | grep -q "200"; then
        log "✅ Kingdee Frontend OK (port $KINGDEE_PORT)"
        return 0
    else
        log "🟡 Kingdee Frontend DOWN (port $KINGDEE_PORT) - not auto-restart"
        return 1
    fi
}

# 检查上下文大小
check_context() {
    MEMORY_FILE="$HOME/.openclaw/workspace/MEMORY.md"
    MAX_SIZE=10240

    if [ -f "$MEMORY_FILE" ]; then
        size=$(wc -c < "$MEMORY_FILE")
        size_kb=$((size / 1024))

        if [ $size -gt $MAX_SIZE ]; then
            log "🔴 MEMORY.md is ${size_kb}KB (exceeds 10KB limit)"
            return 1
        elif [ $size -gt 8192 ]; then
            log "🟡 MEMORY.md is ${size_kb}KB (warning: approaching limit)"
            return 0
        else
            log "✅ MEMORY.md is ${size_kb}KB (OK)"
            return 0
        fi
    fi
}

# 主函数
main() {
    log "========== Health Check Start =========="
    check_gateway
    check_kingdee
    check_context
    log "========== Health Check End ============"
}

main "$@"
