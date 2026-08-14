#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Context Compression Script v2.1 (Balanced)
Balanced compression with smart detection
"""

import re

def smart_compress(text):
    """Smart compression with balanced rules"""
    
    original_len = len(text)
    
    # Phase 1: Remove polite phrases (aggressive)
    polite_patterns = [
        r'请问能不能帮我',
        r'请问能不能',
        r'麻烦你帮我',
        r'麻烦你',
        r'能不能帮我',
        r'能不能',
        r'请帮我',
        r'帮我',
        r'我想让你',
        r'我想让',
        r'我想',
    ]
    
    for pattern in polite_patterns:
        text = re.sub(pattern, '', text)
    
    # Phase 2: Remove filler words (aggressive)
    filler_words = ['就是', '那个', '然后', '所以', '其实', '比如说', '嗯', '啊', '吧', '呢', '哦', '一下', '看看']
    for word in filler_words:
        text = text.replace(word, '')
    
    # Phase 3: Simplify punctuation
    text = text.replace('，', ' ').replace('。', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Phase 4: Smart structure detection
    # Only structure if it significantly reduces length
    
    # Check for steps (only if 3+ steps)
    if '步骤' in text or text.count('第') >= 3:
        steps = re.findall(r'第[一二三四五六七八九十\d]+[步部]分?[：:\s]*([^第第]+)', text)
        if len(steps) >= 3:
            compressed = "步骤:\n"
            for i, step in enumerate(steps, 1):
                step_text = step.strip().strip('，。')
                if step_text:
                    compressed += f"{i}.{step_text}\n"
            
            # Only use if shorter
            if len(compressed) < len(text):
                return compressed.strip()
    
    # Check for task + goal (only if both present)
    if ('目标' in text or '为了' in text) and len(text) > 20:
        parts = re.split(r'[，。]?目标[是为]|[，。]?为了', text, maxsplit=1)
        
        if len(parts) == 2 and parts[0].strip() and parts[1].strip():
            compressed = f"任务:{parts[0].strip()}\n目标:{parts[1].strip()}"
            
            # Only use if shorter
            if len(compressed) < len(text):
                return compressed
    
    # Phase 5: Remove redundancy (default)
    words = text.split()
    unique_words = []
    for word in words:
        if word not in unique_words[-3:]:
            unique_words.append(word)
    
    return ' '.join(unique_words)

def test_compression():
    """Test balanced compression"""
    test_cases = [
        ("请问能不能帮我创建一个自动化的备份系统，这个系统需要能够自动检测文件的变化", "任务描述"),
        ("这个任务有三个步骤，第一步是收集数据，第二步是分析数据，第三步是生成报告", "步骤说明"),
        ("我想让你帮我分析一下B站的数据，看看最近视频表现怎么样，目标是找出爆款规律", "任务+目标"),
        ("就是那个，麻烦你帮我写一个脚本，然后这个脚本需要能够自动安装技能", "填充词多"),
        ("请问能不能帮我每小时学习一个技能，为了提高我的能力，目的是让系统更智能", "长句子"),
        ("系统需要支持三个功能：自动备份、智能恢复、云端同步", "列表项"),
    ]
    
    print("=" * 70)
    print("Context Compression Test v2.1 (Balanced)")
    print("=" * 70)
    
    total_orig = 0
    total_comp = 0
    
    for i, (original, desc) in enumerate(test_cases, 1):
        compressed = smart_compress(original)
        
        orig_len = len(original)
        comp_len = len(compressed)
        saved = (1 - comp_len / orig_len) * 100 if orig_len > 0 else 0
        
        total_orig += orig_len
        total_comp += comp_len
        
        print(f"\n[Test {i}] {desc}")
        print(f"原始 ({orig_len}字): {original}")
        print(f"压缩 ({comp_len}字, 节省{saved:.0f}%):")
        print(f"  {compressed}")
        print("-" * 70)
    
    total_saved = (1 - total_comp / total_orig) * 100 if total_orig > 0 else 0
    print(f"\n[总结]")
    print(f"原始总计: {total_orig}字")
    print(f"压缩总计: {total_comp}字")
    print(f"总节省: {total_saved:.0f}%")
    print("=" * 70)

if __name__ == '__main__':
    test_compression()
