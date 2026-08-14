#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新 kingdee-presales-content-pro.py 中的行业数据库
基于提取的行业案例数据
"""

import json
from pathlib import Path

# 文件路径
MEMORY_DIR = Path.home() / ".openclaw" / "workspace" / "memory"
SCRIPT_FILE = Path.home() / ".openclaw" / "workspace" / "scripts" / "kingdee-presales-content-pro.py"

# 读取提取的数据
with open(MEMORY_DIR / "extracted_industry_data.json", 'r', encoding='utf-8') as f:
    extracted_data = json.load(f)

# 行业图标映射
INDUSTRY_ICONS = {
    "制造业": "🏭",
    "零售业": "🛒",
    "金融": "🏦",
    "电商": "🛍️",
    "物流": "🚚",
    "医疗": "🏥",
    "教育": "🎓",
    "房地产": "🏢",
    "建筑": "🏗️",
    "医药": "💊",
    "电子": "📱",
    "化工": "⚗️",
    "食品": "🍜",
    "化妆品": "💄",
    "新能源": "⚡",
    "烟草": "🚬",
    "餐饮": "🍽️",
    "酒店": "🏨",
    "传媒": "📺",
    "农业": "🌾",
    "汽车": "🚗",
    "纺织": "🧵",
    "珠宝": "💎",
    "能源": "⛽",
    "环保": "♻️",
    "智慧城市": "🌆",
    "证券": "📈",
    "保险": "🛡️",
    "信托": "🏛️",
    "基金": "💰",
    "资产管理": "💼",
    "汽车金融": "🚙",
    "消费金融": "💳",
    "小贷": "🏦",
    "担保": "🤝",
    "租赁": "📦",
    "保理": "📊",
    "典当": "🏪",
    "养老": "👴",
    "文体": "🎭",
    "体育": "⚽",
    "科研": "🔬",
    "公共服务": "🏛️",
    "交通运输": "✈️",
    "通信": "📡",
    "军工": "🎖️",
    "互联网": "🌐",
}

# 清理痛点和成果中的markdown标记
def clean_text(text):
    """清理文本中的markdown标记"""
    text = text.replace('**', '').replace('*', '').strip()
    # 移除开头的"问题："、"影响："等
    for prefix in ['问题：', '影响：', '后果：', '问题描述：']:
        if text.startswith(prefix):
            text = text[len(prefix):].strip()
    return text

# 生成行业数据
def generate_industry_data(industry_key, industry_name, data):
    """生成单个行业的数据库条目"""
    icon = INDUSTRY_ICONS.get(industry_name, "🏢")
    
    # 清理痛点
    pain_points = []
    for pp in data.get('pain_points', []):
        cleaned = clean_text(pp)
        if cleaned and len(cleaned) > 5:
            # 如果是复合痛点，拆分
            if '，' in cleaned and len(cleaned) > 20:
                parts = cleaned.split('，')
                if len(parts) == 2:
                    pain_points.append(f"{parts[0]}：{parts[1]}")
                else:
                    pain_points.append(cleaned)
            else:
                pain_points.append(cleaned)
    
    # 确保至少有3个痛点
    while len(pain_points) < 3:
        pain_points.append(f"{industry_name}管理复杂，需要数字化升级")
    
    # 限制最多6个痛点
    pain_points = pain_points[:6]
    
    # 清理解决方案
    solutions = []
    for sol in data.get('solutions', []):
        cleaned = clean_text(sol)
        if cleaned and len(cleaned) > 1:
            # 简化解决方案名称
            if '管理' in cleaned:
                cleaned = cleaned.replace('管理', '')
            solutions.append(cleaned)
    
    # 确保至少有3个解决方案
    default_solutions = ["财务云", "供应链云", "项目管理"]
    while len(solutions) < 3:
        solutions.append(default_solutions[len(solutions)])
    
    # 限制最多4个解决方案
    solutions = solutions[:4]
    
    # 清理成果
    results = []
    for res in data.get('results', []):
        cleaned = clean_text(res)
        if cleaned and len(cleaned) > 5:
            results.append(cleaned)
    
    # 确保至少有3个成果
    while len(results) < 3:
        results.append(f"{industry_name}管理效率显著提升")
    
    # 限制最多5个成果
    results = results[:5]
    
    # 提取规模
    scale = data.get('scale', f"中国{industry_name}市场规模持续增长")
    if not scale or scale == 'N/A' or '企业' in scale[:10]:
        scale = f"中国{industry_name}市场规模持续增长"
    
    return {
        "name": industry_name,
        "icon": icon,
        "scale": scale,
        "pain_points": pain_points,
        "solutions": solutions,
        "results": results
    }

# 生成所有行业数据
all_industries = {}
for key, value in extracted_data.items():
    if key == 'solutions':  # 跳过解决方案文件
        continue
    
    industry_name = value['name']
    industry_data = generate_industry_data(key, industry_name, value['data'])
    all_industries[key] = industry_data
    
print(f"生成了 {len(all_industries)} 个行业的数据")

# 保存为JSON供检查
output_file = MEMORY_DIR / "final_industry_data.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_industries, f, ensure_ascii=False, indent=2)

print(f"数据已保存到: {output_file}")

# 显示部分数据示例
print("\n=== 数据示例 ===")
for key in list(all_industries.keys())[:3]:
    print(f"\n{all_industries[key]['name']} ({key}):")
    print(f"  规模: {all_industries[key]['scale'][:50]}...")
    print(f"  痛点: {all_industries[key]['pain_points'][0]}")
    print(f"  解决方案: {', '.join(all_industries[key]['solutions'])}")
    print(f"  成果: {all_industries[key]['results'][0]}")
