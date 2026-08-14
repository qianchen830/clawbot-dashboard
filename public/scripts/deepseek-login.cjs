#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(process.env.HOME, '.deepseek-cookies.json');

(async () => {
  console.log('\n🚀 启动DeepSeek登录工具...\n');
  console.log('📋 请在浏览器中登录DeepSeek');
  console.log('📋 登录成功后关闭浏览器即可\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });
  
  const page = await browser.newPage();
  
  await page.goto('https://chat.deepseek.com/');
  
  console.log('✅ 浏览器已打开');
  console.log('⏳ 请登录（等待中）...\n');
  
  // 等待登录成功（检测URL变化）
  await page.waitForURL(/chat/, { timeout: 300000 }).catch(() => {
    console.log('⏳ 继续等待...');
  });
  
  // 额外等待
  await page.waitForTimeout(3000);
  
  // 保存cookies
  const cookies = await page.context().cookies();
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  
  console.log(`\n✅ Cookies已保存: ${COOKIES_PATH}`);
  console.log('🎉 下次可以直接自动化了！\n');
  
  await browser.close();
})();
