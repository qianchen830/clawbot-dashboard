#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书推送去重检查脚本（按主题独立去重）
- 每主题单独文件: ~/.openclaw/feishu/dedup/<topic>-daily.json
- 每天每主题只发一次
"""
import sys
import json
import time
import os
from datetime import date

DEDUP_DIR = '/home/openclaw/.openclaw/feishu/dedup'
APP_ID = 'cli_a92328e60d389cbd'
APP_SECRET = 'YOUR_APP_SECRET_HERE'
USER_OPEN_ID = 'ou_9846f7a715446d72821b8d7bef196357'

TOPIC_FILES = {
    'ai': 'ai-daily.json',
    'psychology': 'psychology-daily.json',
    'accounting': 'accounting-daily.json',
    'tcm': 'tcm-daily.json',
    'history': 'history-daily.json',
}

def get_path(topic_key):
    return os.path.join(DEDUP_DIR, TOPIC_FILES.get(topic_key, f'{topic_key}-daily.json'))

def load_dedup_file(topic_key):
    path = get_path(topic_key)
    if os.path.exists(path):
        with open(path, 'r') as f:
            return json.load(f)
    return {}

def is_pushed_today(topic_key):
    """检查某主题今天是否已推送"""
    dedup = load_dedup_file(topic_key)
    today_str = date.today().isoformat()
    today_ts_start = time.mktime(time.strptime(today_str, '%Y-%m-%d')) * 1000
    today_ts_end = today_ts_start + 86400000
    
    for msg_id, ts in dedup.items():
        if isinstance(ts, (int, float)) and msg_id.startswith('om_'):
            if today_ts_start <= ts < today_ts_end:
                return True, msg_id
    return False, None

def mark_sent(topic_key, message_id):
    """标记某主题已发送"""
    path = get_path(topic_key)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    dedup = load_dedup_file(topic_key)
    dedup[str(message_id)] = int(time.time() * 1000)
    with open(path, 'w') as f:
        json.dump(dedup, f, ensure_ascii=False, indent=2)

def send_feishu(content, title=None):
    """发送飞书消息"""
    import urllib.request
    
    url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal'
    data = json.dumps({'app_id': APP_ID, 'app_secret': APP_SECRET}).encode()
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        token = json.loads(resp.read())['tenant_access_token']
    
    card = {
        "config": {"wide_screen_mode": True},
        "header": {
            "title": {"tag": "plain_text", "content": title or "📖 每日精读内容"},
            "template": "blue"
        },
        "elements": [
            {"tag": "markdown", "content": content},
            {"tag": "hr"},
            {"tag": "note", "elements": [{"tag": "plain_text", "content": "🚀 ClawBot AI学习频道 | 每日精读，持续进化"}]}
        ]
    }
    
    send_url = 'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id'
    payload = {
        "receive_id": USER_OPEN_ID,
        "msg_type": "interactive",
        "content": json.dumps(card, ensure_ascii=False)
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(send_url, data=data, headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }, method='POST')
    
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        if result.get('code') == 0:
            return result.get('data', {}).get('message_id'), True
        return None, False

# =====================
# CLI 接口
# =====================
if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法:")
        print("  python3 feishu-dedup.py check <topic_key>   # 检查某主题今天是否已推送")
        print("  python3 feishu-dedup.py mark <topic_key> <msg_id>  # 标记某主题已发送")
        print("示例:")
        print("  python3 feishu-dedup.py check ai")
        print("  python3 feishu-dedup.py check psychology")
        print("  python3 feishu-dedup.py mark ai om_xxx")
        sys.exit(1)
    
    cmd = sys.argv[1]
    
    if cmd == 'check':
        topic = sys.argv[2] if len(sys.argv) > 2 else 'unknown'
        pushed, msg_id = is_pushed_today(topic)
        if pushed:
            print(f"ALREADY_SENT:{msg_id}")
            sys.exit(0)
        else:
            print("NOT_SENT")
            sys.exit(1)
    
    elif cmd == 'mark':
        if len(sys.argv) < 4:
            print("需要: topic_key message_id", file=sys.stderr)
            sys.exit(1)
        topic, msg_id = sys.argv[2], sys.argv[3]
        mark_sent(topic, msg_id)
        print(f"已标记 {topic}: {msg_id}")
    
    elif cmd == 'send':
        print("send功能由调用方自行实现，通过API发送后调用mark")
    
    else:
        print(f"未知命令: {cmd}", file=sys.stderr)
        sys.exit(1)
