#!/usr/bin/env python3
"""
飞书学习通知模块
发送学习汇报到飞书手机
"""

import requests
import json
import os
import sys

# 飞书应用配置
APP_ID = "cli_a92328e60d389cbd"
APP_SECRET = "YOUR_APP_SECRET_HERE"

# 接收通知的用户ID（需要设置）
# 可以通过飞书管理后台或API获取
RECEIVE_USER_ID = os.environ.get("FEISHU_USER_ID", "")

def get_tenant_access_token():
    """获取飞书tenant_access_token"""
    url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
    resp = requests.post(url, json={
        "app_id": APP_ID,
        "app_secret": APP_SECRET
    }, timeout=10)
    
    if resp.status_code == 200:
        data = resp.json()
        if data.get("code") == 0:
            return data.get("tenant_access_token")
    return None

def send_message_to_user(user_id, title, content):
    """发送消息给指定用户"""
    token = get_tenant_access_token()
    if not token:
        print("获取token失败")
        return False
    
    url = f"https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=user_id"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    message = {
        "receive_id": user_id,
        "msg_type": "interactive",
        "content": json.dumps({
            "config": {"wide_screen_mode": True},
            "header": {
                "title": {"tag": "plain_text", "content": title},
                "template": "blue"
            },
            "elements": [
                {"tag": "markdown", "content": content}
            ]
        })
    }
    
    resp = requests.post(url, headers=headers, json=message, timeout=10)
    
    if resp.status_code == 200:
        data = resp.json()
        if data.get("code") == 0:
            return True
        else:
            print(f"发送失败: {data.get('msg')}")
    else:
        print(f"请求失败: {resp.status_code}")
    return False

def send_learning_report(topic, duration, total_hours, total_topics, sections, keywords):
    """发送学习汇报到飞书"""
    if not RECEIVE_USER_ID:
        print("⚠️ 未设置FEISHU_USER_ID环境变量")
        return False
    
    title = f"🧠 学习完成 - {topic}"
    
    content = f"""**分类**: 商业/AI技术
**时长**: {duration}分钟
**累计**: {total_hours}小时 / {total_topics}个主题

**学习章节**:
"""
    for section in sections:
        content += f"• {section}\n"
    
    content += f"""
**关键词**: {keywords}

---
*自动学习引擎v3.0 | 每小时进化*
"""
    
    return send_message_to_user(RECEIVE_USER_ID, title, content)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        import json
        data = json.loads(sys.argv[1]) if sys.argv[1].startswith("{") else {"topic": sys.argv[1]}
        
        send_learning_report(
            data.get("topic", "未知主题"),
            data.get("duration", 60),
            data.get("total_hours", 0),
            data.get("total_topics", 0),
            data.get("sections", []),
            data.get("keywords", "")
        )
    else:
        print("用法: python3 feishu_learning_notify.py '<json_data>'")
        print("需要设置环境变量: FEISHU_USER_ID")
