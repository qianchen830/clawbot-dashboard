/**
 * Word文档生成器 V2 - 参考金蝶知识中心和实际文档结构
 * 基于中煤科工项目文档结构、金蝶方法论、行业最佳实践
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 生成标准文件名 - 使用项目简称（如MKY）
 * 格式: {简称}_{文档类型}_{日期}.docx
 */
function generateFileName(shortName, docType, ext = 'docx') {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = shortName || 'DOC';
    return `${prefix}_${docType}_${date}.${ext}`;
}

// 金蝶方法论知识库
const KINGDEE_KNOWLEDGE = {
    // AIGO方法论
    aigo: {
        phases: [
            { name: 'Assessment & Architecture', desc: '评估与架构设计', duration: '2-4周', activities: ['现状评估', '需求分析', '架构设计', '技术选型'] },
            { name: 'Implementation', desc: '实施部署', duration: '8-16周', activities: ['系统配置', '数据迁移', '接口开发', '用户培训'] },
            { name: 'Governance', desc: '治理优化', duration: '2-4周', activities: ['制度建设', '流程优化', '数据治理', '风险管控'] },
            { name: 'Operation', desc: '运营维护', duration: '持续', activities: ['运维支持', '持续优化', '版本升级', '知识转移'] }
        ]
    },
    
    // 财务云知识
    finance: {
        modules: ['总账', '应收', '应付', '固定资产', '费用报销', '全面预算', '资金管理', '合并报表'],
        flows: {
            'PTP': '采购到付款（Procure to Pay）',
            'OTC': '订单到回款（Order to Cash）',
            'ITC': '存货到成本（Inventory to Cost）',
            'R2R': '记录到报告（Record to Report）'
        },
        painPoints: [
            '财务核算效率低，月末结账周期长',
            '应收应付账款管理不透明，账龄分析困难',
            '成本核算不准确，分摊规则复杂',
            '预算编制与执行脱节，无法实时监控',
            '多组织合并报表编制周期长，数据不一致'
        ]
    },
    
    // 供应链知识
    supply: {
        modules: ['采购管理', '销售管理', '库存管理', '质量管理', '供应商管理', '客户管理'],
        flows: {
            '采购流程': '采购申请 → 审批 → 采购订单 → 收货 → 检验 → 入库 → 发票 → 付款',
            '销售流程': '销售报价 → 销售订单 → 发货 → 出库 → 开票 → 收款',
            '库存流程': '入库 → 质检 → 上架 → 拣货 → 出库 → 盘点'
        },
        painPoints: [
            '库存账实不符，盘点差异大',
            '采购周期长，供应商响应不及时',
            '销售预测不准，库存积压严重',
            '物流信息不透明，运输成本高'
        ]
    },
    
    // 制造云知识
    manufacturing: {
        modules: ['主生产计划(MPS)', '物料需求计划(MRP)', '车间管理', 'APS高级排程', '质量管理', '设备管理'],
        flows: {
            '计划流程': '销售预测 → MPS → MRP → 生产订单 → 车间作业 → 完工入库',
            '生产模式': ['按库存生产(MTS)', '按订单生产(MTO)', '按订单设计(ETO)', '按订单装配(ATO)']
        },
        painPoints: [
            '生产计划不准确，物料齐套率低',
            '车间排程困难，产能利用率低',
            '生产进度不透明，交付延期',
            '成本核算困难，实际成本偏差大'
        ]
    },
    
    // 全面预算知识
    budget: {
        types: ['经营预算', '资本预算', '现金预算', '财务预算'],
        flows: {
            '编制流程': '目标下达 → 草案编制 → 汇总审核 → 调整平衡 → 审批下达',
            '控制流程': '预算审批 → 费用申请 → 预算占用 → 执行控制 → 分析反馈'
        },
        painPoints: [
            '预算编制周期长，数据收集困难',
            '预算与实际偏差大，控制不到位',
            '预算调整频繁，缺乏灵活性',
            '预算分析维度单一，缺乏深度'
        ]
    },
    
    // 资金管理知识
    fund: {
        modules: ['银行账户管理', '资金收支', '资金计划', '资金调度', '票据管理', '融资管理'],
        flows: {
            '银企直连': '银行账户 → 余额查询 → 收付款 → 银行对账 → 回单匹配',
            '资金计划': '收款计划 → 付款计划 → 融资计划 → 执行跟踪 → 偏差分析'
        },
        painPoints: [
            '资金分散，无法统筹管理',
            '资金计划不准确，临时性支出多',
            '银企对账效率低，人工核对工作量大',
            '票据管理混乱，到期风险高'
        ]
    },
    
    // 阿米巴经营知识
    amoeba: {
        types: ['利润中心', '成本中心', '费用中心', '投资中心'],
        flows: {
            '核算流程': '业务发生 → 内部交易 → 收入归集 → 成本分摊 → 利润计算',
            '定价流程': '成本分析 → 市场参考 → 内部协商 → 定价审批 → 执行调整'
        },
        painPoints: [
            '阿米巴划分不合理，权责不清晰',
            '内部定价争议大，缺乏依据',
            '核算数据不准确，时效性差',
            '经营意识薄弱，全员参与度低'
        ]
    },
    
    // 财务共享知识
    financeShared: {
        types: ['报账共享', '结算共享', '核算共享', '税务共享'],
        flows: {
            '报账流程': '员工提交 → 直属审批 → 共享初审 → 共享复核 → 出纳付款 → 财务记账',
            '结算流程': '业务推送 → 共享审核 → 排程安排 → 付款执行 → 回单匹配 → 凭证生成'
        },
        painPoints: [
            '流程标准化程度低，难以共享',
            '系统不统一，数据孤岛严重',
            '人员流失率高，培训成本大',
            '服务质量和效率难以保证'
        ]
    },
    
    // 发票云知识
    invoice: {
        types: ['销项开票', '进项收票', '发票验真', '税务管理'],
        flows: {
            '销项流程': '业务单据 → 开票申请 → 开票审核 → 自动开票 → 发票交付 → 签收确认',
            '进项流程': '发票接收 → OCR识别 → 发票验真 → 三单匹配 → 进项认证 → 凭证生成'
        },
        painPoints: [
            '手工开票效率低，容易出错',
            '进项发票验真工作量大',
            '发票与业务单据匹配困难',
            '税务合规风险控制不到位'
        ]
    },
    
    // 人力资源管理
    hr: {
        modules: ['核心人力', '薪酬管理', '绩效管理', '考勤管理', '招聘管理', '培训管理'],
        flows: {
            '入职流程': '入职申请 → 审批 → 员工档案建立 → 培训 → 正式上岗',
            '薪酬流程': '薪酬项目定义 → 计算规则 → 薪酬核算 → 发放 → 凭证'
        },
        painPoints: [
            '员工信息分散，难以统一管理',
            '薪酬计算复杂，人工计算易出错',
            '绩效评估主观，缺乏量化指标',
            '考勤统计繁琐，异常处理工作量大'
        ]
    },
    
    // 质量管理
    quality: {
        modules: ['质量标准', '质量检验', '不良品管理', '质量追溯', '质量报表'],
        flows: {
            '检验流程': '检验方案 → 检验单 → 检验执行 → 结果判定 → 检验报告',
            '不合格处理': '发现不合格 → 隔离 → 判定 → 处置(返工/报废/让步) → 记录'
        },
        painPoints: [
            '检验流程不规范，漏检情况多',
            '质量问题追溯困难',
            '不良品处理不及时',
            '质量数据统计分析不足'
        ]
    },
    
    // 设备管理
    equipment: {
        modules: ['设备台账', '保养计划', '维修管理', '备件管理', '设备分析'],
        flows: {
            '保养流程': '保养计划 → 保养工单 → 保养执行 → 保养确认 → 记录更新',
            '维修流程': '故障报修 → 维修派工 → 维修执行 → 验收确认 → 费用结算'
        },
        painPoints: [
            '设备台账不完整，信息分散',
            '保养计划执行不到位',
            '设备故障响应慢，影响生产',
            '备件库存不合理，缺件或积压'
        ]
    },
    
    // 项目实施方法论
    methodology: {
        phases: [
            { name: '项目启动', duration: '1周', deliverables: ['项目章程', '项目计划', '组织架构'] },
            { name: '调研设计', duration: '2-3周', deliverables: ['调研提纲', '调研纪要', '调研报告'] },
            { name: '蓝图设计', duration: '2-3周', deliverables: ['业务蓝图', '技术方案', '接口方案'] },
            { name: '系统构建', duration: '4-8周', deliverables: ['系统配置', '客户化开发', '数据迁移'] },
            { name: 'UAT测试', duration: '2-3周', deliverables: ['测试用例', '测试报告', '用户手册'] },
            { name: '系统上线', duration: '1-2周', deliverables: ['上线方案', '切换计划', '应急预案'] }
        ]
    }
};

/**
 * 创建文档通用头部
 */
function createDocHeader(companyName, docType, version = 'V1.0') {
    const { Paragraph, TextRun, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, HeadingLevel } = require('docx');
    
    return [
        // 公司名称
        new Paragraph({
            children: [
                new TextRun({ text: companyName || '客户公司', size: 36, bold: true }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
        }),
        // 项目名称
        new Paragraph({
            children: [
                new TextRun({ text: '新ERP管理系统项目', size: 28 }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
        }),
        // 文档类型
        new Paragraph({
            children: [
                new TextRun({ text: docType, size: 44, bold: true, color: '1E40AF' }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        }),
        // 文档信息
        new Paragraph({
            children: [
                new TextRun({ text: '金蝶软件（中国）有限公司', size: 22 }),
            ],
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            children: [
                new TextRun({ text: new Date().toLocaleDateString('zh-CN'), size: 22 }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }),
    ];
}

/**
 * 创建文档变更记录表
 */
function createChangeLogTable() {
    const { Table, TableRow, TableCell, WidthType, BorderStyle, Paragraph, TextRun } = require('docx');
    
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '版本', alignment: 'center' })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: '日期', alignment: 'center' })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: '作者', alignment: 'center' })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: '变更说明', alignment: 'center' })], width: { size: 50, type: WidthType.PERCENTAGE } }),
                ],
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: 'V1.0' })] }),
                    new TableCell({ children: [new Paragraph({ text: new Date().toLocaleDateString('zh-CN') })] }),
                    new TableCell({ children: [new Paragraph({ text: '项目组' })] }),
                    new TableCell({ children: [new Paragraph({ text: '初始版本' })] }),
                ],
            }),
        ],
    });
}

/**
 * 创建表格
 */
function createTable(headers, rows) {
    const { Table, TableRow, TableCell, WidthType, Paragraph, TextRun, BorderStyle, VerticalAlign } = require('docx');
    
    const headerCells = headers.map(h => 
        new TableCell({
            children: [new Paragraph({ text: h, alignment: 'center' })],
            shading: { fill: '1E40AF' },
            verticalAlign: VerticalAlign.CENTER,
        })
    );
    
    const dataRows = rows.map(row => 
        new TableRow({
            children: row.map(cell => 
                new TableCell({
                    children: [new Paragraph({ text: cell, alignment: 'center' })],
                    verticalAlign: VerticalAlign.CENTER,
                })
            ),
        })
    );
    
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({ children: headerCells }),
            ...dataRows
        ],
    });
}

/**
 * 生成调研问卷 - 基于金蝶调研提纲模板
 */
async function generateSurveyQuestionnaireV2(projectInfo) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = require('docx');
    
    const companyName = projectInfo.companyName || '客户公司';
    const shortName = projectInfo.shortName || 'DOC';
    const industry = projectInfo.industry || '制造业';
    const modules = Object.entries(projectInfo.modules || {})
        .filter(([k, v]) => v.enabled)
        .map(([k]) => k);
    
    const doc = new Document({
        title: `${companyName} - 调研问卷`,
        description: `${industry}行业数字化转型调研`,
        styles: {
            documentStyles: [
                { id: 'Title', name: 'Title', basedOn: 'Normal', run: { size: 44, bold: true, color: '1E40AF' } },
                { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', run: { size: 32, bold: true, color: '1E40AF' } },
                { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', run: { size: 28, bold: true, color: '2563EB' } },
            ]
        },
        sections: [{
            properties: {},
            children: [
                // 文档头部
                ...createDocHeader(companyName, '调研问卷'),
                
                // 文档控制
                new Paragraph({ text: '文档控制', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '本文档为项目调研阶段工作成果，记录调研过程中收集的业务需求和信息。', spacing: { after: 200 } }),
                createChangeLogTable(),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 第一部分：企业基本信息
                new Paragraph({ text: '一、企业基本信息', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '本部分收集企业基本概况，为后续需求分析提供背景信息。', spacing: { after: 100 } }),
                
                createTable(
                    ['项目', '内容', '备注'],
                    [
                        ['企业名称', companyName, ''],
                        ['所属行业', industry, ''],
                        ['企业性质', '□国企  □民企  □外资  □合资', ''],
                        ['员工人数', `${projectInfo.userScale?.total || '____'} 人`, ''],
                        ['年营业额', '□<1亿  □1-10亿  □10-50亿  □>50亿', ''],
                        ['分支机构', '____ 家分公司  ____ 家子公司', ''],
                        ['信息化投入', '____ 万元/年', ''],
                    ]
                ),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 第二部分：组织架构
                new Paragraph({ text: '二、组织架构', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '请提供企业组织架构图，并回答以下问题：', spacing: { after: 100 } }),
                new Paragraph({ text: '1. 公司共有几个法人实体？分别是？' }),
                new Paragraph({ text: '   _______________________________________' }),
                new Paragraph({ text: '2. 各法人实体之间的业务关系是什么？（独立核算/统一核算）' }),
                new Paragraph({ text: '   _______________________________________' }),
                new Paragraph({ text: '3. 公司有哪些业务板块？各板块的主营业务是什么？' }),
                new Paragraph({ text: '   _______________________________________' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 第三部分：信息化现状
                new Paragraph({ text: '三、信息化现状', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '3.1 现有系统清单', heading: HeadingLevel.HEADING_2 }),
                createTable(
                    ['系统类型', '系统名称', '版本', '使用年限', '用户数', '存在问题'],
                    [
                        ['ERP系统', '', '', '', '', ''],
                        ['财务软件', '', '', '', '', ''],
                        ['OA系统', '', '', '', '', ''],
                        ['CRM系统', '', '', '', '', ''],
                        ['MES系统', '', '', '', '', ''],
                        ['其他', '', '', '', '', ''],
                    ]
                ),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '3.2 现有系统主要问题', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '请描述当前系统存在的主要问题和痛点：' }),
                new Paragraph({ text: '   1. _______________________________________' }),
                new Paragraph({ text: '   2. _______________________________________' }),
                new Paragraph({ text: '   3. _______________________________________' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 第四部分：业务需求（根据模块动态生成）
                new Paragraph({ text: '四、业务需求调研', heading: HeadingLevel.HEADING_1 }),
                
                // 财务云调研
                ...(modules.includes('finance') ? [
                    new Paragraph({ text: '4.1 财务管理', heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: '4.1.1 总账管理', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '1) 如何划分会计期间？各组织会计期间是否一致？' }),
                    new Paragraph({ text: '   □ 月结  □ 旬结  □ 周结  □ 其他：_______' }),
                    new Paragraph({ text: '2) 凭证类型有哪些？凭证编码规则是什么？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '3) 会计科目体系？是否有多账簿需求？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '4) 月末结账流程是怎样的？需要多长时间？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '5) 目前财务报表编制需要多长时间？有哪些报表？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    
                    new Paragraph({ text: '4.1.2 应收管理', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '1) 客户数量大约多少？客户分类规则是什么？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '2) 收款核销流程是怎样的？是否需要自动核销？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '3) 账龄分析需求？是否需要催款提醒？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    
                    new Paragraph({ text: '4.1.3 应付管理', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '1) 供应商数量大约多少？供应商分类规则是什么？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '2) 付款审批流程是怎样的？需要几级审批？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '3) 是否需要付款排程？排程规则是什么？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    
                    new Paragraph({ text: '4.1.4 成本管理', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '1) 目前采用什么成本核算方法？' }),
                    new Paragraph({ text: '   □ 品种法  □ 分批法  □ 分步法  □ 其他：_______' }),
                    new Paragraph({ text: '2) 成本核算周期？成本分摊规则是什么？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '3) 是否需要标准成本管理？差异分析需求？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                ] : []),
                
                // 供应链调研
                ...(modules.includes('supply') ? [
                    new Paragraph({ text: '4.2 供应链管理', heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: '4.2.1 采购管理', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '1) 供应商数量？供应商管理方式？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '2) 采购审批流程？需要几级审批？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '3) 采购定价方式？是否有框架协议？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '4) 采购到货周期一般是多少天？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    
                    new Paragraph({ text: '4.2.2 销售管理', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '1) 客户数量？客户分类规则？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '2) 销售定价方式？是否有价格体系？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '3) 销售订单处理流程是怎样的？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '4) 是否需要信用控制？信用额度规则是什么？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    
                    new Paragraph({ text: '4.2.3 库存管理', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '1) 仓库数量？仓库分布情况？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '2) 是否需要批次管理？序列号管理？' }),
                    new Paragraph({ text: '   □ 批次管理  □ 序列号管理  □ 都不需要' }),
                    new Paragraph({ text: '3) 库存盘点方式？盘点周期？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '4) 是否有呆滞料管理需求？呆滞料处理流程？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                ] : []),
                
                // 全面预算调研
                ...(modules.includes('budget') ? [
                    new Paragraph({ text: '4.4 全面预算', heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: '1) 目前是否编制预算？编制频率？' }),
                    new Paragraph({ text: '   □ 年度预算  □ 季度预算  □ 月度预算  □ 不编制' }),
                    new Paragraph({ text: '2) 预算编制流程是怎样的？参与部门有哪些？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '3) 预算执行控制方式？超预算如何处理？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '4) 需要哪些预算分析报表？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                ] : []),
                
                // 资金管理调研
                ...(modules.includes('fund') ? [
                    new Paragraph({ text: '4.5 资金管理', heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: '1) 银行账户数量？开户银行有哪些？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '2) 是否需要银企直连？' }),
                    new Paragraph({ text: '   □ 已有银企直连  □ 需要对接  □ 暂不需要' }),
                    new Paragraph({ text: '3) 是否有资金计划管理需求？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '4) 是否有票据管理需求？每月票据量大概多少？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                ] : []),
                
                // 发票云调研
                ...(modules.includes('invoice') ? [
                    new Paragraph({ text: '4.6 发票管理', heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: '1) 每月销项发票开具量？' }),
                    new Paragraph({ text: '   □ <100张  □ 100-500张  □ 500-1000张  □ >1000张' }),
                    new Paragraph({ text: '2) 每月进项发票接收量？' }),
                    new Paragraph({ text: '   □ <100张  □ 100-500张  □ 500-1000张  □ >1000张' }),
                    new Paragraph({ text: '3) 是否需要对接数电票？' }),
                    new Paragraph({ text: '   □ 是  □ 否  □ 不确定' }),
                    new Paragraph({ text: '4) 是否有发票验真、三单匹配需求？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                ] : []),
                
                // 制造云调研
                ...(modules.includes('manufacturing') ? [
                    new Paragraph({ text: '4.3 生产制造', heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: '4.3.1 生产模式', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '1) 公司采用什么生产模式？' }),
                    new Paragraph({ text: '   □ 按库存生产(MTS)  □ 按订单生产(MTO)  □ 按订单设计(ETO)  □ 按订单装配(ATO)' }),
                    new Paragraph({ text: '2) 生产车间数量？各车间的主要职能？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '3) 主要产品类型？产品BOM层级大概多少？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    
                    new Paragraph({ text: '4.3.2 生产计划', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '1) 目前如何制定生产计划？是否使用MRP？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '2) 计划调整频率？如何应对紧急订单？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '3) 物料齐套率如何？经常缺哪些物料？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    
                    new Paragraph({ text: '4.3.3 车间管理', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '1) 车间派工方式？进度如何汇报？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '2) 是否需要工序汇报？工时统计？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                    new Paragraph({ text: '3) 车间在制品管理方式？' }),
                    new Paragraph({ text: '   _______________________________________' }),
                ] : []),
                
                // 第五部分：项目期望
                new Paragraph({ text: '五、项目期望', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '1. 项目预算范围: _________ 万元' }),
                new Paragraph({ text: `2. 项目周期期望: ${projectInfo.projPeriod || '_______'}` }),
                new Paragraph({ text: '3. 希望系统解决的核心问题（请按优先级排序）：' }),
                new Paragraph({ text: '   (1) _______________________________________' }),
                new Paragraph({ text: '   (2) _______________________________________' }),
                new Paragraph({ text: '   (3) _______________________________________' }),
                new Paragraph({ text: '4. 对项目的其他期望：' }),
                new Paragraph({ text: '   _______________________________________' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 第六部分：附录
                new Paragraph({ text: '六、附录', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '请准备以下资料以便调研：', spacing: { after: 100 } }),
                new Paragraph({ text: '□ 组织架构图' }),
                new Paragraph({ text: '□ 现有系统清单' }),
                new Paragraph({ text: '□ 业务流程文档' }),
                new Paragraph({ text: '□ 财务报表样本' }),
                new Paragraph({ text: '□ 关键用户名单' }),
                new Paragraph({ text: '', spacing: { after: 400 } }),
                
                // 签字确认
                new Paragraph({ text: '感谢您的配合！', spacing: { before: 200 } }),
                new Paragraph({ text: `调研人员: _________  日期: ${new Date().toLocaleDateString('zh-CN')}` }),
                new Paragraph({ text: '被调研人员: _________  部门: _________  职位: _________' }),
            ],
        }],
    });
    
    const filename = generateFileName(shortName, '调研问卷');
    const filepath = path.join(OUTPUT_DIR, filename);
    
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filepath, buffer);
    return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
}

/**
 * 生成调研纪要 - 基于金蝶调研纪要模板
 */
async function generateSurveyMinutesV2(projectInfo, surveyData = {}) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = require('docx');
    
    const companyName = projectInfo.companyName || '客户公司';
    const shortName = projectInfo.shortName || 'DOC';
    const surveyDate = surveyData.date || new Date().toLocaleDateString('zh-CN');
    const department = surveyData.department || '财务部';
    
    const doc = new Document({
        title: `${companyName} - ${department}调研纪要`,
        sections: [{
            properties: {},
            children: [
                // 文档头部
                ...createDocHeader(companyName, `${department}调研纪要`),
                
                // 基本信息
                new Paragraph({ text: '一、调研基本信息', heading: HeadingLevel.HEADING_1 }),
                createTable(
                    ['项目', '内容'],
                    [
                        ['调研日期', surveyDate],
                        ['调研部门', department],
                        ['调研人员', surveyData.interviewer || '项目组'],
                        ['被调研人员', surveyData.interviewees || '部门负责人、关键用户'],
                        ['调研时长', surveyData.duration || '2小时'],
                        ['调研地点', surveyData.location || '会议室'],
                    ]
                ),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 调研目的
                new Paragraph({ text: '二、调研目的', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: surveyData.purpose || `了解${department}业务现状、识别痛点、收集需求，为后续业务蓝图设计提供依据。` }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 业务现状
                new Paragraph({ text: '三、业务现状', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '3.1 组织架构', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: surveyData.orgStructure || '（根据调研情况填写部门组织架构、人员配置、职责分工等）' }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '3.2 业务流程', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: surveyData.businessFlow || '（描述当前业务流程，包括流程步骤、参与角色、审批节点等）' }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '3.3 系统应用', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: surveyData.systemUsage || '（描述当前使用的系统、功能覆盖范围、数据流转情况）' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 痛点问题
                new Paragraph({ text: '四、痛点问题', heading: HeadingLevel.HEADING_1 }),
                ...((surveyData.painPoints || []).length > 0 ? 
                    surveyData.painPoints.map((p, i) => new Paragraph({ text: `${i + 1}. ${p}` })) :
                    [
                        new Paragraph({ text: '1. _________' }),
                        new Paragraph({ text: '2. _________' }),
                        new Paragraph({ text: '3. _________' }),
                    ]
                ),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 需求清单
                new Paragraph({ text: '五、需求清单', heading: HeadingLevel.HEADING_1 }),
                createTable(
                    ['序号', '需求描述', '优先级', '备注'],
                    (surveyData.requirements || [
                        ['1', '（需求描述）', '高', ''],
                        ['2', '（需求描述）', '中', ''],
                        ['3', '（需求描述）', '低', ''],
                    ]).map(r => r.map(c => c))
                ),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 建议方案
                new Paragraph({ text: '六、建议方案', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: surveyData.suggestions || '（根据调研情况，提出针对性的解决方案建议）' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 待确认事项
                new Paragraph({ text: '七、待确认事项', heading: HeadingLevel.HEADING_1 }),
                ...((surveyData.pendingItems || ['1. _________', '2. _________']).map(p => new Paragraph({ text: p }))),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 下一步计划
                new Paragraph({ text: '八、下一步计划', heading: HeadingLevel.HEADING_1 }),
                ...((surveyData.nextSteps || [
                    '1. 整理调研资料，形成调研报告',
                    '2. 确认待定事项',
                    '3. 安排下一阶段调研',
                ]).map(s => new Paragraph({ text: s }))),
                new Paragraph({ text: '', spacing: { after: 400 } }),
                
                // 签字确认
                new Paragraph({ text: '签字确认：', spacing: { before: 200 } }),
                createTable(
                    ['角色', '姓名', '签字', '日期'],
                    [
                        ['调研人员', '', '', ''],
                        ['被调研人员', '', '', ''],
                        ['项目经理', '', '', ''],
                    ]
                ),
            ],
        }],
    });
    
    const filename = generateFileName(shortName, `${department}调研纪要`);
    const filepath = path.join(OUTPUT_DIR, filename);
    
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filepath, buffer);
    return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
}

/**
 * 生成业务蓝图 - 基于金蝶蓝图模板
 */
async function generateBlueprintV2(projectInfo) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = require('docx');
    
    const companyName = projectInfo.companyName || '客户公司';
    const shortName = projectInfo.shortName || 'DOC';
    const modules = Object.entries(projectInfo.modules || {})
        .filter(([k, v]) => v.enabled)
        .map(([k]) => k);
    const moduleNames = modules.map(k => {
        const names = { finance: '财务管理', supply: '供应链管理', manufacturing: '生产制造', hr: '人力资源管理', allchannel: '全渠道营销', epm: 'EPM合并报表', invoice: '发票管理', expense: '费用报销' };
        return names[k] || k;
    });
    
    // 里程碑数据
    const milestonePhases = [
        { id: 'startup', name: '项目启动', duration: '1周' },
        { id: 'survey', name: '调研设计', duration: '2-3周' },
        { id: 'blueprint', name: '蓝图设计', duration: '2-3周' },
        { id: 'build', name: '系统构建', duration: '4-8周' },
        { id: 'uat', name: 'UAT测试', duration: '2-3周' },
        { id: 'golive', name: '系统上线', duration: '1-2周' }
    ];
    
    const milestones = milestonePhases.map((phase, i) => {
        const m = (projectInfo.milestones || []).find(m => m.id === phase.id) || {};
        return {
            phase: phase.name,
            startDate: m.startDate || '待定',
            endDate: m.endDate || '待定',
            duration: phase.duration
        };
    });
    
    const doc = new Document({
        title: `${companyName} - 业务蓝图详细设计报告`,
        sections: [{
            properties: {},
            children: [
                // 文档头部
                ...createDocHeader(companyName, '业务蓝图详细设计报告'),
                
                // 文档管理信息
                new Paragraph({ text: '文档管理信息', heading: HeadingLevel.HEADING_1 }),
                createChangeLogTable(),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 第一章 项目概述
                new Paragraph({ text: '第一章 项目概述', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '1.1 项目背景', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `${companyName}为了提升企业管理水平，实现数字化转型，决定实施ERP系统。本项目旨在构建一套覆盖${moduleNames.join('、')}等业务领域的统一管理平台，实现业务流程标准化、数据共享化、管理精细化。` }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '1.2 项目目标', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '本项目预期实现以下目标：' }),
                new Paragraph({ text: '- 构建一体化ERP平台，实现业财一体化' }),
                new Paragraph({ text: '- 提升运营效率，缩短业务处理周期30%以上' }),
                new Paragraph({ text: '- 实现数据共享，支撑管理决策' }),
                new Paragraph({ text: '- 规范业务流程，降低运营风险' }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '1.3 建设范围', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '1.3.1 功能模块', heading: HeadingLevel.HEADING_3 }),
                ...moduleNames.map(m => new Paragraph({ text: `- ${m}` })),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '1.3.2 用户规模', heading: HeadingLevel.HEADING_3 }),
                new Paragraph({ text: `- 并发用户数: ${projectInfo.userScale?.concurrent || 100}` }),
                new Paragraph({ text: `- 总用户数: ${projectInfo.userScale?.total || 500}` }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 第二章 组织架构
                new Paragraph({ text: '第二章 组织架构设计', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '2.1 法人组织', heading: HeadingLevel.HEADING_2 }),
                createTable(
                    ['序号', '组织名称', '组织类型', '税号', '地址'],
                    (projectInfo.organizations || [{ name: '总部', type: '法人组织', taxNo: '', address: '' }]).map((org, i) => 
                        [String(i + 1), org.name, org.type, org.taxNo || '-', org.address || '-']
                    )
                ),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 第三章 业务流程设计
                new Paragraph({ text: '第三章 业务流程设计', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '3.1 业务流程总体规划', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '基于金蝶AIGO方法论，结合企业实际业务，规划以下核心业务流程：' }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                ...(modules.includes('finance') ? [
                    new Paragraph({ text: '3.2 财务管理流程', heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: '3.2.1 PTP流程（采购到付款）', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '采购申请 → 采购订单 → 收货 → 入库 → 发票 → 付款 → 核销' }),
                    new Paragraph({ text: '', spacing: { after: 100 } }),
                    new Paragraph({ text: '3.2.2 OTC流程（订单到回款）', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '销售报价 → 销售订单 → 发货 → 出库 → 开票 → 收款 → 核销' }),
                    new Paragraph({ text: '', spacing: { after: 100 } }),
                    new Paragraph({ text: '3.2.3 R2R流程（记录到报告）', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '业务单据 → 凭证生成 → 审核 → 记账 → 结账 → 报表' }),
                    new Paragraph({ text: '', spacing: { after: 200 } }),
                ] : []),
                
                ...(modules.includes('supply') ? [
                    new Paragraph({ text: '3.3 供应链管理流程', heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: '3.3.1 采购流程', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '需求申请 → 审批 → 询价 → 比价 → 订单 → 收货 → 入库 → 付款' }),
                    new Paragraph({ text: '', spacing: { after: 100 } }),
                    new Paragraph({ text: '3.3.2 销售流程', heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: '销售报价 → 订单 → 发货 → 出库 → 开票 → 收款' }),
                    new Paragraph({ text: '', spacing: { after: 200 } }),
                ] : []),
                
                // 第四章 里程碑计划
                new Paragraph({ text: '第四章 项目里程碑计划', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '4.1 项目里程碑', heading: HeadingLevel.HEADING_2 }),
                createTable(
                    ['阶段', '开始日期', '结束日期', '工期', '主要交付物'],
                    milestones.map(m => [
                        m.phase,
                        m.startDate,
                        m.endDate,
                        m.duration,
                        getDeliverables(m.phase)
                    ])
                ),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '4.2 关键里程碑节点', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '- 项目启动会：项目正式启动，明确项目目标、范围、组织' }),
                new Paragraph({ text: '- 蓝图确认：业务蓝图签字确认，进入系统构建阶段' }),
                new Paragraph({ text: '- UAT完成：用户验收测试完成，系统具备上线条件' }),
                new Paragraph({ text: '- 系统上线：新系统正式运行，项目进入运维阶段' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                // 第五章 签字确认
                new Paragraph({ text: '第五章 签字确认', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '本业务蓝图详细设计报告经双方确认，作为项目实施的依据。', spacing: { after: 200 } }),
                createTable(
                    ['角色', '姓名', '签字', '日期'],
                    [
                        ['甲方项目经理', '', '', ''],
                        ['乙方项目经理', '', '', ''],
                        ['甲方负责人', '', '', ''],
                        ['乙方负责人', '', '', ''],
                    ]
                ),
            ],
        }],
    });
    
    const filename = generateFileName(shortName, '业务蓝图');
    const filepath = path.join(OUTPUT_DIR, filename);
    
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filepath, buffer);
    return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
}

// 获取交付物
function getDeliverables(phase) {
    const deliverables = {
        '项目启动': '项目章程、项目计划',
        '调研设计': '调研报告、需求清单',
        '蓝图设计': '业务蓝图、技术方案',
        '系统构建': '系统配置、开发文档',
        'UAT测试': '测试报告、用户手册',
        '系统上线': '上线方案、运维手册'
    };
    return deliverables[phase] || '';
}

/**
 * 生成开发设计说明书 V2
 */
async function generateDevSpecV2(projectInfo) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table } = require('docx');
    
    const companyName = projectInfo.companyName || '客户公司';
    const shortName = projectInfo.shortName || 'DOC';
    
    const doc = new Document({
        title: `${companyName} - 客户化开发设计说明书`,
        sections: [{
            properties: {},
            children: [
                ...createDocHeader(companyName, '客户化开发设计说明书'),
                
                new Paragraph({ text: '文档管理信息', heading: HeadingLevel.HEADING_1 }),
                createChangeLogTable(),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第一章 开发概述', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '1.1 开发背景', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `本文档描述${companyName}ERP项目的客户化开发需求及技术设计方案。开发范围包括：接口开发、报表开发、单据开发、工作流定制等。` }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '1.2 开发原则', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '- 遵循金蝶开发规范和最佳实践' }),
                new Paragraph({ text: '- 采用低代码平台优先，减少硬编码' }),
                new Paragraph({ text: '- 代码可维护、可扩展、可复用' }),
                new Paragraph({ text: '- 完善的注释和文档' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第二章 开发需求清单', heading: HeadingLevel.HEADING_1 }),
                createTable(
                    ['序号', '需求名称', '需求类型', '优先级', '预计工期', '负责人'],
                    [
                        ['1', '（需求名称）', '接口/报表/单据', '高', '（天）', ''],
                        ['2', '（需求名称）', '接口/报表/单据', '中', '（天）', ''],
                        ['3', '（需求名称）', '接口/报表/单据', '低', '（天）', ''],
                    ]
                ),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第三章 详细设计', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '3.1 接口设计', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '（根据实际接口需求填写）' }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '3.2 报表设计', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '（根据实际报表需求填写）' }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '3.3 单据设计', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '（根据实际单据需求填写）' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第四章 测试方案', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '4.1 单元测试', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '- 每个开发项需编写单元测试用例' }),
                new Paragraph({ text: '- 测试覆盖率不低于80%' }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '4.2 集成测试', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '- 与标准功能集成测试' }),
                new Paragraph({ text: '- 与外部系统联调测试' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第五章 签字确认', heading: HeadingLevel.HEADING_1 }),
                createTable(
                    ['角色', '姓名', '签字', '日期'],
                    [
                        ['开发负责人', '', '', ''],
                        ['项目经理', '', '', ''],
                    ]
                ),
            ],
        }],
    });
    
    const filename = generateFileName(shortName, '开发设计说明书');
    const filepath = path.join(OUTPUT_DIR, filename);
    
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filepath, buffer);
    return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
}

/**
 * 生成集成方案 V2
 */
async function generateIntegrationPlanV2(projectInfo) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table } = require('docx');
    
    const companyName = projectInfo.companyName || '客户公司';
    const shortName = projectInfo.shortName || 'DOC';
    
    const doc = new Document({
        title: `${companyName} - 系统集成方案`,
        sections: [{
            properties: {},
            children: [
                ...createDocHeader(companyName, '系统集成方案'),
                
                new Paragraph({ text: '文档管理信息', heading: HeadingLevel.HEADING_1 }),
                createChangeLogTable(),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第一章 集成概述', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '1.1 集成背景', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `${companyName}ERP项目需要与现有业务系统进行集成，实现数据互通和业务协同。` }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '1.2 集成原则', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '- 数据一致性：确保各系统间数据同步准确' }),
                new Paragraph({ text: '- 接口安全性：采用加密传输、身份认证' }),
                new Paragraph({ text: '- 可扩展性：预留扩展接口' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第二章 集成系统清单', heading: HeadingLevel.HEADING_1 }),
                createTable(
                    ['序号', '系统名称', '集成类型', '数据方向', '接口方式', '频率'],
                    [
                        ['1', 'OA系统', '单据同步', '双向', 'API', '实时'],
                        ['2', 'CRM系统', '客户数据', '单向', 'API', '每日'],
                        ['3', 'MES系统', '生产数据', '双向', '中间库', '实时'],
                    ]
                ),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第三章 接口详细设计', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '（根据实际接口需求详细设计）' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第四章 签字确认', heading: HeadingLevel.HEADING_1 }),
                createTable(
                    ['角色', '姓名', '签字', '日期'],
                    [
                        ['技术负责人', '', '', ''],
                        ['项目经理', '', '', ''],
                    ]
                ),
            ],
        }],
    });
    
    const filename = generateFileName(shortName, '集成方案');
    const filepath = path.join(OUTPUT_DIR, filename);
    
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filepath, buffer);
    return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
}

/**
 * 生成UAT测试方案 V2
 */
async function generateUATPlanV2(projectInfo) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table } = require('docx');
    
    const companyName = projectInfo.companyName || '客户公司';
    const shortName = projectInfo.shortName || 'DOC';
    
    const doc = new Document({
        title: `${companyName} - UAT测试方案`,
        sections: [{
            properties: {},
            children: [
                ...createDocHeader(companyName, 'UAT测试方案'),
                
                new Paragraph({ text: '文档管理信息', heading: HeadingLevel.HEADING_1 }),
                createChangeLogTable(),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第一章 测试概述', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '1.1 测试目的', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `验证${companyName}ERP系统是否满足业务需求，确保系统功能正确、数据准确、流程顺畅。` }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '1.2 测试范围', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '- 功能测试：验证系统功能是否符合需求' }),
                new Paragraph({ text: '- 流程测试：验证业务流程是否顺畅' }),
                new Paragraph({ text: '- 接口测试：验证系统接口是否正确' }),
                new Paragraph({ text: '- 性能测试：验证系统响应是否达标' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第二章 测试计划', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '2.1 测试时间安排', heading: HeadingLevel.HEADING_2 }),
                createTable(
                    ['阶段', '开始日期', '结束日期', '测试内容', '负责人'],
                    [
                        ['环境准备', '', '', '测试环境部署、数据准备', ''],
                        ['功能测试', '', '', '各模块功能验证', ''],
                        ['流程测试', '', '', '端到端流程验证', ''],
                        ['回归测试', '', '', '缺陷修复验证', ''],
                        ['验收测试', '', '', '最终验收', ''],
                    ]
                ),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第三章 测试用例', heading: HeadingLevel.HEADING_1 }),
                createTable(
                    ['用例编号', '测试场景', '前置条件', '测试步骤', '预期结果', '实际结果', '状态'],
                    [
                        ['TC001', '（场景）', '', '', '', '', ''],
                        ['TC002', '（场景）', '', '', '', '', ''],
                        ['TC003', '（场景）', '', '', '', '', ''],
                    ]
                ),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第四章 缺陷管理', heading: HeadingLevel.HEADING_1 }),
                createTable(
                    ['缺陷级别', '定义', '响应时间', '修复时间'],
                    [
                        ['致命', '系统崩溃、数据丢失', '立即', '24小时'],
                        ['严重', '主要功能无法使用', '2小时', '3天'],
                        ['一般', '功能异常但有变通方案', '1天', '1周'],
                        ['建议', '优化建议', '3天', '下版本'],
                    ]
                ),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第五章 签字确认', heading: HeadingLevel.HEADING_1 }),
                createTable(
                    ['角色', '姓名', '签字', '日期'],
                    [
                        ['测试负责人', '', '', ''],
                        ['项目经理', '', '', ''],
                    ]
                ),
            ],
        }],
    });
    
    const filename = generateFileName(shortName, 'UAT测试方案');
    const filepath = path.join(OUTPUT_DIR, filename);
    
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filepath, buffer);
    return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
}

/**
 * 生成上线方案 V2
 */
async function generateGolivePlanV2(projectInfo) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table } = require('docx');
    
    const companyName = projectInfo.companyName || '客户公司';
    const shortName = projectInfo.shortName || 'DOC';
    
    // 里程碑数据
    const goliveDate = (projectInfo.milestones || []).find(m => m.id === 'golive')?.startDate || '待定';
    
    const doc = new Document({
        title: `${companyName} - 系统上线方案`,
        sections: [{
            properties: {},
            children: [
                ...createDocHeader(companyName, '系统上线方案'),
                
                new Paragraph({ text: '文档管理信息', heading: HeadingLevel.HEADING_1 }),
                createChangeLogTable(),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第一章 上线概述', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '1.1 上线目标', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `确保${companyName}ERP系统顺利切换上线，实现业务平稳过渡。` }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '1.2 上线时间', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `计划上线日期：${goliveDate}` }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第二章 上线准备', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '2.1 系统准备', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '□ 生产环境部署完成' }),
                new Paragraph({ text: '□ 数据迁移完成并验证' }),
                new Paragraph({ text: '□ 接口联调测试通过' }),
                new Paragraph({ text: '□ 用户权限配置完成' }),
                new Paragraph({ text: '', spacing: { after: 100 } }),
                
                new Paragraph({ text: '2.2 组织准备', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '□ 上线指挥小组成立' }),
                new Paragraph({ text: '□ 关键用户培训完成' }),
                new Paragraph({ text: '□ 运维团队到位' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第三章 切换计划', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '3.1 切换时间安排', heading: HeadingLevel.HEADING_2 }),
                createTable(
                    ['时间', '任务', '负责人', '备注'],
                    [
                        ['T-7天', '数据最终验证', '', ''],
                        ['T-3天', '用户培训', '', ''],
                        ['T-1天', '系统冻结', '', '停止旧系统操作'],
                        ['T日', '系统切换', '', '新系统上线'],
                        ['T+1天', '运行监控', '', ''],
                        ['T+7天', '上线验收', '', ''],
                    ]
                ),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第四章 应急预案', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '4.1 回退方案', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: '如遇重大问题，执行系统回退：' }),
                new Paragraph({ text: '1. 停止新系统操作' }),
                new Paragraph({ text: '2. 恢复旧系统数据' }),
                new Paragraph({ text: '3. 通知用户切换回旧系统' }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '第五章 签字确认', heading: HeadingLevel.HEADING_1 }),
                createTable(
                    ['角色', '姓名', '签字', '日期'],
                    [
                        ['项目经理', '', '', ''],
                        ['甲方负责人', '', '', ''],
                        ['乙方负责人', '', '', ''],
                    ]
                ),
            ],
        }],
    });
    
    const filename = generateFileName(shortName, '上线方案');
    const filepath = path.join(OUTPUT_DIR, filename);
    
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filepath, buffer);
    return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
}

// 导出函数
module.exports = {
    generateSurveyQuestionnaire: generateSurveyQuestionnaireV2,
    generateSurveyMinutes: generateSurveyMinutesV2,
    generateBlueprint: generateBlueprintV2,
    generateDevSpec: generateDevSpecV2,
    generateIntegrationPlan: generateIntegrationPlanV2,
    generateUATPlan: generateUATPlanV2,
    generateGolivePlan: generateGolivePlanV2,
    KINGDEE_KNOWLEDGE
};