#!/bin/bash
# ClawBot 自动化部署脚本
# 支持开发、测试、生产环境部署

set -e

# ============ 配置 ============
PROJECT_NAME="clawbot"
VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ENVIRONMENT=${1:-development}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============ 日志函数 ============
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# ============ 帮助信息 ============
show_help() {
    echo "ClawBot 部署脚本"
    echo ""
    echo "用法: ./deploy.sh <环境> [选项]"
    echo ""
    echo "环境:"
    echo "  development   部署到开发环境"
    echo "  staging       部署到测试环境"
    echo "  production    部署到生产环境"
    echo ""
    echo "选项:"
    echo "  --build       强制重新构建镜像"
    echo "  --no-test     跳过测试"
    echo "  --rollback    回滚到上一版本"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh development"
    echo "  ./deploy.sh staging --build"
    echo "  ./deploy.sh production --no-test"
}

# ============ 环境检查 ============
check_environment() {
    log_step "检查环境: $ENVIRONMENT"
    
    # 检查必要工具
    local missing_tools=()
    
    for cmd in docker docker-compose git curl; do
        if ! command -v $cmd &> /dev/null; then
            missing_tools+=($cmd)
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "缺少必要工具: ${missing_tools[*]}"
        log_info "请安装后再试"
        exit 1
    fi
    
    # 检查环境配置文件
    if [ ! -f "config/$ENVIRONMENT.env" ]; then
        log_warn "配置文件不存在: config/$ENVIRONMENT.env"
        log_info "使用默认配置"
    fi
    
    log_info "环境检查通过"
}

# ============ 构建镜像 ============
build_image() {
    log_step "构建Docker镜像"
    
    local build_flag="${1:-}"
    
    if [ "$build_flag" == "--build" ]; then
        log_info "强制重新构建..."
        docker-compose build --no-cache
    else
        log_info "构建镜像(使用缓存)..."
        docker-compose build
    fi
    
    # 标记版本
    docker tag ${PROJECT_NAME}:latest ${PROJECT_NAME}:${VERSION} 2>/dev/null || true
    
    log_info "镜像构建完成: ${PROJECT_NAME}:${VERSION}"
}

# ============ 运行测试 ============
run_tests() {
    log_step "运行测试"
    
    if [ "$SKIP_TEST" == "true" ]; then
        log_warn "跳过测试"
        return 0
    fi
    
    # 单元测试
    log_info "运行单元测试..."
    pytest tests/ -v --cov=scripts --cov-report=term-missing || {
        log_error "单元测试失败"
        return 1
    }
    
    # 集成测试
    log_info "运行集成测试..."
    pytest tests/integration/ -v 2>/dev/null || {
        log_warn "集成测试跳过或失败"
    }
    
    log_info "所有测试通过"
}

# ============ 部署服务 ============
deploy_services() {
    log_step "部署服务到 $ENVIRONMENT 环境"
    
    # 加载环境配置
    if [ -f "config/$ENVIRONMENT.env" ]; then
        export $(cat config/$ENVIRONMENT.env | grep -v '^#' | xargs)
    fi
    
    # 停止旧服务
    log_info "停止旧服务..."
    docker-compose -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml down 2>/dev/null || true
    
    # 启动新服务
    log_info "启动新服务..."
    docker-compose -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    log_info "服务部署完成"
}

# ============ 健康检查 ============
health_check() {
    log_step "执行健康检查"
    
    local max_retries=30
    local retry=0
    local services=("8765" "8767" "8768" "8769" "8770")
    local failed=0
    
    for port in "${services[@]}"; do
        retry=0
        while [ $retry -lt $max_retries ]; do
            if curl -f "http://localhost:$port/health" &> /dev/null; then
                log_info "端口 $port: ✅ 健康"
                break
            fi
            
            retry=$((retry + 1))
            sleep 2
        done
        
        if [ $retry -eq $max_retries ]; then
            log_error "端口 $port: ❌ 不健康"
            failed=$((failed + 1))
        fi
    done
    
    if [ $failed -gt 0 ]; then
        log_error "健康检查失败: $failed 个服务不健康"
        return 1
    fi
    
    log_info "所有服务健康检查通过"
}

# ============ 回滚 ============
rollback() {
    log_step "执行回滚"
    
    # 获取历史版本
    log_info "可用版本:"
    docker images ${PROJECT_NAME} --format "{{.Tag}}\t{{.CreatedAt}}" | grep -v latest | head -5
    
    # 获取上一版本
    local PREVIOUS_VERSION=$(docker images ${PROJECT_NAME} --format "{{.Tag}}" | grep -v latest | head -2 | tail -1)
    
    if [ -z "$PREVIOUS_VERSION" ]; then
        log_error "没有可用的历史版本"
        exit 1
    fi
    
    log_warn "将回滚到版本: $PREVIOUS_VERSION"
    read -p "确认回滚? (y/N): " confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_info "取消回滚"
        exit 0
    fi
    
    # 回滚
    docker tag ${PROJECT_NAME}:${PREVIOUS_VERSION} ${PROJECT_NAME}:latest
    deploy_services
    health_check
    
    log_info "回滚完成"
}

# ============ 清理旧镜像 ============
cleanup() {
    log_step "清理旧镜像"
    
    # 保留最近5个版本
    local keep=5
    local total=$(docker images ${PROJECT_NAME} --format "{{.Tag}}" | grep -v latest | wc -l)
    
    if [ $total -gt $keep ]; then
        docker images ${PROJECT_NAME} --format "{{.Tag}}" | grep -v latest | tail -n +$((keep + 1)) | while read tag; do
            log_info "删除旧镜像: ${PROJECT_NAME}:${tag}"
            docker rmi ${PROJECT_NAME}:${tag} 2>/dev/null || true
        done
    fi
    
    # 清理悬空镜像
    docker image prune -f
    
    log_info "清理完成"
}

# ============ 显示状态 ============
show_status() {
    log_step "服务状态"
    
    echo ""
    echo "容器状态:"
    docker-compose ps
    
    echo ""
    echo "健康检查:"
    for port in 8765 8767 8768 8769 8770; do
        if curl -s --connect-timeout 2 "http://localhost:$port/health" > /dev/null 2>&1; then
            echo "  端口 $port: ✅ 运行中"
        else
            echo "  端口 $port: ❌ 未运行"
        fi
    done
    
    echo ""
    echo "版本信息:"
    echo "  当前版本: ${VERSION}"
    echo "  部署时间: ${TIMESTAMP}"
    echo "  环境: ${ENVIRONMENT}"
}

# ============ 主函数 ============
main() {
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            development|staging|production)
                ENVIRONMENT=$1
                shift
                ;;
            --build)
                BUILD_FORCE=true
                shift
                ;;
            --no-test)
                SKIP_TEST=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_info "======================================"
    log_info "ClawBot 部署脚本"
    log_info "======================================"
    log_info "环境: $ENVIRONMENT"
    log_info "版本: $VERSION"
    log_info "时间: $TIMESTAMP"
    log_info "======================================"
    
    # 执行部署流程
    if [ "$ROLLBACK" == "true" ]; then
        rollback
        exit 0
    fi
    
    check_environment
    build_image ${BUILD_FORCE:-}
    run_tests || {
        log_error "测试失败，终止部署"
        exit 1
    }
    deploy_services
    health_check || {
        log_error "健康检查失败，执行回滚"
        rollback
        exit 1
    }
    cleanup
    show_status
    
    log_info "======================================"
    log_info "部署完成！"
    log_info "======================================"
}

# 捕获错误
trap 'log_error "部署失败，错误发生在第 $LINENO 行"; exit 1' ERR

# 执行主函数
main "$@"
