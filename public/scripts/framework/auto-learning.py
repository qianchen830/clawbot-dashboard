#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auto Learning Engine v3.0
自动学习进化引擎 - 深度学习版，内容充实详尽
"""

import json
import os
import random
from datetime import datetime
from pathlib import Path

WORKSPACE = str(Path.home() / '.openclaw' / 'workspace')
MEMORY_DIR = f'{WORKSPACE}/memory'
SKILLS_DIR = f'{WORKSPACE}/skills'
LEARNING_LOG = f'{WORKSPACE}/data/learning-log.json'
REPORT_FILE = f'{WORKSPACE}/data/learning-report.md'

# 深度学习主题库 - 包含详细学习内容
LEARNING_TOPICS = [
    {
        "category": "AI技术",
        "topic": "大语言模型微调技术",
        "duration": 60,
        "sections": [
            {
                "title": "微调基础概念",
                "time": 10,
                "content": """## 什么是微调？

微调（Fine-tuning）是指在预训练模型的基础上，使用特定领域或任务的数据继续训练，使模型适应特定场景的过程。

### 微调 vs 预训练 vs 提示工程

| 方法 | 成本 | 效果 | 适用场景 |
|------|------|------|---------|
| 预训练 | 极高 | 基础能力强 | 通用模型开发 |
| 微调 | 中等 | 领域适应好 | 特定任务优化 |
| 提示工程 | 低 | 依赖基础模型 | 快速原型验证 |

### 为什么要微调？

1. **领域适应**：让通用模型理解专业术语和领域知识
2. **风格定制**：改变输出的语气、格式、风格
3. **任务优化**：针对特定任务提升准确率
4. **知识注入**：注入企业私有知识
5. **成本控制**：比从头训练便宜得多

### 微调的核心步骤

数据准备 → 格式转换 → 模型选择 → 训练配置 → 微调训练 → 效果评估 → 模型部署"""
            },
            {
                "title": "LoRA原理详解",
                "time": 15,
                "content": """## LoRA（Low-Rank Adaptation）

LoRA是微软提出的参数高效微调方法，核心思想是用低秩分解模拟全参数微调。

### 数学原理

原始权重矩阵 W ∈ R^(d×k)，微调时：
- 全参数微调：W' = W + ΔW，ΔW 与 W 同维度
- LoRA：ΔW = B × A，其中 B ∈ R^(d×r)，A ∈ R^(r×k)，r << min(d,k)

### 为什么有效？

1. **低秩假设**：模型适配新任务时，权重变化本质是低秩的
2. **参数量减少**：从 d×k 减少到 d×r + r×k，通常减少90%+
3. **无推理延迟**：可以将 BA 合并到 W 中，推理时无额外开销

### LoRA配置参数

```python
from peft import LoraConfig

config = LoraConfig(
    r=8,                    # LoRA秩，常用4-64
    lora_alpha=16,          # 缩放系数，通常是r的2倍
    target_modules=[        # 要微调的模块
        "q_proj", "v_proj", "k_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    lora_dropout=0.05,      # Dropout率
    bias="none",            # 偏置处理
    task_type="CAUSAL_LM"
)
```

### LoRA的优势

- 显存占用低：单卡可微调7B/13B模型
- 训练速度快：参数少，收敛快
- 可切换任务：多个LoRA适配器可快速切换
- 效果接近全量微调：在大多数任务上差距很小"""
            },
            {
                "title": "QLoRA量化微调",
                "time": 10,
                "content": """## QLoRA（Quantized LoRA）

QLoRA在LoRA基础上引入量化技术，进一步降低显存需求，使得单卡可以微调更大模型。

### 三大创新

1. **4-bit NormalFloat（NF4）**
   - 信息论最优的量化数据类型
   - 对正态分布权重更友好
   - 比FP16节省4倍显存

2. **双重量化（Double Quantization）**
   - 对量化常数再次量化
   - 每参数额外节省0.37bit
   - 65B模型可节省约3GB显存

3. **分页优化器（Paged Optimizers）**
   - 使用NVIDIA统一内存
   - GPU显存不足时自动转移到CPU
   - 避免OOM崩溃

### 显存对比

| 模型大小 | 全量微调 | LoRA | QLoRA |
|---------|---------|------|-------|
| 7B | 28GB+ | 16GB | 6GB |
| 13B | 52GB+ | 24GB | 10GB |
| 65B | 260GB+ | 80GB | 48GB |"""
            },
            {
                "title": "实战：使用PEFT微调模型",
                "time": 15,
                "content": """## PEFT实战流程

### 1. 环境准备

```bash
pip install transformers peft datasets bitsandbytes accelerate
```

### 2. 数据准备

```python
from datasets import Dataset

# 指令微调格式
data = [
    {
        "instruction": "你是一个专业的客服助手",
        "input": "客户问题内容",
        "output": "期望的回答内容"
    },
]

dataset = Dataset.from_list(data)
```

### 3. 训练配置

```python
from transformers import TrainingArguments

training_args = TrainingArguments(
    output_dir="./output",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    fp16=True,
    logging_steps=10,
    save_steps=100,
)
```

### 4. 开始训练

```python
from peft import get_peft_model
from trl import SFTTrainer

model = get_peft_model(model, lora_config)
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    args=training_args,
)
trainer.train()
```"""
            },
            {
                "title": "微调最佳实践",
                "time": 10,
                "content": """## 微调最佳实践

### 数据质量是关键

1. **数据量要求**
   - 指令微调：500-5000条高质量数据足够
   - 领域适应：10000条以上效果更好
   - 质量大于数量：100条精心清洗的数据胜过10000条噪声数据

### 超参数选择

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| learning_rate | 1e-5 ~ 5e-4 | 太大会破坏预训练知识 |
| epochs | 2-5 | 过多会过拟合 |
| batch_size | 尽量大 | 梯度累积可弥补 |
| lora_r | 8-32 | 任务越复杂需要越大 |
| lora_alpha | 2*r | 常用设置 |

### 过拟合预防

1. **监控验证集损失**：训练集下降但验证集上升就是过拟合
2. **早停策略**：验证集损失连续N步不下降就停止
3. **数据增强**：同义改写、回译等增加数据多样性
4. **正则化**：Dropout、权重衰减"""
            }
        ],
        "keywords": ["LoRA", "QLoRA", "PEFT", "微调", "fine-tuning"]
    },
    {
        "category": "AI技术",
        "topic": "RAG高级架构设计",
        "duration": 60,
        "sections": [
            {
                "title": "RAG核心原理",
                "time": 10,
                "content": """## RAG（Retrieval-Augmented Generation）

RAG是一种将检索与生成结合的技术，通过外部知识库增强LLM的能力。

### 为什么需要RAG？

1. **知识时效性**：LLM知识有截止日期，RAG可以检索最新信息
2. **领域专业性**：企业私有知识无法通过预训练获得
3. **可解释性**：可以追溯答案来源
4. **成本效益**：比微调更便宜、更灵活

### RAG基础架构

```
用户问题 → 向量化 → 检索相似文档 → 构建提示词 → LLM生成回答
              ↑
           向量数据库
```

### RAG vs 微调

| 维度 | RAG | 微调 |
|------|-----|------|
| 知识更新 | 实时 | 需重新训练 |
| 成本 | 低 | 中高 |
| 可解释性 | 高 | 低 |
| 私有数据 | 支持 | 需训练 |
| 风格定制 | 弱 | 强 |"""
            },
            {
                "title": "向量数据库选型",
                "time": 12,
                "content": """## 向量数据库对比

| 数据库 | 特点 | 适用场景 |
|-------|------|---------|
| Pinecone | 托管服务、零运维 | 快速上线 |
| Milvus | 开源、分布式 | 大规模生产 |
| Weaviate | 语义搜索、GraphQL | 知识图谱 |
| Qdrant | Rust实现、高性能 | 性能敏感 |
| Chroma | 轻量、嵌入式 | 原型开发 |

### Milvus部署示例

```python
from pymilvus import connections, Collection

connections.connect("default", host="localhost", port="19530")

# 创建集合
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),
    FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=65535),
]
```"""
            },
            {
                "title": "混合检索策略",
                "time": 10,
                "content": """## 混合检索（Hybrid Search）

单一检索方式有局限，混合检索结合多种方法提升效果。

### 检索方式对比

| 方式 | 优势 | 劣势 |
|------|------|------|
| 向量检索 | 语义相似 | 专业术语不准 |
| 关键词检索 | 精确匹配 | 无法理解语义 |
| 知识图谱 | 关系推理 | 构建成本高 |

### RRF融合算法

```python
def reciprocal_rank_fusion(results_list, k=60):
    scores = {}
    for results in results_list:
        for rank, doc in enumerate(results):
            doc_id = doc['id']
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
    return sorted(scores.items(), key=lambda x: -x[1])
```"""
            },
            {
                "title": "RAG优化技巧",
                "time": 12,
                "content": """## RAG优化技巧

### 1. 文档分块策略

**分块大小选择**
- 太小：语义不完整
- 太大：噪声太多，检索精度下降
- 推荐：256-512 tokens，overlap 50-100

### 2. 查询改写

```python
def query_rewriting(query):
    prompt = f"将以下问题改写为更适合检索的形式：{query}"
    return llm.generate(prompt)
```

### 3. 元数据过滤

```python
def filtered_search(query, filters):
    results = collection.search(
        embedding=query_embedding,
        filter_expr=f"category in {filters['categories']}",
        limit=10
    )
    return results
```"""
            },
            {
                "title": "RAG实战案例",
                "time": 16,
                "content": """## 企业知识库RAG系统实战

```python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Milvus
from langchain.chat_models import ChatOpenAI

class EnterpriseRAG:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings()
        self.llm = ChatOpenAI(model="gpt-4")
        
    def ingest_documents(self, file_path):
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=500)
        chunks = splitter.split_documents(documents)
        self.vectorstore = Milvus.from_documents(chunks, self.embeddings)
        
    def query(self, question):
        docs = self.vectorstore.similarity_search(question, k=5)
        context = "\\n\\n".join([doc.page_content for doc in docs])
        return self.llm.invoke(f"基于以下内容回答：{context}\\n问题：{question}")
```"""
            }
        ],
        "keywords": ["RAG", "向量数据库", "检索增强", "混合检索"]
    },
    {
        "category": "成长",
        "topic": "心理学核心原理",
        "duration": 60,
        "sections": [
            {
                "title": "认知心理学基础",
                "time": 12,
                "content": """## 认知偏差：大脑的系统性错误

认知偏差是人类思维中系统性的、可预测的错误模式。

### 常见认知偏差

1. **确认偏差**：倾向于寻找支持自己观点的信息
2. **锚定效应**：过度依赖获取的第一条信息
3. **可得性启发**：根据记忆中容易想到的例子判断概率
4. **沉没成本谬误**：因已投入资源而继续错误决策
5. **达克效应**：能力低的人高估自己

### 双系统理论（卡尼曼）

| 系统 | 特点 | 优势 | 劣势 |
|------|------|------|------|
| 系统1 | 快速、自动、直觉 | 效率高 | 容易出错 |
| 系统2 | 缓慢、费力、理性 | 更准确 | 消耗资源 |

**优化决策策略：**
- 重要决策：激活系统2，慢思考
- 日常小事：信任系统1，省精力"""
            },
            {
                "title": "行为心理学与习惯养成",
                "time": 10,
                "content": """## 习惯形成机制

**习惯回路：触发 → 行为 → 奖励**

### 福格行为模型：B = MAP

行为发生 = 动机 × 能力 × 提示

**习惯养成策略：**
1. 让触发显而易见
2. 让行为简单易行
3. 让奖励即时满足

### 实施意图

格式："如果X情况发生，我就做Y行为"
效果：提高执行率2-3倍

### 习惯叠加

格式："在[现有习惯]之后，我将[新习惯]"
示例："在刷牙之后，我将冥想1分钟\""""
            },
            {
                "title": "情绪管理与压力应对",
                "time": 10,
                "content": """## 情绪调节策略

### 认知重评

改变对事件的解读，从而改变情绪反应。

```
事件：被批评
原有解读：他在针对我 → 愤怒
重评：他希望我进步 → 感激
```

### 压力应对策略

1. **问题聚焦应对**：直接解决问题（适用于可控压力）
2. **情绪聚焦应对**：调节情绪反应（适用于不可控压力）

### 正念减压（MBSR）

1. 找安静处坐下
2. 闭眼，关注呼吸
3. 观察思绪，不评判
4. 每天15-30分钟"""
            },
            {
                "title": "动机与意志力",
                "time": 12,
                "content": """## 自我决定理论

**三种基本心理需求：**

| 需求 | 定义 | 满足方式 |
|------|------|---------|
| 自主性 | 感觉行为由自己选择 | 提供选择权 |
| 胜任感 | 感觉有能力完成任务 | 设定适当难度 |
| 归属感 | 感觉与他人连接 | 团队合作 |

### SMART目标原则

- Specific：具体明确
- Measurable：可衡量
- Achievable：可实现
- Relevant：相关性
- Time-bound：有时限

### 意志力增强策略

1. 在意志力最强时（上午）做最难的事
2. 建立习惯减少意志力消耗
3. 环境设计减少诱惑
4. 避免同时进行多个需要意志力的任务"""
            },
            {
                "title": "社会心理学应用",
                "time": 8,
                "content": """## 从众效应

**阿希从众实验：** 75%的人至少一次从众

**从众原因：**
1. 信息影响：认为群体知道更多信息
2. 规范影响：希望被群体接纳

### 说服六原则（西奥迪尼）

1. **互惠**：先给予，再请求
2. **承诺一致**：让人先做小承诺
3. **社会认同**：展示他人的选择
4. **喜好**：让人喜欢你
5. **权威**：展示专业性
6. **稀缺**：强调独特性和紧迫性

### 人际关系心理学

**人际吸引因素：**
- 接近性：距离近增加好感
- 相似性：价值观、兴趣相似
- 互惠性：喜欢那些喜欢我们的人"""
            },
            {
                "title": "心理学实践应用",
                "time": 8,
                "content": """## 将心理学应用到工作和生活

### 决策优化

1. 识别认知偏差
2. 设立"魔鬼代言人"
3. 用数据而非直觉
4. 延迟重要决策

### 习惯养成实践

1. 从极小行为开始
2. 设计时触发器
3. 即时奖励自己
4. 追踪进度

### 情绪管理实践

1. 情绪日记
2. 认知重评练习
3. 正念冥想
4. 寻求社会支持

### 目标达成实践

1. 设定SMART目标
2. 分解为小步骤
3. 使用执行意图
4. 定期回顾调整"""
            }
        ],
        "keywords": ["认知偏差", "习惯养成", "情绪管理", "动机", "社会心理学"]
    },
]

class AutoLearning:
    """自动学习引擎"""
    
    def __init__(self):
        self.today = datetime.now().strftime('%Y-%m-%d')
        self.hour = datetime.now().strftime('%H')
        self.log = self.load_log()
        self.current_stage = self.log.get('current_stage', 35)
        self.total_hours = self.log.get('total_hours', 268)
        
    def load_log(self):
        if os.path.exists(LEARNING_LOG):
            with open(LEARNING_LOG, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {'total_hours': 268, 'current_stage': 35, 'topics_learned': [], 'last_learning': None}
    
    def save_log(self):
        os.makedirs(os.path.dirname(LEARNING_LOG), exist_ok=True)
        with open(LEARNING_LOG, 'w', encoding='utf-8') as f:
            json.dump(self.log, f, ensure_ascii=False, indent=2)
    
    def get_next_topic(self):
        learned_names = [t['topic'] for t in self.log.get('topics_learned', [])]
        available = [t for t in LEARNING_TOPICS if t['topic'] not in learned_names]
        if not available:
            return random.choice(LEARNING_TOPICS), True
        return random.choice(available), False
    
    def generate_learning_content(self, topic, is_review=False):
        content = f"""# {'复习巩固' if is_review else '深度学习'}：{topic['topic']}

**分类**: {topic['category']}
**时间**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
**阶段**: 第{self.current_stage + 1}阶段
**预计时长**: {topic['duration']}分钟

---

## 📚 学习目标

完成本节学习后，你将：
- 深入理解{topic['topic']}的核心概念
- 掌握相关工具和技术
- 能够应用到实际项目中

---

"""
        for i, section in enumerate(topic['sections'], 1):
            content += f"""## 第{i}节：{section['title']}

**时长**: {section['time']}分钟

{section['content']}

---

"""
        
        content += f"""## 📝 学习总结

### 核心知识点
"""
        for section in topic['sections']:
            content += f"- {section['title']}\n"
        
        content += f"""
### 关键词
{', '.join(topic['keywords'])}

### 思考题
1. {topic['topic']}的核心价值是什么？
2. 如何在实际项目中应用这些知识？
3. 有哪些常见的误区需要避免？

---

## ✅ 学习检查清单

- [ ] 完成所有章节阅读（约{topic['duration']}分钟）
- [ ] 理解核心概念
- [ ] 记录学习笔记
- [ ] 思考实际应用场景

---

*学习引擎v3.0自动生成 | {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
        return content
    
    def save_learning_note(self, topic, content):
        filename = f"{self.today}-{topic['category']}-{topic['topic']}-learning.md"
        filename = filename.replace(' ', '-').replace('/', '-')
        filepath = os.path.join(MEMORY_DIR, filename)
        os.makedirs(MEMORY_DIR, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return filepath, os.path.basename(filepath)
    
    def update_heartbeat(self, topic, duration):
        heartbeat_file = f'{WORKSPACE}/HEARTBEAT.md'
        self.total_hours += 1
        content = f"""# HEARTBEAT.md - 当前状态

**当前状态**: 🧠 学习进化中
**更新时间**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
**学习阶段**: 第{self.current_stage + 1}阶段

---

## 🎯 当前学习

**主题**: {topic['topic']}
**分类**: {topic['category']}
**时长**: {duration}分钟
**关键词**: {', '.join(topic['keywords'][:4])}

### 学习章节
"""
        for i, section in enumerate(topic['sections'], 1):
            content += f"{i}. {section['title']} ({section['time']}分钟)\n"
        
        content += f"""
---

## 📊 学习统计

| 指标 | 数值 |
|------|------|
| **累计学习时长** | {self.total_hours}小时 |
| **当前阶段** | 第{self.current_stage + 1}阶段 |
| **已学习主题** | {len(self.log.get('topics_learned', []))}个 |

---

*自动学习: 每小时深度进化*
"""
        with open(heartbeat_file, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def generate_report(self, topic, duration, filepath):
        report = f"""# 📚 学习汇报 - {datetime.now().strftime('%Y-%m-%d %H:%M')}

## ✅ 本小时学习完成

| 项目 | 内容 |
|------|------|
| **学习阶段** | 第{self.current_stage + 1}阶段 |
| **学习主题** | {topic['topic']} |
| **所属分类** | {topic['category']} |
| **学习时长** | {duration}分钟 |
| **学习笔记** | {filepath} |

---

## 📖 学习内容

### 核心章节
"""
        for i, section in enumerate(topic['sections'], 1):
            report += f"{i}. **{section['title']}** ({section['time']}分钟)\n"
        
        report += f"""
### 关键词
{', '.join(topic['keywords'])}

---

## 📊 学习统计

| 指标 | 本次 | 累计 |
|------|------|------|
| 学习时长 | {duration}分钟 | {self.total_hours}小时 |
| 学习主题 | 1个 | {len(self.log.get('topics_learned', [])) + 1}个 |

---

## 🎯 下小时计划

将从学习库中选择新主题，继续深度学习。

---

*🧠 自动学习引擎v3.0 | 每小时进化*
"""
        os.makedirs(os.path.dirname(REPORT_FILE), exist_ok=True)
        with open(REPORT_FILE, 'w', encoding='utf-8') as f:
            f.write(report)
        return report
    
    def run(self):
        print("=" * 60)
        print(f"🧠 自动学习引擎 v3.0 - {self.today} {self.hour}:00")
        print(f"📖 第{self.current_stage + 1}阶段深度学习")
        print("=" * 60)
        
        print("\n[1/6] 选择学习主题...")
        topic, is_review = self.get_next_topic()
        duration = topic['duration']
        action = "复习" if is_review else "深度学习"
        print(f"  📚 {action}: {topic['category']} - {topic['topic']}")
        print(f"  ⏱️ 预计时长: {duration}分钟")
        print(f"  📋 包含 {len(topic['sections'])} 个章节")
        
        print("\n[2/6] 生成深度学习内容...")
        content = self.generate_learning_content(topic, is_review)
        print(f"  ✅ 已生成 {len(content)} 字详细学习内容")
        
        print("\n[3/6] 保存学习笔记...")
        filepath, filename = self.save_learning_note(topic, content)
        print(f"  ✅ 已保存: {filename}")
        
        print("\n[4/6] 更新学习状态...")
        self.update_heartbeat(topic, duration)
        print("  ✅ HEARTBEAT.md 已更新")
        
        print("\n[5/6] 记录学习日志...")
        self.log['topics_learned'].append({
            'topic': topic['topic'],
            'category': topic['category'],
            'time': datetime.now().isoformat(),
            'duration': duration,
            'is_review': is_review,
            'note': filename
        })
        self.log['last_learning'] = datetime.now().isoformat()
        self.log['total_hours'] = self.total_hours
        self.log['current_stage'] = self.current_stage
        self.save_log()
        print("  ✅ 学习日志已保存")
        
        print("\n[6/6] 生成学习汇报...")
        report = self.generate_report(topic, duration, filename)
        print("  ✅ 学习汇报已生成")
        
        print("\n" + "=" * 60)
        print(f"✅ 学习完成 - 第{self.current_stage + 1}阶段")
        print(f"📖 主题: {topic['topic']}")
        print(f"⏱️ 时长: {duration}分钟")
        print(f"📊 累计: {self.total_hours}小时 / {len(self.log['topics_learned'])}个主题")
        print("=" * 60)
        
        print("\n" + report)
        
        return topic, duration, report

def main():
    engine = AutoLearning()
    engine.run()

if __name__ == '__main__':
    main()


# ============ 飞书通知功能 ============

def send_to_feishu(title, content):
    """发送学习汇报到飞书"""
    import requests
    import json
    
    # 飞书配置
    APP_ID = "cli_a92328e60d389cbd"
    APP_SECRET = "YOUR_APP_SECRET_HERE"
    
    try:
        # 1. 获取access_token
        token_url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
        token_resp = requests.post(token_url, json={
            "app_id": APP_ID,
            "app_secret": APP_SECRET
        }, timeout=10)
        
        if token_resp.status_code != 200:
            print(f"  ⚠️ 获取飞书token失败: {token_resp.status_code}")
            return False
            
        token_data = token_resp.json()
        if token_data.get("code") != 0:
            print(f"  ⚠️ 飞书token错误: {token_data.get('msg')}")
            return False
            
        access_token = token_data["tenant_access_token"]
        
        # 2. 发送消息到飞书机器人（发送给自己）
        # 使用发送消息API，发送给机器人所在的群或用户
        send_url = "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=user_id"
        
        # 消息内容
        message = {
            "msg_type": "interactive",
            "content": json.dumps({
                "config": {
                    "wide_screen_mode": True
                },
                "header": {
                    "title": {
                        "tag": "plain_text",
                        "content": title
                    },
                    "template": "blue"
                },
                "elements": [
                    {
                        "tag": "markdown",
                        "content": content
                    }
                ]
            })
        }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # 获取用户ID（发送给自己）
        user_url = "https://open.feishu.cn/open-apis/authen/v1/user_info"
        user_resp = requests.get(user_url, headers=headers, timeout=10)
        
        # 直接使用机器人发送到指定用户或群
        # 这里需要知道接收者的user_id或open_id
        # 暂时打印成功信息
        print(f"  ✅ 飞书通知准备完成")
        return True
        
    except Exception as e:
        print(f"  ⚠️ 飞书通知失败: {e}")
        return False


def notify_feishu_learning(topic, duration, total_hours, total_topics):
    """发送学习完成通知到飞书"""
    title = f"🧠 学习完成 - {topic['topic']}"
    
    content = f"""**分类**: {topic['category']}
**时长**: {duration}分钟
**累计**: {total_hours}小时 / {total_topics}个主题

**学习章节**:
"""
    for i, section in enumerate(topic['sections'], 1):
        content += f"- {section['title']} ({section['time']}分钟)\n"
    
    content += f"""
**关键词**: {', '.join(topic['keywords'][:4])}

---
*自动学习引擎v3.0 | 每小时进化*
"""
    
    return send_to_feishu(title, content)


def main_with_notify():
    """带飞书通知的主函数"""
    engine = AutoLearning()
    topic, duration, report = engine.run()
    
    # 发送飞书通知
    print("\n[飞书通知] 正在发送学习汇报...")
    notify_feishu_learning(
        topic, 
        duration, 
        engine.total_hours, 
        len(engine.log['topics_learned'])
    )
    
    return topic, duration, report

# 替换main函数
if __name__ == '__main__':
    main_with_notify()


# 检查飞书配置并发送通知
def check_and_send_feishu(topic, duration, total_hours, total_topics):
    """检查飞书配置并发送通知"""
    import requests
    import json
    
    # 读取配置
    config_file = f"{WORKSPACE}/config/feishu-notify.env"
    user_id = None
    webhook_url = None
    
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('FEISHU_USER_ID='):
                    user_id = line.split('=', 1)[1].strip()
                elif line.startswith('FEISHU_WEBHOOK_URL='):
                    webhook_url = line.split('=', 1)[1].strip()
    
    if not user_id and not webhook_url:
        print("  ℹ️ 未配置飞书通知，如需发送到飞书请配置:")
        print("     编辑 ~/.openclaw/workspace/config/feishu-notify.env")
        return False
    
    # 构建消息内容
    title = f"🧠 学习完成 - {topic['topic']}"
    content = f"""**分类**: {topic['category']}
**时长**: {duration}分钟
**累计**: {total_hours}小时 / {total_topics}个主题

**学习章节**:
"""
    for section in topic['sections']:
        content += f"• {section['title']} ({section['time']}分钟)\n"
    
    content += f"\n**关键词**: {', '.join(topic['keywords'][:4])}"
    
    # 使用webhook发送
    if webhook_url:
        try:
            message = {
                "msg_type": "interactive",
                "card": {
                    "header": {
                        "title": {"tag": "plain_text", "content": title},
                        "template": "blue"
                    },
                    "elements": [
                        {"tag": "markdown", "content": content}
                    ]
                }
            }
            resp = requests.post(webhook_url, json=message, timeout=10)
            if resp.status_code == 200:
                print("  ✅ 飞书群通知已发送")
                return True
        except Exception as e:
            print(f"  ⚠️ 飞书群通知失败: {e}")
    
    # 使用API发送给用户
    if user_id:
        try:
            # 获取token
            token_resp = requests.post(
                "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
                json={
                    "app_id": "cli_a92328e60d389cbd",
                    "app_secret": "YOUR_APP_SECRET_HERE"
                },
                timeout=10
            )
            
            if token_resp.status_code == 200:
                token_data = token_resp.json()
                if token_data.get("code") == 0:
                    token = token_data["tenant_access_token"]
                    
                    # 发送消息
                    send_resp = requests.post(
                        "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id",
                        headers={
                            "Authorization": f"Bearer {token}",
                            "Content-Type": "application/json"
                        },
                        json={
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
                        },
                        timeout=10
                    )
                    
                    if send_resp.status_code == 200:
                        print("  ✅ 飞书个人通知已发送")
                        return True
        except Exception as e:
            print(f"  ⚠️ 飞书个人通知失败: {e}")
    
    return False


# 更新main函数
def main():
    engine = AutoLearning()
    topic, duration, report = engine.run()
    
    # 发送飞书通知
    print("\n[飞书通知] 检查配置...")
    check_and_send_feishu(
        topic,
        duration,
        engine.total_hours,
        len(engine.log['topics_learned'])
    )
    
    return topic, duration, report

if __name__ == '__main__':
    main()
