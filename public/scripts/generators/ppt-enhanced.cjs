/**
 * PPT增强版生成器 - 大幅优化内容
 * 售前PPT: 80页
 * 启动会PPT: 27页
 * 调研PPT: 25页
 * 蓝图PPT: 30页
 * UAT测试PPT: 25页
 * 上线PPT: 25页
 * 验收PPT: 25页
 */

const pptxgen = require('pptxgenjs');

// 金蝶配色
const COLORS = {
    primary: '1E40AF',      // 金蝶蓝
    secondary: '3B82F6',    // 浅蓝
    accent: '10B981',       // 绿色
    text: '1F2937',         // 深灰
    white: 'FFFFFF',
    lightGray: 'F3F4F6'
};

// 添加封面幻灯片
function addCoverSlide(pptx, title, subtitle) {
    const slide = pptx.addSlide();
    
    // 背景色
    slide.background = { color: COLORS.primary };
    
    // 标题
    slide.addText(title, {
        x: 0.5, y: '35%', w: '90%', h: 1.5,
        fontSize: 44, fontFace: '微软雅黑', color: COLORS.white,
        bold: true, align: 'center'
    });
    
    // 副标题
    if (subtitle) {
        slide.addText(subtitle, {
            x: 0.5, y: '55%', w: '90%', h: 0.8,
            fontSize: 24, fontFace: '微软雅黑', color: COLORS.white,
            align: 'center'
        });
    }
    
    // 底部公司信息
    slide.addText('金蝶软件（中国）有限公司', {
        x: 0.5, y: '85%', w: '90%', h: 0.5,
        fontSize: 18, fontFace: '微软雅黑', color: COLORS.white,
        align: 'center'
    });
}

// 添加目录幻灯片
function addTocSlide(pptx, items) {
    const slide = pptx.addSlide();
    
    slide.addText('目 录', {
        x: 0.5, y: 0.5, w: '90%', h: 0.8,
        fontSize: 32, fontFace: '微软雅黑', color: COLORS.primary,
        bold: true, align: 'center'
    });
    
    items.forEach((item, index) => {
        slide.addText(`${index + 1}. ${item}`, {
            x: 1.5, y: 1.8 + index * 0.7, w: '70%', h: 0.6,
            fontSize: 20, fontFace: '微软雅黑', color: COLORS.text
        });
    });
}

// 添加章节标题幻灯片
function addChapterSlide(pptx, chapterNum, title) {
    const slide = pptx.addSlide();
    
    slide.background = { color: COLORS.secondary };
    
    // 章节编号
    slide.addText(chapterNum, {
        x: 0.5, y: '30%', w: '90%', h: 1,
        fontSize: 72, fontFace: '微软雅黑', color: COLORS.white,
        bold: true, align: 'center'
    });
    
    // 章节标题
    slide.addText(title, {
        x: 0.5, y: '50%', w: '90%', h: 1,
        fontSize: 36, fontFace: '微软雅黑', color: COLORS.white,
        bold: true, align: 'center'
    });
}

// 添加内容幻灯片
function addContentSlide(pptx, title, items, options = {}) {
    const slide = pptx.addSlide();
    
    // 标题
    slide.addText(title, {
        x: 0.5, y: 0.4, w: '90%', h: 0.6,
        fontSize: 28, fontFace: '微软雅黑', color: COLORS.primary,
        bold: true
    });
    
    // 分隔线
    slide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 1.1, w: '90%', h: 0.02,
        fill: { color: COLORS.primary }
    });
    
    // 内容项
    items.forEach((item, index) => {
        if (typeof item === 'string') {
            slide.addText(`• ${item}`, {
                x: 0.8, y: 1.4 + index * 0.65, w: '85%', h: 0.6,
                fontSize: 18, fontFace: '微软雅黑', color: COLORS.text
            });
        } else if (typeof item === 'object') {
            // 带子项的内容
            slide.addText(`• ${item.text}`, {
                x: 0.8, y: 1.4 + index * 0.65, w: '85%', h: 0.6,
                fontSize: 18, fontFace: '微软雅黑', color: COLORS.text,
                bold: item.bold || false
            });
            if (item.subItems) {
                item.subItems.forEach((subItem, subIndex) => {
                    slide.addText(`    ‣ ${subItem}`, {
                        x: 1.2, y: 1.65 + index * 0.65 + subIndex * 0.45, w: '80%', h: 0.5,
                        fontSize: 16, fontFace: '微软雅黑', color: COLORS.text
                    });
                });
            }
        }
    });
}

// 添加表格幻灯片
function addTableSlide(pptx, title, headers, rows) {
    const slide = pptx.addSlide();
    
    // 标题
    slide.addText(title, {
        x: 0.5, y: 0.4, w: '90%', h: 0.6,
        fontSize: 28, fontFace: '微软雅黑', color: COLORS.primary,
        bold: true
    });
    
    // 表格
    const tableData = [headers, ...rows];
    slide.addTable(tableData, {
        x: 0.5, y: 1.2, w: '90%',
        fontSize: 14,
        fontFace: '微软雅黑',
        border: { pt: 0.5, color: COLORS.lightGray },
        colW: headers.map(() => Math.floor(90 / headers.length) + '%')
    });
}

// 添加图片幻灯片
function addImageSlide(pptx, title, imagePath) {
    const slide = pptx.addSlide();
    
    // 标题
    slide.addText(title, {
        x: 0.5, y: 0.4, w: '90%', h: 0.6,
        fontSize: 28, fontFace: '微软雅黑', color: COLORS.primary,
        bold: true
    });
    
    // 图片
    if (imagePath && fs.existsSync(imagePath)) {
        slide.addImage({
            path: imagePath,
            x: 1, y: 1.2, w: '80%', h: 4
        });
    }
}

// 添加结束幻灯片
function addEndSlide(pptx, companyName) {
    const slide = pptx.addSlide();
    
    slide.background = { color: COLORS.primary };
    
    slide.addText('感谢聆听', {
        x: 0.5, y: '40%', w: '90%', h: 1,
        fontSize: 48, fontFace: '微软雅黑', color: COLORS.white,
        bold: true, align: 'center'
    });
    
    slide.addText(companyName, {
        x: 0.5, y: '60%', w: '90%', h: 0.6,
        fontSize: 24, fontFace: '微软雅黑', color: COLORS.white,
        align: 'center'
    });
    
    slide.addText('金蝶软件（中国）有限公司', {
        x: 0.5, y: '80%', w: '90%', h: 0.5,
        fontSize: 18, fontFace: '微软雅黑', color: COLORS.white,
        align: 'center'
    });
}

// ==================== 售前PPT (80页) ====================
function generatePresalesPPT(pptx, data) {
    const { companyName = '客户公司', industry = '制造业', enabledModules = [] } = data;
    const moduleNames = enabledModules.map(m => m.name).join('、') || '财务云、供应链';
    
    // 封面
    addCoverSlide(pptx, `${companyName} ERP项目解决方案`, '金蝶云星空');
    
    // 目录
    addTocSlide(pptx, [
        '项目背景与需求分析',
        '金蝶云星空产品介绍',
        '解决方案总体设计',
        '核心业务解决方案',
        '技术架构与安全',
        '项目实施方法论',
        '项目保障与服务',
        '项目成功案例'
    ]);
    
    // 第一章：项目背景与需求分析
    addChapterSlide(pptx, '一', '项目背景与需求分析');
    
    addContentSlide(pptx, '1.1 企业概况', [
        { text: '企业基本信息', subItems: ['公司规模', '所属行业', '组织架构', '员工人数'] },
        { text: '业务特点', subItems: ['主营业务', '业务模式', '客户群体', '市场地位'] },
        { text: '信息化现状', subItems: ['现有系统', '使用情况', '存在问题', '改进需求'] }
    ]);
    
    addContentSlide(pptx, '1.2 项目背景', [
        '企业发展与战略需求',
        '行业数字化转型趋势',
        '现有系统局限性分析',
        'ERP系统选型背景',
        '项目立项决策过程'
    ]);
    
    addContentSlide(pptx, '1.3 需求分析概述', [
        { text: '调研方法', subItems: ['问卷调查', '访谈交流', '现场调研', '数据分析'] },
        { text: '调研范围', subItems: ['业务调研', '技术调研', '组织调研', '流程调研'] },
        { text: '调研成果', subItems: ['调研问卷', '调研纪要', '业务蓝图', '需求清单'] }
    ]);
    
    addContentSlide(pptx, '1.4 业务痛点分析', [
        '信息孤岛问题：各系统数据不互通',
        '流程效率问题：手工操作多、效率低',
        '数据分析问题：缺乏实时报表支持决策',
        '成本管控问题：成本核算不精细',
        '风险管控问题：内控体系不完善',
        '协同效率问题：跨部门协作困难'
    ]);
    
    addContentSlide(pptx, '1.5 项目目标', [
        '构建一体化ERP平台，实现业务流程数字化',
        '实现财务业务一体化，提升数据准确性',
        '建立实时数据分析体系，支持决策',
        '优化业务流程，提高运营效率',
        '加强内控管理，降低经营风险',
        '为未来发展奠定数字化基础'
    ]);
    
    // 第二章：金蝶云星空产品介绍
    addChapterSlide(pptx, '二', '金蝶云星空产品介绍');
    
    addContentSlide(pptx, '2.1 金蝶软件简介', [
        '成立于1993年，中国领先的企业管理软件提供商',
        '香港主板上市公司，股票代码：00268.HK',
        '服务超过680万家企业客户',
        '国家规划布局内重点软件企业',
        '连续多年中国ERP市场占有率第一',
        '获得CMMI5级国际认证'
    ]);
    
    addContentSlide(pptx, '2.2 金蝶云星空概述', [
        '金蝶云星空是金蝶软件的核心产品',
        '基于云原生架构的新一代ERP平台',
        '支持多组织、多会计准则、多币种',
        '提供财务云、供应链云、制造云等全链条服务',
        '已服务超过10000家成长型企业',
        '支持公有云、私有云、混合云部署'
    ]);
    
    addContentSlide(pptx, '2.3 产品架构', [
        { text: '应用层', subItems: ['财务云', '供应链云', '制造云', '人力云'] },
        { text: '平台层', subItems: ['苍穹PaaS平台', '开发平台', '集成平台', '数据平台'] },
        { text: '技术层', subItems: ['微服务架构', '云原生技术', '大数据平台', 'AI能力'] },
        { text: '安全层', subItems: ['数据安全', '应用安全', '网络安全', '合规认证'] }
    ]);
    
    addContentSlide(pptx, '2.4 核心优势', [
        '云原生架构：弹性扩展、快速迭代',
        '多组织协同：支持集团化管控需求',
        '业财一体化：业务财务数据实时同步',
        '智能分析：AI驱动的智能分析与决策支持',
        '开放集成：支持与第三方系统集成',
        '安全合规：等保三级、ISO27001认证'
    ]);
    
    // 第三章：解决方案总体设计
    addChapterSlide(pptx, '三', '解决方案总体设计');
    
    addContentSlide(pptx, '3.1 总体设计原则', [
        '业务驱动：以业务需求为导向，确保系统解决实际问题',
        '整体规划：统一规划、分步实施，确保系统整体性',
        '标准先行：建立标准规范体系，确保系统规范化',
        '安全可靠：确保系统安全、稳定、可靠运行',
        '易于扩展：支持业务发展需要，便于后期扩展',
        '用户友好：界面简洁、操作便捷，降低使用门槛'
    ]);
    
    addContentSlide(pptx, '3.2 实施范围', [
        { text: '业务模块', subItems: [moduleNames] },
        { text: '实施组织', subItems: ['集团总部', '分子公司', '业务部门', '职能部门'] },
        { text: '实施内容', subItems: ['系统配置', '数据迁移', '流程优化', '用户培训'] }
    ]);
    
    addContentSlide(pptx, '3.3 系统架构设计', [
        { text: '应用架构', subItems: ['财务云应用', '供应链应用', '制造云应用', '协同应用'] },
        { text: '数据架构', subItems: ['主数据管理', '业务数据', '分析数据', '数据仓库'] },
        { text: '技术架构', subItems: ['云平台架构', '微服务架构', '数据中台', '集成中台'] },
        { text: '安全架构', subItems: ['身份认证', '权限控制', '数据加密', '审计日志'] }
    ]);
    
    addContentSlide(pptx, '3.4 集成架构设计', [
        { text: '内部集成', subItems: ['财务业务一体化', '供应链协同', '生产计划协同'] },
        { text: '外部集成', subItems: ['银行接口', '税务接口', '电商平台', '物流平台'] },
        { text: '集成方式', subItems: ['API接口', '数据同步', '消息队列', '文件交换'] }
    ]);
    
    // 第四章：核心业务解决方案
    addChapterSlide(pptx, '四', '核心业务解决方案');
    
    enabledModules.forEach((module, index) => {
        addContentSlide(pptx, `4.${index + 1}.1 ${module.name}解决方案`, [
            `实施模块：${(module.subModules || module.selectedSubModules || ['核心功能']).join('、')}`,
            '业务流程优化设计',
            '关键配置说明',
            '数据迁移方案',
            '集成需求说明'
        ]);
        
        addContentSlide(pptx, `4.${index + 1}.2 ${module.name}业务流程`, [
            '业务流程设计',
            '单据流转路径',
            '审批流程配置',
            '报表输出设计',
            '数据流向说明'
        ]);
        
        addContentSlide(pptx, `4.${index + 1}.3 ${module.name}关键功能`, [
            '核心功能一：业务处理与审批',
            '核心功能二：数据查询与分析',
            '核心功能三：报表输出与管理',
            '核心功能四：接口集成与扩展',
            '核心功能五：权限控制与安全'
        ]);
    });
    
    // 第五章：技术架构与安全
    addChapterSlide(pptx, '五', '技术架构与安全');
    
    addContentSlide(pptx, '5.1 技术架构', [
        { text: '部署架构', subItems: ['云部署方案', '私有化部署', '混合云方案'] },
        { text: '系统架构', subItems: ['应用服务器', '数据库服务器', '文件服务器', '接口服务器'] },
        { text: '网络架构', subItems: ['内外网隔离', 'VPN接入', '负载均衡'] }
    ]);
    
    addContentSlide(pptx, '5.2 数据安全', [
        '数据加密：传输加密、存储加密',
        '数据备份：增量备份、全量备份',
        '数据恢复：快速恢复、异地容灾',
        '数据脱敏：敏感数据脱敏处理',
        '数据审计：操作日志、访问日志'
    ]);
    
    addContentSlide(pptx, '5.3 应用安全', [
        '身份认证：多因素认证、单点登录',
        '权限控制：角色权限、数据权限',
        '访问控制：IP限制、时间段控制',
        '操作审计：操作日志、异常监控',
        '安全加固：漏洞修复、安全扫描'
    ]);
    
    // 第六章：项目实施方法论
    addChapterSlide(pptx, '六', '项目实施方法论');
    
    addContentSlide(pptx, '6.1 实施方法论概述', [
        '金蝶AIGO实施方法论',
        '快速交付、风险可控',
        '标准化实施流程',
        '阶段性成果确认',
        '持续优化改进'
    ]);
    
    addContentSlide(pptx, '6.2 项目组织架构', [
        { text: '项目领导小组', subItems: ['项目总负责人', '业务决策人', '技术决策人'] },
        { text: '项目实施小组', subItems: ['项目经理', '业务顾问', '技术顾问', '培训顾问'] },
        { text: '客户项目组', subItems: ['关键用户', '业务骨干', 'IT人员'] }
    ]);
    
    addContentSlide(pptx, '6.3 实施阶段划分', [
        '第一阶段：项目启动（1周）',
        '第二阶段：需求调研（2周）',
        '第三阶段：蓝图设计（3周）',
        '第四阶段：系统构建（6周）',
        '第五阶段：UAT测试（2周）',
        '第六阶段：系统上线（2周）'
    ]);
    
    addTableSlide(pptx, '6.4 项目计划', 
        ['阶段', '主要工作', '周期', '输出成果'],
        [
            ['项目启动', '项目启动会、团队组建', '1周', '项目章程、项目计划'],
            ['需求调研', '业务调研、需求梳理', '2周', '调研问卷、调研纪要'],
            ['蓝图设计', '方案设计、蓝图编制', '3周', '业务蓝图、方案文档'],
            ['系统构建', '系统配置、开发定制', '6周', '配置文档、开发文档'],
            ['UAT测试', '用户测试、问题修复', '2周', '测试报告、问题清单'],
            ['系统上线', '上线准备、正式切换', '2周', '上线方案、培训文档']
        ]
    );
    
    // 第七章：项目保障与服务
    addChapterSlide(pptx, '七', '项目保障与服务');
    
    addContentSlide(pptx, '7.1 项目保障措施', [
        '成立项目领导小组，确保项目资源',
        '建立周例会制度，及时解决问题',
        '关键用户全程参与，确保需求落地',
        '分阶段成果确认，降低项目风险',
        '文档管理规范化，确保知识传承',
        '问题跟踪管理，确保问题闭环'
    ]);
    
    addContentSlide(pptx, '7.2 培训计划', [
        { text: '培训对象', subItems: ['管理层培训', '关键用户培训', '最终用户培训'] },
        { text: '培训内容', subItems: ['系统操作培训', '业务流程培训', '管理报表培训'] },
        { text: '培训方式', subItems: ['集中培训', '现场培训', '在线培训'] }
    ]);
    
    addContentSlide(pptx, '7.3 售后服务', [
        '提供7×24小时技术支持服务',
        '提供系统升级服务',
        '提供业务咨询服务',
        '提供远程协助服务',
        '提供现场支持服务',
        '提供知识库支持服务'
    ]);
    
    addContentSlide(pptx, '7.4 服务承诺', [
        '系统问题响应时间：≤4小时',
        '关键问题解决时间：≤24小时',
        '一般问题解决时间：≤72小时',
        '提供系统使用培训',
        '提供系统运维文档',
        '提供持续优化建议'
    ]);
    
    // 第八章：项目成功案例
    addChapterSlide(pptx, '八', '项目成功案例');
    
    addContentSlide(pptx, '8.1 典型案例一', [
        '客户名称：XXX集团',
        '所属行业：制造业',
        '实施范围：财务云、供应链云、制造云',
        '项目周期：6个月',
        '项目成果：实现业财一体化，提升效率30%',
        '客户评价：系统稳定、功能强大、服务专业'
    ]);
    
    addContentSlide(pptx, '8.2 典型案例二', [
        '客户名称：XXX公司',
        '所属行业：零售业',
        '实施范围：财务云、全渠道',
        '项目周期：4个月',
        '项目成果：实现线上线下业务一体化',
        '客户评价：金蝶云星空帮助我们实现了数字化转型'
    ]);
    
    // 结束页
    addEndSlide(pptx, companyName);
}

// ==================== 启动会PPT (27页) ====================
function generateKickoffPPT(pptx, data) {
    const { companyName = '客户公司', projectName = 'ERP项目', projManager = '项目经理', projPeriod = '6个月' } = data;
    
    // 封面
    addCoverSlide(pptx, `${companyName} ${projectName}启动会`, '');
    
    // 目录
    addTocSlide(pptx, [
        '项目背景',
        '项目目标',
        '实施内容',
        '项目组织',
        '实施计划',
        '风险管理',
        '沟通机制'
    ]);
    
    // 第一章：项目背景
    addChapterSlide(pptx, '一', '项目背景');
    
    addContentSlide(pptx, '1.1 项目背景', [
        '企业发展战略需求',
        '现有系统存在的问题',
        '数字化转型的必要性',
        '项目立项决策过程'
    ]);
    
    addContentSlide(pptx, '1.2 项目意义', [
        '提升企业管理水平',
        '实现业务流程数字化',
        '提高数据准确性',
        '支持企业决策分析',
        '增强企业核心竞争力'
    ]);
    
    // 第二章：项目目标
    addChapterSlide(pptx, '二', '项目目标');
    
    addContentSlide(pptx, '2.1 项目目标', [
        '构建一体化ERP平台',
        '实现财务业务一体化',
        '建立实时数据分析体系',
        '优化业务流程',
        '提升运营效率'
    ]);
    
    addContentSlide(pptx, '2.2 项目范围', [
        '实施模块：财务云、供应链云',
        '实施组织：集团总部、分子公司',
        '实施用户：约XXX人',
        '实施周期：XXX个月'
    ]);
    
    // 第三章：实施内容
    addChapterSlide(pptx, '三', '实施内容');
    
    addContentSlide(pptx, '3.1 业务模块', [
        '财务管理：总账、应收、应付、固定资产',
        '供应链管理：采购、销售、库存',
        '生产管理：生产计划、生产执行',
        '人力资源管理：人事、薪酬、绩效'
    ]);
    
    addContentSlide(pptx, '3.2 系统功能', [
        '基础数据管理',
        '业务流程管理',
        '报表分析管理',
        '系统接口集成',
        '权限管理'
    ]);
    
    // 第四章：项目组织
    addChapterSlide(pptx, '四', '项目组织');
    
    addContentSlide(pptx, '4.1 项目组织架构', [
        { text: '项目领导小组', subItems: ['项目总负责人', '业务决策人'] },
        { text: '项目实施小组', subItems: ['项目经理', '业务顾问', '技术顾问'] },
        { text: '客户项目组', subItems: ['关键用户', '业务骨干', 'IT人员'] }
    ]);
    
    addContentSlide(pptx, '4.2 项目团队', [
        `项目经理：${projManager}`,
        '金蝶项目组成员：XXX、XXX、XXX',
        '客户项目组成员：XXX、XXX、XXX',
        '项目总人数：XXX人'
    ]);
    
    // 第五章：实施计划
    addChapterSlide(pptx, '五', '实施计划');
    
    addTableSlide(pptx, '5.1 实施计划', 
        ['阶段', '主要工作', '周期', '负责人'],
        [
            ['项目启动', '启动会、团队组建', '1周', '项目经理'],
            ['需求调研', '业务调研、需求梳理', '2周', '业务顾问'],
            ['蓝图设计', '方案设计、蓝图编制', '3周', '业务顾问'],
            ['系统构建', '系统配置、开发定制', '6周', '技术顾问'],
            ['UAT测试', '用户测试、问题修复', '2周', '关键用户'],
            ['系统上线', '上线准备、正式切换', '2周', '项目经理']
        ]
    );
    
    addContentSlide(pptx, '5.2 里程碑节点', [
        '项目启动会：第1周',
        '需求调研完成：第3周',
        '蓝图评审通过：第6周',
        '系统配置完成：第12周',
        'UAT测试通过：第14周',
        '系统正式上线：第16周'
    ]);
    
    // 第六章：风险管理
    addChapterSlide(pptx, '六', '风险管理');
    
    addContentSlide(pptx, '6.1 项目风险', [
        '需求变更风险：需求变更影响项目进度',
        '数据质量风险：历史数据质量不高',
        '用户参与风险：关键用户投入不足',
        '集成风险：与第三方系统集成难度大',
        '人员变动风险：项目人员变动影响进度'
    ]);
    
    addContentSlide(pptx, '6.2 风险应对', [
        '需求变更：建立变更管理流程',
        '数据质量：制定数据清洗方案',
        '用户参与：明确关键用户职责',
        '系统集成：提前进行技术评估',
        '人员变动：建立知识转移机制'
    ]);
    
    // 第七章：沟通机制
    addChapterSlide(pptx, '七', '沟通机制');
    
    addContentSlide(pptx, '7.1 沟通机制', [
        '项目周例会：每周召开，总结进度、解决问题',
        '项目月例会：每月召开，汇报进展、决策事项',
        '项目沟通群：建立微信群，及时沟通',
        '问题跟踪表：记录问题，跟踪解决',
        '文档管理：统一存储，版本管理'
    ]);
    
    addContentSlide(pptx, '7.2 项目配合', [
        '提供必要的项目资源支持',
        '关键用户全程参与项目实施',
        '及时完成业务部门数据准备',
        '按时参加项目培训和测试',
        '及时反馈问题和建议'
    ]);
    
    // 结束页
    addEndSlide(pptx, companyName);
}

// ==================== 调研PPT (25页) ====================
function generateSurveyPPT(pptx, data) {
    const { companyName = '客户公司', enabledModules = [], surveyData = {} } = data;
    
    addCoverSlide(pptx, `${companyName} ERP项目调研汇报`, '');
    
    addTocSlide(pptx, [
        '调研概述',
        '企业现状分析',
        '业务需求分析',
        '痛点问题总结',
        '解决方案建议',
        '下一步计划'
    ]);
    
    addChapterSlide(pptx, '一', '调研概述');
    
    addContentSlide(pptx, '1.1 调研背景', [
        '项目背景与目标',
        '调研目的与意义',
        '调研范围与对象',
        '调研时间安排'
    ]);
    
    addContentSlide(pptx, '1.2 调研方法', [
        { text: '访谈交流', subItems: ['高层访谈', '部门访谈', '岗位访谈'] },
        { text: '问卷调查', subItems: ['业务问卷', '系统问卷', '流程问卷'] },
        { text: '现场调研', subItems: ['业务观察', '系统演示', '数据收集'] },
        { text: '文档分析', subItems: ['制度文档', '流程文档', '数据文档'] }
    ]);
    
    addContentSlide(pptx, '1.3 调研范围', [
        '业务范围：财务、供应链、生产等',
        '组织范围：集团总部、分子公司',
        '人员范围：管理层、业务骨干、操作人员',
        '系统范围：现有系统、待建设系统'
    ]);
    
    addChapterSlide(pptx, '二', '企业现状分析');
    
    addContentSlide(pptx, '2.1 企业概况', [
        { text: '基本信息', subItems: ['公司规模', '所属行业', '组织架构'] },
        { text: '业务特点', subItems: ['主营业务', '商业模式', '客户群体'] },
        { text: '发展阶段', subItems: ['发展历程', '当前阶段', '未来规划'] }
    ]);
    
    addContentSlide(pptx, '2.2 信息化现状', [
        { text: '现有系统', subItems: ['ERP系统', 'OA系统', '其他系统'] },
        { text: '系统使用情况', subItems: ['用户数量', '使用频率', '满意度'] },
        { text: '存在问题', subItems: ['功能不足', '性能问题', '集成困难'] }
    ]);
    
    addContentSlide(pptx, '2.3 组织架构', [
        '集团组织架构',
        '财务部门架构',
        '业务部门架构',
        'IT部门架构',
        '关键人员清单'
    ]);
    
    addChapterSlide(pptx, '三', '业务需求分析');
    
    enabledModules.forEach((module, index) => {
        addContentSlide(pptx, `3.${index + 1}.1 ${module.name}现状`, [
            '业务流程现状',
            '系统使用情况',
            '数据管理现状',
            '人员配置情况'
        ]);
        
        addContentSlide(pptx, `3.${index + 1}.2 ${module.name}需求`, [
            '业务功能需求',
            '数据处理需求',
            '报表分析需求',
            '系统集成需求',
            '用户体验需求'
        ]);
    });
    
    addChapterSlide(pptx, '四', '痛点问题总结');
    
    addContentSlide(pptx, '4.1 业务痛点', [
        '业务流程问题：流程不规范、效率低下',
        '数据管理问题：数据分散、准确性低',
        '系统应用问题：系统陈旧、功能不足',
        '管理决策问题：缺乏数据支持',
        '协同效率问题：跨部门协作困难'
    ]);
    
    addContentSlide(pptx, '4.2 系统问题', [
        '信息孤岛：各系统数据不互通',
        '功能缺失：关键业务功能不支持',
        '性能瓶颈：系统响应慢、稳定性差',
        '用户体验：操作复杂、学习成本高',
        '维护困难：技术架构老旧、升级困难'
    ]);
    
    addChapterSlide(pptx, '五', '解决方案建议');
    
    addContentSlide(pptx, '5.1 解决方案概述', [
        '构建一体化ERP平台',
        '实现财务业务一体化',
        '建立实时数据分析体系',
        '优化业务流程',
        '提升运营效率'
    ]);
    
    addContentSlide(pptx, '5.2 实施建议', [
        '分阶段实施：先财务、后供应链、再生产',
        '标准化配置：采用行业标准解决方案',
        '定制化开发：满足特殊业务需求',
        '数据迁移：确保历史数据完整性',
        '培训推广：确保用户熟练使用'
    ]);
    
    addChapterSlide(pptx, '六', '下一步计划');
    
    addContentSlide(pptx, '6.1 近期工作', [
        '完成调研报告编制',
        '组织调研结果汇报',
        '确认业务需求清单',
        '编制蓝图设计计划'
    ]);
    
    addContentSlide(pptx, '6.2 后续安排', [
        '蓝图设计：XXX周',
        '系统配置：XXX周',
        'UAT测试：XXX周',
        '系统上线：XXX周'
    ]);
    
    addEndSlide(pptx, companyName);
}

// ==================== 蓝图PPT (30页) ====================
function generateBlueprintPPT(pptx, data) {
    const { companyName = '客户公司', enabledModules = [] } = data;
    const moduleNames = enabledModules.map(m => m.name).join('、') || '财务云';
    
    addCoverSlide(pptx, `${companyName} ERP项目蓝图汇报`, '');
    
    addTocSlide(pptx, [
        '项目回顾',
        '总体设计',
        '业务方案',
        '技术方案',
        '实施方案',
        '预期效果'
    ]);
    
    addChapterSlide(pptx, '一', '项目回顾');
    
    addContentSlide(pptx, '1.1 项目背景', [
        '企业发展与战略需求',
        '信息化现状与问题',
        '项目目标与范围',
        '项目组织与团队'
    ]);
    
    addContentSlide(pptx, '1.2 调研成果', [
        '调研问卷：XXX份',
        '调研访谈：XXX人次',
        '调研纪要：XXX份',
        '业务流程：XXX个',
        '需求清单：XXX项'
    ]);
    
    addContentSlide(pptx, '1.3 需求确认', [
        '核心业务需求：XXX项',
        '关键功能需求：XXX项',
        '系统集成需求：XXX项',
        '报表分析需求：XXX项',
        '用户体验需求：XXX项'
    ]);
    
    addChapterSlide(pptx, '二', '总体设计');
    
    addContentSlide(pptx, '2.1 设计原则', [
        '业务驱动：以业务需求为导向',
        '整体规划：统一规划、分步实施',
        '标准先行：建立标准规范体系',
        '安全可靠：确保系统安全稳定',
        '易于扩展：支持业务发展需要'
    ]);
    
    addContentSlide(pptx, '2.2 系统架构', [
        { text: '应用层', subItems: ['财务云', '供应链云', '制造云'] },
        { text: '平台层', subItems: ['开发平台', '集成平台', '数据平台'] },
        { text: '技术层', subItems: ['云原生', '微服务', '大数据'] }
    ]);
    
    addContentSlide(pptx, '2.3 组织设计', [
        '组织架构设计',
        '权限体系设计',
        '流程体系设计',
        '数据体系设计'
    ]);
    
    addChapterSlide(pptx, '三', '业务方案');
    
    enabledModules.forEach((module, index) => {
        addContentSlide(pptx, `3.${index + 1}.1 ${module.name}方案`, [
            `实施模块：${(module.subModules || module.selectedSubModules || ['核心功能']).join('、')}`,
            '业务流程设计',
            '关键配置说明',
            '数据迁移方案'
