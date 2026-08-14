# 视频发布系统使用说明

短视频多平台自动发布系统。

---

## 一、系统功能

### 1. 视频上传发布
- ✅ 支持拖拽上传
- ✅ 支持多平台选择
- ✅ 支持定时发布
- ✅ 发布队列管理

### 2. 数据统计
- ✅ 各平台粉丝数
- ✅ 各平台视频数据
- ✅ 数据自动刷新

### 3. 账号管理
- ✅ Cookies 管理
- ✅ 多平台支持

### 4. 支持平台
- 🎵 抖音
- ⚡ 快手
- 📺 B站
- 📕 小红书
- 💚 视频号
- ▶️ YouTube

---

## 二、使用步骤

### 步骤1：打开网页

```bash
# 在Windows浏览器中打开
\\wsl$\Ubuntu\home\openclaw\.openclaw\workspace\scripts\video-publish-system.html

# 或者复制到Windows目录
cp ~/.openclaw/workspace/scripts/video-publish-system.html /mnt/c/Users/你的用户名/Desktop/
```

### 步骤2：配置账号Cookies

1. 在浏览器中登录各平台
2. 按F12打开开发者工具
3. 切换到Network标签
4. 刷新页面
5. 找到任意请求
6. 复制Cookie值
7. 粘贴到对应平台的输入框
8. 点击"保存 Cookies"

### 步骤3：上传视频

1. 点击或拖拽视频文件到上传区域
2. 填写视频标题
3. 填写视频描述（可选）
4. 填写标签（可选）
5. 选择发布平台（至少一个）
6. 选择发布时间（立即/定时）
7. 点击"发布视频"

### 步骤4：查看数据

1. 切换到"数据统计"面板
2. 查看各平台粉丝数
3. 查看视频数据
4. 点击"刷新数据"获取最新数据

---

## 三、ClawBot集成

### 与ClawBot通信

系统会将发布请求发送给ClawBot处理。

**发布请求格式：**
```
【视频发布请求】
标题: xxx
描述: xxx
标签: xxx
平台: 抖音, 快手
时间: 立即发布

请处理视频发布。
```

### ClawBot处理流程

1. 接收发布请求
2. 保存视频文件
3. 添加到发布队列
4. 依次发布到各平台
5. 更新发布状态
6. 获取视频数据

---

## 四、后端脚本

### 初始化

```bash
node ~/.openclaw/workspace/scripts/video-publish-backend.js init
```

### 保存Cookies

```bash
node video-publish-backend.js save-cookie douyin "your_cookie_value"
node video-publish-backend.js save-cookie kuaishou "your_cookie_value"
node video-publish-backend.js save-cookie bilibili "your_cookie_value"
```

### 获取统计数据

```bash
node video-publish-backend.js get-stats
```

### 刷新统计数据

```bash
node video-publish-backend.js refresh-stats
```

### 获取发布队列

```bash
node video-publish-backend.js get-queue
```

### 执行发布

```bash
node video-publish-backend.js publish <queueId>
```

---

## 五、Cookies获取方法

### 抖音

1. 打开 https://creator.douyin.com/
2. 登录账号
3. F12 → Network → 刷新页面
4. 找到请求 → 复制Cookie

### 快手

1. 打开 https://cp.kuaishou.com/
2. 登录账号
3. F12 → Network → 刷新页面
4. 找到请求 → 复制Cookie

### B站

1. 打开 https://member.bilibili.com/
2. 登录账号
3. F12 → Network → 刷新页面
4. 找到请求 → 复制Cookie

### 小红书

1. 打开 https://creator.xiaohongshu.com/
2. 登录账号
3. F12 → Network → 刷新页面
4. 找到请求 → 复制Cookie

### 视频号

1. 打开 https://channels.weixin.qq.com/
2. 登录账号
3. F12 → Network → 刷新页面
4. 找到请求 → 复制Cookie

### YouTube

1. 打开 https://studio.youtube.com/
2. 登录账号
3. F12 → Network → 刷新页面
4. 找到请求 → 复制Cookie

---

## 六、注意事项

### 安全提示

1. **Cookies安全**：Cookies包含登录凭证，请勿泄露
2. **定期更新**：Cookies会过期，需要定期更新
3. **账号安全**：不要在公共电脑上保存Cookies

### 发布限制

1. **平台限制**：各平台有发布频率限制
2. **视频规格**：各平台有视频规格要求
3. **内容审核**：发布内容需符合平台规则

### 最佳实践

1. **间隔发布**：不同平台间隔发布
2. **定时发布**：使用定时发布避开高峰
3. **数据监控**：定期查看数据统计

---

## 七、故障排查

### Cookies失效

**症状**：发布失败，提示"未配置"或"登录失效"

**解决**：
1. 重新登录平台
2. 获取新Cookies
3. 更新系统中的Cookies

### 发布失败

**症状**：发布失败，提示错误

**解决**：
1. 检查视频格式
2. 检查视频大小
3. 检查网络连接
4. 检查平台状态

### 数据不更新

**症状**：统计数据不更新

**解决**：
1. 点击"刷新数据"
2. 检查Cookies是否有效
3. 检查网络连接

---

## 八、文件说明

```
scripts/
├── video-publish-system.html    # 前端网页
├── video-publish-backend.js     # 后端脚本
└── VIDEO-PUBLISH-GUIDE.md       # 使用说明

data/
├── cookies.json                 # Cookies存储
├── stats.json                   # 统计数据
├── publish-queue.json           # 发布队列
└── uploads/                     # 视频文件
```

---

*创建时间: 2026-03-08*
