# -*- coding: utf-8 -*-
"""
项目交付工具 V2.0
整合PPT提纲生成和Word文档生成
单个文件版本，避免导入问题
"""

import os
import sys
import json
import argparse
from datetime import datetime

# ==================== 配置 ====================

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

# ==================== PPT提纲模板 ====================

PPT_OUTLINES = {
    "presales": {
        "name": "售前PPT提纲",
        "total_pages": 80,
        "chapters": [
            {"chapter": "公司介绍", "pages": 10, "sections": [
                {"title": "公司概况", "content": ["公司简介", "发展历程", "核心数据", "市场地位"]},
                {"title": "发展历程", "content": ["成立时间", "重要里程碑", "转型历程"]},
                {"title": "核心优势", "content": ["技术优势", "产品优势", "服务优势"]},
                {"title": "市场地位", "content": ["市场份额", "行业排名", "客户数量"]}
            ]},
            {"chapter": "产品体系", "pages": 10, "sections": [
                {"title": "产品矩阵", "content": ["苍穹平台", "星瀚产品", "星空产品"]},
                {"title": "核心功能", "content": ["财务", "供应链", "制造", "人力"]}
            ]},
            {"chapter": "解决方案", "pages": 15, "sections": [
                {"title": "行业方案", "content": ["制造业", "零售业", "金融业"]},
                {"title": "核心模块", "content": ["财务", "供应链", "制造"]}
            ]},
            {"chapter": "4A架构", "pages": 8, "sections": [
                {"title": "BA业务架构", "content": ["战略层", "业务层", "流程层"]},
                {"title": "DA数据架构", "content": ["数据应用", "数据服务", "数据治理"]},
                {"title": "AA应用架构", "content": ["核心应用", "管理应用", "决策应用"]},
                {"title": "TA技术架构", "content": ["展现层", "应用层", "平台层"]}
            ]},
            {"chapter": "实施路线", "pages": 10, "sections": [
                {"title": "方法论", "content": ["七阶段方法论", "关键里程碑"]},
                {"title": "实施计划", "content": ["阶段划分", "时间安排"]},
                {"title": "项目团队", "content": ["组织架构", "角色分工"]}
            ]},
            {"chapter": "成功案例", "pages": 10, "sections": [
                {"title": "行业标杆", "content": ["制造业案例", "零售业案例"]},
                {"title": "典型案例", "content": ["项目背景", "实施过程", "项目成果"]}
            ]},
            {"chapter": "价值工程", "pages": 8, "sections": [
                {"title": "投资回报", "content": ["效率提升", "成本降低"]},
                {"title": "业务价值", "content": ["流程优化", "数据赋能"]}
            ]},
            {"chapter": "服务保障", "pages": 9, "sections": [
                {"title": "服务体系", "content": ["实施服务", "运维服务"]},
                {"title": "服务承诺", "content": ["响应时间", "服务质量"]}
            ]}
        ]
    },
    "kickoff": {
        "name": "启动会PPT提纲",
        "total_pages": 30,
        "chapters": [
            {"chapter": "项目背景", "pages": 5, "sections": [
                {"title": "项目背景", "content": ["企业现状", "业务需求", "建设目标"]},
                {"title": "建设目标", "content": ["业务目标", "技术目标"]}
            ]},
            {"chapter": "建设内容", "pages": 5, "sections": [
                {"title": "建设范围", "content": ["财务模块", "供应链模块", "生产模块"]},
                {"title": "技术架构", "content": ["系统架构", "集成方案"]}
            ]},
            {"chapter": "项目组织", "pages": 5, "sections": [
                {"title": "组织架构", "content": ["领导小组", "项目组", "实施团队"]},
                {"title": "职责分工", "content": ["甲方职责", "乙方职责"]}
            ]},
            {"chapter": "实施计划", "pages": 5, "sections": [
                {"title": "实施计划", "content": ["阶段划分", "时间安排"]},
                {"title": "资源计划", "content": ["人员投入", "资源需求"]}
            ]},
            {"chapter": "项目管理", "pages": 5, "sections": [
                {"title": "管理机制", "content": ["计划管理", "会议管理", "风险管理"]},
                {"title": "质量保障", "content": ["质量标准", "检查机制"]}
            ]},
            {"chapter": "成功保障", "pages": 5, "sections": [
                {"title": "保障措施", "content": ["组织保障", "资源保障", "技术保障"]},
                {"title": "合作承诺", "content": ["甲方承诺", "乙方承诺"]}
            ]}
        ]
    },
    "golive": {
        "name": "上线汇报PPT提纲",
        "total_pages": 50,
        "chapters": [
            {"chapter": "UAT测试", "pages": 10, "sections": [
                {"title": "测试概况", "content": ["测试范围", "测试结果"]},
                {"title": "测试详情", "content": ["功能测试", "性能测试"]},
                {"title": "问题处理", "content": ["问题统计", "处理结果"]}
            ]},
            {"chapter": "上线准备", "pages": 10, "sections": [
                {"title": "系统准备", "content": ["系统配置", "数据准备"]},
                {"title": "人员准备", "content": ["用户培训", "支持团队"]},
                {"title": "文档准备", "content": ["上线方案", "应急预案"]}
            ]},
            {"chapter": "上线方案", "pages": 10, "sections": [
                {"title": "切换计划", "content": ["切换时间", "切换步骤"]},
                {"title": "数据迁移", "content": ["迁移范围", "迁移步骤"]},
                {"title": "应急预案", "content": ["风险识别", "应对措施"]}
            ]},
            {"chapter": "上线保障", "pages": 10, "sections": [
                {"title": "组织保障", "content": ["保障团队", "值班安排"]},
                {"title": "技术保障", "content": ["系统监控", "故障处理"]}
            ]},
            {"chapter": "后续计划", "pages": 10, "sections": [
                {"title": "稳定运行", "content": ["监控计划", "优化计划"]},
                {"title": "项目验收", "content": ["验收标准", "验收流程"]}
            ]}
        ]
    },
    "acceptance": {
        "name": "验收汇报PPT提纲",
        "total_pages": 25,
        "chapters": [
            {"chapter": "项目概况", "pages": 5, "sections": [
                {"title": "项目背景", "content": ["项目目标", "实施范围"]},
                {"title": "项目成果", "content": ["功能清单", "交付物清单"]}
            ]},
            {"chapter": "实施回顾", "pages": 5, "sections": [
                {"title": "实施过程", "content": ["阶段回顾", "里程碑完成"]},
                {"title": "问题解决", "content": ["问题统计", "解决措施"]}
            ]},
            {"chapter": "系统功能", "pages": 5, "sections": [
                {"title": "功能清单", "content": ["已实现功能", "功能演示"]},
                {"title": "技术指标", "content": ["性能指标", "安全指标"]}
            ]},
            {"chapter": "用户评价", "pages": 5, "sections": [
                {"title": "用户反馈", "content": ["满意度调查", "使用情况"]},
                {"title": "培训效果", "content": ["培训统计", "考核结果"]}
            ]},
            {"chapter": "验收结论", "pages": 5, "sections": [
                {"title": "验收结论", "content": ["验收结果", "遗留问题"]},
                {"title": "后续支持", "content": ["运维支持", "服务承诺"]}
            ]}
        ]
    },
    "blueprint": {
        "name": "蓝图汇报PPT提纲",
        "total_pages": 40,
        "chapters": [
            {"chapter": "项目概况", "pages": 5, "sections": [
                {"title": "项目背景", "content": ["业务背景", "建设目标"]},
                {"title": "调研回顾", "content": ["调研过程", "调研成果"]}
            ]},
            {"chapter": "BA业务架构", "pages": 8, "sections": [
                {"title": "战略规划", "content": ["企业战略", "业务目标"]},
                {"title": "业务流程", "content": ["核心流程", "支撑流程"]},
                {"title": "组织架构", "content": ["组织结构", "岗位职责"]}
            ]},
            {"chapter": "DA数据架构", "pages": 8, "sections": [
                {"title": "数据架构", "content": ["数据应用", "数据服务"]},
                {"title": "主数据", "content": ["主数据标准", "数据质量"]}
            ]},
            {"chapter": "AA应用架构", "pages": 8, "sections": [
                {"title": "应用架构", "content": ["核心应用", "管理应用"]},
                {"title": "功能清单", "content": ["功能模块", "实现优先级"]}
            ]},
            {"chapter": "TA技术架构", "pages": 6, "sections": [
                {"title": "技术架构", "content": ["展现层", "应用层", "基础层"]},
                {"title": "集成方案", "content": ["集成架构", "接口设计"]}
            ]},
            {"chapter": "实施路线", "pages": 5, "sections": [
                {"title": "实施计划", "content": ["阶段划分", "时间安排"]},
                {"title": "资源计划", "content": ["人员需求", "资源投入"]}
            ]}
        ]
    }
}

# ==================== 功能函数 ====================

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

def generate_ppt_outline(project_name, outline_type, output_stage="01-启动阶段"):
    """生成PPT提纲"""
    if outline_type not in PPT_OUTLINES:
        return {"success": False, "error": f"未知的提纲类型: {outline_type}"}
    
    template = PPT_OUTLINES[outline_type]
    
    outline = {
        "type": template["name"],
        "company": project_name,
        "project": f"{project_name}ERP项目",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_pages": template["total_pages"],
        "outline": template["chapters"]
    }
    
    # 保存到项目文件夹
    output_path = os.path.join(
        BASE_PATH,
        project_name,
        output_stage,
        "output",
        f"{outline_type}_outline.json"
    )
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(outline, f, ensure_ascii=False, indent=2)
    
    return {
        "success": True,
        "outline": outline,
        "output_path": output_path
    }

# ==================== 主程序 ====================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='项目交付工具 V2.0')
    
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
    outline_parser.add_argument('--stage', default='01-启动阶段', help='保存阶段')
    
    args = parser.parse_args()
    
    if args.command == 'create':
        result = create_project_structure(args.project)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == 'outline':
        result = generate_ppt_outline(args.project, args.type, args.stage)
        output = {
            "success": result["success"],
            "output_path": result.get("output_path"),
            "total_pages": result["outline"].get("total_pages"),
            "chapters": len(result["outline"].get("outline", []))
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
    
    else:
        parser.print_help()
