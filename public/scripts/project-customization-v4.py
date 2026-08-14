# -*- coding: utf-8 -*-
"""
项目定制化配置 V4.0
支持行业定制、规模定制、模块定制
学习时间：2026-03-23
"""

import os
import json
from datetime import datetime

# ==================== 行业配置 ====================

INDUSTRY_CONFIGS = {
    "manufacturing": {
        "name": "制造业",
        "modules": ["财务云", "供应链云", "制造云", "人力云"],
        "features": {
            "财务云": ["集团财务", "成本管理", "预算管理", "固定资产"],
            "供应链云": ["采购管理", "库存管理", "销售管理", "供应商协同"],
            "制造云": ["生产计划", "车间管理", "质量管理", "设备管理"],
            "人力云": ["人事管理", "薪酬管理", "绩效管理"]
        },
        "keywords": ["MES", "APS", "MRP", "BOM", "工艺路线", "车间", "工序", "质量追溯"],
        "pain_points": [
            "生产计划不准，产能利用率低",
            "库存积压严重，库存周转率低",
            "成本核算复杂，成本分析困难",
            "质量追溯困难，质量管理粗放"
        ],
        "solutions": [
            "高级排程(APS)：有限产能排程、多目标优化",
            "物料需求计划(MRP)：需求预测、物料齐套",
            "成本管理：标准成本、实际成本、作业成本",
            "质量追溯：批次追溯、序列号追溯、全流程追溯"
        ],
        "cases": [
            {"name": "三一重工", "industry": "工程机械", "results": ["库存周转率↑30%", "生产计划准确性↑50%"]},
            {"name": "美的集团", "industry": "家电制造", "results": ["采购效率↑60%", "销售分析效率↑90%"]},
            {"name": "海信集团", "industry": "电子制造", "results": ["18大能力中心", "全球统一平台"]}
        ]
    },
    "retail": {
        "name": "零售业",
        "modules": ["财务云", "供应链云", "全渠道云", "人力云"],
        "features": {
            "财务云": ["集团财务", "收入管理", "成本管理", "资金管理"],
            "供应链云": ["采购管理", "库存管理", "配送管理", "供应商协同"],
            "全渠道云": ["门店管理", "电商管理", "会员管理", "营销管理"],
            "人力云": ["人事管理", "薪酬管理", "排班管理"]
        },
        "keywords": ["门店", "电商", "会员", "营销", "配送", "促销", "库存周转"],
        "pain_points": [
            "库存准确率低，库存盘点困难",
            "采购周期长，补货不及时",
            "会员运营困难，复购率低",
            "全渠道数据分散，分析困难"
        ],
        "solutions": [
            "全渠道库存：库存共享、实时同步、智能调拨",
            "智能补货：需求预测、自动补货、库存优化",
            "会员运营：会员管理、精准营销、复购激励",
            "数据分析：销售分析、会员分析、商品分析"
        ],
        "cases": [
            {"name": "永辉超市", "industry": "连锁零售", "results": ["库存准确率↑98%", "采购周期↓50%"]},
            {"name": "屈臣氏", "industry": "连锁零售", "results": ["会员复购率↑25%", "销售分析效率↑90%"]}
        ]
    },
    "finance": {
        "name": "金融业",
        "modules": ["财务云", "资金云", "税务云", "人力云"],
        "features": {
            "财务云": ["集团财务", "共享中心", "合并报表", "预算管理"],
            "资金云": ["资金管理", "资金预测", "融资管理", "投资管理"],
            "税务云": ["税务核算", "税务申报", "税务分析", "税务风险"],
            "人力云": ["人事管理", "薪酬管理", "绩效管理"]
        },
        "keywords": ["共享中心", "合并报表", "资金管理", "税务管理", "合规", "风控"],
        "pain_points": [
            "关账周期长，报表不及时",
            "资金管理分散，资金利用率低",
            "税务风险高，合规压力大",
            "数据孤岛，分析困难"
        ],
        "solutions": [
            "财务共享：共享作业、任务分配、绩效考核",
            "智能合并：自动采集、自动抵销、实时合并",
            "资金管理：资金集中、资金预测、风险管控",
            "税务管理：自动计税、自动申报、风险预警"
        ],
        "cases": [
            {"name": "招商银行", "industry": "银行业", "results": ["关账时间↓70%", "报表准确性↑99%"]},
            {"name": "太平洋保险", "industry": "保险业", "results": ["合规率100%", "共享效率↑50%"]}
        ]
    },
    "service": {
        "name": "服务业",
        "modules": ["财务云", "项目云", "人力云", "费用云"],
        "features": {
            "财务云": ["集团财务", "项目管理", "成本管理", "预算管理"],
            "项目云": ["项目立项", "项目执行", "项目核算", "项目分析"],
            "人力云": ["人事管理", "薪酬管理", "绩效管理", "培训管理"],
            "费用云": ["费用报销", "差旅管理", "费用控制", "费用分析"]
        },
        "keywords": ["项目", "服务", "费用", "工时", "合同", "客户"],
        "pain_points": [
            "项目核算困难，成本归集不准确",
            "费用报销繁琐，审批效率低",
            "人力成本高，人效提升困难",
            "数据分析困难，决策支持不足"
        ],
        "solutions": [
            "项目管理：项目立项、项目核算、项目分析",
            "费用管理：费用报销、费用控制、费用分析",
            "人力资源管理：人事管理、薪酬管理、绩效管理",
            "数据分析：经营分析、项目分析、人员分析"
        ],
        "cases": [
            {"name": "万科物业", "industry": "物业管理", "results": ["人效↑30%", "流程效率↑50%"]},
            {"name": "新东方", "industry": "教育培训", "results": ["客户满意度↑20%", "费用效率↑40%"]}
        ]
    },
    "construction": {
        "name": "建筑业",
        "modules": ["财务云", "项目云", "供应链云", "人力云"],
        "features": {
            "财务云": ["集团财务", "项目管理", "成本管理", "资金管理"],
            "项目云": ["项目立项", "项目预算", "项目核算", "项目分析"],
            "供应链云": ["采购管理", "库存管理", "合同管理", "供应商管理"],
            "人力云": ["人事管理", "薪酬管理", "劳务管理"]
        },
        "keywords": ["项目", "工程", "合同", "成本", "进度", "质量", "安全"],
        "pain_points": [
            "项目成本核算困难，成本归集不准确",
            "合同管理分散，合同执行跟踪困难",
            "供应链管理粗放，采购成本高",
            "项目管理信息化程度低"
        ],
        "solutions": [
            "项目成本：项目预算、成本归集、成本分析",
            "合同管理：合同立项、合同执行、合同结算",
            "供应链管理：采购管理、供应商管理、库存管理",
            "项目管理：项目立项、进度管理、质量管理"
        ],
        "cases": [
            {"name": "中建集团", "industry": "建筑施工", "results": ["项目成本↓10%", "合同执行率↑95%"]},
            {"name": "中铁集团", "industry": "铁路建设", "results": ["采购成本↓15%", "项目周期↓10%"]}
        ]
    }
}

# ==================== 企业规模配置 ====================

SCALE_CONFIGS = {
    "large": {
        "name": "大型企业",
        "employees": "5000+",
        "revenue": "50亿+",
        "features": [
            "集团管控：多组织、多账簿、多准则",
            "共享中心：财务共享、人力共享",
            "全面预算：预算编制、预算控制、预算分析",
            "智能合并：自动采集、自动抵销、实时合并",
            "资金管理：资金集中、资金预测、资金调度",
            "数据中台：数据治理、数据分析、智能决策"
        ],
        "modules": ["集团财务", "共享中心", "全面预算", "智能合并", "资金管理", "供应链", "制造", "人力"],
        "timeline": "12-18个月",
        "team": "20-30人"
    },
    "medium": {
        "name": "中型企业",
        "employees": "500-5000",
        "revenue": "5-50亿",
        "features": [
            "财务管控：多账簿、多币种、多准则",
            "预算管理：预算编制、预算控制",
            "成本管理：成本核算、成本分析",
            "供应链管理：采购、库存、销售",
            "生产管理：生产计划、车间管理",
            "人力资源管理：人事、薪酬、绩效"
        ],
        "modules": ["财务", "供应链", "制造", "人力"],
        "timeline": "6-12个月",
        "team": "10-20人"
    },
    "small": {
        "name": "小型企业",
        "employees": "50-500",
        "revenue": "5000万-5亿",
        "features": [
            "财务核算：总账、应收、应付、固定资产",
            "进销存：采购、库存、销售",
            "人力资源管理：人事、薪酬",
            "报表分析：财务报表、经营分析"
        ],
        "modules": ["财务", "进销存", "人力"],
        "timeline": "3-6个月",
        "team": "5-10人"
    }
}

# ==================== 模块配置 ====================

MODULE_CONFIGS = {
    "finance": {
        "name": "财务云",
        "modules": {
            "总账": ["凭证管理", "期末处理", "报表管理", "多账簿管理"],
            "应收": ["发票管理", "收款管理", "账龄分析", "信用管理"],
            "应付": ["发票管理", "付款管理", "账龄分析", "付款条件"],
            "固定资产": ["资产登记", "折旧计提", "资产变动", "资产盘点"],
            "现金管理": ["收款管理", "付款管理", "银行对账", "资金计划"],
            "成本管理": ["成本核算", "成本分析", "成本控制", "成本优化"],
            "预算管理": ["预算编制", "预算控制", "预算分析", "预算考核"],
            "合并报表": ["数据采集", "自动抵销", "合并计算", "报表输出"]
        }
    },
    "supply_chain": {
        "name": "供应链云",
        "modules": {
            "采购管理": ["采购申请", "采购订单", "采购收货", "采购退货", "供应商管理"],
            "库存管理": ["入库管理", "出库管理", "库存盘点", "库存调拨", "库存分析"],
            "销售管理": ["销售订单", "发货管理", "开票管理", "收款管理", "客户管理"],
            "物流管理": ["运输计划", "运输执行", "运输跟踪", "物流成本"]
        }
    },
    "manufacturing": {
        "name": "制造云",
        "modules": {
            "生产计划": ["需求计划", "主生产计划", "物料需求计划", "产能计划"],
            "车间管理": ["生产订单", "生产领料", "工序汇报", "完工入库"],
            "质量管理": ["来料检验", "过程检验", "成品检验", "质量追溯"],
            "设备管理": ["设备台账", "设备保养", "设备维修", "设备分析"]
        }
    },
    "hr": {
        "name": "人力云",
        "modules": {
            "人事管理": ["组织管理", "人员档案", "合同管理", "入职离职"],
            "薪酬管理": ["薪资核算", "社保管理", "个税管理", "薪酬分析"],
            "绩效管理": ["绩效目标", "绩效考核", "绩效反馈", "绩效分析"],
            "培训管理": ["培训计划", "培训执行", "培训评估", "培训档案"]
        }
    }
}

# ==================== 定制化生成函数 ====================

def generate_custom_config(industry, scale, modules):
    """生成定制化配置"""
    
    # 获取行业配置
    industry_config = INDUSTRY_CONFIGS.get(industry, INDUSTRY_CONFIGS["manufacturing"])
    
    # 获取规模配置
    scale_config = SCALE_CONFIGS.get(scale, SCALE_CONFIGS["medium"])
    
    # 获取模块配置
    selected_modules = {}
    for module in modules:
        if module in MODULE_CONFIGS:
            selected_modules[module] = MODULE_CONFIGS[module]
    
    # 生成定制化配置
    custom_config = {
        "industry": industry_config,
        "scale": scale_config,
        "modules": selected_modules,
        "generated_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    return custom_config

def generate_presales_content(industry, scale, customer_name, project_name):
    """生成售前内容"""
    
    config = generate_custom_config(industry, scale, ["finance", "supply_chain", "manufacturing", "hr"])
    
    content = {
        "customer": customer_name,
        "project": project_name,
        "industry": config["industry"]["name"],
        "scale": config["scale"]["name"],
        "pain_points": config["industry"]["pain_points"],
        "solutions": config["industry"]["solutions"],
        "cases": config["industry"]["cases"],
        "timeline": config["scale"]["timeline"],
        "team": config["scale"]["team"]
    }
    
    return content

def print_custom_config(config):
    """打印定制化配置"""
    print(f"\n{'='*60}")
    print(f"行业: {config['industry']['name']}")
    print(f"规模: {config['scale']['name']}")
    print(f"{'='*60}\n")
    
    print("【行业特点】")
    for keyword in config['industry']['keywords'][:8]:
        print(f"  - {keyword}")
    
    print("\n【痛点分析】")
    for pain in config['industry']['pain_points']:
        print(f"  - {pain}")
    
    print("\n【解决方案】")
    for solution in config['industry']['solutions']:
        print(f"  - {solution}")
    
    print("\n【成功案例】")
    for case in config['industry']['cases']:
        print(f"  - {case['name']}({case['industry']})")
        for result in case['results']:
            print(f"      · {result}")
    
    print("\n【实施周期】" + config['scale']['timeline'])
    print("【实施团队】" + config['scale']['team'])

if __name__ == "__main__":
    # 测试
    config = generate_custom_config("manufacturing", "large", ["finance", "supply_chain", "manufacturing", "hr"])
    print_custom_config(config)
