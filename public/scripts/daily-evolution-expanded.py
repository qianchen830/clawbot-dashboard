#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
每日进化报告脚本（带飞书确认 + 余额检查）
"""

import subprocess
from datetime import datetime

def generate_evolution_report():
    """生成每日进化报告"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始生成每日进化报告")

    # 使用扩展的上下文执行（需要飞书确认）
    result = subprocess.run([
        'python3',
        '/home/openclaw/.openclaw/workspace/scripts/expanded-task.py',
        'daily-evolution',
        '生成每日进化报告',
        'python3',
        '/home/openclaw/.openclaw/workspace/scripts/daily-evolution.py'
    ], capture_output=True, text=True)

    if result.returncode == 0:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ✅ 每日进化报告生成完成")
        return True
    else:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ 每日进化报告生成失败或被拒绝")
        return False

if __name__ == '__main__':
    success = generate_evolution_report()
    exit(0 if success else 1)
