#!/usr/bin/env node

/**
 * DeepSeek 自动生成剧本
 * 功能：使用已保存的cookies自动生成剧本
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(process.env.HOME, '.deepseek-cookies.json');
const DEEPSEEK_URL = 'https://chat.deepseek.com/';

// 提示词
const PROMPT = `请为短视频平台创作一个15秒治愈系动漫日常剧本。

主题：宠物治愈时刻 - 慵懒的午后，猫咪撒娇

要求：
1. 画面风格：日系动漫、柔和光线、温馨氛围
2. 内容结构：
   - 开场（0-3秒）：引入场景，吸引注意
   - 发展（3-12秒）：核心内容，情感铺垫
   - 结尾（12-15秒）：温馨收尾，引发共鸣
3. 每个镜头包含：
   - 画面描述（主体、动作、场景）
   - 镜头语言（景别、运镜）
   - 音效/配乐建议
4. 输出格式：
   - 分镜脚本表格（时间、画面、镜头、音效）
   - AI视频生成提示词（中英文）
   - 配音文案

情感基调：温暖治愈，让人看了会心一笑`;

async function generateScript() {
  console.log('\n🚀 DeepSeek自动生成剧本...\n');
  
  // 检查cookies
  if (!fs.existsSync(COOKIES_PATH)) {
    console.log('❌ 未找到cookies，请先运行: node deepseek-login.js');
    process.exit(1);
  }
  
  const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf8'));
  console.log('✅ 加载cookies成功');
  
  // 启动浏览器
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });
  
  const context = browser.newContext();
  await context.addCookies(cookies);
  
  const page = await context.newPage();
  
  try {
    console.log('🌐 访问DeepSeek...');
    await page.goto(DEEPSEEK_URL, { waitUntil: 'networkidle', timeout: 60000 });
    
    // 检查是否登录成功
    await page.waitForTimeout(2000);
    
    // 查找输入框（DeepSeek的输入框选择器）
    console.log('🔍 查找输入框...');
    const inputBox = await page.waitForSelector('textarea[placeholder*="输入"]', { timeout: 10000 })
      .catch(() => page.waitForSelector('textarea', { timeout: 10000 }));
    
    if (!inputBox) {
      console.log('❌ 未找到输入框，可能需要重新登录');
      await browser.close();
      process.exit(1);
    }
    
    console.log('📝 输入提示词...');
    await inputBox.fill(PROMPT);
    
    // 等待一下
    await page.waitForTimeout(1000);
    
    // 查找发送按钮并点击
    console.log('📤 发送提示词...');
    const sendBtn = await page.waitForSelector('button[type="submit"], button:has-text("发送")', { timeout: 5000 })
      .catch(() => page.keyboard.press('Enter'));
    
    if (sendBtn && typeof sendBtn !== 'boolean') {
      await sendBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    
    console.log('⏳ 等待DeepSeek生成剧本（约30秒）...');
    
    // 等待响应完成
    await page.waitForTimeout(30000);
    
    // 获取生成的文本
    console.log('📖 提取剧本内容...');
    const responseText = await page.evaluate(() => {
      // 尝试多种选择器
      const selectors = [
        '.markdown-body',
        '.message-content',
        '[class*="response"]',
        '[class*="message"]'
      ];
      
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.length > 100) {
          return el.textContent;
        }
      }
      
      // 如果没找到，返回最后一个大段文本
      const allText = Array.from(document.querySelectorAll('p, div'))
        .map(el => el.textContent)
        .filter(text => text.length > 50)
        .pop();
      
      return allText || '未找到响应内容';
    });
    
    // 保存剧本
    const outputPath = path.join(
      process.env.HOME, 
      '.openclaw/workspace/video-projects/2026-03-11_宠物治愈时刻/剧本/script.md'
    );
    
    const scriptContent = `# 宠物治愈时刻 - 15秒剧本

## 基本信息
- 类型：治愈系动漫日常
- 时长：15秒
- 主题：宠物治愈时刻 - 慵懒的午后，猫咪撒娇
- 创建时间：${new Date().toLocaleString('zh-CN')}

## 剧本内容

${responseText}

---
*由 DeepSeek 自动生成*
`;
    
    fs.writeFileSync(outputPath, scriptContent);
    console.log(`\n✅ 剧本已保存到: ${outputPath}\n`);
    console.log('📄 剧本内容预览：');
    console.log('─'.repeat(50));
    console.log(responseText.substring(0, 500) + '...\n');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
  }
}

// 运行
generateScript().catch(console.error);
