/**
 * Word文档生成器 - 使用docx库
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 生成调研问卷
 */
function generateSurveyQuestionnaire(projectInfo) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
    
    const doc = new Document({
        title: `${projectInfo.companyName || '客户'} - 调研问卷`,
        description: `${projectInfo.industry || '制造业'}行业数字化转型调研`,
        sections: [{
            properties: {},
            children: [
                // 标题
                new Paragraph({
                    text: `${projectInfo.companyName || '客户'} ERP项目调研问卷`,
                    heading: HeadingLevel.TITLE,
                }),
                new Paragraph({
                    text: `调研日期: ${new Date().toLocaleDateString('zh-CN')}`,
                    spacing: { after: 400 },
                }),
                
                // 第一部分：企业基本信息
                new Paragraph({ text: '一、企业基本信息', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `1. 企业名称: ${projectInfo.companyName || '___________'}` }),
                new Paragraph({ text: `2. 所属行业: ${projectInfo.industry || '制造业'}` }),
                new Paragraph({ text: `3. 企业规模: ${projectInfo.companySize || '中型企业'}` }),
                new Paragraph({ text: `4. 员工人数: ${projectInfo.userScale?.total || '___'} 人` }),
                new Paragraph({ text: `5. 年营业额: _________ 万元` }),
                new Paragraph({ text: `6. 分支机构数量: _________ 个` }),
                
                // 第二部分：信息化现状
                new Paragraph({ text: '二、信息化现状', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '1. 现有信息系统（请勾选）:' }),
                new Paragraph({ text: '   □ ERP系统  品牌: _________ 使用年限: _________ 年' }),
                new Paragraph({ text: '   □ 财务软件  品牌: _________ 使用年限: _________ 年' }),
                new Paragraph({ text: '   □ OA系统  品牌: _________ 使用年限: _________ 年' }),
                new Paragraph({ text: '   □ CRM系统  品牌: _________ 使用年限: _________ 年' }),
                new Paragraph({ text: '   □ 其他系统: _________' }),
                new Paragraph({ text: '2. 现有系统存在的主要问题:' }),
                new Paragraph({ text: '   _______________________________________' }),
                new Paragraph({ text: '   _______________________________________' }),
                
                // 第三部分：业务需求
                new Paragraph({ text: '三、业务需求', heading: HeadingLevel.HEADING_1 }),
                
                // 根据模块生成问题
                ...(projectInfo.modules?.finance?.enabled ? [
                    new Paragraph({ text: '【财务云】', heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: '1. 目前财务核算周期: □ 月结 □ 旬结 □ 周结' }),
                    new Paragraph({ text: '2. 是否需要多账簿管理: □ 是 □ 否' }),
                    new Paragraph({ text: '3. 成本核算方式: □ 品种法 □ 分批法 □ 分步法' }),
                    new Paragraph({ text: '4. 费用报销主要痛点: _________' }),
                ] : []),
                
                ...(projectInfo.modules?.supply?.enabled ? [
                    new Paragraph({ text: '【供应链】', heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: '1. 供应商数量: _________ 家' }),
                    new Paragraph({ text: '2. 客户数量: _________ 家' }),
                    new Paragraph({ text: '3. 仓库数量: _________ 个' }),
                    new Paragraph({ text: '4. 是否需要批次管理: □ 是 □ 否' }),
                    new Paragraph({ text: '5. 是否需要序列号管理: □ 是 □ 否' }),
                ] : []),
                
                ...(projectInfo.modules?.manufacturing?.enabled ? [
                    new Paragraph({ text: '【制造云】', heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: '1. 生产模式: □ 按库存生产 □ 按订单生产 □ 按订单设计' }),
                    new Paragraph({ text: '2. 生产车间数量: _________ 个' }),
                    new Paragraph({ text: '3. 是否需要MRP运算: □ 是 □ 否' }),
                    new Paragraph({ text: '4. 车间管理需求: _________' }),
                ] : []),
                
                // 第四部分：客户化开发需求
                new Paragraph({ text: '四、客户化开发需求', heading: HeadingLevel.HEADING_1 }),
                ...(projectInfo.devRequirements || []).map((req, i) => 
                    new Paragraph({ text: `${i + 1}. ${req.name} (预计工期: ${req.days}天)` })
                ),
                new Paragraph({ text: '其他开发需求:' }),
                new Paragraph({ text: '   _______________________________________' }),
                
                // 第五部分：系统集成需求
                new Paragraph({ text: '五、系统集成需求', heading: HeadingLevel.HEADING_1 }),
                ...(projectInfo.integrationRequirements || []).map((int, i) => 
                    new Paragraph({ text: `${i + 1}. ${int.system} - ${int.type} - ${int.direction}` })
                ),
                new Paragraph({ text: '其他集成需求:' }),
                new Paragraph({ text: '   _______________________________________' }),
                
                // 第六部分：项目期望
                new Paragraph({ text: '六、项目期望', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '1. 项目预算范围: _________ 万元' }),
                new Paragraph({ text: `2. 项目周期期望: ${projectInfo.projPeriod || '_______'}` }),
                new Paragraph({ text: '3. 希望系统解决的问题:' }),
                new Paragraph({ text: '   _______________________________________' }),
                new Paragraph({ text: '   _______________________________________' }),
                new Paragraph({ text: '4. 对项目的其他期望:' }),
                new Paragraph({ text: '   _______________________________________' }),
                
                // 结束
                new Paragraph({ text: '感谢您的配合！', spacing: { before: 400 } }),
                new Paragraph({ text: `调研人员: _________  日期: ${new Date().toLocaleDateString('zh-CN')}` }),
                new Paragraph({ text: '被调研人员: _________  部门: _________  职位: _________' }),
            ],
        }],
    });
    
    const filename = `${projectInfo.companyName || '客户'}_调研问卷_${Date.now()}.docx`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    return Packer.toBuffer(doc).then(buffer => {
        fs.writeFileSync(filepath, buffer);
        return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
    });
}

/**
 * 生成调研纪要
 */
function generateSurveyMinutes(projectInfo, surveyData = {}) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
    
    const doc = new Document({
        title: `${projectInfo.companyName || '客户'} - 调研纪要`,
        sections: [{
            properties: {},
            children: [
                new Paragraph({ text: `${projectInfo.companyName || '客户'} ERP项目调研纪要`, heading: HeadingLevel.TITLE }),
                new Paragraph({ text: `调研日期: ${surveyData.date || new Date().toLocaleDateString('zh-CN')}` }),
                new Paragraph({ text: `调研部门: ${surveyData.department || '___________'}` }),
                new Paragraph({ text: `调研人员: ${surveyData.interviewer || '___________'}` }),
                new Paragraph({ text: `被调研人员: ${surveyData.interviewees || '___________'}` }),
                new Paragraph({ text: '', spacing: { after: 200 } }),
                
                new Paragraph({ text: '一、调研目的', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: surveyData.purpose || '了解业务现状、识别痛点、收集需求。' }),
                
                new Paragraph({ text: '二、业务现状', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: surveyData.currentStatus || '（根据调研情况填写）' }),
                
                new Paragraph({ text: '三、痛点问题', heading: HeadingLevel.HEADING_1 }),
                ...(surveyData.painPoints || ['1. _________', '2. _________', '3. _________']).map(p => 
                    new Paragraph({ text: p })
                ),
                
                new Paragraph({ text: '四、需求清单', heading: HeadingLevel.HEADING_1 }),
                ...(surveyData.requirements || ['1. _________', '2. _________', '3. _________']).map(r => 
                    new Paragraph({ text: r })
                ),
                
                new Paragraph({ text: '五、建议方案', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: surveyData.suggestions || '（根据需求提出建议方案）' }),
                
                new Paragraph({ text: '六、下一步计划', heading: HeadingLevel.HEADING_1 }),
                ...(surveyData.nextSteps || ['1. 完成业务蓝图设计', '2. 确认技术方案', '3. 启动系统配置']).map(s => 
                    new Paragraph({ text: s })
                ),
                
                new Paragraph({ text: '', spacing: { before: 400 } }),
                new Paragraph({ text: '签字确认：' }),
                new Paragraph({ text: '调研人员: _________     日期: _________' }),
                new Paragraph({ text: '被调研人员: _________  日期: _________' }),
            ],
        }],
    });
    
    const filename = `${projectInfo.companyName || '客户'}_调研纪要_${Date.now()}.docx`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    return Packer.toBuffer(doc).then(buffer => {
        fs.writeFileSync(filepath, buffer);
        return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
    });
}

/**
 * 生成业务蓝图
 */
function generateBlueprint(projectInfo) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
    
    const modules = Object.entries(projectInfo.modules || {})
        .filter(([k, v]) => v.enabled)
        .map(([k, v]) => {
            const names = { finance: '财务云', supply: '供应链', manufacturing: '制造云', hr: '人力云', allchannel: '全渠道', epm: 'EPM', invoice: '发票云', expense: '费用报销' };
            return names[k] || k;
        });
    
    // 格式化里程碑数据
    const milestonePhases = [
        { id: 'startup', name: '项目启动' },
        { id: 'survey', name: '调研设计' },
        { id: 'blueprint', name: '蓝图设计' },
        { id: 'build', name: '系统构建' },
        { id: 'uat', name: 'UAT测试' },
        { id: 'golive', name: '系统上线' }
    ];
    
    const milestones = milestonePhases.map((phase, i) => {
        const m = (projectInfo.milestones || []).find(m => m.id === phase.id) || {};
        return {
            phase: phase.name,
            startDate: m.startDate || '待定',
            endDate: m.endDate || '待定'
        };
    });
    
    const doc = new Document({
        title: `${projectInfo.companyName || '客户'} - 业务蓝图`,
        sections: [{
            properties: {},
            children: [
                new Paragraph({ text: `${projectInfo.companyName || '客户'} ERP项目业务蓝图`, heading: HeadingLevel.TITLE }),
                new Paragraph({ text: `版本: V1.0` }),
                new Paragraph({ text: `日期: ${new Date().toLocaleDateString('zh-CN')}` }),
                new Paragraph({ text: '', spacing: { after: 400 } }),
                
                new Paragraph({ text: '一、项目概述', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `1.1 项目背景` }),
                new Paragraph({ text: `${projectInfo.companyName || '客户'}为了提升管理水平，实现数字化转型，决定实施ERP系统。本项目将建设覆盖${modules.join('、')}等业务领域的统一管理平台。` }),
                new Paragraph({ text: `1.2 项目目标` }),
                new Paragraph({ text: `- 构建一体化ERP平台，实现业财一体化` }),
                new Paragraph({ text: `- 提升运营效率，缩短业务处理周期` }),
                new Paragraph({ text: `- 实现数据共享，支撑管理决策` }),
                
                new Paragraph({ text: '二、建设范围', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `2.1 功能模块` }),
                ...modules.map(m => new Paragraph({ text: `- ${m}` })),
                new Paragraph({ text: `2.2 用户规模` }),
                new Paragraph({ text: `- 并发用户数: ${projectInfo.userScale?.concurrent || 100}` }),
                new Paragraph({ text: `- 总用户数: ${projectInfo.userScale?.total || 500}` }),
                
                new Paragraph({ text: '三、里程碑计划', heading: HeadingLevel.HEADING_1 }),
                ...milestones.map((m, i) => [
                    new Paragraph({ text: `${i + 1}. ${m.phase}: ${m.startDate} ~ ${m.endDate}` })
                ]).flat(),
                
                new Paragraph({ text: '四、组织架构', heading: HeadingLevel.HEADING_1 }),
                ...(projectInfo.organizations || [{ name: '总部', type: '法人组织', users: 200 }]).map(org =>
                    new Paragraph({ text: `- ${org.name}（${org.type}，${org.users}用户）` })
                ),
                
                new Paragraph({ text: '五、业务流程设计', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `5.1 采购业务流程` }),
                new Paragraph({ text: `采购申请 → 采购订单 → 收货检验 → 入库 → 发票 → 付款` }),
                new Paragraph({ text: `5.2 销售业务流程` }),
                new Paragraph({ text: `销售报价 → 销售订单 → 发货 → 出库 → 开票 → 收款` }),
                new Paragraph({ text: `5.3 财务业务流程` }),
                new Paragraph({ text: `业务单据 → 凭证生成 → 审核 → 记账 → 报表` }),
                
                new Paragraph({ text: '', spacing: { before: 400 } }),
                new Paragraph({ text: '签字确认：' }),
                new Paragraph({ text: '项目经理: _________     日期: _________' }),
                new Paragraph({ text: '客户负责人: _________  日期: _________' }),
            ],
        }],
    });
    
    const filename = `${projectInfo.companyName || '客户'}_业务蓝图_${Date.now()}.docx`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    return Packer.toBuffer(doc).then(buffer => {
        fs.writeFileSync(filepath, buffer);
        return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
    });
}

/**
 * 生成开发设计说明书
 */
function generateDevSpec(projectInfo) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
    
    const doc = new Document({
        title: `${projectInfo.companyName || '客户'} - 开发设计说明书`,
        sections: [{
            properties: {},
            children: [
                new Paragraph({ text: `${projectInfo.companyName || '客户'} ERP项目开发设计说明书`, heading: HeadingLevel.TITLE }),
                new Paragraph({ text: `版本: V1.0` }),
                new Paragraph({ text: `日期: ${new Date().toLocaleDateString('zh-CN')}` }),
                new Paragraph({ text: '', spacing: { after: 400 } }),
                
                new Paragraph({ text: '一、开发概述', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `本文档描述${projectInfo.companyName || '客户'}ERP项目的客户化开发需求及技术设计方案。` }),
                
                new Paragraph({ text: '二、开发需求清单', heading: HeadingLevel.HEADING_1 }),
                ...(projectInfo.devRequirements || []).map((req, i) => [
                    new Paragraph({ text: `${i + 1}. ${req.name}`, heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: `优先级: ${req.priority || '中'}` }),
                    new Paragraph({ text: `预计工期: ${req.days}天` }),
                    new Paragraph({ text: `功能描述: _________` }),
                    new Paragraph({ text: `技术方案: _________` }),
                ]).flat(),
                
                new Paragraph({ text: '三、接口设计', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `3.1 接口清单` }),
                ...(projectInfo.integrationRequirements || []).map((int, i) =>
                    new Paragraph({ text: `${i + 1}. ${int.system} - ${int.type} - ${int.direction}` })
                ),
                
                new Paragraph({ text: '四、开发规范', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `4.1 命名规范` }),
                new Paragraph({ text: `- 类名: 大驼峰命名法` }),
                new Paragraph({ text: `- 方法名: 小驼峰命名法` }),
                new Paragraph({ text: `- 变量名: 小驼峰命名法` }),
                new Paragraph({ text: `4.2 代码注释` }),
                new Paragraph({ text: `- 类注释: 描述类的功能` }),
                new Paragraph({ text: `- 方法注释: 描述参数和返回值` }),
                
                new Paragraph({ text: '五、测试要求', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `- 单元测试覆盖率 ≥ 80%` }),
                new Paragraph({ text: `- 集成测试通过率 100%` }),
                new Paragraph({ text: `- 性能测试响应时间 < 3秒` }),
            ],
        }],
    });
    
    const filename = `${projectInfo.companyName || '客户'}_开发设计说明书_${Date.now()}.docx`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    return Packer.toBuffer(doc).then(buffer => {
        fs.writeFileSync(filepath, buffer);
        return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
    });
}

/**
 * 生成集成方案
 */
function generateIntegrationPlan(projectInfo) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
    
    const doc = new Document({
        title: `${projectInfo.companyName || '客户'} - 系统集成方案`,
        sections: [{
            properties: {},
            children: [
                new Paragraph({ text: `${projectInfo.companyName || '客户'} ERP项目系统集成方案`, heading: HeadingLevel.TITLE }),
                new Paragraph({ text: `版本: V1.0` }),
                new Paragraph({ text: `日期: ${new Date().toLocaleDateString('zh-CN')}` }),
                new Paragraph({ text: '', spacing: { after: 400 } }),
                
                new Paragraph({ text: '一、集成概述', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `本文档描述${projectInfo.companyName || '客户'}ERP项目与外部系统的集成方案。` }),
                
                new Paragraph({ text: '二、集成系统清单', heading: HeadingLevel.HEADING_1 }),
                ...(projectInfo.integrationRequirements || []).map((int, i) => [
                    new Paragraph({ text: `${i + 1}. ${int.system}`, heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: `- 集成类型: ${int.type}` }),
                    new Paragraph({ text: `- 数据方向: ${int.direction}` }),
                    new Paragraph({ text: `- 接口方式: REST API / WebService` }),
                ]).flat(),
                
                new Paragraph({ text: '三、接口设计', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `3.1 接口协议` }),
                new Paragraph({ text: `- 传输协议: HTTPS` }),
                new Paragraph({ text: `- 数据格式: JSON` }),
                new Paragraph({ text: `- 认证方式: OAuth 2.0` }),
                new Paragraph({ text: `3.2 接口安全` }),
                new Paragraph({ text: `- 数据加密: AES-256` }),
                new Paragraph({ text: `- 访问控制: IP白名单` }),
                
                new Paragraph({ text: '四、集成测试', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `- 连通性测试` }),
                new Paragraph({ text: `- 数据一致性测试` }),
                new Paragraph({ text: `- 异常处理测试` }),
                new Paragraph({ text: `- 性能压力测试` }),
            ],
        }],
    });
    
    const filename = `${projectInfo.companyName || '客户'}_集成方案_${Date.now()}.docx`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    return Packer.toBuffer(doc).then(buffer => {
        fs.writeFileSync(filepath, buffer);
        return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
    });
}

/**
 * 生成UAT测试方案
 */
function generateUATPlan(projectInfo) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
    
    const modules = Object.entries(projectInfo.modules || {})
        .filter(([k, v]) => v.enabled)
        .map(([k, v]) => {
            const names = { finance: '财务云', supply: '供应链', manufacturing: '制造云', hr: '人力云', allchannel: '全渠道', epm: 'EPM' };
            return names[k] || k;
        });
    
    const doc = new Document({
        title: `${projectInfo.companyName || '客户'} - UAT测试方案`,
        sections: [{
            properties: {},
            children: [
                new Paragraph({ text: `${projectInfo.companyName || '客户'} ERP项目UAT测试方案`, heading: HeadingLevel.TITLE }),
                new Paragraph({ text: `版本: V1.0` }),
                new Paragraph({ text: `日期: ${new Date().toLocaleDateString('zh-CN')}` }),
                new Paragraph({ text: '', spacing: { after: 400 } }),
                
                new Paragraph({ text: '一、测试概述', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `1.1 测试目的` }),
                new Paragraph({ text: `验证系统功能满足业务需求，确认系统可以正常运行。` }),
                new Paragraph({ text: `1.2 测试范围` }),
                ...modules.map(m => new Paragraph({ text: `- ${m}` })),
                new Paragraph({ text: `1.3 测试时间` }),
                new Paragraph({ text: `预计测试周期: 15个工作日` }),
                
                new Paragraph({ text: '二、测试环境', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `- 服务器: 测试环境服务器` }),
                new Paragraph({ text: `- 客户端: Windows 10/11, Chrome浏览器` }),
                new Paragraph({ text: `- 数据: 测试数据` }),
                
                new Paragraph({ text: '三、测试用例', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `3.1 功能测试用例` }),
                new Paragraph({ text: `| 编号 | 模块 | 功能 | 测试步骤 | 预期结果 |` }),
                new Paragraph({ text: `|------|------|------|----------|----------|` }),
                new Paragraph({ text: `| TC001 | 财务 | 总账凭证 | 新增凭证 | 凭证保存成功 |` }),
                new Paragraph({ text: `| TC002 | 供应链 | 采购订单 | 新增订单 | 订单保存成功 |` }),
                
                new Paragraph({ text: '四、问题管理', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `- 严重问题: 阻断测试，立即修复` }),
                new Paragraph({ text: `- 一般问题: 记录问题，安排修复` }),
                new Paragraph({ text: `- 建议问题: 评估后处理` }),
                
                new Paragraph({ text: '五、验收标准', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `- 功能测试通过率 ≥ 95%` }),
                new Paragraph({ text: `- 严重问题数 = 0` }),
                new Paragraph({ text: `- 一般问题数 ≤ 10` }),
            ],
        }],
    });
    
    const filename = `${projectInfo.companyName || '客户'}_UAT测试方案_${Date.now()}.docx`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    return Packer.toBuffer(doc).then(buffer => {
        fs.writeFileSync(filepath, buffer);
        return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
    });
}

/**
 * 生成上线方案
 */
function generateGolivePlan(projectInfo) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
    
    // 格式化里程碑数据
    const milestonePhases = [
        { id: 'startup', name: '项目启动' },
        { id: 'survey', name: '调研设计' },
        { id: 'blueprint', name: '蓝图设计' },
        { id: 'build', name: '系统构建' },
        { id: 'uat', name: 'UAT测试' },
        { id: 'golive', name: '系统上线' }
    ];
    
    const milestones = milestonePhases.map((phase, i) => {
        const m = (projectInfo.milestones || []).find(m => m.id === phase.id) || {};
        return {
            phase: phase.name,
            startDate: m.startDate || '待定',
            endDate: m.endDate || '待定'
        };
    });
    
    // 获取上线阶段日期
    const goliveMilestone = milestones.find(m => m.phase === '系统上线') || { startDate: '待定', endDate: '待定' };
    
    const doc = new Document({
        title: `${projectInfo.companyName || '客户'} - 上线方案`,
        sections: [{
            properties: {},
            children: [
                new Paragraph({ text: `${projectInfo.companyName || '客户'} ERP项目上线方案`, heading: HeadingLevel.TITLE }),
                new Paragraph({ text: `版本: V1.0` }),
                new Paragraph({ text: `日期: ${new Date().toLocaleDateString('zh-CN')}` }),
                new Paragraph({ text: '', spacing: { after: 400 } }),
                
                new Paragraph({ text: '一、上线概述', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `1.1 上线目标` }),
                new Paragraph({ text: `系统正式切换上线，支持业务正常运行。` }),
                new Paragraph({ text: `1.2 上线时间` }),
                new Paragraph({ text: `计划上线日期: ${goliveMilestone.startDate}` }),
                
                new Paragraph({ text: '二、项目里程碑', heading: HeadingLevel.HEADING_1 }),
                ...milestones.map((m, i) => [
                    new Paragraph({ text: `${i + 1}. ${m.phase}: ${m.startDate} ~ ${m.endDate}` })
                ]).flat(),
                
                new Paragraph({ text: '三、上线准备', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `3.1 系统准备` }),
                new Paragraph({ text: `- 系统配置完成` }),
                new Paragraph({ text: `- UAT测试通过` }),
                new Paragraph({ text: `- 性能测试通过` }),
                new Paragraph({ text: `3.2 数据准备` }),
                new Paragraph({ text: `- 主数据导入` }),
                new Paragraph({ text: `- 期初数据导入` }),
                new Paragraph({ text: `- 历史数据迁移` }),
                new Paragraph({ text: `3.3 人员准备` }),
                new Paragraph({ text: `- 关键用户培训完成` }),
                new Paragraph({ text: `- 最终用户培训完成` }),
                
                new Paragraph({ text: '四、切换方案', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `4.1 切换时间` }),
                new Paragraph({ text: `${goliveMilestone.startDate} __:__` }),
                new Paragraph({ text: `4.2 切换步骤` }),
                new Paragraph({ text: `1. 旧系统停止使用` }),
                new Paragraph({ text: `2. 数据迁移验证` }),
                new Paragraph({ text: `3. 新系统正式启用` }),
                new Paragraph({ text: `4. 业务验证` }),
                
                new Paragraph({ text: '五、应急预案', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `5.1 回退条件` }),
                new Paragraph({ text: `- 系统无法正常运行` }),
                new Paragraph({ text: `- 数据严重错误` }),
                new Paragraph({ text: `5.2 回退步骤` }),
                new Paragraph({ text: `1. 停止新系统使用` }),
                new Paragraph({ text: `2. 恢复旧系统数据` }),
                new Paragraph({ text: `3. 启用旧系统` }),
                
                new Paragraph({ text: '六、上线支持', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `- 上线后7天驻场支持` }),
                new Paragraph({ text: `- 7x24小时技术支持热线` }),
                new Paragraph({ text: `- 问题快速响应机制` }),
                
                new Paragraph({ text: '', spacing: { before: 400 } }),
                new Paragraph({ text: '签字确认：' }),
                new Paragraph({ text: '项目经理: _________     日期: _________' }),
                new Paragraph({ text: '客户负责人: _________  日期: _________' }),
            ],
        }],
    });
    
    const filename = `${projectInfo.companyName || '客户'}_上线方案_${Date.now()}.docx`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    return Packer.toBuffer(doc).then(buffer => {
        fs.writeFileSync(filepath, buffer);
        return { success: true, filename, filepath: `/api/download?filename=${encodeURIComponent(filename)}` };
    });
}

module.exports = {
    generateSurveyQuestionnaire,
    generateSurveyMinutes,
    generateBlueprint,
    generateDevSpec,
    generateIntegrationPlan,
    generateUATPlan,
    generateGolivePlan
};
