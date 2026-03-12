import { create } from 'zustand'
import { issuesApi } from './api'
import type { Issue } from '../../../server/src/types'

interface AppState {
  issues: Issue[]
  selectedIssue: Issue | null
  isLoading: boolean
  error: string | null
  showIssueModal: boolean
  showCreateModal: boolean

  loadIssues: () => Promise<void>
  updateIssueStatus: (issueId: string, newStatus: string) => Promise<void>
  selectIssue: (issue: Issue | null) => void
  createIssue: (title: string, description: string) => Promise<void>
  addComment: (issueId: string, comment: string) => Promise<void>
  toggleIssueModal: () => void
  toggleCreateModal: () => void
}

export const useStore = create<AppState>((set, get) => ({
  issues: [],
  selectedIssue: null,
  isLoading: false,
  error: null,
  showIssueModal: false,
  showCreateModal: false,

  loadIssues: async () => {
    set({ isLoading: true, error: null })
    try {
      const issues = await issuesApi.getAll()
      set({ issues, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load issues',
        isLoading: false
      })
    }
  },

  updateIssueStatus: async (issueId, newStatus) => {
    const { issues } = get()
    try {
      // Optimistic update
      set({
        issues: issues.map(issue =>
          issue.id === issueId ? { ...issue, status: newStatus as any } : issue
        )
      })

      await issuesApi.update(issueId, { status: newStatus })
    } catch (error) {
      set({ error: 'Failed to update issue status' })
      get().loadIssues()
    }
  },

  selectIssue: (issue) => {
    set({ selectedIssue: issue, showIssueModal: !!issue })
  },

  createIssue: async (title, description) => {
    try {
      await issuesApi.create({ title, description, status: 'backlog' })
      set({ showCreateModal: false })
      await get().loadIssues()
    } catch (error) {
      set({ error: 'Failed to create issue' })
    }
  },

  addComment: async (issueId, comment) => {
    try {
      await issuesApi.addComment(issueId, comment)
      const issue = await issuesApi.getOne(issueId)
      set({ selectedIssue: issue })
    } catch (error) {
      set({ error: 'Failed to add comment' })
    }
  },

  toggleIssueModal: () => set((state) => ({ showIssueModal: !state.showIssueModal })),
  toggleCreateModal: () => set((state) => ({ showCreateModal: !state.showCreateModal }))
}))
