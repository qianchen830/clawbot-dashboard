// 补充缺失的JavaScript函数

function loadIndustryMetrics() {
    const industry = document.getElementById('metricsIndustry').value;
    const module = document.getElementById('metricsModule').value;
    const container = document.getElementById('metrics-container');
    
    let html = '<div class="metrics-grid">';
    let hasMetrics = false;
    
    if (industry && metricsDatabase[industry]) {
        const modules = module ? [module] : Object.keys(metricsDatabase[industry]);
        modules.forEach(mod => {
            if (metricsDatabase[industry][mod]) {
                hasMetrics = true;
                html += `<div class="metric-card"><h5>${moduleNames[mod] || mod}</h5>`;
                metricsDatabase[industry][mod].forEach(metric => {
                    html += `
                        <p><strong>${metric.name}</strong></p>
                        <p>基准值: ${metric.baseline} → 目标值: ${metric.target}</p>
                        <p>预期提升: <span style="color: #2e7d32; font-weight: bold;">${metric.improvement}</span></p>
                        <div class="formula">${metric.formula}</div>
                    `;
                });
                html += '</div>';
            }
        });
    }
    
    if (!hasMetrics) {
        html += '<p style="color: #666; padding: 20px;">请选择行业查看相关价值指标</p>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function loadModuleMetrics() {
    loadIndustryMetrics();
}

function calculateValue() {
    if (!customerData.companyName) {
        showStatus('error', '❌ 请先保存客户信息！');
        return;
    }
    
    const tbody = document.getElementById('value-tbody');
    tbody.innerHTML = '';
    
    const industry = customerData.industry || 'manufacturing';
    const metrics = metricsDatabase[industry] || metricsDatabase.manufacturing;
    const budget = parseFloat(customerData.budget) || 100;
    
    let totalSavings = 0;
    const rows = [];
    
    Object.keys(metrics).forEach(mod => {
        if (customerData.modules?.includes(mod) || customerData.modules?.length === 0) {
            metrics[mod].forEach(metric => {
                const savings = budget * (Math.random() * 0.1 + 0.05);
                totalSavings += savings;
                rows.push({
                    type: moduleNames[mod] || mod,
                    name: metric.name,
                    formula: metric.formula,
                    savings: savings.toFixed(2)
                });
            });
        }
    });
    
    rows.forEach(row => {
        tbody.innerHTML += `<tr><td>${row.type}</td><td>${row.name}</td><td>${row.formula}</td><td>预计节省 ${row.savings} 万元/年</td></tr>`;
    });
    
    const roi = ((totalSavings * 3) / budget * 100).toFixed(1);
    document.getElementById('roi-result').innerHTML = `
        <h4 style="color: #1a237e; margin-bottom: 15px;">💰 ROI投资回报分析</h4>
        <p><strong>项目投资：</strong>${budget} 万元</p>
        <p><strong>年度节省：</strong>${totalSavings.toFixed(2)} 万元/年</p>
        <p><strong>3年累计收益：</strong>${(totalSavings * 3).toFixed(2)} 万元</p>
        <p style="font-size: 20px; color: #2e7d32; margin-top: 15px;"><strong>投资回报率（ROI）：${roi}%</strong></p>
        <p style="color: #666; margin-top: 10px;">预计 ${(budget / totalSavings).toFixed(1)} 年收回投资</p>
    `;
    
    showStatus('success', '✅ 价值收益已计算！');
}

function exportMetrics() {
    const table = document.getElementById('value-table');
    const rows = Array.from(table.querySelectorAll('tr'));
    let csv = '价值类型,指标名称,计算方式,预估收益\n';
    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        csv += cells.map(c => c.textContent.replace(/,/g, '，')).join(',') + '\n';
    });
    
    const blob = new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `价值指标报告_${new Date().toLocaleDateString()}.csv`;
    a.click();
    showStatus('success', '✅ 指标报告已导出！');
}

function generateArchitecture() {
    if (!customerData.companyName) {
        showStatus('error', '❌ 请先保存客户信息！');
        return;
    }
    
    const output = generateArchitectureContent();
    document.getElementById('architecture-output').textContent = output;
    showStatus('success', '✅ 4A架构规划已生成！');
}

function generateArchitectureContent() {
    return `# ${customerData.companyName} 4A企业架构规划

## 一、业务架构 (Business Architecture)

### 1.1 价值流规划
**L1 端到端价值流：**
- 订单到现金 (Order to Cash)
- 采购到付款 (Procure to Pay)
- 计划到生产 (Plan to Produce)
- 招聘到退休 (Hire to Retire)

生成时间：${new Date().toLocaleString('zh-CN')}`;
}

function loadArchitectureTemplate() {
    const industry = customerData.industry || 'manufacturing';
    const templates = {
        manufacturing: {
            ba: '价值流：订单到现金 → 采购到付款 → 计划到生产',
            da: '主数据：客户、供应商、物料、BOM',
            aa: '应用系统：财务云、供应链云、制造云',
            ta: '基础设施：混合云架构'
        }
    };
    
    const template = templates[industry] || templates.manufacturing;
    document.getElementById('baContent').value = template.ba;
    document.getElementById('daContent').value = template.da;
    document.getElementById('aaContent').value = template.aa;
    document.getElementById('taContent').value = template.ta;
    
    showStatus('success', '✅ 行业模板已加载！');
}

function generatePresales() {
    if (!customerData.companyName) {
        showStatus('error', '❌ 请先保存客户信息！');
        return;
    }
    
    const output = generatePresalesContent();
    document.getElementById('presales-output').textContent = output;
    showStatus('success', '✅ 售前PPT已生成！');
}

function generatePresalesContent() {
    return `# ${customerData.companyName}金蝶云解决方案

## 一、企业概况
- 企业名称：${customerData.companyName}
- 所属行业：${industryNames[customerData.industry] || '未提供'}
- 企业规模：${sizeNames[customerData.companySize] || '未提供'}

生成时间：${new Date().toLocaleString('zh-CN')}`;
}

function generatePresalesHTML() {
    generatePresales();
    const content = document.getElementById('presales-output').textContent;
    
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${customerData.companyName}金蝶云解决方案</title>
    <style>
        body { font-family: sans-serif; max-width: 1200px; margin: 0 auto; padding: 40px; }
        h1 { color: #1a237e; }
    </style>
</head>
<body>
    <pre>${content}</pre>
</body>
</html>`;
    
    const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `售前PPT_${customerData.companyName}_${new Date().toLocaleDateString()}.html`;
    a.click();
    
    showStatus('success', '✅ 售前PPT(HTML)已导出！');
}

function generateSurvey() {
    if (!customerData.companyName) {
        showStatus('error', '❌ 请先保存客户信息！');
        return;
    }
    
    const output = `# ${customerData.companyName}调研报告

## 一、企业概况
- 企业名称：${customerData.companyName}
- 所属行业：${industryNames[customerData.industry] || '未提供'}

生成时间：${new Date().toLocaleString('zh-CN')}`;
    
    document.getElementById('survey-output').textContent = output;
    showStatus('success', '✅ 调研报告已生成！');
}

function generateBlueprint() {
    if (!customerData.companyName) {
        showStatus('error', '❌ 请先保存客户信息！');
        return;
    }
    
    const output = `# ${customerData.companyName}系统蓝图设计

## 一、项目概述
项目背景：${customerData.companyName}数字化转型

生成时间：${new Date().toLocaleString('zh-CN')}`;
    
    document.getElementById('blueprint-output').textContent = output;
    showStatus('success', '✅ 蓝图设计已生成！');
}

function copyOutput(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        showStatus('success', '✅ 已复制到剪贴板！');
    });
}

function downloadOutput(elementId, filename) {
    const text = document.getElementById(elementId).textContent;
    const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    showStatus('success', '✅ 文件已下载！');
}
