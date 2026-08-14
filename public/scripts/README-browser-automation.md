# 浏览器自动化使用说明

## 环境准备

### 已安装
- ✅ Playwright v1.58.2
- ✅ Chromium 浏览器

### 首次使用

1. **DeepSeek 登录**
```bash
cd ~/.openclaw/workspace/scripts
node deepseek-automation.cjs login
```
在弹出的浏览器中登录DeepSeek，登录完成后按 Ctrl+C 退出。

2. **可灵AI 登录**
```bash
cd ~/.openclaw/workspace/scripts
node klingai-automation.cjs login
```
在弹出的浏览器中微信扫码登录，登录完成后按 Ctrl+C 退出。

---

## DeepSeek 自动化

### 生成单个剧本
```bash
node deepseek-automation.cjs generate "请生成一个30秒的治愈系短视频剧本"
```

### 批量生成剧本
```bash
# 创建提示词文件
echo "治愈系动漫日常" > prompts.txt
echo "搞笑反转短剧" >> prompts.txt
echo "知识科普讲解" >> prompts.txt

# 批量生成
node deepseek-automation.cjs batch prompts.txt ./output
```

### 输出格式
```json
{
  "prompt": "提示词",
  "response": "AI回复内容",
  "timestamp": "时间戳"
}
```

---

## 可灵AI 自动化

### 文生视频
```bash
node klingai-automation.cjs text "治愈系动漫风格，午后阳光，少女读书，慢镜头，4K" 5 16:9
```

参数说明：
- 提示词：描述要生成的视频内容
- 时长：5秒或10秒
- 比例：16:9、9:16、1:1

### 图生视频
```bash
node klingai-automation.cjs image ./photo.jpg "人物微笑，轻微动作，慢镜头" 5
```

参数说明：
- 图片路径：要生成视频的图片
- 提示词：描述视频动作
- 时长：5秒或10秒

### 批量生成
```bash
# 创建提示词文件
echo "治愈系动漫风格，午后阳光" > prompts.txt
echo "城市夜景，霓虹灯光" >> prompts.txt
echo "海边日落，金色阳光" >> prompts.txt

# 批量生成
node klingai-automation.cjs batch prompts.txt ./output
```

---

## 注意事项

### 登录状态
- 登录状态保存在 `~/.deepseek-browser-profile` 和 `~/.klingai-browser-profile`
- 如果登录过期，重新运行 `login` 命令

### 速率限制
- DeepSeek：避免频繁请求，建议间隔10秒以上
- 可灵AI：每日免费66积分，文生视频5积分/次，图生视频10积分/次

### 生成时间
- DeepSeek剧本：约10-30秒
- 可灵AI视频：约2-5分钟

---

## 完整工作流示例

```bash
# 1. 登录
node deepseek-automation.cjs login
node klingai-automation.cjs login

# 2. 生成剧本
node deepseek-automation.cjs generate "治愈系动漫风格，午后咖啡店，少女读书" > script.cjson

# 3. 提取提示词（需要手动提取或使用jq）
cat script.cjson | jq -r '.response' | grep -o "提示词.*" > prompts.txt

# 4. 生成视频
node klingai-automation.cjs text "治愈系动漫风格，午后咖啡店，少女读书，慢镜头，4K" 5 16:9

# 5. 下载的视频会在浏览器默认下载目录
```

---

*创建时间: 2026-03-08*
