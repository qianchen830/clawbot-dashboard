const { chromium } = require('playwright');

async function openDeepSeekAndInput() {
  console.log('启动浏览器...');

  // 启动 Chromium
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  try {
    // 访问 DeepSeek
    console.log('正在打开 DeepSeek...');
    await page.goto('https://www.deepseek.com');

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 截图初始状态
    await page.screenshot({ path: '/tmp/deepseek_before_input.png' });
    console.log('✅ 初始截图已保存: /tmp/deepseek_before_input.png');

    // 查找输入框（尝试多种选择器）
    const selectors = [
      'textarea[placeholder*="输入"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="问"]',
      'div[contenteditable="true"]',
      'textarea',
    ];

    let inputBox = null;
    for (const selector of selectors) {
      try {
        inputBox = await page.waitForSelector(selector, { timeout: 5000 });
        if (inputBox) {
          console.log(`找到输入框: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!inputBox) {
      console.log('❌ 未找到输入框');
      await page.waitForTimeout(10000);
      await browser.close();
      return false;
    }

    // 输入文本
    console.log('正在输入: 帮我写一个短视频剧本');
    await inputBox.fill('帮我写一个短视频剧本');

    await page.waitForTimeout(2000);

    // 截图输入后状态
    await page.screenshot({ path: '/tmp/deepseek_after_input.png' });
    console.log('✅ 输入后截图已保存: /tmp/deepseek_after_input.png');

    // 查找发送按钮
    const buttonSelectors = [
      'button:has-text("发送")',
      'button[aria-label*="发送"]',
      'button[type="submit"]',
    ];

    let sendButton = null;
    for (const selector of buttonSelectors) {
      try {
        sendButton = await page.waitForSelector(selector, { timeout: 3000 });
        if (sendButton) {
          console.log(`找到发送按钮: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (sendButton) {
      console.log('点击发送按钮...');
      await sendButton.click();

      // 等待响应
      await page.waitForTimeout(10000);

      // 截图结果
      await page.screenshot({ path: '/tmp/deepseek_result.png', fullPage: true });
      console.log('✅ 结果截图已保存: /tmp/deepseek_result.png');
    }

    // 保持浏览器打开一段时间
    console.log('浏览器将在 30 秒后关闭...');
    await page.waitForTimeout(30000);

    await browser.close();
    return true;

  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ path: '/tmp/deepseek_error.png' });
    console.log('✅ 错误截图已保存: /tmp/deepseek_error.png');
    await page.waitForTimeout(10000);
    await browser.close();
    return false;
  }
}

openDeepSeekAndInput()
  .then(success => {
    if (success) {
      console.log('\n✅ 操作成功完成');
      console.log('📸 截图位置:');
      console.log('  - /tmp/deepseek_before_input.png');
      console.log('  - /tmp/deepseek_after_input.png');
      console.log('  - /tmp/deepseek_result.png');
      process.exit(0);
    } else {
      console.log('\n⚠️ 操作部分完成，请检查截图');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ 执行失败:', error);
    process.exit(1);
  });
