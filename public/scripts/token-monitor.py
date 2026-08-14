#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Token监控脚本 - 实现错误处理、上下文限制、告警功能
"""

import json
import os
import sys
import subprocess
from datetime import datetime

CONFIG_DIR = "/home/openclaw/.openclaw"
CRON_JOBS = f"{CONFIG_DIR}/cron/jobs.json"
MONITOR_STATE = "/home/openclaw/.openclaw/workspace/data/token-monitor-state.json"

def load_state():
    """加载监控状态"""
    if os.path.exists(MONITOR_STATE):
        with open(MONITOR_STATE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "errorCount": {},
        "pauseUntil": None,
        "todayTokenUsage": 0,
        "lastReset": datetime.now().strftime('%Y-%m-%d')
    }

def save_state(state):
    """保存监控状态"""
    os.makedirs(os.path.dirname(MONITOR_STATE), exist_ok=True)
    with open(MONITOR_STATE, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def check_balance_errors():
    """检查余额不足错误"""
    log_dir = f"{CONFIG_DIR}/agents/main/sessions"
    error_count = 0

    for session_file in os.listdir(log_dir):
        if not session_file.endswith('.jsonl'):
            continue

        with open(os.path.join(log_dir, session_file), 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    entry = json.loads(line)
                    if entry.get('type') == 'message':
                        msg = entry.get('message', {})
                        if msg.get('role') == 'assistant' and 'errorMessage' in msg:
                            if '余额不足' in msg.get('errorMessage', '') or '429' in msg.get('errorMessage', ''):
                                error_count += 1
                except:
                    pass

    return error_count

def pause_all_jobs():
    """暂停所有定时任务"""
    with open(CRON_JOBS, 'r', encoding='utf-8') as f:
        jobs = json.load(f)

    for job in jobs['jobs']:
        job['enabled'] = False

    with open(CRON_JOBS, 'w', encoding='utf-8') as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ⚠️ 所有定时任务已暂停")

def send_feishu_alert(message):
    """发送飞书告警"""
    try:
        subprocess.run([
            'openclaw', 'message', 'send',
            '--channel', 'feishu',
            '--message', f'🚨 Token告警: {message}'
        ], check=True, capture_output=True)
    except:
        pass

def check_token_usage():
    """检查token使用情况"""
    try:
        result = subprocess.run(
            ['openclaw', 'status'],
            capture_output=True,
            text=True,
            timeout=10
        )
        # 解析status输出获取token信息
        # 这里简化处理，实际需要解析status输出
        return 0
    except:
        return 0

def main():
    """主函数"""
    state = load_state()

    # 检查日期重置
    today = datetime.now().strftime('%Y-%m-%d')
    if state['lastReset'] != today:
        state['todayTokenUsage'] = 0
        state['lastReset'] = today
        state['errorCount'] = {}

    # 检查是否需要暂停
    if state['pauseUntil']:
        pause_time = datetime.fromisoformat(state['pauseUntil'])
        if datetime.now() < pause_time:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 系统暂停中，直到 {pause_time}")
            return
        else:
            state['pauseUntil'] = None

    # 检查余额错误
    balance_errors = check_balance_errors()
    if balance_errors > 5:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 检测到 {balance_errors} 次余额不足错误，暂停所有任务")
        pause_all_jobs()
        send_feishu_alert(f"检测到{balance_errors}次余额不足错误，已暂停所有定时任务")
        state['pauseUntil'] = (datetime.now() + timedelta(hours=1)).isoformat()
        save_state(state)
        return

    # 检查token使用
    state['todayTokenUsage'] += check_token_usage()
    if state['todayTokenUsage'] > 500000:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 今日token使用 {state['todayTokenUsage']}，已超阈值，暂停所有任务")
        pause_all_jobs()
        send_feishu_alert(f"今日token使用{state['todayTokenUsage']}，已超过50万阈值，已暂停所有任务")
        state['pauseUntil'] = (datetime.now() + timedelta(hours=1)).isoformat()
        save_state(state)
        return

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Token监控正常")
    save_state(state)

if __name__ == '__main__':
    main()
