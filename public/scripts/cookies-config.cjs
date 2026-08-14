#!/usr/bin/env node

/**
 * Cookies 配置工具
 * 用于保存从网页获取的 cookies 配置
 */

const fs = require('fs');
const path = require('path');

const DEEPSEEK_PROFILE = path.join(process.env.HOME, '.deepseek-browser-profile');
const KLINGAI_PROFILE = path.join(process.env.HOME, '.klingai-browser-profile');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function saveCookies(profileDir, cookies) {
    ensureDir(profileDir);
    
    // Playwright 使用 JSON 格式存储 cookies
    const cookiesFile = path.join(profileDir, 'cookies.json');
    
    // 转换 cookies 格式
    const formattedCookies = cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain || '',
        path: c.path || '/',
        expires: c.expires || -1,
        httpOnly: c.httpOnly || false,
        secure: c.secure || false,
        sameSite: c.sameSite || 'Lax'
    }));
    
    fs.writeFileSync(cookiesFile, JSON.stringify(formattedCookies, null, 2));
    console.log(`✅ Cookies 已保存到: ${cookiesFile}`);
    return cookiesFile;
}

function processConfig(configStr) {
    try {
        const config = JSON.parse(configStr);
        
        if (config.domain === 'chat.deepseek.com') {
            return saveCookies(DEEPSEEK_PROFILE, config.cookies);
        } else if (config.domain === 'klingai.kuaishou.com') {
            return saveCookies(KLINGAI_PROFILE, config.cookies);
        } else {
            throw new Error('未知域名: ' + config.domain);
        }
    } catch (e) {
        console.error('❌ 解析配置失败:', e.message);
        return null;
    }
}

// 命令行使用
const args = process.argv.slice(2);
if (args.length > 0) {
    const configStr = args[0];
    const result = processConfig(configStr);
    if (result) {
        console.log('✅ 配置成功！可以开始使用自动化脚本了。');
    }
}

module.exports = { saveCookies, processConfig };
