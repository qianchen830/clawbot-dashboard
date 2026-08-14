/**
 * DeepSeek 批量剧本生成器 - 交互模式
 * 显示浏览器窗口，允许手动登录
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  headless: false, // 显示浏览器窗口
  slowMo: 100,
  timeout: 300000, // 5分钟超时
  outputDir: './scripts/output',
  logFile: './scripts/generate-log.txt',
};

// 要生成的剧本主题
const TASKS = [
  // B站动漫日常风格
  { template: 'biliAnime', topic: '时间静止的瞬间' },
  { template: 'biliAnime', topic: '图书馆的秘密' },
  { template: 'biliAnime', topic: '下雨天的偶遇' },
  { template: 'biliAnime', topic: '第一次牵手' },
  { template: 'biliAnime', topic: '夕阳下的告白' },
  
  // 抖音快节奏风格
  { template: 'douyinFast', topic: '社恐的日常' },
  { template: 'douyinFast', topic: '打工人的崩溃瞬间' },
  
  // 凡人修仙同人
  { template: 'fanrenXianxia', topic: '周末早晨一起做早餐' },
  { template: 'fanrenXianxia', topic: '下班回家的温馨时刻' },
];

// 提示词模板
const TEMPLATES = {
  biliAnime: `你是一个专业的短视频剧本编剧。请根据以下主题生成一个30-60秒的短视频剧本。

格式要求：
【标题】
【主题】
【风格】
【时长】

【剧本内容】
@图1 [时间] [场景描述]
角色：(角色描述)
动作：(动作描述)
镜头：(镜头语言)
风格：(画面风格)
音效：(背景音乐/音效)

对白：
角色A：xxx
角色B：xxx

---

主题：{topic}
风格：动漫日常、温馨治愈
要求：
1. 对话简洁有趣
2. 适合B站用户群体
3. 有反转或治愈点
4. 便于AI视频生成`,

  douyinFast: `你是一个抖音短视频剧本专家。请根据以下主题生成一个15-30秒的爆款短视频剧本。

格式要求：
【标题】(带悬念)
【黄金3秒】(开头抓人)
【反转点】
【结尾钩子】

【分镜脚本】
镜头1 (0-3秒): xxx
镜头2 (3-8秒): xxx
...

主题：{topic}
要求：
1. 开头3秒必须抓人眼球
2. 中间有情绪起伏
3. 结尾有记忆点
4. 适合抖音算法推荐`,

  fanrenXianxia: `你是《凡人修仙传》同人创作专家。请根据以下场景生成一个浪漫温馨的同人剧本。

设定：
- 韩立：性格沉稳、话少、细心、有担当
- 南宫婉：温柔大方、偶尔俏皮
- 背景：现代都市AU

格式：
【场景】
【时间】
【氛围】

【剧本】
@图1 [时间片段]
场景：xxx
角色：韩立(描述)、南宫婉(描述)
动作：xxx
镜头：xxx
风格：xxx
音效：xxx

对白：
韩立：xxx
南宫婉：xxx

场景：{scene}
要求：
1. 保持角色性格特点
2. 温馨治愈的氛围
3. 细节描写丰富
4. 适合AI视频生成`,
};

// 日志函数
function log(message) {
  const timestamp = new Date().toLocaleString('zh-CN');
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(CONFIG.logFile, logMessage);
}

// 主函数
async function main() {
  // 确保输出目录存在
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  // 清空日志
  fs.writeFileSync(CONFIG.logFile, '');
  log('🚀 DeepSeek 批量剧本生成器启动（交互模式）');
  log(`📋 任务数量: ${TASKS.length}`);
  log('⚠️ 浏览器窗口将打开，请手动登录 DeepSeek');
  
  let browser = null;
  let page = null;
  let successCount = 0;
  let failCount = 0;
  
  try {
    log('🌐 启动浏览器...');
    browser = await chromium.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: ['--start-maximized'],
    });
    page = await browser.newPage();
    log('✅ 浏览器启动成功');
    
    // 打开 DeepSeek
    log('🌐 打开 DeepSeek...');
    await page.goto('https://chat.deepseek.com/', { timeout: CONFIG.timeout });
    await page.waitForLoadState('networkidle');
    log('✅ DeepSeek 页面加载完成');
    
    // 等待用户登录
    log('');
    log('='.repeat(50));
    log('⚠️ 请在浏览器窗口中手动登录 DeepSeek');
    log('⚠️ 登录成功后，等待聊天输入框出现...');
    log('='.repeat(50));
    log('');
    
    // 等待登录完成（检测聊天输入框）
    try {
      await page.waitForSelector('textarea, [contenteditable="true"], textarea[placeholder*="问"], textarea[placeholder*="输入"], [class*="chat-input"], [class*="input"]', { 
        timeout: 300000 // 5分钟等待登录
      });
      log('✅ 登录成功！开始生成剧本...');
      log('');
    } catch (e) {
      log('❌ 等待登录超时，请重试');
      await browser.close();
      return;
    }
    
    // 批量生成
    for (let i = 0; i < TASKS.length; i++) {
      const task = TASKS[i];
      log(`📝 [${i + 1}/${TASKS.length}] 生成剧本: ${task.template} - ${task.topic}`);
      
      try {
        const template = TEMPLATES[task.template];
        const prompt = template.replace('{topic}', task.topic).replace('{scene}', task.topic);
        
        // 找到输入框
        const inputSelectors = [
          'textarea',
          '[contenteditable="true"]',
          'textarea[placeholder*="问"]',
          'textarea[placeholder*="输入"]',
          '[class*="chat-input"]',
          '[class*="input"]',
        ];
        
        let inputFound = false;
        for (const selector of inputSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 5000 });
            await page.fill(selector, prompt);
            inputFound = true;
            break;
          } catch (e) {
            continue;
          }
        }
        
        if (!inputFound) {
          log('❌ 未找到输入框，跳过');
          failCount++;
          continue;
        }
        
        // 发送
        await page.keyboard.press('Enter');
        log('⏳ 等待 AI 生成...');
        
        // 等待回复完成
        await page.waitForTimeout(5000);
        
        // 尝试获取回复
        let response = '';
        const selectors = [
          '.markdown-body',
          '[class*="response"]',
          '[class*="answer"]',
          '[class*="message"]:last-child',
          '.prose',
        ];
        
        for (const selector of selectors) {
          try {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
              response = await elements[elements.length - 1].innerText();
              if (response && response.length > 50) break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (response && response.length > 50) {
          // 保存剧本
          const fileName = `${task.template}_${task.topic.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '_')}_${Date.now()}.md`;
          const savePath = path.join(CONFIG.outputDir, fileName);
          const fullContent = `# ${task.template} - ${task.topic}\n\n## 提示词\n\`\`\`\n${prompt}\n\`\`\`\n\n## 生成结果\n\n${response}\n\n---\n生成时间: ${new Date().toLocaleString('zh-CN')}\n模板: ${task.template}\n`;
          
          fs.writeFileSync(savePath, fullContent, 'utf-8');
          log(`✅ 剧本已保存: ${fileName}`);
          successCount++;
        } else {
          log('⚠️ 响应内容不足，跳过');
          failCount++;
        }
        
        // 等待间隔
        await page.waitForTimeout(3000);
        
        // 尝试新对话
        const newChatBtn = await page.$('button:has-text("新对话"), [class*="new-chat"], [class*="newChat"], button:has-text("新的对话")');
        if (newChatBtn) {
          await newChatBtn.click();
          await page.waitForTimeout(2000);
        }
        
      } catch (error) {
        log(`❌ 生成失败: ${error.message}`);
        failCount++;
      }
    }
    
  } catch (error) {
    log(`❌ 主流程错误: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
      log('👋 浏览器已关闭');
    }
    
    // 统计
    log('');
    log('='.repeat(50));
    log('📊 生成完成！');
    log(`✅ 成功: ${successCount}`);
    log(`❌ 失败: ${failCount}`);
    log(`📁 保存位置: ${path.resolve(CONFIG.outputDir)}`);
    log('='.repeat(50));
  }
}

// 运行
main().catch(console.error);
