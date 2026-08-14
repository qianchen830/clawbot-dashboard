#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PPT生成器统一API服务
提供所有PPT生成器的统一接口
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from datetime import datetime

# 添加路径
sys.path.insert(0, str(Path(__file__).parent))

from ppt.base_generator import GeneratorRegistry, PPTConfig

# 导入所有生成器以注册
from ppt.presales_generator import PresalesPPTGenerator

# 输出目录
OUTPUT_DIR = Path(__file__).parent.parent / 'output' / 'ppt'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class PPTAPIHandler(BaseHTTPRequestHandler):
    """PPT API处理器"""
    
    def _send_json(self, data, status=200):
        """发送JSON响应"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        """处理CORS预检"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """处理GET请求"""
        parsed = urlparse(self.path)
        path = parsed.path
        
        try:
            if path == '/api/generators':
                self._handle_list_generators()
            elif path == '/api/generator':
                self._handle_get_generator(parse_qs(parsed.query))
            elif path == '/api/health':
                self._send_json({'status': 'ok', 'timestamp': datetime.now().isoformat()})
            else:
                self._send_json({'error': 'Not found'}, 404)
        except Exception as e:
            self._send_json({'error': str(e)}, 500)
    
    def do_POST(self):
        """处理POST请求"""
        parsed = urlparse(self.path)
        path = parsed.path
        
        try:
            # 读取请求体
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
            data = json.loads(body)
            
            if path == '/api/generate':
                self._handle_generate(data)
            else:
                self._send_json({'error': 'Not found'}, 404)
        except json.JSONDecodeError:
            self._send_json({'error': 'Invalid JSON'}, 400)
        except Exception as e:
            self._send_json({'error': str(e)}, 500)
    
    def _handle_list_generators(self):
        """列出所有生成器"""
        generators = GeneratorRegistry.list()
        self._send_json({
            'generators': [
                {
                    'name': g['name'],
                    'version': g['info']['version'],
                    'description': g['info']['description'],
                    'pages': g['info']['pages']
                }
                for g in generators
            ],
            'count': len(generators)
        })
    
    def _handle_get_generator(self, params):
        """获取单个生成器信息"""
        name = params.get('name', [None])[0]
        if not name:
            self._send_json({'error': 'Missing generator name'}, 400)
            return
        
        generator_class = GeneratorRegistry.get(name)
        if not generator_class:
            self._send_json({'error': f'Generator not found: {name}'}, 404)
            return
        
        # 创建临时实例获取信息
        temp_config = PPTConfig('', '', '')
        info = generator_class(temp_config).get_info()
        self._send_json(info)
    
    def _handle_generate(self, data):
        """生成PPT"""
        # 获取参数
        generator_name = data.get('generator', 'presales')
        company_name = data.get('company_name', '示例公司')
        project_name = data.get('project_name', '示例项目')
        template_path = data.get('template_path')
        
        # 生成输出路径
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_filename = f"{generator_name}_{timestamp}.pptx"
        output_path = OUTPUT_DIR / output_filename
        
        # 创建配置
        config = PPTConfig(
            company_name=company_name,
            project_name=project_name,
            output_path=str(output_path),
            template_path=template_path
        )
        
        # 创建生成器
        generator = GeneratorRegistry.create(generator_name, config)
        if not generator:
            self._send_json({'error': f'Generator not found: {generator_name}'}, 404)
            return
        
        # 生成PPT
        start_time = datetime.now()
        result_path = generator.generate()
        end_time = datetime.now()
        
        # 返回结果
        self._send_json({
            'success': True,
            'generator': generator_name,
            'output_path': result_path,
            'filename': output_filename,
            'pages': generator.pages,
            'duration_ms': int((end_time - start_time).total_seconds() * 1000),
            'timestamp': datetime.now().isoformat()
        })
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[PPT API] {args[0]}")


def run_server(port=8769):
    """运行服务器"""
    server = HTTPServer(('0.0.0.0', port), PPTAPIHandler)
    print(f"📊 PPT Generator API running on http://localhost:{port}")
    print("Endpoints:")
    print("  - GET  /api/generators       - 列出所有生成器")
    print("  - GET  /api/generator?name=X - 获取生成器信息")
    print("  - POST /api/generate         - 生成PPT")
    print("  - GET  /api/health           - 健康检查")
    print("\nUsage:")
    print('  curl -X POST http://localhost:8769/api/generate \\')
    print('       -H "Content-Type: application/json" \\')
    print('       -d \'{"generator":"presales","company_name":"测试公司","project_name":"测试项目"}\'')
    server.serve_forever()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='PPT Generator API')
    parser.add_argument('--port', type=int, default=8769, help='API port')
    args = parser.parse_args()
    
    run_server(port=args.port)
