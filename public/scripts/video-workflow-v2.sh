#!/bin/bash
# 短视频自动化工作流脚本
# 用途：整合DeepSeek剧本生成、AI视频制作、多平台发布

set -e

# ==================== 配置区域 ====================

# 工作目录
WORKSPACE="$HOME/.openclaw/workspace"
PROJECT_DIR="$WORKSPACE/video-projects"
MEMORY_DIR="$WORKSPACE/memory"
SCRIPTS_DIR="$WORKSPACE/scripts"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== 工具函数 ====================

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

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装"
        return 1
    fi
    return 0
}

# ==================== 项目管理 ====================

create_project() {
    local project_name=$1
    local today=$(date +%Y-%m-%d)
    local project_path="$PROJECT_DIR/${today}_${project_name}"
    
    log_step "创建项目: $project_name"
    
    mkdir -p "$project_path"/{素材/{封面,视频,音频,图片},剧本,工程文件,输出}
    
    # 创建项目配置文件
    cat > "$project_path/project.json" << EOF
{
    "name": "$project_name",
    "created": "$(date -Iseconds)",
    "status": "created",
    "platforms": ["douyin", "bilibili", "kuaishou", "weixin"],
    "type": "anime_healing",
    "duration": 15
}
EOF
    
    log_info "项目创建成功: $project_path"
    echo "$project_path"
}

# ==================== 剧本生成 ====================

generate_script() {
    local project_path=$1
    local template=$2
    local topic=$3
    
    log_step "生成剧本: $template - $topic"
    
    # 检查DeepSeek脚本是否存在
    local script_path="$SCRIPTS_DIR/deepseek-batch-generator.cjs"
    
    if [ -f "$script_path" ]; then
        log_info "使用DeepSeek批量生成器"
        node "$script_path" --template "$template" --topic "$topic" --output "$project_path/剧本"
    else
        log_warn "DeepSeek脚本不存在，使用模板生成"
        generate_script_from_template "$project_path" "$template" "$topic"
    fi
}

generate_script_from_template() {
    local project_path=$1
    local template=$2
    local topic=$3
    
    local template_file="$MEMORY_DIR/video-script-templates-v2.md"
    
    if [ ! -f "$template_file" ]; then
        log_error "模板文件不存在: $template_file"
        return 1
    fi
    
    # 创建剧本文件
    cat > "$project_path/剧本/script.md" << EOF
# 剧本: $topic

## 基本信息
- 模板: $template
- 主题: $topic
- 创建时间: $(date -Iseconds)
- 预计时长: 15秒

## 待填写
请根据模板填写具体内容：
1. 分镜脚本
2. AI视频提示词
3. 配音文案
4. BGM建议

## 参考模板
查看: $template_file
EOF
    
    log_info "剧本模板已创建: $project_path/剧本/script.md"
}

# ==================== 视频素材生成 ====================

generate_cover() {
    local project_path=$1
    local prompt=$2
    
    log_step "生成封面图片"
    log_info "提示词: $prompt"
    
    # 提示用户手动操作
    echo ""
    log_warn "请手动使用以下工具生成封面:"
    echo "  1. 即梦AI: https://jimeng.jianying.com/"
    echo "  2. LiblibAI: https://www.liblib.ai/"
    echo "  3. Midjourney: https://midjourney.com/"
    echo ""
    echo "提示词:"
    echo "$prompt"
    echo ""
    echo "生成后请保存到: $project_path/素材/封面/"
    echo ""
}

generate_video() {
    local project_path=$1
    local prompt=$2
    
    log_step "生成视频素材"
    log_info "提示词: $prompt"
    
    # 提示用户手动操作
    echo ""
    log_warn "请手动使用以下工具生成视频:"
    echo "  1. 可灵AI: https://klingai.kuaishou.com/"
    echo "  2. 即梦AI: https://jimeng.jianying.com/"
    echo "  3. Vidu: https://www.vidu.studio/"
    echo ""
    echo "提示词:"
    echo "$prompt"
    echo ""
    echo "生成后请保存到: $project_path/素材/视频/"
    echo ""
}

# ==================== 配音生成 ====================

generate_voiceover() {
    local project_path=$1
    local text=$2
    local voice=$3
    
    log_step "生成配音"
    
    # 默认使用晓晓音色
    voice=${voice:-"zh-CN-XiaoxiaoNeural"}
    
    # 检查edge-tts是否安装
    if check_command edge-tts; then
        log_info "使用Edge TTS生成配音"
        edge-tts --text "$text" --voice "$voice" --write-media "$project_path/素材/音频/voiceover.mp3"
        log_info "配音已生成: $project_path/素材/音频/voiceover.mp3"
    else
        log_warn "edge-tts未安装，请手动配音"
        echo "配音文案: $text"
        echo "推荐工具: 剪映APP文本朗读"
    fi
}

# ==================== 剪辑输出 ====================

prepare_editing() {
    local project_path=$1
    
    log_step "准备剪辑"
    
    # 检查素材是否齐全
    local video_count=$(find "$project_path/素材/视频" -type f \( -name "*.mp4" -o -name "*.mov" \) 2>/dev/null | wc -l)
    local audio_count=$(find "$project_path/素材/音频" -type f \( -name "*.mp3" -o -name "*.wav" \) 2>/dev/null | wc -l)
    local cover_count=$(find "$project_path/素材/封面" -type f \( -name "*.jpg" -o -name "*.png" \) 2>/dev/null | wc -l)
    
    echo ""
    log_info "素材统计:"
    echo "  视频素材: $video_count 个"
    echo "  音频素材: $audio_count 个"
    echo "  封面图片: $cover_count 个"
    echo ""
    
    if [ $video_count -eq 0 ]; then
        log_warn "缺少视频素材"
    fi
    if [ $audio_count -eq 0 ]; then
        log_warn "缺少音频素材"
    fi
    if [ $cover_count -eq 0 ]; then
        log_warn "缺少封面图片"
    fi
    
    echo ""
    log_info "请使用剪映进行剪辑:"
    echo "  1. 导入视频素材: $project_path/素材/视频/"
    echo "  2. 导入音频素材: $project_path/素材/音频/"
    echo "  3. 参考剧本: $project_path/剧本/script.md"
    echo "  4. 导出成品: $project_path/输出/"
    echo ""
}

# ==================== 发布管理 ====================

prepare_publish() {
    local project_path=$1
    
    log_step "准备发布"
    
    # 检查成品是否存在
    local output_count=$(find "$project_path/输出" -type f -name "*.mp4" 2>/dev/null | wc -l)
    
    if [ $output_count -eq 0 ]; then
        log_error "未找到成品视频，请先完成剪辑"
        return 1
    fi
    
    # 创建发布清单
    cat > "$project_path/发布清单.md" << EOF
# 发布清单

## 基本信息
- 项目: $(basename $project_path)
- 创建时间: $(date -Iseconds)

## 发布平台

### 抖音
- [ ] 上传视频
- [ ] 添加标题
- [ ] 添加话题标签
- [ ] 设置封面
- [ ] 发布

### B站
- [ ] 上传视频
- [ ] 添加标题
- [ ] 添加简介
- [ ] 添加标签
- [ ] 设置分区
- [ ] 发布

### 快手
- [ ] 上传视频
- [ ] 添加标题
- [ ] 添加话题
- [ ] 发布

### 视频号
- [ ] 上传视频
- [ ] 添加描述
- [ ] 发布

## 最佳发布时间
- 工作日: 12:00, 18:00, 21:00
- 周末: 10:00, 15:00, 20:00

## 标题建议
[根据剧本内容填写]

## 话题标签
#治愈系 #动漫日常 #短视频
EOF
    
    log_info "发布清单已创建: $project_path/发布清单.md"
    
    echo ""
    log_info "请访问以下平台发布:"
    echo "  抖音创作者中心: https://creator.douyin.com/"
    echo "  B站创作中心: https://member.bilibili.com/"
    echo "  快手创作者中心: https://cp.kuaishou.com/"
    echo "  视频号助手: https://channels.weixin.qq.com/"
    echo ""
}

# ==================== 数据追踪 ====================

create_tracking_sheet() {
    local project_path=$1
    
    log_step "创建数据追踪表"
    
    cat > "$project_path/数据追踪.csv" << EOF
日期,平台,播放量,点赞,评论,转发,收藏,完播率,新增粉丝,备注
$(date +%Y-%m-%d),,,,,,,,,
EOF
    
    log_info "数据追踪表已创建: $project_path/数据追踪.csv"
}

# ==================== 完整工作流 ====================

full_workflow() {
    local project_name=$1
    local template=${2:-"biliAnime"}
    local topic=${3:-"治愈系日常"}
    
    echo ""
    log_info "======================================"
    log_info "   短视频自动化工作流"
    log_info "======================================"
    echo ""
    
    # 1. 创建项目
    local project_path=$(create_project "$project_name")
    
    # 2. 生成剧本
    generate_script "$project_path" "$template" "$topic"
    
    # 3. 提示生成素材
    echo ""
    read -p "是否继续生成素材提示？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        generate_cover "$project_path" "请根据剧本填写提示词"
        generate_video "$project_path" "请根据剧本填写提示词"
    fi
    
    # 4. 提示配音
    echo ""
    read -p "是否生成配音？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "请输入配音文案: " voiceover_text
        generate_voiceover "$project_path" "$voiceover_text"
    fi
    
    # 5. 准备剪辑
    prepare_editing "$project_path"
    
    # 6. 创建数据追踪
    create_tracking_sheet "$project_path"
    
    echo ""
    log_info "======================================"
    log_info "   工作流完成！"
    log_info "======================================"
    log_info "项目路径: $project_path"
    log_info "下一步: 完成剪辑后运行 prepare_publish"
    echo ""
}

# ==================== 主菜单 ====================

show_help() {
    echo ""
    echo "短视频自动化工作流脚本"
    echo ""
    echo "用法: $0 <命令> [参数]"
    echo ""
    echo "命令:"
    echo "  create <项目名>              创建新项目"
    echo "  script <项目路径> <模板> <主题>  生成剧本"
    echo "  cover <项目路径> <提示词>    生成封面提示"
    echo "  video <项目路径> <提示词>    生成视频提示"
    echo "  voice <项目路径> <文案>      生成配音"
    echo "  edit <项目路径>              准备剪辑"
    echo "  publish <项目路径>           准备发布"
    echo "  track <项目路径>             创建数据追踪"
    echo "  full <项目名> [模板] [主题]  完整工作流"
    echo ""
    echo "模板:"
    echo "  biliAnime    B站动漫日常（治愈系）"
    echo "  douyinFast   抖音快节奏（搞笑）"
    echo "  knowledge    知识科普"
    echo "  emotional    情感共鸣"
    echo ""
    echo "示例:"
    echo "  $0 full 我的第一个视频 biliAnime 校园恋爱"
    echo "  $0 create 测试项目"
    echo "  $0 script ./video-projects/2026-03-08_测试项目 biliAnime 治愈系"
    echo ""
}

# ==================== 主入口 ====================

main() {
    local command=$1
    shift
    
    case $command in
        create)
            create_project "$1"
            ;;
        script)
            generate_script "$1" "$2" "$3"
            ;;
        cover)
            generate_cover "$1" "$2"
            ;;
        video)
            generate_video "$1" "$2"
            ;;
        voice)
            generate_voiceover "$1" "$2" "$3"
            ;;
        edit)
            prepare_editing "$1"
            ;;
        publish)
            prepare_publish "$1"
            ;;
        track)
            create_tracking_sheet "$1"
            ;;
        full)
            full_workflow "$1" "$2" "$3"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
