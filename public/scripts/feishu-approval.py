#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书批准处理器 - 处理飞书中的批准/拒绝命令
"""

import sys
import os
import json
import time

REQUEST_FILE = "/home/openclaw/.openclaw/workspace/data/context-approval-request.json"

def handle_approval(message):
    """处理飞书批准消息"""
    message = message.strip().lower()

    if '同意' in message or 'approve' in message or 'yes' in message:
        action = 'approved'
    elif '拒绝' in message or 'reject' in message or 'no' in message:
        action = 'rejected'
    elif '取消' in message or 'cancel' in message:
        action = 'cancelled'
    else:
        print(f"未知命令: {message}")
        return False

    # 更新请求状态
    if os.path.exists(REQUEST_FILE):
        try:
            with open(REQUEST_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if data.get('status') == 'pending':
                data['status'] = action
                data['approvedBy'] = 'feishu'
                data['approvedAt'] = time.time()

                with open(REQUEST_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)

                print(f"✅ 已更新状态: {action}")
                return True
            else:
                print(f"⚠️ 请求状态不是pending: {data.get('status')}")
                return False
        except Exception as e:
            print(f"❌ 更新状态失败: {e}")
            return False
    else:
        print("⚠️ 没有待处理的扩展请求")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python3 feishu-approval.py <消息>")
        sys.exit(1)

    message = sys.argv[1]
    success = handle_approval(message)
    sys.exit(0 if success else 1)
