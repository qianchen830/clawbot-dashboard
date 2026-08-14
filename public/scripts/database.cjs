/**
 * 金蝶交付系统数据库模块
 * 使用SQLite存储项目信息、调研数据、开发需求等
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'kingdee-delivery.db');

// 确保data目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('✅ 数据库连接成功:', DB_PATH);
        initTables();
    }
});

/**
 * 初始化数据库表
 */
function initTables() {
    // 项目信息表
    db.run(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            project_code TEXT UNIQUE,
            company_name TEXT NOT NULL,
            short_name TEXT,
            industry TEXT,
            company_size TEXT,
            revenue REAL,
            employees INTEGER,
            budget REAL,
            user_count INTEGER,
            expected_date TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 项目模块表
    db.run(`
        CREATE TABLE IF NOT EXISTS project_modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            module_code TEXT NOT NULL,
            module_name TEXT NOT NULL,
            is_selected INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    `);

    // 业务需求表
    db.run(`
        CREATE TABLE IF NOT EXISTS business_needs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            module_code TEXT NOT NULL,
            needs TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    `);

    // 调研数据表
    db.run(`
        CREATE TABLE IF NOT EXISTS survey_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            survey_type TEXT NOT NULL,
            module_code TEXT,
            question_id TEXT,
            question TEXT,
            answer TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    `);

    // 开发需求表
    db.run(`
        CREATE TABLE IF NOT EXISTS dev_requirements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            req_code TEXT UNIQUE,
            req_name TEXT NOT NULL,
            req_type TEXT,
            module_code TEXT,
            priority TEXT DEFAULT 'medium',
            description TEXT,
            status TEXT DEFAULT 'pending',
            estimated_hours REAL,
            actual_hours REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    `);

    // 集成需求表
    db.run(`
        CREATE TABLE IF NOT EXISTS integration_requirements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            integration_code TEXT UNIQUE,
            system_name TEXT NOT NULL,
            integration_type TEXT,
            data_flow TEXT,
            interface_type TEXT,
            frequency TEXT,
            description TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    `);

    // 文档记录表
    db.run(`
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            doc_type TEXT NOT NULL,
            doc_name TEXT NOT NULL,
            doc_code TEXT,
            version TEXT DEFAULT 'V1.0',
            file_path TEXT,
            file_size INTEGER,
            status TEXT DEFAULT 'generated',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    `);

    // 操作日志表
    db.run(`
        CREATE TABLE IF NOT EXISTS operation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT,
            operation TEXT NOT NULL,
            details TEXT,
            operator TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    `);

    console.log('✅ 数据库表初始化完成');
}

// ==================== 项目相关操作 ====================

/**
 * 保存项目
 */
function saveProject(data) {
    return new Promise((resolve, reject) => {
        const projectId = data.id || `proj_${Date.now()}`;
        const projectCode = data.projectCode || data.short_name || `PRJ${Date.now()}`;

        // 检查项目是否存在
        db.get('SELECT id FROM projects WHERE id = ?', [projectId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (row) {
                // 更新项目
                db.run(`
                    UPDATE projects SET
                        project_code = ?,
                        company_name = ?,
                        short_name = ?,
                        industry = ?,
                        company_size = ?,
                        revenue = ?,
                        employees = ?,
                        budget = ?,
                        user_count = ?,
                        expected_date = ?,
                        status = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [
                    projectCode,
                    data.companyName || data.company_name,
                    data.shortName || data.short_name,
                    data.industry,
                    data.companySize || data.company_size,
                    data.revenue,
                    data.employees,
                    data.budget,
                    data.userCount || data.user_count,
                    data.expectedDate || data.expected_date,
                    data.status || 'active',
                    projectId
                ], (err) => {
                    if (err) reject(err);
                    else {
                        // 保存模块
                        if (data.modules) {
                            saveProjectModules(projectId, data.modules);
                        }
                        // 保存业务需求
                        if (data.businessNeeds) {
                            saveBusinessNeeds(projectId, data.businessNeeds);
                        }
                        // 记录日志
                        logOperation(projectId, 'update', '更新项目信息');
                        resolve({ success: true, projectId, message: '项目更新成功' });
                    }
                });
            } else {
                // 创建新项目
                db.run(`
                    INSERT INTO projects (
                        id, project_code, company_name, short_name, industry,
                        company_size, revenue, employees, budget, user_count,
                        expected_date, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    projectId,
                    projectCode,
                    data.companyName || data.company_name,
                    data.shortName || data.short_name,
                    data.industry,
                    data.companySize || data.company_size,
                    data.revenue,
                    data.employees,
                    data.budget,
                    data.userCount || data.user_count,
                    data.expectedDate || data.expected_date,
                    data.status || 'active'
                ], (err) => {
                    if (err) reject(err);
                    else {
                        // 保存模块
                        if (data.modules) {
                            saveProjectModules(projectId, data.modules);
                        }
                        // 保存业务需求
                        if (data.businessNeeds) {
                            saveBusinessNeeds(projectId, data.businessNeeds);
                        }
                        // 记录日志
                        logOperation(projectId, 'create', '创建项目');
                        resolve({ success: true, projectId, message: '项目创建成功' });
                    }
                });
            }
        });
    });
}

/**
 * 获取项目
 */
function getProject(projectId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
            if (err) reject(err);
            else if (!project) resolve({ success: false, error: '项目不存在' });
            else {
                // 获取模块
                db.all('SELECT * FROM project_modules WHERE project_id = ?', [projectId], (err, modules) => {
                    if (err) reject(err);
                    else {
                        // 获取业务需求
                        db.all('SELECT * FROM business_needs WHERE project_id = ?', [projectId], (err, needs) => {
                            if (err) reject(err);
                            else {
                                resolve({
                                    success: true,
                                    project: {
                                        ...project,
                                        modules: modules,
                                        businessNeeds: needs
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
}

/**
 * 项目列表
 */
function listProjects(filters = {}) {
    return new Promise((resolve, reject) => {
        let sql = 'SELECT * FROM projects WHERE 1=1';
        let params = [];

        if (filters.status) {
            sql += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters.industry) {
            sql += ' AND industry = ?';
            params.push(filters.industry);
        }

        sql += ' ORDER BY updated_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
        }

        db.all(sql, params, (err, projects) => {
            if (err) reject(err);
            else resolve({ success: true, projects });
        });
    });
}

/**
 * 删除项目
 */
function deleteProject(projectId) {
    return new Promise((resolve, reject) => {
        // 删除关联数据
        db.run('DELETE FROM project_modules WHERE project_id = ?', [projectId]);
        db.run('DELETE FROM business_needs WHERE project_id = ?', [projectId]);
        db.run('DELETE FROM survey_data WHERE project_id = ?', [projectId]);
        db.run('DELETE FROM dev_requirements WHERE project_id = ?', [projectId]);
        db.run('DELETE FROM integration_requirements WHERE project_id = ?', [projectId]);
        db.run('DELETE FROM documents WHERE project_id = ?', [projectId]);

        // 删除项目
        db.run('DELETE FROM projects WHERE id = ?', [projectId], function(err) {
            if (err) reject(err);
            else if (this.changes === 0) resolve({ success: false, error: '项目不存在' });
            else {
                logOperation(projectId, 'delete', '删除项目');
                resolve({ success: true, message: '项目删除成功' });
            }
        });
    });
}

/**
 * 保存项目模块
 */
function saveProjectModules(projectId, modules) {
    // 先删除旧模块
    db.run('DELETE FROM project_modules WHERE project_id = ?', [projectId]);

    // 插入新模块
    const stmt = db.prepare(`
        INSERT INTO project_modules (project_id, module_code, module_name, is_selected)
        VALUES (?, ?, ?, ?)
    `);

    modules.forEach(module => {
        stmt.run(projectId, module.code || module, module.name || module, module.selected ? 1 : 0);
    });

    stmt.finalize();
}

/**
 * 保存业务需求
 */
function saveBusinessNeeds(projectId, needs) {
    // 先删除旧需求
    db.run('DELETE FROM business_needs WHERE project_id = ?', [projectId]);

    // 插入新需求
    const stmt = db.prepare(`
        INSERT INTO business_needs (project_id, module_code, needs)
        VALUES (?, ?, ?)
    `);

    Object.keys(needs).forEach(moduleCode => {
        stmt.run(projectId, moduleCode, needs[moduleCode]);
    });

    stmt.finalize();
}

// ==================== 调研数据相关操作 ====================

/**
 * 保存调研数据
 */
function saveSurveyData(projectId, surveyType, data) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO survey_data (project_id, survey_type, module_code, question_id, question, answer, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        data.forEach(item => {
            stmt.run(
                projectId,
                surveyType,
                item.moduleCode,
                item.questionId,
                item.question,
                item.answer,
                item.notes
            );
        });

        stmt.finalize((err) => {
            if (err) reject(err);
            else {
                logOperation(projectId, 'survey', `保存${surveyType}调研数据`);
                resolve({ success: true, message: '调研数据保存成功' });
            }
        });
    });
}

/**
 * 获取调研数据
 */
function getSurveyData(projectId, surveyType = null) {
    return new Promise((resolve, reject) => {
        let sql = 'SELECT * FROM survey_data WHERE project_id = ?';
        let params = [projectId];

        if (surveyType) {
            sql += ' AND survey_type = ?';
            params.push(surveyType);
        }

        sql += ' ORDER BY created_at';

        db.all(sql, params, (err, data) => {
            if (err) reject(err);
            else resolve({ success: true, data });
        });
    });
}

// ==================== 开发需求相关操作 ====================

/**
 * 保存开发需求
 */
function saveDevRequirement(projectId, data) {
    return new Promise((resolve, reject) => {
        const reqCode = data.reqCode || `DEV${Date.now()}`;

        db.run(`
            INSERT INTO dev_requirements (
                project_id, req_code, req_name, req_type, module_code,
                priority, description, status, estimated_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            projectId,
            reqCode,
            data.reqName || data.req_name,
            data.reqType || data.req_type,
            data.moduleCode || data.module_code,
            data.priority || 'medium',
            data.description,
            data.status || 'pending',
            data.estimatedHours || data.estimated_hours
        ], function(err) {
            if (err) reject(err);
            else {
                logOperation(projectId, 'dev_req', `创建开发需求: ${reqCode}`);
                resolve({ success: true, reqId: this.lastID, reqCode, message: '开发需求保存成功' });
            }
        });
    });
}

/**
 * 获取开发需求列表
 */
function getDevRequirements(projectId) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM dev_requirements WHERE project_id = ? ORDER BY created_at', [projectId], (err, data) => {
            if (err) reject(err);
            else resolve({ success: true, data });
        });
    });
}

// ==================== 集成需求相关操作 ====================

/**
 * 保存集成需求
 */
function saveIntegrationRequirement(projectId, data) {
    return new Promise((resolve, reject) => {
        const integrationCode = data.integrationCode || `INT${Date.now()}`;

        db.run(`
            INSERT INTO integration_requirements (
                project_id, integration_code, system_name, integration_type,
                data_flow, interface_type, frequency, description, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            projectId,
            integrationCode,
            data.systemName || data.system_name,
            data.integrationType || data.integration_type,
            data.dataFlow || data.data_flow,
            data.interfaceType || data.interface_type,
            data.frequency,
            data.description,
            data.status || 'pending'
        ], function(err) {
            if (err) reject(err);
            else {
                logOperation(projectId, 'integration_req', `创建集成需求: ${integrationCode}`);
                resolve({ success: true, intId: this.lastID, integrationCode, message: '集成需求保存成功' });
            }
        });
    });
}

/**
 * 获取集成需求列表
 */
function getIntegrationRequirements(projectId) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM integration_requirements WHERE project_id = ? ORDER BY created_at', [projectId], (err, data) => {
            if (err) reject(err);
            else resolve({ success: true, data });
        });
    });
}

// ==================== 文档相关操作 ====================

/**
 * 保存文档记录
 */
function saveDocument(projectId, docType, docName, filePath, fileSize, docCode = null) {
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO documents (project_id, doc_type, doc_name, doc_code, file_path, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [projectId, docType, docName, docCode, filePath, fileSize], function(err) {
            if (err) reject(err);
            else {
                logOperation(projectId, 'document', `生成文档: ${docName}`);
                resolve({ success: true, docId: this.lastID, message: '文档记录保存成功' });
            }
        });
    });
}

/**
 * 获取文档列表
 */
function getDocuments(projectId, docType = null) {
    return new Promise((resolve, reject) => {
        let sql = 'SELECT * FROM documents WHERE project_id = ?';
        let params = [projectId];

        if (docType) {
            sql += ' AND doc_type = ?';
            params.push(docType);
        }

        sql += ' ORDER BY created_at DESC';

        db.all(sql, params, (err, data) => {
            if (err) reject(err);
            else resolve({ success: true, data });
        });
    });
}

// ==================== 日志相关操作 ====================

/**
 * 记录操作日志
 */
function logOperation(projectId, operation, details, operator = 'system') {
    db.run(`
        INSERT INTO operation_logs (project_id, operation, details, operator)
        VALUES (?, ?, ?, ?)
    `, [projectId, operation, details, operator]);
}

/**
 * 获取操作日志
 */
function getOperationLogs(projectId, limit = 100) {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT * FROM operation_logs
            WHERE project_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `, [projectId, limit], (err, data) => {
            if (err) reject(err);
            else resolve({ success: true, data });
        });
    });
}

// ==================== 统计相关操作 ====================

/**
 * 获取项目统计
 */
function getProjectStats(projectId) {
    return new Promise((resolve, reject) => {
        const stats = {};

        // 获取项目基本信息
        db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
            if (err) reject(err);
            else {
                stats.project = project;

                // 获取模块数量
                db.get('SELECT COUNT(*) as count FROM project_modules WHERE project_id = ? AND is_selected = 1', [projectId], (err, result) => {
                    if (err) reject(err);
                    else {
                        stats.moduleCount = result.count;

                        // 获取需求数量
                        db.get('SELECT COUNT(*) as count FROM dev_requirements WHERE project_id = ?', [projectId], (err, result) => {
                            if (err) reject(err);
                            else {
                                stats.devReqCount = result.count;

                                // 获取集成数量
                                db.get('SELECT COUNT(*) as count FROM integration_requirements WHERE project_id = ?', [projectId], (err, result) => {
                                    if (err) reject(err);
                                    else {
                                        stats.intReqCount = result.count;

                                        // 获取文档数量
                                        db.get('SELECT COUNT(*) as count FROM documents WHERE project_id = ?', [projectId], (err, result) => {
                                            if (err) reject(err);
                                            else {
                                                stats.docCount = result.count;
                                                resolve({ success: true, stats });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
}

/**
 * 关闭数据库连接
 */
function closeDatabase() {
    db.close((err) => {
        if (err) console.error('关闭数据库失败:', err.message);
        else console.log('数据库连接已关闭');
    });
}

module.exports = {
    // 项目相关
    saveProject,
    getProject,
    listProjects,
    deleteProject,
    saveProjectModules,
    saveBusinessNeeds,

    // 调研相关
    saveSurveyData,
    getSurveyData,

    // 开发需求相关
    saveDevRequirement,
    getDevRequirements,

    // 集成需求相关
    saveIntegrationRequirement,
    getIntegrationRequirements,

    // 文档相关
    saveDocument,
    getDocuments,

    // 日志相关
    logOperation,
    getOperationLogs,

    // 统计相关
    getProjectStats,

    // 数据库连接
    db,
    closeDatabase,
    DB_PATH
};
