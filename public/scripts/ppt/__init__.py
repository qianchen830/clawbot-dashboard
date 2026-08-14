# -*- coding: utf-8 -*-
"""
金蝶PPT生成器包
"""

from .base_generator import (
    BasePPTGenerator,
    PPTConfig,
    StyleManager,
    LayoutManager,
    ShapeBuilder,
    GeneratorRegistry,
    KINGDEE_COLORS,
    FONTS,
)

__all__ = [
    'BasePPTGenerator',
    'PPTConfig',
    'StyleManager',
    'LayoutManager',
    'ShapeBuilder',
    'GeneratorRegistry',
    'KINGDEE_COLORS',
    'FONTS',
]
