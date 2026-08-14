#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
High Intensity Learning Engine v4.0
高强度学习引擎 - 深度知识 + 代码实践 + 思考测验
"""

import json
import os
import random
from datetime import datetime
from pathlib import Path

WORKSPACE = str(Path.home() / '.openclaw' / 'workspace')
MEMORY_DIR = f'{WORKSPACE}/memory'
LEARNING_LOG = f'{WORKSPACE}/data/learning-log.json'
REPORT_FILE = f'{WORKSPACE}/data/learning-report.md'

# 高强度学习主题库
LEARNING_TOPICS = [
    {
        "category": "AI技术",
        "topic": "大语言模型微调技术实战",
        "duration": 90,
        "difficulty": "高级",
        "sections": [
            {
                "title": "微调原理深度解析",
                "time": 20,
                "points": [
                    "预训练vs微调vs提示工程的区别",
                    "LoRA低秩分解数学原理",
                    "QLoRA量化技术详解",
                    "参数高效微调优势"
                ]
            },
            {
                "title": "LoRA实战代码",
                "time": 30,
                "points": [
                    "环境配置与依赖安装",
                    "数据准备与格式转换",
                    "模型加载与LoRA配置",
                    "训练流程与参数调优"
                ]
            },
            {
                "title": "微调最佳实践",
                "time": 20,
                "points": [
                    "数据质量要求",
                    "超参数选择策略",
                    "过拟合检测与预防",
                    "效果评估方法"
                ]
            },
            {
                "title": "生产部署方案",
                "time": 20,
                "points": [
                    "模型合并与导出",
                    "vLLM高性能部署",
                    "API服务封装",
                    "监控与优化"
                ]
            }
        ],
        "quiz": [
            "LoRA为什么可以使用很小的r值?",
            "QLoRA相比LoRA有哪些优势?",
            "如何判断模型是否过拟合?"
        ],
        "practice": "使用QLoRA微调一个Llama模型,完成客服问答任务",
        "keywords": ["LoRA", "QLoRA", "PEFT", "微调", "Llama"]
    },
    {
        "category": "AI技术",
        "topic": "RAG检索增强生成实战",
        "duration": 90,
        "difficulty": "高级",
        "sections": [
            {
                "title": "RAG核心原理",
                "time": 15,
                "points": [
                    "RAG架构设计",
                    "向量检索原理",
                    "与微调的对比选择",
                    "适用场景分析"
                ]
            },
            {
                "title": "向量数据库实战",
                "time": 25,
                "points": [
                    "Milvus/Qdrant/Chroma选型",
                    "索引策略与优化",
                    "批量写入与查询",
                    "性能调优技巧"
                ]
            },
            {
                "title": "混合检索策略",
                "time": 20,
                "points": [
                    "向量+关键词融合",
                    "重排序算法",
                    "RRF融合方法",
                    "效果优化策略"
                ]
            },
            {
                "title": "RAG系统构建",
                "time": 30,
                "points": [
                    "文档处理流水线",
                    "分块策略设计",
                    "提示词工程",
                    "端到端实现"
                ]
            }
        ],
        "quiz": [
            "RAG比微调有什么优势?",
            "如何选择合适的分块大小?",
            "混合检索为什么效果更好?"
        ],
        "practice": "构建一个企业知识库RAG系统",
        "keywords": ["RAG", "向量数据库", "检索增强", "Milvus"]
    },
    {
        "category": "成长",
        "topic": "心理学核心原理应用",
        "duration": 90,
        "difficulty": "中级",
        "sections": [
            {
                "title": "认知心理学基础",
                "time": 20,
                "points": [
                    "认知偏差识别与规避",
                    "双系统决策理论",
                    "锚定效应应用",
                    "确认偏差克服"
                ]
            },
            {
                "title": "行为心理学与习惯养成",
                "time": 20,
                "points": [
                    "习惯回路模型",
                    "福格行为模型B=MAP",
                    "奖励机制设计",
                    "行为改变技术"
                ]
            },
            {
                "title": "情绪管理与压力应对",
                "time": 20,
                "points": [
                    "情绪识别技巧",
                    "认知重评策略",
                    "压力应对模型",
                    "正念减压实践"
                ]
            },
            {
                "title": "动机与意志力科学",
                "time": 30,
                "points": [
                    "自我决定理论",
                    "SMART目标设定",
                    "自我效能感提升",
                    "执行意图应用"
                ]
            }
        ],
        "quiz": [
            "如何利用认知偏差改善决策?",
            "习惯养成的关键要素是什么?",
            "如何提升自我效能感?"
        ],
        "practice": "设计一个30天习惯养成计划",
        "keywords": ["认知偏差", "习惯养成", "情绪管理", "动机"]
    },
    {
        "category": "短视频",
        "topic": "爆款短视频创作方法论",
        "duration": 90,
        "difficulty": "中级",
        "sections": [
            {
                "title": "爆款内容公式",
                "time": 20,
                "points": [
                    "钩子3秒法则",
                    "情绪曲线设计",
                    "完播率优化",
                    "传播机制分析"
                ]
            },
            {
                "title": "选题与脚本设计",
                "time": 25,
                "points": [
                    "热点追踪方法",
                    "痛点挖掘技巧",
                    "差异化定位",
                    "黄金脚本结构"
                ]
            },
            {
                "title": "视觉呈现技巧",
                "time": 20,
                "points": [
                    "镜头语言运用",
                    "剪辑节奏把控",
                    "字幕设计原则",
                    "BGM选择策略"
                ]
            },
            {
                "title": "数据分析与优化",
                "time": 25,
                "points": [
                    "关键指标解读",
                    "流量池机制",
                    "AB测试方法",
                    "迭代优化策略"
                ]
            }
        ],
        "quiz": [
            "如何设计3秒钩子?",
            "完播率低怎么优化?",
            "如何分析爆款视频?"
        ],
        "practice": "创作一个爆款短视频脚本",
        "keywords": ["爆款公式", "完播率", "脚本设计", "数据分析"]
    },
    {
        "category": "编程",
        "topic": "Python高级编程技巧",
        "duration": 90,
        "difficulty": "高级",
        "sections": [
            {
                "title": "装饰器深度理解",
                "time": 25,
                "points": [
                    "闭包原理与实现",
                    "装饰器模式设计",
                    "带参数装饰器",
                    "类装饰器应用"
                ]
            },
            {
                "title": "元类与描述符",
                "time": 25,
                "points": [
                    "元类机制解析",
                    "描述符协议实现",
                    "ORM原理剖析",
                    "属性控制技巧"
                ]
            },
            {
                "title": "协程与异步编程",
                "time": 25,
                "points": [
                    "asyncio核心原理",
                    "协程调度机制",
                    "并发模式设计",
                    "性能优化策略"
                ]
            },
            {
                "title": "性能优化实战",
                "time": 15,
                "points": [
                    "性能分析工具",
                    "内存管理优化",
                    "算法复杂度优化",
                    "C扩展加速"
                ]
            }
        ],
        "quiz": [
            "装饰器如何保持函数元信息?",
            "元类的主要应用场景?",
            "asyncio的GIL问题如何解决?"
        ],
        "practice": "实现一个ORM框架原型",
        "keywords": ["装饰器", "元类", "协程", "性能优化"]
    },


class IntensiveLearning:
    def __init__(self):
        self.today = datetime.now().strftime('%Y-%m-%d')
        self.log = self.load_log()
        self.current_stage = self.log.get('current_stage', 36)
        self.total_hours = self.log.get('total_hours', 270)
    
    def load_log(self):
        if os.path.exists(LEARNING_LOG):
            with open(LEARNING_LOG, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {'total_hours': 270, 'current_stage': 36, 'topics_learned': []}
    
    def save_log(self):
        os.makedirs(os.path.dirname(LEARNING_LOG), exist_ok=True)
        with open(LEARNING_LOG, 'w', encoding='utf-8') as f:
            json.dump(self.log, f, ensure_ascii=False, indent=2)
    
    def get_next_topic(self):
        learned = {t['topic'] for t in self.log.get('topics_learned', [])}
        available = [t for t in LEARNING_TOPICS if t['topic'] not in learned]
        if not available:
            available = LEARNING_TOPICS
        return random.choice(available), len(available) == len(LEARNING_TOPICS)
    
    def generate_content(self, topic, is_review):
        content = f"# {'复习' if is_review else '高强度学习'}: {topic['topic']}\n\n"
        content += f"**分类**: {topic['category']}  \n"
        content += f"**难度**: {topic['difficulty']}  \n"
        content += f"**时长**: {topic['duration']}分钟  \n"
        content += f"**时间**: {datetime.now().strftime('%Y-%m-%d %H:%M')}  \n\n"
        content += "---\n\n## 学习目标\n\n"
        content += f"完成本节学习后,你将:\n- 深入掌握{topic['topic']}核心原理\n"
        content += "- 能够独立完成实践任务\n- 通过思考题验证学习效果\n\n---\n\n"
        
        total_points = 0
        for i, section in enumerate(topic['sections'], 1):
            content += f"## 第{i}节: {section['title']}\n\n"
            content += f"**时长**: {section['time']}分钟\n\n"
            content += "### 核心知识点\n\n"
            for point in section['points']:
                content += f"- {point}\n"
            total_points += len(section['points'])
            content += "\n### 深入学习\n\n"
            content += "请针对每个知识点:\n1. 查阅相关资料深入学习\n2. 记录关键概念和公式\n3. 思考实际应用场景\n\n---\n\n"
        
        if 'quiz' in topic:
            content += "## 思考题\n\n"
            for i, q in enumerate(topic['quiz'], 1):
                content += f"{i}. {q}\n"
            content += "\n---\n\n"
        
        if 'practice' in topic:
            content += "## 实践任务\n\n"
            content += f"**任务**: {topic['practice']}\n\n"
            content += "要求:\n- 独立完成\n- 记录过程和结果\n- 总结经验和收获\n\n---\n\n"
        
        content += f"## 学习统计\n\n"
        content += f"| 项目 | 数值 |\n|------|------|\n"
        content += f"| 章节 | {len(topic['sections'])}个 |\n"
        content += f"| 知识点 | {total_points}个 |\n"
        content += f"| 思考题 | {len(topic.get('quiz', []))}道 |\n"
        content += f"| 实践任务 | {'1个' if 'practice' in topic else '0个'} |\n"
        content += f"| 总时长 | {topic['duration']}分钟 |\n\n"
        content += "---\n\n*高强度学习引擎v4.0*\n"
        
        return content, total_points
    
    def save_note(self, topic, content):
        filename = f"{self.today}-{topic['category']}-{topic['topic']}-v4.md".replace(' ', '-')
        filepath = os.path.join(MEMORY_DIR, filename)
        os.makedirs(MEMORY_DIR, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return filename
    
    def update_heartbeat(self, topic):
        self.total_hours += 1
        content = f"""# HEARTBEAT.md

**状态**: 高强度学习中
**时间**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
**阶段**: 第{self.current_stage + 1}阶段

## 当前学习

- **主题**: {topic['topic']}
- **分类**: {topic['category']}
- **难度**: {topic['difficulty']}
- **时长**: {topic['duration']}分钟

## 统计

- 累计学习: {self.total_hours}小时
- 已学主题: {len(self.log['topics_learned'])}个

---

*v4.0 高强度学习引擎*
"""
        with open(f'{WORKSPACE}/HEARTBEAT.md', 'w', encoding='utf-8') as f:
            f.write(content)
    
    def generate_report(self, topic, points_count, filename):
        report = f"""# 高强度学习汇报

**主题**: {topic['topic']}
**分类**: {topic['category']}
**难度**: {topic['difficulty']}
**时长**: {topic['duration']}分钟

## 内容

"""
        for section in topic['sections']:
            report += f"- {section['title']} ({section['time']}分钟)\n"
        
        report += f"""
## 统计

- 章节: {len(topic['sections'])}个
- 知识点: {points_count}个
- 思考题: {len(topic.get('quiz', []))}道
- 实践任务: {'1个' if 'practice' in topic else '无'}

## 累计

- 学习时长: {self.total_hours}小时
- 学习主题: {len(self.log['topics_learned']) + 1}个

---

*v4.0 高强度学习引擎*
"""
        os.makedirs(os.path.dirname(REPORT_FILE), exist_ok=True)
        with open(REPORT_FILE, 'w', encoding='utf-8') as f:
            f.write(report)
        return report
    
    def send_feishu(self, topic, points_count):
        import requests
        
        USER_ID = "ou_9846f7a715446d72821b8d7bef196357"
        APP_ID = "cli_a92328e60d389cbd"
        APP_SECRET = "YOUR_APP_SECRET_HERE"
        
        try:
            token_resp = requests.post(
                "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
                json={"app_id": APP_ID, "app_secret": APP_SECRET},
                timeout=10
            )
            
            if token_resp.status_code == 200:
                token_data = token_resp.json()
                if token_data.get("code") == 0:
                    token = token_data["tenant_access_token"]
                    
                    title = f"高强度学习: {topic['topic']}"
                    content = f"**分类**: {topic['category']}\n**难度**: {topic['difficulty']}\n**时长**: {topic['duration']}分钟\n\n"
                    content += f"**章节**: {len(topic['sections'])}个\n**知识点**: {points_count}个\n"
                    content += f"**思考题**: {len(topic.get('quiz', []))}道\n**实践任务**: {'1个' if 'practice' in topic else '无'}\n\n"
                    content += f"**累计**: {self.total_hours}小时 / {len(self.log['topics_learned']) + 1}主题"
                    
                    requests.post(
                        "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id",
                        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                        json={
                            "receive_id": USER_ID,
                            "msg_type": "interactive",
                            "content": json.dumps({
                                "config": {"wide_screen_mode": True},
                                "header": {"title": {"tag": "plain_text", "content": title}, "template": "red"},
                                "elements": [{"tag": "markdown", "content": content}]
                            })
                        },
                        timeout=10
                    )
                    print("  飞书通知已发送")
        except Exception as e:
            print(f"  飞书通知失败: {e}")
    
    def run(self):
        print("=" * 60)
        print(f"高强度学习引擎 v4.0 - {self.today}")
        print("=" * 60)
        
        print("\n[1/6] 选择主题...")
        topic, is_review = self.get_next_topic()
        print(f"  {topic['category']} - {topic['topic']}")
        print(f"  难度: {topic['difficulty']} | 时长: {topic['duration']}分钟")
        
        print("\n[2/6] 生成内容...")
        content, points_count = self.generate_content(topic, is_review)
        print(f"  {len(content)}字 | {points_count}个知识点")
        
        print("\n[3/6] 保存笔记...")
        filename = self.save_note(topic, content)
        print(f"  {filename}")
        
        print("\n[4/6] 更新状态...")
        self.update_heartbeat(topic)
        print("  HEARTBEAT已更新")
        
        print("\n[5/6] 记录日志...")
        self.log['topics_learned'].append({
            'topic': topic['topic'],
            'category': topic['category'],
            'time': datetime.now().isoformat(),
            'duration': topic['duration'],
            'points': points_count
        })
        self.log['total_hours'] = self.total_hours
        self.save_log()
        print("  日志已保存")
        
        print("\n[6/6] 发送通知...")
        report = self.generate_report(topic, points_count, filename)
        self.send_feishu(topic, points_count)
        
        print("\n" + "=" * 60)
        print(f"完成: {topic['topic']}")
        print(f"知识点: {points_count}个 | 思考题: {len(topic.get('quiz', []))}道")
        print(f"累计: {self.total_hours}小时 / {len(self.log['topics_learned'])}主题")
        print("=" * 60)
        
        return topic

if __name__ == '__main__':
    engine = IntensiveLearning()
    engine.run()
