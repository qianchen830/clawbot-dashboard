#!/usr/bin/env python3
"""
搜索API服务

端口: 8770
功能: 全文搜索、搜索建议、搜索统计
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import sys
from pathlib import Path

# 添加脚本目录到路径
sys.path.insert(0, str(Path(__file__).parent))

from search import search_notes, get_search_suggestions, get_search_stats

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)
CORS(app)


@app.route('/api/search', methods=['GET'])
def search():
    """搜索笔记
    
    Query参数:
        q: 搜索关键词 (必填)
        category: 分类过滤 (可选)
        tags: 标签过滤，逗号分隔 (可选)
        date_from: 开始日期 YYYY-MM-DD (可选)
        date_to: 结束日期 YYYY-MM-DD (可选)
        limit: 返回数量限制 (默认50)
    """
    try:
        query = request.args.get('q', '').strip()
        
        if not query:
            return jsonify({
                "success": False,
                "error": "请提供搜索关键词"
            }), 400
        
        category = request.args.get('category')
        tags_str = request.args.get('tags')
        tags = tags_str.split(',') if tags_str else None
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        limit = request.args.get('limit', 50, type=int)
        
        result = search_notes(
            query=query,
            category=category,
            tags=tags,
            date_from=date_from,
            date_to=date_to,
            limit=limit
        )
        
        logger.info(f"搜索: '{query}' -> {result['total']} 条结果")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"搜索失败: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/search/suggestions', methods=['GET'])
def suggestions():
    """获取搜索建议
    
    Query参数:
        prefix: 搜索前缀 (必填)
        limit: 返回数量限制 (默认10)
    """
    try:
        prefix = request.args.get('prefix', '').strip()
        limit = request.args.get('limit', 10, type=int)
        
        if not prefix:
            return jsonify({
                "success": False,
                "error": "请提供搜索前缀"
            }), 400
        
        result = get_search_suggestions(prefix)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"获取建议失败: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/search/stats', methods=['GET'])
def stats():
    """获取搜索统计信息"""
    try:
        result = get_search_stats()
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"获取统计失败: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/search/advanced', methods=['POST'])
def advanced_search():
    """高级搜索
    
    Body参数:
        query: 搜索关键词
        filters: 过滤条件
            - category: 分类
            - tags: 标签列表
            - date_from: 开始日期
            - date_to: 结束日期
        sort: 排序方式 (relevance, date, title)
        limit: 返回数量
    """
    try:
        data = request.get_json()
        
        query = data.get('query', '').strip()
        if not query:
            return jsonify({
                "success": False,
                "error": "请提供搜索关键词"
            }), 400
        
        filters = data.get('filters', {})
        sort = data.get('sort', 'relevance')
        limit = data.get('limit', 50)
        
        result = search_notes(
            query=query,
            category=filters.get('category'),
            tags=filters.get('tags'),
            date_from=filters.get('date_from'),
            date_to=filters.get('date_to'),
            limit=limit
        )
        
        # 排序
        if sort == 'date':
            result['results'].sort(key=lambda x: x['updated_at'], reverse=True)
        elif sort == 'title':
            result['results'].sort(key=lambda x: x['title'])
        # relevance 已经是默认排序
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"高级搜索失败: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        "status": "healthy",
        "service": "search-api",
        "port": 8770
    })


@app.route('/', methods=['GET'])
def index():
    """API文档"""
    return jsonify({
        "service": "搜索API",
        "version": "1.0.0",
        "endpoints": {
            "GET /api/search": {
                "description": "搜索笔记",
                "params": {
                    "q": "搜索关键词 (必填)",
                    "category": "分类过滤 (可选)",
                    "tags": "标签过滤，逗号分隔 (可选)",
                    "date_from": "开始日期 YYYY-MM-DD (可选)",
                    "date_to": "结束日期 YYYY-MM-DD (可选)",
                    "limit": "返回数量限制 (默认50)"
                }
            },
            "GET /api/search/suggestions": {
                "description": "获取搜索建议",
                "params": {
                    "prefix": "搜索前缀 (必填)",
                    "limit": "返回数量限制 (默认10)"
                }
            },
            "GET /api/search/stats": {
                "description": "获取搜索统计信息"
            },
            "POST /api/search/advanced": {
                "description": "高级搜索",
                "body": {
                    "query": "搜索关键词",
                    "filters": {
                        "category": "分类",
                        "tags": ["标签列表"],
                        "date_from": "开始日期",
                        "date_to": "结束日期"
                    },
                    "sort": "排序方式 (relevance, date, title)",
                    "limit": "返回数量"
                }
            },
            "GET /health": {
                "description": "健康检查"
            }
        }
    })


if __name__ == '__main__':
    logger.info("🚀 搜索API服务启动")
    logger.info("📡 端口: 8770")
    logger.info("📚 API文档: http://localhost:8770/")
    
    app.run(host='0.0.0.0', port=8770, debug=False)
