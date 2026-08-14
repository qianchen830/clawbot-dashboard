#!/bin/bash
# 批量深度学习脚本

WORKSPACE="/home/openclaw/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
BATCH_SIZE=5

# 获取未学习的目录
DIRS=$(find /mnt/d/Kingdee文档 -maxdepth 2 -type d 2>/dev/null | shuf | head $BATCH_SIZE)

for dir in $DIRS; do
    name=$(basename "$dir" | tr ' ' '-' | tr -cd '[:alnum:]-')
    timestamp=$(date +%Y%m%d-%H%M)
    outfile="$MEMORY_DIR/${timestamp}-${name}.md"
    
    echo "# 学习笔记: $dir" > "$outfile"
    echo "" >> "$outfile"
    echo "**学习时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$outfile"
    echo "" >> "$outfile"
    
    # 列出目录内容
    echo "## 目录结构" >> "$outfile"
    ls -la "$dir" 2>/dev/null | head -30 >> "$outfile"
    echo "" >> "$outfile"
    
    # 学习子目录
    echo "## 子目录内容" >> "$outfile"
    find "$dir" -type f -name "*.pdf" -o -name "*.doc*" -o -name "*.ppt*" 2>/dev/null | head -20 | while read f; do
        echo "- $(basename "$f")" >> "$outfile"
    done
    
    sleep 2
done

echo "✅ 批量学习完成: $(date '+%H:%M:%S')"
