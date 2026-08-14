/**
const WordGeneratorEnhanced = require("./generators/word-generator-enhanced.cjs");
 * 金蝶交付系统服务器 v15.0 - 专业文档格式版
 * - 采用金蝶标准文档格式（参考煤科院项目）
 * - 专业封面、文档控制、标准标题层级
 * - 调研问卷/纪要格式优化
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, PageBreak, Header, Footer, PageNumber, NumberFormat, convertInchesToTwip } = require('docx');

const PORT = 8765;
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const SURVEY_DIR = path.join(__dirname, '..', 'survey-data');

// 加载调研问题库
const SurveyQuestionnaireV2 = require("./generators/survey-questionnaire-v2.cjs");

// ==================== 金蝶文档样式配置 ====================
const KINGDEE_STYLES = {
    // 封面样式
    cover: {
        title: { size: 44, bold: true, font: '微软雅黑' },
        subtitle: { size: 28, bold: true, font: '微软雅黑' },
        info: { size: 14, font: '微软雅黑' }
    },
    // 标题样式
    heading1: { size: 22, bold: true, font: '微软雅黑', color: '1E5AA0' },
    heading2: { size: 18, bold: true, font: '微软雅黑', color: '1E5AA0' },
    heading3: { size: 14, bold: true, font: '微软雅黑' },
    // 正文样式
    body: { size: 12, font: '宋体' },
    // 表格样式
    table: {
        headerBg: '1E5AA0',
        headerColor: 'FFFFFF',
        borderColor: 'CCCCCC'
    }
};

// 创建文档封面
function createCoverPage(companyName, projectName, docType, date) {
    const children = [];
    
    // 空行
    for (let i = 0; i < 6; i++) {
        children.push(new Paragraph({ text: '' }));
    }
    
    // 公司名称
    children.push(new Paragraph({
        text: companyName,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ size: 44, bold: true, font: '微软雅黑', color: '1E5AA0' })]
    }));
    
    // 项目名称
    children.push(new Paragraph({
        text: projectName || '新ERP管理系统项目',
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ size: 36, bold: true, font: '微软雅黑' })]
    }));
    
    // 文档类型
    children.push(new Paragraph({
        text: docType,
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
        children: [new TextRun({ size: 32, bold: true, font: '微软雅黑', color: '1E5AA0' })]
    }));
    
    // 空行
    for (let i = 0; i < 8; i++) {
        children.push(new Paragraph({ text: '' }));
    }
    
    // 底部信息
    children.push(new Paragraph({
        text: companyName,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ size: 14, font: '微软雅黑' })]
    }));
    
    children.push(new Paragraph({
        text: '金蝶软件（中国）有限公司',
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ size: 14, font: '微软雅黑' })]
    }));
    
    children.push(new Paragraph({
        text: date || new Date().toLocaleDateString('zh-CN'),
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ size: 14, font: '微软雅黑' })]
    }));
    
    // 分页
    children.push(new Paragraph({ children: [new PageBreak()] }));
    
    return children;
}

// 创建文档控制页
function createDocControlPage() {
    const children = [];
    
    // 文档控制标题
    children.push(new Paragraph({
        text: '文档控制',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
    }));
    
    // 更改记录表
    children.push(new Paragraph({
        text: '更改记录',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
    }));
    
    const changeTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '版本', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: '1E5AA0' }, verticalAlign: 'center' }),
                    new TableCell({ children: [new Paragraph({ text: '日期', alignment: AlignmentType.CENTER, children: [new TextRun({ color: 'FFFFFF' })] })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: '1E5AA0' } }),
                    new TableCell({ children: [new Paragraph({ text: '编制人', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: '1E5AA0' } }),
                    new TableCell({ children: [new Paragraph({ text: '审核人', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: '1E5AA0' } }),
                    new TableCell({ children: [new Paragraph({ text: '修改说明', alignment: AlignmentType.CENTER })], width: { size: 45, type: WidthType.PERCENTAGE }, shading: { fill: '1E5AA0' } })
                ].map(cell => {
                    cell.children[0].children[0] = new TextRun({ text: cell.children[0].children[0].text, color: 'FFFFFF', bold: true, font: '微软雅黑' });
                    return cell;
                })
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('V1.0')] }),
                    new TableCell({ children: [new Paragraph(new Date().toLocaleDateString('zh-CN'))] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('初始版本')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] })
                ]
            })
        ]
    });
    children.push(changeTable);
    
    // 审核表
    children.push(new Paragraph({
        text: '审核',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 }
    }));
    
    const reviewTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '角色', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: '1E5AA0' } }),
                    new TableCell({ children: [new Paragraph({ text: '姓名', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: '1E5AA0' } }),
                    new TableCell({ children: [new Paragraph({ text: '签字', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: '1E5AA0' } }),
                    new TableCell({ children: [new Paragraph({ text: '日期', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: '1E5AA0' } })
                ].map(cell => {
                    cell.children[0].children[0] = new TextRun({ text: cell.children[0].children[0].text, color: 'FFFFFF', bold: true, font: '微软雅黑' });
                    return cell;
                })
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('项目经理')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('项目总监')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] })
                ]
            })
        ]
    });
    children.push(reviewTable);
    
    // 分页
    children.push(new Paragraph({ children: [new PageBreak()] }));
    
    return children;
}

[OUTPUT_DIR, SURVEY_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 模块配置
const MODULE_CONFIG = {
    finance: {
        name: '财务云',
        icon: '💰',
        subModules: ['总账管理', '应收管理', '应付管理', '固定资产', '出纳管理', '费用报销', '合并报表', '全面预算', '成本管理', '税务管理', '票据管理', '付款排程']
    },
    supply: {
        name: '供应链',
        icon: '📦',
        subModules: ['采购管理', '销售管理', '库存管理', '供应商管理', '客户管理', '价格管理', '质量管理', '合同管理']
    },
    manufacture: {
        name: '制造云',
        icon: '🏭',
        subModules: ['主生产计划', '物料需求计划', '生产执行', '车间管理', '质量管理', 'BOM管理']
    },
    hr: {
        name: '人力云',
        icon: '👥',
        subModules: ['组织管理', '员工管理', '薪酬管理', '绩效管理', '招聘管理', '培训管理', '考勤管理']
    },
    allchannel: {
        name: '全渠道',
        icon: '🛒',
        subModules: ['电商管理', '会员管理', '门店管理', '促销管理']
    },
    epm: {
        name: 'EPM',
        icon: '📊',
        subModules: ['合并报表', '预算管理', '经营计划']
    },
    invoice: {
        name: '发票云',
        icon: '🧾',
        subModules: ['进项发票', '销项发票', '电子发票']
    },
    expense: {
        name: '费用报销',
        icon: '💳',
        subModules: ['报销申请', '审批流程', '预算控制']
    }
};

// 金蝶PPT母版风格配置
const PPT_STYLE = {
    colors: {
        primary: '1E5AA0',        // 金蝶蓝
        secondary: '00A0E9',      // 辅助蓝
        accent: 'FF6B00',         // 强调橙
        success: '00B42A',        // 成功绿
        text: '1D2129',           // 正文灰
        textLight: '86909C',      // 浅色文字
        white: 'FFFFFF',
        lightBg: 'F2F3F5'
    }
};

// ==================== PPT生成函数 ====================

function createPPT(type, data) {
    const pptx = new PptxGenJS();
    const { companyName, shortName, industry, enabledModules, milestones } = data;
    
    pptx.author = '金蝶交付自动化系统';
    pptx.company = '金蝶软件（中国）有限公司';
    pptx.subject = `${companyName} ERP项目`;
    
    // 设置母版
    pptx.defineSlideMaster({
        title: 'KINGDEE_COVER',
        background: { color: PPT_STYLE.colors.primary },
        objects: [
            { rect: { x: 0, y: 0, w: '100%', h: '100%', fill: { type: 'solid', color: PPT_STYLE.colors.primary } } },
            { rect: { x: 0, y: '70%', w: '100%', h: '30%', fill: { type: 'solid', color: PPT_STYLE.colors.secondary } } }
        ]
    });
    
    pptx.defineSlideMaster({
        title: 'KINGDEE_CONTENT',
        background: { color: PPT_STYLE.colors.white },
        objects: [
            { rect: { x: 0, y: 0, w: '100%', h: 0.8, fill: { type: 'solid', color: PPT_STYLE.colors.primary } } },
            { text: { text: '金蝶软件（中国）有限公司', options: { x: 0.5, y: 5.2, w: 3, h: 0.3, fontSize: 10, color: PPT_STYLE.colors.textLight } } }
        ]
    });
    
    pptx.defineSlideMaster({
        title: 'KINGDEE_CHAPTER',
        background: { color: PPT_STYLE.colors.primary },
        objects: [
            { rect: { x: 0, y: 0, w: '100%', h: '100%', fill: { type: 'solid', color: PPT_STYLE.colors.primary } } }
        ]
    });
    
    // 根据类型生成不同内容
    switch(type) {
        case 'presales':
            generatePresalesPPT(pptx, data);
            break;
        case 'kickoff':
            generateKickoffPPT(pptx, data);
            break;
        case 'survey':
            generateSurveyPPT(pptx, data);
            break;
        case 'blueprint':
            generateBlueprintPPT(pptx, data);
            break;
        case 'uat':
            generateUATPPT(pptx, data);
            break;
        case 'golive':
            generateGolivePPT(pptx, data);
            break;
        case 'acceptance':
            generateAcceptancePPT(pptx, data);
            break;
        default:
            generatePresalesPPT(pptx, data);
    }
    
    return pptx;
}

// 封面页
function addCoverSlide(pptx, title, subtitle) {
    let slide = pptx.addSlide({ masterName: 'KINGDEE_COVER' });
    slide.addText(title, {
        x: 0.5, y: 1.5, w: 9, h: 1,
        fontSize: 44, bold: true, color: PPT_STYLE.colors.white,
        align: 'center', fontFace: '微软雅黑'
    });
    if (subtitle) {
        slide.addText(subtitle, {
            x: 0.5, y: 2.8, w: 9, h: 0.6,
            fontSize: 24, color: PPT_STYLE.colors.white,
            align: 'center', fontFace: '微软雅黑'
        });
    }
    slide.addText(new Date().toLocaleDateString('zh-CN'), {
        x: 0.5, y: 4.5, w: 9, h: 0.4,
        fontSize: 16, color: PPT_STYLE.colors.white,
        align: 'center', fontFace: '微软雅黑'
    });
    slide.addText('金蝶软件（中国）有限公司', {
        x: 0.5, y: 5.0, w: 9, h: 0.3,
        fontSize: 12, color: PPT_STYLE.colors.white,
        align: 'center', fontFace: '微软雅黑'
    });
}

// 内容页
function addContentSlide(pptx, title, content) {
    let slide = pptx.addSlide({ masterName: 'KINGDEE_CONTENT' });
    slide.addText(title, {
        x: 0.3, y: 0.15, w: 9.4, h: 0.5,
        fontSize: 28, bold: true, color: PPT_STYLE.colors.white,
        fontFace: '微软雅黑'
    });
    if (Array.isArray(content)) {
        slide.addText(content.map(item => ({ text: item, options: { bullet: true, indentLevel: 0 } })), {
            x: 0.5, y: 1.2, w: 9, h: 3.8,
            fontSize: 18, color: PPT_STYLE.colors.text,
            fontFace: '微软雅黑', valign: 'top'
        });
    } else {
        slide.addText(content, {
            x: 0.5, y: 1.2, w: 9, h: 3.8,
            fontSize: 18, color: PPT_STYLE.colors.text,
            fontFace: '微软雅黑', valign: 'top'
        });
    }
}

// 章节页
function addChapterSlide(pptx, chapterNum, chapterTitle) {
    let slide = pptx.addSlide({ masterName: 'KINGDEE_CHAPTER' });
    slide.addText(`第${chapterNum}部分`, {
        x: 0.5, y: 2.0, w: 9, h: 0.6,
        fontSize: 20, color: PPT_STYLE.colors.white,
        align: 'center', fontFace: '微软雅黑'
    });
    slide.addText(chapterTitle, {
        x: 0.5, y: 2.6, w: 9, h: 0.8,
        fontSize: 36, bold: true, color: PPT_STYLE.colors.white,
        align: 'center', fontFace: '微软雅黑'
    });
}

// 售前PPT - 增强版
function generatePresalesPPT(pptx, data) {
    const { companyName, industry, enabledModules, userScale, organizations } = data;
    const moduleNames = enabledModules.map(m => m.name).join('、') || '财务云';
    const totalUsers = userScale?.total || 500;
    const orgCount = (organizations || []).length || 1;
    
    // 封面
    addCoverSlide(pptx, `${companyName} ERP项目`, '售前方案汇报');
    
    // 目录
    addContentSlide(pptx, '目录', [
        '第一部分：金蝶公司介绍',
        '第二部分：需求理解与分析',
        '第三部分：解决方案设计',
        '第四部分：项目实施方案',
        '第五部分：项目团队配置',
        '第六部分：成功案例分享',
        '第七部分：项目报价与周期'
    ]);
    
    // ==================== 第一部分：公司介绍 ====================
    addChapterSlide(pptx, '一', '公司介绍');
    
    addContentSlide(pptx, '金蝶国际软件集团', [
        '成立于1993年，香港主板上市（股票代码：00268.HK）',
        '亚太地区领先的企业管理软件及云服务提供商',
        '服务超过740万家企业及政府组织',
        '连续18年中国ERP市场占有率第一（IDC数据）',
        '拥有超过10000家生态合作伙伴',
        '研发投入占比超过20%，技术实力雄厚'
    ]);
    
    addContentSlide(pptx, '金蝶云·星空', [
        '金蝶云·星空是金蝶面向大中型企业的云服务产品',
        '基于云原生架构，支持多云部署',
        '涵盖财务云、供应链云、制造云、人力云等核心模块',
        '支持多组织、多账簿、多会计准则',
        '提供开放API平台，支持企业定制开发',
        '通过多项国际安全认证，保障数据安全'
    ]);
    
    addContentSlide(pptx, '金蝶服务优势', [
        '全国300+服务网点，本地化服务支撑',
        '超过30000名实施顾问，专业团队保障',
        '7×24小时技术支持热线',
        '完善的培训体系和知识库',
        '丰富的行业解决方案经验',
        '持续的产品升级和技术支持'
    ]);
    
    // ==================== 第二部分：需求理解 ====================
    addChapterSlide(pptx, '二', '需求理解与分析');
    
    addContentSlide(pptx, '客户概况', [
        `客户名称：${companyName}`,
        `所属行业：${industry || '制造业'}`,
        `组织规模：${orgCount}个组织，约${totalUsers}用户`,
        `实施模块：${moduleNames}`,
        '信息化现状：待调研确认',
        '业务特点：待调研确认'
    ]);
    
    addContentSlide(pptx, '行业痛点分析', [
        '信息孤岛：各系统数据不互通，需要重复录入',
        '流程低效：审批流程繁琐，缺乏系统支撑',
        '决策滞后：缺乏实时报表，管理决策支持不足',
        '成本粗放：成本核算不精细，难以准确核算',
        '协同困难：跨部门协作效率低，信息传递慢',
        '风险管控：内部控制薄弱，合规风险较高'
    ]);
    
    addContentSlide(pptx, '数字化转型需求', [
        '构建一体化ERP平台，打通业务数据',
        '优化业务流程，提升运营效率',
        '实现财务业务一体化，支撑管理决策',
        '建立数据标准，提升数据质量',
        '加强内部控制，降低经营风险',
        '支撑企业战略，推动数字化转型'
    ]);
    
    // ==================== 第三部分：解决方案 ====================
    addChapterSlide(pptx, '三', '解决方案设计');
    
    addContentSlide(pptx, '总体方案架构', [
        '基于金蝶云·星空平台构建企业数字化底座',
        '采用云原生架构，支持弹性扩展',
        '微服务设计，模块化部署',
        '多组织架构，支撑集团管控',
        '开放API平台，支持系统集成',
        '移动办公支持，随时随地处理业务'
    ]);
    
    addContentSlide(pptx, '实施范围', [
        `功能模块：${moduleNames}`,
        `组织范围：${orgCount}个核算组织`,
        `用户规模：约${totalUsers}用户`,
        '系统集成：待确认外部系统对接需求',
        '客户化开发：待确认报表及功能增强需求'
    ]);
    
    // 按模块生成详细内容
    enabledModules.forEach(module => {
        const moduleId = module.id || Object.keys(SURVEY_QUESTIONS).find(k => SURVEY_QUESTIONS[k]?.name === module.name);
        const moduleConfig = SURVEY_QUESTIONS[moduleId];
        const subModules = module.subModules || moduleConfig?.subModules ? Object.keys(moduleConfig?.subModules || {}) : [];
        
        addContentSlide(pptx, `${module.name}解决方案`, [
            `实施范围：${subModules.length > 0 ? subModules.slice(0, 6).join('、') : (module.subModules || ['核心功能']).join('、')}`,
            '核心业务流程优化',
            '关键功能配置',
            '业务数据分析',
            '实施价值分析'
        ]);
        
        // 模块详细功能
        if (subModules.length > 0) {
            subModules.slice(0, 4).forEach((sub, idx) => {
                addContentSlide(pptx, `${sub}方案`, [
                    '业务现状分析',
                    '流程优化建议',
                    '系统功能支持',
                    '关键配置说明',
                    '预期实施效果'
                ]);
            });
        }
    });
    
    // ==================== 第四部分：实施计划 ====================
    addChapterSlide(pptx, '四', '项目实施方案');
    
    addContentSlide(pptx, '实施方法论', [
        '采用金蝶AIGO实施方法论',
        'A-分析（Analysis）：业务需求分析、现状调研',
        'I-设计（Ideation）：蓝图设计、方案确认',
        'G-构建（Generation）：系统配置、开发测试',
        'O-优化（Optimization）：上线切换、持续优化',
        '里程碑管理，确保项目按计划推进'
    ]);
    
    addContentSlide(pptx, '项目阶段计划', [
        '第一阶段：项目启动（1周）',
        '  - 项目组建、目标确认、计划发布',
        '第二阶段：需求调研（4周）',
        '  - 业务调研、需求整理、差异分析',
        '第三阶段：蓝图设计（4周）',
        '  - 方案设计、蓝图确认、原型验证',
        '第四阶段：系统构建（8周）',
        '  - 系统配置、开发测试、数据准备',
        '第五阶段：UAT测试（2周）',
        '  - 用户测试、问题修复、培训考核',
        '第六阶段：系统上线（1周）',
        '  - 切换准备、正式上线、运行支持'
    ]);
    
    addContentSlide(pptx, '关键里程碑', [
        'M1：项目启动会召开',
        'M2：需求调研报告确认',
        'M3：业务蓝图签字确认',
        'M4：系统构建完成',
        'M5：UAT测试通过',
        'M6：系统正式上线'
    ]);
    
    // ==================== 第五部分：团队配置 ====================
    addChapterSlide(pptx, '五', '项目团队配置');
    
    addContentSlide(pptx, '金蝶项目团队', [
        '项目经理：1名（PMP认证，10年+实施经验）',
        '业务顾问：2-3名（财务、供应链、制造领域专家）',
        '技术顾问：1-2名（系统架构、接口开发专家）',
        '开发工程师：2名（客户化开发、报表开发）',
        '培训顾问：1名（用户培训、知识转移）'
    ]);
    
    addContentSlide(pptx, '客户项目团队', [
        '项目总监：1名（高层领导，决策支持）',
        '项目经理：1名（项目协调，进度把控）',
        '关键用户：各模块2-3名（业务骨干，需求确认）',
        'IT人员：1-2名（技术支持，系统维护）',
        '数据小组：2-3名（数据准备，数据导入）'
    ]);
    
    // ==================== 第六部分：成功案例 ====================
    addChapterSlide(pptx, '六', '成功案例分享');
    
    addContentSlide(pptx, '同行业案例', [
        `客户：某${industry || '制造业'}龙头企业`,
        '实施模块：财务云、供应链云、制造云',
        '项目周期：6个月',
        '实施效果：',
        '  - 业务处理效率提升40%',
        '  - 财务月结时间缩短50%',
        '  - 库存周转率提升25%',
        '  - 用户满意度达到98%'
    ]);
    
    addContentSlide(pptx, '实施价值', [
        '管理价值：流程标准化、数据规范化、决策科学化',
        '效率价值：业务处理效率提升30%以上',
        '成本价值：运营成本降低15%以上',
        '风险价值：内部控制加强，经营风险降低',
        '战略价值：支撑企业战略，推动数字化转型'
    ]);
    
    // ==================== 第七部分：报价与周期 ====================
    addChapterSlide(pptx, '七', '项目报价与周期');
    
    addContentSlide(pptx, '项目报价（示例）', [
        '软件许可费：按用户数计费',
        '实施服务费：按人天计费',
        '客户化开发费：按工作量计费',
        '年度维护费：软件许可费的15-20%',
        '详细报价待需求调研后提供'
    ]);
    
    addContentSlide(pptx, '项目周期', [
        '预计项目周期：5-6个月',
        '具体周期视需求调研结果确定',
        '关键影响因素：',
        '  - 功能模块数量和复杂度',
        '  - 客户化开发工作量',
        '  - 系统集成复杂度',
        '  - 客户资源投入程度'
    ]);
    
    // 结束页
    let endSlide = pptx.addSlide({ masterName: 'KINGDEE_COVER' });
    endSlide.addText('感谢聆听', {
        x: 0.5, y: 2.0, w: 9, h: 1,
        fontSize: 48, bold: true, color: PPT_STYLE.colors.white,
        align: 'center', fontFace: '微软雅黑'
    });
    endSlide.addText('期待与您合作', {
        x: 0.5, y: 3.2, w: 9, h: 0.6,
        fontSize: 24, color: PPT_STYLE.colors.white,
        align: 'center', fontFace: '微软雅黑'
    });
    endSlide.addText('金蝶软件（中国）有限公司', {
        x: 0.5, y: 4.2, w: 9, h: 0.4,
        fontSize: 16, color: PPT_STYLE.colors.white,
        align: 'center', fontFace: '微软雅黑'
    });
}

// 启动会PPT - 增强版
function generateKickoffPPT(pptx, data) {
    const { companyName, enabledModules, userScale, organizations, milestones, projManager } = data;
    const moduleNames = enabledModules.map(m => m.name).join('、') || '财务云';
    const totalUsers = userScale?.total || 500;
    const orgCount = (organizations || []).length || 1;
    
    // 封面
    addCoverSlide(pptx, `${companyName} ERP项目启动会`, '');
    
    // 目录
    addContentSlide(pptx, '会议议程', [
        '一、项目背景与目标',
        '二、项目范围与组织',
        '三、项目实施内容',
        '四、项目实施计划',
        '五、项目团队与职责',
        '六、项目管理制度',
        '七、风险管理与保障'
    ]);
    
    // ==================== 第一部分 ====================
    addChapterSlide(pptx, '一', '项目背景与目标');
    
    addContentSlide(pptx, '项目背景', [
        `${companyName}为提升管理水平，推动数字化转型`,
        '建设一体化ERP平台，实现财务业务一体化',
        '打破信息孤岛，实现数据共享',
        '优化业务流程，提升运营效率',
        '加强内部控制，降低经营风险',
        '支撑管理决策，推动战略落地'
    ]);
    
    addContentSlide(pptx, '项目目标', [
        '业务目标：',
        '  - 实现财务、供应链等核心业务数字化管理',
        '  - 提升业务处理效率30%以上',
        '  - 缩短财务月结时间50%',
        '管理目标：',
        '  - 建立统一的数据标准和业务流程',
        '  - 实现管理透明化、决策科学化',
        '技术目标：',
        '  - 建设安全、稳定、可扩展的ERP平台'
    ]);
    
    addContentSlide(pptx, '成功标准', [
        '系统功能满足业务需求',
        '关键用户培训考核通过率100%',
        'UAT测试通过率≥95%',
        '系统按时上线运行',
        '用户满意度≥90%',
        '系统稳定运行，无重大故障'
    ]);
    
    // ==================== 第二部分 ====================
    addChapterSlide(pptx, '二', '项目范围与组织');
    
    addContentSlide(pptx, '项目范围', [
        `功能范围：${moduleNames}`,
        `组织范围：${orgCount}个核算组织`,
        `用户范围：约${totalUsers}用户`,
        '系统集成：待确认外部系统对接',
        '客户化开发：待确认报表及功能需求'
    ]);
    
    // 模块详细范围
    enabledModules.forEach(module => {
        const subModules = module.subModules || [];
        if (subModules.length > 0) {
            addContentSlide(pptx, `${module.name}模块范围`, [
                `实施子系统：${subModules.join('、')}`,
                '核心业务流程优化',
                '系统配置与测试',
                '用户培训与上线'
            ]);
        }
    });
    
    addContentSlide(pptx, '项目组织架构', [
        '项目指导委员会',
        '  - 项目重大决策、资源协调',
        '项目管理办公室（PMO）',
        '  - 项目总体协调、进度管控',
        '业务实施小组',
        '  - 各模块业务需求、测试验收',
        '技术支持小组',
        '  - 系统配置、开发测试、数据迁移'
    ]);
    
    // ==================== 第三部分 ====================
    addChapterSlide(pptx, '三', '项目实施内容');
    
    addContentSlide(pptx, '实施方法论', [
        '采用金蝶AIGO实施方法论',
        'A-分析（Analysis）：业务现状分析、需求调研',
        'I-设计（Ideation）：蓝图设计、方案确认',
        'G-构建（Generation）：系统配置、开发测试',
        'O-优化（Optimization）：上线切换、持续优化'
    ]);
    
    enabledModules.forEach(module => {
        addContentSlide(pptx, `${module.name}实施内容`, [
            `实施范围：${(module.subModules || []).join('、') || '核心功能'}`,
            '业务流程梳理与优化',
            '系统配置与功能测试',
            '数据准备与导入',
            '用户培训与操作指导',
            '上线支持与问题处理'
        ]);
    });
    
    // ==================== 第四部分 ====================
    addChapterSlide(pptx, '四', '项目实施计划');
    
    // 里程碑信息
    const milestoneList = milestones || [];
    const milestoneMap = {};
    milestoneList.forEach(m => { milestoneMap[m.id] = m; });
    
    addContentSlide(pptx, '总体计划', [
        '第一阶段：项目启动',
        `  时间：${milestoneMap['startup']?.startDate || '待定'} ~ ${milestoneMap['startup']?.endDate || '待定'}`,
        '第二阶段：调研设计',
        `  时间：${milestoneMap['survey']?.startDate || '待定'} ~ ${milestoneMap['survey']?.endDate || '待定'}`,
        '第三阶段：蓝图设计',
        `  时间：${milestoneMap['blueprint']?.startDate || '待定'} ~ ${milestoneMap['blueprint']?.endDate || '待定'}`,
        '第四阶段：系统构建',
        `  时间：${milestoneMap['build']?.startDate || '待定'} ~ ${milestoneMap['build']?.endDate || '待定'}`,
        '第五阶段：UAT测试',
        `  时间：${milestoneMap['uat']?.startDate || '待定'} ~ ${milestoneMap['uat']?.endDate || '待定'}`,
        '第六阶段：系统上线',
        `  时间：${milestoneMap['golive']?.startDate || '待定'} ~ ${milestoneMap['golive']?.endDate || '待定'}`
    ]);
    
    addContentSlide(pptx, '关键里程碑', [
        'M1：项目启动会 → 项目正式启动',
        'M2：需求调研报告签字 → 需求确认',
        'M3：业务蓝图签字 → 方案确认',
        'M4：系统构建完成 → 配置完成',
        'M5：UAT测试通过 → 测试验收',
        'M6：系统上线 → 项目验收'
    ]);
    
    addContentSlide(pptx, '第一阶段：项目启动', [
        '主要工作内容：',
        '  - 项目组建，明确双方团队',
        '  - 召开项目启动会',
        '  - 确认项目目标、范围、计划',
        '  - 建立项目沟通机制',
        '交付物：',
        '  - 项目章程',
        '  - 项目计划',
        '  - 沟通计划'
    ]);
    
    addContentSlide(pptx, '第二阶段：调研设计', [
        '主要工作内容：',
        '  - 业务现状调研',
        '  - 需求分析与整理',
        '  - 差异分析',
        '  - 编制调研报告',
        '交付物：',
        '  - 调研问卷',
        '  - 调研纪要',
        '  - 需求调研报告'
    ]);
    
    addContentSlide(pptx, '第三阶段：蓝图设计', [
        '主要工作内容：',
        '  - 业务流程设计',
        '  - 系统方案设计',
        '  - 原型验证',
        '  - 蓝图确认',
        '交付物：',
        '  - 业务蓝图',
        '  - 系统配置方案',
        '  - 开发设计说明书'
    ]);
    
    addContentSlide(pptx, '第四阶段：系统构建', [
        '主要工作内容：',
        '  - 系统配置',
        '  - 客户化开发',
        '  - 系统集成',
        '  - 数据准备与导入',
        '交付物：',
        '  - 系统配置文档',
        '  - 开发代码',
        '  - 测试报告'
    ]);
    
    addContentSlide(pptx, '第五阶段：UAT测试', [
        '主要工作内容：',
        '  - 编写测试用例',
        '  - 用户验收测试',
        '  - 问题修复',
        '  - 用户培训',
        '交付物：',
        '  - 测试用例',
        '  - 测试报告',
        '  - 培训记录'
    ]);
    
    addContentSlide(pptx, '第六阶段：系统上线', [
        '主要工作内容：',
        '  - 上线准备检查',
        '  - 数据迁移',
        '  - 系统切换',
        '  - 上线支持',
        '交付物：',
        '  - 上线方案',
        '  - 上线检查清单',
        '  - 运维手册'
    ]);
    
    // ==================== 第五部分 ====================
    addChapterSlide(pptx, '五', '项目团队与职责');
    
    addContentSlide(pptx, '金蝶项目团队', [
        `项目经理：${projManager || '待定'}（PMP认证，10年+实施经验）`,
        '业务顾问：2-3名（财务、供应链领域专家）',
        '技术顾问：1-2名（系统架构、接口开发专家）',
        '开发工程师：2名（客户化开发、报表开发）',
        '培训顾问：1名（用户培训、知识转移）'
    ]);
    
    addContentSlide(pptx, '客户项目团队', [
        '项目总监：1名（高层领导，决策支持）',
        '项目经理：1名（项目协调，进度把控）',
        '关键用户：各模块2-3名（业务骨干，需求确认）',
        '  - 财务模块关键用户',
        '  - 供应链模块关键用户',
        '  - 制造模块关键用户（如适用）',
        'IT人员：1-2名（技术支持，系统维护）',
        '数据小组：2-3名（数据准备，数据导入）'
    ]);
    
    addContentSlide(pptx, '双方职责分工', [
        '金蝶方职责：',
        '  - 方案设计、系统配置、开发测试',
        '  - 用户培训、知识转移',
        '  - 上线支持、运维指导',
        '客户方职责：',
        '  - 需求确认、数据准备',
        '  - 用户组织、培训配合',
        '  - 测试验收、上线决策'
    ]);
    
    // ==================== 第六部分 ====================
    addChapterSlide(pptx, '六', '项目管理制度');
    
    addContentSlide(pptx, '沟通机制', [
        '项目例会：每周一次项目例会',
        '  - 汇报项目进度',
        '  - 讨论问题和风险',
        '  - 确认下周计划',
        '阶段评审：每个里程碑进行阶段评审',
        '紧急沟通：建立微信群/钉钉群，及时沟通'
    ]);
    
    addContentSlide(pptx, '变更管理', [
        '变更申请：提交变更申请单',
        '变更评估：评估变更影响',
        '变更审批：项目经理审批',
        '变更实施：按批准内容实施',
        '变更记录：更新项目文档'
    ]);
    
    addContentSlide(pptx, '文档管理', [
        '项目文档分类：',
        '  - 管理文档：项目计划、会议纪要',
        '  - 设计文档：业务蓝图、配置文档',
        '  - 测试文档：测试用例、测试报告',
        '  - 培训文档：培训教材、操作手册',
        '文档管理要求：',
        '  - 统一存储、版本控制',
        '  - 交付文档双方确认'
    ]);
    
    // ==================== 第七部分 ====================
    addChapterSlide(pptx, '七', '风险管理与保障');
    
    addContentSlide(pptx, '项目风险', [
        '需求变更风险：需求频繁变更影响进度',
        '  - 应对：严格变更管理流程',
        '资源投入风险：关键用户投入不足',
        '  - 应对：明确关键用户时间投入',
        '数据质量风险：数据准备不完整、不准确',
        '  - 应对：提前进行数据清洗',
        '集成风险：外部系统对接复杂',
        '  - 应对：提前进行技术评估'
    ]);
    
    addContentSlide(pptx, '项目保障', [
        '组织保障：高层支持，成立项目指导委员会',
        '资源保障：双方投入足够的人力和时间',
        '制度保障：建立项目管理制度和沟通机制',
        '技术保障：金蝶专业团队，成熟产品平台',
        '培训保障：完善的培训体系，知识转移到位'
    ]);
    
    // 结束页
    let endSlide = pptx.addSlide({ masterName: 'KINGDEE_COVER' });
    endSlide.addText('项目启动成功', {
        x: 0.5, y: 2.0, w: 9, h: 1,
        fontSize: 48, bold: true, color: PPT_STYLE.colors.white,
        align: 'center', fontFace: '微软雅黑'
    });
    endSlide.addText('携手共创数字化未来', {
        x: 0.5, y: 3.2, w: 9, h: 0.6,
        fontSize: 24, color: PPT_STYLE.colors.white,
        align: 'center', fontFace: '微软雅黑'
    });
}

// 调研汇报PPT
function generateSurveyPPT(pptx, data) {
    const { companyName, enabledModules, surveyData } = data;
    
    addCoverSlide(pptx, `${companyName} ERP项目调研汇报`, '');
    
    addChapterSlide(pptx, '一', '调研概述');
    addContentSlide(pptx, '调研情况', [
        '调研时间与参与人员',
        '调研方式与方法',
        '调研范围与内容'
    ]);
    
    addChapterSlide(pptx, '二', '企业现状');
    addContentSlide(pptx, '企业概况', [
        '组织架构',
        '业务模式',
        '信息化现状'
    ]);
    
    addChapterSlide(pptx, '三', '需求分析');
    enabledModules.forEach(module => {
        const moduleSurvey = surveyData?.[module.id] || {};
        addContentSlide(pptx, `${module.name}需求`, [
            `调研日期：${moduleSurvey.surveyDate || '待填写'}`,
            '业务现状分析',
            '痛点与需求',
            '建议方案'
        ]);
    });
    
    addChapterSlide(pptx, '四', '下一步计划');
    addContentSlide(pptx, '后续工作', [
        '蓝图设计安排',
        '关键问题确认',
        '资源配置需求'
    ]);
}

// 蓝图汇报PPT
function generateBlueprintPPT(pptx, data) {
    const { companyName, enabledModules } = data;
    const moduleNames = enabledModules.map(m => m.name).join('、') || '财务云';
    
    addCoverSlide(pptx, `${companyName} ERP项目蓝图汇报`, '');
    
    addChapterSlide(pptx, '一', '项目回顾');
    addContentSlide(pptx, '项目历程', [
        '项目启动',
        '需求调研',
        '蓝图设计'
    ]);
    
    addChapterSlide(pptx, '二', '总体设计');
    addContentSlide(pptx, '系统架构', [
        '云原生架构',
        '微服务设计',
        '安全架构'
    ]);
    addContentSlide(pptx, '组织设计', [
        '组织架构设计',
        '权限体系设计',
        '流程体系设计'
    ]);
    
    addChapterSlide(pptx, '三', '业务方案');
    enabledModules.forEach(module => {
        addContentSlide(pptx, `${module.name}方案`, [
            `实施范围：${(module.subModules || []).join('、') || '核心功能'}`,
            '业务流程设计',
            '关键配置说明'
        ]);
    });
    
    addChapterSlide(pptx, '四', '实施计划');
    addContentSlide(pptx, '系统构建计划', [
        '环境准备',
        '系统配置',
        '接口开发',
        '数据迁移'
    ]);
}

// UAT测试PPT
function generateUATPPT(pptx, data) {
    const { companyName, enabledModules } = data;
    
    addCoverSlide(pptx, `${companyName} ERP项目UAT测试汇报`, '');
    
    addChapterSlide(pptx, '一', '测试概述');
    addContentSlide(pptx, '测试目的', [
        '验证系统功能满足业务需求',
        '检验系统配置正确性',
        '评估系统性能与稳定性'
    ]);
    addContentSlide(pptx, '测试范围', enabledModules.map(m => m.name));
    
    addChapterSlide(pptx, '二', '测试执行');
    addContentSlide(pptx, '测试环境', [
        '服务器配置',
        '客户端环境',
        '测试数据准备'
    ]);
    addContentSlide(pptx, '测试结果', [
        '测试用例总数',
        '通过数量',
        '问题数量',
        '通过率'
    ]);
    
    addChapterSlide(pptx, '三', '问题跟踪');
    addContentSlide(pptx, '问题统计', [
        '严重问题：0个',
        '一般问题：X个',
        '轻微问题：Y个',
        '已解决：Z个'
    ]);
    
    addChapterSlide(pptx, '四', '结论建议');
    addContentSlide(pptx, '测试结论', [
        '系统功能满足业务需求',
        '系统性能达到预期目标',
        '建议按计划上线'
    ]);
}

// 上线汇报PPT
function generateGolivePPT(pptx, data) {
    const { companyName, enabledModules } = data;
    
    addCoverSlide(pptx, `${companyName} ERP项目上线汇报`, '');
    
    addChapterSlide(pptx, '一', '项目回顾');
    addContentSlide(pptx, '项目历程', [
        '项目启动',
        '蓝图设计',
        '系统构建',
        'UAT测试'
    ]);
    
    addChapterSlide(pptx, '二', '上线准备');
    addContentSlide(pptx, '系统准备', [
        '系统配置完成',
        '数据迁移完成',
        '接口测试通过'
    ]);
    addContentSlide(pptx, '组织准备', [
        '用户培训完成',
        '运维体系建立',
        '应急预案准备'
    ]);
    
    addChapterSlide(pptx, '三', '上线计划');
    addContentSlide(pptx, '上线范围', enabledModules.map(m => `${m.name}：${(m.subModules || []).join('、')}`));
    addContentSlide(pptx, '上线步骤', [
        '数据备份',
        '系统切换',
        '用户启用',
        '运行监控'
    ]);
    
    addChapterSlide(pptx, '四', '保障措施');
    addContentSlide(pptx, '风险控制', [
        '数据安全措施',
        '应急回退方案',
        '现场支持安排'
    ]);
}

// 验收汇报PPT
function generateAcceptancePPT(pptx, data) {
    const { companyName, enabledModules } = data;
    const moduleNames = enabledModules.map(m => m.name).join('、') || '财务云';
    
    addCoverSlide(pptx, `${companyName} ERP项目验收汇报`, '');
    
    addChapterSlide(pptx, '一', '项目概况');
    addContentSlide(pptx, '项目背景', [
        `实施模块：${moduleNames}`,
        '项目周期',
        '项目范围'
    ]);
    
    addChapterSlide(pptx, '二', '建设成果');
    addContentSlide(pptx, '系统成果', enabledModules.map(m => `${m.name}模块上线运行`));
    addContentSlide(pptx, '业务成果', [
        '业务流程优化',
        '工作效率提升',
        '管理水平提高'
    ]);
    
    addChapterSlide(pptx, '三', '项目实施');
    addContentSlide(pptx, '实施历程', [
        '项目启动阶段',
        '蓝图设计阶段',
        '系统构建阶段',
        '上线运行阶段'
    ]);
    
    addChapterSlide(pptx, '四', '项目交付');
    addContentSlide(pptx, '交付物清单', [
        '项目文档',
        '系统配置',
        '培训记录',
        '运维手册'
    ]);
    addContentSlide(pptx, '运维支持', [
        '运维服务体系',
        '技术支持方式',
        '问题响应机制'
    ]);
    
    // 结束页
    let endSlide = pptx.addSlide({ masterName: 'KINGDEE_COVER' });
    endSlide.addText('项目验收通过', {
        x: 0.5, y: 2.0, w: 9, h: 1,
        fontSize: 48, bold: true, color: PPT_STYLE.colors.white,
        align: 'center', fontFace: '微软雅黑'
    });
    endSlide.addText('感谢双方团队的努力付出', {
        x: 0.5, y: 3.2, w: 9, h: 0.6,
        fontSize: 24, color: PPT_STYLE.colors.white,
        align: 'center', fontFace: '微软雅黑'
    });
}

// ==================== Word文档生成函数 ====================

async function createWordDocument(type, data) {
    const { companyName, shortName, industry, enabledModules, devRequirements, integrationRequirements, surveyData } = data;
    const moduleNames = enabledModules.map(m => m.name).join('、') || '财务云';
    const timestamp = new Date().toLocaleDateString('zh-CN');
    
    const children = [];
    
    // 标题
    children.push(new Paragraph({
        text: `${companyName} ERP项目${getDocTitle(type)}`,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER
    }));
    
    // 文档信息
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({
        text: `生成时间：${timestamp}`,
        alignment: AlignmentType.RIGHT
    }));
    children.push(new Paragraph({ text: '' }));
    
    // 文档控制表
    children.push(new Paragraph({
        text: '文档控制',
        heading: HeadingLevel.HEADING_1
    }));
    
    const docTable = new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('版本')], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph('日期')], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph('修改人')], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph('修改内容')], width: { size: 40, type: WidthType.PERCENTAGE } })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('V1.0')] }),
                    new TableCell({ children: [new Paragraph(timestamp)] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('初始版本')] })
                ]
            })
        ],
        width: { size: 100, type: WidthType.PERCENTAGE }
    });
    children.push(docTable);
    children.push(new Paragraph({ text: '' }));
    
    // 正文内容
    switch(type) {
        case 'survey_questionnaire':
            generateSurveyQuestionnaire(children, data);
            break;
        case 'survey_minutes':
            generateSurveyMinutes(children, data);
            break;
        case 'blueprint_report':
            generateBlueprintReport(children, data);
            break;
        case 'dev_spec':
            generateDevSpec(children, data);
            break;
        case 'integration':
            generateIntegrationDoc(children, data);
            break;
        case 'uat_plan':
            generateUATPlan(children, data);
            break;
        case 'golive_plan':
            generateGolivePlan(children, data);
            break;
        default:
            generateSurveyQuestionnaire(children, data);
    }
    
    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });
    
    return doc;
}

function getDocTitle(type) {
    const titles = {
        'presales': '售前方案',
        'kickoff': '启动会汇报',
        'survey': '调研汇报',
        'blueprint': '蓝图汇报',
        'uat': 'UAT测试汇报',
        'golive': '上线汇报',
        'acceptance': '验收汇报',
        'survey_questionnaire': '调研问卷',
        'survey_minutes': '调研纪要',
        'blueprint_report': '业务蓝图设计报告',
        'dev_spec': '客户化开发设计说明书',
        'integration': '系统集成方案',
        'uat_plan': 'UAT测试方案',
        'golive_plan': '上线方案'
    };
    return titles[type] || '文档';
}

// 获取文件名前缀（用于PPT）
function getPPTFileName(type) {
    const names = {
        'presales': '售前方案',
        'kickoff': '启动会',
        'survey': '调研汇报',
        'blueprint': '蓝图汇报',
        'uat': 'UAT测试',
        'golive': '上线汇报',
        'acceptance': '验收汇报'
    };
    return names[type] || '文档';
}

// 获取文件名前缀（用于Word）
function getWordFileName(type) {
    const names = {
        'survey_questionnaire': '调研问卷',
        'survey_minutes': '调研纪要',
        'blueprint_report': '业务蓝图',
        'dev_spec': '开发设计说明书',
        'integration': '集成方案',
        'uat_plan': 'UAT测试方案',
        'golive_plan': '上线方案'
    };
    return names[type] || '文档';
}

/**
 * 生成详细的调研问卷 - 基于问题库
 */
function generateSurveyQuestionnaire(children, data) {
    const { companyName, industry, enabledModules, userScale, organizations, surveyData } = data;
    const timestamp = new Date().toLocaleDateString('zh-CN');
    
    // ==================== 封面 ====================
    children.push(new Paragraph({
        text: `${companyName} ERP项目`,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER
    }));
    children.push(new Paragraph({
        text: '调研问卷',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER
    }));
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({
        text: `调研日期：${timestamp}`,
        alignment: AlignmentType.CENTER
    }));
    children.push(new Paragraph({
        text: `项目经理：_________________`,
        alignment: AlignmentType.CENTER
    }));
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({
        text: '金蝶软件（中国）有限公司',
        alignment: AlignmentType.CENTER
    }));
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: '' }));
    
    // ==================== 文档控制 ====================
    children.push(new Paragraph({
        text: '文档控制',
        heading: HeadingLevel.HEADING_1
    }));
    
    const docTable = new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('版本')], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph('日期')], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph('编制人')], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph('审核人')], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph('修改说明')], width: { size: 40, type: WidthType.PERCENTAGE } })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('V1.0')] }),
                    new TableCell({ children: [new Paragraph(timestamp)] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('初始版本')] })
                ]
            })
        ]
    });
    children.push(docTable);
    children.push(new Paragraph({ text: '' }));
    
    // ==================== 一、企业概况 ====================
    children.push(new Paragraph({
        text: '一、企业概况',
        heading: HeadingLevel.HEADING_1
    }));
    
    children.push(new Paragraph({
        text: '1.1 企业基本信息',
        heading: HeadingLevel.HEADING_2
    }));
    
    const basicInfoTable = new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('企业名称')], width: { size: 25, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph(companyName)], width: { size: 75, type: WidthType.PERCENTAGE } })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('所属行业')] }),
                    new TableCell({ children: [new Paragraph(industry || '制造业')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('企业性质')] }),
                    new TableCell({ children: [new Paragraph('□ 国有  □ 民营  □ 外资  □ 合资  □ 其他：_______')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('员工人数')] }),
                    new TableCell({ children: [new Paragraph(`约 ${userScale?.total || '_____'} 人`)] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('年营业额')] }),
                    new TableCell({ children: [new Paragraph('□ 1亿以下  □ 1-10亿  □ 10-50亿  □ 50亿以上')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('组织架构')] }),
                    new TableCell({ children: [new Paragraph(`约 ${(organizations || []).length || '___'} 个组织`)] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('企业地址')] }),
                    new TableCell({ children: [new Paragraph('')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('联系人/电话')] }),
                    new TableCell({ children: [new Paragraph('')] })
                ]
            })
        ]
    });
    children.push(basicInfoTable);
    children.push(new Paragraph({ text: '' }));
    
    // ==================== 二、信息化现状 ====================
    children.push(new Paragraph({
        text: '二、信息化现状',
        heading: HeadingLevel.HEADING_1
    }));
    
    children.push(new Paragraph({
        text: '2.1 现有系统情况',
        heading: HeadingLevel.HEADING_2
    }));
    
    const systemTable = new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('系统类型')] }),
                    new TableCell({ children: [new Paragraph('目前是否使用')] }),
                    new TableCell({ children: [new Paragraph('系统名称/版本')] }),
                    new TableCell({ children: [new Paragraph('使用年限')] }),
                    new TableCell({ children: [new Paragraph('满意度')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('ERP系统')] }),
                    new TableCell({ children: [new Paragraph('□是 □否')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('□满意 □一般 □不满意')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('财务软件')] }),
                    new TableCell({ children: [new Paragraph('□是 □否')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('□满意 □一般 □不满意')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('OA系统')] }),
                    new TableCell({ children: [new Paragraph('□是 □否')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('□满意 □一般 □不满意')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('CRM系统')] }),
                    new TableCell({ children: [new Paragraph('□是 □否')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('□满意 □一般 □不满意')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('HR系统')] }),
                    new TableCell({ children: [new Paragraph('□是 □否')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('□满意 □一般 □不满意')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('其他系统')] }),
                    new TableCell({ children: [new Paragraph('□是 □否')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('□满意 □一般 □不满意')] })
                ]
            })
        ]
    });
    children.push(systemTable);
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '2.2 信息化痛点',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '1. 现有系统存在的主要问题：' }));
    children.push(new Paragraph({ text: '   □ 系统老旧，功能不足    □ 数据不互通，形成信息孤岛    □ 操作复杂，效率低下' }));
    children.push(new Paragraph({ text: '   □ 报表功能弱           □ 移动办公支持差              □ 其他：_______' }));
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: '2. 希望新系统解决的核心问题：' }));
    children.push(new Paragraph({ text: '   _______________________________________' }));
    children.push(new Paragraph({ text: '' }));
    
    // ==================== 三、模块调研问卷（详细问题） ====================
    children.push(new Paragraph({
        text: '三、模块调研问卷',
        heading: HeadingLevel.HEADING_1
    }));
    
    let questionNum = 1;
    
    enabledModules.forEach((module, mIdx) => {
        const moduleId = module.id || Object.keys(SURVEY_QUESTIONS).find(k => SURVEY_QUESTIONS[k].name === module.name);
        const moduleConfig = SURVEY_QUESTIONS[moduleId];
        
        children.push(new Paragraph({
            text: `3.${mIdx + 1} ${module.name}模块`,
            heading: HeadingLevel.HEADING_2
        }));
        
        // 遍历子系统
        (module.subModules || []).forEach((subModule, sIdx) => {
            children.push(new Paragraph({
                text: `3.${mIdx + 1}.${sIdx + 1} ${subModule}`,
                heading: HeadingLevel.HEADING_3
            }));
            
            // 获取该子系统的详细问题
            const questions = moduleConfig?.subModules?.[subModule] || [];
            
            if (questions.length > 0) {
                questions.forEach((q, qIdx) => {
                    children.push(new Paragraph({ text: `${questionNum}. ${q.q}` }));
                    
                    if (q.type === 'radio' && q.options) {
                        q.options.forEach(opt => {
                            children.push(new Paragraph({ text: `   □ ${opt}` }));
                        });
                    } else if (q.type === 'checkbox' && q.options) {
                        q.options.forEach(opt => {
                            children.push(new Paragraph({ text: `   □ ${opt}` }));
                        });
                    } else {
                        children.push(new Paragraph({ text: '   _______________________________________' }));
                    }
                    children.push(new Paragraph({ text: '' }));
                    questionNum++;
                });
            } else {
                // 没有预设问题时，生成通用问题
                children.push(new Paragraph({ text: `${questionNum}. 当前${subModule}业务流程是怎样的？` }));
                children.push(new Paragraph({ text: '   _______________________________________' }));
                children.push(new Paragraph({ text: '' }));
                questionNum++;
                
                children.push(new Paragraph({ text: `${questionNum}. ${subModule}存在哪些痛点问题？` }));
                children.push(new Paragraph({ text: '   _______________________________________' }));
                children.push(new Paragraph({ text: '' }));
                questionNum++;
                
                children.push(new Paragraph({ text: `${questionNum}. 对${subModule}有什么改进期望？` }));
                children.push(new Paragraph({ text: '   _______________________________________' }));
                children.push(new Paragraph({ text: '' }));
                questionNum++;
            }
        });
    });
    
    // ==================== 四、客户化开发需求 ====================
    children.push(new Paragraph({
        text: '四、客户化开发需求',
        heading: HeadingLevel.HEADING_1
    }));
    
    children.push(new Paragraph({
        text: '4.1 报表开发需求',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '1. 需要定制开发的报表有哪些？' }));
    children.push(new Paragraph({ text: '   _______________________________________' }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '4.2 接口开发需求',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '1. 需要对接的外部系统有哪些？' }));
    children.push(new Paragraph({ text: '   □ OA系统  □ CRM系统  □ MES系统  □ WMS系统  □ 银企直连  □ 其他：_______' }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '4.3 功能增强需求',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '1. 标准功能无法满足的业务场景有哪些？' }));
    children.push(new Paragraph({ text: '   _______________________________________' }));
    children.push(new Paragraph({ text: '' }));
    
    // ==================== 五、项目期望 ====================
    children.push(new Paragraph({
        text: '五、项目期望',
        heading: HeadingLevel.HEADING_1
    }));
    
    children.push(new Paragraph({ text: '1. 项目预算范围：□ 100万以下  □ 100-300万  □ 300-500万  □ 500万以上' }));
    children.push(new Paragraph({ text: '2. 期望上线时间：_______________________' }));
    children.push(new Paragraph({ text: '3. 项目成功的关键指标：' }));
    children.push(new Paragraph({ text: '   _______________________________________' }));
    children.push(new Paragraph({ text: '4. 对实施团队的要求：' }));
    children.push(new Paragraph({ text: '   _______________________________________' }));
    children.push(new Paragraph({ text: '' }));
    
    // ==================== 六、签字确认 ====================
    children.push(new Paragraph({
        text: '六、签字确认',
        heading: HeadingLevel.HEADING_1
    }));
    
    children.push(new Paragraph({ text: '感谢您抽出宝贵时间参与本次调研！请确认以上信息真实有效。' }));
    children.push(new Paragraph({ text: '' }));
    
    const signTable = new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('部门')] }),
                    new TableCell({ children: [new Paragraph('负责人')] }),
                    new TableCell({ children: [new Paragraph('职务')] }),
                    new TableCell({ children: [new Paragraph('签字')] }),
                    new TableCell({ children: [new Paragraph('日期')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('信息部')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('财务部')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('业务部')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('人事部')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] })
                ]
            })
        ]
    });
    children.push(signTable);
}

// 调研纪要生成函数 - 根据调研问卷数据生成
function generateSurveyMinutes(children, data) {
    const { companyName, industry, enabledModules, surveyData, projManager, projPeriod } = data;
    const timestamp = new Date().toLocaleDateString('zh-CN');
    
    children.push(new Paragraph({
        text: '一、调研概况',
        heading: HeadingLevel.HEADING_1
    }));
    
    children.push(new Paragraph({ text: `调研日期：${timestamp}` }));
    children.push(new Paragraph({ text: `调研单位：${companyName}` }));
    children.push(new Paragraph({ text: `所属行业：${industry || '制造业'}` }));
    children.push(new Paragraph({ text: `调研人员：${projManager || '项目经理'}` }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '二、调研目的',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: `本次调研旨在全面了解${companyName}的业务现状、管理痛点及信息化需求，为ERP系统实施提供依据。` }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '三、调研范围',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: `本次调研涵盖以下业务模块：${enabledModules.map(m => m.name).join('、')}。` }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '四、调研内容详述',
        heading: HeadingLevel.HEADING_1
    }));
    
    enabledModules.forEach((module, mIdx) => {
        children.push(new Paragraph({
            text: `4.${mIdx + 1} ${module.name}模块`,
            heading: HeadingLevel.HEADING_2
        }));
        
        const moduleSurveyData = surveyData && surveyData[module.id];
        
        (module.subModules || []).forEach((subModule, sIdx) => {
            children.push(new Paragraph({
                text: `4.${mIdx + 1}.${sIdx + 1} ${subModule}`,
                heading: HeadingLevel.HEADING_3
            }));
            
            const subData = moduleSurveyData && moduleSurveyData[subModule];
            
            if (subData && subData.status) {
                children.push(new Paragraph({ text: `业务现状：${subData.status}` }));
            } else {
                children.push(new Paragraph({ text: '业务现状：' }));
                children.push(new Paragraph({ text: '________________________________' }));
            }
            
            if (subData && subData.painPoints) {
                children.push(new Paragraph({ text: `痛点问题：${subData.painPoints}` }));
            } else {
                children.push(new Paragraph({ text: '痛点问题：' }));
                children.push(new Paragraph({ text: '________________________________' }));
            }
            
            children.push(new Paragraph({ text: '' }));
        });
    });
    
    children.push(new Paragraph({
        text: '五、主要问题总结',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '1. 信息孤岛问题：各系统之间数据不互通，需要人工重复录入。' }));
    children.push(new Paragraph({ text: '2. 流程效率问题：审批流程繁琐，缺乏系统支撑。' }));
    children.push(new Paragraph({ text: '3. 数据分析问题：缺乏实时报表，决策支持不足。' }));
    children.push(new Paragraph({ text: '4. 成本管控问题：成本核算不精细，难以准确核算。' }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '六、建议方案',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: `建议实施金蝶云星空系统，涵盖${enabledModules.map(m => m.name).join('、')}等模块，项目周期约${projPeriod || '6个月'}。` }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '七、后续工作安排',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '1. 完成调研报告编制' }));
    children.push(new Paragraph({ text: '2. 编制业务蓝图设计文档' }));
    children.push(new Paragraph({ text: '3. 制定详细实施计划' }));
    children.push(new Paragraph({ text: '4. 召开项目启动会' }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '八、参会人员签字',
        heading: HeadingLevel.HEADING_1
    }));
    
    const signTable = new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('部门')] }),
                    new TableCell({ children: [new Paragraph('姓名')] }),
                    new TableCell({ children: [new Paragraph('职务')] }),
                    new TableCell({ children: [new Paragraph('签字')] }),
                    new TableCell({ children: [new Paragraph('日期')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('信息部')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('财务部')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('业务部')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] })
                ]
            })
        ]
    });
    children.push(signTable);
}

function generateBlueprintReport(children, data) {
    const { companyName, enabledModules, milestones } = data;
    const moduleNames = enabledModules.map(m => m.name).join('、');
    
    children.push(new Paragraph({
        text: '一、项目概述',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({
        text: '1.1 项目背景',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({
        text: '1.2 项目目标',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({
        text: '1.3 项目范围',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: `实施模块：${moduleNames}` }));
    
    children.push(new Paragraph({
        text: '二、总体设计',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({
        text: '2.1 系统架构设计',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({
        text: '2.2 组织架构设计',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '三、模块详细设计',
        heading: HeadingLevel.HEADING_1
    }));
    
    enabledModules.forEach((module, idx) => {
        children.push(new Paragraph({
            text: `3.${idx + 1} ${module.name}模块`,
            heading: HeadingLevel.HEADING_2
        }));
        children.push(new Paragraph({ text: `实施范围：${(module.subModules || []).join('、')}` }));
        children.push(new Paragraph({ text: '' }));
    });
    
    children.push(new Paragraph({
        text: '四、业务流程设计',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '五、接口设计',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '' }));
}

function generateDevSpec(children, data) {
    const { companyName, devRequirements } = data;
    
    children.push(new Paragraph({
        text: '一、概述',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({
        text: '1.1 编写目的',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({
        text: '1.2 项目背景',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '二、需求分析',
        heading: HeadingLevel.HEADING_1
    }));
    
    if (devRequirements && devRequirements.length > 0) {
        devRequirements.forEach((req, idx) => {
            children.push(new Paragraph({
                text: `2.${idx + 1} ${req.name || '需求' + (idx + 1)}`,
                heading: HeadingLevel.HEADING_2
            }));
            children.push(new Paragraph({ text: `需求编号：${req.id || 'REQ-' + (idx + 1).toString().padStart(3, '0')}` }));
            children.push(new Paragraph({ text: `优先级：${req.priority || '中'}` }));
            children.push(new Paragraph({ text: `需求描述：${req.description || ''}` }));
            children.push(new Paragraph({ text: `业务场景：${req.scenario || ''}` }));
            children.push(new Paragraph({ text: '' }));
        });
    } else {
        children.push(new Paragraph({ text: '暂无开发需求' }));
    }
    
    children.push(new Paragraph({
        text: '三、系统设计',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '四、接口设计',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '' }));
}

function generateIntegrationDoc(children, data) {
    const { companyName, integrationRequirements } = data;
    
    children.push(new Paragraph({
        text: '一、概述',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({
        text: '1.1 编写目的',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({
        text: '1.2 集成范围',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '二、集成架构',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '三、接口详细设计',
        heading: HeadingLevel.HEADING_1
    }));
    
    if (integrationRequirements && integrationRequirements.length > 0) {
        integrationRequirements.forEach((intf, idx) => {
            children.push(new Paragraph({
                text: `3.${idx + 1} ${intf.name || '接口' + (idx + 1)}`,
                heading: HeadingLevel.HEADING_2
            }));
            children.push(new Paragraph({ text: `接口方向：${intf.direction || '金蝶ERP ↔ 外部系统'}` }));
            children.push(new Paragraph({ text: `外部系统：${intf.system || ''}` }));
            children.push(new Paragraph({ text: `触发方式：${intf.trigger || '实时触发'}` }));
            children.push(new Paragraph({ text: `数据格式：${intf.format || 'JSON'}` }));
            children.push(new Paragraph({ text: `业务场景：${intf.scenario || ''}` }));
            children.push(new Paragraph({ text: '' }));
        });
    } else {
        children.push(new Paragraph({ text: '暂无集成需求' }));
    }
    
    children.push(new Paragraph({
        text: '四、安全设计',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '' }));
}

function generateUATPlan(children, data) {
    const { companyName, enabledModules } = data;
    const moduleNames = enabledModules.map(m => m.name).join('、');
    
    children.push(new Paragraph({
        text: '一、测试概述',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({
        text: '1.1 测试目的',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '验证系统功能满足业务需求，检验系统配置正确性。' }));
    children.push(new Paragraph({
        text: '1.2 测试范围',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: `测试模块：${moduleNames}` }));
    
    children.push(new Paragraph({
        text: '二、测试环境',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '三、测试用例',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '四、测试结果',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '' }));
}

function generateGolivePlan(children, data) {
    const { companyName, enabledModules } = data;
    const moduleNames = enabledModules.map(m => m.name).join('、');
    
    children.push(new Paragraph({
        text: '一、上线概述',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({
        text: '1.1 上线范围',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: `上线模块：${moduleNames}` }));
    children.push(new Paragraph({
        text: '1.2 上线目标',
        heading: HeadingLevel.HEADING_2
    }));
    children.push(new Paragraph({ text: '确保系统平稳上线，业务正常运转。' }));
    
    children.push(new Paragraph({
        text: '二、上线准备',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '三、上线步骤',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '' }));
    
    children.push(new Paragraph({
        text: '四、应急预案',
        heading: HeadingLevel.HEADING_1
    }));
    children.push(new Paragraph({ text: '' }));
}

// ==================== 服务器 ====================

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        // 系统状态
        if (pathname === '/api/system-status') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, status: 'running', version: '15.0', uptime: process.uptime() }));
        }
        
        // 调研模板
        else if (pathname === '/api/survey/templates') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, templates: MODULE_CONFIG }));
        }
        
        // 调研数据保存
        else if (pathname === '/api/survey/save') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const filename = 'survey_' + data.projectId + '_' + data.module + '_' + Date.now() + '.json';
                    fs.writeFileSync(path.join(SURVEY_DIR, filename), JSON.stringify(data, null, 2));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, filename }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: e.message }));
                }
            });
        }
        
        // 调研数据列表
        else if (pathname === '/api/survey/list') {
            fs.readdir(SURVEY_DIR, (err, files) => {
                const surveys = files ? files.filter(f => f.endsWith('.json')).map(f => {
                    const parts = f.replace('.json', '').split('_');
                    return { filename: f, projectId: parts[1], module: parts[2], timestamp: parseInt(parts[3]) };
                }) : [];
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, surveys }));
            });
        }
        
        // 调研数据加载
        else if (pathname === '/api/survey/load') {
            const filename = parsedUrl.query.filename;
            const filepath = path.join(SURVEY_DIR, filename);
            if (fs.existsSync(filepath)) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(fs.readFileSync(filepath));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: '文件不存在' }));
            }
        }
        
        // 生成PPT文件
        else if (pathname === '/api/generate-pptx') {
            const query = parsedUrl.query;
            const type = query.type;
            
            let projectData = {};
            try {
                projectData = query.projectData ? JSON.parse(decodeURIComponent(query.projectData)) : {};
            } catch (e) {
                console.error('解析项目数据失败:', e);
            }
            
            const data = {
                companyName: query.companyName || '客户',
                shortName: query.shortName || 'XXX',
                industry: query.industry || '制造业',
                enabledModules: projectData.enabledModules || [],
                modules: projectData.modules || {},
                userScale: projectData.userScale || {},
                organizations: projectData.organizations || [],
                milestones: projectData.milestones || [],
                devRequirements: projectData.devRequirements || [],
                integrationRequirements: projectData.integrationRequirements || [],
                surveyData: projectData.surveyData || {}
            };
            
            try {
                const pptx = createPPT(type, data);
                const docName = getPPTFileName(type);
                const filename = `${data.shortName || 'XXX'}_${docName}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.pptx`;
                const filepath = path.join(OUTPUT_DIR, filename);
                
                await pptx.writeFile({ fileName: filepath });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    filename, 
                    downloadUrl: '/api/download?filename=' + encodeURIComponent(filename),
                    type: 'pptx',
                    message: 'PPT文件生成成功'
                }));
            } catch (e) {
                console.error('PPT生成失败:', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'PPT生成失败: ' + e.message }));
            }
        }
        
        // 生成Word文件
        else if (pathname === '/api/generate-docx') {
            const query = parsedUrl.query;
            const type = query.type;
            
            let projectData = {};
            try {
                projectData = query.projectData ? JSON.parse(decodeURIComponent(query.projectData)) : {};
            } catch (e) {
                console.error('解析项目数据失败:', e);
            }
            
            const data = {
                companyName: query.companyName || '客户',
                shortName: query.shortName || 'XXX',
                industry: query.industry || '制造业',
                enabledModules: projectData.enabledModules || [],
                modules: projectData.modules || {},
                userScale: projectData.userScale || {},
                organizations: projectData.organizations || [],
                milestones: projectData.milestones || [],
                devRequirements: projectData.devRequirements || [],
                integrationRequirements: projectData.integrationRequirements || [],
                surveyData: projectData.surveyData || {}
            };
            
            try {
            // 调研问卷使用新的生成器
            if (type === 'survey_questionnaire') {
                try {
                    const result = await SurveyQuestionnaireV2.generateSurveyQuestionnaire({
                        companyName: data.companyName,
                        shortName: data.shortName,
                        industry: data.industry,
                        enabledModules: data.enabledModules,
                        projectName: '新ERP管理系统项目'
                    });
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        filename: result.filename,
                        downloadUrl: '/api/download?filename=' + encodeURIComponent(result.filename),
                        type: 'docx'
                    }));
                    return;
                } catch (e) {
                    console.error('生成调研问卷失败:', e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: e.message }));
                    return;
                }
            }
            
                const doc = await createWordDocument(type, data);
                const docName = getWordFileName(type);
                const filename = `${data.shortName || 'XXX'}_${docName}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.docx`;
                const filepath = path.join(OUTPUT_DIR, filename);
                
                const buffer = await Packer.toBuffer(doc);
                fs.writeFileSync(filepath, buffer);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    filename, 
                    downloadUrl: '/api/download?filename=' + encodeURIComponent(filename),
                    type: 'docx',
                    message: 'Word文档生成成功'
                }));
            } catch (e) {
                console.error('Word生成失败:', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Word生成失败: ' + e.message }));
            }
        }
        
        // 生成调研问卷ZIP（多个子模块打包）
        else if (pathname === '/api/generate-survey') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { productType, projectData, region } = JSON.parse(body);
                    const companyName = projectData?.companyName || '客户公司';
                    const shortName = projectData?.shortName || 'XXX';
                    const selectedSubModules = projectData?.selectedSubModules || [];
                    const isOverseas = region === 'overseas';
                    
                    // 产品类型 → 模板文件夹名
                    const PRODUCT_TEMPLATE_MAP = {
                        'AI星瀚': '金蝶AI星瀚（模板）',
                        'AI星空': '金蝶AI星空（模板）',
                        '云星空企业版': '金蝶云星空企业版（模板）'
                    };
                    
                    const productFolder = PRODUCT_TEMPLATE_MAP[productType] || '金蝶AI星空（模板）';
                    const baseDir = `/mnt/d/Kingdee文档/自动化交付工具/${productFolder}/调研提纲`;
                    const surveyDir = isOverseas ? path.join(baseDir, '海外') : path.join(baseDir, '国内');
                    
                    // 子模块ID → 中文关键词 OR 英文关键词
                    const SUBMODULE_KEYWORDS = {
                        'gl':              ['总账', 'General Ledger', '总账管理'],
                        'smart_accounting':['智能核算', 'Automated Accounting'],
                        'ar':              ['应收款管理', 'Accounts Receivable', '应收管理', '应收'],
                        'ap':              ['应付款管理', 'Accounts Payable', '应付管理', '应付'],
                        'fa':              ['固定资产', 'Fixed Assets'],
                        'cashier':         ['出纳管理', 'Cashier Management', '出纳'],
                        'fin_report':      ['报表', 'Report', '财务报表'],
                        'expense_mgmt':    ['费用报销', 'Expense', '费用管理'],
                        'expense_everyone':['人人费用', 'My Expense', '费用核算'],
                        'bank_connect':    ['银企', 'Bank Connect', '银企互联'],
                        'e_archive':       ['电子会计档案', 'Archive'],
                        'inv_accounting':  ['存货核算', 'Inventory Costing'],
                        'pur_mgmt':        ['采购管理', 'Procurement Management'],
                        'sales_mgmt':      ['销售管理', 'Sales Management'],
                        'inv_mgmt':        ['库存管理', 'Inventory Management'],
                        'credit_mgmt':     ['信用管理', 'Credit Management'],
                        'contract_mgmt':   ['合同管理', 'Contract Management'],
                        'qc_mgmt':         ['质量管理', 'Quality'],
                        'outsource_mgmt':  ['委外', 'Subcontracting'],
                        'budget':          ['预算', 'Budget'],
                        'merge_report':    ['合并报表', '合并', 'Merge'],
                        'settlement':      ['资金结算', '结算', 'Settlement'],
                        'fund_plan':       ['资金计划', 'Fund Plan'],
                        'bill_mgmt':       ['票据管理', 'Commercial Draft', '票据'],
                        'production_mgmt': ['生产管理', 'Production Management'],
                        'workshop_mgmt':   ['车间管理', 'shop floor'],
                        'quality_mgmt':    ['质量管理', 'Quality management'],
                        'plan_mgmt':       ['计划管理', 'Requirement Planning', '计划'],
                        'smart_scheduling':['智慧排程', 'Production Planning'],
                        'project_reg':     ['项目立项', 'Project'],
                        'project_budget':  ['项目预算'],
                        'project_cost':    ['项目成本'],
                        'project_execute': ['项目执行'],
                        'project_progress':['项目进度'],
                        'project_accept':  ['项目验收'],
                        'contract_collab': ['合同协同'],
                        'pur_collab':      ['供应商协同', 'Supplier collaboration'],
                        'srm':             ['供应商', 'SRM', '供应商管理'],
                        'source_mgmt':     ['寻源', 'Source'],
                        'demand_plan':     ['需求计划', 'Requirement'],
                        'invoice_mgmt':    ['发票管理', 'Invoice'],
                        'smart_tax_calc':  ['智能算税', 'Tax'],
                        'tax_risk':        ['税务风险'],
                        'cost_mgmt':       ['成本管理', '成本'],
                        'profit_analysis': ['盈利', 'Profit'],
                        'accounting_engine':['会计引擎'],
                        'retail_mgmt':     ['零售', 'Retail'],
                        'crm':             ['CRM'],
                        'channel_dist':    ['渠道', 'Channel'],
                        'financing':       ['融资', 'Financing'],
                        'lc_mgmt':         ['信用证', 'LC'],
                        'internal_bank':   ['内部银行'],
                        'shared_finance':  ['共享', 'Shared'],
                        'smart_audit':     ['智能审单', '审单'],
                        'reconcile':       ['对账', 'Reconcile'],
                        'supply_platform': ['供应链', 'Supply'],
                        'barcode_mgmt':    ['条码', 'Barcode'],
                        'mgmt_report':     ['管理报表'],
                        'plan_analysis':   ['计划分析'],
                        'fin_analysis':    ['财务分析'],
                        'biz_analysis':    ['经营分析'],
                        'enterprise_report':['企业报表'],
                        'fund_monitor':    ['资金监控'],
                        'fund_forecast':   ['资金预测'],
                        'fund_analysis':   ['资金分析'],
                        'bank_connect_treasury':['银企互联'],
                        'financial_relation':['金融机构'],
                        'responsibility_acct':['责任会计'],
                        'cvp_analysis':    ['本量利'],
                        'ma_report':       ['管理报表'],
                        'transfer_price':  ['内部定价'],
                        'manufacturing_bigdata':['制造大数据'],
                        'equipment_mgmt':  ['设备管理'],
                        'energy_mgmt':     ['能源管理'],
                        'safety_mgmt':     ['安全生产'],
                        'smart_factory':   ['智能工厂'],
                        'pdm_ecm':         ['产品数据', '工程变更', 'PD'],
                        'supplier_service':['供应商服务'],
                        'procurement_mall':['采购商城'],
                        'rfq_mgmt':        ['询报价'],
                        'bid_mgmt':        ['招投标'],
                        'one_click_decl':  ['一键申报'],
                        'tax_accounting':  ['税务会计'],
                        'tax_shared':      ['税务共享'],
                        'tax_archive':     ['税收档案'],
                        'tax_regulation':  ['法规'],
                        'export_rebate':   ['出口退税'],
                        'deferred_tax':    ['递延所得税'],
                        'vat_mgmt':        ['增值税'],
                        'behavior_tax':    ['行为税'],
                        'project_asset':   ['项目资产'],
                        'project_evaluation':['项目评价'],
                        'ec_center':       ['电商', 'EC'],
                        'member_mgmt':     ['会员'],
                        'b2b_order':       ['B2B'],
                        'marketing_expense':['营销费用'],
                        'price_rebate':    ['返利'],
                        'marketing_analysis':['营销分析'],
                        'channel_cloud_srv':['渠道云'],
                    };
                    
                    // 确保目录存在
                    if (!fs.existsSync(surveyDir)) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: `模板目录不存在: ${surveyDir}` }));
                        return;
                    }
                    
                    // 扫描模板目录中的所有文件
                    const allFiles = fs.readdirSync(surveyDir).filter(f => !f.startsWith('.'));
                    const matchedFiles = [];
                    const unmatched = [];
                    
                    for (const submoduleId of (selectedSubModules || [])) {
                        const keywords = SUBMODULE_KEYWORDS[submoduleId] || [submoduleId];
                        let found = null;
                        
                        for (const file of allFiles) {
                            const lowerFile = file.toLowerCase();
                            for (const kw of keywords) {
                                if (lowerFile.includes(kw.toLowerCase())) {
                                    found = file;
                                    break;
                                }
                            }
                            if (found) break;
                        }
                        
                        if (found) {
                            matchedFiles.push({ submoduleId, filename: found });
                        } else {
                            unmatched.push(submoduleId);
                        }
                    }
                    
                    if (matchedFiles.length === 0) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: false, 
                            error: `没有找到匹配的调研问卷文件，子模块: ${(selectedSubModules || []).join(', ')}`
                        }));
                        return;
                    }
                    
                    // 创建临时目录并复制文件
                    const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '');
                    const tempDir = path.join(OUTPUT_DIR, `temp_${Date.now()}`);
                    fs.mkdirSync(tempDir, { recursive: true });
                    
                    // 打包zip
                    
                    // 用 python 打包 zip
                    const pyScript = `
import zipfile, os, shutil, sys
temp_dir = "${tempDir.replace(/\\/g, '\\\\')}"
zip_path = "${path.join(OUTPUT_DIR, `${shortName}_调研提纲_${dateStr}.zip`).replace(/\\/g, '\\\\')}"
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in os.listdir(temp_dir):
        fp = os.path.join(temp_dir, f)
        if os.path.isfile(fp):
            zf.write(fp, f)
shutil.rmtree(temp_dir)
print(zip_path)
`;
                    
                    // 复制匹配到的文件到临时目录
                    for (const { filename } of matchedFiles) {
                        const src = path.join(surveyDir, filename);
                        const dst = path.join(tempDir, filename);
                        fs.copyFileSync(src, dst);
                    }
                    
                    // 用 python 打包
                    const zipPath = path.join(OUTPUT_DIR, `${shortName}_调研提纲_${dateStr}.zip`);
                    execSync(`python3 -c "
import zipfile, os, shutil
temp_dir = '''${tempDir}'''
zip_path = '''${zipPath}'''
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in os.listdir(temp_dir):
        fp = os.path.join(temp_dir, f)
        if os.path.isfile(fp):
            zf.write(fp, f)
shutil.rmtree(temp_dir)
"`, { stdio: 'pipe' });
                    
                    const zipFilename = path.basename(zipPath);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        filename: zipFilename,
                        downloadUrl: '/api/download?filename=' + encodeURIComponent(zipFilename),
                        type: 'zip',
                        message: `调研问卷生成成功（匹配 ${matchedFiles.length} 个子模块${unmatched.length > 0 ? '，未匹配: ' + unmatched.join(', ') : ''}）`
                    }));
                    
                } catch (e) {
                    console.error('生成调研问卷失败:', e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: e.message }));
                }
            });
        }
        
        // 生成Markdown提纲（保留兼容）
        else if (pathname === '/api/generate-outline' || pathname === '/api/generate-word') {
            const query = parsedUrl.query;
            const type = query.type;
            
            let projectData = {};
            try {
                projectData = query.projectData ? JSON.parse(decodeURIComponent(query.projectData)) : {};
            } catch (e) {
                console.error('解析项目数据失败:', e);
            }
            
            const data = {
                companyName: query.companyName || '客户',
                shortName: query.shortName || 'XXX',
                industry: query.industry || '制造业',
                enabledModules: projectData.enabledModules || [],
                modules: projectData.modules || {},
                userScale: projectData.userScale || {},
                organizations: projectData.organizations || [],
                milestones: projectData.milestones || [],
                devRequirements: projectData.devRequirements || [],
                integrationRequirements: projectData.integrationRequirements || [],
                surveyData: projectData.surveyData || {}
            };
            
            // 生成Markdown内容
            const content = generateMarkdownContent(type, data);
            const docName = getPPTFileName(type);
            const filename = `${data.shortName || 'XXX'}_${docName}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.md`;
            fs.writeFileSync(path.join(OUTPUT_DIR, filename), content);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                filename, 
                downloadUrl: '/api/download?filename=' + encodeURIComponent(filename),
                type: 'md',
                message: 'Markdown提纲生成成功'
            }));
        }
        
        // 文件列表 - 支持按项目筛选
        else if (pathname === '/api/list-files' || pathname === '/api/files') {
            const shortName = parsedUrl.query.shortName || '';
            fs.readdir(OUTPUT_DIR, (err, files) => {
                let fileList = files ? files.filter(f => !f.startsWith('.')).map(f => {
                    const filepath = path.join(OUTPUT_DIR, f);
                    const stat = fs.statSync(filepath);
                    // 只返回文件，过滤掉目录
                    if (stat.isDirectory()) return null;
                    return { name: f, size: stat.size, time: stat.mtime };
                }).filter(f => f !== null) : [];
                
                // 如果指定了项目简称，只返回该项目的文件
                if (shortName) {
                    fileList = fileList.filter(f => f.name.startsWith(shortName + '_'));
                }
                
                fileList.sort((a, b) => b.time - a.time);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, files: fileList }));
            });
        }
        
        // 文件下载
        else if (pathname === '/api/download') {
            const filename = parsedUrl.query.filename;
            const filepath = path.join(OUTPUT_DIR, filename);
            if (fs.existsSync(filepath)) {
                res.writeHead(200, {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': 'attachment; filename="' + encodeURIComponent(filename) + '"'
                });
                fs.createReadStream(filepath).pipe(res);
            } else {
                res.writeHead(404);
                res.end('File not found');
            }
        }
        
        // 文件删除
        else if (pathname === '/api/delete') {
            const filename = parsedUrl.query.filename;
            const filepath = path.join(OUTPUT_DIR, filename);
            if (fs.existsSync(filepath)) {
                const stat = fs.statSync(filepath);
                if (stat.isDirectory()) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: '不能删除目录' }));
                } else {
                    fs.unlinkSync(filepath);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: '文件不存在' }));
            }
        }
        
        else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'API不存在' }));
        }
    } catch (e) {
        console.error('服务器错误:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
    }
});

// 生成Markdown内容
function generateMarkdownContent(type, data) {
    const { companyName, shortName, industry, enabledModules, devRequirements, integrationRequirements, surveyData } = data;
    const timestamp = new Date().toLocaleString('zh-CN');
    const moduleNames = enabledModules.map(m => m.name).join('、') || '未选择';
    
    return `# ${companyName} ERP项目文档

> 生成时间: ${timestamp}
> 客户简称: ${shortName}
> 所属行业: ${industry}
> 实施模块: ${moduleNames}

---

## 文档信息

- **项目名称**: ${companyName} ERP项目
- **文档类型**: ${type}
- **生成时间**: ${timestamp}

---

## 实施模块

${enabledModules.map(m => `### ${m.name}\n\n**子系统**: ${(m.subModules || []).join('、') || '核心功能'}\n`).join('\n')}

---

## 金蝶PPT母版风格说明

**主题色**:
- 主色: #1E5AA0 (金蝶蓝)
- 辅色: #00A0E9 (辅助蓝)
- 强调: #FF6B00 (橙色)

**字体规范**:
- 标题: 微软雅黑 44pt 加粗
- 副标题: 微软雅黑 24pt
- 正文: 微软雅黑 18pt

---

*本文档由金蝶交付自动化系统 v15.0 生成*
`;
}

server.listen(PORT, () => {
    console.log('金蝶交付系统服务器 v15.0 运行在端口 ' + PORT);
    console.log('支持生成: PPT(.pptx), Word(.docx), Markdown(.md)');
});