#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ClawBot数据库管理模块
提供数据持久化、缓存、查询功能
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import contextmanager


class ClawBotDatabase:
    """ClawBot数据库管理"""
    
    def __init__(self, db_path: str = '~/.openclaw/data/clawbot.db'):
        self.db_path = Path(db_path).expanduser()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = None
        self._init_db()
    
    @property
    def conn(self):
        """获取数据库连接"""
        if self._conn is None:
            self._conn = sqlite3.connect(self.db_path)
            self._conn.row_factory = sqlite3.Row
        return self._conn
    
    def _init_db(self):
        """初始化数据库表"""
        with self.get_connection() as conn:
            conn.executescript('''
                -- 笔记表
                CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT,
                    category TEXT,
                    tags TEXT,
                    file_path TEXT,
                    word_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                -- 活动记录表
                CREATE TABLE IF NOT EXISTS activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    action TEXT,
                    details TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                -- 服务状态表
                CREATE TABLE IF NOT EXISTS services (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    port INTEGER,
                    status TEXT DEFAULT 'unknown',
                    last_check TIMESTAMP,
                    restart_count INTEGER DEFAULT 0,
                    uptime_seconds INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                -- 缓存表
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    ttl_seconds INTEGER DEFAULT 3600,
                    expires_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                -- 学习进度表
                CREATE TABLE IF NOT EXISTS learning_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    stage INTEGER NOT NULL,
                    topic TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    duration_minutes INTEGER DEFAULT 0,
                    notes_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                -- 系统指标表
                CREATE TABLE IF NOT EXISTS metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    value REAL NOT NULL,
                    tags TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                -- 创建索引
                CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
                CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at);
                CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
                CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);
                CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(name);
                CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
            ''')
    
    @contextmanager
    def get_connection(self):
        """获取数据库连接上下文管理器"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    # ==================== 笔记操作 ====================
    
    def add_note(self, title: str, content: str = '', category: str = None, 
                 tags: List[str] = None, file_path: str = None) -> int:
        """添加笔记"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                INSERT INTO notes (title, content, category, tags, file_path, word_count)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (title, content, category, json.dumps(tags) if tags else None, 
                  file_path, len(content.split()) if content else 0))
            return cursor.lastrowid
    
    def get_note(self, note_id: int) -> Optional[Dict]:
        """获取单个笔记"""
        with self.get_connection() as conn:
            row = conn.execute('SELECT * FROM notes WHERE id = ?', (note_id,)).fetchone()
            return dict(row) if row else None
    
    def get_notes(self, category: str = None, limit: int = 100, offset: int = 0) -> List[Dict]:
        """获取笔记列表"""
        with self.get_connection() as conn:
            if category:
                rows = conn.execute('''
                    SELECT * FROM notes WHERE category = ? 
                    ORDER BY created_at DESC LIMIT ? OFFSET ?
                ''', (category, limit, offset)).fetchall()
            else:
                rows = conn.execute('''
                    SELECT * FROM notes ORDER BY created_at DESC LIMIT ? OFFSET ?
                ''', (limit, offset)).fetchall()
            return [dict(row) for row in rows]
    
    def search_notes(self, query: str) -> List[Dict]:
        """搜索笔记"""
        with self.get_connection() as conn:
            rows = conn.execute('''
                SELECT * FROM notes 
                WHERE title LIKE ? OR content LIKE ? 
                ORDER BY created_at DESC
            ''', (f'%{query}%', f'%{query}%')).fetchall()
            return [dict(row) for row in rows]
    
    def get_notes_count(self, category: str = None) -> int:
        """获取笔记数量"""
        with self.get_connection() as conn:
            if category:
                return conn.execute('SELECT COUNT(*) FROM notes WHERE category = ?', 
                                   (category,)).fetchone()[0]
            return conn.execute('SELECT COUNT(*) FROM notes').fetchone()[0]
    
    # ==================== 活动记录 ====================
    
    def log_activity(self, type_: str, action: str = None, details: Dict = None,
                     ip_address: str = None, user_agent: str = None) -> int:
        """记录活动"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                INSERT INTO activities (type, action, details, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?)
            ''', (type_, action, json.dumps(details) if details else None, 
                  ip_address, user_agent))
            return cursor.lastrowid
    
    def get_activities(self, type_: str = None, limit: int = 50) -> List[Dict]:
        """获取活动记录"""
        with self.get_connection() as conn:
            if type_:
                rows = conn.execute('''
                    SELECT * FROM activities WHERE type = ? 
                    ORDER BY created_at DESC LIMIT ?
                ''', (type_, limit)).fetchall()
            else:
                rows = conn.execute('''
                    SELECT * FROM activities ORDER BY created_at DESC LIMIT ?
                ''', (limit,)).fetchall()
            return [dict(row) for row in rows]
    
    # ==================== 服务管理 ====================
    
    def update_service(self, name: str, port: int, status: str) -> int:
        """更新服务状态"""
        with self.get_connection() as conn:
            conn.execute('''
                INSERT INTO services (name, port, status, last_check) 
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(name) DO UPDATE SET 
                    port = excluded.port,
                    status = excluded.status,
                    last_check = CURRENT_TIMESTAMP,
                    restart_count = CASE WHEN excluded.status = 'offline' 
                        THEN restart_count + 1 ELSE restart_count END
            ''', (name, port, status))
            
            row = conn.execute('SELECT id FROM services WHERE name = ?', (name,)).fetchone()
            return row['id'] if row else 0
    
    def get_services(self) -> List[Dict]:
        """获取所有服务状态"""
        with self.get_connection() as conn:
            rows = conn.execute('SELECT * FROM services ORDER BY name').fetchall()
            return [dict(row) for row in rows]
    
    # ==================== 缓存操作 ====================
    
    def set_cache(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        """设置缓存"""
        expires_at = datetime.now().timestamp() + ttl_seconds
        with self.get_connection() as conn:
            conn.execute('''
                INSERT OR REPLACE INTO cache (key, value, ttl_seconds, expires_at) 
                VALUES (?, ?, ?, ?)
            ''', (key, json.dumps(value), ttl_seconds, expires_at))
    
    def get_cache(self, key: str) -> Optional[Any]:
        """获取缓存"""
        with self.get_connection() as conn:
            row = conn.execute(
                'SELECT value, expires_at FROM cache WHERE key = ?', (key,)
            ).fetchone()
            
            if row:
                if datetime.now().timestamp() < row['expires_at']:
                    return json.loads(row['value'])
                else:
                    conn.execute('DELETE FROM cache WHERE key = ?', (key,))
            return None
    
    def clear_expired_cache(self) -> int:
        """清理过期缓存"""
        with self.get_connection() as conn:
            cursor = conn.execute(
                'DELETE FROM cache WHERE expires_at < ?',
                (datetime.now().timestamp(),)
            )
            return cursor.rowcount
    
    # ==================== 学习进度 ====================
    
    def update_learning_progress(self, stage: int, topic: str, status: str,
                                  duration_minutes: int = 0, notes_count: int = 0) -> int:
        """更新学习进度"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                INSERT INTO learning_progress (stage, topic, status, started_at, completed_at, duration_minutes, notes_count)
                VALUES (?, ?, ?, 
                    CASE WHEN ? = 'in_progress' THEN CURRENT_TIMESTAMP ELSE NULL END,
                    CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
                    ?, ?)
            ''', (stage, topic, status, status, status, duration_minutes, notes_count))
            return cursor.lastrowid
    
    def get_learning_stats(self) -> Dict:
        """获取学习统计"""
        with self.get_connection() as conn:
            total = conn.execute('SELECT COUNT(*) as count FROM learning_progress WHERE status = "completed"').fetchone()
            stages = conn.execute('''
                SELECT stage, COUNT(*) as count 
                FROM learning_progress 
                WHERE status = "completed" 
                GROUP BY stage
            ''').fetchall()
            total_duration = conn.execute('''
                SELECT SUM(duration_minutes) as total FROM learning_progress WHERE status = "completed"
            ''').fetchone()
            
            return {
                'total_topics': total['count'] if total else 0,
                'total_duration_minutes': total_duration['total'] if total_duration else 0,
                'stages': {row['stage']: row['count'] for row in stages} if stages else {}
            }
    
    # ==================== 指标记录 ====================
    
    def record_metric(self, name: str, value: float, tags: Dict = None) -> int:
        """记录指标"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                INSERT INTO metrics (name, value, tags) VALUES (?, ?, ?)
            ''', (name, value, json.dumps(tags) if tags else None))
            return cursor.lastrowid
    
    def get_metrics(self, name: str, limit: int = 100) -> List[Dict]:
        """获取指标历史"""
        with self.get_connection() as conn:
            rows = conn.execute('''
                SELECT * FROM metrics WHERE name = ? 
                ORDER BY timestamp DESC LIMIT ?
            ''', (name, limit)).fetchall()
            return [dict(row) for row in rows]
    
    # ==================== 统计信息 ====================
    
    def get_stats(self) -> Dict:
        """获取系统统计"""
        with self.get_connection() as conn:
            notes_count = conn.execute('SELECT COUNT(*) as count FROM notes').fetchone()
            activities_today = conn.execute('''
                SELECT COUNT(*) as count FROM activities 
                WHERE date(created_at) = date('now')
            ''').fetchone()
            cache_count = conn.execute('SELECT COUNT(*) as count FROM cache').fetchone()
            
            return {
                'notes_count': notes_count['count'] if notes_count else 0,
                'activities_today': activities_today['count'] if activities_today else 0,
                'cache_count': cache_count['count'] if cache_count else 0,
                'db_size': self.db_path.stat().st_size if self.db_path.exists() else 0
            }
    
    def close(self):
        """关闭数据库连接"""
        if self._conn:
            self._conn.close()
            self._conn = None


# 单例实例
_db_instance = None

def get_db() -> ClawBotDatabase:
    """获取数据库实例"""
    global _db_instance
    if _db_instance is None:
        _db_instance = ClawBotDatabase()
    return _db_instance


if __name__ == '__main__':
    # 测试
    db = ClawBotDatabase()
    
    # 添加测试笔记
    note_id = db.add_note('测试笔记', '这是测试内容', 'test', ['测试'])
    print(f'添加笔记: ID={note_id}')
    
    # 获取笔记
    note = db.get_note(note_id)
    print(f'获取笔记: {note}')
    
    # 记录活动
    db.log_activity('test', 'database_test', {'test': True})
    
    # 获取统计
    stats = db.get_stats()
    print(f'统计: {stats}')
    
    db.close()
    print('数据库测试完成')
