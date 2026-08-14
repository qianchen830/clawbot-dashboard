# -*- coding: utf-8 -*-
"""
Word文档生成器 V3 - 专业丰富版
融入金蝶产品专业知识
支持项目定制化输出
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

# ==================== 调研问卷模板 ====================

SURVEY_QUESTIONNAIRE = {
    "name": "调研问卷",
    "sections": [
        {
            "section": "一、企业基本信息",
            "questions": [
                {"question": "企业全称", "type": "text", "required": True},
                {"question": "企业简称", "type": "text", "required": True},
                {"question": "所属行业", "type": "select", "options": ["制造业", "零售业", "金融业", "服务业", "建筑业", "其他"], "required": True},
                {"question": "企业规模", "type": "select", "options": ["大型企业（年营收>10亿）", "中型企业（年营收1-10亿）", "小型企业（年营收<1亿）"], "required": True},
                {"question": "员工人数", "type": "text", "required": True},
                {"question": "年营业额", "type": "text", "required": True},
                {"question": "注册地址", "type": "text", "required": True},
                {"question": "主营业务", "type": "textarea", "required": True},
            ]
        },
        {
            "section": "二、组织架构",
            "questions": [
                {"question": "公司组织架构", "type": "textarea", "hint": "请描述公司的组织架构，包括主要部门及职能"},
                {"question": "分子公司情况", "type": "textarea", "hint": "请描述分子公司数量、分布及业务情况"},
                {"question": "主要部门设置", "type": "textarea", "hint": "请列出主要部门及其职能"},
                {"question": "财务部门架构", "type": "textarea", "hint": "请描述财务部门的人员配置及职责分工"},
            ]
        },
        {
            "section": "三、现有系统情况",
            "questions": [
                {"question": "当前使用的财务系统", "type": "text", "hint": "系统名称、版本、使用年限"},
                {"question": "当前使用的供应链系统", "type": "text", "hint": "系统名称、版本、使用年限"},
                {"question": "当前使用的生产系统", "type": "text", "hint": "系统名称、版本、使用年限"},
                {"question": "其他业务系统", "type": "textarea", "hint": "OA、CRM、HR等系统情况"},
                {"question": "系统集成情况", "type": "textarea", "hint": "各系统之间的集成方式及问题"},
            ]
        },
        {
            "section": "四、财务管理现状",
            "questions": [
                {"question": "总账管理现状", "type": "textarea", "hint": "科目体系、凭证处理、期末处理、报表编制"},
                {"question": "应收管理现状", "type": "textarea", "hint": "客户管理、销售开票、收款核销、账龄分析"},
                {"question": "应付管理现状", "type": "textarea", "hint": "供应商管理、采购发票、付款核销、账龄分析"},
                {"question": "成本管理现状", "type": "textarea", "hint": "成本核算方法、成本中心设置、成本分摊标准"},
                {"question": "预算管理现状", "type": "textarea", "hint": "预算编制方法、预算控制方式、预算分析"},
                {"question": "资金管理现状", "type": "textarea", "hint": "账户管理、资金计划、资金调拨"},
                {"question": "财务报表现状", "type": "textarea", "hint": "报表种类、编制周期、合并报表"},
                {"question": "财务管理痛点", "type": "textarea", "required": True, "hint": "请详细描述当前财务管理面临的主要问题和挑战"},
            ]
        },
        {
            "section": "五、供应链管理现状",
            "questions": [
                {"question": "采购管理现状", "type": "textarea", "hint": "采购流程、供应商管理、采购订单、采购结算"},
                {"question": "销售管理现状", "type": "textarea", "hint": "销售流程、客户管理、销售订单、销售结算"},
                {"question": "库存管理现状", "type": "textarea", "hint": "库存核算方法、盘点方式、库存预警"},
                {"question": "物流管理现状", "type": "textarea", "hint": "发货管理、收货管理、物流跟踪"},
                {"question": "供应链痛点", "type": "textarea", "required": True, "hint": "请详细描述当前供应链管理面临的主要问题和挑战"},
            ]
        },
        {
            "section": "六、生产制造现状",
            "questions": [
                {"question": "生产模式", "type": "select", "options": ["离散制造", "流程制造", "混合模式"]},
                {"question": "计划管理现状", "type": "textarea", "hint": "需求预测、主生产计划、物料需求计划"},
                {"question": "生产执行现状", "type": "textarea", "hint": "生产订单、车间管理、报工管理"},
                {"question": "质量管理现状", "type": "textarea", "hint": "质检标准、质检流程、质量追溯"},
                {"question": "设备管理现状", "type": "textarea", "hint": "设备台账、维护保养、故障管理"},
                {"question": "生产制造痛点", "type": "textarea", "required": True, "hint": "请详细描述当前生产制造面临的主要问题和挑战"},
            ]
        },
        {
            "section": "七、人力管理现状",
            "questions": [
                {"question": "人事管理现状", "type": "textarea", "hint": "组织管理、人员档案、合同管理"},
                {"question": "薪酬管理现状", "type": "textarea", "hint": "薪资结构、薪资核算、社保管理"},
                {"question": "绩效管理现状", "type": "textarea", "hint": "绩效考核方式、绩效指标"},
                {"question": "培训管理现状", "type": "textarea", "hint": "培训计划、培训执行"},
                {"question": "人力管理痛点", "type": "textarea", "hint": "请详细描述当前人力资源管理面临的主要问题和挑战"},
            ]
        },
        {
            "section": "八、业务流程现状",
            "questions": [
                {"question": "订单到现金流程（O2C）", "type": "textarea", "hint": "销售机会→报价→合同→订单→发货→开票→收款→凭证"},
                {"question": "采购到付款流程（P2P）", "type": "textarea", "hint": "采购申请→审批→订单→入库→发票→付款→凭证"},
                {"question": "计划到制造流程（P2M）", "type": "textarea", "hint": "需求预测→主计划→物料计划→生产订单→领料→生产→入库"},
                {"question": "记录到报告流程（R2R）", "type": "textarea", "hint": "凭证→记账→期末处理→账务核对→财务报表"},
                {"question": "业务流程痛点", "type": "textarea", "required": True, "hint": "请详细描述当前业务流程面临的主要问题和挑战"},
            ]
        },
        {
            "section": "九、信息化需求",
            "questions": [
                {"question": "本次项目目标", "type": "textarea", "required": True, "hint": "请详细描述本次项目的核心目标"},
                {"question": "期望解决的核心问题", "type": "textarea", "required": True, "hint": "请列出期望解决的核心问题，按优先级排序"},
                {"question": "期望实施的功能模块", "type": "multi_select", "options": ["总账管理", "应收管理", "应付管理", "固定资产", "现金管理", "成本管理", "预算管理", "合并报表", "采购管理", "销售管理", "库存管理", "生产计划", "车间管理", "质量管理", "设备管理", "人事管理", "薪酬管理", "绩效管理", "培训管理"], "required": True},
                {"question": "期望的项目周期", "type": "select", "options": ["3个月", "6个月", "9个月", "12个月", "18个月以上"]},
                {"question": "预算范围", "type": "text", "hint": "请提供项目预算范围"},
                {"question": "其他需求", "type": "textarea", "hint": "其他需要说明的需求"},
            ]
        },
    ]
}

# ==================== 调研报告模板 ====================

SURVEY_REPORT_TEMPLATE = {
    "name": "调研报告",
    "chapters": [
        {
            "chapter": "一、项目背景",
            "sections": [
                {"section": "1.1 项目概述", "content": [
                    "项目名称",
                    "项目背景",
                    "项目目标",
                    "项目范围",
                    "项目周期",
                ]},
                {"section": "1.2 调研说明", "content": [
                    "调研目的",
                    "调研范围",
                    "调研方法",
                    "调研时间",
                    "调研人员",
                ]},
            ]
        },
        {
            "chapter": "二、企业概况",
            "sections": [
                {"section": "2.1 企业基本情况", "content": [
                    "企业全称",
                    "所属行业",
                    "企业规模",
                    "员工人数",
                    "年营业额",
                    "注册地址",
                    "主营业务",
                ]},
                {"section": "2.2 组织架构", "content": [
                    "公司组织架构图",
                    "主要部门设置",
                    "分子公司情况",
                    "财务部门架构",
                ]},
                {"section": "2.3 业务特点", "content": [
                    "主要业务流程",
                    "业务特点",
                    "业务规模",
                    "业务发展趋势",
                ]},
            ]
        },
        {
            "chapter": "三、现状分析",
            "sections": [
                {"section": "3.1 系统现状", "content": [
                    "现有系统概况",
                    "系统使用情况",
                    "系统集成情况",
                    "系统存在问题",
                ]},
                {"section": "3.2 财务管理现状", "content": [
                    "总账管理现状",
                    "应收管理现状",
                    "应付管理现状",
                    "成本管理现状",
                    "预算管理现状",
                    "资金管理现状",
                    "财务报表现状",
                    "财务管理痛点",
                ]},
                {"section": "3.3 供应链现状", "content": [
                    "采购管理现状",
                    "销售管理现状",
                    "库存管理现状",
                    "物流管理现状",
                    "供应链痛点",
                ]},
                {"section": "3.4 生产制造现状", "content": [
                    "生产模式",
                    "计划管理现状",
                    "生产执行现状",
                    "质量管理现状",
                    "设备管理现状",
                    "生产制造痛点",
                ]},
                {"section": "3.5 人力管理现状", "content": [
                    "人事管理现状",
                    "薪酬管理现状",
                    "绩效管理现状",
                    "培训管理现状",
                    "人力管理痛点",
                ]},
            ]
        },
        {
            "chapter": "四、需求分析",
            "sections": [
                {"section": "4.1 核心需求", "content": [
                    "业务需求",
                    "管理需求",
                    "技术需求",
                    "合规需求",
                ]},
                {"section": "4.2 功能需求", "content": [
                    "财务管理功能需求",
                    "供应链管理功能需求",
                    "生产制造功能需求",
                    "人力资源管理功能需求",
                ]},
                {"section": "4.3 非功能需求", "content": [
                    "性能需求",
                    "安全需求",
                    "可用性需求",
                    "扩展性需求",
                ]},
            ]
        },
        {
            "chapter": "五、问题清单",
            "sections": [
                {"section": "5.1 问题清单", "content": [
                    "序号",
                    "问题描述",
                    "问题分类",
                    "影响程度",
                    "紧急程度",
                    "建议方案",
                    "优先级",
                ]},
            ]
        },
        {
            "chapter": "六、解决方案建议",
            "sections": [
                {"section": "6.1 总体方案", "content": [
                    "方案概述",
                    "方案架构",
                    "方案特点",
                    "方案优势",
                ]},
                {"section": "6.2 功能方案", "content": [
                    "财务管理方案",
                    "供应链方案",
                    "生产制造方案",
                    "人力管理方案",
                ]},
                {"section": "6.3 技术方案", "content": [
                    "部署方案",
                    "集成方案",
                    "安全方案",
                    "备份方案",
                ]},
            ]
        },
        {
            "chapter": "七、实施建议",
            "sections": [
                {"section": "7.1 实施策略", "content": [
                    "实施原则",
                    "实施策略",
                    "实施阶段",
                ]},
                {"section": "7.2 实施计划", "content": [
                    "项目启动",
                    "需求调研",
                    "方案设计",
                    "系统配置",
                    "用户测试",
                    "上线切换",
                ]},
                {"section": "7.3 资源需求", "content": [
                    "人员需求",
                    "设备需求",
                    "资金需求",
                ]},
            ]
        },
        {
            "chapter": "八、附录",
            "sections": [
                {"section": "8.1 调研问卷", "content": []},
                {"section": "8.2 调研记录", "content": []},
                {"section": "8.3 调研照片", "content": []},
            ]
        },
    ]
}

# ==================== 业务蓝图模板 ====================

BUSINESS_BLUEPRINT_TEMPLATE = {
    "name": "业务蓝图",
    "chapters": [
        {
            "chapter": "一、引言",
            "sections": [
                {"section": "1.1 编写目的", "content": "本文档为《{公司名称}新ERP管理系统项目》业务蓝图设计报告，旨在明确项目的业务架构、数据架构、应用架构和技术架构，为系统实施提供指导。"},
                {"section": "1.2 适用范围", "content": "本文档适用于《{公司名称}新ERP管理系统项目》的所有相关方，包括项目组、业务部门、IT部门和管理层。"},
                {"section": "1.3 参考文档", "content": [
                    "《{公司名称}新ERP管理系统项目调研报告》",
                    "《{公司名称}新ERP管理系统项目需求规格说明书》",
                    "金蝶云·星瀚产品文档",
                ]},
            ]
        },
        {
            "chapter": "二、业务现状分析",
            "sections": [
                {"section": "2.1 组织架构", "content": [
                    "部门设置",
                    "岗位设置",
                    "人员配置",
                ]},
                {"section": "2.2 业务流程现状", "content": [
                    "订单到现金流程现状",
                    "采购到付款流程现状",
                    "计划到制造流程现状",
                    "记录到报告流程现状",
                ]},
                {"section": "2.3 业务痛点", "content": [
                    "财务管理痛点",
                    "供应链管理痛点",
                    "生产制造痛点",
                    "人力资源管理痛点",
                ]},
            ]
        },
        {
            "chapter": "三、BA业务架构",
            "sections": [
                {"section": "3.1 战略规划", "content": [
                    "企业战略目标",
                    "业务发展目标",
                    "KPI指标体系",
                ]},
                {"section": "3.2 业务能力", "content": [
                    "核心业务能力",
                    "支撑业务能力",
                    "管理业务能力",
                ]},
                {"section": "3.3 业务流程", "content": [
                    "订单到现金流程（O2C）",
                    "采购到付款流程（P2P）",
                    "计划到制造流程（P2M）",
                    "记录到报告流程（R2R）",
                ]},
                {"section": "3.4 组织架构", "content": [
                    "组织结构设计",
                    "岗位职责设计",
                    "权责体系设计",
                ]},
            ]
        },
        {
            "chapter": "四、DA数据架构",
            "sections": [
                {"section": "4.1 数据架构设计", "content": [
                    "数据应用架构",
                    "数据服务架构",
                    "数据治理架构",
                    "数据存储架构",
                ]},
                {"section": "4.2 主数据管理", "content": [
                    "物料主数据",
                    "客户主数据",
                    "供应商主数据",
                    "人员主数据",
                    "会计科目主数据",
                ]},
                {"section": "4.3 数据标准", "content": [
                    "编码规则标准",
                    "属性标准",
                    "数据质量标准",
                ]},
            ]
        },
        {
            "chapter": "五、AA应用架构",
            "sections": [
                {"section": "5.1 应用架构设计", "content": [
                    "核心应用",
                    "管理应用",
                    "决策应用",
                    "协同应用",
                ]},
                {"section": "5.2 功能清单", "content": [
                    "财务管理功能清单",
                    "供应链管理功能清单",
                    "生产制造功能清单",
                    "人力资源管理功能清单",
                ]},
                {"section": "5.3 集成方案", "content": [
                    "集成架构",
                    "接口设计",
                    "数据交换",
                ]},
            ]
        },
        {
            "chapter": "六、TA技术架构",
            "sections": [
                {"section": "6.1 技术架构设计", "content": [
                    "展现层",
                    "应用层",
                    "平台层",
                    "基础层",
                ]},
                {"section": "6.2 部署方案", "content": [
                    "部署架构",
                    "高可用方案",
                    "容灾方案",
                ]},
                {"section": "6.3 安全方案", "content": [
                    "网络安全",
                    "应用安全",
                    "数据安全",
                ]},
            ]
        },
        {
            "chapter": "七、实施路线",
            "sections": [
                {"section": "7.1 实施计划", "content": [
                    "项目启动",
                    "需求调研",
                    "蓝图设计",
                    "系统配置",
                    "用户测试",
                    "上线切换",
                ]},
                {"section": "7.2 资源计划", "content": [
                    "人员需求",
                    "资金预算",
                    "设备需求",
                ]},
            ]
        },
    ]
}

# ==================== UAT测试方案模板 ====================

UAT_TEST_PLAN_TEMPLATE = {
    "name": "UAT测试方案",
    "chapters": [
        {
            "chapter": "一、测试概述",
            "sections": [
                {"section": "1.1 测试目的", "content": "验证系统功能是否满足业务需求，确保系统可以正常上线运行。"},
                {"section": "1.2 测试范围", "content": [
                    "财务管理模块",
                    "供应链管理模块",
                    "生产制造模块",
                    "人力资源管理模块",
                ]},
                {"section": "1.3 测试环境", "content": [
                    "测试服务器",
                    "测试数据库",
                    "测试客户端",
                    "测试数据",
                ]},
                {"section": "1.4 测试时间", "content": "测试开始时间、测试结束时间、总测试周期"},
            ]
        },
        {
            "chapter": "二、测试组织",
            "sections": [
                {"section": "2.1 测试团队", "content": [
                    "测试负责人",
                    "业务测试人员",
                    "技术支持人员",
                ]},
                {"section": "2.2 职责分工", "content": [
                    "测试负责人职责",
                    "业务测试人员职责",
                    "技术支持人员职责",
                ]},
            ]
        },
        {
            "chapter": "三、测试用例",
            "sections": [
                {"section": "3.1 财务管理测试用例", "test_cases": [
                    {"id": "FIN-001", "name": "总账-凭证录入", "steps": "1.登录系统\n2.进入总账模块\n3.录入凭证\n4.保存凭证\n5.审核凭证", "expected": "凭证成功录入并审核"},
                    {"id": "FIN-002", "name": "总账-期末结账", "steps": "1.检查所有凭证已审核\n2.执行期末结账\n3.检查余额表", "expected": "期末结账成功"},
                    {"id": "FIN-003", "name": "应收-销售开票", "steps": "1.创建销售发票\n2.录入发票信息\n3.审核发票\n4.生成凭证", "expected": "发票成功生成凭证"},
                    {"id": "FIN-004", "name": "应付-采购发票", "steps": "1.创建采购发票\n2.录入发票信息\n3.审核发票\n4.生成凭证", "expected": "发票成功生成凭证"},
                ]},
                {"section": "3.2 供应链管理测试用例", "test_cases": [
                    {"id": "SCM-001", "name": "采购-采购订单", "steps": "1.创建采购申请\n2.审核采购申请\n3.创建采购订单\n4.审核采购订单", "expected": "采购订单成功创建"},
                    {"id": "SCM-002", "name": "库存-入库管理", "steps": "1.创建入库单\n2.录入入库明细\n3.审核入库单\n4.检查库存", "expected": "库存成功增加"},
                    {"id": "SCM-003", "name": "销售-销售订单", "steps": "1.创建销售订单\n2.录入订单明细\n3.审核销售订单\n4.检查库存预留", "expected": "订单成功创建"},
                ]},
                {"section": "3.3 生产制造测试用例", "test_cases": [
                    {"id": "MFG-001", "name": "计划-主生产计划", "steps": "1.创建主生产计划\n2.录入计划数据\n3.运行MRP\n4.检查计划结果", "expected": "MRP成功运行"},
                    {"id": "MFG-002", "name": "生产-工单管理", "steps": "1.创建生产工单\n2.审核工单\n3.领料\n4.报工\n5.入库", "expected": "工单成功完成"},
                ]},
            ]
        },
        {
            "chapter": "四、测试执行",
            "sections": [
                {"section": "4.1 测试准备", "content": [
                    "测试环境准备",
                    "测试数据准备",
                    "测试账号准备",
                ]},
                {"section": "4.2 测试执行", "content": [
                    "测试执行流程",
                    "问题记录",
                    "问题跟踪",
                ]},
                {"section": "4.3 测试报告", "content": [
                    "测试覆盖率",
                    "问题统计",
                    "测试结论",
                ]},
            ]
        },
        {
            "chapter": "五、问题管理",
            "sections": [
                {"section": "5.1 问题分类", "content": [
                    "严重问题：影响系统正常运行",
                    "重要问题：影响业务功能",
                    "一般问题：不影响主要功能",
                    "建议问题：优化建议",
                ]},
                {"section": "5.2 问题处理流程", "content": [
                    "问题登记",
                    "问题分析",
                    "问题修复",
                    "问题验证",
                ]},
            ]
        },
    ]
}

# ==================== Word生成函数 ====================

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
    
    return {"success": True, "path": project_path, "stages": [s[0] for s in STAGES]}


def generate_survey_questionnaire(project_name, stage="02-调研阶段"):
    """生成调研问卷"""
    output_path = os.path.join(BASE_PATH, project_name, stage, "output", "调研问卷.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    questionnaire = {
        "type": "调研问卷",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "sections": SURVEY_QUESTIONNAIRE["sections"]
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(questionnaire, f, ensure_ascii=False, indent=2)
    
    return {"success": True, "output_path": output_path, "sections": len(SURVEY_QUESTIONNAIRE["sections"])}


def generate_survey_report_outline(project_name, stage="02-调研阶段"):
    """生成调研报告提纲"""
    output_path = os.path.join(BASE_PATH, project_name, stage, "output", "调研报告提纲.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    outline = {
        "type": "调研报告提纲",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "chapters": SURVEY_REPORT_TEMPLATE["chapters"]
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(outline, f, ensure_ascii=False, indent=2)
    
    return {"success": True, "output_path": output_path, "chapters": len(SURVEY_REPORT_TEMPLATE["chapters"])}


def generate_blueprint_outline(project_name, stage="03-蓝图阶段"):
    """生成业务蓝图提纲"""
    output_path = os.path.join(BASE_PATH, project_name, stage, "output", "业务蓝图提纲.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    outline = {
        "type": "业务蓝图提纲",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "chapters": BUSINESS_BLUEPRINT_TEMPLATE["chapters"]
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(outline, f, ensure_ascii=False, indent=2)
    
    return {"success": True, "output_path": output_path, "chapters": len(BUSINESS_BLUEPRINT_TEMPLATE["chapters"])}


def generate_uat_plan_outline(project_name, stage="05-测试阶段"):
    """生成UAT测试方案提纲"""
    output_path = os.path.join(BASE_PATH, project_name, stage, "output", "UAT测试方案提纲.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    outline = {
        "type": "UAT测试方案提纲",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "chapters": UAT_TEST_PLAN_TEMPLATE["chapters"]
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(outline, f, ensure_ascii=False, indent=2)
    
    return {"success": True, "output_path": output_path, "chapters": len(UAT_TEST_PLAN_TEMPLATE["chapters"])}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Word文档生成器 V3')
    
    subparsers = parser.add_subparsers(dest='command')
    
    # 创建项目
    create_parser = subparsers.add_parser('create', help='创建项目')
    create_parser.add_argument('--project', required=True, help='项目名称')
    
    # 生成调研问卷
    survey_q_parser = subparsers.add_parser('survey-q', help='生成调研问卷')
    survey_q_parser.add_argument('--project', required=True, help='项目名称')
    survey_q_parser.add_argument('--stage', default='02-调研阶段', help='保存阶段')
    
    # 生成调研报告提纲
    survey_r_parser = subparsers.add_parser('survey-r', help='生成调研报告提纲')
    survey_r_parser.add_argument('--project', required=True, help='项目名称')
    survey_r_parser.add_argument('--stage', default='02-调研阶段', help='保存阶段')
    
    # 生成蓝图提纲
    blueprint_parser = subparsers.add_parser('blueprint', help='生成业务蓝图提纲')
    blueprint_parser.add_argument('--project', required=True, help='项目名称')
    blueprint_parser.add_argument('--stage', default='03-蓝图阶段', help='保存阶段')
    
    # 生成UAT提纲
    uat_parser = subparsers.add_parser('uat', help='生成UAT测试方案提纲')
    uat_parser.add_argument('--project', required=True, help='项目名称')
    uat_parser.add_argument('--stage', default='05-测试阶段', help='保存阶段')
    
    args = parser.parse_args()
    
    if args.command == 'create':
        result = create_project_structure(args.project)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == 'survey-q':
        result = generate_survey_questionnaire(args.project, args.stage)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == 'survey-r':
        result = generate_survey_report_outline(args.project, args.stage)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == 'blueprint':
        result = generate_blueprint_outline(args.project, args.stage)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == 'uat':
        result = generate_uat_plan_outline(args.project, args.stage)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    else:
        parser.print_help()
