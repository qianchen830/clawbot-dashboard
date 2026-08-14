# -*- coding: utf-8 -*-
"""
PPT提纲生成器 V1.0
生成JSON格式提纲，供网站生成PPT使用
"""

import os
import json
from datetime import datetime

# PPT提纲模板
PPT_OUTLINES = {
    "presales": {
        "name": "售前PPT提纲",
        "total_pages": 80,
        "chapters": [
            {
                "chapter": "公司介绍",
                "pages": 10,
                "sections": [
                    {"title": "公司概况", "content": ["公司简介", "发展历程", "核心数据(KPI)", "市场地位"]},
                    {"title": "发展历程", "content": ["成立时间", "重要里程碑", "转型历程", "最新成就"]},
                    {"title": "核心优势", "content": ["技术优势", "产品优势", "服务优势", "客户优势"]},
                    {"title": "市场地位", "content": ["市场份额", "行业排名", "客户数量", "荣誉资质"]},
                    {"title": "品牌价值", "content": ["品牌影响力", "行业认可", "客户口碑"]}
                ]
            },
            {
                "chapter": "产品体系",
                "pages": 10,
                "sections": [
                    {"title": "产品矩阵", "content": ["苍穹平台", "星瀚产品", "星空产品", "星辰产品"]},
                    {"title": "苍穹平台", "content": ["云原生架构", "低代码开发", "AI能力", "数据中台"]},
                    {"title": "星瀚产品", "content": ["财务管理", "供应链", "制造管理", "人力资源"]},
                    {"title": "产品选型", "content": ["选型建议", "适用场景", "投资分析"]}
                ]
            },
            {
                "chapter": "解决方案",
                "pages": 15,
                "sections": [
                    {"title": "行业方案", "content": ["制造业", "零售业", "金融业", "服务业"]},
                    {"title": "财务管理", "content": ["总账管理", "报表管理", "成本管理", "资金管理"]},
                    {"title": "供应链管理", "content": ["采购管理", "库存管理", "销售管理", "物流管理"]},
                    {"title": "生产制造", "content": ["计划管理", "生产执行", "质量管理", "设备管理"]},
                    {"title": "人力资源", "content": ["人事管理", "薪酬管理", "绩效管理", "培训管理"]}
                ]
            },
            {
                "chapter": "4A企业架构",
                "pages": 8,
                "sections": [
                    {"title": "BA业务架构", "content": ["战略层", "业务层", "流程层", "组织层"]},
                    {"title": "DA数据架构", "content": ["数据应用", "数据服务", "数据治理", "数据存储"]},
                    {"title": "AA应用架构", "content": ["核心应用", "管理应用", "决策应用", "协同应用"]},
                    {"title": "TA技术架构", "content": ["展现层", "应用层", "平台层", "基础层"]}
                ]
            },
            {
                "chapter": "实施路线",
                "pages": 10,
                "sections": [
                    {"title": "实施方法论", "content": ["七阶段方法论", "关键里程碑", "成功要素"]},
                    {"title": "实施计划", "content": ["阶段划分", "时间安排", "资源投入", "里程碑节点"]},
                    {"title": "项目团队", "content": ["组织架构", "角色分工", "沟通机制"]},
                    {"title": "风险管理", "content": ["风险识别", "应对措施", "监控机制"]}
                ]
            },
            {
                "chapter": "成功案例",
                "pages": 10,
                "sections": [
                    {"title": "行业标杆", "content": ["制造业案例", "零售业案例", "金融业案例"]},
                    {"title": "典型案例", "content": ["项目背景", "实施过程", "项目成果", "客户评价"]}
                ]
            },
            {
                "chapter": "价值工程",
                "pages": 8,
                "sections": [
                    {"title": "投资回报", "content": ["效率提升", "成本降低", "风险控制"]},
                    {"title": "业务价值", "content": ["流程优化", "数据赋能", "决策支持"]}
                ]
            },
            {
                "chapter": "服务保障",
                "pages": 9,
                "sections": [
                    {"title": "服务体系", "content": ["实施服务", "运维服务", "培训服务"]},
                    {"title": "服务承诺", "content": ["响应时间", "服务质量", "客户满意度"]}
                ]
            }
        ]
    },
    "kickoff": {
        "name": "启动会PPT提纲",
        "total_pages": 30,
        "chapters": [
            {
                "chapter": "项目背景",
                "pages": 5,
                "sections": [
                    {"title": "项目背景", "content": ["企业现状", "业务需求", "技术需求", "合规需求"]},
                    {"title": "建设目标", "content": ["业务目标", "技术目标", "管理目标"]}
                ]
            },
            {
                "chapter": "建设内容",
                "pages": 5,
                "sections": [
                    {"title": "建设范围", "content": ["财务模块", "供应链模块", "生产模块", "人力模块"]},
                    {"title": "技术架构", "content": ["系统架构", "集成方案", "部署方案"]}
                ]
            },
            {
                "chapter": "项目组织",
                "pages": 5,
                "sections": [
                    {"title": "组织架构", "content": ["领导小组", "项目组", "实施团队"]},
                    {"title": "职责分工", "content": ["甲方职责", "乙方职责", "协作机制"]}
                ]
            },
            {
                "chapter": "实施计划",
                "pages": 5,
                "sections": [
                    {"title": "实施计划", "content": ["阶段划分", "时间安排", "里程碑"]},
                    {"title": "资源计划", "content": ["人员投入", "资源需求"]}
                ]
            },
            {
                "chapter": "项目管理",
                "pages": 5,
                "sections": [
                    {"title": "管理机制", "content": ["计划管理", "会议管理", "风险管理"]},
                    {"title": "质量保障", "content": ["质量标准", "检查机制", "验收流程"]}
                ]
            },
            {
                "chapter": "成功保障",
                "pages": 5,
                "sections": [
                    {"title": "保障措施", "content": ["组织保障", "资源保障", "技术保障"]},
                    {"title": "合作承诺", "content": ["甲方承诺", "乙方承诺"]}
                ]
            }
        ]
    },
    "golive": {
        "name": "上线汇报PPT提纲",
        "total_pages": 50,
        "chapters": [
            {
                "chapter": "UAT测试",
                "pages": 10,
                "sections": [
                    {"title": "测试概况", "content": ["测试范围", "测试时间", "测试人员", "测试结果"]},
                    {"title": "测试详情", "content": ["功能测试", "性能测试", "集成测试", "用户测试"]},
                    {"title": "问题处理", "content": ["问题统计", "问题分类", "处理结果"]}
                ]
            },
            {
                "chapter": "上线准备",
                "pages": 10,
                "sections": [
                    {"title": "系统准备", "content": ["系统配置", "数据准备", "接口调试"]},
                    {"title": "人员准备", "content": ["用户培训", "操作手册", "支持团队"]},
                    {"title": "文档准备", "content": ["上线方案", "应急预案", "操作指南"]}
                ]
            },
            {
                "chapter": "上线方案",
                "pages": 10,
                "sections": [
                    {"title": "切换计划", "content": ["切换时间", "切换步骤", "时间节点"]},
                    {"title": "数据迁移", "content": ["迁移范围", "迁移步骤", "验证方法"]},
                    {"title": "应急预案", "content": ["风险识别", "应对措施", "回退方案"]}
                ]
            },
            {
                "chapter": "上线保障",
                "pages": 10,
                "sections": [
                    {"title": "组织保障", "content": ["保障团队", "值班安排", "升级机制"]},
                    {"title": "技术保障", "content": ["系统监控", "性能优化", "故障处理"]}
                ]
            },
            {
                "chapter": "后续计划",
                "pages": 10,
                "sections": [
                    {"title": "稳定运行", "content": ["监控计划", "优化计划", "支持计划"]},
                    {"title": "项目验收", "content": ["验收标准", "验收时间", "验收流程"]}
                ]
            }
        ]
    },
    "acceptance": {
        "name": "验收汇报PPT提纲",
        "total_pages": 25,
        "chapters": [
            {
                "chapter": "项目概况",
                "pages": 5,
                "sections": [
                    {"title": "项目背景", "content": ["项目目标", "实施范围", "时间周期"]},
                    {"title": "项目成果", "content": ["功能清单", "交付物清单", "关键指标"]}
                ]
            },
            {
                "chapter": "实施回顾",
                "pages": 5,
                "sections": [
                    {"title": "实施过程", "content": ["阶段回顾", "里程碑完成", "资源投入"]},
                    {"title": "问题解决", "content": ["问题统计", "解决措施", "经验总结"]}
                ]
            },
            {
                "chapter": "系统功能",
                "pages": 5,
                "sections": [
                    {"title": "功能清单", "content": ["已实现功能", "功能演示", "使用情况"]},
                    {"title": "技术指标", "content": ["性能指标", "安全指标", "可用性指标"]}
                ]
            },
            {
                "chapter": "用户评价",
                "pages": 5,
                "sections": [
                    {"title": "用户反馈", "content": ["满意度调查", "使用情况", "改进建议"]},
                    {"title": "培训效果", "content": ["培训统计", "考核结果"]}
                ]
            },
            {
                "chapter": "验收结论",
                "pages": 5,
                "sections": [
                    {"title": "验收结论", "content": ["验收结果", "遗留问题", "改进计划"]},
                    {"title": "后续支持", "content": ["运维支持", "升级计划", "服务承诺"]}
                ]
            }
        ]
    },
    "blueprint": {
        "name": "蓝图汇报PPT提纲",
        "total_pages": 40,
        "chapters": [
            {
                "chapter": "项目概况",
                "pages": 5,
                "sections": [
                    {"title": "项目背景", "content": ["业务背景", "建设目标", "项目范围"]},
                    {"title": "调研回顾", "content": ["调研过程", "调研成果", "关键发现"]}
                ]
            },
            {
                "chapter": "BA业务架构",
                "pages": 8,
                "sections": [
                    {"title": "战略规划", "content": ["企业战略", "业务目标", "KPI体系"]},
                    {"title": "业务流程", "content": ["核心流程", "支撑流程", "管理流程"]},
                    {"title": "组织架构", "content": ["组织结构", "岗位职责", "权责体系"]}
                ]
            },
            {
                "chapter": "DA数据架构",
                "pages": 8,
                "sections": [
                    {"title": "数据架构", "content": ["数据应用", "数据服务", "数据治理", "数据存储"]},
                    {"title": "主数据", "content": ["主数据标准", "主数据管理", "数据质量"]}
                ]
            },
            {
                "chapter": "AA应用架构",
                "pages": 8,
                "sections": [
                    {"title": "应用架构", "content": ["核心应用", "管理应用", "决策应用", "协同应用"]},
                    {"title": "功能清单", "content": ["功能模块", "功能描述", "实现优先级"]}
                ]
            },
            {
                "chapter": "TA技术架构",
                "pages": 6,
                "sections": [
                    {"title": "技术架构", "content": ["展现层", "应用层", "平台层", "基础层"]},
                    {"title": "集成方案", "content": ["集成架构", "接口设计", "数据交换"]}
                ]
            },
            {
                "chapter": "实施路线",
                "pages": 5,
                "sections": [
                    {"title": "实施计划", "content": ["阶段划分", "时间安排", "里程碑节点"]},
                    {"title": "资源计划", "content": ["人员需求", "资源投入"]}
                ]
            }
        ]
    }
}


def generate_outline(outline_type, company_name, project_name, **kwargs):
    """生成PPT提纲"""
    if outline_type not in PPT_OUTLINES:
        return {"success": False, "error": f"未知的提纲类型: {outline_type}"}
    
    template = PPT_OUTLINES[outline_type]
    
    outline = {
        "type": template["name"],
        "company": company_name,
        "project": project_name,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_pages": template["total_pages"],
        "outline": template["chapters"],
        "custom_data": kwargs
    }
    
    return {
        "success": True,
        "outline": outline
    }


def save_outline(outline, output_path):
    """保存提纲到文件"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(outline, f, ensure_ascii=False, indent=2)
    return output_path


if __name__ == "__main__":
    # 测试
    print("PPT提纲生成器")
    
    # 生成售前PPT提纲
    result = generate_outline("presales", "测试公司", "ERP升级项目")
    if result["success"]:
        print(f"生成成功: {result['outline']['type']}")
        print(f"总页数: {result['outline']['total_pages']}")
        print(f"章节数: {len(result['outline']['outline'])}")
