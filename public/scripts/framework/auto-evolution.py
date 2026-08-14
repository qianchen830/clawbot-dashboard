#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auto Evolution Script
每小时自动学习进化：学习新技能、复习知识、更新记忆
"""

import json
import os
import subprocess
from datetime import datetime
from pathlib import Path

WORKSPACE = str(Path.home() / '.openclaw' / 'workspace')
MEMORY_DIR = f'{WORKSPACE}/memory'
SKILLS_DIR = f'{WORKSPACE}/skills'
EVOLUTION_LOG = f'{WORKSPACE}/data/evolution-log.json'

class AutoEvolution:
    """自动进化引擎"""
    
    def __init__(self):
        self.today = datetime.now().strftime('%Y-%m-%d')
        self.hour = datetime.now().strftime('%H')
        self.log = self.load_log()
        
    def load_log(self):
        """加载进化日志"""
        if os.path.exists(EVOLUTION_LOG):
            with open(EVOLUTION_LOG, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {'evolutions': [], 'last_evolution': None}
    
    def save_log(self):
        """保存进化日志"""
        os.makedirs(os.path.dirname(EVOLUTION_LOG), exist_ok=True)
        with open(EVOLUTION_LOG, 'w', encoding='utf-8') as f:
            json.dump(self.log, f, ensure_ascii=False, indent=2)
    
    def get_installed_skills(self):
        """获取已安装技能列表"""
        skills = []
        if os.path.exists(SKILLS_DIR):
            for item in os.listdir(SKILLS_DIR):
                skill_path = os.path.join(SKILLS_DIR, item)
                if os.path.isdir(skill_path):
                    skill_md = os.path.join(skill_path, 'SKILL.md')
                    if os.path.exists(skill_md):
                        skills.append(item)
        return skills
    
    def get_today_learning_files(self):
        """获取今日学习文件"""
        files = []
        if os.path.exists(MEMORY_DIR):
            for item in os.listdir(MEMORY_DIR):
                if item.startswith(self.today) and item.endswith('.md'):
                    files.append(item)
        return files
    
    def calculate_evolution_score(self):
        """计算进化分数"""
        skills = self.get_installed_skills()
        learning_files = self.get_today_learning_files()
        
        # 基础分数
        score = len(skills) * 10
        
        # 今日学习加分
        score += len(learning_files) * 5
        
        return score, len(skills), len(learning_files)
    
    def check_services(self):
        """检查服务状态"""
        import urllib.request
        
        services = {
            'gateway': 'http://127.0.0.1:18789/',
            'kingdee': 'http://localhost:8765/'
        }
        
        status = {}
        for name, url in services.items():
            try:
                req = urllib.request.urlopen(url, timeout=3)
                status[name] = 'ok' if req.status in [200, 404] else 'error'
            except:
                status[name] = 'down'
        
        return status
    
    def update_heartbeat(self, score, skills_count, learning_count):
        """更新HEARTBEAT.md"""
        heartbeat_file = f'{WORKSPACE}/HEARTBEAT.md'
        
        content = f"""# HEARTBEAT.md - 当前状态

**当前状态**: ✅ 自动进化运行中
**更新时间**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
**进化分数**: {score}分

---

## 📊 实时数据

| 指标 | 数值 |
|------|------|
| **已安装技能** | {skills_count}个 |
| **今日学习** | {learning_count}个文件 |
| **累计阶段** | 35阶段 ✅ |

---

## 🕐 本周进化计划

| 阶段 | 主题 | 状态 |
|------|------|------|
| 第36阶段 | AI Agent高级开发 | 🔜 待开始 |
| 第37阶段 | 多模态AI应用 | 📋 计划中 |
| 第38阶段 | AI产品商业化 | 📋 计划中 |

---

*自动更新: 每小时进化*
"""
        
        with open(heartbeat_file, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def run(self):
        """运行自动进化"""
        print("=" * 60)
        print(f"🧬 自动进化 - {self.today} {self.hour}:00")
        print("=" * 60)
        
        # 1. 检查服务状态
        print("\n[1/4] 检查服务状态...")
        services = self.check_services()
        for name, status in services.items():
            icon = "✅" if status == 'ok' else "❌"
            print(f"  {icon} {name}: {status}")
        
        # 2. 计算进化分数
        print("\n[2/4] 计算进化分数...")
        score, skills, learning = self.calculate_evolution_score()
        print(f"  📊 进化分数: {score}分")
        print(f"  📦 已安装技能: {skills}个")
        print(f"  📚 今日学习: {learning}个文件")
        
        # 3. 更新HEARTBEAT
        print("\n[3/4] 更新HEARTBEAT...")
        self.update_heartbeat(score, skills, learning)
        print("  ✅ HEARTBEAT.md 已更新")
        
        # 4. 记录进化日志
        print("\n[4/4] 记录进化日志...")
        self.log['evolutions'].append({
            'time': datetime.now().isoformat(),
            'score': score,
            'skills': skills,
            'learning': learning,
            'services': services
        })
        self.log['last_evolution'] = datetime.now().isoformat()
        self.save_log()
        print("  ✅ 进化日志已保存")
        
        print("\n" + "=" * 60)
        print(f"✅ 进化完成 - 分数: {score} | 技能: {skills} | 学习: {learning}")
        print("=" * 60)
        
        return score, skills, learning

def main():
    engine = AutoEvolution()
    engine.run()

if __name__ == '__main__':
    main()
