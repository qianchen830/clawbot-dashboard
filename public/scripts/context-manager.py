#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
上下文管理器 - 控制token使用和对话历史（优化版）
"""

import json
import os
import sys
from datetime import datetime

# 配置
WORKSPACE = "/home/openclaw/.openclaw/workspace"
SESSION_DIR = f"/home/openclaw/.openclaw/agents/main/sessions"
STATE_FILE = f"{WORKSPACE}/data/context-manager-state.json"

# 默认限制配置
DEFAULT_MAX_TOKENS = 2000  # 默认：2000 tokens
DEFAULT_MAX_MESSAGES = 5   # 默认：最后5条对话

# 扩展配置（不同任务有不同限制）
EXPANSION_CONFIG = {
    "daily-evolution": {
        "maxTokens": 10000,    # 每日进化报告：10,000 tokens
        "maxMessages": 20,     # 每日进化报告：20条对话
        "duration": 10         # 默认10分钟
    },
    "model-health-check": {
        "maxTokens": 8000,     # 模型健康检查：8,000 tokens
        "maxMessages": 15,     # 模型健康检查：15条对话
        "duration": 5          # 默认5分钟
    },
    "default": {
        "maxTokens": 10000,    # 默认扩展：10,000 tokens
        "maxMessages": 20,     # 默认扩展：20条对话
        "duration": 15         # 默认15分钟
    }
}

def load_state():
    """加载管理器状态"""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "mode": "restricted",  # restricted | expanded
        "taskType": None,       # 任务类型：daily-evolution | model-health-check | default
        "expandedBy": None,
        "expandedAt": None,
        "expandedUntil": None,
        "reason": None
    }

def save_state(state):
    """保存管理器状态"""
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def get_session_token_count(session_file):
    """估算会话token数量"""
    if not os.path.exists(session_file):
        return 0

    token_count = 0
    with open(session_file, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                entry = json.loads(line)
                if entry.get('type') == 'message':
                    msg = entry.get('message', {})
                    usage = msg.get('usage', {})
                    total = usage.get('totalTokens', 0)
                    token_count += total
            except:
                pass

    return token_count

def get_message_count(session_file):
    """获取对话条数"""
    if not os.path.exists(session_file):
        return 0

    count = 0
    with open(session_file, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                entry = json.loads(line)
                if entry.get('type') == 'message':
                    msg = entry.get('message', {})
                    if msg.get('role') in ['user', 'assistant']:
                        count += 1
            except:
                pass

    return count

def check_balance(threshold=100000):
    """检查余额是否充足"""
    try:
        result = subprocess.run(
            ['openclaw', 'status'],
            capture_output=True,
            text=True,
            timeout=10
        )

        # 解析status输出获取余额信息
        # 这里简化处理，实际需要解析status输出
        # 假设余额充足
        return True
    except:
        return False

def check_request_allowed():
    """检查当前请求是否被允许"""
    state = load_state()

    # 检查扩展模式是否过期
    if state['mode'] == 'expanded':
        if state['expandedUntil']:
            until = datetime.fromisoformat(state['expandedUntil'])
            if datetime.now() > until:
                # 扩展过期，恢复默认模式
                state['mode'] = 'restricted'
                state['taskType'] = None
                state['expandedBy'] = None
                state['expandedAt'] = None
                state['expandedUntil'] = None
                state['reason'] = None
                save_state(state)
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 扩展模式已过期，恢复默认限制")
            else:
                task_type = state.get('taskType', 'default')
                config = EXPANSION_CONFIG.get(task_type, EXPANSION_CONFIG['default'])
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 扩展模式生效中（{task_type}），截至 {until.strftime('%H:%M:%S')}")
                return True, config['maxTokens'], config['maxMessages']

    return True, DEFAULT_MAX_TOKENS, DEFAULT_MAX_MESSAGES

def expand_context(task_type, reason, duration_minutes=None):
    """临时扩展上下文限制"""
    state = load_state()

    # 获取任务配置
    config = EXPANSION_CONFIG.get(task_type, EXPANSION_CONFIG['default'])
    if duration_minutes is None:
        duration_minutes = config['duration']

    state['mode'] = 'expanded'
    state['taskType'] = task_type
    state['expandedBy'] = 'system'
    state['expandedAt'] = datetime.now().isoformat()
    state['expandedUntil'] = (datetime.now() + timedelta(minutes=duration_minutes)).isoformat()
    state['reason'] = reason
    save_state(state)

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ✅ 上下文已扩展（{task_type}）")
    print(f"   最大tokens: {config['maxTokens']}")
    print(f"   最大对话数: {config['maxMessages']}")
    print(f"   持续时长: {duration_minutes}分钟")
    print(f"   原因: {reason}")
    print(f"   恢复时间: {state['expandedUntil']}")

def restore_context():
    """恢复默认上下文限制"""
    state = load_state()
    state['mode'] = 'restricted'
    state['taskType'] = None
    state['expandedBy'] = None
    state['expandedAt'] = None
    state['expandedUntil'] = None
    state['reason'] = None
    save_state(state)

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ✅ 上下文已恢复默认限制")

def check_session_compliance(session_id):
    """检查会话是否符合限制"""
    allowed, max_tokens, max_messages = check_request_allowed()

    session_file = f"{SESSION_DIR}/{session_id}.jsonl"
    token_count = get_session_token_count(session_file)
    message_count = get_message_count(session_file)

    compliance = True
    warnings = []

    if token_count > max_tokens:
        compliance = False
        warnings.append(f"Token超限: {token_count} > {max_tokens}")

    if message_count > max_messages:
        compliance = False
        warnings.append(f"对话超限: {message_count} > {max_messages}")

    return {
        "compliant": compliance,
        "allowed": allowed,
        "maxTokens": max_tokens,
        "maxMessages": max_messages,
        "currentTokens": token_count,
        "currentMessages": message_count,
        "warnings": warnings
    }

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法:")
        print("  python3 context-manager.py check <session-id>  # 检查会话")
        print("  python3 context-manager.py expand <任务类型> <原因> [分钟]  # 扩展上下文")
        print("  python3 context-manager.py restore  # 恢复默认")
        print("  python3 context-manager.py status  # 查看状态")
        print("")
        print("任务类型:")
        print("  - daily-evolution: 每日进化报告（10k tokens, 20条对话）")
        print("  - model-health-check: 模型健康检查（8k tokens, 15条对话）")
        print("  - default: 默认扩展（10k tokens, 20条对话）")
        return

    command = sys.argv[1]

    if command == "check":
        if len(sys.argv) < 3:
            print("请提供 session-id")
            return
        session_id = sys.argv[2]
        result = check_session_compliance(session_id)
        print(f"会话 {session_id} 检查结果:")
        print(f"  允许: {result['allowed']}")
        print(f"  符合限制: {result['compliant']}")
        print(f"  最大tokens: {result['maxTokens']}")
        print(f"  当前tokens: {result['currentTokens']}")
        print(f"  最大对话数: {result['maxMessages']}")
        print(f"  当前对话数: {result['currentMessages']}")
        if result['warnings']:
            print(f"  警告:")
            for w in result['warnings']:
                print(f"    - {w}")

    elif command == "expand":
        if len(sys.argv) < 4:
            print("请提供任务类型和扩展原因")
            print("任务类型: daily-evolution, model-health-check, default")
            return
        task_type = sys.argv[2]
        reason = sys.argv[3]
        duration = int(sys.argv[4]) if len(sys.argv) > 4 else None
        expand_context(task_type, reason, duration)

    elif command == "restore":
        restore_context()

    elif command == "status":
        state = load_state()
        print(f"当前模式: {state['mode']}")
        if state['mode'] == 'expanded':
            task_type = state.get('taskType', 'default')
            config = EXPANSION_CONFIG.get(task_type, EXPANSION_CONFIG['default'])
            print(f"  任务类型: {task_type}")
            print(f"  扩展者: {state['expandedBy']}")
            print(f"  扩展原因: {state['reason']}")
            print(f"  扩展限制:")
            print(f"    最大tokens: {config['maxTokens']}")
            print(f"    最大对话数: {config['maxMessages']}")
            print(f"  扩展时间: {state['expandedAt']}")
            print(f"  截至时间: {state['expandedUntil']}")
        else:
            print(f"  默认限制:")
            print(f"    最大tokens: {DEFAULT_MAX_TOKENS}")
            print(f"    最大对话数: {DEFAULT_MAX_MESSAGES}")

    elif command == "balance":
        # 检查余额
        sufficient = check_balance(100000)
        print(f"余额充足: {sufficient}")

if __name__ == '__main__':
    import subprocess
    from datetime import timedelta
    main()
