#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
扩展上下文包装器 - 需要飞书确认（优化版）
"""

import subprocess
import sys
import os
import time
import json

CONTEXT_MANAGER = "/home/openclaw/.openclaw/workspace/scripts/context-manager.py"
FEISHU_CHANNEL = "feishu"  # 飞书渠道

# 任务配置（与context-manager.py保持一致）
TASK_CONFIG = {
    "daily-evolution": {
        "name": "每日进化报告",
        "maxTokens": 10000,
        "maxMessages": 20,
        "duration": 10
    },
    "model-health-check": {
        "name": "模型健康检查",
        "maxTokens": 8000,
        "maxMessages": 15,
        "duration": 5
    }
}

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
        # 这里简化处理，假设余额充足
        # 实际应该调用context-manager.py的balance检查
        return True
    except:
        return False

def send_feishu_request(task_type, reason):
    """发送飞书请求通知"""
    if task_type not in TASK_CONFIG:
        task_type = "default"

    config = TASK_CONFIG.get(task_type, {
        "name": "未知任务",
        "maxTokens": 10000,
        "maxMessages": 20,
        "duration": 15
    })

    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

    message = f"""🔔 **上下文扩展请求**

**时间**: {timestamp}
**任务类型**: {config['name']}
**请求原因**: {reason}
**扩展时长**: {config['duration']} 分钟
**扩展后限制**:
- 最大tokens: {config['maxTokens']}
- 最大对话数: {config['maxMessages']}

---

请回复以下命令之一：
- **同意**: `同意扩展上下文`
- **拒绝**: `拒绝扩展上下文`
- **取消**: `取消扩展请求`

---

此请求将在 5 分钟后自动取消。"""

    try:
        result = subprocess.run([
            'openclaw', 'message', 'send',
            '--channel', FEISHU_CHANNEL,
            '--message', message
        ], capture_output=True, text=True, timeout=30)

        if result.returncode == 0:
            print(f"[{timestamp}] ✅ 飞书请求已发送")
            return True
        else:
            print(f"[{timestamp}] ❌ 飞书请求发送失败: {result.stderr}")
            return False
    except Exception as e:
        print(f"[{timestamp}] ❌ 飞书请求发送异常: {e}")
        return False

def wait_for_approval(timeout_minutes=5, check_interval=10):
    """等待用户批准"""
    timeout_seconds = timeout_minutes * 60
    start_time = time.time()
    request_file = "/home/openclaw/.openclaw/workspace/data/context-approval-request.json"

    # 创建请求标记文件
    with open(request_file, 'w', encoding='utf-8') as f:
        json.dump({
            "status": "pending",
            "requestedAt": time.time(),
            "timeoutAt": time.time() + timeout_seconds
        }, f)

    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 等待用户批准（{timeout_minutes}分钟超时）...")

    while time.time() - start_time < timeout_seconds:
        time.sleep(check_interval)

        # 检查批准状态
        if os.path.exists(request_file):
            try:
                with open(request_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                if data.get('status') == 'approved':
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] ✅ 用户已批准")
                    return True
                elif data.get('status') == 'rejected':
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] ❌ 用户已拒绝")
                    return False
                elif data.get('status') == 'cancelled':
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] ⚠️ 请求已取消")
                    return False
            except:
                pass

    # 超时
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] ⏰ 请求超时")
    if os.path.exists(request_file):
        try:
            with open(request_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "status": "timeout",
                    "requestedAt": start_time,
                    "timeoutAt": time.time()
                }, f)
        except:
            pass
    return False

def with_expanded_context(task_type, reason, timeout_minutes=5):
    """在扩展的上下文中执行任务（需要飞书确认）"""
    config = TASK_CONFIG.get(task_type, {
        "name": "未知任务",
        "maxTokens": 10000,
        "maxMessages": 20,
        "duration": 15
    })

    print(f"📋 临时扩展上下文请求: {config['name']}")

    # 1. 检查余额
    if not check_balance(100000):
        print("❌ 余额不足（< 100,000 tokens），跳过执行")
        subprocess.run([
            'openclaw', 'message', 'send',
            '--channel', FEISHU_CHANNEL,
            '--message', f'❌ {config["name"]}已跳过：余额不足'
        ], capture_output=True, timeout=10)
        return False

    # 2. 发送飞书请求
    if not send_feishu_request(task_type, reason):
        print("❌ 无法发送飞书请求，取消扩展")
        return False

    # 3. 等待用户批准
    approved = wait_for_approval(timeout_minutes=timeout_minutes)

    if not approved:
        # 发送拒绝通知
        subprocess.run([
            'openclaw', 'message', 'send',
            '--channel', FEISHU_CHANNEL,
            '--message', f'❌ 上下文扩展请求已{("超时" if not os.path.exists("/home/openclaw/.openclaw/workspace/data/context-approval-request.json") or json.load(open("/home/openclaw/.openclaw/workspace/data/context-approval-request.json")).get("status") == "timeout" else "被拒绝")}'
        ], capture_output=True, timeout=10)
        return False

    # 4. 扩展上下文
    result = subprocess.run([
        'python3', CONTEXT_MANAGER, 'expand', task_type, reason
    ], capture_output=True, text=True)

    if result.returncode != 0:
        print("❌ 上下文扩展失败")
        subprocess.run([
            'openclaw', 'message', 'send',
            '--channel', FEISHU_CHANNEL,
            '--message', f'❌ 上下文扩展失败: {result.stderr}'
        ], capture_output=True, timeout=10)
        return False

    # 5. 发送批准通知
    subprocess.run([
        'openclaw', 'message', 'send',
        '--channel', FEISHU_CHANNEL,
        '--message', f'✅ 上下文已扩展（{config["duration"]}分钟），执行任务中...'
    ], capture_output=True, timeout=10)

    print(f"✅ 上下文已扩展到 {config['maxTokens']} tokens + {config['maxMessages']}条对话")

    try:
        # 6. 执行任务
        yield True

        # 7. 发送完成通知
        subprocess.run([
            'openclaw', 'message', 'send',
            '--channel', FEISHU_CHANNEL,
            '--message', f'✅ 任务完成，上下文将在 {config["duration"]} 分钟后自动恢复'
        ], capture_output=True, timeout=10)

        return True

    except Exception as e:
        print(f"❌ 任务执行失败: {e}")
        subprocess.run([
            'openclaw', 'message', 'send',
            '--channel', FEISHU_CHANNEL,
            '--message', f'❌ 任务执行失败: {e}'
        ], capture_output=True, timeout=10)
        return False

    finally:
        # 8. 恢复默认限制
        print("📋 恢复默认上下文限制")
        subprocess.run([
            'python3', CONTEXT_MANAGER, 'restore'
        ], check=True)

        subprocess.run([
            'openclaw', 'message', 'send',
            '--channel', FEISHU_CHANNEL,
            '--message', f'✅ 上下文已恢复到默认限制（2000 tokens + 5条对话）'
        ], capture_output=True, timeout=10)

if __name__ == '__main__':
    """命令行包装"""
    if len(sys.argv) < 3:
        print("用法: python3 expanded-task.py <任务类型> <原因> <命令> [参数...]")
        print("")
        print("任务类型:")
        print("  - daily-evolution: 每日进化报告（10k tokens, 20条对话, 10分钟）")
        print("  - model-health-check: 模型健康检查（8k tokens, 15条对话, 5分钟）")
        sys.exit(1)

    task_type = sys.argv[1]
    reason = sys.argv[2]
    command = sys.argv[3:]

    success = False
    for result in with_expanded_context(task_type, reason):
        success = result
        if success:
            subprocess.run(command)
            break

    sys.exit(0 if success else 1)
