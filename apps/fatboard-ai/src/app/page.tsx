'use client'

import { useEffect } from 'react'
import { Board } from '@/components/Board'
import { Header } from '@/components/Header'
import { SettingsModal } from '@/components/SettingsModal'
import { IssueModal } from '@/components/IssueModal'
import { CreateIssueModal } from '@/components/CreateIssueModal'
import { useStore } from '@/lib/store'

export default function Home() {
  const initDemo = useStore(state => state.initDemo)

  useEffect(() => {
    // Initialize with demo data
    initDemo()
  }, [initDemo])

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <Board />
      <SettingsModal />
      <IssueModal />
      <CreateIssueModal />
    </main>
  )
}
