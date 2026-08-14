#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
金蝶交付自动化系统 - 缓存与性能模块 v1.0
提供生成缓存、性能监控、异步处理功能
"""

import os
import json
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable
from functools import wraps
import threading
import queue

# 缓存目录
CACHE_DIR = os.path.expanduser("~/.openclaw/workspace/cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# 性能统计
PERF_STATS = {
    'total_generations': 0,
    'cache_hits': 0,
    'cache_misses': 0,
    'total_time': 0,
    'avg_time': 0
}


class GenerationCache:
    """生成缓存管理器"""
    
    def __init__(self, cache_dir: str = None, ttl: int = 3600):
        """
        初始化缓存管理器
        
        Args:
            cache_dir: 缓存目录
            ttl: 缓存有效期（秒），默认1小时
        """
        self.cache_dir = cache_dir or CACHE_DIR
        self.ttl = ttl
        self._lock = threading.Lock()
        os.makedirs(self.cache_dir, exist_ok=True)
    
    def _get_cache_key(self, customer_info: Dict[str, Any], doc_type: str) -> str:
        """
        生成缓存键
        
        Args:
            customer_info: 客户信息
            doc_type: 文档类型
        
        Returns:
            缓存键
        """
        # 使用客户信息和文档类型生成唯一键
        key_data = {
            'companyName': customer_info.get('companyName', ''),
            'industry': customer_info.get('industry', ''),
            'companySize': customer_info.get('companySize', ''),
            'employees': customer_info.get('employees', ''),
            'revenue': customer_info.get('revenue', ''),
            'docType': doc_type
        }
        key_str = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def _get_cache_path(self, cache_key: str) -> str:
        """获取缓存文件路径"""
        return os.path.join(self.cache_dir, f"{cache_key}.json")
    
    def get(self, customer_info: Dict[str, Any], doc_type: str) -> Optional[Dict[str, Any]]:
        """
        获取缓存
        
        Args:
            customer_info: 客户信息
            doc_type: 文档类型
        
        Returns:
            缓存数据或None
        """
        cache_key = self._get_cache_key(customer_info, doc_type)
        cache_path = self._get_cache_path(cache_key)
        
        with self._lock:
            if not os.path.exists(cache_path):
                PERF_STATS['cache_misses'] += 1
                return None
            
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
                
                # 检查是否过期
                cache_time = datetime.fromisoformat(cache_data.get('timestamp', '2000-01-01'))
                if datetime.now() - cache_time > timedelta(seconds=self.ttl):
                    # 缓存过期，删除
                    os.remove(cache_path)
                    PERF_STATS['cache_misses'] += 1
                    return None
                
                PERF_STATS['cache_hits'] += 1
                return cache_data.get('data')
                
            except Exception as e:
                PERF_STATS['cache_misses'] += 1
                return None
    
    def set(self, customer_info: Dict[str, Any], doc_type: str, data: Dict[str, Any]) -> bool:
        """
        设置缓存
        
        Args:
            customer_info: 客户信息
            doc_type: 文档类型
            data: 缓存数据
        
        Returns:
            是否成功
        """
        cache_key = self._get_cache_key(customer_info, doc_type)
        cache_path = self._get_cache_path(cache_key)
        
        with self._lock:
            try:
                cache_data = {
                    'key': cache_key,
                    'docType': doc_type,
                    'companyName': customer_info.get('companyName', ''),
                    'timestamp': datetime.now().isoformat(),
                    'data': data
                }
                
                with open(cache_path, 'w', encoding='utf-8') as f:
                    json.dump(cache_data, f, ensure_ascii=False, indent=2)
                
                return True
                
            except Exception as e:
                print(f"缓存写入失败: {e}")
                return False
    
    def clear(self, cache_key: str = None) -> int:
        """
        清除缓存
        
        Args:
            cache_key: 缓存键，为None时清除所有
        
        Returns:
            清除的缓存数量
        """
        count = 0
        
        with self._lock:
            if cache_key:
                # 清除指定缓存
                cache_path = self._get_cache_path(cache_key)
                if os.path.exists(cache_path):
                    os.remove(cache_path)
                    count = 1
            else:
                # 清除所有缓存
                for filename in os.listdir(self.cache_dir):
                    if filename.endswith('.json'):
                        os.remove(os.path.join(self.cache_dir, filename))
                        count += 1
        
        return count
    
    def stats(self) -> Dict[str, Any]:
        """
        获取缓存统计
        
        Returns:
            缓存统计信息
        """
        cache_files = [f for f in os.listdir(self.cache_dir) if f.endswith('.json')]
        
        return {
            'total_cache': len(cache_files),
            'cache_hits': PERF_STATS['cache_hits'],
            'cache_misses': PERF_STATS['cache_misses'],
            'hit_rate': PERF_STATS['cache_hits'] / (PERF_STATS['cache_hits'] + PERF_STATS['cache_misses']) 
                        if (PERF_STATS['cache_hits'] + PERF_STATS['cache_misses']) > 0 else 0
        }


class PerformanceMonitor:
    """性能监控器"""
    
    def __init__(self):
        self.metrics = {}
        self._lock = threading.Lock()
    
    def start_timer(self, name: str) -> str:
        """
        开始计时
        
        Args:
            name: 计时器名称
        
        Returns:
            计时器ID
        """
        timer_id = f"{name}_{time.time()}"
        
        with self._lock:
            self.metrics[timer_id] = {
                'name': name,
                'start_time': time.time(),
                'end_time': None,
                'duration': None
            }
        
        return timer_id
    
    def stop_timer(self, timer_id: str) -> float:
        """
        停止计时
        
        Args:
            timer_id: 计时器ID
        
        Returns:
            耗时（秒）
        """
        with self._lock:
            if timer_id not in self.metrics:
                return 0
            
            metric = self.metrics[timer_id]
            metric['end_time'] = time.time()
            metric['duration'] = metric['end_time'] - metric['start_time']
            
            # 更新全局统计
            name = metric['name']
            if name not in PERF_STATS:
                PERF_STATS[name] = {'count': 0, 'total_time': 0, 'avg_time': 0}
            
            PERF_STATS[name]['count'] += 1
            PERF_STATS[name]['total_time'] += metric['duration']
            PERF_STATS[name]['avg_time'] = PERF_STATS[name]['total_time'] / PERF_STATS[name]['count']
            
            return metric['duration']
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        获取性能指标
        
        Returns:
            性能指标
        """
        with self._lock:
            return {
                'metrics': dict(self.metrics),
                'stats': dict(PERF_STATS)
            }


def performance_tracker(func: Callable) -> Callable:
    """
    性能追踪装饰器
    
    Args:
        func: 要追踪的函数
    
    Returns:
        包装后的函数
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            
            PERF_STATS['total_generations'] += 1
            PERF_STATS['total_time'] += duration
            PERF_STATS['avg_time'] = PERF_STATS['total_time'] / PERF_STATS['total_generations']
            
            # 记录到结果
            if isinstance(result, dict):
                result['_performance'] = {
                    'duration': round(duration, 3),
                    'function': func.__name__
                }
            
            return result
        except Exception as e:
            duration = time.time() - start_time
            print(f"性能追踪错误 [{func.__name__}]: {e} (耗时: {duration:.3f}s)")
            raise
    
    return wrapper


class AsyncTaskQueue:
    """异步任务队列"""
    
    def __init__(self, max_workers: int = 3):
        """
        初始化异步任务队列
        
        Args:
            max_workers: 最大工作线程数
        """
        self.task_queue = queue.Queue()
        self.result_queue = queue.Queue()
        self.max_workers = max_workers
        self.workers = []
        self.running = False
    
    def worker(self):
        """工作线程"""
        while self.running:
            try:
                task = self.task_queue.get(timeout=1)
                if task is None:
                    break
                
                task_id, func, args, kwargs = task
                
                try:
                    result = func(*args, **kwargs)
                    self.result_queue.put((task_id, 'success', result))
                except Exception as e:
                    self.result_queue.put((task_id, 'error', str(e)))
                
                self.task_queue.task_done()
                
            except queue.Empty:
                continue
    
    def start(self):
        """启动工作线程"""
        self.running = True
        for _ in range(self.max_workers):
            worker_thread = threading.Thread(target=self.worker, daemon=True)
            worker_thread.start()
            self.workers.append(worker_thread)
    
    def stop(self):
        """停止工作线程"""
        self.running = False
        for _ in range(self.max_workers):
            self.task_queue.put(None)
        
        for worker in self.workers:
            worker.join(timeout=5)
        
        self.workers = []
    
    def submit(self, task_id: str, func: Callable, *args, **kwargs) -> str:
        """
        提交任务
        
        Args:
            task_id: 任务ID
            func: 任务函数
            args: 位置参数
            kwargs: 关键字参数
        
        Returns:
            任务ID
        """
        self.task_queue.put((task_id, func, args, kwargs))
        return task_id
    
    def get_result(self, timeout: float = None) -> Optional[tuple]:
        """
        获取结果
        
        Args:
            timeout: 超时时间
        
        Returns:
            (task_id, status, result) 或 None
        """
        try:
            return self.result_queue.get(timeout=timeout)
        except queue.Empty:
            return None
    
    def get_all_results(self) -> List[tuple]:
        """
        获取所有结果
        
        Returns:
            结果列表
        """
        results = []
        while not self.result_queue.empty():
            try:
                results.append(self.result_queue.get_nowait())
            except queue.Empty:
                break
        return results
    
    def pending_count(self) -> int:
        """
        获取待处理任务数
        
        Returns:
            待处理任务数
        """
        return self.task_queue.qsize()


# 全局实例
_cache = GenerationCache()
_monitor = PerformanceMonitor()
_task_queue = AsyncTaskQueue()


def get_cache() -> GenerationCache:
    """获取缓存实例"""
    return _cache


def get_monitor() -> PerformanceMonitor:
    """获取性能监控实例"""
    return _monitor


def get_task_queue() -> AsyncTaskQueue:
    """获取任务队列实例"""
    return _task_queue


# 模块信息
__version__ = "1.0.0"
__author__ = "ClawBot"
__description__ = "金蝶交付自动化系统缓存与性能模块"


if __name__ == "__main__":
    # 测试代码
    print("缓存与性能模块测试")
    
    # 测试缓存
    cache = GenerationCache()
    test_customer = {
        'companyName': '测试企业',
        'industry': '制造业',
        'companySize': '中型企业'
    }
    
    # 设置缓存
    cache.set(test_customer, 'presales', {'test': 'data'})
    print("缓存已设置")
    
    # 获取缓存
    data = cache.get(test_customer, 'presales')
    print(f"缓存获取: {data}")
    
    # 缓存统计
    stats = cache.stats()
    print(f"缓存统计: {stats}")
    
    # 性能监控
    monitor = PerformanceMonitor()
    timer_id = monitor.start_timer('test')
    time.sleep(0.1)
    duration = monitor.stop_timer(timer_id)
    print(f"耗时: {duration:.3f}s")
    
    print("\n模块测试完成！")
