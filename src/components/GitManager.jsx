import { useState, useEffect, useCallback } from 'react'
import { GitBranch, GitCommit, RefreshCw, RotateCcw, Clock, FolderGit2, AlertTriangle, CheckCircle2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import './GitManager.css'

const API_BASE = ''
const PAGE_SIZE = 15

const REPO_COLORS = {
  'clawbot-dashboard': '#00e5ff',
  'kingdee-web': '#f59e0b',
  'bridge': '#a78bfa',
  'fleet-controller': '#10b981',
}

function getColor(name, path) {
  for (const [key, color] of Object.entries(REPO_COLORS)) {
    if (path.includes(key) || (name || '').toLowerCase().includes(key)) return color
  }
  return '#00e5ff'
}

export default function GitManager() {
  const [repos, setRepos] = useState([])
  const [selected, setSelected] = useState(null)
  const [commits, setCommits] = useState([])
  const [changes, setChanges] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [rollingBack, setRollingBack] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const loadRepos = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE}/api/git/repos`)
      const data = await resp.json()
      setRepos(data)
      if (data.length > 0 && !selected) setSelected(data[0].path)
    } catch { setRepos([]) }
    setLoading(false)
  }, [selected])

  const loadHistory = useCallback(async (repoPath) => {
    if (!repoPath) return
    setHistoryLoading(true)
    setPage(1)
    try {
      const [logResp, statusResp] = await Promise.all([
        fetch(`${API_BASE}/api/git/log?path=${encodeURIComponent(repoPath)}`),
        fetch(`${API_BASE}/api/git/status?path=${encodeURIComponent(repoPath)}`),
      ])
      const [logData, statusData] = await Promise.all([logResp.json(), statusResp.json()])
      setCommits(logData.commits || [])
      setChanges(statusData.changes || [])
    } catch { setCommits([]); setChanges([]) }
    setHistoryLoading(false)
  }, [])

  useEffect(() => { loadRepos() }, [loadRepos])
  useEffect(() => { if (selected) loadHistory(selected) }, [selected, loadHistory])

  const handleRollback = async (hash, msg) => {
    if (!confirm(`确认回滚到提交:\n\n${hash.slice(0, 7)}: ${msg}\n\n这会执行 git reset --hard ${hash.slice(0, 7)}，工作区未提交的改动将丢失。`)) return
    setRollingBack(hash)
    try {
      const resp = await fetch(`${API_BASE}/api/git/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selected, hash }),
      })
      const data = await resp.json()
      if (data.ok) {
        alert('✅ 已回滚，前端服务可能需要重新构建才能生效')
        loadHistory(selected)
        loadRepos()
      } else {
        alert(`❌ 回滚失败: ${data.error}`)
      }
    } catch (e) { alert(`❌ 请求失败: ${e.message}`) }
    setRollingBack(null)
  }

  const handleCommit = async () => {
    const msg = prompt('提交信息：', 'update: 更新')
    if (!msg) return
    try {
      const resp = await fetch(`${API_BASE}/api/git/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selected, message: msg }),
      })
      const data = await resp.json()
      if (data.ok) {
        alert('✅ 提交成功')
        loadHistory(selected)
        loadRepos()
      } else {
        alert(`❌ 提交失败: ${data.error}`)
      }
    } catch (e) { alert(`❌ 请求失败: ${e.message}`) }
  }

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash)
    const t = document.getElementById('toast')
    if (t) { t.textContent = `Hash ${hash.slice(0, 7)} 已复制`; t.style.transform = 'translateX(-50%) translateY(0)'; setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(100px)' }, 2000) }
  }

  // Filter repos by search
  const filteredRepos = search.trim()
    ? repos.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.path.toLowerCase().includes(search.toLowerCase()))
    : repos

  // Pagination
  const totalPages = Math.max(1, Math.ceil(commits.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedCommits = commits.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalCommits = repos.reduce((s, r) => s + (r.commit_count || 0), 0)
  const dirtyCount = repos.filter(r => r.dirty).length
  const selectedRepo = repos.find(r => r.path === selected)

  return (
    <div className="git-manager">
      {/* Header */}
      <div className="gm-header">
        <div className="gm-header-left">
          <GitBranch size={22} color="#00e5ff" />
          <h2 className="gm-title">Git 版本管理</h2>
          <div className="gm-pills">
            <span className="gm-pill total">{repos.length} 仓库</span>
            {dirtyCount > 0 ? (
              <span className="gm-pill dirty"><span className="pill-dot" />{dirtyCount} 有改动</span>
            ) : (
              <span className="gm-pill clean"><CheckCircle2 size={11} />全部干净</span>
            )}
            <span className="gm-pill total" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.2)' }}>
              {totalCommits} 提交
            </span>
          </div>
        </div>
        <button className="fc-btn" onClick={() => { loadRepos(); if (selected) loadHistory(selected) }} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> 刷新
        </button>
      </div>

      {/* Split layout */}
      <div className="gm-split">
        {/* Left: repo list */}
        <div className="gm-sidebar">
          <div className="gm-sidebar-header">
            <span>项目列表</span>
            <span>{filteredRepos.length}/{repos.length}</span>
          </div>
          <div className="gm-sidebar-search">
            <Search size={13} />
            <input
              type="text"
              placeholder="搜索项目..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="repo-list">
            {loading ? (
              <div className="gm-loading" style={{ padding: '24px' }}><span className="gm-spinner" />加载中...</div>
            ) : filteredRepos.length === 0 ? (
              <div className="gm-empty" style={{ padding: '24px' }}>未找到项目</div>
            ) : (
              filteredRepos.map(repo => {
                const color = getColor(repo.name, repo.path)
                return (
                  <div
                    key={repo.path}
                    className={`repo-item ${selected === repo.path ? 'active' : ''}`}
                    style={{ '--repo-color': color }}
                    onClick={() => setSelected(repo.path)}
                  >
                    <span className={`repo-item-dot ${repo.dirty ? 'dirty' : 'clean'}`} />
                    <div className="repo-item-info">
                      <div className="repo-item-name">{repo.name}</div>
                      <div className="repo-item-meta">
                        <span className="repo-item-branch">{repo.branch}</span>
                        <span>{repo.commit_count} 提交</span>
                      </div>
                      {repo.description && (
                        <div className="repo-item-desc">{repo.description}</div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right: commit history */}
        <div className="gm-history-panel">
          <div className="gm-history-header">
            <div className="gm-history-title">
              <FolderGit2 size={15} color="#888" />
              {selectedRepo ? selectedRepo.name : '选择项目'}
              {selectedRepo && <span className="branch-tag">{selectedRepo.branch}</span>}
              {commits.length > 0 && <span style={{ fontSize: 12, color: '#666' }}>{commits.length} 条提交</span>}
            </div>
            <div className="gm-history-actions">
              {selectedRepo && (
                <>
                  <button className="fc-btn primary sm" onClick={handleCommit} disabled={changes.length === 0}>
                    <GitCommit size={12} /> 提交改动
                  </button>
                  <button className="fc-btn sm" onClick={() => loadHistory(selected)} disabled={historyLoading}>
                    <RefreshCw size={12} className={historyLoading ? 'spin' : ''} />
                  </button>
                </>
              )}
            </div>
          </div>

          {selectedRepo && changes.length > 0 && (
            <div className="gm-changes">
              <div className="gm-changes-title">
                <AlertTriangle size={13} />
                未提交的改动 ({changes.length} 个文件)
              </div>
              <div className="gm-changes-list">
                {changes.slice(0, 30).map((c, i) => (
                  <div key={i} className="gm-change-file">
                    <span className={`gm-change-letter ${c.status === 'M' ? 'M' : c.status === 'A' ? 'A' : c.status === 'D' ? 'D' : 'question'}`}>
                      {c.status}
                    </span>
                    {c.file}
                  </div>
                ))}
                {changes.length > 30 && <div>...还有 {changes.length - 30} 个文件</div>}
              </div>
            </div>
          )}

          <div className="commit-list">
            {!selectedRepo ? (
              <div className="gm-empty">
                <GitBranch size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div>请在左侧选择一个项目</div>
              </div>
            ) : historyLoading ? (
              <div className="gm-loading"><span className="gm-spinner" />加载提交历史...</div>
            ) : commits.length === 0 ? (
              <div className="gm-empty">暂无提交记录</div>
            ) : (
              pagedCommits.map((c, i) => {
                const isCurrent = (safePage - 1) * PAGE_SIZE + i === 0
                return (
                  <div key={c.hash} className="commit-row" style={isCurrent ? {} : {}}>
                    <span className="commit-hash" onClick={() => copyHash(c.hash)} title="点击复制完整 Hash">
                      {c.short_hash}
                    </span>
                    <span className="commit-msg" title={c.message}>{c.message}</span>
                    <span className="commit-date">
                      <Clock size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                      {c.date}
                    </span>
                    <div className="commit-actions">
                      {isCurrent ? (
                        <button className="rollback-btn current" disabled>
                          <CheckCircle2 size={11} /> 当前
                        </button>
                      ) : (
                        <button
                          className="rollback-btn"
                          onClick={() => handleRollback(c.hash, c.message)}
                          disabled={rollingBack === c.hash}
                        >
                          {rollingBack === c.hash ? (
                            <><RefreshCw size={11} className="spin" /> 回滚中</>
                          ) : (
                            <><RotateCcw size={11} /> 回滚</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {commits.length > PAGE_SIZE && (
            <div className="gm-pagination">
              <button className="page-btn" onClick={() => setPage(1)} disabled={safePage <= 1}>
                首页
              </button>
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={safePage <= 1}>
                <ChevronLeft size={14} />
              </button>
              <span className="page-info">
                第 {safePage}/{totalPages} 页 · 共 {commits.length} 条
              </span>
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={safePage >= totalPages}>
                <ChevronRight size={14} />
              </button>
              <button className="page-btn" onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}>
                末页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
