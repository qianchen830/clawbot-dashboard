# -*- coding: utf-8 -*-
"""
售前PPT生成器示例
演示如何使用基础生成器类
"""

import sys
import os
from pathlib import Path

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from ppt.base_generator import (
    BasePPTGenerator,
    PPTConfig,
    GeneratorRegistry,
    ShapeBuilder,
)


@GeneratorRegistry.register('presales')
class PresalesPPTGenerator(BasePPTGenerator):
    """售前PPT生成器"""
    
    name = "presales"
    version = "1.0"
    description = "售前PPT生成器"
    pages = 10
    
    def generate(self) -> str:
        """生成售前PPT"""
        # 1. 封面
        self._create_cover()
        
        # 2. 目录
        self._create_toc()
        
        # 3. 公司简介
        self._create_company_intro()
        
        # 4. 解决方案
        self._create_solution()
        
        # 5. 产品功能
        self._create_features()
        
        # 6. 成功案例
        self._create_cases()
        
        # 7. 实施计划
        self._create_plan()
        
        # 8. 服务保障
        self._create_service()
        
        # 9. 报价方案
        self._create_pricing()
        
        # 10. 联系方式
        self._create_contact()
        
        return self.save()
    
    def _create_cover(self):
        """创建封面"""
        slide = self.add_slide('封面')
        builder = self.create_shape_builder(slide)
        
        # 标题
        builder.add_textbox(
            f"{self.config.company_name}\n数字化转型升级方案",
            1, 2, 8, 2, 'title', 'white', 'center'
        )
        
        # 副标题
        builder.add_textbox(
            self.config.project_name,
            1, 4.5, 8, 0.5, 'subtitle', 'light', 'center'
        )
        
        # 日期
        builder.add_textbox(
            self.config.date,
            1, 5.2, 8, 0.3, 'body', 'light', 'center'
        )
    
    def _create_toc(self):
        """创建目录"""
        slide = self.add_slide('目录、提纲')
        builder = self.create_shape_builder(slide)
        
        builder.add_textbox("目 录", 4, 0.5, 2, 0.5, 'heading1', 'primary', 'center')
        
        chapters = [
            "01 公司简介",
            "02 解决方案",
            "03 产品功能",
            "04 成功案例",
            "05 实施计划",
            "06 服务保障",
            "07 报价方案",
        ]
        
        y = 1.5
        for chapter in chapters:
            builder.add_textbox(chapter, 2, y, 6, 0.4, 'body', 'text_dark', 'left')
            y += 0.5
    
    def _create_company_intro(self):
        """创建公司简介"""
        slide = self.add_slide('章节封面')
        builder = self.create_shape_builder(slide)
        
        builder.add_textbox("01", 4, 2, 2, 1, 'title', 'primary', 'center')
        builder.add_textbox("公司简介", 4, 3, 2, 0.5, 'heading1', 'text_dark', 'center')
    
    def _create_solution(self):
        """创建解决方案"""
        slide = self.add_slide('章节封面')
        builder = self.create_shape_builder(slide)
        
        builder.add_textbox("02", 4, 2, 2, 1, 'title', 'primary', 'center')
        builder.add_textbox("解决方案", 4, 3, 2, 0.5, 'heading1', 'text_dark', 'center')
    
    def _create_features(self):
        """创建产品功能"""
        slide = self.add_slide('章节封面')
        builder = self.create_shape_builder(slide)
        
        builder.add_textbox("03", 4, 2, 2, 1, 'title', 'primary', 'center')
        builder.add_textbox("产品功能", 4, 3, 2, 0.5, 'heading1', 'text_dark', 'center')
    
    def _create_cases(self):
        """创建成功案例"""
        slide = self.add_slide('章节封面')
        builder = self.create_shape_builder(slide)
        
        builder.add_textbox("04", 4, 2, 2, 1, 'title', 'primary', 'center')
        builder.add_textbox("成功案例", 4, 3, 2, 0.5, 'heading1', 'text_dark', 'center')
    
    def _create_plan(self):
        """创建实施计划"""
        slide = self.add_slide('章节封面')
        builder = self.create_shape_builder(slide)
        
        builder.add_textbox("05", 4, 2, 2, 1, 'title', 'primary', 'center')
        builder.add_textbox("实施计划", 4, 3, 2, 0.5, 'heading1', 'text_dark', 'center')
    
    def _create_service(self):
        """创建服务保障"""
        slide = self.add_slide('章节封面')
        builder = self.create_shape_builder(slide)
        
        builder.add_textbox("06", 4, 2, 2, 1, 'title', 'primary', 'center')
        builder.add_textbox("服务保障", 4, 3, 2, 0.5, 'heading1', 'text_dark', 'center')
    
    def _create_pricing(self):
        """创建报价方案"""
        slide = self.add_slide('章节封面')
        builder = self.create_shape_builder(slide)
        
        builder.add_textbox("07", 4, 2, 2, 1, 'title', 'primary', 'center')
        builder.add_textbox("报价方案", 4, 3, 2, 0.5, 'heading1', 'text_dark', 'center')
    
    def _create_contact(self):
        """创建联系方式"""
        slide = self.add_slide('感谢')
        builder = self.create_shape_builder(slide)
        
        builder.add_textbox("感谢聆听", 4, 2.5, 2, 0.5, 'title', 'primary', 'center')
        builder.add_textbox(self.config.company_name, 4, 3.5, 2, 0.3, 'body', 'text_dark', 'center')


if __name__ == '__main__':
    # 测试
    config = PPTConfig(
        company_name="示例公司",
        project_name="数字化转型项目",
        output_path="output/presales_demo.pptx"
    )
    
    generator = PresalesPPTGenerator(config)
    output_path = generator.generate()
    
    print(f"PPT已生成: {output_path}")
    print(f"生成器信息: {generator.get_info()}")
