#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
模型健康检查脚本（带飞书确认 + 余额检查）
"""

import subprocess
from datetime import datetime

def check_model_health():
    """检查模型健康状态"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始模型健康检查")

    # 使用扩展的上下文执行（需要飞书确认）
    result = subprocess.run([
        'python3',
        '/home/openclaw/.openclaw/workspace/scripts/expanded-task.py',
        'model-health-check',
        '模型健康检查',
        'python3',
        '/home/openclaw/.openclaw/workspace/scripts/model-health-check.py'
    ], capture_output=True, text=True)

    if result.returncode == 0:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ✅ 模型健康检查完成")
        return True
    else:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ 模型健康检查失败或被拒绝")
        return False

if __name__ == '__main__':
    success = check_model_health()
    exit(0 if success else 1)
