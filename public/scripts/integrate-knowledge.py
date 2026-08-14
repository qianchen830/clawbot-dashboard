#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
知识整合脚本 - 整合知识库并创造新能力
"""

import os
import json
from datetime import datetime
from collections import Counter

WORKSPACE = '/home/zzyuzhangxing/.openclaw/workspace'
KNOWLEDGE_BASE = f'{WORKSPACE}/data/skill-knowledge-base.json'
SKILL_COMBINATIONS = f'{WORKSPACE}/data/skill-combinations.json'
NEW_CAPABILITIES = f'{WORKSPACE}/data/new-capabilities.json'

def integrate_knowledge():
    """整合知识库，发现知识关联，创造新能力"""
    
    # 1. 读取知识库
    if not os.path.exists(KNOWLEDGE_BASE):
        print("❌ 知识库不存在")
        return
    
    with open(KNOWLEDGE_BASE, 'r', encoding='utf-8') as f:
        kb = json.load(f)
    
    skills = kb.get('skills', [])
    if len(skills) < 2:
        print("⚠️ 知识库技能太少，暂不整合")
        return
    
    print(f"📚 当前知识库: {len(skills)}个技能")
    
    # 2. 发现知识关联
    patterns = find_patterns(skills)
    print(f"🔍 发现设计模式: {len(patterns)}种")
    
    # 3. 发现技能组合
    combinations = find_combinations(skills)
    print(f"🔗 发现技能组合: {len(combinations)}个")
    
    # 4. 创造新能力
    new_capabilities = create_new_capabilities(skills, patterns, combinations)
    print(f"🚀 创造新能力: {len(new_capabilities)}个")
    
    # 5. 保存结果
    save_results(combinations, new_capabilities)
    
    print("✅ 知识整合完成")

def find_patterns(skills):
    """发现设计模式"""
    all_patterns = []
    
    for skill in skills:
        patterns = skill.get('patterns', [])
        all_patterns.extend(patterns)
    
    # 统计模式出现频率
    pattern_counter = Counter(all_patterns)
    
    # 返回高频模式
    common_patterns = [p for p, count in pattern_counter.most_common(10)]
    
    return common_patterns

def find_combinations(skills):
    """发现技能组合"""
    combinations = []
    
    # 按类别分组
    categories = {}
    for skill in skills:
        category = skill.get('category', '通用')
        if category not in categories:
            categories[category] = []
        categories[category].append(skill['name'])
    
    # 创建组合
    for category, skill_names in categories.items():
        if len(skill_names) >= 2:
            combination = {
                'name': f"{category}工作流",
                'skills': skill_names,
                'description': f"整合{len(skill_names)}个{category}相关技能",
                'created_at': datetime.now().isoformat(),
                'usage_count': 0
            }
            combinations.append(combination)
    
    # 发现跨类别组合
    cross_category_combinations = find_cross_category_combinations(skills)
    combinations.extend(cross_category_combinations)
    
    return combinations

def find_cross_category_combinations(skills):
    """发现跨类别组合"""
    combinations = []
    
    # 示例：视觉创作 + 内容创作 = 完整内容生产
    visual_skills = [s for s in skills if s.get('category') == '视觉创作']
    content_skills = [s for s in skills if s.get('category') == '内容创作']
    
    if visual_skills and content_skills:
        combination = {
            'name': '完整内容生产流程',
            'skills': [s['name'] for s in visual_skills[:2]] + [s['name'] for s in content_skills[:2]],
            'description': '视觉创作 + 内容创作 = 完整内容生产',
            'created_at': datetime.now().isoformat(),
            'usage_count': 0,
            'type': 'cross_category'
        }
        combinations.append(combination)
    
    # 示例：社交媒体 + 数据分析 = 智能运营
    social_skills = [s for s in skills if s.get('category') == '社交媒体']
    analytics_skills = [s for s in skills if s.get('category') == '数据分析']
    
    if social_skills and analytics_skills:
        combination = {
            'name': '智能社交媒体运营',
            'skills': [s['name'] for s in social_skills[:2]] + [s['name'] for s in analytics_skills[:2]],
            'description': '社交媒体 + 数据分析 = 智能运营',
            'created_at': datetime.now().isoformat(),
            'usage_count': 0,
            'type': 'cross_category'
        }
        combinations.append(combination)
    
    return combinations

def create_new_capabilities(skills, patterns, combinations):
    """基于知识创造新能力"""
    new_capabilities = []
    
    # 1. 基于高频模式创造新能力
    if '异步模式（async/await）' in patterns:
        capability = {
            'name': '高效异步处理能力',
            'description': '整合异步模式，提升任务处理效率',
            'source_patterns': ['异步模式（async/await）'],
            'created_at': datetime.now().isoformat(),
            'status': 'ready'
        }
        new_capabilities.append(capability)
    
    if '事件驱动模式' in patterns:
        capability = {
            'name': '实时事件响应能力',
            'description': '基于事件驱动，实时响应各类事件',
            'source_patterns': ['事件驱动模式'],
            'created_at': datetime.now().isoformat(),
            'status': 'ready'
        }
        new_capabilities.append(capability)
    
    # 2. 基于技能组合创造新能力
    for combo in combinations:
        if combo.get('type') == 'cross_category':
            capability = {
                'name': combo['name'],
                'description': combo['description'],
                'source_skills': combo['skills'],
                'created_at': datetime.now().isoformat(),
                'status': 'ready'
            }
            new_capabilities.append(capability)
    
    return new_capabilities

def save_results(combinations, new_capabilities):
    """保存整合结果"""
    
    # 保存技能组合
    os.makedirs(os.path.dirname(SKILL_COMBINATIONS), exist_ok=True)
    with open(SKILL_COMBINATIONS, 'w', encoding='utf-8') as f:
        json.dump({'combinations': combinations}, f, ensure_ascii=False, indent=2)
    
    # 保存新能力
    with open(NEW_CAPABILITIES, 'w', encoding='utf-8') as f:
        json.dump({'capabilities': new_capabilities}, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    integrate_knowledge()
