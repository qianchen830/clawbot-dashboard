#!/usr/bin/env python3
"""
性能测试工具

功能:
- API响应时间测试
- 并发请求测试
- 压力测试
- 性能报告生成
"""

import asyncio
import time
import statistics
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import json
import aiohttp
import argparse
from pathlib import Path


@dataclass
class RequestResult:
    """请求结果"""
    url: str
    status_code: int
    response_time: float  # 毫秒
    success: bool
    error: Optional[str] = None
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


@dataclass
class PerformanceStats:
    """性能统计"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    avg_response_time: float = 0.0
    min_response_time: float = 0.0
    max_response_time: float = 0.0
    p50_response_time: float = 0.0
    p90_response_time: float = 0.0
    p99_response_time: float = 0.0
    requests_per_second: float = 0.0
    error_rate: float = 0.0
    status_codes: Dict[int, int] = None
    errors: List[str] = None
    
    def __post_init__(self):
        if self.status_codes is None:
            self.status_codes = {}
        if self.errors is None:
            self.errors = []


class PerformanceTester:
    """性能测试器"""
    
    def __init__(self, base_url: str = "http://localhost"):
        self.base_url = base_url
        self.results: List[RequestResult] = []
    
    async def test_endpoint(
        self,
        session: aiohttp.ClientSession,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> RequestResult:
        """测试单个端点"""
        url = f"{self.base_url}{endpoint}"
        start_time = time.time()
        
        try:
            if method == "GET":
                async with session.get(url, headers=headers) as response:
                    status_code = response.status
                    await response.text()
            elif method == "POST":
                async with session.post(url, json=data, headers=headers) as response:
                    status_code = response.status
                    await response.text()
            else:
                raise ValueError(f"不支持的方法: {method}")
            
            response_time = (time.time() - start_time) * 1000  # 转换为毫秒
            
            return RequestResult(
                url=url,
                status_code=status_code,
                response_time=response_time,
                success=200 <= status_code < 300
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return RequestResult(
                url=url,
                status_code=0,
                response_time=response_time,
                success=False,
                error=str(e)
            )
    
    async def run_concurrent_test(
        self,
        endpoint: str,
        num_requests: int,
        concurrency: int,
        method: str = "GET",
        data: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> PerformanceStats:
        """运行并发测试"""
        self.results = []
        start_time = time.time()
        
        connector = aiohttp.TCPConnector(limit=concurrency)
        async with aiohttp.ClientSession(connector=connector) as session:
            tasks = []
            for _ in range(num_requests):
                task = self.test_endpoint(session, endpoint, method, data, headers)
                tasks.append(task)
            
            self.results = await asyncio.gather(*tasks)
        
        total_time = time.time() - start_time
        
        return self._calculate_stats(total_time)
    
    def _calculate_stats(self, total_time: float) -> PerformanceStats:
        """计算性能统计"""
        if not self.results:
            return PerformanceStats()
        
        response_times = [r.response_time for r in self.results]
        successful_results = [r for r in self.results if r.success]
        failed_results = [r for r in self.results if not r.success]
        
        # 排序响应时间用于百分位数计算
        sorted_times = sorted(response_times)
        
        # 统计状态码
        status_codes = {}
        for r in self.results:
            status_codes[r.status_code] = status_codes.get(r.status_code, 0) + 1
        
        # 收集错误
        errors = [r.error for r in failed_results if r.error]
        
        return PerformanceStats(
            total_requests=len(self.results),
            successful_requests=len(successful_results),
            failed_requests=len(failed_results),
            avg_response_time=statistics.mean(response_times),
            min_response_time=min(response_times),
            max_response_time=max(response_times),
            p50_response_time=sorted_times[int(len(sorted_times) * 0.5)],
            p90_response_time=sorted_times[int(len(sorted_times) * 0.9)],
            p99_response_time=sorted_times[int(len(sorted_times) * 0.99)],
            requests_per_second=len(self.results) / total_time if total_time > 0 else 0,
            error_rate=len(failed_results) / len(self.results) * 100,
            status_codes=status_codes,
            errors=errors[:10]  # 只保留前10个错误
        )
    
    def generate_report(self, stats: PerformanceStats, output_path: Optional[str] = None) -> str:
        """生成性能报告"""
        report = f"""
# 性能测试报告

## 测试概要

- 测试时间: {datetime.now().isoformat()}
- 总请求数: {stats.total_requests}
- 成功请求: {stats.successful_requests}
- 失败请求: {stats.failed_requests}
- 错误率: {stats.error_rate:.2f}%
- 吞吐量: {stats.requests_per_second:.2f} req/s

## 响应时间

- 平均: {stats.avg_response_time:.2f} ms
- 最小: {stats.min_response_time:.2f} ms
- 最大: {stats.max_response_time:.2f} ms
- P50: {stats.p50_response_time:.2f} ms
- P90: {stats.p90_response_time:.2f} ms
- P99: {stats.p99_response_time:.2f} ms

## 状态码分布

"""
        for code, count in stats.status_codes.items():
            report += f"- {code}: {count}\n"
        
        if stats.errors:
            report += "\n## 错误信息\n\n"
            for i, error in enumerate(stats.errors, 1):
                report += f"{i}. {error}\n"
        
        # 性能评估
        report += "\n## 性能评估\n\n"
        
        if stats.avg_response_time < 100:
            report += "- 响应时间: 🟢 优秀 (< 100ms)\n"
        elif stats.avg_response_time < 300:
            report += "- 响应时间: 🟡 良好 (100-300ms)\n"
        else:
            report += "- 响应时间: 🔴 需优化 (> 300ms)\n"
        
        if stats.error_rate < 1:
            report += "- 错误率: 🟢 优秀 (< 1%)\n"
        elif stats.error_rate < 5:
            report += "- 错误率: 🟡 良好 (1-5%)\n"
        else:
            report += "- 错误率: 🔴 需优化 (> 5%)\n"
        
        if stats.requests_per_second > 100:
            report += "- 吞吐量: 🟢 优秀 (> 100 req/s)\n"
        elif stats.requests_per_second > 50:
            report += "- 吞吐量: 🟡 良好 (50-100 req/s)\n"
        else:
            report += "- 吞吐量: 🔴 需优化 (< 50 req/s)\n"
        
        # 保存报告
        if output_path:
            Path(output_path).write_text(report, encoding='utf-8')
        
        return report


# 预定义的API端点测试
ENDPOINTS = {
    "notes": {
        "port": 8766,
        "endpoints": [
            ("GET", "/api/notes"),
            ("GET", "/api/notes/stats"),
            ("GET", "/api/categories"),
        ]
    },
    "stats": {
        "port": 8767,
        "endpoints": [
            ("GET", "/api/stats/overview"),
            ("GET", "/api/stats/learning"),
            ("GET", "/api/stats/services"),
        ]
    },
    "health": {
        "port": 8768,
        "endpoints": [
            ("GET", "/health"),
            ("GET", "/api/health/services"),
            ("GET", "/api/health/metrics"),
        ]
    },
    "ppt": {
        "port": 8769,
        "endpoints": [
            ("GET", "/health"),
            ("GET", "/api/generators"),
        ]
    },
    "search": {
        "port": 8770,
        "endpoints": [
            ("GET", "/health"),
            ("GET", "/api/search/stats"),
        ]
    }
}


async def run_all_tests(
    num_requests: int = 100,
    concurrency: int = 10,
    output_dir: str = "logs/performance"
) -> Dict[str, PerformanceStats]:
    """运行所有服务的性能测试"""
    results = {}
    
    for service_name, config in ENDPOINTS.items():
        port = config["port"]
        base_url = f"http://localhost:{port}"
        
        print(f"\n测试 {service_name} 服务 (端口 {port})...")
        
        tester = PerformanceTester(base_url)
        
        # 测试每个端点
        for method, endpoint in config["endpoints"]:
            print(f"  测试 {method} {endpoint}...")
            
            try:
                stats = await tester.run_concurrent_test(
                    endpoint=endpoint,
                    num_requests=num_requests,
                    concurrency=concurrency,
                    method=method
                )
                
                results[f"{service_name}:{endpoint}"] = stats
                
                print(f"    平均响应: {stats.avg_response_time:.2f}ms")
                print(f"    吞吐量: {stats.requests_per_second:.2f} req/s")
                print(f"    错误率: {stats.error_rate:.2f}%")
                
            except Exception as e:
                print(f"    错误: {e}")
    
    # 生成汇总报告
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    report_time = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = output_path / f"performance_report_{report_time}.md"
    
    # 生成汇总
    summary = f"""# 性能测试汇总报告

测试时间: {datetime.now().isoformat()}
请求数: {num_requests}
并发数: {concurrency}

## 各服务性能概览

| 服务 | 端点 | 平均响应(ms) | 吞吐量(req/s) | 错误率(%) |
|------|------|-------------|--------------|----------|
"""
    
    for name, stats in results.items():
        summary += f"| {name} | - | {stats.avg_response_time:.2f} | {stats.requests_per_second:.2f} | {stats.error_rate:.2f} |\n"
    
    # 总体评估
    avg_response = statistics.mean([s.avg_response_time for s in results.values()])
    avg_throughput = statistics.mean([s.requests_per_second for s in results.values()])
    avg_error_rate = statistics.mean([s.error_rate for s in results.values()])
    
    summary += f"""
## 总体性能

- 平均响应时间: {avg_response:.2f} ms
- 平均吞吐量: {avg_throughput:.2f} req/s
- 平均错误率: {avg_error_rate:.2f}%

## 性能评级

"""
    
    if avg_response < 100 and avg_error_rate < 1 and avg_throughput > 100:
        summary += "🟢 **优秀** - 系统性能表现良好\n"
    elif avg_response < 300 and avg_error_rate < 5 and avg_throughput > 50:
        summary += "🟡 **良好** - 系统性能可以接受\n"
    else:
        summary += "🔴 **需优化** - 系统性能需要改进\n"
    
    summary += """
## 建议

"""
    
    if avg_response > 300:
        summary += "- 优化数据库查询\n- 添加缓存层\n- 检查慢查询\n"
    
    if avg_error_rate > 5:
        summary += "- 检查错误日志\n- 增加重试机制\n- 优化错误处理\n"
    
    if avg_throughput < 50:
        summary += "- 增加并发连接数\n- 优化连接池配置\n- 考虑水平扩展\n"
    
    report_file.write_text(summary, encoding='utf-8')
    print(f"\n报告已保存: {report_file}")
    
    return results


# CLI入口
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ClawBot 性能测试工具")
    parser.add_argument("--requests", "-n", type=int, default=100, help="每个端点的请求数")
    parser.add_argument("--concurrency", "-c", type=int, default=10, help="并发数")
    parser.add_argument("--output", "-o", default="logs/performance", help="输出目录")
    parser.add_argument("--service", "-s", help="只测试指定服务 (notes/stats/health/ppt/search)")
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("ClawBot 性能测试工具")
    print("=" * 50)
    print(f"请求数: {args.requests}")
    print(f"并发数: {args.concurrency}")
    print(f"输出目录: {args.output}")
    
    if args.service:
        # 只测试指定服务
        if args.service in ENDPOINTS:
            config = ENDPOINTS[args.service]
            base_url = f"http://localhost:{config['port']}"
            tester = PerformanceTester(base_url)
            
            for method, endpoint in config["endpoints"]:
                print(f"\n测试 {method} {endpoint}...")
                stats = asyncio.run(tester.run_concurrent_test(
                    endpoint=endpoint,
                    num_requests=args.requests,
                    concurrency=args.concurrency,
                    method=method
                ))
                
                print(f"  平均响应: {stats.avg_response_time:.2f}ms")
                print(f"  吞吐量: {stats.requests_per_second:.2f} req/s")
                print(f"  错误率: {stats.error_rate:.2f}%")
        else:
            print(f"未知服务: {args.service}")
    else:
        # 测试所有服务
        asyncio.run(run_all_tests(
            num_requests=args.requests,
            concurrency=args.concurrency,
            output_dir=args.output
        ))
