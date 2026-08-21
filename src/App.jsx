import Header from './components/Header'
import NavSidebar from './components/NavSidebar'
import Welcome from './components/Welcome'
import QuickAccess from './components/QuickAccess'
import AIToolBox from './components/AIToolBox'
import KnowledgeCenter from './components/KnowledgeCenter'
import GitManager from './components/GitManager'
import ProjectHub from './components/ProjectHub'
import DataCenter from './components/DataCenter'
import SkillLibrary from './components/SkillLibrary'
import DeliveryCockpit from './components/DeliveryCockpit'
import StatusBar from './components/StatusBar'
import FleetCluster from './components/FleetCluster'
import TokenUsage from './components/TokenUsage'
import PresaleKanban from './components/PresaleKanban'
import Toast from './components/Toast'
import { useState, useEffect } from 'react'
import './App.css'

function showToast(msg) {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.style.transform = 'translateX(-50%) translateY(0)'
  setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(100px)' }, 3000)
}

export default function App() {
  const [view, setView] = useState('home')

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        showToast('搜索功能开发中...')
      }
      if (e.detail?.view) {
        setView(e.detail.view)
      }
    }
    document.addEventListener('keydown', handler)
    window.addEventListener('nav', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      window.removeEventListener('nav', handler)
    }
  }, [])

  const renderView = () => {
    switch (view) {
      case 'knowledge':
        return <KnowledgeCenter />
      case 'git':
        return <GitManager />
      case 'data':
        return <DataCenter />
      case 'skills':
        return <SkillLibrary />
      case 'fleet':
        return <FleetCluster />
      case 'token':
        return <TokenUsage />
      case 'delivery':
        return <DeliveryCockpit />
      case 'projects':
        return <ProjectHub />
      case 'presale':
        return <PresaleKanban />
      case 'home':
      default:
        return (
          <>
            <Welcome />
            <QuickAccess onNavigate={setView} />
            <AIToolBox />
            <StatusBar />
          </>
        )
    }
  }

  return (
    <>
      <Header />
      <div className="main">
        <NavSidebar currentView={view} onNavigate={setView} />
        <div className="content">
          {renderView()}
        </div>
      </div>
      <Toast />
    </>
  )
}
