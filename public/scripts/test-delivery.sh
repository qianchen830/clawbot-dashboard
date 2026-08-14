#!/bin/bash
# 金蝶交付自动化系统 - 测试脚本 v1.0
# 用于测试所有生成功能

echo "=========================================="
echo "金蝶交付自动化系统 - 功能测试"
echo "=========================================="
echo ""

# 测试参数
COMPANY="测试企业"
INDUSTRY="制造业"
SIZE="中型企业"
EMPLOYEES="1000"
REVENUE="50000"

echo "测试参数："
echo "  企业名称: $COMPANY"
echo "  所属行业: $INDUSTRY"
echo "  企业规模: $SIZE"
echo "  员工人数: $EMPLOYEES"
echo "  年营业额: $REVENUE"
echo ""

# 切换到脚本目录
cd ~/.openclaw/workspace/scripts

echo "1. 测试售前PPT生成..."
python3 kingdee-delivery-generator.py --type presales \
    --companyName "$COMPANY" \
    --industry "$INDUSTRY" \
    --companySize "$SIZE" \
    --employees "$EMPLOYEES" \
    --revenue "$REVENUE"

echo ""
echo "2. 测试上线汇报PPT生成..."
python3 kingdee-delivery-generator.py --type golive \
    --companyName "$COMPANY" \
    --industry "$INDUSTRY" \
    --companySize "$SIZE" \
    --employees "$EMPLOYEES" \
    --revenue "$REVENUE"

echo ""
echo "3. 测试验收汇报PPT生成..."
python3 kingdee-delivery-generator.py --type acceptance \
    --companyName "$COMPANY" \
    --industry "$INDUSTRY" \
    --companySize "$SIZE" \
    --employees "$EMPLOYEES" \
    --revenue "$REVENUE"

echo ""
echo "4. 测试调研报告生成..."
python3 kingdee-delivery-generator.py --type survey \
    --companyName "$COMPANY" \
    --industry "$INDUSTRY" \
    --companySize "$SIZE" \
    --employees "$EMPLOYEES" \
    --revenue "$REVENUE"

echo ""
echo "5. 测试业务蓝图生成..."
python3 kingdee-delivery-generator.py --type blueprint \
    --companyName "$COMPANY" \
    --industry "$INDUSTRY" \
    --companySize "$SIZE" \
    --employees "$EMPLOYEES" \
    --revenue "$REVENUE"

echo ""
echo "6. 测试UAT测试报告生成..."
python3 kingdee-delivery-generator.py --type uat \
    --companyName "$COMPANY" \
    --industry "$INDUSTRY" \
    --companySize "$SIZE" \
    --employees "$EMPLOYEES" \
    --revenue "$REVENUE"

echo ""
echo "7. 测试验收报告生成..."
python3 kingdee-delivery-generator.py --type acceptance \
    --companyName "$COMPANY" \
    --industry "$INDUSTRY" \
    --companySize "$SIZE" \
    --employees "$EMPLOYEES" \
    --revenue "$REVENUE"

echo ""
echo "=========================================="
echo "测试完成！"
echo "=========================================="
echo ""
echo "生成的文件位于: ~/.openclaw/workspace/output/"
echo ""

# 列出生成的文件
ls -la ~/.openclaw/workspace/output/*.pptx 2>/dev/null | tail -5
ls -la ~/.openclaw/workspace/output/*.docx 2>/dev/null | tail -5
