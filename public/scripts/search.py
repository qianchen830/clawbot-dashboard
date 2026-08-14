#!/usr/bin/env python3
"""
搜索模块 - 全文搜索与智能检索

功能:
- 笔记全文搜索 (标题 + 内容 + 标签)
- 分类过滤
- 时间范围过滤
- 模糊匹配
- 搜索结果高亮
- 搜索建议
"""

import sqlite3
import re
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, asdict
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 数据库路径
DB_PATH = Path.home() / ".openclaw" / "data" / "clawbot.db"


@dataclass
class SearchResult:
    """搜索结果"""
    id: int
    title: str
    content: str
    category: str
    tags: List[str]
    created_at: str
    updated_at: str
    relevance_score: float
    highlighted_title: str
    highlighted_content: str
    match_type: str  # exact, fuzzy, tag


@dataclass
class SearchSuggestion:
    """搜索建议"""
    text: str
    type: str  # keyword, tag, title
    count: int


class SearchEngine:
    """搜索引擎"""
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or str(DB_PATH)
        self._ensure_fts()
    
    def _get_connection(self) -> sqlite3.Connection:
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _ensure_fts(self):
        """确保FTS表存在"""
        conn = self._get_connection()
        try:
            # 创建FTS5虚拟表用于全文搜索
            conn.execute('''
                CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
                    id,
                    title,
                    content,
                    tags,
                    category,
                    content='notes',
                    content_rowid='id'
                )
            ''')
            conn.commit()
            logger.info("FTS表已就绪")
        except Exception as e:
            logger.warning(f"FTS表创建跳过: {e}")
        finally:
            conn.close()
    
    def rebuild_fts(self):
        """重建FTS索引"""
        conn = self._get_connection()
        try:
            conn.execute("INSERT INTO notes_fts(notes_fts) VALUES('rebuild')")
            conn.commit()
            logger.info("FTS索引重建完成")
        except Exception as e:
            logger.error(f"FTS索引重建失败: {e}")
        finally:
            conn.close()
    
    def search(
        self,
        query: str,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        match_type: str = "fuzzy",
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[SearchResult], int]:
        """
        执行搜索
        
        Args:
            query: 搜索关键词
            category: 分类过滤
            tags: 标签过滤
            date_from: 开始日期 (YYYY-MM-DD)
            date_to: 结束日期 (YYYY-MM-DD)
            match_type: 匹配类型 (exact, fuzzy, prefix)
            limit: 返回数量限制
            offset: 偏移量
            
        Returns:
            (搜索结果列表, 总数)
        """
        conn = self._get_connection()
        try:
            # 构建基础查询
            sql = "SELECT * FROM notes WHERE 1=1"
            params = []
            
            # 关键词搜索
            if query:
                if match_type == "exact":
                    sql += " AND (title LIKE ? OR content LIKE ?)"
                    params.extend([f"%{query}%", f"%{query}%"])
                elif match_type == "prefix":
                    sql += " AND (title LIKE ? OR content LIKE ?)"
                    params.extend([f"{query}%", f"{query}%"])
                else:  # fuzzy
                    # 使用FTS或LIKE
                    keywords = query.split()
                    conditions = []
                    for kw in keywords:
                        conditions.append("(title LIKE ? OR content LIKE ?)")
                        params.extend([f"%{kw}%", f"%{kw}%"])
                    sql += " AND (" + " OR ".join(conditions) + ")"
            
            # 分类过滤
            if category:
                sql += " AND category = ?"
                params.append(category)
            
            # 标签过滤
            if tags:
                tag_conditions = []
                for tag in tags:
                    tag_conditions.append("tags LIKE ?")
                    params.append(f'%"{tag}"%')
                sql += " AND (" + " OR ".join(tag_conditions) + ")"
            
            # 日期范围
            if date_from:
                sql += " AND date(created_at) >= date(?)"
                params.append(date_from)
            if date_to:
                sql += " AND date(created_at) <= date(?)"
                params.append(date_to)
            
            # 获取总数
            count_sql = sql.replace("SELECT *", "SELECT COUNT(*)")
            total = conn.execute(count_sql, params).fetchone()[0]
            
            # 排序和分页
            sql += " ORDER BY updated_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            # 执行搜索
            rows = conn.execute(sql, params).fetchall()
            
            # 转换结果
            results = []
            for row in rows:
                # 计算相关度分数
                relevance = self._calculate_relevance(query, row['title'], row['content'])
                
                # 高亮处理
                highlighted_title = self._highlight(query, row['title'])
                highlighted_content = self._highlight(query, row['content'], max_length=300)
                
                # 确定匹配类型
                match_type_result = self._get_match_type(query, row)
                
                result = SearchResult(
                    id=row['id'],
                    title=row['title'],
                    content=row['content'],
                    category=row['category'],
                    tags=json.loads(row['tags']) if row['tags'] else [],
                    created_at=row['created_at'],
                    updated_at=row['updated_at'],
                    relevance_score=relevance,
                    highlighted_title=highlighted_title,
                    highlighted_content=highlighted_content,
                    match_type=match_type_result
                )
                results.append(result)
            
            # 按相关度排序
            results.sort(key=lambda x: x.relevance_score, reverse=True)
            
            return results, total
            
        finally:
            conn.close()
    
    def _calculate_relevance(self, query: str, title: str, content: str) -> float:
        """计算相关度分数"""
        if not query:
            return 1.0
        
        score = 0.0
        query_lower = query.lower()
        keywords = query_lower.split()
        
        title_lower = title.lower()
        content_lower = content.lower()
        
        for kw in keywords:
            # 标题匹配权重更高
            if kw in title_lower:
                score += 10.0
                # 完全匹配加成
                if title_lower == kw:
                    score += 20.0
            
            # 内容匹配
            if kw in content_lower:
                # 计算出现次数
                count = content_lower.count(kw)
                score += min(count * 2, 10)  # 最多10分
        
        # 标题长度惩罚（更短标题更精确）
        title_penalty = max(0, (len(title) - 50) / 100)
        score -= title_penalty
        
        return max(0.1, score)
    
    def _highlight(self, query: str, text: str, max_length: int = None) -> str:
        """高亮关键词"""
        if not text:
            return ""
        
        # 截断内容
        if max_length and len(text) > max_length:
            text = text[:max_length] + "..."
        
        if not query:
            return text
        
        # 高亮关键词
        keywords = query.split()
        for kw in keywords:
            pattern = re.compile(re.escape(kw), re.IGNORECASE)
            text = pattern.sub(f"**{kw}**", text)
        
        return text
    
    def _get_match_type(self, query: str, row: sqlite3.Row) -> str:
        """确定匹配类型"""
        query_lower = query.lower()
        title_lower = row['title'].lower()
        content_lower = row['content'].lower()
        tags_str = row['tags'].lower() if row['tags'] else ""
        
        # 精确匹配标题
        if query_lower == title_lower:
            return "exact"
        
        # 标签匹配
        if f'"{query_lower}"' in tags_str:
            return "tag"
        
        # 模糊匹配
        return "fuzzy"
    
    def get_suggestions(self, prefix: str, limit: int = 10) -> List[SearchSuggestion]:
        """获取搜索建议"""
        conn = self._get_connection()
        try:
            suggestions = []
            
            # 关键词建议 (从标题提取)
            title_sql = """
                SELECT DISTINCT title 
                FROM notes 
                WHERE title LIKE ? 
                ORDER BY updated_at DESC 
                LIMIT ?
            """
            title_rows = conn.execute(title_sql, [f"{prefix}%", limit]).fetchall()
            for row in title_rows:
                suggestions.append(SearchSuggestion(
                    text=row['title'],
                    type="title",
                    count=1
                ))
            
            # 标签建议
            tag_sql = "SELECT DISTINCT tags FROM notes WHERE tags IS NOT NULL AND tags LIKE ?"
            tag_rows = conn.execute(tag_sql, [f'%"{prefix}%']).fetchall()
            for row in tag_rows:
                try:
                    tags = json.loads(row['tags'])
                    for tag in tags:
                        if tag.lower().startswith(prefix.lower()):
                            # 计算标签使用次数
                            count_sql = "SELECT COUNT(*) FROM notes WHERE tags LIKE ?"
                            count = conn.execute(count_sql, [f'%"{tag}"%']).fetchone()[0]
                            suggestions.append(SearchSuggestion(
                                text=tag,
                                type="tag",
                                count=count
                            ))
                except:
                    pass
            
            # 去重并排序
            seen = set()
            unique_suggestions = []
            for s in suggestions:
                key = (s.text, s.type)
                if key not in seen:
                    seen.add(key)
                    unique_suggestions.append(s)
            
            # 按类型和数量排序
            unique_suggestions.sort(key=lambda x: (x.type, -x.count))
            
            return unique_suggestions[:limit]
            
        finally:
            conn.close()
    
    def get_popular_searches(self, days: int = 7, limit: int = 10) -> List[Dict]:
        """获取热门搜索词 (模拟 - 实际需要搜索日志)"""
        # 返回最近活跃的笔记标题作为建议
        conn = self._get_connection()
        try:
            sql = """
                SELECT title, category, updated_at
                FROM notes
                WHERE updated_at >= date('now', ?)
                ORDER BY updated_at DESC
                LIMIT ?
            """
            rows = conn.execute(sql, [f"-{days} days", limit]).fetchall()
            
            return [{
                "title": row['title'],
                "category": row['category'],
                "updated_at": row['updated_at']
            } for row in rows]
            
        finally:
            conn.close()
    
    def get_search_stats(self) -> Dict[str, Any]:
        """获取搜索统计信息"""
        conn = self._get_connection()
        try:
            # 总笔记数
            total = conn.execute("SELECT COUNT(*) FROM notes").fetchone()[0]
            
            # 各分类数量
            categories = conn.execute("""
                SELECT category, COUNT(*) as count
                FROM notes
                GROUP BY category
                ORDER BY count DESC
            """).fetchall()
            
            # 最常用标签
            tag_counts = {}
            rows = conn.execute("SELECT tags FROM notes WHERE tags IS NOT NULL").fetchall()
            for row in rows:
                try:
                    tags = json.loads(row['tags'])
                    for tag in tags:
                        tag_counts[tag] = tag_counts.get(tag, 0) + 1
                except:
                    pass
            
            top_tags = sorted(tag_counts.items(), key=lambda x: -x[1])[:20]
            
            # 最近更新
            recent = conn.execute("""
                SELECT title, category, updated_at
                FROM notes
                ORDER BY updated_at DESC
                LIMIT 5
            """).fetchall()
            
            return {
                "total_notes": total,
                "categories": [{"name": r['category'], "count": r['count']} for r in categories],
                "top_tags": [{"tag": t[0], "count": t[1]} for t in top_tags],
                "recent_updates": [{
                    "title": r['title'],
                    "category": r['category'],
                    "updated_at": r['updated_at']
                } for r in recent]
            }
            
        finally:
            conn.close()


# API接口函数
def search_notes(
    query: str,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 50
) -> Dict[str, Any]:
    """搜索笔记API"""
    engine = SearchEngine()
    results, total = engine.search(
        query=query,
        category=category,
        tags=tags,
        date_from=date_from,
        date_to=date_to,
        limit=limit
    )
    
    return {
        "success": True,
        "query": query,
        "total": total,
        "count": len(results),
        "results": [asdict(r) for r in results]
    }


def get_search_suggestions(prefix: str) -> Dict[str, Any]:
    """获取搜索建议API"""
    engine = SearchEngine()
    suggestions = engine.get_suggestions(prefix)
    
    return {
        "success": True,
        "prefix": prefix,
        "suggestions": [asdict(s) for s in suggestions]
    }


def get_search_stats() -> Dict[str, Any]:
    """获取搜索统计API"""
    engine = SearchEngine()
    stats = engine.get_search_stats()
    
    return {
        "success": True,
        **stats
    }


# CLI测试
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python search.py <查询词> [分类]")
        print("示例: python search.py 金蝶 kingdee")
        sys.exit(1)
    
    query = sys.argv[1]
    category = sys.argv[2] if len(sys.argv) > 2 else None
    
    print(f"\n搜索: {query}")
    print(f"分类: {category or '全部'}")
    print("-" * 50)
    
    result = search_notes(query, category=category, limit=10)
    
    print(f"找到 {result['total']} 条结果:\n")
    
    for i, r in enumerate(result['results'], 1):
        print(f"{i}. [{r['category']}] {r['highlighted_title']}")
        print(f"   相关度: {r['relevance_score']:.1f} | 匹配: {r['match_type']}")
        print(f"   {r['highlighted_content'][:100]}...")
        print()
