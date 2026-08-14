#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Task Attempt Tracker
Track task execution attempts and enforce iron law
"""

from datetime import datetime

class AttemptTracker:
    """Track task execution attempts"""
    
    def __init__(self, task_name, max_attempts=5, token_limit=10000):
        self.task_name = task_name
        self.max_attempts = max_attempts
        self.token_limit = token_limit
        self.attempts = []
        self.total_tokens = 0
        self.success = False
    
    def record_attempt(self, strategy, result, tokens_used, success=False):
        """Record an attempt"""
        attempt = {
            'round': len(self.attempts) + 1,
            'strategy': strategy,
            'result': result,
            'tokens': tokens_used,
            'timestamp': datetime.now().isoformat(),
            'success': success
        }
        self.attempts.append(attempt)
        self.total_tokens += tokens_used
        self.success = success
        
        return self.check_should_stop()
    
    def check_should_stop(self):
        """Check if should stop and ask for help"""
        reasons = []
        
        # Check attempt limit
        if len(self.attempts) >= self.max_attempts and not self.success:
            reasons.append(f"已尝试{len(self.attempts)}轮仍未成功")
        
        # Check token limit
        if self.total_tokens >= self.token_limit:
            reasons.append(f"Token消耗已达{self.total_tokens}，超过限制{self.token_limit}")
        
        # Check success
        if self.success:
            reasons.append("任务已成功完成")
        
        return {
            'should_stop': len(reasons) > 0,
            'reasons': reasons,
            'attempts': len(self.attempts),
            'total_tokens': self.total_tokens
        }
    
    def get_report(self):
        """Generate attempt report"""
        report = f"\n{'='*60}\n"
        report += f"任务: {self.task_name}\n"
        report += f"{'='*60}\n\n"
        
        for attempt in self.attempts:
            status = "✅ 成功" if attempt['success'] else "❌ 失败"
            report += f"第{attempt['round']}轮 [{status}]\n"
            report += f"  策略: {attempt['strategy']}\n"
            report += f"  结果: {attempt['result']}\n"
            report += f"  Token: {attempt['tokens']}\n\n"
        
        report += f"{'='*60}\n"
        report += f"总计: {len(self.attempts)}轮, {self.total_tokens} tokens\n"
        
        if self.success:
            report += f"状态: ✅ 任务成功\n"
        else:
            check = self.check_should_stop()
            if check['should_stop']:
                report += f"状态: ⚠️ 需要求助\n"
                report += f"原因: {', '.join(check['reasons'])}\n"
        
        report += f"{'='*60}\n"
        
        return report

def test_iron_law():
    """Test iron law enforcement"""
    
    print("=" * 60)
    print("任务铁律测试")
    print("=" * 60)
    
    # Test Case 1: Success after 3 attempts
    tracker1 = AttemptTracker("安装技能", max_attempts=5)
    tracker1.record_attempt("直接安装", "技能不存在", 500)
    tracker1.record_attempt("搜索替代", "找到替代技能", 800)
    tracker1.record_attempt("安装替代", "成功安装", 600, success=True)
    print(tracker1.get_report())
    
    # Test Case 2: Failed after 5 attempts
    tracker2 = AttemptTracker("修复脚本错误", max_attempts=5)
    tracker2.record_attempt("直接修复", "语法错误", 1000)
    tracker2.record_attempt("查阅文档", "未找到解决方案", 1500)
    tracker2.record_attempt("搜索方案", "方案不适用", 2000)
    tracker2.record_attempt("组合方法", "部分解决", 2500)
    tracker2.record_attempt("重写脚本", "新错误", 3000)
    print(tracker2.get_report())
    
    # Test Case 3: Token limit exceeded
    tracker3 = AttemptTracker("处理大文件", max_attempts=5, token_limit=5000)
    tracker3.record_attempt("读取文件", "文件过大", 2000)
    tracker3.record_attempt("分块处理", "部分成功", 2000)
    tracker3.record_attempt("优化内存", "仍然超限", 2000)
    print(tracker3.get_report())

if __name__ == '__main__':
    test_iron_law()
