#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Session Routing Test Script
Test session routing rules
"""

import json
from datetime import datetime

CONFIG_FILE = '/home/zzyuzhangxing/.openclaw/workspace/config/model-pools.json'

def load_config():
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def identify_task_type(user_input):
    """Identify task type based on keywords"""
    config = load_config()
    
    # Check vision pool first (highest priority)
    vision_keywords = ['图片', '图像', '照片', '截图', '视频', '影片', '画面', '看图', '识图', '分析图', '多模态']
    for keyword in vision_keywords:
        if keyword in user_input:
            return 'vision'
    
    # Then check other pools
    keywords_map = {
        'fast': ['快速', '简单', '闲聊', '随便', '查询', '搜索', '查找', '修改', '调整', '更新'],
        'smart': ['分析', '推理', '思考', '研究', '编程', '代码', '开发', '编写', '策略', '规划', '方案', '计划', '深度', '详细', '全面', '透彻'],
        'text': ['文档', '文章', '报告', '内容', '长文本', '大段', '全文', '写作', '创作', '撰写', '总结', '摘要', '提炼']
    }
    
    for pool_name, keywords in keywords_map.items():
        for keyword in keywords:
            if keyword in user_input:
                return pool_name
    
    return 'smart'  # Default pool

def get_pool_info(pool_name):
    """Get pool information"""
    config = load_config()
    if pool_name in config['pools']:
        pool = config['pools'][pool_name]
        return {
            'name': pool['name'],
            'primary': pool['primary'],
            'fallback': pool['fallback']
        }
    return None

def test_routing():
    """Test session routing"""
    test_cases = [
        "快速回复一下",
        "分析一下B站数据",
        "帮我写一篇文章",
        "看图分析这张截图",
        "随便聊聊",
        "编写一个Python脚本",
        "总结这段长文本",
        "优化视频内容"
    ]
    
    print("=" * 60)
    print("Session Routing Test")
    print("=" * 60)
    
    for test_input in test_cases:
        pool_name = identify_task_type(test_input)
        pool_info = get_pool_info(pool_name)
        
        print(f"\nInput: {test_input}")
        print(f"Identified Pool: {pool_info['name']} ({pool_name})")
        print(f"Primary Model: {pool_info['primary']}")
        print(f"Fallback Model: {pool_info['fallback']}")
        print(f"Output: 当前任务属于{pool_info['name']},应该使用{pool_name}模型池")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    test_routing()
