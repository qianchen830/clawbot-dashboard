# -*- coding: utf-8 -*-
"""
项目文件夹管理器
管理 D:\KINGDEESYS 下的项目文件夹结构
"""

import os
import json
from datetime import datetime

# 基础路径
BASE_PATH = "/mnt/d/KINGDEESYS" if os.path.exists("/mnt/d") else "D:/KINGDEESYS"

# 项目阶段
STAGES = [
    ("01-启动阶段", ["启动会PPT提纲.json", "启动会纪要.docx"]),
    ("02-调研阶段", ["调研问卷.docx", "调研报告.docx", "调研PPT提纲.json"]),
    ("03-蓝图阶段", ["业务蓝图.docx", "蓝图PPT提纲.json"]),
    ("04-开发阶段", ["开发说明书.docx"]),
    ("05-测试阶段", ["UAT测试方案.docx", "UAT测试报告.docx"]),
    ("06-上线阶段", ["上线方案.docx", "上线PPT提纲.json"]),
    ("07-验收阶段", ["验收报告.docx", "验收PPT提纲.json"]),
]


def create_project(project_name):
    """创建项目文件夹结构"""
    project_path = os.path.join(BASE_PATH, project_name)
    
    if os.path.exists(project_path):
        return {"success": False, "error": f"项目 {project_name} 已存在"}
    
    # 创建项目文件夹
    os.makedirs(project_path, exist_ok=True)
    
    # 创建各阶段文件夹
    for stage_name, _ in STAGES:
        stage_path = os.path.join(project_path, stage_name)
        os.makedirs(os.path.join(stage_path, "input"), exist_ok=True)
        os.makedirs(os.path.join(stage_path, "output"), exist_ok=True)
    
    # 创建公共输入文件夹
    os.makedirs(os.path.join(project_path, "input"), exist_ok=True)
    
    return {
        "success": True, 
        "path": project_path,
        "stages": [s[0] for s in STAGES]
    }


def get_project_path(project_name, stage=None, folder_type="output"):
    """获取项目路径"""
    if stage:
        return os.path.join(BASE_PATH, project_name, stage, folder_type)
    return os.path.join(BASE_PATH, project_name)


def list_projects():
    """列出所有项目"""
    if not os.path.exists(BASE_PATH):
        return []
    
    projects = []
    for name in os.listdir(BASE_PATH):
        project_path = os.path.join(BASE_PATH, name)
        if os.path.isdir(project_path):
            projects.append({
                "name": name,
                "path": project_path,
                "stages": [s[0] for s in STAGES if os.path.exists(os.path.join(project_path, s[0]))]
            })
    
    return projects


def get_stage_docs(project_name, stage):
    """获取某阶段的文档列表"""
    stage_path = os.path.join(BASE_PATH, project_name, stage, "output")
    
    if not os.path.exists(stage_path):
        return []
    
    docs = []
    for name in os.listdir(stage_path):
        file_path = os.path.join(stage_path, name)
        if os.path.isfile(file_path):
            docs.append({
                "name": name,
                "path": file_path,
                "size": os.path.getsize(file_path),
                "mtime": datetime.fromtimestamp(os.path.getmtime(file_path)).strftime("%Y-%m-%d %H:%M")
            })
    
    return docs


if __name__ == "__main__":
    # 测试
    print("项目文件夹管理器")
    print(f"基础路径: {BASE_PATH}")
    
    # 创建测试项目
    result = create_project("测试项目")
    print(f"创建结果: {result}")
    
    # 列出项目
    projects = list_projects()
    print(f"项目列表: {projects}")
