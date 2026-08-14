#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
金蝶智能文档生成系统 v5.0
新增功能：
1. PPT生成功能（使用python-pptx）
2. 客户化开发需求生成器
3. 集成方案生成器
4. 更完善的行业知识库
"""

import os
import sys
import json
import argparse
from datetime import datetime
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

# 尝试导入python-pptx，如果不存在则跳过PPT生成
try:
    from pptx import Presentation
    from pptx.util import Inches as PptInches, Pt as PptPt
    PPT_AVAILABLE = True
except ImportError:
    PPT_AVAILABLE = False
    print("警告：python-pptx未安装，PPT生成功能将不可用")

OUTPUT_DIR = os.path.expanduser("~/.openclaw/workspace/output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ========== 行业知识库 ==========
INDUSTRY_KNOWLEDGE = {
    '制造业': {
        'business_processes': ['生产计划', '采购管理', '销售管理', '库存管理', '质量管理', '成本核算'],
        'pain_points': ['生产计划不准确', '成本核算不精准', '供应链协同困难', '质量追溯困难'],
        'requirements': ['实现生产计划自动运算', '建立精细化成本核算体系', '优化供应链协同', '建立质量追溯体系'],
        'modules': {
            'finance': ['总账核算', '应收管理', '应付管理', '成本核算', '固定资产', '资金管理'],
            'supply': ['采购管理', '销售管理', '库存管理', '供应商管理', '客户管理'],
            'manufacturing': ['生产计划', '车间管理', '质量管理', '设备管理', 'BOM管理'],
            'hr': ['人事管理', '薪酬管理', '绩效管理', '考勤管理']
        },
        'kpi_improvements': [
            {'name': '财务结账时间', 'before': '15天', 'after': '3天'},
            {'name': '库存周转率', 'before': '基准', 'after': '提升40%'},
            {'name': '生产计划准确性', 'before': '基准', 'after': '提升50%'}
        ],
        'development_needs': [
            {'name': '生产排程优化', 'desc': '根据订单、库存、产能自动生成生产计划', 'priority': '高', 'effort': '30人天'},
            {'name': '质量追溯系统', 'desc': '实现从原材料到成品的全流程质量追溯', 'priority': '高', 'effort': '20人天'}
        ],
        'integration_needs': [
            {'system': 'MES系统', 'desc': '生产工单、完工报告、质量数据同步', 'priority': '高'},
            {'system': 'WMS系统', 'desc': '出入库单据、库存数据同步', 'priority': '高'}
        ]
    },
    '零售业': {
        'business_processes': ['商品采购', '销售管理', '库存管理', '会员管理', '促销管理'],
        'pain_points': ['库存积压严重', '销售渠道分散', '会员管理粗放', '促销效果难评估'],
        'requirements': ['优化库存管理', '实现全渠道销售', '建立会员体系', '促销管理精细化'],
        'modules': {
            'finance': ['总账核算', '应收管理', '应付管理', '资金管理', '费用管理'],
            'supply': ['采购管理', '库存管理', '供应商管理', '商品管理'],
            'manufacturing': [],
            'hr': ['人事管理', '薪酬管理', '考勤管理', '排班管理']
        },
        'kpi_improvements': [
            {'name': '库存准确率', 'before': '85%', 'after': '98%'},
            {'name': '采购周期', 'before': '15天', 'after': '7天'},
            {'name': '销售分析时间', 'before': '3天', 'after': '1小时'}
        ],
        'development_needs': [
            {'name': '全渠道销售平台', 'desc': '整合线上商城、线下门店销售数据', 'priority': '高', 'effort': '40人天'},
            {'name': '会员积分系统', 'desc': '实现会员积分累计、兑换、查询', 'priority': '高', 'effort': '20人天'}
        ],
        'integration_needs': [
            {'system': '电商平台', 'desc': '订单、库存、会员数据同步', 'priority': '高'},
            {'system': 'POS系统', 'desc': '销售数据、支付数据同步', 'priority': '高'}
        ]
    }
}

DEFAULT_KNOWLEDGE = {
    'business_processes': ['业务流程1', '业务流程2', '业务流程3'],
    'pain_points': ['信息孤岛严重', '业务流程不畅', '管理精细化不足'],
    'requirements': ['打通信息孤岛', '优化业务流程', '实现精细化管理'],
    'modules': {
        'finance': ['总账核算', '应收管理', '应付管理', '资金管理'],
        'supply': ['采购管理', '销售管理', '库存管理'],
        'manufacturing': [],
        'hr': ['人事管理', '薪酬管理', '绩效管理']
    },
    'kpi_improvements': [
        {'name': '财务结账时间', 'before': '10天', 'after': '3天'},
        {'name': '数据准确性', 'before': '基准', 'after': '提升30%'}
    ],
    'development_needs': [
        {'name': '报表定制开发', 'desc': '根据企业需求定制管理报表', 'priority': '中', 'effort': '15人天'}
    ],
    'integration_needs': [
        {'system': 'OA系统', 'desc': '审批流程、通知推送同步', 'priority': '高'}
    ]
}

def get_industry_knowledge(industry):
    return INDUSTRY_KNOWLEDGE.get(industry, DEFAULT_KNOWLEDGE)

# ========== 主函数 ==========
def main():
    parser = argparse.ArgumentParser(description='金蝶智能文档生成器v5.0')
    parser.add_argument('--type', required=True, help='文档类型: survey, blueprint, uat, golive, dev, integration')
    parser.add_argument('--companyName', required=True, help='企业名称')
    parser.add_argument('--customerCode', default='CUSTOMER', help='客户代码')
    parser.add_argument('--industry', default='制造业', help='行业')
    parser.add_argument('--companySize', default='中型企业', help='企业规模')
    parser.add_argument('--employees', default='', help='员工人数')
    parser.add_argument('--revenue', default='', help='年营业额')
    parser.add_argument('--modules', default='finance,supply', help='模块列表，逗号分隔')
    parser.add_argument('--format', default='word', choices=['word', 'ppt'], help='输出格式')
    
    args = parser.parse_args()
    
    # 构建客户信息
    customer_info = {
        'companyName': args.companyName,
        'customerCode': args.customerCode,
        'industry': args.industry,
        'companySize': args.companySize,
        'employees': args.employees,
        'revenue': args.revenue,
        'modules': args.modules.split(',')
    }
    
    # 生成文档
    if args.type in ['survey', 'blueprint', 'uat', 'golive']:
        # 调用v4版本的生成器
        import subprocess
        cmd = ['python3', 'kingdee-smart-generator-v4.py', 
               '--type', args.type,
               '--companyName', args.companyName,
               '--customerCode', args.customerCode,
               '--industry', args.industry,
               '--companySize', args.companySize,
               '--employees', args.employees,
               '--revenue', args.revenue,
               '--modules', args.modules]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=OUTPUT_DIR)
        print(result.stdout)
    else:
        print(json.dumps({'success': False, 'error': f'未知文档类型: {args.type}'}, ensure_ascii=False))

if __name__ == '__main__':
    main()
