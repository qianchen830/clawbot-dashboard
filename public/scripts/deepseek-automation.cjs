const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const USER_DATA_DIR = path.join(process.env.HOME, '.deepseek-browser-profile');
const DEEPSEEK_URL = 'https://chat.deepseek.com/';

async function initBrowser(headless = false) {
  // 确保用户数据目录存在
  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  }

  const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless,
    viewport: { width: 1280, height: 720 },
    args: ['--disable-blink-features=AutomationControlled']
  });

  return browser;
}

async function login() {
  console.log('启动浏览器（登录模式）...');
  console.log('请在浏览器中手动登录DeepSeek');
  console.log('登录完成后，按 Ctrl+C 退出');
  
  const browser = await initBrowser(false); // 显示浏览器
  const page = browser.pages()[0];
  
  await page.goto(DEEPSEEK_URL);
  
  // 保持浏览器打开，等待用户手动登录
  await new Promise(() => {}); // 永远等待
}

async function generateScript(prompt, outputPath) {
  console.log('启动浏览器...');
  const browser = await initBrowser(true); // 无头模式
  
  try {
    const page = browser.pages()[0];
    
    console.log('导航到DeepSeek...');
    await page.goto(DEEPSEEK_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 检查是否已登录
    if (page.url().includes('sign_in')) {
      console.log('未登录，请先运行登录命令: node deepseek-automation.js login');
      await browser.close();
      return null;
    }
    
    console.log('输入提示词...');
    // 查找输入框
    const inputSelector = 'textarea[placeholder*="问"], textarea[placeholder*="输入"], textarea';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    
    // 输入提示词
    await page.fill(inputSelector, prompt);
    
    console.log('发送消息...');
    // 查找发送按钮
    const sendButton = await page.locator('button:has-text("发送"), button[type="submit"]').first();
    await sendButton.click();
    
    console.log('等待AI回复...');
    // 等待回复完成（检测停止生成按钮消失或回复内容稳定）
    await page.waitForTimeout(30000); // 等待30秒
    
    console.log('提取回复内容...');
    // 提取回复
    const response = await page.locator('.markdown-body, .response-content, [class*="response"]').last().textContent();
    
    // 保存结果
    if (outputPath) {
      const result = {
        prompt,
        response,
        timestamp: new Date().toISOString()
      };
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log('结果已保存到:', outputPath);
    }
    
    await browser.close();
    return response;
    
  } catch (error) {
    console.error('错误:', error.message);
    await browser.close();
    throw error;
  }
}

async function batchGenerate(prompts, outputDir) {
  console.log(`开始批量生成，共 ${prompts.length} 个提示词`);
  
  const results = [];
  for (let i = 0; i < prompts.length; i++) {
    console.log(`\n处理第 ${i + 1}/${prompts.length} 个提示词`);
    const outputPath = path.join(outputDir, `script_${i + 1}.json`);
    
    try {
      const response = await generateScript(prompts[i], outputPath);
      results.push({ prompt: prompts[i], response, success: true });
    } catch (error) {
      console.error(`第 ${i + 1} 个失败:`, error.message);
      results.push({ prompt: prompts[i], error: error.message, success: false });
    }
    
    // 等待一段时间，避免请求过快
    if (i < prompts.length - 1) {
      console.log('等待 10 秒...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // 保存汇总结果
  const summaryPath = path.join(outputDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log('\n批量生成完成！汇总结果已保存到:', summaryPath);
  
  return results;
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'login':
      await login();
      break;
      
    case 'generate':
      const prompt = args[1];
      const output = args[2] || '/tmp/deepseek-result.json';
      if (!prompt) {
        console.log('用法: node deepseek-automation.js generate "提示词" [输出文件]');
        process.exit(1);
      }
      await generateScript(prompt, output);
      break;
      
    case 'batch':
      const promptsFile = args[1];
      const outputDir = args[2] || '/tmp/deepseek-batch';
      if (!promptsFile) {
        console.log('用法: node deepseek-automation.js batch <提示词文件> [输出目录]');
        process.exit(1);
      }
      const prompts = fs.readFileSync(promptsFile, 'utf-8').split('\n').filter(Boolean);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      await batchGenerate(prompts, outputDir);
      break;
      
    default:
      console.log('DeepSeek 自动化脚本');
      console.log('');
      console.log('用法:');
      console.log('  node deepseek-automation.js login                 # 手动登录');
      console.log('  node deepseek-automation.js generate "提示词"     # 生成剧本');
      console.log('  node deepseek-automation.js batch prompts.txt     # 批量生成');
      console.log('');
      console.log('示例:');
      console.log('  node deepseek-automation.js login');
      console.log('  node deepseek-automation.js generate "生成一个治愈系短视频剧本"');
      console.log('  node deepseek-automation.js batch themes.txt ./output');
  }
}

main().catch(console.error);
