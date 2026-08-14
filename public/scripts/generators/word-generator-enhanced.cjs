/**
 * Word文档生成器增强版 - 支持页眉页脚、目录、Logo
 * 参考煤科院项目专业文档格式
 */

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, 
        AlignmentType, BorderStyle, HeadingLevel, Header, Footer, PageNumber,
        ImageRun, TableOfContents, StyleLevel } = require('docx');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
if (!fs.existsSync(OUTPUT_DIR)) { fs.mkdirSync(OUTPUT_DIR, { recursive: true }); }

// 金蝶配色方案
const COLORS = {
    primary: '1E40AF',      // 金蝶蓝
    secondary: '3B82F6',    // 浅蓝
    accent: '10B981',       // 绿色
    text: '1F2937',         // 深灰
    lightGray: 'F3F4F6',    // 浅灰
    border: 'D1D5DB'        // 边框灰
};

// 创建专业表格样式
function createProfessionalTable(headers, rows, options = {}) {
    const { columnWidths, headerColor = COLORS.primary } = options;
    const numCols = headers.length;
    
    // 计算列宽
    const totalWidth = 9000; // A4纸宽约9000 twips
    const colWidths = columnWidths || Array(numCols).fill(Math.floor(totalWidth / numCols));
    
    // 创建表头
    const headerRow = new TableRow({
        children: headers.map((header, index) => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: header, bold: true, color: 'FFFFFF', size: 22 })],
                alignment: AlignmentType.CENTER
            })],
            shading: { fill: headerColor },
            width: { size: colWidths[index], type: WidthType.DXA }
        })),
        tableHeader: true
    });
    
    // 创建数据行
    const dataRows = rows.map((row, rowIndex) => new TableRow({
        children: row.map((cell, cellIndex) => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: String(cell || ''), size: 20 })],
                alignment: cellIndex === 0 ? AlignmentType.LEFT : AlignmentType.LEFT
            })],
            shading: { fill: rowIndex % 2 === 0 ? 'FFFFFF' : COLORS.lightGray },
            width: { size: colWidths[cellIndex], type: WidthType.DXA }
        }))
    }));
    
    return new Table({
        rows: [headerRow, ...dataRows],
        width: { size: totalWidth, type: WidthType.DXA }
    });
}

// 创建变更记录表
function createChangeLogTable(changes = []) {
    const defaultChanges = [
        { date: new Date().toLocaleDateString('zh-CN'), author: '项目经理', version: 'V1.0', desc: '初始版本' }
    ];
    const changeList = changes.length > 0 ? changes : defaultChanges;
    
    return createProfessionalTable(
        ['日期', '作者', '版本', '更改说明'],
        changeList.map(c => [c.date, c.author, c.version, c.desc]),
        { columnWidths: [1500, 1500, 1000, 5000] }
    );
}

// 创建文档页眉
function createDocumentHeader(options = {}) {
    const { companyName = '客户公司', projectName = '新ERP管理系统项目', docType = '文档', logoPath } = options;
    
    const headerChildren = [];
    
    // 如果有Logo，添加Logo
    if (logoPath && fs.existsSync(logoPath)) {
        try {
            const logoBuffer = fs.readFileSync(logoPath);
            headerChildren.push(
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: logoBuffer,
                            transformation: { width: 80, height: 30 }
                        }),
                        new TextRun({ text: '    ' }),
                        new TextRun({ text: companyName, size: 20, bold: true })
                    ],
                    alignment: AlignmentType.LEFT
                })
            );
        } catch (e) {
            // Logo加载失败，使用纯文本
            headerChildren.push(
                new Paragraph({
                    children: [new TextRun({ text: companyName, size: 20, bold: true })],
                    alignment: AlignmentType.LEFT
                })
            );
        }
    } else {
        headerChildren.push(
            new Paragraph({
                children: [new TextRun({ text: companyName, size: 20, bold: true })],
                alignment: AlignmentType.LEFT
            })
        );
    }
    
    headerChildren.push(
        new Paragraph({
            children: [
                new TextRun({ text: projectName, size: 18 }),
                new TextRun({ text: ' - ' }),
                new TextRun({ text: docType, size: 18, color: COLORS.primary })
            ],
            alignment: AlignmentType.LEFT
        })
    );
    
    return new Header({
        children: headerChildren
    });
}

// 创建文档页脚
function createDocumentFooter(options = {}) {
    const { companyName = '客户公司' } = options;
    
    return new Footer({
        children: [
            new Paragraph({
                children: [
                    new TextRun({ text: companyName, size: 16, color: '666666' }),
                    new TextRun({ text: '                          ' }),
                    new TextRun({ text: '第 ', size: 16 }),
                    new TextRun({ children: [PageNumber.CURRENT], size: 16 }),
                    new TextRun({ text: ' 页 / 共 ', size: 16 }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16 }),
                    new TextRun({ text: ' 页', size: 16 })
                ],
                alignment: AlignmentType.CENTER
            })
        ]
    });
}

// 创建封面页
function createCoverPage(options = {}) {
    const { companyName = '客户公司', shortName = 'XXX', projectName = '新ERP管理系统项目', 
            docType = '文档', version = 'V1.0', date, logoPath } = options;
    
    const children = [];
    
    // 空行
    children.push(new Paragraph({ children: [], spacing: { after: 1000 } }));
    
    // Logo（如果有）
    if (logoPath && fs.existsSync(logoPath)) {
        try {
            const logoBuffer = fs.readFileSync(logoPath);
            children.push(
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: logoBuffer,
                            transformation: { width: 150, height: 60 }
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                })
            );
        } catch (e) {}
    }
    
    // 公司名称
    children.push(
        new Paragraph({
            children: [new TextRun({ text: companyName, size: 44, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        })
    );
    
    // 项目名称
    children.push(
        new Paragraph({
            children: [new TextRun({ text: projectName, size: 32, color: COLORS.primary })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );
    
    // 文档类型
    children.push(
        new Paragraph({
            children: [new TextRun({ text: docType, size: 56, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 }
        })
    );
    
    // 空行
    children.push(new Paragraph({ children: [], spacing: { after: 1000 } }));
    
    // 文档信息表
    children.push(createProfessionalTable(
        ['项目', '内容'],
        [
            ['文档编号', `${shortName}-${docType.replace(/\s+/g, '-')}-${new Date().getFullYear()}`],
            ['版本', version],
            ['编制日期', date || new Date().toLocaleDateString('zh-CN')],
            ['编制单位', '金蝶软件（中国）有限公司']
        ],
        { columnWidths: [2000, 7000], headerColor: COLORS.secondary }
    ));
    
    // 分页符
    children.push(new Paragraph({ children: [], pageBreakBefore: true }));
    
    return children;
}

// 创建目录
function createTableOfContents() {
    return [
        new Paragraph({
            children: [new TextRun({ text: '目录', size: 32, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }),
        new TableOfContents('目录', {
            hyperlink: true,
            headingStyleRange: '1-3'
        }),
        new Paragraph({ children: [], pageBreakBefore: true })
    ];
}

// 生成调研问卷
async function generateSurveyQuestionnaire(data, options = {}) {
    const { companyName = '客户公司', shortName = 'XXX', industry = '制造业', 
            enabledModules = [], logoPath } = data;
    
    const doc = new Document({
        styles: {
            paragraphStyles: [
                { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal',
                  run: { size: 32, bold: true, color: COLORS.primary },
                  paragraph: { spacing: { before: 300, after: 100 } } },
                { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal',
                  run: { size: 28, bold: true, color: COLORS.secondary },
                  paragraph: { spacing: { before: 200, after: 80 } } },
                { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal',
                  run: { size: 24, bold: true, color: COLORS.text },
                  paragraph: { spacing: { before: 150, after: 60 } } }
            ]
        },
        sections: [{
            properties: {},
            headers: {
                default: createDocumentHeader({ companyName, docType: '调研问卷', logoPath })
            },
            footers: {
                default: createDocumentFooter({ companyName })
            },
            children: [
                // 封面
                ...createCoverPage({ companyName, shortName, docType: '调研问卷', logoPath }),
                
                // 文档控制
                new Paragraph({ text: '文档控制', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '本文档为项目调研阶段工作成果，记录调研过程中收集的业务需求和信息。', spacing: { after: 200 } }),
                createChangeLogTable(),
                new Paragraph({ children: [], spacing: { after: 400 } }),
                
                // 目录
                ...createTableOfContents(),
                
                // 一、企业基本信息
                new Paragraph({ text: '一、企业基本信息', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '本部分收集企业基本概况，为后续需求分析提供背景信息。', spacing: { after: 100 } }),
                createProfessionalTable(
                    ['项目', '内容', '备注'],
                    [
                        ['企业名称', companyName, ''],
                        ['所属行业', industry, ''],
                        ['企业性质', '□国企  □民企  □外资  □合资', ''],
                        ['员工人数', '____ 人', ''],
                        ['年营业额', '□<1亿  □1-10亿  □10-50亿  □>50亿', ''],
                        ['分支机构', '____ 家分公司  ____ 家子公司', '']
                    ],
                    { columnWidths: [2500, 4500, 2000] }
                ),
                new Paragraph({ children: [], spacing: { after: 300 } }),
                
                // 二、组织架构
                new Paragraph({ text: '二、组织架构', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '请描述企业组织架构情况：', spacing: { after: 100 } }),
                createProfessionalTable(
                    ['层级', '部门/单位', '人数', '主要职责'],
                    [
                        ['集团总部', '', '', ''],
                        ['财务部', '', '', ''],
                        ['采购部', '', '', ''],
                        ['销售部', '', '', ''],
                        ['生产部', '', '', ''],
                        ['信息部', '', '', '']
                    ],
                    { columnWidths: [1500, 2500, 1500, 3500] }
                ),
                new Paragraph({ children: [], spacing: { after: 300 } }),
                
                // 三、业务模块调研
                new Paragraph({ text: '三、业务模块调研', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '根据项目实施范围，对各业务模块进行详细调研。', spacing: { after: 200 } }),
                
                // 根据启用的模块添加调研内容
                ...(enabledModules.length > 0 ? enabledModules.flatMap((module, index) => [
                    new Paragraph({ text: `3.${index + 1} ${module.name}`, heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: `本节针对${module.name}模块进行调研，了解当前业务现状、痛点及需求。`, spacing: { after: 100 } }),
                    
                    // 子系统调研
                    ...(module.subModules || []).flatMap((subModule, subIndex) => [
                        new Paragraph({ text: `3.${index + 1}.${subIndex + 1} ${subModule}`, heading: HeadingLevel.HEADING_3 }),
                        createProfessionalTable(
                            ['调研项目', '内容'],
                            [
                                ['业务现状', ''],
                                ['主要痛点', ''],
                                ['期望目标', ''],
                                ['系统需求', ''],
                                ['接口需求', ''],
                                ['其他说明', '']
                            ],
                            { columnWidths: [2500, 6500] }
                        ),
                        new Paragraph({ children: [], spacing: { after: 200 } })
                    ])
                ]) : [
                    // 默认模块
                    new Paragraph({ text: '3.1 财务管理', heading: HeadingLevel.HEADING_2 }),
                    createProfessionalTable(
                        ['调研项目', '内容'],
                        [
                            ['业务现状', ''],
                            ['主要痛点', ''],
                            ['期望目标', ''],
                            ['系统需求', '']
                        ],
                        { columnWidths: [2500, 6500] }
                    )
                ]),
                
                // 四、系统集成需求
                new Paragraph({ text: '四、系统集成需求', heading: HeadingLevel.HEADING_1 }),
                createProfessionalTable(
                    ['系统名称', '集成方式', '数据内容', '频率'],
                    [
                        ['', '', '', ''],
                        ['', '', '', ''],
                        ['', '', '', '']
                    ],
                    { columnWidths: [2000, 2000, 3000, 2000] }
                ),
                new Paragraph({ children: [], spacing: { after: 300 } }),
                
                // 五、其他需求
                new Paragraph({ text: '五、其他需求', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '请描述其他未在上述调研中涉及的需求：', spacing: { after: 100 } }),
                new Paragraph({ text: '_______________________________________________________________________', spacing: { after: 100 } }),
                new Paragraph({ text: '_______________________________________________________________________', spacing: { after: 100 } }),
                new Paragraph({ text: '_______________________________________________________________________', spacing: { after: 300 } }),
                
                // 六、调研确认
                new Paragraph({ text: '六、调研确认', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '本调研问卷已由被调研方确认，内容真实有效。', spacing: { after: 200 } }),
                createProfessionalTable(
                    ['角色', '姓名', '签字', '日期'],
                    [
                        ['被调研方负责人', '', '', ''],
                        ['调研方负责人', '', '', ''],
                        ['项目经理', '', '', '']
                    ],
                    { columnWidths: [2500, 2500, 2500, 1500] }
                )
            ]
        }]
    });
    
    const buffer = await Packer.toBuffer(doc);
    const filename = `${shortName}_调研问卷_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.docx`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    
    return { success: true, filename, filepath };
}

// 生成调研纪要
async function generateSurveyMinutes(data, options = {}) {
    const { companyName = '客户公司', shortName = 'XXX', industry = '制造业',
            enabledModules = [], surveyData = {}, logoPath } = data;
    
    const doc = new Document({
        styles: {
            paragraphStyles: [
                { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal',
                  run: { size: 32, bold: true, color: COLORS.primary },
                  paragraph: { spacing: { before: 300, after: 100 } } },
                { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal',
                  run: { size: 28, bold: true, color: COLORS.secondary },
                  paragraph: { spacing: { before: 200, after: 80 } } },
                { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal',
                  run: { size: 24, bold: true, color: COLORS.text },
                  paragraph: { spacing: { before: 150, after: 60 } } }
            ]
        },
        sections: [{
            properties: {},
            headers: {
                default: createDocumentHeader({ companyName, docType: '调研纪要', logoPath })
            },
            footers: {
                default: createDocumentFooter({ companyName })
            },
            children: [
                // 封面
                ...createCoverPage({ companyName, shortName, docType: '调研纪要', logoPath }),
                
                // 文档控制
                new Paragraph({ text: '文档控制', heading: HeadingLevel.HEADING_1 }),
                createChangeLogTable(),
                new Paragraph({ children: [], spacing: { after: 400 } }),
                
                // 目录
                ...createTableOfContents(),
                
                // 一、调研概况
                new Paragraph({ text: '一、调研概况', heading: HeadingLevel.HEADING_1 }),
                createProfessionalTable(
                    ['项目', '内容'],
                    [
                        ['调研日期', new Date().toLocaleDateString('zh-CN')],
                        ['调研单位', companyName],
                        ['所属行业', industry],
                        ['调研人员', '项目经理'],
                        ['被调研人员', '']
                    ],
                    { columnWidths: [2500, 6500] }
                ),
                new Paragraph({ children: [], spacing: { after: 300 } }),
                
                // 二、调研目的
                new Paragraph({ text: '二、调研目的', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `本次调研旨在全面了解${companyName}的业务现状、管理痛点及信息化需求，为ERP系统实施提供依据。`, spacing: { after: 200 } }),
                
                // 三、调研范围
                new Paragraph({ text: '三、调研范围', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `本次调研涵盖以下业务模块：${enabledModules.map(m => m.name).join('、') || '财务管理'}。`, spacing: { after: 200 } }),
                
                // 四、调研内容
                new Paragraph({ text: '四、调研内容', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '详细记录各模块调研情况如下：', spacing: { after: 100 } }),
                
                // 模块调研内容
                ...(enabledModules.length > 0 ? enabledModules.flatMap((module, mIndex) => [
                    new Paragraph({ text: `4.${mIndex + 1} ${module.name}`, heading: HeadingLevel.HEADING_2 }),
                    ...(module.subModules || []).flatMap((subModule, sIndex) => [
                        new Paragraph({ text: `4.${mIndex + 1}.${sIndex + 1} ${subModule}`, heading: HeadingLevel.HEADING_3 }),
                        createProfessionalTable(
                            ['项目', '内容'],
                            [
                                ['业务现状', surveyData[module.id]?.[subModule]?.status || ''],
                                ['痛点问题', surveyData[module.id]?.[subModule]?.painPoints || ''],
                                ['需求建议', surveyData[module.id]?.[subModule]?.requirements || '']
                            ],
                            { columnWidths: [2000, 7000] }
                        ),
                        new Paragraph({ children: [], spacing: { after: 150 } })
                    ])
                ]) : [
                    new Paragraph({ text: '4.1 财务管理', heading: HeadingLevel.HEADING_2 }),
                    createProfessionalTable(
                        ['项目', '内容'],
                        [['业务现状', ''], ['痛点问题', ''], ['需求建议', '']],
                        { columnWidths: [2000, 7000] }
                    )
                ]),
                
                // 五、主要问题总结
                new Paragraph({ text: '五、主要问题总结', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '1. 信息孤岛问题：各系统之间数据不互通，需要人工重复录入。', spacing: { after: 80 } }),
                new Paragraph({ text: '2. 流程效率问题：审批流程繁琐，缺乏系统支撑。', spacing: { after: 80 } }),
                new Paragraph({ text: '3. 数据分析问题：缺乏实时报表，决策支持不足。', spacing: { after: 80 } }),
                new Paragraph({ text: '4. 成本管控问题：成本核算不精细，难以准确核算。', spacing: { after: 200 } }),
                
                // 六、建议方案
                new Paragraph({ text: '六、建议方案', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `建议实施金蝶云星空系统，涵盖${enabledModules.map(m => m.name).join('、') || '财务管理'}等模块。`, spacing: { after: 200 } }),
                
                // 七、后续工作
                new Paragraph({ text: '七、后续工作安排', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: '1. 完成调研报告编制', spacing: { after: 80 } }),
                new Paragraph({ text: '2. 编制业务蓝图设计文档', spacing: { after: 80 } }),
                new Paragraph({ text: '3. 制定详细实施计划', spacing: { after: 80 } }),
                new Paragraph({ text: '4. 召开项目启动会', spacing: { after: 200 } }),
                
                // 八、签字确认
                new Paragraph({ text: '八、签字确认', heading: HeadingLevel.HEADING_1 }),
                createProfessionalTable(
                    ['部门', '姓名', '职务', '签字', '日期'],
                    [
                        ['信息部', '', '', '', ''],
                        ['财务部', '', '', '', ''],
                        ['业务部', '', '', '', '']
                    ],
                    { columnWidths: [1500, 2000, 2000, 2000, 1500] }
                )
            ]
        }]
    });
    
    const buffer = await Packer.toBuffer(doc);
    const filename = `${shortName}_调研纪要_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.docx`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    
    return { success: true, filename, filepath };
}

module.exports = {
    generateSurveyQuestionnaire,
    generateSurveyMinutes,
    createProfessionalTable,
    createChangeLogTable,
    createDocumentHeader,
    createDocumentFooter,
    createCoverPage,
    createTableOfContents,
    COLORS
};
