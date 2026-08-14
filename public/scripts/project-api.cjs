/**
 * 项目数据存储API
 * 提供项目的保存、加载、列表、删除功能
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

// 确保目录存在
if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

/**
 * 保存项目
 */
function saveProject(data) {
    const projectId = data.id || `proj_${Date.now()}`;
    const filename = `${projectId}.json`;
    const filepath = path.join(PROJECTS_DIR, filename);
    
    data.updatedAt = new Date().toISOString();
    if (!data.createdAt) {
        data.createdAt = data.updatedAt;
    }
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    
    return { success: true, projectId, message: '项目保存成功' };
}

/**
 * 加载项目
 */
function loadProject(projectId) {
    const filepath = path.join(PROJECTS_DIR, `${projectId}.json`);
    
    if (fs.existsSync(filepath)) {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        return { success: true, project: data };
    } else {
        return { success: false, error: '项目不存在' };
    }
}

/**
 * 项目列表
 */
function listProjects() {
    const files = fs.readdirSync(PROJECTS_DIR);
    const projects = files
        .filter(f => f.endsWith('.json'))
        .map(f => {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf8'));
                return {
                    id: data.id,
                    name: data.name || data.companyName || '未命名项目',
                    companyName: data.companyName,
                    shortName: data.shortName,
                    industry: data.industry,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                };
            } catch (e) {
                return null;
            }
        })
        .filter(p => p !== null)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    return { success: true, projects };
}

/**
 * 删除项目
 */
function deleteProject(projectId) {
    const filepath = path.join(PROJECTS_DIR, `${projectId}.json`);
    
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return { success: true, message: '项目删除成功' };
    } else {
        return { success: false, error: '项目不存在' };
    }
}

module.exports = {
    saveProject,
    loadProject,
    listProjects,
    deleteProject,
    PROJECTS_DIR
};
