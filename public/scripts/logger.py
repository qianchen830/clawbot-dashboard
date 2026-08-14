#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ClawBot 日志系统
支持结构化日志、日志轮转、日志分类
"""

import os
import sys
import json
import logging
import logging.handlers
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from functools import wraps
import traceback


class StructuredFormatter(logging.Formatter):
    """结构化日志格式器"""
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # 添加额外字段
        if hasattr(record, 'data'):
            log_entry['data'] = record.data
        
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry, ensure_ascii=False)


class ClawBotLogger:
    """ClawBot日志管理器"""
    
    _loggers = {}
    
    def __init__(self, name: str, log_dir: str = '~/.openclaw/logs'):
        self.name = name
        self.log_dir = Path(log_dir).expanduser()
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)
        
        # 避免重复添加handler
        if not self.logger.handlers:
            self._setup_handlers()
    
    def _setup_handlers(self):
        """设置日志处理器"""
        
        # 控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_format = logging.Formatter(
            '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        )
        console_handler.setFormatter(console_format)
        self.logger.addHandler(console_handler)
        
        # 文件处理器（带轮转）
        log_file = self.log_dir / f'{self.name}.log'
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(file_handler)
        
        # 错误日志单独存储
        error_file = self.log_dir / f'{self.name}_error.log'
        error_handler = logging.handlers.RotatingFileHandler(
            error_file,
            maxBytes=5 * 1024 * 1024,  # 5MB
            backupCount=3,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(error_handler)
    
    def debug(self, message: str, data: Dict = None):
        """调试日志"""
        self._log(logging.DEBUG, message, data)
    
    def info(self, message: str, data: Dict = None):
        """信息日志"""
        self._log(logging.INFO, message, data)
    
    def warning(self, message: str, data: Dict = None):
        """警告日志"""
        self._log(logging.WARNING, message, data)
    
    def error(self, message: str, data: Dict = None, exc_info: bool = False):
        """错误日志"""
        self._log(logging.ERROR, message, data, exc_info=exc_info)
    
    def critical(self, message: str, data: Dict = None):
        """严重错误日志"""
        self._log(logging.CRITICAL, message, data)
    
    def _log(self, level: int, message: str, data: Dict = None, **kwargs):
        """内部日志方法"""
        extra = {'data': data} if data else {}
        self.logger.log(level, message, extra=extra, **kwargs)
    
    def log_function(self, func):
        """函数调用日志装饰器"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            func_name = func.__name__
            self.debug(f'Calling {func_name}', {'args': str(args)[:200]})
            try:
                result = func(*args, **kwargs)
                self.debug(f'{func_name} completed')
                return result
            except Exception as e:
                self.error(f'{func_name} failed: {str(e)}', exc_info=True)
                raise
        return wrapper
    
    def log_api_call(self, method: str, endpoint: str, status: int, duration: float):
        """记录API调用"""
        self.info('API Call', {
            'method': method,
            'endpoint': endpoint,
            'status': status,
            'duration_ms': round(duration * 1000, 2)
        })
    
    def log_service_status(self, service: str, status: str, port: int = None):
        """记录服务状态"""
        self.info('Service Status', {
            'service': service,
            'status': status,
            'port': port
        })
    
    def log_backup(self, backup_type: str, file: str, size: str, success: bool):
        """记录备份"""
        self.info('Backup', {
            'type': backup_type,
            'file': file,
            'size': size,
            'success': success
        })
    
    def log_generation(self, generator: str, output: str, duration: float):
        """记录PPT生成"""
        self.info('PPT Generated', {
            'generator': generator,
            'output': output,
            'duration_ms': round(duration * 1000, 2)
        })


def get_logger(name: str) -> ClawBotLogger:
    """获取日志器实例"""
    if name not in ClawBotLogger._loggers:
        ClawBotLogger._loggers[name] = ClawBotLogger(name)
    return ClawBotLogger._loggers[name]


# 创建默认日志器
default_logger = get_logger('clawbot')


# 便捷函数
def debug(message: str, data: Dict = None):
    default_logger.debug(message, data)

def info(message: str, data: Dict = None):
    default_logger.info(message, data)

def warning(message: str, data: Dict = None):
    default_logger.warning(message, data)

def error(message: str, data: Dict = None, exc_info: bool = False):
    default_logger.error(message, data, exc_info)

def critical(message: str, data: Dict = None):
    default_logger.critical(message, data)


if __name__ == '__main__':
    # 测试
    logger = get_logger('test')
    
    # 各级别日志
    logger.debug('调试信息', {'key': 'value'})
    logger.info('普通信息')
    logger.warning('警告信息')
    logger.error('错误信息', {'error_code': 500})
    
    # API调用日志
    logger.log_api_call('GET', '/api/stats', 200, 0.05)
    
    # 服务状态日志
    logger.log_service_status('Dashboard', 'online', 3000)
    
    # 备份日志
    logger.log_backup('full', '/path/to/backup.tar.gz', '45MB', True)
    
    # 生成日志
    logger.log_generation('presales', '/path/to/output.pptx', 0.062)
    
    # 装饰器测试
    @logger.log_function
    def test_function():
        return 'success'
    
    result = test_function()
    print(f"Result: {result}")
    
    print("\n日志测试完成")
