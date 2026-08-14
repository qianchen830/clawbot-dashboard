#!/bin/bash
# ClawBot 服务监控脚本
# 实时监控所有服务状态

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
SERVICES=(
    "5173:Kingdee Frontend"
    "3000:ClawBot Dashboard"
    "18789:OpenClaw Gateway"
)

INTERVAL=${1:-5}

# 检查服务状态
check_service() {
    local port=$1
    local name=$2
    
    if curl -s --connect-timeout 1 "http://localhost:$port/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $name (端口 $port)"
        return 0
    else
        echo -e "${RED}❌${NC} $name (端口 $port)"
        return 1
    fi
}

# 检查容器状态
check_containers() {
    echo -e "${BLUE}容器状态:${NC}"
    docker-compose ps 2>/dev/null || echo "未使用docker-compose"
    echo ""
}

# 检查资源使用
check_resources() {
    echo -e "${BLUE}资源使用:${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || echo "无容器运行"
    echo ""
}

# 检查磁盘使用
check_disk() {
    echo -e "${BLUE}磁盘使用:${NC}"
    df -h / | grep -v "Filesystem"
    echo ""
}

# 主监控循环
monitor() {
    clear
    echo -e "${BLUE}======================================"
    echo "ClawBot 服务监控"
    echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "======================================${NC}"
    echo ""
    
    # 服务状态
    echo -e "${BLUE}服务状态:${NC}"
    local running=0
    local stopped=0
    
    for service in "${SERVICES[@]}"; do
        port="${service%%:*}"
        name="${service#*:}"
        if check_service "$port" "$name"; then
            ((running++))
        else
            ((stopped++))
        fi
    done
    
    echo ""
    echo -e "统计: ${GREEN}$running${NC} 个服务运行中, ${RED}$stopped${NC} 个服务停止"
    echo ""
    
    # 容器状态
    check_containers
    
    # 资源使用
    check_resources
    
    # 磁盘使用
    check_disk
    
    # 自动重启停止的服务
    if [ $stopped -gt 0 ]; then
        echo -e "${YELLOW}检测到 $stopped 个服务停止，尝试重启...${NC}"
        for service in "${SERVICES[@]}"; do
            port="${service%%:*}"
            name="${service#*:}"
            if ! curl -s --connect-timeout 1 "http://localhost:$port/health" > /dev/null 2>&1; then
                case $port in
                    8765) script="backend.py" ;;
                    8767) script="stats-api.py" ;;
                    8768) script="health_monitor.py" ;;
                    8769) script="ppt_api.py" ;;
                    8770) script="search-api.py" ;;
                esac
                echo -e "${YELLOW}重启 $name...${NC}"
                nohup python3 "scripts/$script" > "logs/${script%.py}.log" 2>&1 &
                sleep 2
            fi
        done
    fi
}

# 持续监控
if [ "$1" == "--once" ]; then
    monitor
else
    while true; do
        monitor
        echo ""
        echo -e "${BLUE}按 Ctrl+C 退出监控${NC}"
        sleep $INTERVAL
    done
fi
