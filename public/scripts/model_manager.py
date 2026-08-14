#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ClawBot模型管理器 v2.0
基于MLOps最佳实践设计的模型管理系统
"""

import os
import json
import yaml
import hashlib
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
from dataclasses import dataclass, field, asdict
from enum import Enum

class ModelStage(Enum):
    """模型阶段"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    ARCHIVED = "archived"

@dataclass
class ModelInfo:
    """模型信息"""
    id: str
    name: str
    provider: str
    model_type: str
    version: str
    config: Dict[str, Any]
    metrics: Dict[str, float] = field(default_factory=dict)
    stage: str = ModelStage.DEVELOPMENT.value
    registered_at: str = ""
    last_used_at: str = ""
    usage_count: int = 0
    
    def __post_init__(self):
        if not self.registered_at:
            self.registered_at = datetime.now().isoformat()

class ModelRegistry:
    """模型注册表"""
    
    def __init__(self, registry_dir: str = "~/.openclaw/models"):
        self.registry_dir = Path(registry_dir).expanduser()
        self.registry_file = self.registry_dir / "registry.json"
        self.models: Dict[str, ModelInfo] = {}
        self.current_model_id: Optional[str] = None
        
        self._ensure_dir()
        self._load_registry()
    
    def _ensure_dir(self):
        """确保目录存在"""
        self.registry_dir.mkdir(parents=True, exist_ok=True)
    
    def _load_registry(self):
        """加载注册表"""
        if self.registry_file.exists():
            with open(self.registry_file, 'r') as f:
                data = json.load(f)
                self.current_model_id = data.get("current")
                for mid, mdata in data.get("models", {}).items():
                    self.models[mid] = ModelInfo(**mdata)
    
    def _save_registry(self):
        """保存注册表"""
        data = {
            "current": self.current_model_id,
            "models": {mid: asdict(m) for mid, m in self.models.items()},
            "updated_at": datetime.now().isoformat()
        }
        with open(self.registry_file, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def register(self, 
                 name: str,
                 provider: str,
                 model_type: str,
                 version: str,
                 config: Dict[str, Any],
                 metrics: Optional[Dict[str, float]] = None) -> str:
        """注册模型"""
        # 生成模型ID
        model_id = hashlib.md5(
            f"{provider}:{name}:{version}".encode()
        ).hexdigest()[:12]
        
        # 创建模型信息
        model = ModelInfo(
            id=model_id,
            name=name,
            provider=provider,
            model_type=model_type,
            version=version,
            config=config,
            metrics=metrics or {}
        )
        
        # 注册模型
        self.models[model_id] = model
        self._save_registry()
        
        return model_id
    
    def get(self, model_id: str) -> Optional[ModelInfo]:
        """获取模型"""
        return self.models.get(model_id)
    
    def list(self, 
             provider: Optional[str] = None,
             model_type: Optional[str] = None,
             stage: Optional[str] = None) -> List[ModelInfo]:
        """列出模型"""
        models = list(self.models.values())
        
        if provider:
            models = [m for m in models if m.provider == provider]
        if model_type:
            models = [m for m in models if m.model_type == model_type]
        if stage:
            models = [m for m in models if m.stage == stage]
        
        return sorted(models, key=lambda m: m.registered_at, reverse=True)
    
    def promote(self, model_id: str, stage: str):
        """提升模型阶段"""
        if model_id in self.models:
            self.models[model_id].stage = stage
            if stage == ModelStage.PRODUCTION.value:
                self.current_model_id = model_id
            self._save_registry()
    
    def get_current(self) -> Optional[ModelInfo]:
        """获取当前生产模型"""
        if self.current_model_id:
            return self.get(self.current_model_id)
        return None
    
    def record_usage(self, model_id: str):
        """记录使用"""
        if model_id in self.models:
            self.models[model_id].usage_count += 1
            self.models[model_id].last_used_at = datetime.now().isoformat()
            self._save_registry()
    
    def archive(self, model_id: str):
        """归档模型"""
        if model_id in self.models:
            self.models[model_id].stage = ModelStage.ARCHIVED.value
            self._save_registry()
    
    def compare(self, model_ids: List[str]) -> Dict[str, Dict]:
        """比较模型"""
        comparison = {}
        for mid in model_ids:
            model = self.get(mid)
            if model:
                comparison[mid] = {
                    "name": model.name,
                    "provider": model.provider,
                    "version": model.version,
                    "metrics": model.metrics,
                    "stage": model.stage,
                    "usage_count": model.usage_count
                }
        return comparison

class ModelSelector:
    """模型选择器"""
    
    def __init__(self, registry: ModelRegistry):
        self.registry = registry
        self.routing_rules = self._load_routing_rules()
    
    def _load_routing_rules(self) -> List[Dict]:
        """加载路由规则"""
        return [
            # 快速响应任务
            {
                "condition": lambda ctx: ctx.get("token_estimate", 0) < 500,
                "pool": "high_speed",
                "priority": 1
            },
            # 视觉任务
            {
                "condition": lambda ctx: ctx.get("has_image", False),
                "pool": "vision",
                "priority": 2
            },
            # 大文本任务
            {
                "condition": lambda ctx: ctx.get("token_estimate", 0) > 5000,
                "pool": "text",
                "priority": 1
            },
            # 复杂推理任务
            {
                "condition": lambda ctx: ctx.get("complexity") == "high",
                "pool": "intelligent",
                "priority": 2
            },
            # 默认
            {
                "condition": lambda ctx: True,
                "pool": "intelligent",
                "priority": 0
            }
        ]
    
    def select_model(self, context: Dict[str, Any]) -> Optional[ModelInfo]:
        """选择模型"""
        # 按优先级排序规则
        sorted_rules = sorted(self.routing_rules, key=lambda r: r["priority"], reverse=True)
        
        # 匹配规则
        for rule in sorted_rules:
            if rule["condition"](context):
                pool_name = rule["pool"]
                # 从注册表获取对应池的生产模型
                models = self.registry.list(
                    model_type=pool_name,
                    stage=ModelStage.PRODUCTION.value
                )
                if models:
                    return models[0]
        
        # 返回默认生产模型
        return self.registry.get_current()
    
    def get_fallback_model(self, current_model: ModelInfo) -> Optional[ModelInfo]:
        """获取降级模型"""
        # 定义降级映射
        fallback_map = {
            "unicom/glm-5": "zai/glm-5-turbo",
            "unicom/glm-4v": "zai/glm-4v",
            "zai/glm-4-flash": "zai/glm-4"
        }
        
        model_key = f"{current_model.provider}/{current_model.name}"
        fallback_key = fallback_map.get(model_key)
        
        if fallback_key:
            fallback_provider, fallback_name = fallback_key.split("/")
            models = self.registry.list(
                provider=fallback_provider,
                model_type=current_model.model_type
            )
            for model in models:
                if model.name == fallback_name:
                    return model
        
        return None

class ModelMonitor:
    """模型监控器"""
    
    def __init__(self, registry: ModelRegistry):
        self.registry = registry
        self.metrics_file = registry.registry_dir / "metrics.json"
        self.metrics = self._load_metrics()
    
    def _load_metrics(self) -> Dict:
        """加载指标"""
        if self.metrics_file.exists():
            with open(self.metrics_file, 'r') as f:
                return json.load(f)
        return {"requests": [], "daily_stats": {}}
    
    def _save_metrics(self):
        """保存指标"""
        with open(self.metrics_file, 'w') as f:
            json.dump(self.metrics, f, indent=2, ensure_ascii=False)
    
    def record_request(self, 
                       model_id: str,
                       latency_ms: float,
                       tokens_used: int,
                       success: bool,
                       error: Optional[str] = None):
        """记录请求"""
        request_record = {
            "model_id": model_id,
            "latency_ms": latency_ms,
            "tokens_used": tokens_used,
            "success": success,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        
        self.metrics["requests"].append(request_record)
        
        # 限制历史记录数量
        if len(self.metrics["requests"]) > 10000:
            self.metrics["requests"] = self.metrics["requests"][-5000:]
        
        self._save_metrics()
    
    def get_stats(self, model_id: str, hours: int = 24) -> Dict:
        """获取统计"""
        cutoff = datetime.now().timestamp() - hours * 3600
        
        model_requests = [
            r for r in self.metrics["requests"]
            if r["model_id"] == model_id
            and datetime.fromisoformat(r["timestamp"]).timestamp() > cutoff
        ]
        
        if not model_requests:
            return {"error": "No data"}
        
        latencies = [r["latency_ms"] for r in model_requests]
        tokens = [r["tokens_used"] for r in model_requests]
        successes = [r["success"] for r in model_requests]
        
        return {
            "total_requests": len(model_requests),
            "success_rate": sum(successes) / len(successes),
            "avg_latency_ms": sum(latencies) / len(latencies),
            "p99_latency_ms": sorted(latencies)[int(len(latencies) * 0.99)],
            "total_tokens": sum(tokens),
            "avg_tokens": sum(tokens) / len(tokens)
        }
    
    def check_health(self, model_id: str) -> Dict:
        """检查健康状态"""
        stats = self.get_stats(model_id, hours=1)
        
        issues = []
        if stats.get("success_rate", 1) < 0.95:
            issues.append(f"Success rate low: {stats['success_rate']:.2%}")
        if stats.get("avg_latency_ms", 0) > 5000:
            issues.append(f"High latency: {stats['avg_latency_ms']:.0f}ms")
        
        return {
            "model_id": model_id,
            "healthy": len(issues) == 0,
            "issues": issues,
            "stats": stats
        }

# ========================================
# 使用示例
# ========================================

def init_default_models():
    """初始化默认模型"""
    registry = ModelRegistry()
    
    # 注册模型池
    # 高速池
    registry.register(
        name="glm-4-flash",
        provider="zai",
        model_type="high_speed",
        version="1.0.0",
        config={
            "max_tokens": 1000,
            "temperature": 0.5,
            "top_p": 0.9
        },
        metrics={"latency_p50": 100, "latency_p99": 200}
    )
    
    # 智能池
    registry.register(
        name="glm-5",
        provider="unicom",
        model_type="intelligent",
        version="1.0.0",
        config={
            "max_tokens": 4000,
            "temperature": 0.7,
            "top_p": 0.95
        },
        metrics={"latency_p50": 300, "latency_p99": 500}
    )
    
    # 文本池
    registry.register(
        name="glm-4-long",
        provider="zai",
        model_type="text",
        version="1.0.0",
        config={
            "max_tokens": 10000,
            "temperature": 0.6
        },
        metrics={"latency_p50": 400, "latency_p99": 800}
    )
    
    # 视觉池
    registry.register(
        name="glm-4v",
        provider="zai",
        model_type="vision",
        version="1.0.0",
        config={
            "max_tokens": 2000,
            "temperature": 0.7
        },
        metrics={"latency_p50": 500, "latency_p99": 1000}
    )
    
    # 提升到生产环境
    for model in registry.list():
        if model.model_type == "intelligent":
            registry.promote(model.id, ModelStage.PRODUCTION.value)
    
    return registry

if __name__ == "__main__":
    # 初始化
    registry = init_default_models()
    selector = ModelSelector(registry)
    monitor = ModelMonitor(registry)
    
    # 测试模型选择
    context = {"token_estimate": 300, "complexity": "normal"}
    model = selector.select_model(context)
    print(f"Selected model: {model.name if model else 'None'}")
    
    # 列出所有模型
    print("\nAll models:")
    for m in registry.list():
        print(f"  - {m.provider}/{m.name} ({m.stage})")
    
    # 获取当前生产模型
    current = registry.get_current()
    if current:
        print(f"\nCurrent production model: {current.provider}/{current.name}")
        print(f"Metrics: {current.metrics}")
