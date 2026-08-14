#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统计API服务 - 提供实时统计数据
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import sqlite3
from pathlib import Path
from urllib.parse import urlparse, parse_qs

DB_PATH = Path('~/.openclaw/data/clawbot.db').expanduser()

class StatsHandler(BaseHTTPRequestHandler):
    """统计API处理器"""
    
    def _send_json(self, data, status=200):
        """发送JSON响应"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def _get_db(self):
        """获取数据库连接"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    
    def do_GET(self):
        """处理GET请求"""
        parsed = urlparse(self.path)
        path = parsed.path
        
        try:
            if path == '/api/stats':
                self._handle_stats()
            elif path == '/api/notes':
                self._handle_notes(parse_qs(parsed.query))
            elif path == '/api/services':
                self._handle_services()
            elif path == '/api/categories':
                self._handle_categories()
            elif path == '/api/learning':
                self._handle_learning()
            elif path == '/api/health':
                self._handle_health()
            else:
                self._send_json({'error': 'Not found'}, 404)
        except Exception as e:
            self._send_json({'error': str(e)}, 500)
    
    def _handle_stats(self):
        """获取总体统计"""
        conn = self._get_db()
        
        # 笔记统计
        notes_count = conn.execute('SELECT COUNT(*) as count FROM notes').fetchone()['count']
        
        # 分类统计
        categories = conn.execute('''
            SELECT category, COUNT(*) as count 
            FROM notes 
            GROUP BY category 
            ORDER BY count DESC
        ''').fetchall()
        
        # 今日活动
        activities_today = conn.execute('''
            SELECT COUNT(*) as count FROM activities 
            WHERE date(created_at) = date('now')
        ''').fetchone()['count']
        
        # 学习统计
        learning_stats = conn.execute('''
            SELECT 
                COUNT(*) as total_topics,
                SUM(duration_minutes) as total_minutes
            FROM learning_progress WHERE status = 'completed'
        ''').fetchone()
        
        # 技能数量
        skills_dir = Path('~/.openclaw/workspace/skills').expanduser()
        skills_count = len([d for d in skills_dir.iterdir() if d.is_dir()]) if skills_dir.exists() else 0
        
        # 生成器数量
        scripts_dir = Path('~/.openclaw/workspace/scripts').expanduser()
        generators_count = len(list(scripts_dir.glob('*generator*.py'))) if scripts_dir.exists() else 0
        
        # 参考模板
        ref_dir = Path('/mnt/d/Kingdee文档/自动化交付工具/参考文档（模板）')
        templates_count = len(list(ref_dir.glob('*'))) if ref_dir.exists() else 0
        
        conn.close()
        
        self._send_json({
            'notes': {
                'total': notes_count,
                'categories': {row['category']: row['count'] for row in categories}
            },
            'activities_today': activities_today,
            'learning': {
                'total_topics': learning_stats['total_topics'] or 0,
                'total_hours': round((learning_stats['total_minutes'] or 0) / 60, 1)
            },
            'skills': skills_count,
            'generators': generators_count,
            'templates': templates_count,
            'db_size': DB_PATH.stat().st_size if DB_PATH.exists() else 0
        })
    
    def _handle_notes(self, params):
        """获取笔记列表"""
        conn = self._get_db()
        
        category = params.get('category', [None])[0]
        limit = int(params.get('limit', [50])[0])
        offset = int(params.get('offset', [0])[0])
        search = params.get('search', [None])[0]
        
        if search:
            rows = conn.execute('''
                SELECT id, title, category, word_count, created_at 
                FROM notes 
                WHERE title LIKE ? OR content LIKE ?
                ORDER BY created_at DESC LIMIT ? OFFSET ?
            ''', (f'%{search}%', f'%{search}%', limit, offset)).fetchall()
            total = conn.execute('''
                SELECT COUNT(*) as count FROM notes 
                WHERE title LIKE ? OR content LIKE ?
            ''', (f'%{search}%', f'%{search}%')).fetchone()['count']
        elif category:
            rows = conn.execute('''
                SELECT id, title, category, word_count, created_at 
                FROM notes WHERE category = ?
                ORDER BY created_at DESC LIMIT ? OFFSET ?
            ''', (category, limit, offset)).fetchall()
            total = conn.execute('SELECT COUNT(*) as count FROM notes WHERE category = ?', 
                               (category,)).fetchone()['count']
        else:
            rows = conn.execute('''
                SELECT id, title, category, word_count, created_at 
                FROM notes 
                ORDER BY created_at DESC LIMIT ? OFFSET ?
            ''', (limit, offset)).fetchall()
            total = conn.execute('SELECT COUNT(*) as count FROM notes').fetchone()['count']
        
        conn.close()
        
        self._send_json({
            'notes': [dict(row) for row in rows],
            'total': total,
            'limit': limit,
            'offset': offset
        })
    
    def _handle_services(self):
        """获取服务状态"""
        import socket
        
        services = [
            {'name': 'Gateway', 'port': 18789},
            {'name': 'Dashboard', 'port': 3000},
            {'name': 'Frontend', 'port': 5173},
            {'name': 'Backend API', 'port': 8765},
            {'name': 'Notes API', 'port': 8766},
        ]
        
        for service in services:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', service['port']))
            service['status'] = 'online' if result == 0 else 'offline'
            sock.close()
        
        self._send_json({'services': services})
    
    def _handle_categories(self):
        """获取分类统计"""
        conn = self._get_db()
        
        rows = conn.execute('''
            SELECT category, COUNT(*) as count 
            FROM notes 
            GROUP BY category 
            ORDER BY count DESC
        ''').fetchall()
        
        conn.close()
        
        self._send_json({
            'categories': [dict(row) for row in rows]
        })
    
    def _handle_learning(self):
        """获取学习进度"""
        conn = self._get_db()
        
        # 总体进度
        total = conn.execute('SELECT COUNT(*) as count FROM learning_progress WHERE status = "completed"').fetchone()
        
        # 各阶段进度
        stages = conn.execute('''
            SELECT stage, COUNT(*) as count 
            FROM learning_progress 
            WHERE status = "completed" 
            GROUP BY stage 
            ORDER BY stage
        ''').fetchall()
        
        # 总时长
        duration = conn.execute('SELECT SUM(duration_minutes) as total FROM learning_progress WHERE status = "completed"').fetchone()
        
        conn.close()
        
        self._send_json({
            'total_topics': total['count'] if total else 0,
            'total_hours': round((duration['total'] or 0) / 60, 1),
            'stages': {row['stage']: row['count'] for row in stages}
        })
    
    def _handle_health(self):
        """健康检查"""
        self._send_json({'status': 'ok'})
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[Stats API] {args[0]}")


def run_server(port=8767):
    """运行服务器"""
    server = HTTPServer(('0.0.0.0', port), StatsHandler)
    print(f"📊 Stats API running on http://localhost:{port}")
    print("Endpoints:")
    print("  - GET /api/stats      - 总体统计")
    print("  - GET /api/notes      - 笔记列表")
    print("  - GET /api/services   - 服务状态")
    print("  - GET /api/categories - 分类统计")
    print("  - GET /api/learning   - 学习进度")
    print("  - GET /api/health     - 健康检查")
    server.serve_forever()


if __name__ == '__main__':
    run_server()
