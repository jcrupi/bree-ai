import { useEffect } from 'react'
import { Board } from './components/Board'
import { Header } from './components/Header'
import { IssueModal } from './components/IssueModal'
import { CreateIssueModal } from './components/CreateIssueModal'
import { useStore } from './lib/store'

export default function App() {
  const loadIssues = useStore(state => state.loadIssues)

  useEffect(() => {
    loadIssues()
  }, [loadIssues])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <Board />
      <IssueModal />
      <CreateIssueModal />
    </div>
  )
}
