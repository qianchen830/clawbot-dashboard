#!/bin/bash
# 短视频实操一键启动脚本
# 用途：快速启动实操流程，打开所需工具和文档

set -e

# ==================== 配置 ====================
WORKSPACE="$HOME/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
PROJECTS_DIR="$WORKSPACE/video-projects"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ==================== 工具函数 ====================
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_tool() { echo -e "${CYAN}[TOOL]${NC} $1"; }

# ==================== 主要功能 ====================

show_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║      短视频实操一键启动                      ║${NC}"
    echo -e "${CYAN}║      Short Video Practice Starter          ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
    echo ""
}

show_menu() {
    echo ""
    echo -e "${YELLOW}请选择操作：${NC}"
    echo ""
    echo "  1) 🚀 完整实操流程（推荐新手）"
    echo "  2) 📝 DeepSeek 剧本生成"
    echo "  3) 🎬 可灵AI 视频生成"
    echo "  4) ✂️  剪映视频剪辑"
    echo "  5) 📤 多平台发布"
    echo "  6) 📊 数据追踪分析"
    echo ""
    echo "  7) 📚 查看知识库"
    echo "  8) 🔧 查看工具链接"
    echo "  9) 📋 查看检查清单"
    echo ""
    echo "  0) 退出"
    echo ""
}

# ==================== 步骤1：DeepSeek ====================

step_deepseek() {
    echo ""
    log_step "=== 步骤1：DeepSeek 剧本生成 ==="
    echo ""
    
    # 显示提示词模板
    log_info "提示词模板："
    echo ""
    echo -e "${CYAN}治愈系动漫（15秒）：${NC}"
    echo "请为短视频平台创作一个15秒治愈系动漫日常剧本。"
    echo "主题：【替换为你的主题】"
    echo "要求：日系动漫风格，柔和光线，温馨氛围"
    echo ""
    echo -e "${CYAN}搞笑反转（30秒）：${NC}"
    echo "请为短视频平台创作一个30秒搞笑反转短视频剧本。"
    echo "主题：【替换为你的主题】"
    echo "要求：幽默夸张，节奏明快，反转惊喜"
    echo ""
    echo -e "${CYAN}知识科普（60秒）：${NC}"
    echo "请为短视频平台创作一个60秒知识科普视频剧本。"
    echo "主题：【替换为你的主题】"
    echo "要求：简洁明了，信息可视化，专业感"
    echo ""
    
    # 打开 DeepSeek
    log_tool "正在打开 DeepSeek..."
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://chat.deepseek.com/" 2>/dev/null &
    elif command -v open &> /dev/null; then
        open "https://chat.deepseek.com/" 2>/dev/null &
    fi
    
    # 显示实操指南
    log_info "实操指南：$MEMORY_DIR/deepseek-practice-guide.md"
    echo ""
    read -p "按回车键继续下一步..."
}

# ==================== 步骤2：可灵AI ====================

step_klingai() {
    echo ""
    log_step "=== 步骤2：可灵AI 视频生成 ==="
    echo ""
    
    # 显示提示词模板
    log_info "提示词模板："
    echo ""
    echo -e "${CYAN}治愈系示例：${NC}"
    echo "A cute anime girl with long black hair, wearing white dress,"
    echo "standing under cherry blossom trees with petals falling,"
    echo "warm sunlight, gentle smile, Japanese anime style,"
    echo "Studio Ghibli inspired, high quality, soft colors, 4K"
    echo ""
    echo -e "${CYAN}搞笑示例：${NC}"
    echo "Anime style office scene, young worker presenting nervously,"
    echo "sudden realization, exaggerated expression, comedic timing,"
    echo "bright lighting, clean animation, funny reaction, high quality"
    echo ""
    
    # 打开可灵AI
    log_tool "正在打开可灵AI..."
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://klingai.kuaishou.com/" 2>/dev/null &
    elif command -v open &> /dev/null; then
        open "https://klingai.kuaishou.com/" 2>/dev/null &
    fi
    
    # 显示实操指南
    log_info "实操指南：$MEMORY_DIR/klingai-practice-guide.md"
    echo ""
    read -p "按回车键继续下一步..."
}

# ==================== 步骤3：剪映 ====================

step_jianying() {
    echo ""
    log_step "=== 步骤3：剪映视频剪辑 ==="
    echo ""
    
    # 显示剪辑流程
    log_info "剪辑流程："
    echo "  1. 创建项目（选择 9:16 竖版）"
    echo "  2. 导入素材（视频、音频、图片）"
    echo "  3. 基础剪辑（调整顺序、时长）"
    echo "  4. 音频处理（配音、背景音乐）"
    echo "  5. 字幕制作（自动识别/手动）"
    echo "  6. 特效制作（滤镜、转场、贴纸）"
    echo "  7. 导出成品（1080P, 30fps, 4000-6000kbps）"
    echo ""
    
    # 显示实操指南
    log_info "实操指南：$MEMORY_DIR/jianying-practice-guide.md"
    echo ""
    
    # 尝试打开剪映
    log_tool "尝试打开剪映..."
    if command -v jm &> /dev/null; then
        jm &
    else
        log_warn "请手动打开剪映专业版"
    fi
    
    echo ""
    read -p "按回车键继续下一步..."
}

# ==================== 步骤4：发布 ====================

step_publish() {
    echo ""
    log_step "=== 步骤4：多平台发布 ==="
    echo ""
    
    # 显示发布平台
    log_info "发布平台："
    echo ""
    echo -e "${CYAN}抖音：${NC} https://creator.douyin.com/"
    echo "  最佳时间：12:00, 18:00, 21:00"
    echo ""
    echo -e "${CYAN}B站：${NC} https://member.bilibili.com/"
    echo "  最佳时间：18:00, 20:00, 22:00"
    echo ""
    echo -e "${CYAN}快手：${NC} https://cp.kuaishou.com/"
    echo "  最佳时间：12:00, 18:00, 20:00"
    echo ""
    echo -e "${CYAN}视频号：${NC} https://channels.weixin.qq.com/"
    echo "  最佳时间：12:00, 18:00, 21:00"
    echo ""
    
    # 打开发布平台
    log_tool "正在打开发布平台..."
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://creator.douyin.com/" 2>/dev/null &
    elif command -v open &> /dev/null; then
        open "https://creator.douyin.com/" 2>/dev/null &
    fi
    
    # 显示发布指南
    log_info "发布指南：$MEMORY_DIR/multi-platform-publish-guide.md"
    echo ""
    read -p "按回车键继续下一步..."
}

# ==================== 步骤5：数据追踪 ====================

step_tracking() {
    echo ""
    log_step "=== 步骤5：数据追踪分析 ==="
    echo ""
    
    # 显示数据指标
    log_info "核心数据指标："
    echo ""
    echo -e "${CYAN}曝光指标：${NC} 播放量、展现量、点击率"
    echo -e "${CYAN}质量指标：${NC} 完播率、5秒完播率、平均观看时长"
    echo -e "${CYAN}互动指标：${NC} 点赞率、评论率、转发率、收藏率"
    echo -e "${CYAN}转化指标：${NC} 关注率、主页访问率、私信率"
    echo ""
    
    # 显示数据追踪指南
    log_info "数据追踪指南：$MEMORY_DIR/video-data-tracking-guide.md"
    echo ""
    
    # 创建数据追踪表
    create_tracking_sheet
    
    echo ""
    read -p "按回车键返回菜单..."
}

create_tracking_sheet() {
    local today=$(date +%Y-%m-%d)
    local tracking_file="$PROJECTS_DIR/data-tracking-$today.csv"
    
    if [ ! -f "$tracking_file" ]; then
        mkdir -p "$PROJECTS_DIR"
        cat > "$tracking_file" << EOF
日期,平台,播放量,点赞,评论,转发,收藏,完播率,新增粉丝,备注
$today,,,,,,,,
EOF
        log_info "数据追踪表已创建：$tracking_file"
    else
        log_info "数据追踪表已存在：$tracking_file"
    fi
}

# ==================== 完整流程 ====================

full_workflow() {
    echo ""
    log_step "=== 完整实操流程 ==="
    echo ""
    log_info "将依次打开所需工具和指南"
    echo ""
    
    step_deepseek
    step_klingai
    step_jianying
    step_publish
    step_tracking
    
    echo ""
    log_info "=== 实操流程完成 ==="
    echo ""
    log_info "下一步："
    echo "  1. 使用生成的素材完成剪辑"
    echo "  2. 发布到各平台"
    echo "  3. 追踪数据效果"
    echo "  4. 复盘优化"
    echo ""
    read -p "按回车键返回菜单..."
}

# ==================== 知识库 ====================

show_knowledge() {
    echo ""
    log_step "=== 知识库 ==="
    echo ""
    
    log_info "核心文档："
    echo ""
    echo "  📚 理论基础："
    echo "     - deepseek-advanced-prompts.md    DeepSeek高级提示词"
    echo "     - klingai-complete-guide.md       可灵AI完整指南"
    echo "     - ai-video-tools-comparison.md    AI视频工具对比"
    echo ""
    echo "  📝 实操指南："
    echo "     - deepseek-practice-guide.md      DeepSeek实操"
    echo "     - klingai-practice-guide.md       可灵AI实操"
    echo "     - jianying-practice-guide.md      剪映实操"
    echo ""
    echo "  📋 工作流程："
    echo "     - complete-video-creation-flow.md 完整制作流程"
    echo "     - daily-work-checklist.md         每日检查清单"
    echo "     - quick-start-guide.md            快速启动指南"
    echo ""
    echo "  📊 运营变现："
    echo "     - video-monetization-full-guide.md 变现攻略"
    echo "     - video-data-tracking-guide.md    数据追踪"
    echo "     - topic-monitoring-system.md      选题系统"
    echo ""
    
    log_info "知识库位置：$MEMORY_DIR"
    echo ""
    read -p "按回车键返回菜单..."
}

# ==================== 工具链接 ====================

show_tools() {
    echo ""
    log_step "=== 工具链接 ==="
    echo ""
    
    log_info "创作工具："
    echo "  🤖 DeepSeek：    https://chat.deepseek.com/"
    echo "  🎬 可灵AI：      https://klingai.kuaishou.com/"
    echo "  🎨 即梦AI：      https://jimeng.jianying.com/"
    echo "  🎥 Vidu：        https://www.vidu.studio/"
    echo ""
    
    log_info "发布平台："
    echo "  📱 抖音：        https://creator.douyin.com/"
    echo "  📺 B站：         https://member.bilibili.com/"
    echo "  📱 快手：        https://cp.kuaishou.com/"
    echo "  📱 视频号：      https://channels.weixin.qq.com/"
    echo ""
    
    log_info "数据工具："
    echo "  📊 蝉妈妈：      https://www.chanmama.com/"
    echo "  📊 新榜：        https://www.newrank.cn/"
    echo "  📊 飞瓜：        https://www.feigua.cn/"
    echo ""
    
    log_info "热点工具："
    echo "  🔥 今日热榜：    https://tophub.today/"
    echo "  🔥 抖音热点：    https://hot.douyin.com/"
    echo "  🔥 微博热搜：    https://s.weibo.com/top/summary"
    echo ""
    
    read -p "按回车键返回菜单..."
}

# ==================== 检查清单 ====================

show_checklist() {
    echo ""
    log_step "=== 实操检查清单 ==="
    echo ""
    
    log_info "📝 剧本生成："
    echo "  [ ] 登录 DeepSeek"
    echo "  [ ] 选择剧本模板"
    echo "  [ ] 替换主题关键词"
    echo "  [ ] 生成剧本"
    echo "  [ ] 复制 AI 提示词"
    echo "  [ ] 保存剧本文档"
    echo ""
    
    log_info "🎬 视频生成："
    echo "  [ ] 登录可灵AI"
    echo "  [ ] 粘贴提示词"
    echo "  [ ] 设置参数（时长、比例）"
    echo "  [ ] 生成视频"
    echo "  [ ] 下载素材"
    echo "  [ ] 保存到项目文件夹"
    echo ""
    
    log_info "✂️  视频剪辑："
    echo "  [ ] 打开剪映"
    echo "  [ ] 创建项目（9:16）"
    echo "  [ ] 导入素材"
    echo "  [ ] 基础剪辑"
    echo "  [ ] 添加配音/字幕"
    echo "  [ ] 添加特效"
    echo "  [ ] 导出成品（1080P）"
    echo ""
    
    log_info "📤 发布运营："
    echo "  [ ] 准备标题文案"
    echo "  [ ] 准备话题标签"
    echo "  [ ] 准备封面图片"
    echo "  [ ] 发布到平台"
    echo "  [ ] 记录发布信息"
    echo ""
    
    log_info "📊 数据追踪："
    echo "  [ ] 1小时后查看播放量"
    echo "  [ ] 24小时后查看数据"
    echo "  [ ] 回复前10条评论"
    echo "  [ ] 记录数据到追踪表"
    echo "  [ ] 复盘优化"
    echo ""
    
    read -p "按回车键返回菜单..."
}

# ==================== 主循环 ====================

main() {
    show_banner
    
    while true; do
        show_menu
        read -p "请选择操作 [0-9]: " choice
        
        case $choice in
            1) full_workflow ;;
            2) step_deepseek ;;
            3) step_klingai ;;
            4) step_jianying ;;
            5) step_publish ;;
            6) step_tracking ;;
            7) show_knowledge ;;
            8) show_tools ;;
            9) show_checklist ;;
            0) 
                echo ""
                log_info "再见！祝创作顺利！"
                echo ""
                exit 0 
                ;;
            *)
                log_warn "无效选择，请重新输入"
                ;;
        esac
    done
}

# 运行主函数
main
