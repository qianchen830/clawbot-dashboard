#!/usr/bin/env node
/**
 * 视频发布系统后端
 * 功能：
 * 1. 接收视频发布请求
 * 2. 自动发布到各平台
 * 3. 获取粉丝数据
 * 4. 获取视频数据
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
    dataDir: path.join(__dirname, '../data/video-publish'),
    cookiesFile: path.join(__dirname, '../data/cookies.json'),
    statsFile: path.join(__dirname, '../data/stats.json'),
    queueFile: path.join(__dirname, '../data/publish-queue.json'),
    uploadDir: path.join(__dirname, '../data/uploads')
};

// 确保目录存在
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// 初始化
function init() {
    ensureDir(CONFIG.dataDir);
    ensureDir(CONFIG.uploadDir);
    
    // 初始化数据文件
    if (!fs.existsSync(CONFIG.cookiesFile)) {
        fs.writeFileSync(CONFIG.cookiesFile, JSON.stringify({}, null, 2));
    }
    if (!fs.existsSync(CONFIG.statsFile)) {
        fs.writeFileSync(CONFIG.statsFile, JSON.stringify(getInitialStats(), null, 2));
    }
    if (!fs.existsSync(CONFIG.queueFile)) {
        fs.writeFileSync(CONFIG.queueFile, JSON.stringify([], null, 2));
    }
    
    console.log('✅ 视频发布系统初始化完成');
}

// 初始统计数据
function getInitialStats() {
    return {
        douyin: { fans: 0, change: 0, videos: [] },
        kuaishou: { fans: 0, change: 0, videos: [] },
        bilibili: { fans: 0, change: 0, videos: [] },
        xiaohongshu: { fans: 0, change: 0, videos: [] },
        shipinhao: { fans: 0, change: 0, videos: [] },
        youtube: { fans: 0, change: 0, videos: [] },
        lastUpdate: new Date().toISOString()
    };
}

// 保存Cookies
function saveCookies(platform, cookies) {
    const allCookies = JSON.parse(fs.readFileSync(CONFIG.cookiesFile, 'utf8'));
    allCookies[platform] = {
        cookies: cookies,
        updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(CONFIG.cookiesFile, JSON.stringify(allCookies, null, 2));
    console.log(`✅ ${platform} Cookies 已保存`);
}

// 获取Cookies
function getCookies(platform) {
    const allCookies = JSON.parse(fs.readFileSync(CONFIG.cookiesFile, 'utf8'));
    return allCookies[platform]?.cookies || null;
}

// 添加到发布队列
function addToQueue(publishData) {
    const queue = JSON.parse(fs.readFileSync(CONFIG.queueFile, 'utf8'));
    const item = {
        id: Date.now(),
        ...publishData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        results: {}
    };
    queue.push(item);
    fs.writeFileSync(CONFIG.queueFile, JSON.stringify(queue, null, 2));
    console.log(`✅ 已添加到发布队列: ${item.id}`);
    return item.id;
}

// 获取发布队列
function getQueue() {
    return JSON.parse(fs.readFileSync(CONFIG.queueFile, 'utf8'));
}

// 更新队列项状态
function updateQueueItem(id, platform, status, result = {}) {
    const queue = JSON.parse(fs.readFileSync(CONFIG.queueFile, 'utf8'));
    const item = queue.find(q => q.id === id);
    if (item) {
        item.results[platform] = {
            status: status,
            ...result,
            updatedAt: new Date().toISOString()
        };
        
        // 检查是否全部完成
        const allPlatforms = item.platforms;
        const completed = allPlatforms.every(p => item.results[p]?.status === 'success' || item.results[p]?.status === 'failed');
        if (completed) {
            item.status = 'completed';
        }
        
        fs.writeFileSync(CONFIG.queueFile, JSON.stringify(queue, null, 2));
    }
}

// 更新统计数据
function updateStats(platform, data) {
    const stats = JSON.parse(fs.readFileSync(CONFIG.statsFile, 'utf8'));
    stats[platform] = {
        ...stats[platform],
        ...data,
        updatedAt: new Date().toISOString()
    };
    stats.lastUpdate = new Date().toISOString();
    fs.writeFileSync(CONFIG.statsFile, JSON.stringify(stats, null, 2));
}

// 获取统计数据
function getStats() {
    return JSON.parse(fs.readFileSync(CONFIG.statsFile, 'utf8'));
}

// 发布到抖音
async function publishToDouyin(videoPath, title, desc, tags) {
    console.log('📤 发布到抖音...');
    const cookies = getCookies('douyin');
    if (!cookies) {
        throw new Error('抖音 Cookies 未配置');
    }
    
    // TODO: 实现抖音发布逻辑
    // 需要使用 Playwright 自动化
    
    // 模拟发布成功
    return {
        success: true,
        videoId: 'douyin_' + Date.now(),
        url: 'https://www.douyin.com/video/' + Date.now()
    };
}

// 发布到快手
async function publishToKuaishou(videoPath, title, desc, tags) {
    console.log('📤 发布到快手...');
    const cookies = getCookies('kuaishou');
    if (!cookies) {
        throw new Error('快手 Cookies 未配置');
    }
    
    // TODO: 实现快手发布逻辑
    
    return {
        success: true,
        videoId: 'kuaishou_' + Date.now(),
        url: 'https://www.kuaishou.com/short-video/' + Date.now()
    };
}

// 发布到B站
async function publishToBilibili(videoPath, title, desc, tags) {
    console.log('📤 发布到B站...');
    const cookies = getCookies('bilibili');
    if (!cookies) {
        throw new Error('B站 Cookies 未配置');
    }
    
    // TODO: 实现B站发布逻辑
    
    return {
        success: true,
        videoId: 'bilibili_' + Date.now(),
        url: 'https://www.bilibili.com/video/BV' + Date.now()
    };
}

// 发布到小红书
async function publishToXiaohongshu(videoPath, title, desc, tags) {
    console.log('📤 发布到小红书...');
    const cookies = getCookies('xiaohongshu');
    if (!cookies) {
        throw new Error('小红书 Cookies 未配置');
    }
    
    // TODO: 实现小红书发布逻辑
    
    return {
        success: true,
        videoId: 'xiaohongshu_' + Date.now(),
        url: 'https://www.xiaohongshu.com/discovery/item/' + Date.now()
    };
}

// 发布到视频号
async function publishToShipinhao(videoPath, title, desc, tags) {
    console.log('📤 发布到视频号...');
    const cookies = getCookies('shipinhao');
    if (!cookies) {
        throw new Error('视频号 Cookies 未配置');
    }
    
    // TODO: 实现视频号发布逻辑
    
    return {
        success: true,
        videoId: 'shipinhao_' + Date.now(),
        url: 'https://channels.weixin.qq.com/'
    };
}

// 发布到YouTube
async function publishToYoutube(videoPath, title, desc, tags) {
    console.log('📤 发布到YouTube...');
    const cookies = getCookies('youtube');
    if (!cookies) {
        throw new Error('YouTube Cookies 未配置');
    }
    
    // TODO: 实现YouTube发布逻辑
    
    return {
        success: true,
        videoId: 'youtube_' + Date.now(),
        url: 'https://www.youtube.com/watch?v=' + Date.now()
    };
}

// 执行发布
async function executePublish(queueId) {
    const queue = getQueue();
    const item = queue.find(q => q.id === queueId);
    if (!item) {
        throw new Error('找不到发布任务');
    }
    
    const videoPath = path.join(CONFIG.uploadDir, item.videoFile);
    const results = {};
    
    for (const platform of item.platforms) {
        try {
            let result;
            switch (platform) {
                case 'douyin':
                    result = await publishToDouyin(videoPath, item.title, item.desc, item.tags);
                    break;
                case 'kuaishou':
                    result = await publishToKuaishou(videoPath, item.title, item.desc, item.tags);
                    break;
                case 'bilibili':
                    result = await publishToBilibili(videoPath, item.title, item.desc, item.tags);
                    break;
                case 'xiaohongshu':
                    result = await publishToXiaohongshu(videoPath, item.title, item.desc, item.tags);
                    break;
                case 'shipinhao':
                    result = await publishToShipinhao(videoPath, item.title, item.desc, item.tags);
                    break;
                case 'youtube':
                    result = await publishToYoutube(videoPath, item.title, item.desc, item.tags);
                    break;
            }
            updateQueueItem(queueId, platform, 'success', result);
            results[platform] = result;
        } catch (error) {
            console.error(`❌ ${platform} 发布失败:`, error.message);
            updateQueueItem(queueId, platform, 'failed', { error: error.message });
            results[platform] = { success: false, error: error.message };
        }
    }
    
    return results;
}

// 获取粉丝数据
async function fetchFansData(platform) {
    console.log(`📊 获取 ${platform} 粉丝数据...`);
    const cookies = getCookies(platform);
    if (!cookies) {
        throw new Error(`${platform} Cookies 未配置`);
    }
    
    // TODO: 实现获取粉丝数据逻辑
    
    // 模拟数据
    return {
        fans: Math.floor(Math.random() * 10000),
        change: Math.floor(Math.random() * 100) - 20,
        updatedAt: new Date().toISOString()
    };
}

// 获取视频数据
async function fetchVideoData(platform, videoId) {
    console.log(`📊 获取 ${platform} 视频数据: ${videoId}`);
    const cookies = getCookies(platform);
    if (!cookies) {
        throw new Error(`${platform} Cookies 未配置`);
    }
    
    // TODO: 实现获取视频数据逻辑
    
    // 模拟数据
    return {
        views: Math.floor(Math.random() * 100000),
        likes: Math.floor(Math.random() * 10000),
        comments: Math.floor(Math.random() * 1000),
        shares: Math.floor(Math.random() * 500),
        updatedAt: new Date().toISOString()
    };
}

// 刷新所有统计数据
async function refreshAllStats() {
    console.log('🔄 刷新所有统计数据...');
    const platforms = ['douyin', 'kuaishou', 'bilibili', 'xiaohongshu', 'shipinhao', 'youtube'];
    
    for (const platform of platforms) {
        try {
            const fansData = await fetchFansData(platform);
            updateStats(platform, fansData);
            console.log(`✅ ${platform} 粉丝数据已更新: ${fansData.fans}`);
        } catch (error) {
            console.error(`❌ ${platform} 获取数据失败:`, error.message);
        }
    }
    
    console.log('✅ 所有统计数据已刷新');
}

// CLI 命令处理
const args = process.argv.slice(2);
const command = args[0];

if (require.main === module) {
    init();
    
    switch (command) {
        case 'init':
            console.log('✅ 系统已初始化');
            break;
            
        case 'save-cookie':
            const platform = args[1];
            const cookieValue = args[2];
            if (!platform || !cookieValue) {
                console.error('用法: node video-publish-backend.js save-cookie <platform> <cookie>');
                process.exit(1);
            }
            saveCookies(platform, cookieValue);
            break;
            
        case 'get-stats':
            const stats = getStats();
            console.log(JSON.stringify(stats, null, 2));
            break;
            
        case 'refresh-stats':
            refreshAllStats().then(() => {
                console.log('✅ 统计数据已刷新');
                console.log(JSON.stringify(getStats(), null, 2));
            });
            break;
            
        case 'get-queue':
            const queue = getQueue();
            console.log(JSON.stringify(queue, null, 2));
            break;
            
        case 'publish':
            const queueId = parseInt(args[1]);
            if (!queueId) {
                console.error('用法: node video-publish-backend.js publish <queueId>');
                process.exit(1);
            }
            executePublish(queueId).then(results => {
                console.log('✅ 发布完成');
                console.log(JSON.stringify(results, null, 2));
            });
            break;
            
        default:
            console.log(`
视频发布系统后端

命令:
  init                        初始化系统
  save-cookie <platform> <cookie>  保存Cookies
  get-stats                   获取统计数据
  refresh-stats               刷新统计数据
  get-queue                   获取发布队列
  publish <queueId>           执行发布

平台: douyin, kuaishou, bilibili, xiaohongshu, shipinhao, youtube
            `);
    }
}

module.exports = {
    init,
    saveCookies,
    getCookies,
    addToQueue,
    getQueue,
    updateQueueItem,
    updateStats,
    getStats,
    executePublish,
    fetchFansData,
    fetchVideoData,
    refreshAllStats
};
