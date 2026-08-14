#!/bin/bash
# ClawBot 回滚脚本
# 回滚到历史版本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="clawbot"
BACKUP_DIR="backups"

# 显示帮助
show_help() {
    echo "ClawBot 回滚脚本"
    echo ""
    echo "用法: ./rollback.sh [选项]"
    echo ""
    echo "选项:"
    echo "  -l, --list       列出所有可用版本"
    echo "  -v, --version    回滚到指定版本"
    echo "  -p, --previous   回滚到上一版本"
    echo "  -h, --help       显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./rollback.sh --list"
    echo "  ./rollback.sh --previous"
    echo "  ./rollback.sh --version abc123"
}

# 列出可用版本
list_versions() {
    echo -e "${BLUE}可用版本:${NC}"
    echo ""
    
    # Git版本
    if [ -d ".git" ]; then
        echo -e "${YELLOW}Git提交记录:${NC}"
        git log --oneline -10
        echo ""
    fi
    
    # Docker镜像
    echo -e "${YELLOW}Docker镜像:${NC}"
    docker images ${PROJECT_NAME} --format "table {{.Tag}}\t{{.ID}}\t{{.CreatedAt}}" | head -11
    echo ""
    
    # 备份文件
    if [ -d "$BACKUP_DIR" ]; then
        echo -e "${YELLOW}备份文件:${NC}"
        ls -lht $BACKUP_DIR/*.tar.gz 2>/dev/null | head -5
        echo ""
    fi
}

# 回滚到指定Git版本
rollback_git() {
    local version=$1
    
    echo -e "${YELLOW}回滚到Git版本: $version${NC}"
    
    # 检查版本是否存在
    if ! git rev-parse --verify $version > /dev/null 2>&1; then
        echo -e "${RED}版本不存在: $version${NC}"
        exit 1
    fi
    
    # 确认回滚
    read -p "确认回滚到版本 $version? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "取消回滚"
        exit 0
    fi
    
    # 停止服务
    echo -e "${BLUE}停止服务...${NC}"
    docker-compose down 2>/dev/null || true
    
    # 切换版本
    echo -e "${BLUE}切换版本...${NC}"
    git checkout $version
    
    # 重新部署
    echo -e "${BLUE}重新部署...${NC}"
    docker-compose up -d --build
    
    # 健康检查
    sleep 10
    ./scripts/monitor.sh --once
    
    echo -e "${GREEN}回滚完成${NC}"
}

# 回滚到上一版本
rollback_previous() {
    echo -e "${YELLOW}回滚到上一版本${NC}"
    
    # 获取上一版本
    local previous_version=$(git rev-parse HEAD~1)
    
    if [ -z "$previous_version" ]; then
        echo -e "${RED}没有上一版本${NC}"
        exit 1
    fi
    
    rollback_git $previous_version
}

# 回滚Docker镜像
rollback_docker() {
    local version=$1
    
    echo -e "${YELLOW}回滚Docker镜像到版本: $version${NC}"
    
    # 检查镜像是否存在
    if ! docker images ${PROJECT_NAME} --format "{{.Tag}}" | grep -q "^${version}$"; then
        echo -e "${RED}镜像版本不存在: $version${NC}"
        exit 1
    fi
    
    # 停止服务
    echo -e "${BLUE}停止服务...${NC}"
    docker-compose down
    
    # 切换镜像
    echo -e "${BLUE}切换镜像...${NC}"
    docker tag ${PROJECT_NAME}:${version} ${PROJECT_NAME}:latest
    
    # 重启服务
    echo -e "${BLUE}重启服务...${NC}"
    docker-compose up -d
    
    # 健康检查
    sleep 10
    ./scripts/monitor.sh --once
    
    echo -e "${GREEN}回滚完成${NC}"
}

# 从备份恢复
rollback_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}备份文件不存在: $backup_file${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}从备份恢复: $backup_file${NC}"
    
    # 停止服务
    echo -e "${BLUE}停止服务...${NC}"
    docker-compose down 2>/dev/null || true
    
    # 恢复数据
    echo -e "${BLUE}恢复数据...${NC}"
    tar xzf $backup_file -C /
    
    # 重启服务
    echo -e "${BLUE}重启服务...${NC}"
    docker-compose up -d
    
    # 健康检查
    sleep 10
    ./scripts/monitor.sh --once
    
    echo -e "${GREEN}恢复完成${NC}"
}

# 主函数
main() {
    case "${1:-}" in
        -l|--list)
            list_versions
            ;;
        -v|--version)
            if [ -z "${2:-}" ]; then
                echo -e "${RED}请指定版本号${NC}"
                show_help
                exit 1
            fi
            rollback_git $2
            ;;
        -p|--previous)
            rollback_previous
            ;;
        -d|--docker)
            if [ -z "${2:-}" ]; then
                echo -e "${RED}请指定Docker镜像版本${NC}"
                show_help
                exit 1
            fi
            rollback_docker $2
            ;;
        -b|--backup)
            if [ -z "${2:-}" ]; then
                echo -e "${RED}请指定备份文件${NC}"
                show_help
                exit 1
            fi
            rollback_backup $2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo -e "${RED}未知选项: ${1:-}${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 执行
main "$@"
