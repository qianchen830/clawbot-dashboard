/**
 * PPT提纲生成器 - 生成md文件
 */

const fs = require('fs');
const path = require('path');

const OUTLINE_DIR = path.join(__dirname, '..', 'memory', 'ppt-outlines');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// PPT类型映射
const PPT_TYPES = {
    'presales': { name: '售前PPT提纲', file: 'presales-outline.md', pages: 80 },
    'kickoff': { name: '启动会PPT提纲', file: 'kickoff-outline.md', pages: 27 },
    'survey': { name: '调研汇报PPT提纲', file: 'survey-outline.md', pages: 27 },
    'blueprint': { name: '蓝图汇报PPT提纲', file: 'blueprint-outline.md', pages: 26 },
    'uat': { name: 'UAT测试PPT提纲', file: 'uat-outline.md', pages: 27 },
    'golive': { name: '上线汇报PPT提纲', file: 'golive-outline.md', pages: 27 },
    'acceptance': { name: '验收汇报PPT提纲', file: 'acceptance-outline.md', pages: 26 }
};

/**
 * 生成PPT提纲md文件
 */
function generateOutline(type, companyName, industry) {
    const pptInfo = PPT_TYPES[type];
    if (!pptInfo) {
        return { success: false, error: `未知的PPT类型: ${type}` };
    }

    // 读取提纲模板
    const templatePath = path.join(OUTLINE_DIR, pptInfo.file);
    if (!fs.existsSync(templatePath)) {
        return { success: false, error: `提纲模板不存在: ${pptInfo.file}` };
    }

    let content = fs.readFileSync(templatePath, 'utf-8');

    // 替换变量
    const replacements = {
        '{{公司名称}}': companyName,
        '{{公司名称或客户名}}': companyName,
        '{{行业类型}}': industry || '制造业',
        '{{当前日期}}': new Date().toLocaleDateString('zh-CN'),
        '{{项目名称}}': `${companyName} ERP项目`,
        '{{项目周期}}': '6个月',
        '{{开始日期}}': new Date().toLocaleDateString('zh-CN'),
        '{{结束日期}}': new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN'),
        '{{访谈人数}}': '20+',
        '{{现有系统}}': '现有信息系统',
        '{{成立年份}}': '2000年',
        '{{主营业务}}': '主营业务',
        '{{员工数量}}': '500+',
        '{{年营收}}': '1亿+',
        '{{分支机构}}': '多家分公司',
        '{{项目金额}}': '待定',
        '{{甲方项目经理}}': '甲方项目经理',
        '{{乙方项目经理}}': '乙方项目经理',
        '{{效率提升}}': '30',
        '{{成本降低}}': '20',
        '{{准确率}}': '99',
        '{{周转率}}': '50',
        '{{工期}}': '6',
        '{{天数}}': '3',
        '{{百分比}}': '50',
        '{{降低}}': '30'
    };

    for (const [key, value] of Object.entries(replacements)) {
        content = content.split(key).join(value);
    }

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
    const filename = `${companyName}_${pptInfo.name}_${timestamp}.md`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    // 写入文件
    fs.writeFileSync(outputPath, content, 'utf-8');

    return {
        success: true,
        filename: filename,
        filepath: `/api/download?filename=${encodeURIComponent(filename)}`,
        downloadUrl: `/output/${encodeURIComponent(filename)}`,
        pages: pptInfo.pages,
        message: `✅ ${pptInfo.name}生成成功！共${pptInfo.pages}页提纲`
    };
}

/**
 * 列出所有可用的PPT类型
 */
function listOutlineTypes() {
    return Object.entries(PPT_TYPES).map(([key, value]) => ({
        type: key,
        name: value.name,
        pages: value.pages
    }));
}

module.exports = {
    generateOutline,
    listOutlineTypes,
    PPT_TYPES
};
