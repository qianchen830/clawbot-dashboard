#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ClawBot健康监控服务
监控所有服务状态，自动重启故障服务，记录健康历史
"""

import os
import sys
import time
import json
import socket
import subprocess
import signal
from datetime import datetime
from pathlib import Path
from threading import Thread
from http.server import HTTPServer, BaseHTTPRequestHandler

# 添加scripts目录到路径
sys.path.insert(0, str(Path(__file__).parent))
from database import get_db

# 服务配置
SERVICES = {
    'gateway': {
        'port': 18789,
        'name': 'Gateway',
        'cmd': None,  # 由OpenClaw管理
        'auto_restart': False
    },
    'dashboard': {
        'port': 3000,
        'name': 'Dashboard',
        'cmd': 'cd ~/.openclaw/workspace && python3 -m http.server 3000',
        'auto_restart': True
    },
    'frontend': {
        'port': 5173,
        'name': 'Frontend',
        'cmd': 'cd ~/.openclaw/workspace/frontend && npm run dev',
        'auto_restart': True
    },
    'backend': {
        'port': 8765,
        'name': 'Backend API',
        'cmd': 'cd ~/.openclaw/workspace/scripts && node api-server.cjs',
        'auto_restart': True
    },
    'notes-api': {
        'port': 8766,
        'name': 'Notes API',
        'cmd': 'cd ~/.openclaw/workspace/scripts && node notes-api.cjs',
        'auto_restart': True
    },
    'stats-api': {
        'port': 8767,
        'name': 'Stats API',
        'cmd': 'cd ~/.openclaw/workspace/scripts && python3 stats-api.py',
        'auto_restart': True
    }
}

# 告警配置
ALERT_CONFIG = {
    'webhook_url': None,  # 飞书/钉钉webhook
    'email': None,
    'cooldown_seconds': 300  # 同一告警冷却时间
}

class HealthMonitor:
    """健康监控器"""
    
    def __init__(self, check_interval=60):
        self.check_interval = check_interval
        self.running = False
        self.db = get_db()
        self.alert_history = {}
        self.service_status = {}
    
    def check_service(self, service_id: str) -> dict:
        """检查单个服务状态"""
        service = SERVICES.get(service_id, {})
        port = service.get('port', 0)
        
        # 尝试连接
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        
        status = 'online' if result == 0 else 'offline'
        
        return {
            'service_id': service_id,
            'name': service.get('name', service_id),
            'port': port,
            'status': status,
            'timestamp': datetime.now().isoformat()
        }
    
    def check_all_services(self) -> list:
        """检查所有服务"""
        results = []
        for service_id in SERVICES:
            result = self.check_service(service_id)
            results.append(result)
            
            # 更新数据库
            self.db.update_service(
                result['name'],
                result['port'],
                result['status']
            )
            
            # 检测状态变化
            prev_status = self.service_status.get(service_id, {}).get('status')
            if prev_status and prev_status != result['status']:
                # 状态变化，记录活动
                self.db.log_activity(
                    'service_status_change',
                    f"{result['name']} {prev_status} -> {result['status']}",
                    {'service': service_id, 'port': result['port']}
                )
                
                # 发送告警
                if result['status'] == 'offline':
                    self.send_alert(result['name'], 'offline')
            
            self.service_status[service_id] = result
        
        return results
    
    def restart_service(self, service_id: str) -> bool:
        """重启服务"""
        service = SERVICES.get(service_id)
        if not service or not service.get('cmd'):
            return False
        
        cmd = service['cmd']
        print(f"[{datetime.now()}] Restarting {service['name']}...")
        
        try:
            # 后台启动
            subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # 等待启动
            time.sleep(5)
            
            # 验证
            result = self.check_service(service_id)
            if result['status'] == 'online':
                print(f"[{datetime.now()}] {service['name']} restarted successfully")
                
                # 记录活动
                self.db.log_activity(
                    'service_restart',
                    f"{service['name']} restarted",
                    {'service': service_id}
                )
                return True
            else:
                print(f"[{datetime.now()}] {service['name']} restart failed")
                return False
                
        except Exception as e:
            print(f"[{datetime.now()}] Error restarting {service['name']}: {e}")
            return False
    
    def send_alert(self, service_name: str, status: str):
        """发送告警"""
        alert_key = f"{service_name}_{status}"
        now = datetime.now().timestamp()
        
        # 检查冷却时间
        if alert_key in self.alert_history:
            if now - self.alert_history[alert_key] < ALERT_CONFIG['cooldown_seconds']:
                return  # 在冷却期内
        
        self.alert_history[alert_key] = now
        
        # 发送webhook告警
        if ALERT_CONFIG['webhook_url']:
            try:
                import requests
                payload = {
                    "msg_type": "text",
                    "content": {
                        "text": f"⚠️ 服务告警\n\n服务: {service_name}\n状态: {status}\n时间: {datetime.now().isoformat()}"
                    }
                }
                requests.post(ALERT_CONFIG['webhook_url'], json=payload, timeout=5)
            except Exception as e:
                print(f"Failed to send alert: {e}")
        
        print(f"[ALERT] {service_name} is {status}")
    
    def monitor_loop(self):
        """监控循环"""
        print(f"[{datetime.now()}] Health monitor started (interval: {self.check_interval}s)")
        
        while self.running:
            try:
                # 检查所有服务
                results = self.check_all_services()
                
                # 自动重启离线服务
                for result in results:
                    service_id = result['service_id']
                    if result['status'] == 'offline':
                        service = SERVICES.get(service_id, {})
                        if service.get('auto_restart'):
                            self.restart_service(service_id)
                
                # 记录指标
                online_count = sum(1 for r in results if r['status'] == 'online')
                self.db.record_metric('services_online', online_count)
                
            except Exception as e:
                print(f"[{datetime.now()}] Monitor error: {e}")
            
            time.sleep(self.check_interval)
    
    def start(self):
        """启动监控"""
        self.running = True
        self.thread = Thread(target=self.monitor_loop, daemon=True)
        self.thread.start()
    
    def stop(self):
        """停止监控"""
        self.running = False
        if hasattr(self, 'thread'):
            self.thread.join(timeout=5)
    
    def get_status(self) -> dict:
        """获取状态"""
        return {
            'running': self.running,
            'services': self.service_status,
            'check_interval': self.check_interval,
            'last_check': datetime.now().isoformat()
        }


class HealthAPIHandler(BaseHTTPRequestHandler):
    """健康API处理器"""
    
    monitor = None
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def do_GET(self):
        if self.path == '/health':
            # 健康检查
            self._send_json({'status': 'ok'})
        
        elif self.path == '/api/status':
            # 监控状态
            if self.monitor:
                self._send_json(self.monitor.get_status())
            else:
                self._send_json({'error': 'Monitor not initialized'}, 500)
        
        elif self.path == '/api/services':
            # 服务状态
            if self.monitor:
                results = self.monitor.check_all_services()
                self._send_json({'services': results})
            else:
                self._send_json({'error': 'Monitor not initialized'}, 500)
        
        elif self.path.startswith('/api/restart/'):
            # 重启服务
            service_id = self.path.split('/')[-1]
            if self.monitor and service_id in SERVICES:
                success = self.monitor.restart_service(service_id)
                self._send_json({'success': success, 'service': service_id})
            else:
                self._send_json({'error': 'Invalid service'}, 400)
        
        else:
            self._send_json({'error': 'Not found'}, 404)
    
    def log_message(self, format, *args):
        print(f"[Health API] {args[0]}")


def run_health_server(port=8768, check_interval=60):
    """运行健康监控服务"""
    # 创建监控器
    monitor = HealthMonitor(check_interval=check_interval)
    monitor.start()
    
    # 设置API处理器
    HealthAPIHandler.monitor = monitor
    
    # 启动HTTP服务
    server = HTTPServer(('0.0.0.0', port), HealthAPIHandler)
    
    print(f"🏥 Health Monitor running on http://localhost:{port}")
    print("Endpoints:")
    print("  - GET /health          - 健康检查")
    print("  - GET /api/status      - 监控状态")
    print("  - GET /api/services    - 服务状态")
    print("  - GET /api/restart/:id - 重启服务")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        monitor.stop()
        server.shutdown()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='ClawBot Health Monitor')
    parser.add_argument('--port', type=int, default=8768, help='API port')
    parser.add_argument('--interval', type=int, default=60, help='Check interval (seconds)')
    args = parser.parse_args()
    
    run_health_server(port=args.port, check_interval=args.interval)
