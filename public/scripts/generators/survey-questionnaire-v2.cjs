/**
 * 调研问卷生成器 V2 - 完全参考煤科院调研提纲格式
 * 关键格式：
 * - 封面：公司名24pt，项目名24pt，标题36pt加粗，底部16pt/15pt
 * - 文档控制：14pt标题，12pt小标题，表格
 * - 正文：问题列表，微软雅黑12pt
 */

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        WidthType, AlignmentType, HeadingLevel, BorderStyle } = require('docx');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/home/openclaw/.openclaw/workspace/output';
if (!fs.existsSync(OUTPUT_DIR)) { fs.mkdirSync(OUTPUT_DIR, { recursive: true }); }

// 调研问题库
const SURVEY_QUESTIONS = {
    '总账管理': [
        '集团企业总体财务人员有多少，具体分工如何？集团每月平均的凭证量有多少？总部人员与子公司财务人员的权限有什么管理、控制要求？',
        '目前与财务核算相关的其他业务信息系统都有哪些？这些业务系统与财务核算系统是否需要集成？集成的单据或流程有哪些？并请提供具体的单据及流程清单。',
        '是否涉及大陆、香港、国际等多核算准则的处理方面的需求？是否存在同一组织需要分别出具中国大陆及其他不同会计准则下的多种财务报告的情况？涉及哪些组织，分别需要出具哪些不同准则的会计报告？各准则下科目表、会计期间如何划分？请提供清单。',
        '如何划分会计期间，各个组织会计期间是否一致？',
        '是否采用完全一致的科目体系？对科目的管理要求如何？请提供科目表格，包括辅助账（核算项目）。请提供清单。',
        '总账凭证记账是否区分类型（如收、付、转）？凭证编码规则是否统一规范？',
        '现金流量表是如何编制的？现金流量表附表是如何形成的？现金流量发生时是在期末一次按照T型账户一次处理？还是每张凭证指定？',
        '是否有外币？期末汇兑损益如何处理？何时做期末调汇处理？汇兑损益科目、凭证日期、凭证摘要、凭证类型分别是什么？按收益、损失分开结转还是统一结转？按余额相反方向结转还是红冲结转？需要调汇的币种有哪些？是否全部币种都要调汇？需要调汇的科目有哪些？是否全部科目都要调汇？',
        '期末自动转账业务都有哪些？请提供期末自动转账凭证模板。',
        '期末待摊费用业务都有哪些？请提供期末摊销凭证模板。',
        '会计科目体系目前存在哪些问题或待优化的内容？',
        '目前账务核算凭证主要是手工编制还是系统自动产生？凭证自动化比率占比多少？',
        '自动化凭证的"单"到"凭证"是否有完整的凭证规则，如有，请提供规则文档。',
        '集团财务对核算的月结、报表报送时间是否有具体要求？',
        '集团对本次信息系统上线的期望或实现目标？'
    ],
    '应收管理': [
        '客户档案如何管理？是否有统一的客户编码规则？客户数量大约有多少？',
        '销售业务流程是怎样的？从销售订单到收款的整体流程请描述。',
        '应收账款账龄分析目前如何进行？账龄区间如何划分？',
        '收款核销流程是怎样的？是否存在预收款、定金等情况？',
        '坏账准备如何计提？计提方法和比例是什么？',
        '目前应收管理存在哪些问题和痛点？'
    ],
    '应付管理': [
        '供应商档案如何管理？是否有统一的供应商编码规则？供应商数量大约有多少？',
        '采购业务流程是怎样的？从采购申请到付款的整体流程请描述。',
        '发票校验流程是怎样的？是否实现三单匹配（订单、入库单、发票）？',
        '付款流程是怎样的？付款审批流程如何？',
        '应付账款账龄分析目前如何进行？',
        '目前应付管理存在哪些问题和痛点？'
    ],
    '固定资产': [
        '固定资产数量大约有多少？主要类别有哪些？',
        '固定资产折旧方法和政策是怎样的？',
        '资产增减变动流程是怎样的？需要哪些审批环节？',
        '资产盘点如何进行？盘点周期是多久？',
        '资产维修、转移、处置等业务如何管理？',
        '目前固定资产管理存在哪些问题和痛点？'
    ],
    '出纳管理': [
        '银行账户数量有多少？主要合作银行是哪些？',
        '日常资金收付流程是怎样的？',
        '票据管理如何进行？应收票据和应付票据的数量大约有多少？',
        '银行对账如何进行？是否需要银企直连？',
        '资金计划如何编制？资金预测的准确性如何？',
        '目前出纳管理存在哪些问题和痛点？'
    ],
    '费用报销': [
        '费用报销流程是怎样的？需要哪些审批环节？',
        '费用类型有哪些？是否有费用标准和预算控制？',
        '差旅费管理如何进行？是否有差旅标准？',
        '借款和还款流程是怎样的？',
        '目前费用报销存在哪些问题和痛点？期望实现哪些目标？'
    ],
    '全面预算': [
        '预算编制的流程是怎样的？编制周期是多久？',
        '预算编制的参与部门有哪些？各部门如何协同？',
        '预算控制如何实现？是否需要实时控制？',
        '预算调整的流程和审批权限是怎样的？',
        '预算分析和考核如何进行？',
        '目前预算管理存在哪些问题和痛点？'
    ],
    '存货核算': [
        '存货计价方法是什么？是标准成本还是实际成本？',
        '成本核算周期是怎样的？月末结账需要多长时间？',
        '成本差异如何处理？如何分摊？',
        '存货盘点如何进行？盘点周期是多久？',
        '目前存货核算存在哪些问题和痛点？'
    ],
    '税务管理': [
        '企业涉及的税种有哪些？主要税种是什么？',
        '进项税发票如何管理？是否需要发票认证？',
        '销项税发票如何开具？开票量大约有多少？',
        '纳税申报流程是怎样的？申报周期如何？',
        '目前税务管理存在哪些问题和痛点？'
    ],
    '采购管理': [
        '采购组织架构如何设置？采购人员有多少？',
        '采购申请、审批流程是怎样的？',
        '供应商管理如何进行？是否有供应商评估体系？',
        '采购订单到收货的整体流程是怎样的？',
        '目前采购管理存在哪些问题和痛点？'
    ],
    '销售管理': [
        '销售组织架构如何设置？销售人员有多少？',
        '销售报价、订单流程是怎样的？',
        '客户管理如何进行？是否有客户分级体系？',
        '信用管理如何实现？信用额度如何控制？',
        '目前销售管理存在哪些问题和痛点？'
    ],
    '库存管理': [
        '仓库设置如何？有多少个仓库？',
        '出入库流程是怎样的？需要哪些单据？',
        '库存盘点如何进行？盘点周期是多久？',
        '库存预警如何实现？安全库存如何设置？',
        '目前库存管理存在哪些问题和痛点？'
    ],
    '组织间结算': [
        '集团内部交易如何进行？有哪些类型？',
        '内部结算价格如何确定？',
        '内部结算单据和流程是怎样的？',
        '内部往来对账如何进行？',
        '目前组织间结算存在哪些问题和痛点？'
    ],
    '质量管理': [
        '质量检验流程是怎样的？检验类型有哪些？',
        '不合格品如何处理？处理流程是怎样的？',
        '质量追溯如何实现？',
        '目前质量管理存在哪些问题和痛点？'
    ],
    '合同管理': [
        '合同类型有哪些？合同数量大约有多少？',
        '合同审批流程是怎样的？',
        '合同执行如何跟踪？付款如何关联？',
        '目前合同管理存在哪些问题和痛点？'
    ]
};

// 创建简单表格
function createSimpleTable(headers, rows) {
    const totalWidth = 9000;
    const numCols = headers.length;
    const colWidth = Math.floor(totalWidth / numCols);
    
    const headerRow = new TableRow({
        children: headers.map(header => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: header, bold: true, size: 21, font: '微软雅黑' })],
                alignment: AlignmentType.CENTER
            })],
            shading: { fill: 'FFFFFF' },
            width: { size: colWidth, type: WidthType.DXA },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 }
            }
        })),
        tableHeader: true
    });
    
    const dataRows = rows.map(row => new TableRow({
        children: row.map(cell => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: String(cell || ''), size: 21, font: '微软雅黑' })]
            })],
            width: { size: colWidth, type: WidthType.DXA },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 }
            }
        }))
    }));
    
    return new Table({
        rows: [headerRow, ...dataRows],
        width: { size: totalWidth, type: WidthType.DXA }
    });
}

// 生成调研问卷
async function generateSurveyQuestionnaire(data) {
    const { companyName = '客户公司', shortName = 'XXX', industry = '制造业', 
            enabledModules = [], projectName = '新ERP管理系统项目' } = data;
    
    // 确定要生成的问题模块
    const modules = enabledModules.length > 0 
        ? enabledModules 
        : [{ name: '财务管理', subModules: ['总账管理', '应收管理', '应付管理'] }];
    
    const children = [];
    
    // ========== 封面 ==========
    children.push(new Paragraph({ children: [], spacing: { after: 300 } }));
    
    // 公司名称 - 24pt
    children.push(new Paragraph({
        children: [new TextRun({ text: companyName, size: 48, font: '微软雅黑' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
    }));
    
    // 项目名称 - 24pt
    children.push(new Paragraph({
        children: [new TextRun({ text: projectName, size: 48, font: '微软雅黑' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
    }));
    
    // 空行
    children.push(new Paragraph({ children: [], spacing: { after: 300 } }));
    
    // 文档标题 - 36pt加粗
    children.push(new Paragraph({
        children: [new TextRun({ text: '业务调研提纲', size: 72, bold: true, font: '微软雅黑' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 }
    }));
    
    // 空行
    children.push(new Paragraph({ children: [], spacing: { after: 1500 } }));
    
    // 底部信息 - 16pt
    children.push(new Paragraph({
        children: [new TextRun({ text: companyName, size: 32, font: '微软雅黑' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
    }));
    
    children.push(new Paragraph({
        children: [new TextRun({ text: '金蝶软件（中国）有限公司', size: 32, font: '微软雅黑' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
    }));
    
    // 日期 - 15pt
    children.push(new Paragraph({
        children: [new TextRun({ text: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }), size: 30, font: '微软雅黑' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
    }));
    
    // 分页
    children.push(new Paragraph({ children: [], pageBreakBefore: true }));
    
    // ========== 文档控制 ==========
    children.push(new Paragraph({
        children: [new TextRun({ text: '文档控制', size: 28, font: '微软雅黑' })],
        spacing: { after: 200 }
    }));
    
    // 更改记录 - 12pt
    children.push(new Paragraph({
        children: [new TextRun({ text: '更改记录', size: 24, font: '微软雅黑' })],
        spacing: { after: 100 }
    }));
    
    children.push(createSimpleTable(
        ['日期', '作者', '版本', '更改参考'],
        [[new Date().toLocaleDateString('zh-CN'), '项目经理', 'V1.0', '初始版本']]
    ));
    
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    
    // 审核 - 12pt
    children.push(new Paragraph({
        children: [new TextRun({ text: '审核', size: 24, font: '微软雅黑' })],
        spacing: { after: 100 }
    }));
    
    children.push(createSimpleTable(
        ['姓名', '职位', '签字'],
        [['', '', ''], ['', '', '']]
    ));
    
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    
    // 分发 - 12pt
    children.push(new Paragraph({
        children: [new TextRun({ text: '分发', size: 24, font: '微软雅黑' })],
        spacing: { after: 100 }
    }));
    
    children.push(createSimpleTable(
        ['拷贝号', '姓名', '区域'],
        [['', '', ''], ['', '', '']]
    ));
    
    children.push(new Paragraph({ children: [], pageBreakBefore: true }));
    
    // ========== 调研问题 ==========
    let moduleIndex = 0;
    
    for (const module of modules) {
        const subModules = module.subModules || module.selectedSubModules || [];
        
        for (const subModuleName of subModules) {
            moduleIndex++;
            
            // 模块标题 - Heading 2
            children.push(new Paragraph({
                text: `${subModuleName}业务调研提纲`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            }));
            
            // 获取该模块的问题
            const questions = SURVEY_QUESTIONS[subModuleName] || [
                `请描述${subModuleName}的业务现状和流程。`,
                `目前${subModuleName}存在哪些问题和痛点？`,
                `对${subModuleName}信息系统有什么期望和需求？`,
                `是否有其他需要说明的内容？`
            ];
            
            // 添加问题 - 微软雅黑12pt
            for (const question of questions) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: question, size: 24, font: '微软雅黑' })],
                    spacing: { after: 200 }
                }));
            }
            
            children.push(new Paragraph({ children: [], spacing: { after: 300 } }));
        }
    }
    
    // ========== 补充事项 ==========
    children.push(new Paragraph({
        text: '补充事项',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
    }));
    
    children.push(new Paragraph({
        children: [new TextRun({ 
            text: '是否有本提纲中未提及，还需要说明的其他问题，请列出。', 
            size: 24,
            font: '微软雅黑'
        })],
        spacing: { after: 200 }
    }));
    
    // 空行供填写
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    
    // 创建文档
    const doc = new Document({
        styles: {
            paragraphStyles: [
                { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal',
                  run: { size: 28, bold: true, font: '微软雅黑' },
                  paragraph: { spacing: { before: 300, after: 150 } } }
            ]
        },
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1440,    // 1 inch
                        bottom: 992,   // 0.69 inch
                        left: 1560,    // 1.08 inch
                        right: 1560    // 1.08 inch
                    }
                }
            },
            children: children
        }]
    });
    
    const buffer = await Packer.toBuffer(doc);
    const filename = `${shortName}_调研提纲_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.docx`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    
    return { success: true, filename, filepath };
}

module.exports = { generateSurveyQuestionnaire, SURVEY_QUESTIONS };
