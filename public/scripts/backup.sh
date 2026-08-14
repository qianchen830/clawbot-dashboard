#!/bin/bash
# ClawBot 自动备份脚本
# 功能：自动备份核心数据、配置文件、笔记等
# 用法：./backup.sh [--full|--incremental|--restore]

set -e

# 配置
BACKUP_DIR="$HOME/.openclaw/backups"
SOURCE_DIR="$HOME/.openclaw/workspace"
DATA_DIR="$HOME/.openclaw/data"
CONFIG_FILE="$HOME/.openclaw/openclaw.json"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$HOME/.openclaw/logs/backup.log"
MAX_BACKUPS=30  # 保留最近30天备份

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 创建备份目录
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# 全量备份
full_backup() {
    log "开始全量备份..."
    
    BACKUP_FILE="$BACKUP_DIR/clawbot_full_$TIMESTAMP.tar.gz"
    
    # 备份内容
    tar -czf "$BACKUP_FILE" \
        --exclude='node_modules' \
        --exclude='*.log' \
        --exclude='__pycache__' \
        --exclude='.git' \
        --exclude='output' \
        -C "$HOME/.openclaw" \
        workspace/memory \
        workspace/MEMORY.md \
        workspace/IDENTITY.md \
        workspace/USER.md \
        workspace/SOUL.md \
        workspace/AGENTS.md \
        workspace/config \
        workspace/templates \
        workspace/scripts \
        workspace/docs \
        workspace/tests \
        data \
        openclaw.json \
        2>/dev/null || true
    
    if [ -f "$BACKUP_FILE" ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "全量备份完成: $BACKUP_FILE (大小: $SIZE)"
        
        # 记录备份信息
        echo "$TIMESTAMP|full|$BACKUP_FILE|$SIZE" >> "$BACKUP_DIR/backup_history.txt"
    else
        log "错误: 备份失败"
        return 1
    fi
}

# 增量备份
incremental_backup() {
    log "开始增量备份..."
    
    BACKUP_FILE="$BACKUP_DIR/clawbot_incr_$TIMESTAMP.tar.gz"
    
    # 找到最近的全量备份
    LAST_FULL=$(ls -t "$BACKUP_DIR"/clawbot_full_*.tar.gz 2>/dev/null | head -1)
    
    if [ -z "$LAST_FULL" ]; then
        log "未找到全量备份，执行全量备份..."
        full_backup
        return
    fi
    
    # 获取全量备份时间
    FULL_TIME=$(stat -c %Y "$LAST_FULL")
    
    # 只备份修改过的文件
    tar -czf "$BACKUP_FILE" \
        --exclude='node_modules' \
        --exclude='*.log' \
        --exclude='__pycache__' \
        --exclude='.git' \
        --newer=@"$FULL_TIME" \
        -C "$HOME/.openclaw" \
        workspace/memory \
        workspace/MEMORY.md \
        data \
        2>/dev/null || true
    
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "增量备份完成: $BACKUP_FILE (大小: $SIZE)"
        echo "$TIMESTAMP|incr|$BACKUP_FILE|$SIZE" >> "$BACKUP_DIR/backup_history.txt"
    else
        log "无新增内容，跳过备份"
        rm -f "$BACKUP_FILE"
    fi
}

# 恢复备份
restore_backup() {
    BACKUP_FILE=$1
    
    if [ -z "$BACKUP_FILE" ]; then
        log "可用备份:"
        ls -lt "$BACKUP_DIR"/clawbot_*.tar.gz 2>/dev/null | head -10
        return
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log "错误: 备份文件不存在: $BACKUP_FILE"
        return 1
    fi
    
    log "开始恢复备份: $BACKUP_FILE"
    
    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    
    # 解压
    tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
    
    # 恢复文件
    cp -r "$TEMP_DIR"/* "$HOME/.openclaw/" 2>/dev/null || true
    
    # 清理
    rm -rf "$TEMP_DIR"
    
    log "备份恢复完成"
}

# 清理旧备份
clean_old_backups() {
    log "清理旧备份..."
    
    # 删除超过30天的备份
    find "$BACKUP_DIR" -name "clawbot_*.tar.gz" -mtime +$MAX_BACKUPS -delete 2>/dev/null || true
    
    # 删除超过MAX_BACKUPS数量的增量备份
    INCR_COUNT=$(ls "$BACKUP_DIR"/clawbot_incr_*.tar.gz 2>/dev/null | wc -l)
    if [ "$INCR_COUNT" -gt "$MAX_BACKUPS" ]; then
        ls -t "$BACKUP_DIR"/clawbot_incr_*.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
    fi
    
    log "清理完成"
}

# 备份状态
backup_status() {
    log "=== 备份状态 ==="
    
    echo ""
    echo "备份目录: $BACKUP_DIR"
    echo ""
    echo "最近备份:"
    ls -lt "$BACKUP_DIR"/clawbot_*.tar.gz 2>/dev/null | head -5
    echo ""
    
    TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    BACKUP_COUNT=$(ls "$BACKUP_DIR"/clawbot_*.tar.gz 2>/dev/null | wc -l)
    
    echo "备份总数: $BACKUP_COUNT"
    echo "总大小: $TOTAL_SIZE"
    echo ""
    
    if [ -f "$BACKUP_DIR/backup_history.txt" ]; then
        echo "最近备份历史:"
        tail -5 "$BACKUP_DIR/backup_history.txt"
    fi
}

# 数据库备份
backup_database() {
    log "备份数据库..."
    
    DB_FILE="$DATA_DIR/clawbot.db"
    
    if [ -f "$DB_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/clawbot_db_$TIMESTAMP.db"
        cp "$DB_FILE" "$BACKUP_FILE"
        log "数据库备份完成: $BACKUP_FILE"
    else
        log "数据库文件不存在，跳过"
    fi
}

# 主函数
main() {
    case "${1:-full}" in
        --full|full)
            full_backup
            backup_database
            clean_old_backups
            ;;
        --incremental|incr)
            incremental_backup
            backup_database
            ;;
        --restore|restore)
            restore_backup "$2"
            ;;
        --status|status)
            backup_status
            ;;
        --clean|clean)
            clean_old_backups
            ;;
        --database|db)
            backup_database
            ;;
        *)
            echo "用法: $0 [--full|--incremental|--restore <file>|--status|--clean|--database]"
            echo ""
            echo "选项:"
            echo "  --full        全量备份 (默认)"
            echo "  --incremental 增量备份"
            echo "  --restore     恢复备份"
            echo "  --status      查看备份状态"
            echo "  --clean       清理旧备份"
            echo "  --database    仅备份数据库"
            exit 1
            ;;
    esac
}

# 执行
main "$@"
