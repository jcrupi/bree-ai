// Global state management with Zustand

import { create } from 'zustand'
import type { Issue, ProviderType, IssueProvider, User } from '@/types'
import { DemoProvider } from '@/providers/demo'

interface AppState {
  // Provider
  provider: IssueProvider | null
  providerType: ProviderType
  isConnected: boolean

  // Issues
  issues: Issue[]
  selectedIssue: Issue | null
  isLoading: boolean
  error: string | null

  // UI state
  showSettings: boolean
  showIssueModal: boolean
  showCreateModal: boolean

  // Actions
  setProvider: (provider: IssueProvider, type: ProviderType) => void
  loadIssues: () => Promise<void>
  updateIssueStatus: (issueId: string, newStatus: Issue['status']) => Promise<void>
  selectIssue: (issue: Issue | null) => void
  createIssue: (title: string, description: string) => Promise<void>
  addComment: (issueId: string, comment: string) => Promise<void>

  // UI actions
  toggleSettings: () => void
  toggleIssueModal: () => void
  toggleCreateModal: () => void

  // Initialize with demo data
  initDemo: () => void
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  provider: null,
  providerType: 'demo',
  isConnected: false,
  issues: [],
  selectedIssue: null,
  isLoading: false,
  error: null,
  showSettings: false,
  showIssueModal: false,
  showCreateModal: false,

  setProvider: (provider, type) => {
    set({ provider, providerType: type, isConnected: true })
  },

  loadIssues: async () => {
    const { provider } = get()
    if (!provider) return

    set({ isLoading: true, error: null })

    try {
      const issues = await provider.listIssues()
      set({ issues, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load issues',
        isLoading: false
      })
    }
  },

  updateIssueStatus: async (issueId, newStatus) => {
    const { provider, issues } = get()
    if (!provider) return

    try {
      // Optimistic update
      set({
        issues: issues.map(issue =>
          issue.id === issueId ? { ...issue, status: newStatus } : issue
        )
      })

      // Update on server
      await provider.updateIssue(issueId, { status: newStatus })
    } catch (error) {
      // Revert on error
      set({ error: 'Failed to update issue status' })
      get().loadIssues() // Reload to get correct state
    }
  },

  selectIssue: (issue) => {
    set({ selectedIssue: issue, showIssueModal: !!issue })
  },

  createIssue: async (title, description) => {
    const { provider } = get()
    if (!provider) return

    try {
      await provider.createIssue({ title, description, status: 'backlog' })
      set({ showCreateModal: false })
      await get().loadIssues()
    } catch (error) {
      set({ error: 'Failed to create issue' })
    }
  },

  addComment: async (issueId, comment) => {
    const { provider } = get()
    if (!provider) return

    try {
      await provider.addComment(issueId, comment)
      // Reload the issue to get updated comments
      const issue = await provider.getIssue(issueId)
      set({ selectedIssue: issue })
    } catch (error) {
      set({ error: 'Failed to add comment' })
    }
  },

  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
  toggleIssueModal: () => set((state) => ({ showIssueModal: !state.showIssueModal })),
  toggleCreateModal: () => set((state) => ({ showCreateModal: !state.showCreateModal })),

  initDemo: () => {
    const demoProvider = new DemoProvider()
    set({
      provider: demoProvider,
      providerType: 'demo',
      isConnected: true
    })
    get().loadIssues()
  }
}))
