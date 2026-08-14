# 短视频多平台发布自动化脚本

**创建时间**: 2026-03-07 14:00
**状态**: 开发中
**用途**: 自动化发布视频到多个平台

---

## 📊 平台发布对比

| 平台 | 自动化难度 | API支持 | 推荐方式 |
|------|-----------|---------|----------|
| **抖音** | ⭐⭐⭐⭐⭐ | 无 | 浏览器自动化 |
| **B站** | ⭐⭐⭐ | 有 | API + 浏览器 |
| **快手** | ⭐⭐⭐⭐⭐ | 无 | 浏览器自动化 |
| **视频号** | ⭐⭐⭐⭐⭐ | 无 | 浏览器自动化 |
| **小红书** | ⭐⭐⭐⭐⭐ | 无 | 浏览器自动化 |

---

## 🛠️ 技术方案

### 方案一：Playwright 浏览器自动化

#### 优点
- 模拟真实用户操作
- 支持所有平台
- 可处理验证码（手动介入）

#### 缺点
- 需要登录态维护
- 可能被检测为自动化
- 运行速度较慢

### 方案二：平台 API（仅部分平台）

#### B站发布 API
```javascript
// B站视频上传 API（需要登录态）
// 参考：https://github.com/bilibili/bilitools

const FormData = require('form-data');
const axios = require('axios');

async function uploadToBilibili(video, cookies) {
  // 1. 获取上传地址
  const uploadUrl = await getUploadUrl(cookies);
  
  // 2. 分片上传视频
  const chunkSize = 5 * 1024 * 1024; // 5MB
  const chunks = splitVideo(video, chunkSize);
  
  for (let i = 0; i < chunks.length; i++) {
    await uploadChunk(uploadUrl, chunks[i], i, chunks.length, cookies);
  }
  
  // 3. 提交视频信息
  const result = await submitVideo({
    title: video.title,
    desc: video.desc,
    tag: video.tags,
    tid: video.categoryId
  }, cookies);
  
  return result;
}
```

### 方案三：混合方案（推荐）

- B站：使用 API
- 抖音/快手/视频号：使用浏览器自动化
- 小红书：使用浏览器自动化

---

## 💻 完整发布脚本

### 1. 基础配置

```javascript
// multi-platform-publisher.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 平台配置
const PLATFORMS = {
  douyin: {
    name: '抖音',
    url: 'https://creator.douyin.com/',
    loginUrl: 'https://www.douyin.com/',
    selectors: {
      uploadBtn: '.upload-btn',
      fileInput: 'input[type="file"]',
      titleInput: '.title-input',
      descInput: '.desc-input',
      submitBtn: '.submit-btn'
    }
  },
  bilibili: {
    name: 'B站',
    url: 'https://member.bilibili.com/platform/home',
    loginUrl: 'https://www.bilibili.com/',
    selectors: {
      uploadBtn: '.upload-btn',
      fileInput: 'input[type="file"]',
      titleInput: '.title-input',
      descInput: '.desc-input',
      tagsInput: '.tags-input',
      submitBtn: '.submit-btn'
    }
  },
  kuaishou: {
    name: '快手',
    url: 'https://cp.kuaishou.com/',
    loginUrl: 'https://www.kuaishou.com/',
    selectors: {
      uploadBtn: '.upload-btn',
      fileInput: 'input[type="file"]',
      titleInput: '.title-input',
      descInput: '.desc-input',
      submitBtn: '.submit-btn'
    }
  },
  weixin: {
    name: '视频号',
    url: 'https://channels.weixin.qq.com/',
    loginUrl: 'https://channels.weixin.qq.com/',
    selectors: {
      uploadBtn: '.upload-btn',
      fileInput: 'input[type="file"]',
      titleInput: '.title-input',
      descInput: '.desc-input',
      submitBtn: '.submit-btn'
    }
  }
};

// 视频信息配置
class VideoInfo {
  constructor(options) {
    this.title = options.title || '';
    this.description = options.description || '';
    this.tags = options.tags || [];
    this.filePath = options.filePath || '';
    this.coverPath = options.coverPath || '';
    this.categoryId = options.categoryId || 0;
  }
}

// 发布结果
class PublishResult {
  constructor(platform, success, message, videoUrl = '') {
    this.platform = platform;
    this.success = success;
    this.message = message;
    this.videoUrl = videoUrl;
    this.timestamp = new Date().toISOString();
  }
}
```

### 2. 抖音发布脚本

```javascript
// douyin-publisher.js
class DouyinPublisher {
  constructor(browser, cookies) {
    this.browser = browser;
    this.cookies = cookies;
    this.context = null;
    this.page = null;
  }
  
  async init() {
    // 创建浏览器上下文并设置 cookies
    this.context = await this.browser.newContext();
    if (this.cookies && this.cookies.length > 0) {
      await this.context.addCookies(this.cookies);
    }
    this.page = await this.context.newPage();
  }
  
  async publish(videoInfo) {
    try {
      console.log('[抖音] 开始发布...');
      
      // 1. 进入创作者中心
      await this.page.goto('https://creator.douyin.com/creator-micro/content/upload', {
        waitUntil: 'networkidle'
      });
      
      // 等待页面加载
      await this.page.waitForTimeout(2000);
      
      // 2. 检查是否需要登录
      const needLogin = await this.page.$('.login-button');
      if (needLogin) {
        console.log('[抖音] 需要登录，请手动登录...');
        await this.page.waitForTimeout(60000); // 等待1分钟手动登录
      }
      
      // 3. 上传视频
      const fileInput = await this.page.$('input[type="file"]');
      if (!fileInput) {
        throw new Error('找不到文件上传输入框');
      }
      
      await fileInput.setInputFiles(videoInfo.filePath);
      console.log('[抖音] 视频上传中...');
      
      // 等待上传完成（最多等待10分钟）
      await this.page.waitForSelector('.upload-success', { timeout: 600000 });
      console.log('[抖音] 视频上传完成');
      
      // 4. 填写标题和描述
      await this.page.waitForTimeout(2000);
      
      // 标题
      const titleInput = await this.page.$('.title-input, input[placeholder*="标题"]');
      if (titleInput) {
        await titleInput.fill(videoInfo.title.substring(0, 30)); // 抖音标题限制30字
      }
      
      // 描述（抖音的描述和标题是同一个）
      // 标签
      const tagsContainer = await this.page.$('.tag-input, .topic-input');
      if (tagsContainer && videoInfo.tags.length > 0) {
        for (const tag of videoInfo.tags.slice(0, 5)) { // 最多5个标签
          await tagsContainer.fill(`#${tag}`);
          await this.page.keyboard.press('Enter');
          await this.page.waitForTimeout(500);
        }
      }
      
      // 5. 发布
      await this.page.waitForTimeout(2000);
      const publishBtn = await this.page.$('.publish-btn, button:has-text("发布")');
      if (publishBtn) {
        await publishBtn.click();
      }
      
      // 等待发布完成
      await this.page.waitForSelector('.publish-success', { timeout: 60000 });
      
      console.log('[抖音] 发布成功');
      return new PublishResult('douyin', true, '发布成功');
      
    } catch (error) {
      console.error('[抖音] 发布失败:', error.message);
      return new PublishResult('douyin', false, error.message);
    }
  }
  
  async close() {
    if (this.context) {
      await this.context.close();
    }
  }
}

module.exports = DouyinPublisher;
```

### 3. B站发布脚本

```javascript
// bilibili-publisher.js
class BilibiliPublisher {
  constructor(browser, cookies) {
    this.browser = browser;
    this.cookies = cookies;
    this.context = null;
    this.page = null;
  }
  
  async init() {
    this.context = await this.browser.newContext();
    if (this.cookies && this.cookies.length > 0) {
      await this.context.addCookies(this.cookies);
    }
    this.page = await this.context.newPage();
  }
  
  async publish(videoInfo) {
    try {
      console.log('[B站] 开始发布...');
      
      // 1. 进入投稿页面
      await this.page.goto('https://member.bilibili.com/platform/upload/video/frame', {
        waitUntil: 'networkidle'
      });
      
      await this.page.waitForTimeout(2000);
      
      // 2. 检查登录状态
      const loginBtn = await this.page.$('.login-btn, .header-login');
      if (loginBtn) {
        console.log('[B站] 需要登录，请手动登录...');
        await this.page.waitForTimeout(60000);
      }
      
      // 3. 上传视频
      const fileInput = await this.page.$('input[type="file"]');
      if (!fileInput) {
        throw new Error('找不到文件上传输入框');
      }
      
      await fileInput.setInputFiles(videoInfo.filePath);
      console.log('[B站] 视频上传中...');
      
      // 等待上传完成
      await this.page.waitForSelector('.upload-status--success', { timeout: 600000 });
      console.log('[B站] 视频上传完成');
      
      // 4. 填写信息
      await this.page.waitForTimeout(3000);
      
      // 标题
      const titleInput = await this.page.$('input[placeholder*="标题"], .title-input');
      if (titleInput) {
        await titleInput.fill(videoInfo.title.substring(0, 80)); // B站标题限制80字
      }
      
      // 简介
      const descInput = await this.page.$('textarea[placeholder*="简介"], .desc-input');
      if (descInput) {
        await descInput.fill(videoInfo.description.substring(0, 2000)); // B站简介限制2000字
      }
      
      // 标签
      const tagsInput = await this.page.$('.tag-input input, input[placeholder*="标签"]');
      if (tagsInput && videoInfo.tags.length > 0) {
        for (const tag of videoInfo.tags.slice(0, 12)) { // 最多12个标签
          await tagsInput.fill(tag);
          await this.page.keyboard.press('Enter');
          await this.page.waitForTimeout(500);
        }
      }
      
      // 分区选择（需要根据实际情况调整）
      // ...
      
      // 5. 发布
      await this.page.waitForTimeout(2000);
      const submitBtn = await this.page.$('.submit-btn, button:has-text("立即投稿")');
      if (submitBtn) {
        await submitBtn.click();
      }
      
      // 等待发布完成
      await this.page.waitForSelector('.submit-success', { timeout: 120000 });
      
      console.log('[B站] 发布成功');
      return new PublishResult('bilibili', true, '发布成功');
      
    } catch (error) {
      console.error('[B站] 发布失败:', error.message);
      return new PublishResult('bilibili', false, error.message);
    }
  }
  
  async close() {
    if (this.context) {
      await this.context.close();
    }
  }
}

module.exports = BilibiliPublisher;
```

### 4. 多平台发布管理器

```javascript
// multi-publisher.js
const { chromium } = require('playwright');
const DouyinPublisher = require('./douyin-publisher');
const BilibiliPublisher = require('./bilibili-publisher');
const fs = require('fs');

class MultiPlatformPublisher {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.publishers = {};
    this.cookies = this.loadCookies();
  }
  
  // 加载 cookies
  loadCookies() {
    const cookiesPath = path.join(__dirname, 'cookies.json');
    if (fs.existsSync(cookiesPath)) {
      return JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'));
    }
    return {};
  }
  
  // 保存 cookies
  saveCookies() {
    const cookiesPath = path.join(__dirname, 'cookies.json');
    fs.writeFileSync(cookiesPath, JSON.stringify(this.cookies, null, 2));
  }
  
  // 初始化浏览器
  async init() {
    console.log('启动浏览器...');
    this.browser = await chromium.launch({
      headless: false, // 设置为 true 可以无头运行
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
  }
  
  // 发布到单个平台
  async publishToPlatform(platform, videoInfo) {
    let publisher;
    
    switch (platform) {
      case 'douyin':
        publisher = new DouyinPublisher(this.browser, this.cookies.douyin);
        break;
      case 'bilibili':
        publisher = new BilibiliPublisher(this.browser, this.cookies.bilibili);
        break;
      // 添加其他平台...
      default:
        console.log(`不支持的平台: ${platform}`);
        return new PublishResult(platform, false, '不支持的平台');
    }
    
    await publisher.init();
    const result = await publisher.publish(videoInfo);
    await publisher.close();
    
    return result;
  }
  
  // 发布到多个平台
  async publishToMultiple(videoInfo, platforms) {
    const results = [];
    
    for (const platform of platforms) {
      console.log(`\n========== 发布到 ${platform} ==========`);
      const result = await this.publishToPlatform(platform, videoInfo);
      results.push(result);
      
      // 平台间隔（避免频繁操作）
      if (platforms.indexOf(platform) < platforms.length - 1) {
        console.log('等待5秒后继续...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    return results;
  }
  
  // 关闭浏览器
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// 使用示例
async function main() {
  const publisher = new MultiPlatformPublisher({});
  
  await publisher.init();
  
  const videoInfo = new VideoInfo({
    title: 'AI视频生成工具对比，哪个最好用？',
    description: '对比了可灵AI、即梦AI、Runway等主流AI视频生成工具，从生成质量、价格、易用性等多个维度进行评测。#AI工具 #视频生成 #科技测评',
    tags: ['AI', '视频生成', '科技', '测评', '工具推荐'],
    filePath: '/path/to/video.mp4',
    coverPath: '/path/to/cover.jpg'
  });
  
  const results = await publisher.publishToMultiple(videoInfo, ['douyin', 'bilibili']);
  
  console.log('\n========== 发布结果 ==========');
  results.forEach(result => {
    console.log(`${result.platform}: ${result.success ? '成功' : '失败'} - ${result.message}`);
  });
  
  await publisher.close();
}

module.exports = MultiPlatformPublisher;
```

### 5. 定时发布脚本

```javascript
// scheduled-publisher.js
const cron = require('node-cron');
const MultiPlatformPublisher = require('./multi-publisher');

class ScheduledPublisher {
  constructor() {
    this.publisher = null;
    this.queue = [];
    this.isRunning = false;
  }
  
  async init() {
    this.publisher = new MultiPlatformPublisher({});
    await this.publisher.init();
    
    // 每分钟检查队列
    cron.schedule('* * * * *', () => {
      this.checkQueue();
    });
    
    console.log('定时发布器已启动');
  }
  
  // 添加到发布队列
  addToQueue(videoInfo, platforms, scheduledTime) {
    this.queue.push({
      videoInfo,
      platforms,
      scheduledTime,
      status: 'pending'
    });
    console.log(`已添加到发布队列，计划时间: ${scheduledTime}`);
  }
  
  // 检查队列
  async checkQueue() {
    if (this.isRunning || this.queue.length === 0) {
      return;
    }
    
    const now = new Date();
    const pendingItems = this.queue.filter(
      item => item.status === 'pending' && new Date(item.scheduledTime) <= now
    );
    
    if (pendingItems.length > 0) {
      this.isRunning = true;
      
      for (const item of pendingItems) {
        item.status = 'processing';
        try {
          const results = await this.publisher.publishToMultiple(
            item.videoInfo,
            item.platforms
          );
          item.status = 'completed';
          item.results = results;
        } catch (error) {
          item.status = 'failed';
          item.error = error.message;
        }
      }
      
      this.isRunning = false;
    }
  }
  
  // 获取队列状态
  getQueueStatus() {
    return this.queue.map(item => ({
      title: item.videoInfo.title,
      scheduledTime: item.scheduledTime,
      status: item.status
    }));
  }
  
  async close() {
    if (this.publisher) {
      await this.publisher.close();
    }
  }
}

module.exports = ScheduledPublisher;
```

### 6. 发布日志记录

```javascript
// publish-logger.js
const fs = require('fs');
const path = require('path');

class PublishLogger {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  
  // 记录发布日志
  log(result) {
    const logFile = path.join(this.logDir, `publish-${new Date().toISOString().split('T')[0]}.json`);
    
    let logs = [];
    if (fs.existsSync(logFile)) {
      logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
    }
    
    logs.push({
      ...result,
      timestamp: new Date().toISOString()
    });
    
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  }
  
  // 获取今日统计
  getTodayStats() {
    const logFile = path.join(this.logDir, `publish-${new Date().toISOString().split('T')[0]}.json`);
    
    if (!fs.existsSync(logFile)) {
      return { total: 0, success: 0, failed: 0 };
    }
    
    const logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
    return {
      total: logs.length,
      success: logs.filter(l => l.success).length,
      failed: logs.filter(l => !l.success).length
    };
  }
  
  // 导出日志
  exportCSV(startDate, endDate) {
    // 导出为 CSV 格式
    // ...
  }
}

module.exports = PublishLogger;
```

---

## 📋 使用指南

### 安装依赖

```bash
npm init -y
npm install playwright node-cron
npx playwright install chromium
```

### 首次运行（登录获取 cookies）

```javascript
// login.js
const { chromium } = require('playwright');
const fs = require('fs');

async function login() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 抖音登录
  console.log('请在浏览器中登录抖音...');
  await page.goto('https://www.douyin.com/');
  await page.waitForTimeout(120000); // 等待2分钟手动登录
  
  const douyinCookies = await context.cookies();
  
  // B站登录
  console.log('请在浏览器中登录B站...');
  await page.goto('https://www.bilibili.com/');
  await page.waitForTimeout(120000);
  
  const bilibiliCookies = await context.cookies();
  
  // 保存 cookies
  const cookies = {
    douyin: douyinCookies,
    bilibili: bilibiliCookies
  };
  fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));
  
  console.log('登录信息已保存');
  await browser.close();
}

login();
```

### 日常使用

```javascript
// publish.js
const MultiPlatformPublisher = require('./multi-publisher');

async function publish() {
  const publisher = new MultiPlatformPublisher();
  await publisher.init();
  
  const videoInfo = {
    title: '视频标题',
    description: '视频简介',
    tags: ['标签1', '标签2'],
    filePath: './video.mp4'
  };
  
  const results = await publisher.publishToMultiple(videoInfo, ['douyin', 'bilibili']);
  console.log(results);
  
  await publisher.close();
}

publish();
```

---

## ⚠️ 注意事项

### 风险警告
1. **账号风险**: 频繁自动化操作可能导致账号风控
2. **封号风险**: 部分平台可能检测并封禁自动化脚本
3. **时效性**: 平台页面结构变化可能导致脚本失效

### 最佳实践
1. **控制频率**: 每天发布不超过平台限制
2. **模拟真实**: 添加随机延迟，模拟人工操作
3. **维护cookies**: 定期更新登录状态
4. **备份数据**: 保存发布日志和视频备份
5. **监控状态**: 定期检查发布结果

---

## 🔗 相关文档

- `multi-platform-publish.md` - 多平台发布指南
- `data-tracking-templates.md` - 数据追踪模板
- `video-editing-automation.md` - 视频剪辑自动化

---

*最后更新: 2026-03-07 14:30*
