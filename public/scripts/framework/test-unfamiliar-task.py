#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unfamiliar Task Handler Test
Test unfamiliar task detection and learning
"""

import re

class UnfamiliarTaskHandler:
    """Handle unfamiliar tasks"""
    
    def __init__(self):
        self.learning_sources = {
            'clawhub': {'priority': 1, 'description': 'ClawHub技能库'},
            'github': {'priority': 2, 'description': 'GitHub开源项目'},
            'youtube': {'priority': 3, 'description': 'YouTube/B站视频'},
            'other': {'priority': 4, 'description': '其他来源'}
        }
    
    def is_unfamiliar(self, task):
        """Check if task is unfamiliar"""
        unfamiliar_indicators = [
            '从未做过',
            '第一次',
            '不会',
            '不懂',
            '复杂',
            '困难',
            '需要学习',
            '陌生'
        ]
        
        for indicator in unfamiliar_indicators:
            if indicator in task:
                return True
        
        # Check complexity
        if len(task) > 100 or task.count('，') >= 3:
            return True
        
        return False
    
    def search_clawhub(self, keyword):
        """Search ClawHub for skills"""
        # Simulated search results
        mock_results = {
            'pdf': ['pdf-generator', 'pdf-merger', 'pdf-to-image'],
            'video': ['video-editor', 'video-downloader', 'video-compressor'],
            'image': ['image-resize', 'image-compress', 'image-watermark'],
            'bilibili': ['bilibili-downloader', 'bilibili-analyzer'],
        }
        
        for key, skills in mock_results.items():
            if key in keyword.lower():
                return skills
        
        return []
    
    def recommend_learning_path(self, task):
        """Recommend learning path"""
        recommendations = []
        
        # Extract keywords
        keywords = re.findall(r'[\u4e00-\u9fa5]+|[a-zA-Z]+', task)
        
        for keyword in keywords[:3]:  # Top 3 keywords
            # Check ClawHub
            skills = self.search_clawhub(keyword)
            if skills:
                recommendations.append({
                    'source': 'ClawHub',
                    'priority': 1,
                    'action': f"搜索: clawhub search {keyword}",
                    'skills': skills
                })
            
            # Check GitHub
            recommendations.append({
                'source': 'GitHub',
                'priority': 2,
                'action': f"搜索: gh search repos {keyword}",
                'url': f"https://github.com/search?q={keyword}"
            })
        
        # Sort by priority
        recommendations.sort(key=lambda x: x['priority'])
        
        return recommendations[:5]  # Top 5 recommendations

def test_unfamiliar_handler():
    """Test unfamiliar task handler"""
    
    handler = UnfamiliarTaskHandler()
    
    test_cases = [
        ("帮我生成一个PDF报告", "PDF生成"),
        ("我从未做过视频编辑，需要剪辑一个视频", "视频编辑（陌生）"),
        ("下载B站视频并分析数据", "B站处理"),
        ("这是一个复杂的机器学习任务，我不会", "机器学习（陌生）"),
        ("帮我写一个简单的脚本", "简单任务"),
    ]
    
    print("=" * 70)
    print("陌生任务处理测试")
    print("=" * 70)
    
    for task, description in test_cases:
        is_unfamiliar = handler.is_unfamiliar(task)
        
        print(f"\n[任务] {description}")
        print(f"描述: {task}")
        print(f"陌生任务: {'✅ 是' if is_unfamiliar else '❌ 否'}")
        
        if is_unfamiliar:
            print("\n推荐学习路径:")
            recommendations = handler.recommend_learning_path(task)
            
            for i, rec in enumerate(recommendations, 1):
                print(f"  {i}. [{rec['source']}] {rec['action']}")
                if 'skills' in rec:
                    print(f"     找到技能: {', '.join(rec['skills'])}")
        
        print("-" * 70)

if __name__ == '__main__':
    test_unfamiliar_handler()
