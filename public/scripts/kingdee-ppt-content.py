#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
金蝶PPT生成器 - 智能内容模块 v1.0
提供智能内容生成、行业匹配、企业规模适配功能
"""

import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime

# 导入公共模块
from kingdee_ppt_common import INDUSTRY_CASES, get_industry_case


class ContentGenerator:
    """智能内容生成器"""
    
    def __init__(self, customer_info: Dict[str, Any]):
        """
        初始化内容生成器
        
        Args:
            customer_info: 客户信息字典
        """
        self.customer_info = customer_info
        self.company_name = customer_info.get('companyName', '企业名称')
        self.industry = customer_info.get('industry', '制造业')
        self.company_size = customer_info.get('companySize', '中型企业')
        self.employees = customer_info.get('employees', '500')
        self.revenue = customer_info.get('revenue', '10000')
        
        # 获取行业案例
        self.industry_case = get_industry_case(self.industry)
    
    def generate_presales_content(self) -> Dict[str, Any]:
        """
        生成售前PPT内容
        
        Returns:
            包含所有幻灯片内容的字典
        """
        return {
            "cover": self._generate_cover_content(),
            "overview": self._generate_overview_content(),
            "pain_points": self._generate_pain_points_content(),
            "solutions": self._generate_solutions_content(),
            "architecture": self._generate_architecture_content(),
            "value": self._generate_value_content(),
            "roadmap": self._generate_roadmap_content(),
            "cases": self._generate_cases_content(),
            "team": self._generate_team_content(),
        }
    
    def generate_golive_content(self) -> Dict[str, Any]:
        """
        生成上线汇报PPT内容
        
        Returns:
            包含所有幻灯片内容的字典
        """
        return {
            "cover": self._generate_golive_cover(),
            "overview": self._generate_golive_overview(),
            "background": self._generate_golive_background(),
            "process": self._generate_golive_process(),
            "scope": self._generate_golive_scope(),
            "value": self._generate_golive_value(),
            "results": self._generate_golive_results(),
            "summary": self._generate_golive_summary(),
        }
    
    def generate_acceptance_content(self) -> Dict[str, Any]:
        """
        生成验收汇报PPT内容
        
        Returns:
            包含所有幻灯片内容的字典
        """
        return {
            "cover": self._generate_acceptance_cover(),
            "overview": self._generate_acceptance_overview(),
            "standards": self._generate_acceptance_standards(),
            "results": self._generate_acceptance_results(),
            "conclusion": self._generate_acceptance_conclusion(),
            "future": self._generate_acceptance_future(),
        }
    
    def _generate_cover_content(self) -> Dict[str, Any]:
        """生成封面内容"""
        return {
            "title": f"{self.company_name}",
            "subtitle": "数字化转型解决方案",
            "company": "金蝶软件（中国）有限公司",
            "date": datetime.now().strftime('%Y年%m月'),
        }
    
    def _generate_overview_content(self) -> Dict[str, Any]:
        """生成企业概况内容"""
        return {
            "title": "企业概况",
            "items": [
                f"企业名称：{self.company_name}",
                f"所属行业：{self.industry}",
                f"企业规模：{self.company_size}",
                f"员工人数：{self.employees}人",
                f"年营业额：{self.revenue}万元",
                "",
                "### 组织架构：",
                "- 集团总部：战略决策、财务管理、人力资源",
                "- 业务部门：采购、销售、生产、仓储",
                "- 支持部门：IT、行政、法务",
            ]
        }
    
    def _generate_pain_points_content(self) -> Dict[str, Any]:
        """生成痛点分析内容（基于行业智能匹配）"""
        pain_points = self.industry_case.get('pain_points', [])
        
        # 根据企业规模调整痛点
        if self.company_size == "大型企业":
            scale_factor = "规模大、管理复杂"
        elif self.company_size == "小型企业":
            scale_factor = "资源有限、专业化不足"
        else:
            scale_factor = "快速发展、管控压力大"
        
        return {
            "title": "业务痛点分析",
            "left_title": "当前痛点",
            "left_items": [f"- {p}" for p in pain_points],
            "right_title": "影响分析",
            "right_items": [
                "- 运营成本高：人力成本、运营成本居高不下",
                "- 市场响应慢：订单交付周期长，客户满意度低",
                "- 管理风险大：财务风险、运营风险难以控制",
                f"- 发展受限：{scale_factor}，难以支撑业务扩张",
            ]
        }
    
    def _generate_solutions_content(self) -> Dict[str, Any]:
        """生成解决方案内容（基于行业智能匹配）"""
        solutions = self.industry_case.get('solutions', [])
        
        # 根据企业规模调整方案深度
        if self.company_size == "大型企业":
            modules = ["财务云（全模块）", "供应链云（全模块）", "制造云（全模块）", "人力云（全模块）", "平台云"]
        elif self.company_size == "小型企业":
            modules = ["财务云（核心模块）", "供应链云（核心模块）", "人力云（基础模块）"]
        else:
            modules = ["财务云", "供应链云", "制造云", "人力云"]
        
        return {
            "title": "解决方案设计",
            "items": [
                "### 实施范围：",
            ] + [f"- {m}" for m in modules] + [
                "",
                "### 解决方案：",
            ] + [f"- {s}" for s in solutions],
        }
    
    def _generate_architecture_content(self) -> Dict[str, Any]:
        """生成架构设计内容"""
        return {
            "title": "4A企业架构设计",
            "layers": [
                {
                    "name": "业务架构（BA）",
                    "components": ["价值流", "业务能力", "业务流程", "业务对象"],
                    "color": "RGBColor(0, 82, 147)"
                },
                {
                    "name": "数据架构（DA）",
                    "components": ["主数据", "业务数据", "分析数据", "数据治理"],
                    "color": "RGBColor(0, 112, 192)"
                },
                {
                    "name": "应用架构（AA）",
                    "components": ["财务云", "供应链云", "制造云", "人力云"],
                    "color": "RGBColor(255, 153, 0)"
                },
                {
                    "name": "技术架构（TA）",
                    "components": ["云原生架构", "微服务", "DevOps", "安全体系"],
                    "color": "RGBColor(0, 176, 80)"
                }
            ]
        }
    
    def _generate_value_content(self) -> Dict[str, Any]:
        """生成价值工程内容（基于行业智能匹配）"""
        benefits = self.industry_case.get('benefits', [])
        
        return {
            "title": "价值工程分析",
            "items": [
                "### 预期收益：",
            ] + [f"- {b}" for b in benefits] + [
                "",
                "### 实施策略：",
                "- 分期实施：一期核心模块，二期扩展模块",
                "- 分批上线：总部先行，分步推广到分子公司",
                "- 试点推广：典型单位试点，总结经验后推广",
                "- 并行过渡：新旧系统并行，平稳过渡切换",
            ]
        }
    
    def _generate_roadmap_content(self) -> Dict[str, Any]:
        """生成实施路线图内容"""
        # 根据企业规模调整实施周期
        if self.company_size == "大型企业":
            phases = [
                {"name": "项目启动", "time": "第1-2月", "work": "需求调研\n蓝图设计"},
                {"name": "系统实施", "time": "第3-10月", "work": "系统配置\n数据迁移"},
                {"name": "测试培训", "time": "第11-14月", "work": "系统测试\n用户培训"},
                {"name": "上线支持", "time": "第15-18月", "work": "系统上线\n运维支持"},
                {"name": "验收优化", "time": "第19-24月", "work": "项目验收\n持续优化"},
            ]
        elif self.company_size == "小型企业":
            phases = [
                {"name": "项目启动", "time": "第1周", "work": "需求调研\n蓝图设计"},
                {"name": "系统实施", "time": "第2-6周", "work": "系统配置\n数据迁移"},
                {"name": "测试培训", "time": "第7-8周", "work": "系统测试\n用户培训"},
                {"name": "上线支持", "time": "第9-12周", "work": "系统上线\n运维支持"},
            ]
        else:
            phases = [
                {"name": "项目启动", "time": "第1-2周", "work": "需求调研\n蓝图设计"},
                {"name": "系统实施", "time": "第3-14周", "work": "系统配置\n数据迁移"},
                {"name": "测试培训", "time": "第15-18周", "work": "系统测试\n用户培训"},
                {"name": "上线支持", "time": "第19-20周", "work": "系统上线\n运维支持"},
            ]
        
        return {
            "title": "项目实施路线图",
            "phases": phases
        }
    
    def _generate_cases_content(self) -> Dict[str, Any]:
        """生成成功案例内容（基于行业智能匹配）"""
        typical_customer = self.industry_case.get('typical_customer', {})
        
        return {
            "title": "成功案例",
            "items": [
                f"### 客户名称：{typical_customer.get('name', '某企业')}",
                f"- 企业规模：{typical_customer.get('scale', '')}",
                f"- 实施模块：{typical_customer.get('modules', '')}",
                f"- 实施周期：{typical_customer.get('duration', '')}",
                "",
                "### 项目成果：",
            ] + [f"- {r}" for r in typical_customer.get('results', [])]
        }
    
    def _generate_team_content(self) -> Dict[str, Any]:
        """生成项目团队内容"""
        return {
            "title": "项目团队配置",
            "left_title": "核心团队",
            "left_items": [
                "- 项目总监：项目总负责、资源协调",
                "- 项目经理：项目管理、进度控制",
                "- 业务顾问：业务设计、方案落地",
                "- 技术顾问：技术架构、系统配置",
                "- 开发工程师：接口开发、报表开发",
                "- 测试工程师：系统测试、问题跟踪",
            ],
            "right_title": "服务保障",
            "right_items": [
                "- 7×24小时技术支持热线",
                "- 远程支持：在线问题处理",
                "- 现场支持：关键节点现场服务",
                "- 定期回访：项目回访、持续优化",
                "- 知识转移：用户培训、技术文档",
                "- 版本升级：产品升级、功能增强",
            ]
        }
    
    def _generate_golive_cover(self) -> Dict[str, Any]:
        """生成上线汇报封面"""
        golive_date = self.customer_info.get('goliveDate', datetime.now().strftime('%Y-%m-%d'))
        return {
            "title": f"{self.company_name}\n项目上线汇报",
            "subtitle": "业财一体化项目",
            "speaker": "项目组",
            "date": golive_date,
        }
    
    def _generate_golive_overview(self) -> Dict[str, Any]:
        """生成上线汇报概述"""
        return {
            "title": "项目概述",
            "items": [
                f"企业名称：{self.company_name}",
                f"所属行业：{self.industry}",
                f"企业规模：{self.company_size}",
                f"员工人数：{self.employees}人",
                "",
                "### 项目意义：",
                "- 企业数字化转型的重要里程碑",
                "- 提升管理效率，降低运营成本",
                "- 增强企业核心竞争力",
                "- 支撑企业可持续发展",
            ]
        }
    
    def _generate_golive_background(self) -> Dict[str, Any]:
        """生成上线背景"""
        pain_points = self.industry_case.get('pain_points', [])
        return {
            "title": "项目建设背景",
            "left_title": "业务痛点",
            "left_items": [f"- {p}" for p in pain_points[:4]],
            "right_title": "建设目标",
            "right_items": [
                "- 实现业务流程标准化：流程规范化、审批自动化",
                "- 建立统一数据平台：数据集中、实时共享",
                "- 提升系统集成效率：系统互联、业务协同",
                "- 支持实时决策分析：数据可视化、分析智能化",
            ]
        }
    
    def _generate_golive_process(self) -> Dict[str, Any]:
        """生成项目历程"""
        return {
            "title": "项目实施历程",
            "phases": [
                {"name": "项目启动", "time": "第1阶段", "work": "项目组建\n需求调研"},
                {"name": "系统实施", "time": "第2阶段", "work": "系统配置\n数据迁移"},
                {"name": "测试培训", "time": "第3阶段", "work": "系统测试\n用户培训"},
                {"name": "上线准备", "time": "第4阶段", "work": "上线准备\n系统切换"},
            ]
        }
    
    def _generate_golive_scope(self) -> Dict[str, Any]:
        """生成业务范围"""
        return {
            "title": "业务范围架构",
            "items": [
                "### 核心业务模块：",
                "- 财务管理：总账、应收、应付、固定资产、现金管理、成本管理",
                "- 供应链管理：采购管理、库存管理、销售管理、物流管理",
                "- 生产制造：生产计划、车间管理、质量管理、设备管理",
                "- 人力资源管理：人事管理、薪酬管理、绩效管理、培训管理",
            ]
        }
    
    def _generate_golive_value(self) -> Dict[str, Any]:
        """生成价值达成"""
        benefits = self.industry_case.get('benefits', [])
        return {
            "title": "项目价值达成",
            "items": [
                "### 核心价值：",
            ] + [f"- {b}" for b in benefits] + [
                "",
                "### 管控提升：",
                "- 实现订单-应收-实收-稽核闭环：订单全程可追溯",
                "- 构建合同-请款-发票-付款管控闭环：合同全程管控",
                "- 建立预算-执行-分析闭环：预算实时控制",
            ]
        }
    
    def _generate_golive_results(self) -> Dict[str, Any]:
        """生成上线成果"""
        return {
            "title": "上线成果展示",
            "items": [
                "### 系统成果：",
                "- 完成核心模块实施：财务、供应链、制造、人力",
                "- 实现系统集成对接：MES、WMS、OA",
                "- 建立数据治理体系：主数据、业务数据、分析数据",
                "",
                "### 业务成果：",
                "- 业务流程标准化：流程规范化、审批自动化",
                "- 数据管理规范化：数据集中、实时共享",
                "- 决策支持智能化：数据可视化、分析智能化",
            ]
        }
    
    def _generate_golive_summary(self) -> Dict[str, Any]:
        """生成项目总结"""
        return {
            "title": "项目总结",
            "left_title": "成功经验",
            "left_items": [
                "- 领导高度重视：项目决策及时、资源保障充分",
                "- 团队协作良好：项目团队专业、执行力强",
                "- 用户参与积极：业务部门配合、需求明确",
                "- 方法论规范：实施方法论规范、质量控制严格",
            ],
            "right_title": "后续计划",
            "right_items": [
                "- 加强用户培训：持续培训、提升操作熟练度",
                "- 优化系统性能：持续优化、提升用户体验",
                "- 完善运维支持：建立运维体系、快速响应问题",
                "- 深化应用：持续优化、挖掘系统价值",
            ]
        }
    
    def _generate_acceptance_cover(self) -> Dict[str, Any]:
        """生成验收封面"""
        acceptance_date = self.customer_info.get('acceptanceDate', datetime.now().strftime('%Y-%m-%d'))
        return {
            "title": f"{self.company_name}\n金蝶云·星空项目验收汇报",
            "subtitle": "项目验收通过",
            "date": acceptance_date,
        }
    
    def _generate_acceptance_overview(self) -> Dict[str, Any]:
        """生成验收概述"""
        return {
            "title": "项目验收概述",
            "items": [
                f"企业名称：{self.company_name}",
                f"所属行业：{self.industry}",
                f"企业规模：{self.company_size}",
                f"验收日期：{datetime.now().strftime('%Y年%m月%d日')}",
                "",
                "### 验收结论：",
                "- ✅ 项目达到合同约定要求",
                "- ✅ 系统功能完整，运行稳定",
                "- ✅ 业务流程优化效果显著",
                "- ✅ 用户满意度较高",
            ]
        }
    
    def _generate_acceptance_standards(self) -> Dict[str, Any]:
        """生成验收标准"""
        return {
            "title": "验收标准",
            "items": [
                "### 功能验收标准：",
                "- 业务流程：所有设计流程全部实现",
                "- 数据集成：各系统数据100%同步",
                "- 系统性能：响应时间<3秒，并发支持1000+用户",
                "",
                "### 业务验收标准：",
                "- 业务覆盖：业务流程100%覆盖",
                "- 数据质量：数据准确率≥98%",
                "- 用户满意度：≥90%",
                "- 培训效果：用户操作熟练度≥95%",
            ]
        }
    
    def _generate_acceptance_results(self) -> Dict[str, Any]:
        """生成验收结果"""
        benefits = self.industry_case.get('benefits', [])
        return {
            "title": "验收结果",
            "items": [
                "### 功能验收：",
                "- ✅ 总账模块：功能完整，符合需求",
                "- ✅ 应收模块：功能完整，符合需求",
                "- ✅ 应付模块：功能完整，符合需求",
                "- ✅ 库存模块：功能完整，符合需求",
                "",
                "### 业务验收：",
            ] + [f"- ✅ {b}" for b in benefits[:4]]
        }
    
    def _generate_acceptance_conclusion(self) -> Dict[str, Any]:
        """生成验收结论"""
        return {
            "title": "验收结论",
            "items": [
                "### 验收结论：",
                "- ✅ 项目达到合同约定要求",
                "- ✅ 系统功能完整，运行稳定",
                "- ✅ 业务流程优化效果显著",
                "- ✅ 用户满意度较高",
                "",
                "### 后续建议：",
                "- 持续优化系统功能：收集用户反馈、持续优化",
                "- 加强用户培训：持续培训、提升操作熟练度",
                "- 深化数据价值挖掘：数据分析、决策支持",
                "- 建立运维体系：运维流程、问题处理",
            ]
        }
    
    def _generate_acceptance_future(self) -> Dict[str, Any]:
        """生成后续规划"""
        return {
            "title": "后续发展规划",
            "items": [
                "### 深化应用：",
                "- 财务深化：成本管理、预算管理、资金管理",
                "- 供应链深化：供应商管理、采购优化、库存优化",
                "- 制造深化：生产优化、质量提升、设备管理",
                "",
                "### 价值扩展：",
                "- 管理精细化：从粗放管理向精细化管理转变",
                "- 决策智能化：从经验决策向数据决策转变",
                "- 服务个性化：从标准化服务向个性化服务转变",
            ]
        }


# 多语言支持
LANGUAGE_TEMPLATES = {
    "zh_CN": {
        "cover": "封面",
        "overview": "企业概况",
        "pain_points": "痛点分析",
        "solutions": "解决方案",
        "architecture": "架构设计",
        "value": "价值工程",
        "roadmap": "实施路线",
        "cases": "成功案例",
        "team": "项目团队",
        "thank_you": "谢谢",
    },
    "en_US": {
        "cover": "Cover",
        "overview": "Company Overview",
        "pain_points": "Pain Points Analysis",
        "solutions": "Solutions",
        "architecture": "Architecture Design",
        "value": "Value Engineering",
        "roadmap": "Implementation Roadmap",
        "cases": "Success Cases",
        "team": "Project Team",
        "thank_you": "Thank You",
    }
}


def get_language_template(lang: str = "zh_CN") -> Dict[str, str]:
    """
    获取语言模板
    
    Args:
        lang: 语言代码（zh_CN/en_US）
    
    Returns:
        语言模板字典
    """
    return LANGUAGE_TEMPLATES.get(lang, LANGUAGE_TEMPLATES["zh_CN"])


# 模块信息
__version__ = "1.0.0"
__author__ = "ClawBot"
__description__ = "金蝶PPT生成器智能内容模块"


if __name__ == "__main__":
    # 测试代码
    test_customer = {
        "companyName": "测试企业",
        "industry": "制造业",
        "companySize": "中型企业",
        "employees": "1000",
        "revenue": "50000",
    }
    
    generator = ContentGenerator(test_customer)
    content = generator.generate_presales_content()
    
    print("售前PPT内容生成测试：")
    for key, value in content.items():
        print(f"\n{key}:")
        print(json.dumps(value, ensure_ascii=False, indent=2))
