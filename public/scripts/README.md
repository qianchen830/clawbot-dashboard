# 金蝶交付自动化系统 v10.0

一键生成全套金蝶项目交付文档，支持PPT和Word格式。

## 功能特性

### 📊 PPT生成
- **售前PPT**（29页）：企业概况、痛点分析、解决方案、价值工程、实施路线、成功案例
- **上线汇报PPT**（17页）：项目概述、实施过程、业务范围、价值达成、成果展示
- **验收汇报PPT**（17页）：验收概述、验收标准、验收结果、验收结论

### 📝 Word生成
- **调研报告**：项目背景、企业现状、需求分析、信息化现状
- **业务蓝图**：4A架构设计（BA/DA/AA/TA）
- **UAT测试报告**：测试概述、测试结果、测试结论
- **验收报告**：项目概述、验收标准、验收结果、验收结论

### 🎯 智能特性
- **行业匹配**：自动匹配10个行业的痛点、方案、收益
- **规模适配**：根据企业规模调整内容深度和实施周期
- **图表生成**：支持饼图、柱状图、折线图、架构图、组织图、流程图、KPI仪表盘
- **一键生成**：一键生成全部文档，支持批量生成

## 快速开始

### 1. 启动服务器

```bash
cd ~/.openclaw/workspace/scripts
node kingdee-server-v5.cjs
```

### 2. 打开界面

浏览器访问：http://localhost:8765/kingdee-delivery-v9.html

### 3. 填写信息

- 企业名称
- 所属行业（10个行业可选）
- 企业规模
- 员工人数
- 年营业额

### 4. 一键生成

点击"一键生成全部"按钮，自动生成所有PPT和Word文档。

## 命令行使用

### 生成单个文档

```bash
# 生成售前PPT
python3 kingdee-delivery-generator.py --type presales --companyName "测试企业" --industry "制造业"

# 生成上线汇报PPT
python3 kingdee-delivery-generator.py --type golive --companyName "测试企业"

# 生成验收汇报PPT
python3 kingdee-delivery-generator.py --type acceptance --companyName "测试企业"

# 生成调研报告
python3 kingdee-delivery-generator.py --type survey --companyName "测试企业"

# 生成业务蓝图
python3 kingdee-delivery-generator.py --type blueprint --companyName "测试企业"

# 生成UAT测试报告
python3 kingdee-delivery-generator.py --type uat --companyName "测试企业"

# 生成验收报告
python3 kingdee-delivery-generator.py --type acceptance --companyName "测试企业"
```

### 一键生成全部

```bash
# 生成全部文档
python3 kingdee-delivery-generator.py --type all --companyName "测试企业" --industry "制造业"

# 生成全部PPT
python3 kingdee-delivery-generator.py --type all-ppt --companyName "测试企业"

# 生成全部Word
python3 kingdee-delivery-generator.py --type all-word --companyName "测试企业"
```

## 文件结构

```
scripts/
├── kingdee-delivery-generator.py   # 统一生成入口
├── kingdee-ppt-common.py           # PPT公共模块
├── kingdee-ppt-charts.py           # PPT图表模块
├── kingdee-ppt-content.py          # PPT智能内容模块
├── kingdee-word-generator.py       # Word文档生成模块
├── kingdee-ppt-v11-professional.py # 售前PPT生成器（旧版）
├── kingdee-ppt-v12-professional.py # 上线汇报PPT生成器（旧版）
├── kingdee-ppt-v12-acceptance.py   # 验收汇报PPT生成器（旧版）
├── kingdee-server-v5.cjs           # 服务器
└── kingdee-delivery-v9.html        # 前端界面

output/                             # 输出目录
├── *_售前PPT_*.pptx
├── *_上线汇报PPT_*.pptx
├── *_验收汇报PPT_*.pptx
├── *_调研报告_*.docx
├── *_业务蓝图_*.docx
├── *_UAT测试报告_*.docx
└── *_验收报告_*.docx
```

## 支持的行业

| 行业 | 痛点 | 解决方案 | 收益 |
|------|------|----------|------|
| 制造业 | 生产计划、库存管理、成本核算 | APS排程、精益库存、精细化成本 | 效率+30%，成本-15% |
| 零售业 | 库存管理、销售分析、会员管理 | 智能库存、全渠道销售、会员营销 | 库存准确99%，销售+20% |
| 服务业 | 项目成本、资源调度、客户服务 | 项目管理、资源调度、客服系统 | 利润+20%，满意度95% |
| 金融 | 风险管理、合规成本、业务创新 | 风险管控、敏捷开发、客户体验 | 风险识别+40%，成本-30% |
| 医疗 | 资源调度、患者体验、成本控制 | 资源系统、患者服务、成本管理 | 资源+20%，满意度+30% |
| 教育 | 教学资源、学生管理、财务流程 | 资源平台、学生系统、财务自动化 | 教学效率+25%，管理+40% |
| 物流 | 仓储管理、配送调度、货物追踪 | WMS系统、路径优化、全程追踪 | 仓储+40%，成本-20% |
| 房地产 | 项目管理、成本控制、销售管理 | 项目管理、成本管控、CRM | 进度可控90%，成本超支-60% |
| 能源 | 设备管理、能耗管理、安全管理 | 设备管理、能耗监测、安全管理 | 故障率-40%，能耗-15% |
| 建筑 | 项目管理、成本核算、供应链 | 项目管理、成本核算、供应链优化 | 进度可控85%，成本超支-50% |

## API接口

### 生成全部文档

```
GET /api/generate-unified?companyName=xxx&industry=xxx&companySize=xxx&employees=xxx&revenue=xxx
```

### 生成所有PPT

```
GET /api/generate-all-ppt?companyName=xxx&industry=xxx
```

### 生成所有Word

```
GET /api/generate-all-word?companyName=xxx&industry=xxx
```

### 下载文件

```
GET /api/download?filename=xxx.docx
```

### 文件列表

```
GET /api/files
```

## 版本历史

### v10.0 (2026-03-17)
- ✅ 一键生成全部文档功能
- ✅ 智能内容生成模块
- ✅ Word文档生成功能
- ✅ 图表生成模块（7种图表）
- ✅ 行业案例库扩展（10个行业）
- ✅ 企业规模适配
- ✅ 新版前端界面

### v9.6 (2026-03-17)
- ✅ 售前PPT专业版（29页）
- ✅ 上线汇报PPT专业版（17页）
- ✅ 验收汇报PPT专业版（17页）
- ✅ 21个行业案例

### v5.0 (2026-03-13)
- ✅ 调研报告生成
- ✅ 业务蓝图生成
- ✅ UAT测试报告生成
- ✅ 客户信息管理

## 依赖

- Python 3.x
- python-pptx
- python-docx
- Node.js 14+

## 作者

ClawBot - 金蝶交付自动化系统

## 许可

MIT License
