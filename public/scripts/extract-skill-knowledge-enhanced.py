#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增强版 - Skill知识提取脚本
提取更深入的知识点、最佳实践、设计模式、API接口等
"""

import os
import json
import re
from datetime import datetime
from pathlib import Path

WORKSPACE = '/home/zzyuzhangxing/.openclaw/workspace'
SKILLS_DIR = f'{WORKSPACE}/skills'
KNOWLEDGE_BASE = f'{WORKSPACE}/data/skill-knowledge-base.json'

def extract_skill_knowledge(skill_name):
    """提取单个skill的深度知识"""
    skill_dir = f'{SKILLS_DIR}/{skill_name}'

    if not os.path.exists(skill_dir):
        return None

    knowledge = {
        'name': skill_name,
        'category': infer_category(skill_name),
        'knowledge_points': [],
        'best_practices': [],
        'patterns': [],
        'api_interfaces': [],
        'config_params': [],
        'use_cases': [],
        'dependencies': [],
        'learned_at': datetime.now().isoformat()
    }

    # 1. 读取SKILL.md（如果存在）
    skill_md = f'{skill_dir}/SKILL.md'
    if os.path.exists(skill_md):
        with open(skill_md, 'r', encoding='utf-8') as f:
            content = f.read()

        # 提取知识点
        knowledge['knowledge_points'] = extract_points(content)
        
        # 提取使用场景
        knowledge['use_cases'] = extract_use_cases(content)
        
        # 提取最佳实践
        knowledge['best_practices'] = extract_best_practices_from_doc(content)

    # 2. 读取主要代码文件
    code_files = ['index.js', 'main.py', 'skill.js', 'skill.py', 'index.ts', 'main.ts']
    for filename in code_files:
        filepath = f'{skill_dir}/{filename}'
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                code = f.read()

            # 提取设计模式
            patterns = extract_patterns(code)
            if patterns:
                knowledge['patterns'].extend(patterns)

            # 提取API接口
            apis = extract_api_interfaces(code)
            if apis:
                knowledge['api_interfaces'].extend(apis)

            # 提取配置参数
            configs = extract_config_params(code)
            if configs:
                knowledge['config_params'].extend(configs)

            # 提取最佳实践
            practices = extract_best_practices(code)
            if practices:
                knowledge['best_practices'].extend(practices)

            # 提取依赖
            deps = extract_dependencies(code)
            if deps:
                knowledge['dependencies'].extend(deps)

    # 3. 读取package.json或requirements.txt
    package_json = f'{skill_dir}/package.json'
    if os.path.exists(package_json):
        with open(package_json, 'r', encoding='utf-8') as f:
            pkg = json.load(f)
            if 'dependencies' in pkg:
                knowledge['dependencies'].extend(list(pkg['dependencies'].keys()))

    # 去重
    knowledge['patterns'] = list(set(knowledge['patterns']))
    knowledge['api_interfaces'] = list(set(knowledge['api_interfaces']))
    knowledge['best_practices'] = list(set(knowledge['best_practices']))
    knowledge['dependencies'] = list(set(knowledge['dependencies']))

    return knowledge

def extract_points(content):
    """从文档中深入提取知识点"""
    points = []
    
    # 1. 提取所有标题（## 和 ###）
    lines = content.split('\n')
    for line in lines:
        if line.startswith('## ') or line.startswith('### '):
            point = line.strip('# ').strip()
            if point and len(point) > 3:
                points.append(point)
    
    # 2. 提取关键词段落
    keywords = ['功能', '特性', 'features', 'usage', '使用', '说明', 'description']
    for line in lines:
        for keyword in keywords:
            if keyword in line.lower() and len(line) > 10:
                # 提取这一行
                clean_line = line.strip()
                if clean_line and not clean_line.startswith('#'):
                    points.append(clean_line[:100])  # 限制长度
                break
    
    return points[:10]  # 最多10个

def extract_use_cases(content):
    """提取使用场景"""
    use_cases = []
    
    # 查找使用场景相关段落
    patterns = [
        r'使用场景[：:]\s*(.*?)(?=\n\n|\n#|$)',
        r'Use Cases[：:]\s*(.*?)(?=\n\n|\n#|$)',
        r'When to Use[：:]\s*(.*?)(?=\n\n|\n#|$)',
        r'何时使用[：:]\s*(.*?)(?=\n\n|\n#|$)',
        r'Usage[：:]\s*(.*?)(?=\n\n|\n#|$)',
        r'使用方法[：:]\s*(.*?)(?=\n\n|\n#|$)'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
        for match in matches:
            # 提取前几行
            lines = match.strip().split('\n')
            for line in lines[:5]:
                clean = line.strip()
                # 移除markdown标记
                clean = re.sub(r'^[#\-\*]\s*', '', clean)
                if clean and len(clean) > 5 and not clean.startswith('```'):
                    use_cases.append(clean[:150])
    
    # 如果没找到，从Features中提取
    if not use_cases:
        features_match = re.search(r'Features[：:]\s*(.*?)(?=\n\n|\n#|$)', content, re.DOTALL | re.IGNORECASE)
        if features_match:
            lines = features_match.group(1).strip().split('\n')
            for line in lines[:5]:
                clean = line.strip()
                clean = re.sub(r'^[#\-\*]\s*', '', clean)
                if clean and len(clean) > 5:
                    use_cases.append(clean[:150])
    
    return use_cases[:8]

def extract_best_practices_from_doc(content):
    """从文档中提取最佳实践"""
    practices = []
    
    # 查找最佳实践相关段落
    patterns = [
        r'最佳实践[：:](.*?)(?=\n\n|\n#|$)',
        r'Best Practices[：:](.*?)(?=\n\n|\n#|$)',
        r'注意事项[：:](.*?)(?=\n\n|\n#|$)',
        r'Notes[：:](.*?)(?=\n\n|\n#|$)'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
        for match in matches:
            sentences = match.strip().split('\n')
            for sentence in sentences[:3]:
                clean = sentence.strip()
                if clean and len(clean) > 5:
                    practices.append(clean[:150])
    
    return practices[:5]

def extract_patterns(code):
    """从代码中深入提取设计模式"""
    patterns = []
    
    # 1. 异步模式
    if 'async' in code and 'await' in code:
        patterns.append('异步模式（async/await）')
    
    # 2. 面向对象
    if 'class ' in code:
        patterns.append('面向对象编程（OOP）')
    
    # 3. 错误处理
    if 'try' in code and ('catch' in code or 'except' in code):
        patterns.append('异常处理机制')
    
    # 4. 回调模式
    if 'callback' in code.lower() or '=> {' in code:
        patterns.append('回调模式')
    
    # 5. 事件驱动
    if 'event' in code.lower() or 'emit(' in code or 'on(' in code:
        patterns.append('事件驱动模式')
    
    # 6. 工厂模式
    if 'factory' in code.lower() or 'create' in code.lower():
        patterns.append('工厂模式')
    
    # 7. 单例模式
    if 'singleton' in code.lower() or 'getInstance' in code:
        patterns.append('单例模式')
    
    # 8. Promise模式
    if 'Promise' in code or '.then(' in code:
        patterns.append('Promise模式')
    
    # 9. 配置模式
    if 'config' in code.lower() or 'settings' in code.lower():
        patterns.append('配置管理模式')
    
    # 10. 插件模式
    if 'plugin' in code.lower() or 'middleware' in code.lower():
        patterns.append('插件/中间件模式')
    
    return patterns

def extract_api_interfaces(code):
    """提取API接口"""
    apis = []
    
    # 1. 提取函数定义
    func_patterns = [
        r'function\s+(\w+)\s*\(',  # JavaScript function
        r'const\s+(\w+)\s*=\s*(?:async\s*)?\(.*?\)\s*=>',  # Arrow function
        r'def\s+(\w+)\s*\(',  # Python function
        r'async\s+(\w+)\s*\(',  # Async function
        r'export\s+(?:async\s+)?function\s+(\w+)',  # Export function
    ]
    
    for pattern in func_patterns:
        matches = re.findall(pattern, code)
        apis.extend(matches[:5])
    
    # 2. 提取类方法
    class_methods = re.findall(r'\.(\w+)\s*=\s*(?:async\s*)?\(', code)
    apis.extend(class_methods[:5])
    
    # 3. 提取exports
    exports = re.findall(r'exports\.(\w+)', code)
    apis.extend(exports[:5])
    
    # 4. 提取module.exports
    module_exports = re.findall(r'module\.exports\s*=\s*{([^}]+)}', code, re.DOTALL)
    for match in module_exports:
        methods = re.findall(r'(\w+)\s*:', match)
        apis.extend(methods[:5])
    
    return list(set(apis))[:15]

def extract_config_params(code):
    """提取配置参数"""
    configs = []
    
    # 1. 提取环境变量
    env_vars = re.findall(r'process\.env\.(\w+)', code)
    configs.extend(env_vars[:5])
    
    # 2. 提取配置对象
    config_pattern = r'const\s+(\w+Config|\w+Settings)\s*='
    config_objs = re.findall(config_pattern, code)
    configs.extend(config_objs[:3])
    
    return configs[:8]

def extract_best_practices(code):
    """从代码注释中提取最佳实践"""
    practices = []
    
    # 1. 提取注释中的最佳实践
    comment_patterns = [
        r'//\s*(.*?best.*?practice.*?)\n',
        r'#\s*(.*?best.*?practice.*?)\n',
        r'/\*\*(.*?)\*/',
        r'//\s*(.*?注意.*?)\n',
        r'#\s*(.*?注意.*?)\n',
    ]
    
    for pattern in comment_patterns:
        matches = re.findall(pattern, code, re.IGNORECASE | re.DOTALL)
        for match in matches:
            clean = match.strip()
            if clean and len(clean) > 10:
                practices.append(clean[:150])
    
    return practices[:5]

def extract_dependencies(code):
    """提取依赖"""
    deps = []
    
    # 1. 提取import/require
    import_patterns = [
        r"require\(['\"](.*?)['\"]\)",
        r"import.*?from\s+['\"](.*?)['\"]",
        r"from\s+(\w+)\s+import",
    ]
    
    for pattern in import_patterns:
        matches = re.findall(pattern, code)
        deps.extend(matches[:5])
    
    return deps[:10]

def infer_category(skill_name):
    """推断skill类别"""
    name_lower = skill_name.lower()
    
    if any(word in name_lower for word in ['image', 'photo', 'visual', 'picture']):
        return '视觉创作'
    elif any(word in name_lower for word in ['video', 'remotion', 'demo']):
        return '视频制作'
    elif any(word in name_lower for word in ['content', 'writing', 'copy', 'blog', 'seo']):
        return '内容创作'
    elif any(word in name_lower for word in ['social', 'twitter', 'weibo', 'instagram', 'engagement']):
        return '社交媒体'
    elif any(word in name_lower for word in ['analytics', 'data', 'report', 'metric']):
        return '数据分析'
    elif any(word in name_lower for word in ['agent', 'automation', 'workflow']):
        return '自动化代理'
    elif any(word in name_lower for word in ['docker', 'k8s', 'terraform', 'aws']):
        return 'DevOps'
    else:
        return '通用工具'

def save_knowledge(knowledge):
    """保存知识点到知识库"""
    # 读取现有知识库
    if os.path.exists(KNOWLEDGE_BASE):
        with open(KNOWLEDGE_BASE, 'r', encoding='utf-8') as f:
            kb = json.load(f)
    else:
        kb = {'skills': []}

    # 检查是否已存在
    existing = False
    for i, skill in enumerate(kb['skills']):
        if skill['name'] == knowledge['name']:
            kb['skills'][i] = knowledge
            existing = True
            break
    
    if not existing:
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
            print(f"✅ 已提取 {skill_name} 的深度知识")
            print(f"  知识点: {len(knowledge['knowledge_points'])}个")
            print(f"  最佳实践: {len(knowledge['best_practices'])}个")
            print(f"  设计模式: {len(knowledge['patterns'])}个")
            print(f"  API接口: {len(knowledge['api_interfaces'])}个")
            print(f"  使用场景: {len(knowledge['use_cases'])}个")
        else:
            print(f"❌ 无法提取 {skill_name} 的知识点")
    else:
        print("用法: python3 extract-skill-knowledge-enhanced.py <skill-name>")
