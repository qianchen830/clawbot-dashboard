# -*- coding: utf-8 -*-
"""
PPT提纲生成器 V2.0 - 丰富版
基于金蝶知识中心和参考文档
"""

import os
import sys
import json
import argparse
from datetime import datetime

BASE_PATH = "/mnt/d/KINGDEESYS" if os.path.exists("/mnt/d") else "D:/KINGDEESYS"

STAGES = [
    ("01-启动阶段", ["启动会PPT提纲.json", "启动会纪要.docx"]),
    ("02-调研阶段", ["调研问卷.docx", "调研报告.docx", "调研PPT提纲.json"]),
    ("03-蓝图阶段", ["业务蓝图.docx", "蓝图PPT提纲.json"]),
    ("04-开发阶段", ["开发说明书.docx"]),
    ("05-测试阶段", ["UAT测试方案.docx", "UAT测试报告.docx"]),
    ("06-上线阶段", ["上线方案.docx", "上线PPT提纲.json"]),
    ("07-验收阶段", ["验收报告.docx", "验收PPT提纲.json"]),
]

# ==================== 售前PPT提纲 (100+页) ====================

PRESALES_OUTLINE = {
    "name": "售前PPT提纲",
    "total_pages": 120,
    "chapters": [
        {
            "chapter": "开篇",
            "pages": 5,
            "sections": [
                {"title": "封面", "content": ["客户名称", "项目名称", "汇报单位", "汇报日期"]},
                {"title": "目录", "content": ["章节导航"]},
                {"title": "团队介绍", "content": ["项目团队", "核心顾问", "技术专家"]}
            ]
        },
        {
            "chapter": "公司介绍",
            "pages": 12,
            "sections": [
                {"title": "公司概况", "content": ["公司简介", "发展历程", "核心数据(KPI)", "市场地位"]},
                {"title": "发展历程", "content": ["1993成立", "2001上市", "2012云转型", "2018苍穹发布", "2023云收入79%"]},
                {"title": "核心优势", "content": ["技术优势：云原生、AI赋能、微服务", "产品优势：苍穹PaaS、星瀚EBC、星空ERP", "服务优势：全国服务网、生态伙伴、专业团队", "客户优势：500强客户、行业标杆、成功经验"]},
                {"title": "市场地位", "content": ["中国企业应用软件市场占有率第一(连续19年)", "中国企业SaaS云服务市场占有率第一(连续4年)", "中国企业ERP云服务市场占有率第一(连续4年)"]},
                {"title": "公司规模", "content": ["8000+员工", "100+分支机构", "2000+生态伙伴", "300万+用户企业"]},
                {"title": "品牌荣誉", "content": ["IDC中国市场占有率第一", "Gartner魔力象限入选", "Forrester领导者象限", "工信部云计算优秀方案"]}
            ]
        },
        {
            "chapter": "产品体系",
            "pages": 12,
            "sections": [
                {"title": "产品矩阵", "content": ["大企业：金蝶云·苍穹 | 金蝶云·星瀚", "中企业：金蝶云·星空", "小企业：金蝶云·星辰 | 精斗云"]},
                {"title": "苍穹平台", "content": ["云原生架构：容器化部署、微服务、DevOps", "低代码开发：可视化建模、表单设计、流程编排", "AI赋能：智能分析、OCR识别、智能助手", "数据中台：数据治理、数据服务、数据资产"]},
                {"title": "星瀚产品", "content": ["财务管理：总账、报表、资金、成本、税务", "供应链管理：采购、销售、库存、物流", "生产制造：计划、生产、质量、设备", "人力资本：人事、薪酬、绩效、培训", "项目管理：立项、预算、执行、结算"]},
                {"title": "星空产品", "content": ["财务云：总账、报表、出纳", "供应链云：采购、销售、库存", "制造云：计划、生产、质量", "全渠道云：电商、零售、分销"]},
                {"title": "产品选型建议", "content": ["企业规模：大型企业选择星瀚，中型企业选择星空", "业务复杂度：复杂业务选择星瀚", "数据规模：大数据量选择苍穹平台", "扩展需求：需要PaaS能力选择苍穹"]}
            ]
        },
        {
            "chapter": "行业解决方案",
            "pages": 15,
            "sections": [
                {"title": "行业覆盖", "content": ["制造业：离散制造、流程制造、装备制造", "零售业：连锁零售、电商零售、全渠道", "金融业：银行、保险、证券", "服务业：专业服务、教育、医疗", "建筑业：施工、房地产、基础设施"]},
                {"title": "财务管理解决方案", "content": ["业务流程：业务发生→凭证生成→审核记账→期末结账→报表输出", "核心功能：总账管理(多账簿、多币种、多会计准则)", "报表管理：资产负债表、利润表、现金流量表", "成本管理：标准成本、实际成本、作业成本", "资金管理：资金计划、资金调拨、资金分析"]},
                {"title": "供应链管理解决方案", "content": ["业务流程：需求计划→采购执行→库存管理→销售配送→结算分析", "采购管理：供应商管理、采购申请、采购订单、采购结算", "库存管理：入库管理、出库管理、库存盘点、库存分析", "销售管理：客户管理、销售订单、发货管理、销售结算"]},
                {"title": "生产制造解决方案", "content": ["计划管理：主生产计划、物料需求计划、产能计划", "生产执行：工单管理、领料管理、报工管理、完工入库", "质量管理：质检标准、质检流程、质量追溯", "设备管理：设备台账、维护保养、故障管理"]},
                {"title": "人力资源管理解决方案", "content": ["人事管理：组织管理、人员档案、合同管理", "薪酬管理：薪资核算、社保管理、个税管理", "绩效管理：绩效目标、绩效考核、绩效分析", "培训管理：培训计划、培训执行、培训评估"]}
            ]
        },
        {
            "chapter": "4A企业架构",
            "pages": 10,
            "sections": [
                {"title": "BA业务架构", "content": ["战略层：企业战略、业务目标、KPI体系", "业务层：核心业务、支撑业务、管理业务", "流程层：业务流程、审批流程、协作流程", "组织层：组织架构、岗位职责、权责体系"]},
                {"title": "DA数据架构", "content": ["数据应用：管理驾驶舱、报表中心、数据分析", "数据服务：数据接口、数据交换、数据共享", "数据治理：数据标准、数据质量、数据安全", "数据存储：数据库、数据仓库、数据湖"]},
                {"title": "AA应用架构", "content": ["核心应用：财务系统、供应链系统、生产系统", "管理应用：人力资源、项目管理、资产管理", "决策应用：BI分析、管理驾驶舱、预警系统", "协同应用：OA办公、门户系统、移动应用"]},
                {"title": "TA技术架构", "content": ["展现层：Web端、移动端、大屏端", "应用层：微服务、API网关、消息队列", "平台层：苍穹PaaS、容器云、DevOps", "基础层：云服务器、云存储、云网络"]}
            ]
        },
        {
            "chapter": "价值工程",
            "pages": 10,
            "sections": [
                {"title": "投资回报分析", "content": ["效率提升：30%", "成本降低：20%", "决策加速：50%", "投资回收期：3年"]},
                {"title": "业务价值", "content": ["效率提升：流程自动化、数据实时化、协作高效化", "成本降低：人力成本、运营成本、管理成本", "风险控制：内控合规、审计追踪、风险预警", "决策支持：数据分析、预测分析、智能推荐"]},
                {"title": "价值实现路径", "content": ["第一阶段：基础建设(效率提升)", "第二阶段：流程优化(成本降低)", "第三阶段：数据赋能(决策支持)", "第四阶段：智能升级(创新发展)"]}
            ]
        },
        {
            "chapter": "实施路线",
            "pages": 12,
            "sections": [
                {"title": "实施方法论", "content": ["七阶段方法论：项目启动→需求调研→方案设计→系统配置→用户测试→上线切换→持续优化"]},
                {"title": "实施计划", "content": ["第一阶段：项目启动(W1-W2)", "第二阶段：需求调研(W3-W6)", "第三阶段：方案设计(W7-W10)", "第四阶段：系统配置(W11-W16)", "第五阶段：用户测试(W17-W20)", "第六阶段：上线切换(W21-W22)"]},
                {"title": "项目团队", "content": ["项目领导：项目指导委员会、项目管理办公室", "金蝶团队：项目经理、业务顾问、技术顾问", "客户团队：业务负责人、关键用户、IT支持", "支持团队：开发团队、测试团队、运维团队"]},
                {"title": "里程碑节点", "content": ["项目启动会", "需求确认签字", "蓝图确认签字", "系统上线", "项目验收"]},
                {"title": "风险管理", "content": ["风险识别：范围风险、进度风险、质量风险、人员风险", "风险应对：范围控制、进度监控、质量保证、人员备份", "风险监控：周报机制、月度评审、里程碑检查"]}
            ]
        },
        {
            "chapter": "成功案例",
            "pages": 15,
            "sections": [
                {"title": "行业标杆", "content": ["制造业：三一重工、美的集团、海信集团、潍柴动力", "零售业：永辉超市、屈臣氏、名创优品、良品铺子", "金融业：招商银行、太平洋保险、华泰证券", "服务业：万科物业、新东方、华大基因"]},
                {"title": "典型案例1", "content": ["客户：某大型制造企业", "项目：SAP替代项目", "周期：12个月", "成果：100%功能替代、99.9%系统可用率"]},
                {"title": "典型案例2", "content": ["客户：某零售连锁企业", "项目：全渠道数字化转型", "周期：8个月", "成果：库存周转率提升30%、销售效率提升40%"]},
                {"title": "典型案例3", "content": ["客户：某金融服务企业", "项目：财务共享中心", "周期：6个月", "成果：财务效率提升50%、成本降低30%"]}
            ]
        },
        {
            "chapter": "服务保障",
            "pages": 10,
            "sections": [
                {"title": "服务体系", "content": ["实施服务：项目实施、培训服务、数据迁移", "运维服务：系统运维、安全保障、性能优化", "升级服务：版本升级、功能扩展、二次开发", "支持服务：7×24热线、在线客服、现场支持"]},
                {"title": "服务承诺", "content": ["服务热线：7×24小时", "响应时间：2小时", "系统可用率：99.9%", "客户满意度：100%"]},
                {"title": "培训体系", "content": ["管理员培训：系统配置、权限管理、数据维护", "关键用户培训：业务操作、流程处理、问题处理", "最终用户培训：日常操作、报表查询、常见问题"]}
            ]
        },
        {
            "chapter": "合作模式",
            "pages": 8,
            "sections": [
                {"title": "项目组织", "content": ["联合项目组：双方共同组建", "项目经理：双方各派一名", "业务顾问：金蝶派出", "关键用户：客户派出"]},
                {"title": "沟通机制", "content": ["周例会：每周一次，项目进度汇报", "月度评审：每月一次，里程碑检查", "问题升级：问题分级，及时升级"]},
                {"title": "合作承诺", "content": ["金蝶承诺：专业团队、按时交付、质量保证", "客户承诺：资源保障、决策及时、配合实施"]}
            ]
        },
        {
            "chapter": "报价方案",
            "pages": 8,
            "sections": [
                {"title": "软件费用", "content": ["产品许可费", "用户数费用", "模块费用"]},
                {"title": "实施费用", "content": ["项目实施费", "培训费用", "数据迁移费"]},
                {"title": "年服务费", "content": ["软件维护费", "技术支持费", "升级服务费"]},
                {"title": "投资分析", "content": ["总投资额", "投资回报率", "回收周期"]}
            ]
        },
        {
            "chapter": "总结与建议",
            "pages": 5,
            "sections": [
                {"title": "项目价值", "content": ["业务价值：效率提升、成本降低", "管理价值：流程优化、数据赋能", "战略价值：数字化转型、创新升级"]},
                {"title": "实施建议", "content": ["分阶段实施：先核心后扩展", "试点推广：先总部后分支", "持续优化：持续改进、持续提升"]}
            ]
        },
        {
            "chapter": "附录",
            "pages": 8,
            "sections": [
                {"title": "公司资质", "content": ["营业执照", "软件企业证书", "ISO认证证书", "CMMI认证"]},
                {"title": "产品证书", "content": ["软件产品证书", "著作权证书", "检测报告"]},
                {"title": "案例证明", "content": ["客户推荐信", "项目验收证明"]}
            ]
        }
    ]
}

# ==================== 启动会PPT提纲 (40页) ====================

KICKOFF_OUTLINE = {
    "name": "启动会PPT提纲",
    "total_pages": 40,
    "chapters": [
        {
            "chapter": "会议开场",
            "pages": 3,
            "sections": [
                {"title": "会议议程", "content": ["开场致辞", "项目背景", "建设内容", "项目组织", "实施计划", "管理机制", "成功保障"]},
                {"title": "参会人员", "content": ["甲方领导", "甲方项目组", "金蝶项目组", "相关部门负责人"]}
            ]
        },
        {
            "chapter": "项目背景",
            "pages": 5,
            "sections": [
                {"title": "企业现状", "content": ["业务现状", "系统现状", "管理现状", "痛点分析"]},
                {"title": "建设背景", "content": ["政策驱动", "业务需求", "技术发展", "管理升级"]},
                {"title": "建设目标", "content": ["业务目标：效率提升30%", "技术目标：系统整合、数据统一", "管理目标：流程标准化、决策智能化"]},
                {"title": "项目范围", "content": ["一期范围：财务+供应链", "二期范围：生产+人力", "三期范围：全面扩展"]}
            ]
        },
        {
            "chapter": "建设内容",
            "pages": 8,
            "sections": [
                {"title": "总体架构", "content": ["业务架构：核心业务流程", "数据架构：数据标准与治理", "应用架构：功能模块规划", "技术架构：技术平台选型"]},
                {"title": "功能模块", "content": ["财务管理：总账、应收、应付、固定资产、现金管理", "供应链管理：采购、销售、库存、物流", "生产制造：计划、生产、质量、设备", "人力资本：人事、薪酬、绩效、培训"]},
                {"title": "集成方案", "content": ["OA集成", "CRM集成", "MES集成", "WMS集成"]},
                {"title": "技术平台", "content": ["金蝶云·星瀚", "部署方式", "安全方案"]}
            ]
        },
        {
            "chapter": "项目组织",
            "pages": 5,
            "sections": [
                {"title": "组织架构", "content": ["项目指导委员会", "项目管理办公室(PMO)", "业务组", "技术组", "数据组"]},
                {"title": "角色分工", "content": ["项目经理：项目总负责", "业务顾问：业务方案设计", "技术顾问：技术方案设计", "关键用户：业务需求确认"]},
                {"title": "沟通机制", "content": ["周例会：每周一次", "月度评审：每月一次", "问题升级：及时上报"]}
            ]
        },
        {
            "chapter": "实施计划",
            "pages": 8,
            "sections": [
                {"title": "总体计划", "content": ["项目周期：6个月", "实施阶段：6个阶段", "里程碑：5个关键节点"]},
                {"title": "阶段计划", "content": ["第一阶段：项目启动(W1-W2)", "第二阶段：需求调研(W3-W6)", "第三阶段：方案设计(W7-W10)", "第四阶段：系统配置(W11-W16)", "第五阶段：用户测试(W17-W20)", "第六阶段：上线切换(W21-W22)"]},
                {"title": "里程碑节点", "content": ["项目启动会", "需求确认签字", "蓝图确认签字", "系统上线", "项目验收"]},
                {"title": "资源计划", "content": ["人员投入：甲方10人、金蝶8人", "设备需求：服务器、网络", "场地需求：会议室、培训室"]}
            ]
        },
        {
            "chapter": "管理机制",
            "pages": 5,
            "sections": [
                {"title": "计划管理", "content": ["计划制定：WBS分解", "计划执行：每日站会", "计划监控：进度跟踪", "计划调整：变更控制"]},
                {"title": "质量管理", "content": ["质量标准：验收标准", "质量检查：阶段评审", "质量改进：问题闭环"]},
                {"title": "风险管理", "content": ["风险识别：范围、进度、质量、人员", "风险应对：规避、转移、减轻、接受", "风险监控：风险登记册"]},
                {"title": "文档管理", "content": ["文档标准：模板规范", "版本控制：Git管理", "归档管理：知识库"]}
            ]
        },
        {
            "chapter": "成功保障",
            "pages": 3,
            "sections": [
                {"title": "组织保障", "content": ["领导重视", "资源保障", "决策及时"]},
                {"title": "技术保障", "content": ["专业团队", "成熟方案", "工具支持"]},
                {"title": "方法保障", "content": ["方法论指导", "最佳实践", "经验传承"]}
            ]
        },
        {
            "chapter": "下一步工作",
            "pages": 3,
            "sections": [
                {"title": "近期工作", "content": ["成立项目组", "召开启动会", "开始调研"]},
                {"title": "需要支持", "content": ["人员到位", "资料准备", "场地安排"]}
            ]
        }
    ]
}

# ==================== 上线汇报PPT提纲 (60页) ====================

GOLIVE_OUTLINE = {
    "name": "上线汇报PPT提纲",
    "total_pages": 60,
    "chapters": [
        {
            "chapter": "项目回顾",
            "pages": 5,
            "sections": [
                {"title": "项目概况", "content": ["项目背景", "项目范围", "项目周期", "项目团队"]},
                {"title": "实施历程", "content": ["项目启动", "需求调研", "方案设计", "系统配置", "用户测试"]}
            ]
        },
        {
            "chapter": "UAT测试总结",
            "pages": 10,
            "sections": [
                {"title": "测试概况", "content": ["测试时间", "测试范围", "测试人员", "测试环境"]},
                {"title": "测试范围", "content": ["功能测试", "性能测试", "集成测试", "用户测试"]},
                {"title": "测试结果", "content": ["测试用例数", "通过率", "问题数", "遗留问题"]},
                {"title": "问题处理", "content": ["问题分类", "问题原因", "解决措施", "解决结果"]},
                {"title": "测试结论", "content": ["系统功能满足需求", "系统性能符合预期", "具备上线条件"]}
            ]
        },
        {
            "chapter": "上线准备情况",
            "pages": 10,
            "sections": [
                {"title": "系统准备", "content": ["系统配置完成", "数据迁移完成", "接口调试完成", "安全测试通过"]},
                {"title": "人员准备", "content": ["用户培训完成", "操作手册发布", "支持团队到位", "应急预案制定"]},
                {"title": "数据准备", "content": ["基础数据导入", "期初数据录入", "历史数据迁移", "数据校验通过"]},
                {"title": "文档准备", "content": ["上线方案", "应急预案", "操作手册", "培训教材"]}
            ]
        },
        {
            "chapter": "上线切换方案",
            "pages": 10,
            "sections": [
                {"title": "切换策略", "content": ["直接切换", "并行切换", "分批切换", "选择依据"]},
                {"title": "切换时间表", "content": ["T-3天：数据备份", "T-2天：系统冻结", "T-1天：数据迁移", "T日：系统上线", "T+1天：业务验证"]},
                {"title": "数据迁移方案", "content": ["迁移范围", "迁移步骤", "数据校验", "应急预案"]},
                {"title": "切换检查清单", "content": ["系统检查", "数据检查", "人员检查", "文档检查"]}
            ]
        },
        {
            "chapter": "应急预案",
            "pages": 8,
            "sections": [
                {"title": "风险识别", "content": ["系统故障", "数据异常", "用户问题", "业务中断"]},
                {"title": "应急响应", "content": ["响应流程", "响应时间", "响应人员", "响应措施"]},
                {"title": "回退方案", "content": ["回退条件", "回退步骤", "回退验证"]},
                {"title": "应急演练", "content": ["演练计划", "演练记录", "演练总结"]}
            ]
        },
        {
            "chapter": "上线保障措施",
            "pages": 8,
            "sections": [
                {"title": "组织保障", "content": ["上线保障小组", "值班安排", "升级机制"]},
                {"title": "技术保障", "content": ["系统监控", "性能优化", "故障处理"]},
                {"title": "业务保障", "content": ["关键用户支持", "问题快速响应", "业务连续性保障"]}
            ]
        },
        {
            "chapter": "后续工作计划",
            "pages": 5,
            "sections": [
                {"title": "稳定运行期", "content": ["系统监控", "问题处理", "性能优化"]},
                {"title": "验收准备", "content": ["验收标准确认", "验收材料准备", "验收会议安排"]}
            ]
        }
    ]
}

# ==================== 验收汇报PPT提纲 (30页) ====================

ACCEPTANCE_OUTLINE = {
    "name": "验收汇报PPT提纲",
    "total_pages": 30,
    "chapters": [
        {
            "chapter": "项目概况",
            "pages": 5,
            "sections": [
                {"title": "项目背景", "content": ["建设背景", "项目目标", "实施范围", "时间周期"]},
                {"title": "项目成果", "content": ["功能清单", "交付物清单", "关键指标达成"]}
            ]
        },
        {
            "chapter": "实施回顾",
            "pages": 5,
            "sections": [
                {"title": "实施过程", "content": ["项目启动", "需求调研", "方案设计", "系统配置", "用户测试", "上线运行"]},
                {"title": "里程碑完成", "content": ["启动会", "需求确认", "蓝图签字", "系统上线", "验收准备"]}
            ]
        },
        {
            "chapter": "系统功能",
            "pages": 5,
            "sections": [
                {"title": "功能清单", "content": ["财务模块", "供应链模块", "生产模块", "人力模块"]},
                {"title": "技术指标", "content": ["系统可用性", "响应时间", "并发用户数", "数据处理量"]}
            ]
        },
        {
            "chapter": "应用效果",
            "pages": 5,
            "sections": [
                {"title": "业务效果", "content": ["流程效率提升", "数据准确性提高", "管理效率提升"]},
                {"title": "用户反馈", "content": ["满意度调查", "使用情况", "改进建议"]}
            ]
        },
        {
            "chapter": "验收结论",
            "pages": 5,
            "sections": [
                {"title": "验收结论", "content": ["项目目标达成", "系统功能满足", "验收通过"]},
                {"title": "遗留问题", "content": ["问题清单", "解决计划"]},
                {"title": "后续支持", "content": ["运维支持", "版本升级", "持续优化"]}
            ]
        }
    ]
}

# ==================== 蓝图汇报PPT提纲 (50页) ====================

BLUEPRINT_OUTLINE = {
    "name": "蓝图汇报PPT提纲",
    "total_pages": 50,
    "chapters": [
        {
            "chapter": "项目概况",
            "pages": 5,
            "sections": [
                {"title": "项目背景", "content": ["企业现状", "业务痛点", "建设目标", "项目范围"]},
                {"title": "调研回顾", "content": ["调研过程", "调研方法", "调研成果", "关键发现"]}
            ]
        },
        {
            "chapter": "BA业务架构",
            "pages": 10,
            "sections": [
                {"title": "战略规划", "content": ["企业战略", "业务目标", "KPI体系"]},
                {"title": "业务能力", "content": ["核心能力", "支撑能力", "管理能力"]},
                {"title": "业务流程", "content": ["核心流程：采购到付款、订单到收款、需求到生产", "支撑流程：人力资源、财务管理、资产管理", "管理流程：战略管理、运营管理、风险管理"]},
                {"title": "组织架构", "content": ["组织结构", "岗位职责", "权责体系"]}
            ]
        },
        {
            "chapter": "DA数据架构",
            "pages": 10,
            "sections": [
                {"title": "数据架构", "content": ["数据应用：管理驾驶舱、报表中心、数据分析", "数据服务：数据接口、数据交换、数据共享", "数据治理：数据标准、数据质量、数据安全", "数据存储：数据库、数据仓库、数据湖"]},
                {"title": "主数据管理", "content": ["物料主数据", "客户主数据", "供应商主数据", "人员主数据"]},
                {"title": "数据标准", "content": ["编码规则", "属性标准", "数据质量"]}
            ]
        },
        {
            "chapter": "AA应用架构",
            "pages": 10,
            "sections": [
                {"title": "应用架构", "content": ["核心应用：财务、供应链、生产", "管理应用：人力、项目、资产", "决策应用：BI、驾驶舱、预警", "协同应用：OA、门户、移动"]},
                {"title": "功能清单", "content": ["财务模块功能清单", "供应链模块功能清单", "生产模块功能清单", "人力模块功能清单"]},
                {"title": "集成方案", "content": ["OA集成方案", "CRM集成方案", "MES集成方案"]}
            ]
        },
        {
            "chapter": "TA技术架构",
            "pages": 8,
            "sections": [
                {"title": "技术架构", "content": ["展现层：Web端、移动端", "应用层：微服务、API网关", "平台层：苍穹PaaS、容器云", "基础层：云服务器、云存储"]},
                {"title": "部署方案", "content": ["部署架构", "高可用方案", "容灾方案"]},
                {"title": "安全方案", "content": ["网络安全", "应用安全", "数据安全"]}
            ]
        },
        {
            "chapter": "实施路线",
            "pages": 7,
            "sections": [
                {"title": "实施计划", "content": ["第一阶段：项目启动", "第二阶段：需求调研", "第三阶段：蓝图设计", "第四阶段：系统配置", "第五阶段：用户测试", "第六阶段：上线运行"]},
                {"title": "资源计划", "content": ["人员投入", "资金预算", "设备需求"]}
            ]
        }
    ]
}

# ==================== 提纲类型映射 ====================

PPT_OUTLINES = {
    "presales": PRESALES_OUTLINE,
    "kickoff": KICKOFF_OUTLINE,
    "golive": GOLIVE_OUTLINE,
    "acceptance": ACCEPTANCE_OUTLINE,
    "blueprint": BLUEPRINT_OUTLINE,
}


def create_project_structure(project_name):
    """创建项目文件夹结构"""
    project_path = os.path.join(BASE_PATH, project_name)
    
    if os.path.exists(project_path):
        return {"success": False, "error": f"项目 {project_name} 已存在"}
    
    os.makedirs(project_path, exist_ok=True)
    
    for stage_name, _ in STAGES:
        stage_path = os.path.join(project_path, stage_name)
        os.makedirs(os.path.join(stage_path, "input"), exist_ok=True)
        os.makedirs(os.path.join(stage_path, "output"), exist_ok=True)
    
    os.makedirs(os.path.join(project_path, "input"), exist_ok=True)
    
    return {
        "success": True,
        "path": project_path,
        "stages": [s[0] for s in STAGES]
    }


def generate_ppt_outline(project_name, outline_type, company_name=None, stage="01-启动阶段"):
    """生成PPT提纲"""
    if outline_type not in PPT_OUTLINES:
        return {"success": False, "error": f"未知的提纲类型: {outline_type}"}
    
    template = PPT_OUTLINES[outline_type]
    company = company_name or project_name
    
    # 替换项目信息
    outline = {
        "type": template["name"],
        "company": company,
        "project": f"{company}ERP项目",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_pages": template["total_pages"],
        "chapters": template["chapters"],
        "customization_tips": [
            "请根据实际项目情况修改以下内容：",
            "1. 公司名称、项目名称",
            "2. 实施模块范围",
            "3. 项目时间节点",
            "4. 团队人员配置",
            "5. 成功案例选择",
            "6. 报价金额"
        ]
    }
    
    # 保存到项目文件夹
    output_path = os.path.join(
        BASE_PATH,
        project_name,
        stage,
        "output",
        f"{outline_type}_outline.json"
    )
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(outline, f, ensure_ascii=False, indent=2)
    
    return {
        "success": True,
        "outline": outline,
        "output_path": output_path,
        "total_pages": template["total_pages"],
        "chapters": len(template["chapters"])
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='PPT提纲生成器 V2.0')
    
    subparsers = parser.add_subparsers(dest='command', help='子命令')
    
    # 创建项目
    create_parser = subparsers.add_parser('create', help='创建项目')
    create_parser.add_argument('--project', required=True, help='项目名称')
    
    # 生成PPT提纲
    outline_parser = subparsers.add_parser('outline', help='生成PPT提纲')
    outline_parser.add_argument('--project', required=True, help='项目名称')
    outline_parser.add_argument('--type', required=True, 
                               choices=['presales', 'kickoff', 'golive', 'acceptance', 'blueprint'],
                               help='提纲类型')
    outline_parser.add_argument('--company', help='公司名称（可选）')
    outline_parser.add_argument('--stage', default='01-启动阶段', help='保存阶段')
    
    args = parser.parse_args()
    
    if args.command == 'create':
        result = create_project_structure(args.project)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == 'outline':
        result = generate_ppt_outline(args.project, args.type, args.company, args.stage)
        print(json.dumps({
            "success": result["success"],
            "output_path": result.get("output_path"),
            "total_pages": result.get("total_pages"),
            "chapters": result.get("chapters")
        }, ensure_ascii=False, indent=2))
    
    else:
        parser.print_help()
