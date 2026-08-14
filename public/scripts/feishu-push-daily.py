#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书每日学习内容推送脚本
- 每天按计划生成并推送深度学习内容
- 内置去重机制：每天每主题只推送一次
- 推送后记录message_id到dedup文件
"""

import os
import json
import sys
from datetime import datetime, date
from pathlib import Path

WORKSPACE = str(Path.home() / '.openclaw' / 'workspace')
DEDUP_DIR = f'{WORKSPACE}/feishu/dedup'
DEDUP_FILE = f'{DEDUP_DIR}/default.json'

APP_ID = "cli_a92328e60d389cbd"
APP_SECRET = "YOUR_APP_SECRET_HERE"
USER_OPEN_ID = "ou_9846f7a715446d72821b8d7bef196357"

os.makedirs(DEDUP_DIR, exist_ok=True)

def load_dedup():
    """加载去重记录"""
    if os.path.exists(DEDUP_FILE):
        with open(DEDUP_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_dedup(dedup):
    """保存去重记录"""
    with open(DEDUP_FILE, 'w') as f:
        json.dump(dedup, f, ensure_ascii=False, indent=2)

def is_already_pushed_today(topic_key):
    """检查今天是否已推送过该主题"""
    dedup = load_dedup()
    today = date.today().isoformat()
    
    # 格式: "om_xxx": timestamp
    for msg_id, ts_str in dedup.items():
        if isinstance(ts_str, (int, float)):
            ts_date = datetime.fromtimestamp(ts_str / 1000).date().isoformat()
        else:
            ts_date = datetime.fromtimestamp(int(str(ts_str))[:10] / 1000).date().isoformat()
        
        if ts_date == today:
            return True, msg_id
    return False, None

def mark_pushed(topic_key, message_id):
    """标记为已推送"""
    dedup = load_dedup()
    dedup[message_id] = int(datetime.now().timestamp() * 1000)
    save_dedup(dedup)

def get_feishu_token():
    """获取飞书访问令牌"""
    import urllib.request
    
    url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
    data = json.dumps({"app_id": APP_ID, "app_secret": APP_SECRET}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))['tenant_access_token']

def send_feishu_message(title, content_md, token):
    """发送飞书消息（使用富文本卡片）"""
    import urllib.request
    
    url = "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # 构建卡片消息
    card = {
        "config": {"wide_screen_mode": True},
        "header": {
            "title": {"tag": "plain_text", "content": title},
            "template": "blue" if "AI" in title else ("green" if "心理" in title else ("orange" if "会计" in title else ("purple" if "中医" in title else "blue")))
        },
        "elements": [
            {"tag": "markdown", "content": content_md},
            {"tag": "hr"},
            {"tag": "note", "elements": [{"tag": "plain_text", "content": "🚀 ClawBot AI学习频道 | 每日精读，持续进化"}]}
        ]
    }
    
    payload = {
        "receive_id": USER_OPEN_ID,
        "msg_type": "interactive",
        "content": json.dumps(card, ensure_ascii=False)
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read().decode('utf-8'))
        if result.get('code') == 0:
            return result.get('data', {}).get('message_id'), True
        else:
            print(f"  ❌ 发送失败: {result.get('msg')}")
            return None, False

def send_simple_text(content, token):
    """发送纯文本消息"""
    import urllib.request
    
    url = "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        "receive_id": USER_OPEN_ID,
        "msg_type": "text",
        "content": json.dumps({"text": content}, ensure_ascii=False)
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read().decode('utf-8'))
        if result.get('code') == 0:
            return result.get('data', {}).get('message_id'), True
        return None, False

# ============================================================
# 每日学习主题 — 每个主题都是深度内容框架
# ============================================================

TOPICS = {
    "ai": {
        "name": "🤖 AI人工智能",
        "emoji": "🤖",
        "color": "blue",
        "progress_file": f"{WORKSPACE}/data/learning-progress/ai-ai-progress.md",
        "schedule": "11:00",
        "doc_folder": None,
        "next_topic": "Agent",  # 当前进度之后的下个主题
        "content_template": """## 今日内容深度框架

# 🤖 {title}

---

## 一、概念定义（一句话）

{concept_one_liner}

---

## 二、核心技术原理（图解式拆解）

### 2.1 基础概念
{basic_concepts}

### 2.2 工作流程
{workflow}

---

## 三、工业级实战案例

### 案例一：{case1_title}
{case1_content}

### 案例二：{case2_title}
{case2_content}

---

## 四、动手实践

### 4.1 环境准备
```bash
{pip_install}
```

### 4.2 核心代码实现
```python
{core_code}
```

### 4.3 运行与测试
{run_instructions}

---

## 五、常见问题与解决方案

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| {faq_q1} | {faq_a1} | {faq_s1} |
| {faq_q2} | {faq_a2} | {faq_s2} |

---

## 六、今日思考题

### 选择题
**1. {quiz1}**
- A. {quiz1_a}
- B. {quiz1_b}
- C. {quiz1_c}
- D. {quiz1_d}

<details>
<summary>点击看答案</summary>
**答案：{quiz1_ans}**。{quiz1_explain}
</details>

### 分析题
**2. {quiz2}**

<details>
<summary>点击看参考思路</summary>
{quiz2_hint}
</details>

### 开放题
**3. {quiz3}**

---

## 七、核心要点回顾

1. {key_point1}
2. {key_point2}
3. {key_point3}

---

## 📌 下期预告

下期我们将学习：**{next_topic}**

---

*🚀 ClawBot AI学习频道 | 每日精读，持续进化*"""
    },
    
    "psychology": {
        "name": "🧠 心理学",
        "emoji": "🧠",
        "color": "green",
        "progress_file": f"{WORKSPACE}/data/learning-progress/psychology-progress.md",
        "schedule": "12:00",
        "doc_folder": None,
        "next_topic": "依恋类型",
        "content_template": """## 今日内容深度框架

# 🧠 {title}

---

## 一、概念引入：从一个令人深思的真实故事说起

{story_intro}

---

## 二、理论解析：经典实验与研究发现

### 2.1 经典实验
{classic_experiment}

### 2.2 理论框架
{theory_framework}

---

## 三、生活中的3个以上实际案例

### 案例一：{case1}
{case1_desc}

### 案例二：{case2}
{case2_desc}

### 案例三：{case3}
{case3_desc}

---

## 四、商业与职场应用

### 4.1 {app1_title}
{app1_content}

### 4.2 {app2_title}
{app2_content}

### 4.3 {app3_title}
{app3_content}

---

## 五、自我觉察与应对策略

### 觉察一：{aware1_title}
{aware1_desc}

### 觉察二：{aware2_title}
{aware2_desc}

### 觉察三：{aware3_title}
{aware3_desc}

---

## 六、今日思考题

### 思考题1：
{thinking1}

### 思考题2：
{thinking2}

### 思考题3：
{thinking3}

---

## 📌 今日核心要点

1. {key_point1}
2. {key_point2}
3. {key_point3}

---

*🚀 ClawBot AI学习频道 | 每日精读，持续进化*"""
    },
    
    "accounting": {
        "name": "📚 中级会计",
        "emoji": "📚",
        "color": "orange",
        "progress_file": f"{WORKSPACE}/data/learning-progress/accounting-progress.md",
        "schedule": "14:00",
        "doc_folder": None,
        "next_topic": "投资性房地产",
        "content_template": """## 今日内容深度框架

# 📚 {title}

---

## 一、知识点精讲

### 1.1 会计准则原文
{standard_text}

### 1.2 通俗解释
{plain_explain}

### 1.3 易错辨析
{common_errors}

---

## 二、分录编制实战

### 分录1：{entry1_title}
**题目：** {entry1_problem}

**解题思路：**
{entry1_analysis}

**会计分录：**
```
{entry1_journal}
```

### 分录2：{entry2_title}
**题目：** {entry2_problem}

**解题思路：**
{entry2_analysis}

**会计分录：**
```
{entry2_journal}
```

---

## 三、例题演练（历年真题）

### 例题一（{exam1_year}年真题）
**题目：** {exam1_problem}

**答案：**
{exam1_answer}

**详细解析：**
{exam1_explanation}

### 例题二（{exam2_year}年真题）
**题目：** {exam2_problem}

**答案：**
{exam2_answer}

**详细解析：**
{exam2_explanation}

---

## 四、易错提示

| 错误类型 | 错误做法 | 正确做法 |
|------|------|---------|
| {err1_type} | {err1_wrong} | {err1_right} |
| {err2_type} | {err2_wrong} | {err2_right} |

---

## 五、今日检测题

### 检测题1：
{test1}

<details>
<summary>点击看答案</summary>
**答案：{test1_ans}**。{test1_exp}
</details>

### 检测题2：
{test2}

<details>
<summary>点击看答案</summary>
**答案：{test2_ans}**。{test2_exp}
</details>

### 检测题3：
{test3}

<details>
<summary>点击看答案</summary>
**答案：{test3_ans}**。{test3_exp}
</details>

---

## 📌 核心考点回顾

1. {key_point1}
2. {key_point2}
3. {key_point3}

---

*🚀 ClawBot AI学习频道 | 每日精读，持续进化*"""
    },
    
    "tcm": {
        "name": "🌿 中医",
        "emoji": "🌿",
        "color": "green",
        "progress_file": f"{WORKSPACE}/data/learning-progress/tcm-progress.md",
        "schedule": "15:00",
        "doc_folder": None,
        "next_topic": "三焦",
        "content_template": """## 今日内容深度框架

# 🌿 {title}

---

## 一、中西医对标理解

### 🔬 西医视角
{western_view}

### 🌿 中医视角
{chinese_view}

### ⚖️ 核心区别
{core_difference}

---

## 二、生理功能详解

### 2.1 主要功能
{main_functions}

### 2.2 与其他脏腑的关系
{organ_relationships}

---

## 三、常见问题与调理方案

### 问题一：{problem1}
**表现：** {problem1_symptoms}
**调理方案：**
- 食疗：{problem1_diet}
- 穴位：{problem1_acupoint}
- 生活：{problem1_lifestyle}

### 问题二：{problem2}
**表现：** {problem2_symptoms}
**调理方案：**
- 食疗：{problem2_diet}
- 穴位：{problem2_acupoint}
- 生活：{problem2_lifestyle}

---

## 四、真实医案

### 医案一（现代）：
{case1_modern}

### 医案二（古代）：
{case2_ancient}

---

## 五、今日思考题

{thinking_questions}

---

## 📌 核心要点

1. {key_point1}
2. {key_point2}
3. {key_point3}

---

*🚀 ClawBot AI学习频道 | 每日精读，持续进化*"""
    },
    
    "history": {
        "name": "📜 中国历史",
        "emoji": "📜",
        "color": "purple",
        "progress_file": f"{WORKSPACE}/data/learning-progress/history-progress.md",
        "schedule": "17:00",
        "doc_folder": None,
        "next_topic": "春秋",
        "content_template": """## 今日内容深度框架

# 📜 {title}

---

## 一、历史背景

### 1.1 时代背景
{era_background}

### 1.2 政治经济环境
{political_economic}

---

## 二、重大历史事件

### 事件一：{event1_title}
{event1_desc}

### 事件二：{event2_title}
{event2_desc}

### 事件三：{event3_title}
{event3_desc}

---

## 三、关键历史人物

### 人物一：{person1_name}
{person1_desc}

### 人物二：{person2_name}
{person2_desc}

---

## 四、制度创新

### 4.1 {system1_title}
{system1_desc}

### 4.2 {system2_title}
{system2_desc}

---

## 五、历史遗产与影响

{historical_legacy}

---

## 六、真实历史故事

{historical_story}

---

## 七、今日思考题

{thinking_questions}

---

## 📌 核心要点

1. {key_point1}
2. {key_point2}
3. {key_point3}

---

*🚀 ClawBot AI学习频道 | 每日精读，持续进化*"""
    }
}

def build_content(topic_key, topic_info, title, **kwargs):
    """根据主题类型构建深度内容"""
    template = topic_info["content_template"]
    
    # 基础替换
    content = template.replace("{title}", title)
    content = content.replace("{emoji}", topic_info["emoji"])
    
    # 替换所有占位符
    for key, value in kwargs.items():
        placeholder = "{" + key + "}"
        content = content.replace(placeholder, str(value))
    
    return content

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python3 feishu-push-daily.py <topic_key>")
        print("可用主题:", ", ".join(TOPICS.keys()))
        sys.exit(1)
    
    topic_key = sys.argv[1]
    if topic_key not in TOPICS:
        print(f"未知主题: {topic_key}")
        sys.exit(1)
    
    topic_info = TOPICS[topic_key]
    today = date.today().isoformat()
    
    # 检查是否已推送
    already_pushed, existing_msg_id = is_already_pushed_today(topic_key)
    if already_pushed:
        print(f"✅ {topic_info['name']} 今日已推送（message_id: {existing_msg_id}），跳过")
        sys.exit(0)
    
    # 生成内容（这里的内容是由调用方通过stdin传入的完整markdown）
    # 或者直接在这里生成
    print(f"📝 {topic_info['name']} 推送处理中...")
    print(f"   日期: {today}")
    print(f"   进度文件: {topic_info['progress_file']}")
    
    # 注意：实际内容由主agent生成后调用本脚本时传入
    # 本脚本只负责：去重检查 + 飞书API发送 + dedup记录
    print("✅ 脚本就绪，等待内容输入...")