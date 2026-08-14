# 特征工程与数据管道学习笔记

**学习时间**: 2026-03-29 00:35-01:35
**学习主题**: 特征工程与数据管道最佳实践

---

## 一、特征工程基础

### 1.1 特征工程流程

```
特征工程流程:

┌─────────────────────────────────────────────────────────────────────┐
│                      特征工程流程                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐               │
│  │ 数据探索   │ ─→ │ 特征提取   │ ─→ │ 特征转换   │               │
│  │            │    │            │    │            │               │
│  │ • 数据分布 │    │ • 数值特征 │    │ • 标准化   │               │
│  │ • 相关性   │    │ • 类别特征 │    │ • 归一化   │               │
│  │ • 缺失值   │    │ • 文本特征 │    │ • 编码     │               │
│  └────────────┘    └────────────┘    └────────────┘               │
│         │                                    │                      │
│         │                                    ▼                      │
│         │              ┌────────────┐    ┌────────────┐            │
│         │              │ 特征选择   │ ←─ │ 特征构造   │            │
│         │              │            │    │            │            │
│         │              │ • 过滤法   │    │ • 组合特征 │            │
│         │              │ • 包装法   │    │ • 交叉特征 │            │
│         │              │ • 嵌入法   │    │ • 派生特征 │            │
│         │              └────────────┘    └────────────┘            │
│         │                    │                                       │
│         │                    ▼                                       │
│         │              ┌────────────┐                               │
│         └──────────────│ 特征验证   │                               │
│                        │            │                               │
│                        │ • 重要性   │                               │
│                        │ • 稳定性   │                               │
│                        │ • 可解释性 │                               │
│                        └────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 特征类型与处理

```python
feature_types = {
    "数值特征": {
        "类型": ["连续型", "离散型"],
        "处理": [
            "标准化 (StandardScaler)",
            "归一化 (MinMaxScaler)",
            "分箱 (Binning)",
            "对数变换",
            "多项式特征"
        ],
        "示例": ["年龄", "金额", "数量"]
    },
    "类别特征": {
        "类型": ["有序", "无序"],
        "处理": [
            "独热编码 (One-Hot)",
            "标签编码 (Label)",
            "目标编码 (Target)",
            "频数编码 (Frequency)",
            "嵌入编码 (Embedding)"
        ],
        "示例": ["性别", "地区", "类型"]
    },
    "文本特征": {
        "类型": ["短文本", "长文本"],
        "处理": [
            "TF-IDF",
            "词袋模型 (Bag of Words)",
            "Word2Vec",
            "BERT Embedding",
            "N-gram"
        ],
        "示例": ["标题", "描述", "评论"]
    },
    "时间特征": {
        "类型": ["时间戳", "日期", "时间"],
        "处理": [
            "周期性编码",
            "时间差",
            "时间分段",
            "节假日特征",
            "趋势特征"
        ],
        "示例": ["创建时间", "更新时间", "截止日期"]
    }
}
```

---

## 二、数据管道设计

### 2.1 数据管道架构

```python
# ========================================
# 数据管道架构
# ========================================

data_pipeline_architecture = {
    "数据源": {
        "类型": ["数据库", "API", "文件", "流数据"],
        "处理": ["数据抽取", "数据清洗", "数据转换"]
    },
    "特征存储": {
        "作用": "存储和管理特征",
        "类型": ["在线存储", "离线存储"],
        "工具": ["Feast", "Redis", "PostgreSQL"]
    },
    "特征计算": {
        "类型": ["批处理", "流处理"],
        "框架": ["Spark", "Flink", "Beam"]
    },
    "特征服务": {
        "作用": "提供特征查询接口",
        "延迟": ["实时(<10ms)", "近实时(<100ms)", "批处理(>1s)"]
    }
}
```

### 2.2 金蝶交付系统数据管道优化

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
金蝶交付系统数据管道优化
基于MLOps最佳实践
"""

import os
import json
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path
from dataclasses import dataclass, field
import yaml

@dataclass
class DataSource:
    """数据源配置"""
    name: str
    type: str  # database, file, api
    connection: Dict[str, Any]
    schedule: str  # cron表达式
    enabled: bool = True

@dataclass
class FeatureDefinition:
    """特征定义"""
    name: str
    dtype: str  # int, float, str, bool
    source: str
    transformation: Optional[str] = None
    default: Any = None
    description: str = ""

class FeatureStore:
    """特征存储"""
    
    def __init__(self, store_dir: str = "~/.openclaw/features"):
        self.store_dir = Path(store_dir).expanduser()
        self.registry_file = self.store_dir / "feature_registry.json"
        self.cache_dir = self.store_dir / "cache"
        
        self._ensure_dir()
        self.registry = self._load_registry()
    
    def _ensure_dir(self):
        """确保目录存在"""
        self.store_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def _load_registry(self) -> Dict:
        """加载特征注册表"""
        if self.registry_file.exists():
            with open(self.registry_file, 'r') as f:
                return json.load(f)
        return {"features": {}, "version": "1.0.0"}
    
    def _save_registry(self):
        """保存特征注册表"""
        with open(self.registry_file, 'w') as f:
            json.dump(self.registry, f, indent=2, ensure_ascii=False)
    
    def register_feature(self, feature: FeatureDefinition):
        """注册特征"""
        feature_key = f"{feature.source}.{feature.name}"
        
        self.registry["features"][feature_key] = {
            "name": feature.name,
            "dtype": feature.dtype,
            "source": feature.source,
            "transformation": feature.transformation,
            "default": feature.default,
            "description": feature.description,
            "registered_at": datetime.now().isoformat()
        }
        
        self._save_registry()
    
    def get_feature(self, feature_name: str, source: str) -> Optional[Dict]:
        """获取特征定义"""
        feature_key = f"{source}.{feature_name}"
        return self.registry["features"].get(feature_key)
    
    def list_features(self, source: Optional[str] = None) -> List[Dict]:
        """列出特征"""
        features = list(self.registry["features"].values())
        if source:
            features = [f for f in features if f["source"] == source]
        return features
    
    def compute_feature(self, 
                       feature_name: str, 
                       source: str,
                       context: Dict) -> Any:
        """计算特征"""
        feature_def = self.get_feature(feature_name, source)
        
        if not feature_def:
            return feature_def.get("default") if feature_def else None
        
        # 获取原始值
        raw_value = context.get(feature_name)
        
        # 应用转换
        transformation = feature_def.get("transformation")
        if transformation and raw_value is not None:
            # 这里可以实现各种转换逻辑
            if transformation == "normalize":
                # 标准化
                return self._normalize(raw_value, context)
            elif transformation == "encode":
                # 编码
                return self._encode(raw_value, context)
            elif transformation == "bin":
                # 分箱
                return self._bin(raw_value, context)
        
        return raw_value
    
    def _normalize(self, value: Any, context: Dict) -> float:
        """标准化"""
        # 简化实现
        return float(value) if value else 0.0
    
    def _encode(self, value: Any, context: Dict) -> int:
        """编码"""
        # 简化实现
        return hash(str(value)) % 1000
    
    def _bin(self, value: Any, context: Dict) -> int:
        """分箱"""
        # 简化实现
        if isinstance(value, (int, float)):
            return int(value / 10) * 10
        return 0
    
    def cache_features(self, 
                      entity_id: str,
                      features: Dict[str, Any],
                      ttl_seconds: int = 3600):
        """缓存特征"""
        cache_file = self.cache_dir / f"{entity_id}.json"
        
        cache_data = {
            "features": features,
            "cached_at": datetime.now().isoformat(),
            "ttl_seconds": ttl_seconds
        }
        
        with open(cache_file, 'w') as f:
            json.dump(cache_data, f)
    
    def get_cached_features(self, entity_id: str) -> Optional[Dict]:
        """获取缓存的特征"""
        cache_file = self.cache_dir / f"{entity_id}.json"
        
        if not cache_file.exists():
            return None
        
        with open(cache_file, 'r') as f:
            cache_data = json.load(f)
        
        # 检查是否过期
        cached_at = datetime.fromisoformat(cache_data["cached_at"])
        ttl = cache_data["ttl_seconds"]
        
        if (datetime.now() - cached_at).total_seconds() > ttl:
            return None
        
        return cache_data["features"]

class DataPipeline:
    """数据管道"""
    
    def __init__(self, config_dir: str = "~/.openclaw/pipelines"):
        self.config_dir = Path(config_dir).expanduser()
        self.feature_store = FeatureStore()
        self.pipelines: Dict[str, Dict] = {}
        
        self._ensure_dir()
        self._load_pipelines()
    
    def _ensure_dir(self):
        """确保目录存在"""
        self.config_dir.mkdir(parents=True, exist_ok=True)
    
    def _load_pipelines(self):
        """加载管道配置"""
        for pipeline_file in self.config_dir.glob("*.yaml"):
            with open(pipeline_file, 'r') as f:
                pipeline_config = yaml.safe_load(f)
                self.pipelines[pipeline_config["name"]] = pipeline_config
    
    def create_pipeline(self, 
                       name: str,
                       sources: List[DataSource],
                       features: List[FeatureDefinition],
                       schedule: str = "0 * * * *"):
        """创建数据管道"""
        pipeline_config = {
            "name": name,
            "sources": [vars(s) for s in sources],
            "features": [vars(f) for f in features],
            "schedule": schedule,
            "created_at": datetime.now().isoformat(),
            "enabled": True
        }
        
        # 保存配置
        pipeline_file = self.config_dir / f"{name}.yaml"
        with open(pipeline_file, 'w') as f:
            yaml.dump(pipeline_config, f, default_flow_style=False)
        
        # 注册特征
        for feature in features:
            self.feature_store.register_feature(feature)
        
        self.pipelines[name] = pipeline_config
    
    def run_pipeline(self, pipeline_name: str, context: Dict) -> Dict[str, Any]:
        """运行管道"""
        pipeline = self.pipelines.get(pipeline_name)
        
        if not pipeline:
            raise ValueError(f"Pipeline {pipeline_name} not found")
        
        results = {}
        
        # 计算特征
        for feature_config in pipeline["features"]:
            feature_name = feature_config["name"]
            source = feature_config["source"]
            
            value = self.feature_store.compute_feature(
                feature_name, source, context
            )
            
            results[feature_name] = value
        
        return results

# ========================================
# 金蝶交付系统特征定义
# ========================================

def init_kingdee_features():
    """初始化金蝶交付系统特征"""
    feature_store = FeatureStore()
    
    # 项目特征
    features = [
        # 项目基本信息特征
        FeatureDefinition(
            name="project_type",
            dtype="str",
            source="project",
            transformation="encode",
            description="项目类型编码"
        ),
        FeatureDefinition(
            name="project_scale",
            dtype="int",
            source="project",
            transformation="bin",
            description="项目规模分箱"
        ),
        FeatureDefinition(
            name="module_count",
            dtype="int",
            source="project",
            description="模块数量"
        ),
        
        # 时间特征
        FeatureDefinition(
            name="project_duration",
            dtype="int",
            source="project",
            description="项目工期(天)"
        ),
        FeatureDefinition(
            name="team_size",
            dtype="int",
            source="project",
            transformation="bin",
            description="团队规模分箱"
        ),
        
        # 文档特征
        FeatureDefinition(
            name="doc_page_count",
            dtype="int",
            source="document",
            transformation="bin",
            description="文档页数分箱"
        ),
        FeatureDefinition(
            name="doc_completeness",
            dtype="float",
            source="document",
            transformation="normalize",
            description="文档完整性"
        ),
        
        # 历史特征
        FeatureDefinition(
            name="historical_success_rate",
            dtype="float",
            source="history",
            transformation="normalize",
            description="历史成功率"
        ),
        FeatureDefinition(
            name="avg_delivery_time",
            dtype="float",
            source="history",
            description="平均交付时间"
        ),
    ]
    
    # 注册特征
    for feature in features:
        feature_store.register_feature(feature)
    
    return feature_store

if __name__ == "__main__":
    # 初始化金蝶特征
    store = init_kingdee_features()
    
    # 列出所有特征
    print("Registered features:")
    for f in store.list_features():
        print(f"  - {f['source']}.{f['name']}: {f['description']}")
    
    # 创建数据管道
    pipeline = DataPipeline()
    
    # 创建金蝶项目管道
    pipeline.create_pipeline(
        name="kingdee_project_pipeline",
        sources=[
            DataSource(
                name="project_db",
                type="database",
                connection={"host": "localhost", "port": 3306},
                schedule="0 * * * *"
            )
        ],
        features=[
            FeatureDefinition("project_type", "str", "project", "encode"),
            FeatureDefinition("project_scale", "int", "project", "bin"),
        ]
    )
    
    print(f"\nPipelines: {list(pipeline.pipelines.keys())}")
