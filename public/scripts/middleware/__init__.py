#!/usr/bin/env python3
"""
中间件模块

包含:
- error_handler: 错误处理中间件
- rate_limiter: 速率限制中间件 (待开发)
- auth: 认证中间件 (待开发)
- logger: 日志中间件 (待开发)
"""

from .error_handler import (
    ErrorHandler,
    ErrorCode,
    ErrorResponse,
    ErrorStats,
    error_handler,
    error_response,
    handle_errors,
    init_flask_error_handler,
    ValidationError,
    BusinessError,
    AuthError
)

__all__ = [
    'ErrorHandler',
    'ErrorCode',
    'ErrorResponse',
    'ErrorStats',
    'error_handler',
    'error_response',
    'handle_errors',
    'init_flask_error_handler',
    'ValidationError',
    'BusinessError',
    'AuthError'
]
