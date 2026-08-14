#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
金蝶交付自动化系统 - PDF导出模块 v1.0
支持PPT转PDF、Word转PDF、PDF合并功能
"""

import os
import sys
import subprocess
from typing import List, Optional, Dict, Any
from datetime import datetime

OUTPUT_DIR = os.path.expanduser("~/.openclaw/workspace/output")
os.makedirs(OUTPUT_DIR, exist_ok=True)


class PDFConverter:
    """PDF转换器"""
    
    def __init__(self):
        """初始化PDF转换器"""
        self.libreoffice_path = self._find_libreoffice()
        self.soffice_available = self._check_soffice()
    
    def _find_libreoffice(self) -> Optional[str]:
        """
        查找LibreOffice路径
        
        Returns:
            LibreOffice路径或None
        """
        possible_paths = [
            '/usr/bin/libreoffice',
            '/usr/bin/soffice',
            '/Applications/LibreOffice.app/Contents/MacOS/soffice',
            'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
            'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        
        # 尝试从PATH中查找
        try:
            result = subprocess.run(['which', 'libreoffice'], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
            
            result = subprocess.run(['which', 'soffice'], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
        except:
            pass
        
        return None
    
    def _check_soffice(self) -> bool:
        """
        检查soffice是否可用
        
        Returns:
            是否可用
        """
        if not self.libreoffice_path:
            return False
        
        try:
            result = subprocess.run(
                [self.libreoffice_path, '--version'],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0
        except:
            return False
    
    def convert_to_pdf(self, input_file: str, output_dir: str = None) -> Optional[str]:
        """
        将Office文档转换为PDF
        
        Args:
            input_file: 输入文件路径（.pptx或.docx）
            output_dir: 输出目录，默认与输入文件同目录
        
        Returns:
            PDF文件路径或None
        """
        if not self.soffice_available:
            print("警告: LibreOffice不可用，无法转换PDF")
            return None
        
        if not os.path.exists(input_file):
            print(f"错误: 文件不存在 {input_file}")
            return None
        
        if not input_file.endswith(('.pptx', '.docx', '.ppt', '.doc')):
            print(f"错误: 不支持的文件格式 {input_file}")
            return None
        
        output_dir = output_dir or os.path.dirname(input_file) or OUTPUT_DIR
        os.makedirs(output_dir, exist_ok=True)
        
        try:
            # 使用LibreOffice转换
            cmd = [
                self.libreoffice_path,
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', output_dir,
                input_file
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120  # 2分钟超时
            )
            
            if result.returncode != 0:
                print(f"转换失败: {result.stderr}")
                return None
            
            # 查找生成的PDF文件
            base_name = os.path.splitext(os.path.basename(input_file))[0]
            pdf_file = os.path.join(output_dir, f"{base_name}.pdf")
            
            if os.path.exists(pdf_file):
                print(f"PDF已生成: {pdf_file}")
                return pdf_file
            else:
                print(f"PDF文件未找到: {pdf_file}")
                return None
                
        except subprocess.TimeoutExpired:
            print("转换超时")
            return None
        except Exception as e:
            print(f"转换错误: {e}")
            return None
    
    def convert_pptx_to_pdf(self, pptx_file: str, output_dir: str = None) -> Optional[str]:
        """
        将PPT转换为PDF
        
        Args:
            pptx_file: PPT文件路径
            output_dir: 输出目录
        
        Returns:
            PDF文件路径或None
        """
        return self.convert_to_pdf(pptx_file, output_dir)
    
    def convert_docx_to_pdf(self, docx_file: str, output_dir: str = None) -> Optional[str]:
        """
        将Word转换为PDF
        
        Args:
            docx_file: Word文件路径
            output_dir: 输出目录
        
        Returns:
            PDF文件路径或None
        """
        return self.convert_to_pdf(docx_file, output_dir)
    
    def batch_convert(self, files: List[str], output_dir: str = None) -> Dict[str, Optional[str]]:
        """
        批量转换
        
        Args:
            files: 文件列表
            output_dir: 输出目录
        
        Returns:
            转换结果字典 {原文件: PDF路径}
        """
        results = {}
        
        for file in files:
            pdf_path = self.convert_to_pdf(file, output_dir)
            results[file] = pdf_path
        
        return results


class PDFMerger:
    """PDF合并器"""
    
    def __init__(self):
        """初始化PDF合并器"""
        self.pypdf_available = self._check_pypdf()
    
    def _check_pypdf(self) -> bool:
        """
        检查PyPDF是否可用
        
        Returns:
            是否可用
        """
        try:
            import pypdf
            return True
        except ImportError:
            try:
                from PyPDF2 import PdfMerger
                return True
            except ImportError:
                return False
    
    def merge_pdfs(self, pdf_files: List[str], output_file: str) -> bool:
        """
        合并PDF文件
        
        Args:
            pdf_files: PDF文件列表
            output_file: 输出文件路径
        
        Returns:
            是否成功
        """
        if not self.pypdf_available:
            print("警告: PyPDF不可用，无法合并PDF")
            return False
        
        if not pdf_files:
            print("错误: 没有PDF文件需要合并")
            return False
        
        try:
            # 使用PyPDF2
            try:
                from PyPDF2 import PdfMerger
                merger = PdfMerger()
                
                for pdf_file in pdf_files:
                    if os.path.exists(pdf_file):
                        merger.append(pdf_file)
                
                merger.write(output_file)
                merger.close()
                
            except ImportError:
                # 使用pypdf
                from pypdf import PdfWriter, PdfReader
                
                writer = PdfWriter()
                
                for pdf_file in pdf_files:
                    if os.path.exists(pdf_file):
                        reader = PdfReader(pdf_file)
                        for page in reader.pages:
                            writer.add_page(page)
                
                with open(output_file, 'wb') as f:
                    writer.write(f)
            
            print(f"PDF已合并: {output_file}")
            return True
            
        except Exception as e:
            print(f"合并PDF失败: {e}")
            return False
    
    def merge_documents(self, doc_files: List[str], output_file: str, 
                       converter: PDFConverter = None) -> bool:
        """
        合并Office文档为PDF
        
        Args:
            doc_files: Office文档列表
            output_file: 输出PDF文件路径
            converter: PDF转换器
        
        Returns:
            是否成功
        """
        if not converter:
            converter = PDFConverter()
        
        # 先转换为PDF
        pdf_files = []
        for doc_file in doc_files:
            pdf_path = converter.convert_to_pdf(doc_file)
            if pdf_path:
                pdf_files.append(pdf_path)
        
        if not pdf_files:
            print("错误: 没有PDF文件可以合并")
            return False
        
        # 合并PDF
        return self.merge_pdfs(pdf_files, output_file)


class DeliveryPDFExport:
    """交付文档PDF导出器"""
    
    def __init__(self):
        """初始化导出器"""
        self.converter = PDFConverter()
        self.merger = PDFMerger()
    
    def export_ppt_to_pdf(self, ppt_file: str) -> Optional[str]:
        """
        导出PPT为PDF
        
        Args:
            ppt_file: PPT文件路径
        
        Returns:
            PDF文件路径或None
        """
        return self.converter.convert_pptx_to_pdf(ppt_file)
    
    def export_word_to_pdf(self, word_file: str) -> Optional[str]:
        """
        导出Word为PDF
        
        Args:
            word_file: Word文件路径
        
        Returns:
            PDF文件路径或None
        """
        return self.converter.convert_docx_to_pdf(word_file)
    
    def export_all_to_pdf(self, customer_name: str) -> Dict[str, Optional[str]]:
        """
        导出所有交付文档为PDF
        
        Args:
            customer_name: 客户名称
        
        Returns:
            导出结果字典
        """
        results = {}
        
        # 查找客户相关的所有文档
        ppt_files = []
        word_files = []
        
        for filename in os.listdir(OUTPUT_DIR):
            if customer_name in filename:
                filepath = os.path.join(OUTPUT_DIR, filename)
                
                if filename.endswith('.pptx'):
                    ppt_files.append(filepath)
                elif filename.endswith('.docx'):
                    word_files.append(filepath)
        
        # 按时间排序，取最新的
        ppt_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
        word_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
        
        # 转换PPT
        if ppt_files:
            results['ppt'] = self.export_ppt_to_pdf(ppt_files[0])
        
        # 转换Word
        if word_files:
            results['word'] = self.export_word_to_pdf(word_files[0])
        
        return results
    
    def merge_all_to_pdf(self, customer_name: str, output_file: str = None) -> Optional[str]:
        """
        合并所有交付文档为一个PDF
        
        Args:
            customer_name: 客户名称
            output_file: 输出文件路径
        
        Returns:
            合并后的PDF路径或None
        """
        # 查找所有文档
        all_files = []
        
        for filename in os.listdir(OUTPUT_DIR):
            if customer_name in filename and (filename.endswith('.pptx') or filename.endswith('.docx')):
                all_files.append(os.path.join(OUTPUT_DIR, filename))
        
        if not all_files:
            print(f"未找到客户 {customer_name} 的文档")
            return None
        
        # 按类型和时间排序
        all_files.sort(key=lambda x: (
            0 if x.endswith('.pptx') else 1,  # PPT优先
            -os.path.getmtime(x)  # 时间倒序
        ))
        
        # 生成输出文件名
        if not output_file:
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            output_file = os.path.join(OUTPUT_DIR, f"{customer_name}_完整交付文档_{timestamp}.pdf")
        
        # 合并
        if self.merger.merge_documents(all_files, output_file, self.converter):
            return output_file
        else:
            return None


# 模块信息
__version__ = "1.0.0"
__author__ = "ClawBot"
__description__ = "金蝶交付自动化系统PDF导出模块"


if __name__ == "__main__":
    print("PDF导出模块测试")
    
    # 检查LibreOffice
    converter = PDFConverter()
    print(f"LibreOffice可用: {converter.soffice_available}")
    
    if converter.soffice_available:
        print(f"LibreOffice路径: {converter.libreoffice_path}")
    else:
        print("提示: 请安装LibreOffice以使用PDF转换功能")
        print("  Ubuntu/Debian: sudo apt-get install libreoffice")
        print("  macOS: brew install --cask libreoffice")
        print("  Windows: 从 https://www.libreoffice.org/ 下载安装")
    
    # 检查PyPDF
    merger = PDFMerger()
    print(f"PyPDF可用: {merger.pypdf_available}")
    
    if not merger.pypdf_available:
        print("提示: 请安装PyPDF以使用PDF合并功能")
        print("  pip install pypdf 或 pip install PyPDF2")
    
    print("\n模块测试完成！")
