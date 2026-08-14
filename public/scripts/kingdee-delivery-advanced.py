#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
金蝶交付自动化系统 - 高级功能模块 v1.0
支持PDF导出、批量生成、模板管理
"""

import os
import sys
import json
import csv
from datetime import datetime
from typing import Dict, List, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# 导入统一生成器
from kingdee_delivery_generator import KingdeeDeliveryGenerator

OUTPUT_DIR = os.path.expanduser("~/.openclaw/workspace/output")
os.makedirs(OUTPUT_DIR, exist_ok=True)


class BatchGenerator:
    """批量生成器"""
    
    def __init__(self, csv_file: str = None):
        """
        初始化批量生成器
        
        Args:
            csv_file: CSV文件路径（包含批量客户信息）
        """
        self.csv_file = csv_file
        self.results = []
    
    def load_customers_from_csv(self) -> List[Dict[str, Any]]:
        """
        从CSV文件加载客户信息
        
        Returns:
            客户信息列表
        """
        customers = []
        
        if not self.csv_file or not os.path.exists(self.csv_file):
            return customers
        
        with open(self.csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                customer = {
                    'companyName': row.get('企业名称', row.get('companyName', '')),
                    'industry': row.get('所属行业', row.get('industry', '制造业')),
                    'companySize': row.get('企业规模', row.get('companySize', '中型企业')),
                    'employees': row.get('员工人数', row.get('employees', '500')),
                    'revenue': row.get('年营业额', row.get('revenue', '10000')),
                    'goliveDate': row.get('上线日期', row.get('goliveDate', '')),
                    'acceptanceDate': row.get('验收日期', row.get('acceptanceDate', '')),
                }
                if customer['companyName']:
                    customers.append(customer)
        
        return customers
    
    def generate_for_customer(self, customer: Dict[str, Any], 
                              doc_types: List[str] = None) -> Dict[str, Any]:
        """
        为单个客户生成文档
        
        Args:
            customer: 客户信息
            doc_types: 文档类型列表（presales/golive/acceptance/survey/blueprint/uat/acceptance）
        
        Returns:
            生成结果
        """
        try:
            generator = KingdeeDeliveryGenerator(customer)
            result = {
                'companyName': customer['companyName'],
                'success': True,
                'files': {}
            }
            
            if doc_types is None:
                doc_types = ['presales', 'golive', 'acceptance', 'survey', 'blueprint', 'uat', 'acceptance']
            
            # 生成PPT
            if 'presales' in doc_types:
                try:
                    result['files']['presales_ppt'] = generator.generate_presales_ppt()
                except Exception as e:
                    result['files']['presales_ppt_error'] = str(e)
            
            if 'golive' in doc_types:
                try:
                    result['files']['golive_ppt'] = generator.generate_golive_ppt()
                except Exception as e:
                    result['files']['golive_ppt_error'] = str(e)
            
            if 'acceptance' in doc_types:
                try:
                    result['files']['acceptance_ppt'] = generator.generate_acceptance_ppt()
                except Exception as e:
                    result['files']['acceptance_ppt_error'] = str(e)
            
            # 生成Word
            if 'survey' in doc_types:
                try:
                    result['files']['survey_word'] = generator.word_generator.generate_survey_report()
                except Exception as e:
                    result['files']['survey_word_error'] = str(e)
            
            if 'blueprint' in doc_types:
                try:
                    result['files']['blueprint_word'] = generator.word_generator.generate_blueprint_report()
                except Exception as e:
                    result['files']['blueprint_word_error'] = str(e)
            
            if 'uat' in doc_types:
                try:
                    result['files']['uat_word'] = generator.word_generator.generate_uat_report()
                except Exception as e:
                    result['files']['uat_word_error'] = str(e)
            
            if 'acceptance_word' in doc_types:
                try:
                    result['files']['acceptance_word'] = generator.word_generator.generate_acceptance_report()
                except Exception as e:
                    result['files']['acceptance_word_error'] = str(e)
            
            return result
            
        except Exception as e:
            return {
                'companyName': customer.get('companyName', 'Unknown'),
                'success': False,
                'error': str(e)
            }
    
    def generate_batch(self, customers: List[Dict[str, Any]], 
                       doc_types: List[str] = None,
                       max_workers: int = 3) -> List[Dict[str, Any]]:
        """
        批量生成文档（并行）
        
        Args:
            customers: 客户信息列表
            doc_types: 文档类型列表
            max_workers: 最大并发数
        
        Returns:
            生成结果列表
        """
        results = []
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(self.generate_for_customer, customer, doc_types): customer
                for customer in customers
            }
            
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
                print(f"完成: {result['companyName']} - {'成功' if result['success'] else '失败'}")
        
        self.results = results
        return results
    
    def generate_batch_from_csv(self, doc_types: List[str] = None,
                                 max_workers: int = 3) -> List[Dict[str, Any]]:
        """
        从CSV文件批量生成
        
        Args:
            doc_types: 文档类型列表
            max_workers: 最大并发数
        
        Returns:
            生成结果列表
        """
        customers = self.load_customers_from_csv()
        if not customers:
            print("未找到客户信息")
            return []
        
        print(f"从CSV加载了 {len(customers)} 个客户")
        return self.generate_batch(customers, doc_types, max_workers)
    
    def save_results_report(self, output_file: str = None) -> str:
        """
        保存生成结果报告
        
        Args:
            output_file: 输出文件路径
        
        Returns:
            文件路径
        """
        if not output_file:
            output_file = os.path.join(OUTPUT_DIR, f"批量生成报告_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv")
        
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['企业名称', '状态', '生成文件数', '错误信息'])
            
            for result in self.results:
                status = '成功' if result['success'] else '失败'
                file_count = len([k for k in result.get('files', {}).keys() if not k.endswith('_error')])
                errors = '; '.join([v for k, v in result.get('files', {}).items() if k.endswith('_error')])
                
                writer.writerow([
                    result['companyName'],
                    status,
                    file_count,
                    errors
                ])
        
        return output_file


class TemplateManager:
    """模板管理器"""
    
    def __init__(self, template_dir: str = None):
        """
        初始化模板管理器
        
        Args:
            template_dir: 模板目录
        """
        self.template_dir = template_dir or os.path.join(OUTPUT_DIR, 'templates')
        os.makedirs(self.template_dir, exist_ok=True)
    
    def list_templates(self) -> List[Dict[str, Any]]:
        """
        列出所有模板
        
        Returns:
            模板列表
        """
        templates = []
        
        for filename in os.listdir(self.template_dir):
            if filename.endswith(('.pptx', '.docx')):
                filepath = os.path.join(self.template_dir, filename)
                stat = os.stat(filepath)
                templates.append({
                    'name': filename,
                    'type': 'PPT' if filename.endswith('.pptx') else 'Word',
                    'size': stat.st_size,
                    'modified': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                })
        
        return templates
    
    def create_template_csv(self, output_file: str = None) -> str:
        """
        创建批量导入CSV模板
        
        Args:
            output_file: 输出文件路径
        
        Returns:
            文件路径
        """
        if not output_file:
            output_file = os.path.join(self.template_dir, '批量导入模板.csv')
        
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                '企业名称', '所属行业', '企业规模', '员工人数', 
                '年营业额', '上线日期', '验收日期'
            ])
            writer.writerow([
                '示例企业A', '制造业', '中型企业', '500', 
                '10000', '2026-06-01', '2026-08-01'
            ])
            writer.writerow([
                '示例企业B', '零售业', '大型企业', '1000', 
                '50000', '2026-07-01', '2026-09-01'
            ])
        
        return output_file


# 模块信息
__version__ = "1.0.0"
__author__ = "ClawBot"
__description__ = "金蝶交付自动化系统高级功能模块"


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='金蝶交付高级功能')
    parser.add_argument('--action', required=True, 
                        choices=['batch-csv', 'batch-list', 'template-csv', 'list-templates'],
                        help='操作类型')
    parser.add_argument('--csv-file', help='CSV文件路径')
    parser.add_argument('--doc-types', help='文档类型（逗号分隔）')
    parser.add_argument('--max-workers', type=int, default=3, help='最大并发数')
    parser.add_argument('--customer-list', help='客户信息JSON文件路径')
    
    args = parser.parse_args()
    
    if args.action == 'batch-csv':
        # 从CSV批量生成
        doc_types = args.doc_types.split(',') if args.doc_types else None
        generator = BatchGenerator(args.csv_file)
        results = generator.generate_batch_from_csv(doc_types, args.max_workers)
        report_file = generator.save_results_report()
        print(f"\n批量生成完成！")
        print(f"成功: {len([r for r in results if r['success']])}")
        print(f"失败: {len([r for r in results if not r['success']])}")
        print(f"报告: {report_file}")
    
    elif args.action == 'batch-list':
        # 从JSON列表批量生成
        if not args.customer_list:
            print("请提供 --customer-list 参数")
            sys.exit(1)
        
        with open(args.customer_list, 'r', encoding='utf-8') as f:
            customers = json.load(f)
        
        doc_types = args.doc_types.split(',') if args.doc_types else None
        generator = BatchGenerator()
        results = generator.generate_batch(customers, doc_types, args.max_workers)
        report_file = generator.save_results_report()
        print(f"\n批量生成完成！")
        print(f"成功: {len([r for r in results if r['success']])}")
        print(f"失败: {len([r for r in results if not r['success']])}")
        print(f"报告: {report_file}")
    
    elif args.action == 'template-csv':
        # 创建批量导入CSV模板
        manager = TemplateManager()
        template_file = manager.create_template_csv()
        print(f"模板文件已创建: {template_file}")
    
    elif args.action == 'list-templates':
        # 列出所有模板
        manager = TemplateManager()
        templates = manager.list_templates()
        if templates:
            print("可用模板:")
            for t in templates:
                print(f"  - {t['name']} ({t['type']}, {t['size']} bytes, {t['modified']})")
        else:
            print("暂无模板")
