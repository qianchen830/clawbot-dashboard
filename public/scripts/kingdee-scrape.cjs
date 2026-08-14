const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeKingdee() {
  console.log('启动浏览器...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const results = {
    enterprise: {},
    flagship: {},
    galaxy: {},
    knowledge: {}
  };
  
  try {
    // 金蝶云·企业版
    console.log('\n=== 访问金蝶云·企业版 ===');
    await page.goto('https://www.kingdee.com/products/enterprise', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const enterpriseTitle = await page.title();
    console.log('页面标题:', enterpriseTitle);
    
    // 提取主要内容
    const enterpriseContent = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : '';
      };
      
      return {
        title: getText('h1') || getText('.product-title') || document.title,
        description: getText('.product-desc') || getText('.description'),
        features: Array.from(document.querySelectorAll('.feature-item, .product-feature li')).map(el => el.innerText.trim()).filter(Boolean).slice(0, 20),
        modules: Array.from(document.querySelectorAll('.module-item, .cloud-item')).map(el => el.innerText.trim()).filter(Boolean).slice(0, 20)
      };
    });
    
    results.enterprise = {
      url: 'https://www.kingdee.com/products/enterprise',
      ...enterpriseContent
    };
    
    // 金蝶云·旗舰版
    console.log('\n=== 访问金蝶云·旗舰版 ===');
    await page.goto('https://www.kingdee.com/products/flagship', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const flagshipTitle = await page.title();
    console.log('页面标题:', flagshipTitle);
    
    const flagshipContent = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : '';
      };
      
      return {
        title: getText('h1') || getText('.product-title') || document.title,
        description: getText('.product-desc') || getText('.description'),
        features: Array.from(document.querySelectorAll('.feature-item, .product-feature li')).map(el => el.innerText.trim()).filter(Boolean).slice(0, 20),
        modules: Array.from(document.querySelectorAll('.module-item, .cloud-item')).map(el => el.innerText.trim()).filter(Boolean).slice(0, 20)
      };
    });
    
    results.flagship = {
      url: 'https://www.kingdee.com/products/flagship',
      ...flagshipContent
    };
    
    // 金蝶云·星瀚
    console.log('\n=== 访问金蝶云·星瀚 ===');
    await page.goto('https://www.kingdee.com/products/galaxy', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const galaxyTitle = await page.title();
    console.log('页面标题:', galaxyTitle);
    
    const galaxyContent = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : '';
      };
      
      return {
        title: getText('h1') || getText('.product-title') || document.title,
        description: getText('.product-desc') || getText('.description'),
        features: Array.from(document.querySelectorAll('.feature-item, .product-feature li')).map(el => el.innerText.trim()).filter(Boolean).slice(0, 20),
        modules: Array.from(document.querySelectorAll('.module-item, .cloud-item')).map(el => el.innerText.trim()).filter(Boolean).slice(0, 20)
      };
    });
    
    results.galaxy = {
      url: 'https://www.kingdee.com/products/galaxy',
      ...galaxyContent
    };
    
    // 金蝶知识中心
    console.log('\n=== 访问金蝶知识中心 ===');
    await page.goto('https://help.kingdee.com/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const knowledgeTitle = await page.title();
    console.log('页面标题:', knowledgeTitle);
    
    const knowledgeContent = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a')).filter(a => a.href && a.innerText.trim());
      return {
        title: document.title,
        categories: links.slice(0, 30).map(a => ({
          text: a.innerText.trim(),
          href: a.href
        }))
      };
    });
    
    results.knowledge = {
      url: 'https://help.kingdee.com/',
      ...knowledgeContent
    };
    
  } catch (error) {
    console.error('错误:', error.message);
  }
  
  await browser.close();
  
  // 保存结果
  const outputPath = '/home/openclaw/.openclaw/workspace/memory/kingdee-products-raw.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log('\n结果已保存到:', outputPath);
  
  return results;
}

scrapeKingdee().catch(console.error);
