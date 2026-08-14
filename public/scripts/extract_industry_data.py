#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从行业案例文件中提取数据并更新 kingdee-presales-content-pro.py
"""

import os
import re
import json
from pathlib import Path

# 获取路径
MEMORY_DIR = Path.home() / ".openclaw" / "workspace" / "memory"
SCRIPT_FILE = Path.home() / ".openclaw" / "workspace" / "scripts" / "kingdee-presales-content-pro.py"

# 行业名称映射（文件名 -> 中文名称）
INDUSTRY_NAME_MAP = {
    "agriculture": "农业",
    "assetmanagement": "资产管理",
    "autofinance": "汽车金融",
    "automobile": "汽车制造",
    "catering": "餐饮",
    "chemical": "化工",
    "construction": "建筑",
    "consumerfinance": "消费金融",
    "cosmetics": "化妆品",
    "culture": "文体",
    "ecommerce": "电商",
    "education": "教育",
    "elderly-care": "养老",
    "electronics": "电子制造",
    "energy": "能源",
    "environmental": "环保",
    "factoring": "保理",
    "finance": "金融",
    "financialservices": "金融服务",
    "food": "食品",
    "guarantee": "担保",
    "hotel": "酒店",
    "insurance": "保险",
    "internet": "互联网",
    "jewelry": "珠宝",
    "leasing": "租赁",
    "logistics": "物流",
    "media": "传媒",
    "medical": "医疗",
    "microloan": "小贷",
    "military": "军工",
    "newenergy": "新能源",
    "pawn": "典当",
    "pharmaceutical": "医药",
    "privatefund": "私募基金",
    "publicservice": "公共服务",
    "realestate": "房地产",
    "research": "科研",
    "retail": "零售",
    "securities": "证券",
    "smartcity": "智慧城市",
    "sports": "体育",
    "telecom": "通信",
    "textile": "纺织",
    "tobacco": "烟草",
    "transportation": "交通运输",
    "trust": "信托",
    "金融": "金融",
}

def extract_industry_data(file_path):
    """从单个文件中提取行业数据"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    data = {}
    
    # 提取行业规模
    scale_match = re.search(r'(?:市场规模|行业背景|规模|产值)[：:]\s*(.+?)(?:\n|$)', content)
    if scale_match:
        data['scale'] = scale_match.group(1).strip()
    else:
        # 尝试其他模式
        scale_patterns = [
            r'中国.*?(?:市场规模|规模|产值)(?:超|约|达)(.+?)(?:[，,\n]|$)',
            r'(?:市场规模|行业规模)[：:]\s*(.+?)(?:\n|$)',
        ]
        for pattern in scale_patterns:
            match = re.search(pattern, content)
            if match:
                data['scale'] = match.group(1).strip()
                break
    
    # 提取痛点
    pain_points = []
    pain_section = re.search(r'痛点[分析需求]*\n(.+?)(?=\n##|\n---|\n### [三三四五六七八])', content, re.DOTALL)
    if pain_section:
        pain_text = pain_section.group(1)
        # 提取痛点条目
        pain_items = re.findall(r'(?:\*\*)?痛点\d*[：:](?:\*\*)?\s*(.+?)(?:\n|$)', pain_text)
        if pain_items:
            pain_points = [item.strip() for item in pain_items[:6]]
        else:
            # 尝试其他格式
            pain_items = re.findall(r'[-*]\s*(.+?)(?:\n|$)', pain_text)
            pain_points = [item.strip() for item in pain_items if item.strip()][:6]
    
    if not pain_points:
        # 尝试从其他部分提取
        pain_items = re.findall(r'(?:问题|痛点|困难|挑战)[：:]\s*(.+?)(?:\n|$)', content)
        pain_points = [item.strip() for item in pain_items if item.strip()][:6]
    
    data['pain_points'] = pain_points if pain_points else ["行业特点复杂", "管理挑战大", "成本控制难"]
    
    # 提取解决方案
    solutions = []
    sol_section = re.search(r'解决方案\n(.+?)(?=\n##|\n---|\n### [四五六七八])', content, re.DOTALL)
    if sol_section:
        sol_text = sol_section.group(1)
        # 提取模块名称
        sol_items = re.findall(r'\*\*(.+?)\*\*[：:]', sol_text)
        solutions = [item.strip() for item in sol_items if item.strip()][:4]
    
    if not solutions:
        # 尝试其他格式
        sol_items = re.findall(r'[-*]\s*\*\*(.+?)\*\*', content)
        solutions = [item.strip() for item in sol_items if item.strip()][:4]
    
    data['solutions'] = solutions if solutions else ["财务云", "供应链云", "项目管理"]
    
    # 提取成果
    results = []
    result_section = re.search(r'(?:项目成果|实施成果)\n(.+?)(?=\n##|\n---|\n### [五六七八])', content, re.DOTALL)
    if result_section:
        result_text = result_section.group(1)
        # 提取成果数据
        result_items = re.findall(r'[-*]\s*(.+?)(?:\n|$)', result_text)
        results = [item.strip() for item in result_items if item.strip() and not item.startswith('|')][:5]
    
    if not results:
        # 尝试从表格中提取
        result_items = re.findall(r'\|\s*(.+?)\s*\|.*提升|降低|缩短', content)
        results = [item.strip() for item in result_items if item.strip() and item not in ['指标', '优化前', '优化后']][:5]
    
    data['results'] = results if results else ["效率显著提升", "成本明显降低", "管理更加规范"]
    
    return data

def main():
    """主函数"""
    # 读取所有行业案例文件
    industry_files = list(MEMORY_DIR.glob("kingdee-industry-*.md"))
    industry_files = [f for f in industry_files if 'cases-index' not in f.name and 'deep-learning' not in f.name and 'learning-' not in f.name]
    
    print(f"找到 {len(industry_files)} 个行业案例文件")
    
    # 提取每个行业的数据
    industry_data = {}
    for file_path in industry_files:
        # 从文件名提取行业标识
        industry_key = file_path.stem.replace('kingdee-industry-', '')
        industry_name = INDUSTRY_NAME_MAP.get(industry_key, industry_key)
        
        print(f"\n处理行业: {industry_name} ({industry_key})")
        data = extract_industry_data(file_path)
        
        if data:
            industry_data[industry_key] = {
                'name': industry_name,
                'data': data
            }
            print(f"  规模: {data.get('scale', 'N/A')[:50]}...")
            print(f"  痛点: {len(data.get('pain_points', []))} 条")
            print(f"  解决方案: {len(data.get('solutions', []))} 个")
            print(f"  成果: {len(data.get('results', []))} 条")
    
    # 输出统计信息
    print(f"\n\n总共提取了 {len(industry_data)} 个行业的数据")
    
    # 保存为JSON文件
    output_file = MEMORY_DIR / "extracted_industry_data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(industry_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n数据已保存到: {output_file}")
    
    return industry_data

if __name__ == "__main__":
    main()
