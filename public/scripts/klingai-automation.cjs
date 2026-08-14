const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const USER_DATA_DIR = path.join(process.env.HOME, '.klingai-browser-profile');
const KLINGAI_URL = 'https://klingai.kuaishou.com/';

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
  console.log('请在浏览器中手动登录可灵AI（微信扫码）');
  console.log('登录完成后，按 Ctrl+C 退出');
  
  const browser = await initBrowser(false);
  const page = browser.pages()[0];
  
  await page.goto(KLINGAI_URL);
  
  // 保持浏览器打开
  await new Promise(() => {});
}

async function textToVideo(prompt, duration = 5, aspectRatio = '16:9') {
  console.log('启动浏览器...');
  const browser = await initBrowser(true);
  
  try {
    const page = browser.pages()[0];
    
    console.log('导航到可灵AI...');
    await page.goto(KLINGAI_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 检查是否已登录
    const loginButton = await page.locator('button:has-text("登录"), text=登录').first();
    if (await loginButton.isVisible()) {
      console.log('未登录，请先运行登录命令: node klingai-automation.js login');
      await browser.close();
      return null;
    }
    
    console.log('选择文生视频模式...');
    // 点击文生视频
    await page.locator('text=文生视频, button:has-text("文生视频")').first().click();
    await page.waitForTimeout(2000);
    
    console.log('输入提示词...');
    // 输入提示词
    const textarea = await page.locator('textarea').first();
    await textarea.fill(prompt);
    
    console.log('设置参数...');
    // 选择时长
    await page.locator(`text=${duration}秒`).first().click();
    
    // 选择比例
    await page.locator(`text=${aspectRatio}`).first().click();
    
    console.log('生成视频...');
    // 点击生成按钮
    await page.locator('button:has-text("生成")').first().click();
    
    console.log('等待视频生成（可能需要2-5分钟）...');
    // 等待生成完成
    await page.waitForTimeout(180000); // 等待3分钟
    
    console.log('尝试下载视频...');
    // 点击下载
    const downloadButton = await page.locator('button:has-text("下载")').first();
    if (await downloadButton.isVisible()) {
      await downloadButton.click();
      console.log('视频已开始下载');
    }
    
    // 截图
    await page.screenshot({ path: '/tmp/klingai-result.png' });
    console.log('截图已保存到 /tmp/klingai-result.png');
    
    await browser.close();
    return { success: true, prompt, duration, aspectRatio };
    
  } catch (error) {
    console.error('错误:', error.message);
    await page.screenshot({ path: '/tmp/klingai-error.png' });
    await browser.close();
    throw error;
  }
}

async function imageToVideo(imagePath, prompt, duration = 5) {
  console.log('启动浏览器...');
  const browser = await initBrowser(true);
  
  try {
    const page = browser.pages()[0];
    
    console.log('导航到可灵AI...');
    await page.goto(KLINGAI_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('选择图生视频模式...');
    await page.locator('text=图生视频, button:has-text("图生视频")').first().click();
    await page.waitForTimeout(2000);
    
    console.log('上传图片...');
    // 上传图片
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(imagePath);
    await page.waitForTimeout(3000);
    
    console.log('输入提示词...');
    const textarea = await page.locator('textarea').first();
    await textarea.fill(prompt);
    
    console.log('设置时长...');
    await page.locator(`text=${duration}秒`).first().click();
    
    console.log('生成视频...');
    await page.locator('button:has-text("生成")').first().click();
    
    console.log('等待视频生成...');
    await page.waitForTimeout(180000);
    
    console.log('尝试下载...');
    const downloadButton = await page.locator('button:has-text("下载")').first();
    if (await downloadButton.isVisible()) {
      await downloadButton.click();
      console.log('视频已开始下载');
    }
    
    await page.screenshot({ path: '/tmp/klingai-result.png' });
    
    await browser.close();
    return { success: true, imagePath, prompt, duration };
    
  } catch (error) {
    console.error('错误:', error.message);
    await page.screenshot({ path: '/tmp/klingai-error.png' });
    await browser.close();
    throw error;
  }
}

async function batchGenerate(prompts, outputDir) {
  console.log(`开始批量生成，共 ${prompts.length} 个提示词`);
  
  const results = [];
  for (let i = 0; i < prompts.length; i++) {
    console.log(`\n处理第 ${i + 1}/${prompts.length} 个提示词`);
    
    try {
      const result = await textToVideo(prompts[i]);
      results.push({ prompt: prompts[i], ...result });
    } catch (error) {
      console.error(`第 ${i + 1} 个失败:`, error.message);
      results.push({ prompt: prompts[i], error: error.message, success: false });
    }
    
    // 等待
    if (i < prompts.length - 1) {
      console.log('等待 60 秒...');
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }
  
  // 保存汇总结果
  const summaryPath = path.join(outputDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log('\n批量生成完成！');
  
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
      
    case 'text':
      const prompt = args[1];
      const duration = parseInt(args[2]) || 5;
      const ratio = args[3] || '16:9';
      if (!prompt) {
        console.log('用法: node klingai-automation.js text "提示词" [时长] [比例]');
        process.exit(1);
      }
      await textToVideo(prompt, duration, ratio);
      break;
      
    case 'image':
      const imgPath = args[1];
      const imgPrompt = args[2];
      const imgDuration = parseInt(args[3]) || 5;
      if (!imgPath || !imgPrompt) {
        console.log('用法: node klingai-automation.js image <图片路径> "提示词" [时长]');
        process.exit(1);
      }
      await imageToVideo(imgPath, imgPrompt, imgDuration);
      break;
      
    case 'batch':
      const promptsFile = args[1];
      const outputDir = args[2] || '/tmp/klingai-batch';
      if (!promptsFile) {
        console.log('用法: node klingai-automation.js batch <提示词文件> [输出目录]');
        process.exit(1);
      }
      const prompts = fs.readFileSync(promptsFile, 'utf-8').split('\n').filter(Boolean);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      await batchGenerate(prompts, outputDir);
      break;
      
    default:
      console.log('可灵AI 自动化脚本');
      console.log('');
      console.log('用法:');
      console.log('  node klingai-automation.js login                    # 手动登录');
      console.log('  node klingai-automation.js text "提示词"           # 文生视频');
      console.log('  node klingai-automation.js image <图片> "提示词"   # 图生视频');
      console.log('  node klingai-automation.js batch prompts.txt       # 批量生成');
      console.log('');
      console.log('示例:');
      console.log('  node klingai-automation.js login');
      console.log('  node klingai-automation.js text "治愈系动漫风格，少女读书" 5 16:9');
      console.log('  node klingai-automation.js image ./photo.jpg "人物微笑" 5');
  }
}

main().catch(console.error);
