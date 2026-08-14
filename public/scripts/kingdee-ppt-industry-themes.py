#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
金蝶PPT行业主题配置 - v1.0
12个行业专属配色主题
"""

# 行业主题配色方案
INDUSTRY_THEMES = {
    "制造业": {
        "primary": (0, 102, 153),       # 深蓝
        "secondary": (0, 153, 204),     # 浅蓝
        "accent": (255, 153, 0),        # 橙色
        "icon": "🏭",
        "keywords": ["生产效率", "成本控制", "质量管理", "供应链协同"],
        "hero_metrics": [
            {"value": "30%", "label": "生产效率提升", "desc": "APS智能排程"},
            {"value": "15%", "label": "成本降低", "desc": "精细化成本管理"},
            {"value": "99%", "label": "质量追溯", "desc": "全流程可追溯"},
            {"value": "40%", "label": "库存周转", "desc": "MRP物料优化"}
        ]
    },
    "零售业": {
        "primary": (220, 53, 69),       # 红色
        "secondary": (255, 127, 80),    # 珊瑚色
        "accent": (255, 193, 7),        # 金色
        "icon": "🛒",
        "keywords": ["全渠道运营", "库存优化", "会员营销", "智能补货"],
        "hero_metrics": [
            {"value": "98%", "label": "库存准确率", "desc": "全渠道库存同步"},
            {"value": "70%", "label": "订单处理效率", "desc": "订单自动化"},
            {"value": "30%", "label": "会员复购率", "desc": "精准营销"},
            {"value": "25%", "label": "人力成本降低", "desc": "流程自动化"}
        ]
    },
    "金融": {
        "primary": (30, 60, 114),       # 深蓝金
        "secondary": (42, 82, 152),     # 中蓝
        "accent": (212, 175, 55),       # 金色
        "icon": "🏦",
        "keywords": ["多实体核算", "资金管理", "风险管理", "合规管理"],
        "hero_metrics": [
            {"value": "50%", "label": "核算效率提升", "desc": "多法人核算"},
            {"value": "80%", "label": "资金归集效率", "desc": "资金池管理"},
            {"value": "100%", "label": "合规报表自动化", "desc": "监管报送"},
            {"value": "35%", "label": "资金使用效率", "desc": "流动性优化"}
        ]
    },
    "电商": {
        "primary": (255, 87, 34),       # 橙红
        "secondary": (255, 152, 0),     # 橙色
        "accent": (76, 175, 80),        # 绿色
        "icon": "🛍️",
        "keywords": ["订单处理", "全渠道库存", "智能客服", "数据分析"],
        "hero_metrics": [
            {"value": "80%", "label": "订单处理效率", "desc": "自动化订单处理"},
            {"value": "99%", "label": "库存准确率", "desc": "实时库存同步"},
            {"value": "90%", "label": "对账效率", "desc": "自动对账结算"},
            {"value": "30%", "label": "复购率提升", "desc": "精准营销"}
        ]
    },
    "医疗": {
        "primary": (0, 150, 136),       # 青色
        "secondary": (77, 182, 172),    # 浅青
        "accent": (255, 152, 0),        # 橙色
        "icon": "🏥",
        "keywords": ["科室成本核算", "医保结算", "药品供应链", "医疗质量"],
        "hero_metrics": [
            {"value": "60%", "label": "成本核算效率", "desc": "科室成本精细化"},
            {"value": "50%", "label": "医保结算效率", "desc": "医保自动结算"},
            {"value": "40%", "label": "库存周转提升", "desc": "药品效期管理"},
            {"value": "100%", "label": "质量追溯率", "desc": "医疗质量追溯"}
        ]
    },
    "教育": {
        "primary": (63, 81, 181),       # 靛蓝
        "secondary": (92, 107, 192),    # 浅靛蓝
        "accent": (255, 193, 7),        # 琥珀色
        "icon": "🎓",
        "keywords": ["学费管理", "科研核算", "资产管理", "预算管理"],
        "hero_metrics": [
            {"value": "70%", "label": "学费管理效率", "desc": "在线缴费"},
            {"value": "50%", "label": "科研核算效率", "desc": "项目成本管理"},
            {"value": "80%", "label": "资产盘点效率", "desc": "固定资产管理"},
            {"value": "95%", "label": "预算执行率", "desc": "预算控制"}
        ]
    },
    "房地产": {
        "primary": (121, 85, 72),       # 棕色
        "secondary": (161, 136, 127),   # 浅棕
        "accent": (255, 152, 0),        # 橙色
        "icon": "🏢",
        "keywords": ["项目成本管控", "资金管理", "供应链管理", "销售管理"],
        "hero_metrics": [
            {"value": "50%", "label": "成本核算效率", "desc": "项目成本精细化"},
            {"value": "30%", "label": "资金周转效率", "desc": "资金计划管理"},
            {"value": "40%", "label": "供应商管理效率", "desc": "供应商协同"},
            {"value": "25%", "label": "销售效率提升", "desc": "销售数据分析"}
        ]
    },
    "建筑": {
        "primary": (255, 152, 0),       # 橙色
        "secondary": (255, 183, 77),    # 浅橙
        "accent": (0, 150, 136),        # 青色
        "icon": "🏗️",
        "keywords": ["项目成本核算", "分包管理", "质量安全", "资金管理"],
        "hero_metrics": [
            {"value": "60%", "label": "成本核算效率", "desc": "项目成本归集"},
            {"value": "40%", "label": "分包管理效率", "desc": "分包协同"},
            {"value": "50%", "label": "安全事故降低", "desc": "安全管理"},
            {"value": "25%", "label": "资金周转提升", "desc": "回款管理"}
        ]
    },
    "医药": {
        "primary": (0, 121, 107),       # 深青
        "secondary": (38, 166, 154),    # 青色
        "accent": (255, 152, 0),        # 橙色
        "icon": "💊",
        "keywords": ["GMP合规", "批次追溯", "研发项目管理", "供应链管理"],
        "hero_metrics": [
            {"value": "100%", "label": "GMP合规率", "desc": "合规管理"},
            {"value": "100%", "label": "批次追溯率", "desc": "药品追溯"},
            {"value": "50%", "label": "研发项目效率", "desc": "项目成本管理"},
            {"value": "30%", "label": "供应链效率", "desc": "采购优化"}
        ]
    },
    "电子": {
        "primary": (33, 150, 243),      # 蓝色
        "secondary": (66, 165, 245),    # 浅蓝
        "accent": (156, 39, 176),       # 紫色
        "icon": "📱",
        "keywords": ["产品生命周期", "供应链协同", "生产计划", "质量管理"],
        "hero_metrics": [
            {"value": "25%", "label": "上市周期缩短", "desc": "PLM研发管理"},
            {"value": "50%", "label": "供应链协同效率", "desc": "供应商协同"},
            {"value": "40%", "label": "生产计划准确性", "desc": "APS排程"},
            {"value": "99%", "label": "质量追溯率", "desc": "全流程追溯"}
        ]
    },
    "化工": {
        "primary": (156, 39, 176),      # 紫色
        "secondary": (186, 104, 200),   # 浅紫
        "accent": (255, 152, 0),        # 橙色
        "icon": "⚗️",
        "keywords": ["安全生产", "环保合规", "配方管理", "成本核算"],
        "hero_metrics": [
            {"value": "80%", "label": "安全事故降低", "desc": "安全管理"},
            {"value": "100%", "label": "环保合规率", "desc": "环保管理"},
            {"value": "60%", "label": "配方管理效率", "desc": "配方保密"},
            {"value": "50%", "label": "成本核算效率", "desc": "联产品核算"}
        ]
    },
    "食品": {
        "primary": (76, 175, 80),       # 绿色
        "secondary": (129, 199, 132),   # 浅绿
        "accent": (255, 152, 0),        # 橙色
        "icon": "🍜",
        "keywords": ["食品安全", "保质期管理", "供应链成本", "质量管理"],
        "hero_metrics": [
            {"value": "100%", "label": "食品安全追溯", "desc": "全程追溯"},
            {"value": "90%", "label": "过期损失降低", "desc": "效期管理"},
            {"value": "15%", "label": "供应链成本降低", "desc": "采购优化"},
            {"value": "99%", "label": "质量合格率", "desc": "质量检验"}
        ]
    }
}

# 默认主题
DEFAULT_THEME = {
    "primary": (0, 102, 153),
    "secondary": (0, 153, 204),
    "accent": (255, 153, 0),
    "icon": "📊",
    "keywords": ["效率提升", "成本降低", "质量提升", "管理优化"],
    "hero_metrics": [
        {"value": "50%", "label": "效率提升", "desc": "流程优化"},
        {"value": "20%", "label": "成本降低", "desc": "精细化管理"},
        {"value": "30%", "label": "质量提升", "desc": "质量追溯"},
        {"value": "95%", "label": "客户满意", "desc": "服务提升"}
    ]
}

def get_industry_theme(industry_name):
    """获取行业主题配置"""
    # 尝试精确匹配
    if industry_name in INDUSTRY_THEMES:
        return INDUSTRY_THEMES[industry_name]
    
    # 尝试模糊匹配
    for key in INDUSTRY_THEMES:
        if key in industry_name or industry_name in key:
            return INDUSTRY_THEMES[key]
    
    # 返回默认主题
    return DEFAULT_THEME

def get_industry_colors(industry_name):
    """获取行业配色（返回RGBColor格式）"""
    from pptx.dml.color import RGBColor
    theme = get_industry_theme(industry_name)
    return {
        'primary': RGBColor(*theme['primary']),
        'secondary': RGBColor(*theme['secondary']),
        'accent': RGBColor(*theme['accent'])
    }

def get_industry_hero_metrics(industry_name):
    """获取行业核心指标"""
    theme = get_industry_theme(industry_name)
    return theme['hero_metrics']

def get_industry_keywords(industry_name):
    """获取行业关键词"""
    theme = get_industry_theme(industry_name)
    return theme['keywords']

if __name__ == "__main__":
    import json
    print("行业主题列表:")
    for industry, theme in INDUSTRY_THEMES.items():
        print(f"  {theme['icon']} {industry}: {', '.join(theme['keywords'][:2])}")
