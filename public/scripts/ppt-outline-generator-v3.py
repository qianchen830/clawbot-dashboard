# -*- coding: utf-8 -*-
"""
PPT提纲生成器 V3.0 - 专业版
融入金蝶产品专业知识
支持项目定制化
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

# ==================== 售前PPT提纲 V3 (150页专业版) ====================

PRESALES_OUTLINE_V3 = {
    "name": "售前PPT提纲",
    "total_pages": 150,
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
            "pages": 15,
            "sections": [
                {"title": "公司概况", "content": ["公司简介", "发展历程", "核心数据(KPI)", "市场地位"]},
                {"title": "发展历程", "content": ["1993成立", "2001上市", "2012云转型", "2018苍穹发布", "2023云收入79%"]},
                {"title": "核心优势", "content": [
                    "技术优势：云原生、AI赋能、微服务、低代码", 
                    "产品优势：苍穹PaaS、星瀚EBC、星空ERP", 
                    "服务优势：全国服务网、2000+生态伙伴、8000+专业团队",
                    "客户优势：500强客户、行业标杆、300万+用户企业"
                ]},
                {"title": "市场地位", "content": [
                    "中国企业应用软件市场占有率第一(连续19年)", 
                    "中国企业SaaS云服务市场占有率第一(连续4年)", 
                    "中国企业ERP云服务市场占有率第一(连续4年)",
                    "IDC认证、Gartner魔力象限入选"
                ]},
                {"title": "公司规模", "content": ["8000+员工", "100+分支机构", "2000+生态伙伴", "300万+用户企业"]},
                {"title": "品牌荣誉", "content": ["IDC中国市场占有率第一", "Gartner魔力象限入选", "Forrester领导者象限", "工信部云计算优秀方案"]},
                {"title": "典型客户", "content": [
                    "制造业：三一重工、美的集团、海信集团、潍柴动力",
                    "零售业：永辉超市、屈臣氏、名创优品",
                    "金融业：招商银行、太平洋保险",
                    "服务业：万科物业、新东方、华大基因"
                ]}
            ]
        },
        {
            "chapter": "产品体系",
            "pages": 15,
            "sections": [
                {"title": "产品矩阵", "content": [
                    "大企业：金蝶云·苍穹 | 金蝶云·星瀚（基于苍穹平台）",
                    "中企业：金蝶云·星空（成长型企业数字化平台）",
                    "小企业：金蝶云·星辰 | 精斗云（小微企业云服务）"
                ]},
                {"title": "苍穹平台", "content": [
                    "云原生架构：容器化部署、微服务、DevOps、高可用",
                    "低代码开发：可视化建模、表单设计、流程编排、快速开发",
                    "AI赋能：智能分析、OCR识别、智能助手、RPA机器人",
                    "数据中台：数据治理、数据服务、数据资产、数据湖"
                ]},
                {"title": "星瀚产品-财务云", "content": [
                    "集团财务：多组织账簿、集团科目体系、统一核算规则、集团报表",
                    "共享中心：共享作业、任务分配、作业监控、绩效考核",
                    "全面预算：预算编制、预算控制、预算分析、预算考核",
                    "智能合并报表：自动数据采集、自动抵销、实时合并",
                    "税务管理：业财税一体化、自动申报、税务风险预警"
                ]},
                {"title": "星瀚产品-司库云", "content": [
                    "资金管理：账户管理、资金计划、资金调度、资金监控",
                    "资金预测：现金流预测、资金缺口预测、资金预警",
                    "融资管理：融资计划、融资审批、成本优化",
                    "投资管理：投资计划、投资执行、收益分析"
                ]},
                {"title": "星瀚产品-供应链云", "content": [
                    "集团采购：集中采购、采购协同、供应商管理、采购分析",
                    "集团销售：集中销售、销售协同、客户管理、销售分析",
                    "多组织库存：跨组织调拨、库存共享、库存协同、库存优化"
                ]},
                {"title": "星瀚产品-制造云", "content": [
                    "多工厂协同：多工厂计划、工厂协同、资源共享、产能平衡",
                    "高级排程：有限产能排程、多目标优化、可视化排程",
                    "质量追溯：全流程追溯、批次追溯、序列号追溯"
                ]},
                {"title": "产品选型建议", "content": [
                    "企业规模：大型企业选择星瀚，中型企业选择星空",
                    "业务复杂度：复杂业务选择星瀚，标准业务选择星空",
                    "数据规模：大数据量选择苍穹平台",
                    "扩展需求：需要PaaS能力选择苍穹"
                ]}
            ]
        },
        {
            "chapter": "行业解决方案",
            "pages": 15,
            "sections": [
                {"title": "行业覆盖", "content": [
                    "制造业：离散制造、流程制造、装备制造、汽车制造",
                    "零售业：连锁零售、电商零售、全渠道零售",
                    "金融业：银行、保险、证券、基金",
                    "服务业：专业服务、教育、医疗、物流",
                    "建筑业：施工、房地产、基础设施"
                ]},
                {"title": "财务管理解决方案", "content": [
                    "业务流程：业务发生→凭证生成→审核记账→期末结账→报表输出",
                    "总账管理：多账簿、多币种、多会计准则、实时账务",
                    "报表管理：资产负债表、利润表、现金流量表、管理报表",
                    "成本管理：标准成本、实际成本、作业成本、成本分析",
                    "资金管理：资金计划、资金调度、资金监控、资金预测"
                ]},
                {"title": "供应链解决方案", "content": [
                    "业务流程：需求计划→采购执行→库存管理→销售配送→结算分析",
                    "采购管理：供应商管理、采购申请、采购订单、采购结算",
                    "库存管理：入库管理、出库管理、库存盘点、库存分析",
                    "销售管理：客户管理、销售订单、发货管理、销售结算"
                ]},
                {"title": "生产制造解决方案", "content": [
                    "计划管理：主生产计划、物料需求计划、产能计划",
                    "生产执行：工单管理、领料管理、报工管理、完工入库",
                    "质量管理：质检标准、质检流程、质量追溯",
                    "设备管理：设备台账、维护保养、故障管理"
                ]},
                {"title": "人力资源解决方案", "content": [
                    "人事管理：组织管理、人员档案、合同管理",
                    "薪酬管理：薪资核算、社保管理、个税管理",
                    "绩效管理：绩效目标、绩效考核、绩效分析",
                    "培训管理：培训计划、培训执行、培训评估"
                ]}
            ]
        },
        {
            "chapter": "4A企业架构",
            "pages": 10,
            "sections": [
                {"title": "BA业务架构", "content": [
                    "战略层：企业战略、业务目标、KPI体系",
                    "业务层：核心业务、支撑业务、管理业务",
                    "流程层：业务流程、审批流程、协作流程",
                    "组织层：组织架构、岗位职责、权责体系"
                ]},
                {"title": "DA数据架构", "content": [
                    "数据应用：管理驾驶舱、报表中心、数据分析",
                    "数据服务：数据接口、数据交换、数据共享",
                    "数据治理：数据标准、数据质量、数据安全",
                    "数据存储：数据库、数据仓库、数据湖"
                ]},
                {"title": "AA应用架构", "content": [
                    "核心应用：财务系统、供应链系统、生产系统",
                    "管理应用：人力资源、项目管理、资产管理",
                    "决策应用：BI分析、管理驾驶舱、预警系统",
                    "协同应用：OA办公、门户系统、移动应用"
                ]},
                {"title": "TA技术架构", "content": [
                    "展现层：Web端、移动端、大屏端",
                    "应用层：微服务、API网关、消息队列",
                    "平台层：苍穹PaaS、容器云、DevOps",
                    "基础层：云服务器、云存储、云网络"
                ]}
            ]
        },
        {
            "chapter": "价值工程",
            "pages": 12,
            "sections": [
                {"title": "价值驱动指标", "content": [
                    "财务价值：提高现金预测准确性、降低财务成本、减少应收账款天数",
                    "人力价值：降低人员流动率、提高薪资管理效率、缩短职位填补时间",
                    "销售价值：降低客户流失率、降低销售成本、缩短销售周期",
                    "采购价值：降低总采购成本、提高供应商合规性、提高采购人效",
                    "制造价值：降低总制造成本、缩短制造周期、提高准时交付",
                    "供应链价值：提高需求预测准确性、降低库存天数、降低物流成本"
                ]},
                {"title": "投资回报分析", "content": [
                    "效率提升：流程自动化提升30%、数据实时化、协作高效化",
                    "成本降低：人力成本降低20%、运营成本降低15%、管理成本降低10%",
                    "风险控制：内控合规、审计追踪、风险预警",
                    "决策支持：数据分析、预测分析、智能推荐"
                ]},
                {"title": "价值实现路径", "content": [
                    "第一阶段：基础建设(效率提升)",
                    "第二阶段：流程优化(成本降低)",
                    "第三阶段：数据赋能(决策支持)",
                    "第四阶段：智能升级(创新发展)"
                ]}
            ]
        },
        {
            "chapter": "实施路线",
            "pages": 12,
            "sections": [
                {"title": "实施方法论", "content": [
                    "七阶段方法论：项目启动→需求调研→方案设计→系统配置→用户测试→上线切换→持续优化"
                ]},
                {"title": "实施计划", "content": [
                    "第一阶段：项目启动(W1-W2)",
                    "第二阶段：需求调研(W3-W6)",
                    "第三阶段：方案设计(W7-W10)",
                    "第四阶段：系统配置(W11-W16)",
                    "第五阶段：用户测试(W17-W20)",
                    "第六阶段：上线切换(W21-W22)"
                ]},
                {"title": "项目团队", "content": [
                    "项目领导：项目指导委员会、项目管理办公室",
                    "金蝶团队：项目经理、业务顾问、技术顾问",
                    "客户团队：业务负责人、关键用户、IT支持",
                    "支持团队：开发团队、测试团队、运维团队"
                ]},
                {"title": "里程碑节点", "content": ["项目启动会", "需求确认签字", "蓝图确认签字", "系统上线", "项目验收"]},
                {"title": "风险管理", "content": [
                    "风险识别：范围风险、进度风险、质量风险、人员风险",
                    "风险应对：范围控制、进度监控、质量保证、人员备份",
                    "风险监控：周报机制、月度评审、里程碑检查"
                ]}
            ]
        },
        {
            "chapter": "成功案例",
            "pages": 15,
            "sections": [
                {"title": "行业标杆", "content": [
                    "制造业：三一重工、美的集团、海信集团、潍柴动力",
                    "零售业：永辉超市、屈臣氏、名创优品、良品铺子",
                    "金融业：招商银行、太平洋保险、华泰证券",
                    "服务业：万科物业、新东方、华大基因"
                ]},
                {"title": "典型案例1-万科集团", "content": [
                    "项目背景：大型房地产企业、多组织、多业态",
                    "实施内容：集团财务、共享中心、全面预算、智能合并报表",
                    "实施成果：50%智能审核、18000+账户在线可视、财务效率提升30%"
                ]},
                {"title": "典型案例2-海信集团", "content": [
                    "项目背景：大型制造业集团、多品牌、多组织、全球化运营",
                    "实施内容：18大能力中心、全球财务共享、智能制造",
                    "实施成果：18大能力中心、全球统一平台、业财一体化"
                ]},
                {"title": "典型案例3-制造业案例", "content": [
                    "项目背景：某大型制造企业、SAP替代项目、国产化替代",
                    "实施内容：财务+供应链+制造+人力",
                    "实施成果：12个月实施周期、100%功能替代、99.9%系统可用率"
                ]}
            ]
        },
        {
            "chapter": "服务保障",
            "pages": 10,
            "sections": [
                {"title": "服务体系", "content": [
                    "实施服务：项目实施、培训服务、数据迁移",
                    "运维服务：系统运维、安全保障、性能优化",
                    "升级服务：版本升级、功能扩展、二次开发",
                    "支持服务：7×24热线、在线客服、现场支持"
                ]},
                {"title": "服务承诺", "content": [
                    "服务热线：7×24小时",
                    "响应时间：2小时",
                    "系统可用率：99.9%",
                    "客户满意度：100%"
                ]},
                {"title": "培训体系", "content": [
                    "管理员培训：系统配置、权限管理、数据维护",
                    "关键用户培训：业务操作、流程处理、问题处理",
                    "最终用户培训：日常操作、报表查询、常见问题"
                ]}
            ]
        },
        {
            "chapter": "合作模式",
            "pages": 8,
            "sections": [
                {"title": "项目组织", "content": [
                    "联合项目组：双方共同组建",
                    "项目经理：双方各派一名",
                    "业务顾问：金蝶派出",
                    "关键用户：客户派出"
                ]},
                {"title": "沟通机制", "content": [
                    "周例会：每周一次、项目进度汇报",
                    "月度评审：每月一次、里程碑检查",
                    "问题升级：问题分级、及时升级"
                ]},
                {"title": "合作承诺", "content": [
                    "金蝶承诺：专业团队、按时交付、质量保证",
                    "客户承诺：资源保障、决策及时、配合实施"
                ]}
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
                {"title": "项目价值", "content": [
                    "业务价值：效率提升、成本降低",
                    "管理价值：流程优化、数据赋能",
                    "战略价值：数字化转型、创新升级"
                ]},
                {"title": "实施建议", "content": [
                    "分阶段实施：先核心后扩展",
                    "试点推广：先总部后分支",
                    "持续优化：持续改进、持续提升"
                ]}
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

# 简化版提纲（其他类型保持V2版本）
KICKOFF_OUTLINE = PRESALES_OUTLINE_V3  # 使用相同的定义方式简化

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


def generate_ppt_outline_v3(project_name, outline_type, company_name=None, industry=None, scale=None, modules=None, stage="01-启动阶段"):
    """生成PPT提纲V3 - 支持项目定制化"""
    
    # 根据类型选择模板
    if outline_type == "presales":
        template = PRESALES_OUTLINE_V3
    else:
        # 其他类型使用简化版
        from ppt_outline_generator_v2 import PPT_OUTLINES
        if outline_type not in PPT_OUTLINES:
            return {"success": False, "error": f"未知的提纲类型: {outline_type}"}
        template = PPT_OUTLINES[outline_type]
    
    company = company_name or project_name
    industry = industry or "制造业"
    scale = scale or "中型企业"
    modules = modules or ["财务云", "供应链云"]
    
    # 定制化内容
    outline = {
        "type": template["name"],
        "company": company,
        "project": f"{company}ERP项目",
        "industry": industry,
        "scale": scale,
        "modules": modules,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_pages": template["total_pages"],
        "chapters": template["chapters"],
        "customization": {
            "industry_specific": f"针对{industry}行业的解决方案",
            "scale_specific": f"针对{scale}的实施策略",
            "module_specific": f"实施模块：{', '.join(modules)}"
        }
    }
    
    # 保存到项目文件夹
    output_path = os.path.join(BASE_PATH, project_name, stage, "output", f"{outline_type}_outline.json")
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
    parser = argparse.ArgumentParser(description='PPT提纲生成器 V3')
    
    subparsers = parser.add_subparsers(dest='command')
    
    # 创建项目
    create_parser = subparsers.add_parser('create', help='创建项目')
    create_parser.add_argument('--project', required=True, help='项目名称')
    
    # 生成PPT提纲
    outline_parser = subparsers.add_parser('outline', help='生成PPT提纲')
    outline_parser.add_argument('--project', required=True, help='项目名称')
    outline_parser.add_argument('--type', required=True, 
                               choices=['presales', 'kickoff', 'golive', 'acceptance', 'blueprint'],
                               help='提纲类型')
    outline_parser.add_argument('--company', help='公司名称')
    outline_parser.add_argument('--industry', help='行业类型')
    outline_parser.add_argument('--scale', help='企业规模')
    outline_parser.add_argument('--modules', help='实施模块(逗号分隔)')
    outline_parser.add_argument('--stage', default='01-启动阶段', help='保存阶段')
    
    args = parser.parse_args()
    
    if args.command == 'create':
        result = create_project_structure(args.project)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == 'outline':
        modules = args.modules.split(',') if args.modules else None
        result = generate_ppt_outline_v3(
            args.project, args.type, args.company, args.industry, args.scale, modules, args.stage
        )
        print(json.dumps({
            "success": result["success"],
            "output_path": result.get("output_path"),
            "total_pages": result.get("total_pages"),
            "chapters": result.get("chapters"),
            "customization": result.get("customization")
        }, ensure_ascii=False, indent=2))
    
    else:
        parser.print_help()
