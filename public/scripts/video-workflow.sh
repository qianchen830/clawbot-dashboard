#!/bin/bash
# 短视频创作自动化工作流
# 使用方法: ./scripts/video-workflow.sh [步骤]

set -e

WORKSPACE="$HOME/.openclaw/workspace"
SCRIPTS_DIR="$WORKSPACE/scripts"
OUTPUT_DIR="$WORKSPACE/output"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

echo "🎬 短视频创作工作流"
echo "=================="

case "$1" in
    "1"|"剧本")
        echo "📝 步骤1: 生成剧本"
        echo "运行 DeepSeek 批量生成..."
        cd "$WORKSPACE"
        node scripts/deepseek-batch-generator.cjs
        echo "✅ 剧本生成完成"
        echo "📁 查看输出: $OUTPUT_DIR"
        ;;
    
    "2"|"视频")
        echo "🎥 步骤2: 生成视频"
        echo "请手动访问可灵AI: https://klingai.kuaishou.com/"
        echo "使用以下提示词模板:"
        cat "$WORKSPACE/memory/video-prompts-templates.md" | head -50
        ;;
    
    "3"|"剪辑")
        echo "✂️ 步骤3: 剪辑视频"
        echo "请使用剪映或必剪进行剪辑"
        echo "参考: $WORKSPACE/memory/video-editing-guide.md"
        ;;
    
    "4"|"发布")
        echo "📤 步骤4: 发布视频"
        echo "最佳发布时间:"
        echo "  B站: 17:00-22:00"
        echo "  抖音: 12:00-14:00, 18:00-22:00"
        echo "  快手: 11:00-14:00, 18:00-22:00"
        echo "参考: $WORKSPACE/memory/multi-platform-publish.md"
        ;;
    
    "5"|"数据")
        echo "📊 步骤5: 数据追踪"
        echo "使用数据追踪模板记录数据"
        echo "参考: $WORKSPACE/memory/data-tracking-templates.md"
        ;;
    
    "all"|"全部")
        echo "🚀 完整工作流"
        echo "=================="
        echo ""
        echo "步骤1: 剧本生成"
        echo "  → 运行: $0 1"
        echo ""
        echo "步骤2: 视频生成"
        echo "  → 访问: https://klingai.kuaishou.com/"
        echo ""
        echo "步骤3: 视频剪辑"
        echo "  → 使用剪映/必剪"
        echo ""
        echo "步骤4: 多平台发布"
        echo "  → 按最佳时间发布"
        echo ""
        echo "步骤5: 数据追踪"
        echo "  → 记录数据并分析"
        ;;
    
    *)
        echo "用法: $0 [步骤]"
        echo ""
        echo "可用步骤:"
        echo "  1 或 剧本  - 生成剧本"
        echo "  2 或 视频  - 生成视频"
        echo "  3 或 剪辑  - 剪辑视频"
        echo "  4 或 发布  - 发布视频"
        echo "  5 或 数据  - 数据追踪"
        echo "  all 或 全部 - 显示完整工作流"
        echo ""
        echo "示例: $0 1"
        ;;
esac
