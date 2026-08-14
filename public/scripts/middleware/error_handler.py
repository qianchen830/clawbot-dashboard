#!/usr/bin/env python3
"""
错误处理中间件

功能:
- 统一错误响应格式
- 错误日志记录
- 错误分类和处理
- 错误统计和告警
"""

import json
import sqlite3
import traceback
from datetime import datetime
from functools import wraps
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ErrorCode(Enum):
    """错误代码枚举"""
    # 通用错误 (1000-1999)
    UNKNOWN_ERROR = (1000, "未知错误", 500)
    INVALID_REQUEST = (1001, "无效请求", 400)
    INVALID_PARAMETER = (1002, "参数错误", 400)
    RESOURCE_NOT_FOUND = (1003, "资源不存在", 404)
    METHOD_NOT_ALLOWED = (1004, "方法不允许", 405)
    
    # 认证授权错误 (2000-2999)
    UNAUTHORIZED = (2000, "未授权", 401)
    FORBIDDEN = (2001, "禁止访问", 403)
    TOKEN_EXPIRED = (2002, "令牌过期", 401)
    INVALID_TOKEN = (2003, "无效令牌", 401)
    
    # 业务错误 (3000-3999)
    BUSINESS_ERROR = (3000, "业务错误", 400)
    DATA_NOT_FOUND = (3001, "数据不存在", 404)
    DATA_ALREADY_EXISTS = (3002, "数据已存在", 400)
    DATA_VALIDATION_ERROR = (3003, "数据验证失败", 400)
    OPERATION_FAILED = (3004, "操作失败", 500)
    
    # 系统错误 (4000-4999)
    DATABASE_ERROR = (4000, "数据库错误", 500)
    CACHE_ERROR = (4001, "缓存错误", 500)
    FILE_ERROR = (4002, "文件错误", 500)
    NETWORK_ERROR = (4003, "网络错误", 500)
    SERVICE_UNAVAILABLE = (4004, "服务不可用", 503)
    
    def __init__(self, code: int, message: str, http_status: int):
        self.code = code
        self.message = message
        self.http_status = http_status


@dataclass
class ErrorResponse:
    """错误响应"""
    success: bool = False
    error_code: int = 0
    error_message: str = ""
    error_detail: Optional[str] = None
    timestamp: str = ""
    request_id: Optional[str] = None
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class ErrorStats:
    """错误统计"""
    total_errors: int = 0
    errors_by_code: Dict[int, int] = None
    errors_by_type: Dict[str, int] = None
    last_error_time: Optional[str] = None
    
    def __post_init__(self):
        if self.errors_by_code is None:
            self.errors_by_code = {}
        if self.errors_by_type is None:
            self.errors_by_type = {}
    
    def record_error(self, error_code: int, error_type: str):
        """记录错误"""
        self.total_errors += 1
        self.errors_by_code[error_code] = self.errors_by_code.get(error_code, 0) + 1
        self.errors_by_type[error_type] = self.errors_by_type.get(error_type, 0) + 1
        self.last_error_time = datetime.now().isoformat()


class ErrorHandler:
    """错误处理器"""
    
    def __init__(self):
        self.stats = ErrorStats()
        self._error_handlers = {}
        self._register_default_handlers()
    
    def _register_default_handlers(self):
        """注册默认错误处理器"""
        # 数据库错误
        self.register_handler(
            sqlite3.Error,
            lambda e: self.create_response(ErrorCode.DATABASE_ERROR, str(e))
        )
        
        # 文件错误
        self.register_handler(
            FileNotFoundError,
            lambda e: self.create_response(ErrorCode.FILE_ERROR, str(e))
        )
        
        # 权限错误
        self.register_handler(
            PermissionError,
            lambda e: self.create_response(ErrorCode.FORBIDDEN, str(e))
        )
        
        # 值错误
        self.register_handler(
            ValueError,
            lambda e: self.create_response(ErrorCode.INVALID_PARAMETER, str(e))
        )
        
        # 类型错误
        self.register_handler(
            TypeError,
            lambda e: self.create_response(ErrorCode.INVALID_PARAMETER, str(e))
        )
        
        # 键错误
        self.register_handler(
            KeyError,
            lambda e: self.create_response(ErrorCode.DATA_NOT_FOUND, str(e))
        )
    
    def register_handler(self, exception_class: type, handler: Callable):
        """注册错误处理器"""
        self._error_handlers[exception_class] = handler
    
    def create_response(
        self,
        error_code: ErrorCode,
        detail: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> ErrorResponse:
        """创建错误响应"""
        response = ErrorResponse(
            error_code=error_code.code,
            error_message=error_code.message,
            error_detail=detail,
            request_id=request_id
        )
        
        # 记录统计
        self.stats.record_error(error_code.code, error_code.name)
        
        # 记录日志
        logger.error(f"Error {error_code.code}: {error_code.message} - {detail}")
        
        return response
    
    def handle_exception(
        self,
        exception: Exception,
        request_id: Optional[str] = None
    ) -> ErrorResponse:
        """处理异常"""
        # 查找匹配的处理器
        for exception_class, handler in self._error_handlers.items():
            if isinstance(exception, exception_class):
                return handler(exception)
        
        # 默认处理
        return self.create_response(
            ErrorCode.UNKNOWN_ERROR,
            str(exception),
            request_id
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """获取错误统计"""
        return {
            "total_errors": self.stats.total_errors,
            "errors_by_code": self.stats.errors_by_code,
            "errors_by_type": self.stats.errors_by_type,
            "last_error_time": self.stats.last_error_time
        }


# 全局错误处理器
error_handler = ErrorHandler()


def error_response(
    error_code: ErrorCode,
    detail: Optional[str] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """创建错误响应"""
    return error_handler.create_response(error_code, detail, request_id).to_dict()


def handle_errors(f: Callable) -> Callable:
    """错误处理装饰器"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            response = error_handler.handle_exception(e)
            return response.to_dict(), response.error_code // 100 * 100  # 转换为HTTP状态码
    return wrapper


class ValidationError(Exception):
    """验证错误"""
    pass


class BusinessError(Exception):
    """业务错误"""
    pass


class AuthError(Exception):
    """认证错误"""
    pass


# Flask错误处理中间件
def init_flask_error_handler(app):
    """初始化Flask错误处理"""
    from flask import jsonify, request
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify(error_response(
            ErrorCode.INVALID_REQUEST,
            str(error)
        )), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify(error_response(
            ErrorCode.UNAUTHORIZED,
            str(error)
        )), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify(error_response(
            ErrorCode.FORBIDDEN,
            str(error)
        )), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify(error_response(
            ErrorCode.RESOURCE_NOT_FOUND,
            str(error)
        )), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify(error_response(
            ErrorCode.METHOD_NOT_ALLOWED,
            str(error)
        )), 405
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify(error_response(
            ErrorCode.UNKNOWN_ERROR,
            str(error)
        )), 500
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        response = error_handler.handle_exception(error, request.headers.get('X-Request-ID'))
        return jsonify(response.to_dict()), 500
    
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify(error_response(
            ErrorCode.DATA_VALIDATION_ERROR,
            str(error)
        )), 400
    
    @app.errorhandler(BusinessError)
    def handle_business_error(error):
        return jsonify(error_response(
            ErrorCode.BUSINESS_ERROR,
            str(error)
        )), 400
    
    @app.errorhandler(AuthError)
    def handle_auth_error(error):
        return jsonify(error_response(
            ErrorCode.UNAUTHORIZED,
            str(error)
        )), 401
    
    # 添加错误统计端点
    @app.route('/error/stats', methods=['GET'])
    def get_error_stats():
        return jsonify({
            "success": True,
            **error_handler.get_stats()
        })


# 使用示例
if __name__ == "__main__":
    print("错误处理中间件示例:")
    print()
    
    # 创建错误响应
    response = error_response(ErrorCode.INVALID_PARAMETER, "用户名不能为空")
    print(f"参数错误: {json.dumps(response, indent=2, ensure_ascii=False)}")
    print()
    
    # 使用装饰器
    @handle_errors
    def risky_function(x):
        return 10 / x
    
    result = risky_function(0)
    print(f"除零错误: {json.dumps(result, indent=2, ensure_ascii=False)}")
    print()
    
    # 获取统计
    stats = error_handler.get_stats()
    print(f"错误统计: {json.dumps(stats, indent=2, ensure_ascii=False)}")
