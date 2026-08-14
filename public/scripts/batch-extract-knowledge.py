#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量提取所有已安装技能的知识点
"""

import os
import subprocess
import json

WORKSPACE = '/home/zzyuzhangxing/.openclaw/workspace'
SKILLS_DIR = f'{WORKSPACE}/skills'
KNOWLEDGE_BASE = f'{WORKSPACE}/data/skill-knowledge-base.json'
EXTRACT_SCRIPT = f'{WORKSPACE}/scripts/extract-skill-knowledge-enhanced.py'

def get_installed_skills():
    """获取所有已安装的技能"""
    if not os.path.exists(SKILLS_DIR):
        return []
    
    skills = []
    for item in os.listdir(SKILLS_DIR):
        skill_dir = os.path.join(SKILLS_DIR, item)
        if os.path.isdir(skill_dir):
            skills.append(item)
    
    return skills

def get_extracted_skills():
    """获取已提取知识的技能"""
    if not os.path.exists(KNOWLEDGE_BASE):
        return []
    
    with open(KNOWLEDGE_BASE, 'r', encoding='utf-8') as f:
        kb = json.load(f)
    
    return [s['name'] for s in kb.get('skills', [])]

def batch_extract():
    """批量提取所有技能的知识"""
    
    # 获取所有已安装技能
    all_skills = get_installed_skills()
    print(f"📚 已安装技能: {len(all_skills)}个")
    
    # 获取已提取技能
    extracted_skills = get_extracted_skills()
    print(f"✅ 已提取知识: {len(extracted_skills)}个")
    
    # 计算待提取技能
    to_extract = [s for s in all_skills if s not in extracted_skills]
    print(f"⏳ 待提取知识: {len(to_extract)}个")
    
    if not to_extract:
        print("✅ 所有技能知识已提取完毕")
        return
    
    # 批量提取
    success_count = 0
    failed_count = 0
    
    for i, skill in enumerate(to_extract, 1):
        print(f"\n[{i}/{len(to_extract)}] 提取: {skill}")
        
        try:
            result = subprocess.run(
                ['python3', EXTRACT_SCRIPT, skill],
                cwd=WORKSPACE,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"  ✅ 成功")
                success_count += 1
            else:
                print(f"  ❌ 失败: {result.stderr[:100]}")
                failed_count += 1
        except Exception as e:
            print(f"  ❌ 异常: {str(e)[:100]}")
            failed_count += 1
        
        # 每提取10个技能暂停1秒，避免过载
        if i % 10 == 0:
            import time
            time.sleep(1)
    
    print(f"\n============================================================")
    print(f"✅ 批量提取完成")
    print(f"  成功: {success_count}个")
    print(f"  失败: {failed_count}个")
    print(f"============================================================")

if __name__ == '__main__':
    batch_extract()
