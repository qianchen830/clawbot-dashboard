/**
 * 增强版PPT提纲生成器
 * 生成详细的Markdown格式PPT提纲，支持预览和编辑
 */

// 文档类型标题映射
const DOC_TITLES = {
    'presales': '售前方案汇报',
    'kickoff': '项目启动会',
    'survey': '调研汇报',
    'blueprint': '蓝图汇报',
    'uat': 'UAT测试方案',
    'golive': '上线方案',
    'acceptance': '验收汇报'
};

// 生成通用头部
function generateHeader(type, data) {
    const { companyName, shortName, industry, enabledModules, userScale, organizations } = data;
    const timestamp = new Date().toLocaleString('zh-CN');
    const moduleNames = enabledModules.map(m => m.name).join('、') || '财务云';
    const totalUsers = userScale?.total || 500;
    const orgCount = (organizations || []).length || 1;
    
    return `# ${companyName} ERP项目 - ${DOC_TITLES[type] || '项目文档'}

> **生成时间**: ${timestamp}
> **客户简称**: ${shortName}
> **所属行业**: ${industry}
> **实施模块**: ${moduleNames}
> **用户规模**: ${totalUsers}人
> **组织数量**: ${orgCount}个

---

**📋 提示**: 本文档为PPT提纲，可直接编辑后下载。每页内容标注了【设计要点】，供制作参考。

---

`;
}

// 生成通用尾部
function generateFooter() {
    return `
---

## 📐 设计规范

### 配色方案
| 颜色类型 | 色值 | 用途 |
|----------|------|------|
| 主色 | #1E5AA0 | 金蝶蓝，标题、重点 |
| 辅助色 | #00A0E9 | 亮蓝，装饰、图表 |
| 强调色 | #FF6B00 | 橙色，强调、标注 |
| 背景色 | #F5F5F5 | 浅灰，背景 |

### 字体规范
| 内容类型 | 字体 | 字号 | 样式 |
|----------|------|------|------|
| 封面标题 | 微软雅黑 | 44pt | 加粗 |
| 章节标题 | 微软雅黑 | 36pt | 加粗 |
| 页标题 | 微软雅黑 | 28pt | 加粗 |
| 正文 | 微软雅黑 | 18pt | 常规 |
| 备注 | 微软雅黑 | 14pt | 常规 |

### 版式要求
- **封面**: 居中对齐，包含公司名称、项目名称、文档类型、日期
- **目录**: 列出所有章节，页码右对齐
- **章节页**: 大号章节编号 + 章节标题，居中
- **内容页**: 标题在上，内容在下，统一页眉页脚

---

## 📝 文档修订记录

| 版本 | 日期 | 编制人 | 审核人 | 修改说明 |
|------|------|--------|--------|----------|
| V1.0 | ${new Date().toLocaleDateString('zh-CN')} | | | 初始版本 |

---

*本文档由金蝶交付自动化系统 v15.0 生成*
*请根据实际情况修改完善内容*
`;
}

// 生成封面页
function generateCoverSlide(companyName, docType, pageNum = 1) {
    return `## 第${pageNum}页：封面

**内容**：
- ${companyName} ERP项目${DOC_TITLES[docType] || ''}
- 金蝶软件（中国）有限公司
- ${new Date().toLocaleDateString('zh-CN')}

**设计要点**：
- 使用金蝶蓝背景（#1E5AA0）
- 居中对齐，简洁大气
- 可添加公司Logo

---
`;
}

// 生成目录页
function generateTocSlide(chapters, pageNum = 2) {
    return `## 第${pageNum}页：目录

**内容**：
${chapters.map((ch, i) => `${i + 1}. ${ch}`).join('\n')}

**设计要点**：
- 清晰的章节列表
- 页码右对齐
- 可使用图标装饰

---
`;
}

// 生成章节页
function generateChapterSlide(chapterNum, chapterTitle, pageNum) {
    return `## 第${pageNum}页：章节页

**内容**：
- 第${chapterNum}部分
- ${chapterTitle}

**设计要点**：
- 大号章节编号
- 章节标题居中
- 使用金蝶蓝背景

---
`;
}

// 导出模块
module.exports = {
    generateHeader,
    generateFooter,
    generateCoverSlide,
    generateTocSlide,
    generateChapterSlide,
    DOC_TITLES
};
