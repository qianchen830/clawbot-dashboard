#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ClawBot 缓存系统
支持内存缓存、文件缓存、数据库缓存
"""

import os
import json
import time
import hashlib
import pickle
from pathlib import Path
from typing import Any, Optional, Callable
from functools import wraps
from threading import Lock


class MemoryCache:
    """内存缓存"""
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 3600):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache = {}
        self._lock = Lock()
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存"""
        with self._lock:
            if key not in self._cache:
                return None
            
            item = self._cache[key]
            if time.time() > item['expires']:
                del self._cache[key]
                return None
            
            return item['value']
    
    def set(self, key: str, value: Any, ttl: int = None):
        """设置缓存"""
        with self._lock:
            # LRU淘汰
            if len(self._cache) >= self.max_size:
                oldest_key = min(self._cache.keys(), 
                                key=lambda k: self._cache[k]['expires'])
                del self._cache[oldest_key]
            
            self._cache[key] = {
                'value': value,
                'expires': time.time() + (ttl or self.default_ttl),
                'created': time.time()
            }
    
    def delete(self, key: str):
        """删除缓存"""
        with self._lock:
            self._cache.pop(key, None)
    
    def clear(self):
        """清空缓存"""
        with self._lock:
            self._cache.clear()
    
    def get_stats(self):
        """获取缓存统计"""
        with self._lock:
            return {
                'size': len(self._cache),
                'max_size': self.max_size,
                'keys': list(self._cache.keys())
            }


class FileCache:
    """文件缓存"""
    
    def __init__(self, cache_dir: str = '~/.openclaw/cache', default_ttl: int = 3600):
        self.cache_dir = Path(cache_dir).expanduser()
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.default_ttl = default_ttl
    
    def _get_file_path(self, key: str) -> Path:
        """获取缓存文件路径"""
        key_hash = hashlib.md5(key.encode()).hexdigest()
        return self.cache_dir / f'{key_hash}.cache'
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存"""
        file_path = self._get_file_path(key)
        
        if not file_path.exists():
            return None
        
        try:
            with open(file_path, 'rb') as f:
                data = pickle.load(f)
            
            if time.time() > data['expires']:
                file_path.unlink()
                return None
            
            return data['value']
        except Exception:
            return None
    
    def set(self, key: str, value: Any, ttl: int = None):
        """设置缓存"""
        file_path = self._get_file_path(key)
        
        data = {
            'key': key,
            'value': value,
            'expires': time.time() + (ttl or self.default_ttl),
            'created': time.time()
        }
        
        with open(file_path, 'wb') as f:
            pickle.dump(data, f)
    
    def delete(self, key: str):
        """删除缓存"""
        file_path = self._get_file_path(key)
        file_path.unlink(missing_ok=True)
    
    def clear(self):
        """清空缓存"""
        for file in self.cache_dir.glob('*.cache'):
            file.unlink()
    
    def get_stats(self):
        """获取缓存统计"""
        files = list(self.cache_dir.glob('*.cache'))
        total_size = sum(f.stat().st_size for f in files)
        return {
            'count': len(files),
            'total_size': total_size,
            'cache_dir': str(self.cache_dir)
        }


class CacheManager:
    """缓存管理器 - 多级缓存"""
    
    def __init__(self, memory_size: int = 1000, default_ttl: int = 3600):
        self.memory_cache = MemoryCache(max_size=memory_size, default_ttl=default_ttl)
        self.file_cache = FileCache(default_ttl=default_ttl)
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存（L1 -> L2）"""
        # L1: 内存缓存
        value = self.memory_cache.get(key)
        if value is not None:
            return value
        
        # L2: 文件缓存
        value = self.file_cache.get(key)
        if value is not None:
            # 提升到L1
            self.memory_cache.set(key, value)
            return value
        
        return None
    
    def set(self, key: str, value: Any, ttl: int = None):
        """设置缓存"""
        self.memory_cache.set(key, value, ttl)
        self.file_cache.set(key, value, ttl)
    
    def delete(self, key: str):
        """删除缓存"""
        self.memory_cache.delete(key)
        self.file_cache.delete(key)
    
    def clear(self):
        """清空缓存"""
        self.memory_cache.clear()
        self.file_cache.clear()
    
    def get_stats(self):
        """获取缓存统计"""
        return {
            'memory': self.memory_cache.get_stats(),
            'file': self.file_cache.get_stats()
        }


def cached(ttl: int = 3600, key_prefix: str = ''):
    """缓存装饰器"""
    def decorator(func: Callable) -> Callable:
        cache = CacheManager()
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存key
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # 尝试获取缓存
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # 执行函数
            result = func(*args, **kwargs)
            
            # 设置缓存
            cache.set(cache_key, result, ttl)
            
            return result
        
        # 添加缓存控制方法
        wrapper.cache = cache
        wrapper.cache_clear = lambda: cache.clear()
        wrapper.cache_get = lambda k: cache.get(k)
        wrapper.cache_set = lambda k, v: cache.set(k, v, ttl)
        
        return wrapper
    
    return decorator


# 全局缓存实例
_cache_manager = None

def get_cache() -> CacheManager:
    """获取全局缓存实例"""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager()
    return _cache_manager


if __name__ == '__main__':
    # 测试
    print("=== 内存缓存测试 ===")
    mem_cache = MemoryCache(max_size=3)
    
    mem_cache.set('key1', 'value1')
    mem_cache.set('key2', 'value2')
    mem_cache.set('key3', 'value3')
    
    print(f"key1: {mem_cache.get('key1')}")
    print(f"key2: {mem_cache.get('key2')}")
    print(f"缓存统计: {mem_cache.get_stats()}")
    
    # LRU淘汰测试
    mem_cache.set('key4', 'value4')  # 应该淘汰key1
    print(f"key1 (应被淘汰): {mem_cache.get('key1')}")
    print(f"缓存统计: {mem_cache.get_stats()}")
    
    print("\n=== 文件缓存测试 ===")
    file_cache = FileCache()
    
    file_cache.set('file_key', {'data': 'test_value'}, ttl=60)
    print(f"file_key: {file_cache.get('file_key')}")
    print(f"文件缓存统计: {file_cache.get_stats()}")
    
    print("\n=== 缓存管理器测试 ===")
    cache = CacheManager()
    
    cache.set('multi_key', 'multi_value', ttl=60)
    print(f"multi_key: {cache.get('multi_key')}")
    print(f"多级缓存统计: {cache.get_stats()}")
    
    print("\n=== 装饰器测试 ===")
    @cached(ttl=60, key_prefix='test')
    def expensive_function(n):
        print(f"  计算中... n={n}")
        return n * n
    
    print(f"第一次调用: {expensive_function(5)}")
    print(f"第二次调用 (缓存): {expensive_function(5)}")
    
    print("\n缓存测试完成")
