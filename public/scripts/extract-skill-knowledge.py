#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取skill知识点
"""

import os
import json
from datetime import datetime

WORKSPACE = '/home/zzyuzhangxing/.openclaw/workspace'
SKILLS_DIR = f'{WORKSPACE}/skills'
KNOWLEDGE_BASE = f'{WORKSPACE}/data/skill-knowledge-base.json'

def extract_skill_knowledge(skill_name):
    """提取单个skill的知识点"""
    skill_dir = f'{SKILLS_DIR}/{skill_name}'

    if not os.path.exists(skill_dir):
        return None

    knowledge = {
        'name': skill_name,
        'category': infer_category(skill_name),
        'knowledge_points': [],
        'best_practices': [],
        'patterns': [],
        'learned_at': datetime.now().isoformat()
    }

    # 读取SKILL.md（如果存在）
    skill_md = f'{skill_dir}/SKILL.md'
    if os.path.exists(skill_md):
        with open(skill_md, 'r', encoding='utf-8') as f:
            content = f.read()

        # 提取知识点
        knowledge['knowledge_points'] = extract_points(content)

    # 读取主要代码文件
    main_files = ['index.js', 'main.py', 'skill.js', 'skill.py']
    for filename in main_files:
        filepath = f'{skill_dir}/{filename}'
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                code = f.read()

            # 提取最佳实践
            knowledge['best_practices'] = extract_best_practices(code)

            # 提取设计模式
            knowledge['patterns'] = extract_patterns(code)

    return knowledge

def extract_points(content):
    """从文档中提取知识点"""
    points = []

    # 简单实现：提取标题和关键词
    lines = content.split('\n')
    for line in lines:
        if line.startswith('# ') or line.startswith('## '):
            points.append(line.strip('# '))

    return points[:5]  # 最多5个

def extract_best_practices(code):
    """从代码中提取最佳实践"""
    practices = []

    # 简单实现：提取注释中的最佳实践
    lines = code.split('\n')
    for line in lines:
        if 'best practice' in line.lower() or '最佳实践' in line:
            practices.append(line.strip())

    return practices[:3]  # 最多3个

def extract_patterns(code):
    """从代码中提取设计模式"""
    patterns = []

    # 简单实现：检测常见模式
    if 'async' in code and 'await' in code:
        patterns.append('异步模式')
    if 'class' in code:
        patterns.append('面向对象')
    if 'try' in code and 'catch' in code:
        patterns.append('错误处理')

    return patterns

def infer_category(skill_name):
    """推断skill类别"""
    if 'image' in skill_name or 'photo' in skill_name:
        return '视觉创作'
    elif 'video' in skill_name:
        return '视频制作'
    elif 'content' in skill_name or 'writing' in skill_name:
        return '内容创作'
    elif 'social' in skill_name or 'twitter' in skill_name:
        return '社交媒体'
    elif 'analytics' in skill_name or 'data' in skill_name:
        return '数据分析'
    else:
        return '通用'

def save_knowledge(knowledge):
    """保存知识点到知识库"""
    # 读取现有知识库
    if os.path.exists(KNOWLEDGE_BASE):
        with open(KNOWLEDGE_BASE, 'r', encoding='utf-8') as f:
            kb = json.load(f)
    else:
        kb = {'skills': []}

    # 添加新知识
    kb['skills'].append(knowledge)

    # 保存
    os.makedirs(os.path.dirname(KNOWLEDGE_BASE), exist_ok=True)
    with open(KNOWLEDGE_BASE, 'w', encoding='utf-8') as f:
        json.dump(kb, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        skill_name = sys.argv[1]
        knowledge = extract_skill_knowledge(skill_name)
        if knowledge:
            save_knowledge(knowledge)
            print(f"✅ 已提取 {skill_name} 的知识点")
        else:
            print(f"❌ 无法提取 {skill_name} 的知识点")
    else:
        print("用法: python3 extract-skill-knowledge.py <skill-name>")
