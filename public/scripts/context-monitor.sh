#!/bin/bash
# 上下文大小监控脚本
# 用法: ./context-monitor.sh [check|auto]

MEMORY_FILE="$HOME/.openclaw/workspace/MEMORY.md"
MAX_SIZE=10240  # 10KB
WARN_SIZE=8192  # 8KB

get_size() {
    wc -c < "$MEMORY_FILE"
}

check() {
    local size=$(get_size)
    local size_kb=$((size / 1024))

    if [ $size -gt $MAX_SIZE ]; then
        echo "🔴 CRITICAL: MEMORY.md is ${size_kb}KB (limit: 10KB)"
        echo "ACTION: Run 'auto' mode to trim"
        return 1
    elif [ $size -gt $WARN_SIZE ]; then
        echo "🟡 WARNING: MEMORY.md is ${size_kb}KB (approaching limit)"
        return 0
    else
        echo "✅ OK: MEMORY.md is ${size_kb}KB"
        return 0
    fi
}

auto() {
    local size=$(get_size)
    if [ $size -gt $MAX_SIZE ]; then
        echo "Auto-trimming not implemented - manual review needed"
        echo "Consider moving detailed content to memory/ subdirectory"
        return 1
    fi
    check
}

case "${1:-check}" in
    check) check ;;
    auto) auto ;;
    *) echo "Usage: $0 [check|auto]" ;;
esac
