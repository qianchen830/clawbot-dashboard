#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
迁移脚本：将Markdown笔记导入SQLite数据库
"""

import os
import re
from pathlib import Path
from datetime import datetime
from database import get_db

def extract_title(content: str, filename: str) -> str:
    """从内容或文件名提取标题"""
    # 尝试从第一个标题提取
    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    if title_match:
        return title_match.group(1).strip()
    
    # 从文件名提取
    return filename.replace('.md', '').replace('-', ' ').title()

def detect_category(filename: str) -> str:
    """检测笔记分类"""
    filename_lower = filename.lower()
    
    if any(kw in filename_lower for kw in ['kingdee', 'erp', 'ppt', '蓝图', '调研', '交付', '实施', '售前']):
        return 'kingdee'
    elif any(kw in filename_lower for kw in ['video', '视频', '短视频', '抖音', 'bilibili', 'kling', 'ai-video']):
        return 'ai-video'
    elif any(kw in filename_lower for kw in ['business', '商业', '运营', '变现', '团队', '管理', '营销']):
        return 'business'
    elif any(kw in filename_lower for kw in ['ai', 'agent', 'mlops', 'multimodal', '微调', 'finetune', 'llm']):
        return 'ai-tech'
    elif any(kw in filename_lower for kw in ['data', '数据', 'etl', 'warehouse']):
        return 'data-engineering'
    elif any(kw in filename_lower for kw in ['security', '安全', 'auth', '权限']):
        return 'security'
    elif any(kw in filename_lower for kw in ['test', '测试', 'ci', 'cd', 'deploy', '部署']):
        return 'devops'
    elif any(kw in filename_lower for kw in ['openclaw', 'skill', '框架', '架构']):
        return 'openclaw'
    else:
        return 'other'

def extract_tags(content: str) -> list:
    """从内容提取标签"""
    tags = []
    
    # 检测常见关键词
    keywords = {
        'PPT': ['ppt', '演示', '汇报'],
        'Python': ['python', '脚本'],
        'AI': ['ai', '人工智能', '机器学习'],
        '视频': ['视频', '短视频', '视频制作'],
        '自动化': ['自动化', '脚本', '批量'],
        '优化': ['优化', '性能', '提升'],
    }
    
    content_lower = content.lower()
    for tag, kw_list in keywords.items():
        if any(kw in content_lower for kw in kw_list):
            tags.append(tag)
    
    return tags[:5]  # 最多5个标签

def migrate_notes():
    """迁移笔记到数据库"""
    db = get_db()
    memory_dir = Path('~/.openclaw/workspace/memory').expanduser()
    
    print(f"开始迁移笔记...")
    print(f"笔记目录: {memory_dir}")
    
    migrated = 0
    skipped = 0
    errors = 0
    
    for md_file in memory_dir.glob('*.md'):
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 跳过空文件
            if not content.strip():
                skipped += 1
                continue
            
            # 提取信息
            title = extract_title(content, md_file.name)
            category = detect_category(md_file.name)
            tags = extract_tags(content)
            word_count = len(content.split())
            
            # 检查是否已存在
            existing = db.search_notes(md_file.stem)
            if existing:
                skipped += 1
                continue
            
            # 添加到数据库
            note_id = db.add_note(
                title=title,
                content=content[:50000],  # 限制内容长度
                category=category,
                tags=tags,
                file_path=str(md_file)
            )
            
            migrated += 1
            print(f"✅ {md_file.name} -> {category} ({word_count} words)")
            
        except Exception as e:
            errors += 1
            print(f"❌ {md_file.name}: {e}")
    
    # 记录活动
    db.log_activity('migration', 'notes_to_db', {
        'migrated': migrated,
        'skipped': skipped,
        'errors': errors
    })
    
    print(f"\n迁移完成:")
    print(f"  - 成功: {migrated}")
    print(f"  - 跳过: {skipped}")
    print(f"  - 错误: {errors}")
    
    # 显示统计
    stats = db.get_stats()
    print(f"\n数据库统计:")
    print(f"  - 总笔记数: {stats['notes_count']}")
    print(f"  - 数据库大小: {stats['db_size'] / 1024:.1f} KB")

if __name__ == '__main__':
    migrate_notes()
