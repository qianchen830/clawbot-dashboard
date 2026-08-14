#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新 kingdee-presales-content-pro.py 文件
替换 EXTENDED_INDUSTRIES 部分
"""

import json
import re
from pathlib import Path

# 文件路径
MEMORY_DIR = Path.home() / ".openclaw" / "workspace" / "memory"
SCRIPT_FILE = Path.home() / ".openclaw" / "workspace" / "scripts" / "kingdee-presales-content-pro.py"

# 读取新的扩展行业数据
with open(MEMORY_DIR / "extended_industries_new.json", 'r', encoding='utf-8') as f:
    new_extended = json.load(f)

# 读取原文件
with open(SCRIPT_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# 找到 EXTENDED_INDUSTRIES 的位置
extended_start = content.find("EXTENDED_INDUSTRIES = {")
extended_end = content.find("}", extended_start + 100)

# 找到下一个 "}" 的位置（EXTENDED_INDUSTRIES 结束的位置）
brace_count = 1
pos = extended_start + len("EXTENDED_INDUSTRIES = {")
while brace_count > 0 and pos < len(content):
    if content[pos] == '{':
        brace_count += 1
    elif content[pos] == '}':
        brace_count -= 1
    pos += 1

extended_end = pos

print(f"找到 EXTENDED_INDUSTRIES: 行 {content[:extended_start].count(chr(10)) + 1} 到 {content[:extended_end].count(chr(10)) + 1}")

# 生成新的 EXTENDED_INDUSTRIES 字符串
extended_str = "EXTENDED_INDUSTRIES = {\n"
for key, data in new_extended.items():
    extended_str += f'    "{data["name"]}": {{\n'
    extended_str += f'        "name": "{data["name"]}",\n'
    extended_str += f'        "icon": "{data["icon"]}",\n'
    extended_str += f'        "scale": "{data["scale"]}",\n'
    extended_str += f'        "pain_points": [\n'
    for i, pp in enumerate(data['pain_points']):
        extended_str += f'            "{pp}"'
        if i < len(data['pain_points']) - 1:
            extended_str += ','
        extended_str += '\n'
    extended_str += f'        ],\n'
    extended_str += f'        "solutions": ['
    extended_str += ', '.join([f'"{s}"' for s in data['solutions']])
    extended_str += f'],\n'
    extended_str += f'        "results": [\n'
    for i, res in enumerate(data['results']):
        extended_str += f'            "{res}"'
        if i < len(data['results']) - 1:
            extended_str += ','
        extended_str += '\n'
    extended_str += f'        ]\n'
    extended_str += f'    }},\n'

extended_str = extended_str.rstrip(',\n') + '\n}'

# 替换内容
new_content = content[:extended_start] + extended_str + content[extended_end:]

# 写回文件
with open(SCRIPT_FILE, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"文件已更新: {SCRIPT_FILE}")
print(f"新增行业数量: {len(new_extended)}")

# 统计总行业数量
all_industries_count = content.count('INDUSTRY_DATABASE = {') + len(new_extended)
print(f"总行业数量: 约 {16 + len(new_extended)} 个（INDUSTRY_DATABASE 16个 + EXTENDED_INDUSTRIES {len(new_extended)}个）")
